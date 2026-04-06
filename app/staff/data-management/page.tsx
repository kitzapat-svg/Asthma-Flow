"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Database, ArrowLeft, Calendar, Search, 
  FileUp, CheckCircle, XCircle, Clock, 
  ChevronRight, AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Patient, Visit } from '@/lib/types';
import { toBangkokDateString } from '@/lib/date-utils';
import { FadeContent } from '@/components/animated/fade-content';
import { ImportVisits } from './_components/ImportVisits';
import { MedicationManagement } from './_components/MedicationManagement';
import { Pill } from 'lucide-react';

type AttendanceStatus = 'On-time' | 'Early' | 'Late' | 'Missed' | 'Unknown';

interface AttendanceRecord {
  hn: string;
  name: string;
  appointmentDate: string;
  visitDate: string | null;
  status: AttendanceStatus;
  diffDays: number | null;
}

export default function DataManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toBangkokDateString(d);
  });
  const [endDate, setEndDate] = useState(() => toBangkokDateString(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState<'summary' | 'import' | 'meds'>('summary');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'Admin') {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push('/staff/patients');
      } else {
        fetchData();
      }
    }
  }, [status, router, session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPatients, resVisits] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits')
      ]);
      
      const pData = await resPatients.json();
      const vData = await resVisits.json();
      
      if (Array.isArray(pData)) setPatients(pData);
      if (Array.isArray(vData)) setVisits(vData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logic: Correlate Visits with Appointments
   * We look for 'next_appt' in a visit record and see if the patient actually came for that appointment.
   */
  const attendanceData = useMemo(() => {
    if (patients.length === 0 || visits.length === 0) return [];

    const records: AttendanceRecord[] = [];
    
    // Group visits by HN, sorted by date
    const visitsByHn: Record<string, Visit[]> = {};
    visits.forEach(v => {
      if (!visitsByHn[v.hn]) visitsByHn[v.hn] = [];
      visitsByHn[v.hn].push(v);
    });

    Object.keys(visitsByHn).forEach(hn => {
      const pVisits = visitsByHn[hn].sort((a, b) => {
        const dateA = a.visit_date ?? a.date ?? '';
        const dateB = b.visit_date ?? b.date ?? '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      const patient = patients.find(p => p.hn === hn);
      const name = patient ? `${patient.prefix}${patient.first_name} ${patient.last_name}` : `HN: ${hn}`;

      pVisits.forEach((visit, index) => {
        // If this visit has a next_appt, we want to know if they showed up for it
        if (visit.next_appt) {
          const apptDate = visit.next_appt;
          
          // Filter by date range (only show appointments within range)
          if (apptDate < startDate || apptDate > endDate) return;

          // Find the ACTUAL visit that responded to this appointment
          // It's usually the next visit for this patient
          const actualVisit = pVisits[index + 1];
          const visitDate = actualVisit ? (actualVisit.visit_date ?? actualVisit.date ?? null) : null;

          let status: AttendanceStatus = 'Unknown';
          let diffDays: number | null = null;

          if (visitDate) {
            const dAppt = new Date(apptDate);
            const dVisit = new Date(visitDate);
            dAppt.setHours(0,0,0,0);
            dVisit.setHours(0,0,0,0);
            
            diffDays = Math.round((dVisit.getTime() - dAppt.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) status = 'On-time';
            else if (diffDays < 0) status = 'Early';
            else status = 'Late';
          } else {
            // No visit after this appointment (so far)
            // Check if apptDate is in the past
            const now = new Date();
            now.setHours(0,0,0,0);
            const dAppt = new Date(apptDate);
            if (dAppt < now) {
              status = 'Missed';
            }
          }

          records.push({
            hn,
            name,
            appointmentDate: apptDate,
            visitDate,
            status,
            diffDays
          });
        }
      });
    });

    // Sort by Appointment Date (Latest first)
    return records
      .filter(r => 
        r.hn.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
  }, [patients, visits, startDate, endDate, searchTerm]);

  const stats = useMemo(() => {
    const total = attendanceData.length;
    const onTime = attendanceData.filter(r => r.status === 'On-time').length;
    const missed = attendanceData.filter(r => r.status === 'Missed').length;
    return {
      total,
      onTime,
      missed,
      rate: total > 0 ? Math.round((onTime / total) * 100) : 0
    };
  }, [attendanceData]);

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-muted-foreground">กำลังจัดเตรียมข้อมูล...</div>;

  return (
    <div className="space-y-6 pb-20 animate-fade-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-[#2D2A26] dark:text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#2D2A26] dark:text-white flex items-center gap-3">
              <Database className="text-[#D97736]" size={32} />
              Data Management
            </h1>
            <p className="text-muted-foreground">จัดการข้อมูลภาพรวมคลินิก (เฉพาะ Admin)</p>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800">
        <button 
          onClick={() => setCurrentTab('summary')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${currentTab === 'summary' ? 'text-[#D97736]' : 'text-muted-foreground hover:text-foreground'}`}
        >
          สรุปการมาตรวจ
          {currentTab === 'summary' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D97736]" />}
        </button>
        <button 
          onClick={() => setCurrentTab('import')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${currentTab === 'import' ? 'text-[#D97736]' : 'text-muted-foreground hover:text-foreground'}`}
        >
          นำเข้าข้อมูล (Import)
          {currentTab === 'import' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D97736]" />}
        </button>
        <button 
          onClick={() => setCurrentTab('meds')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${currentTab === 'meds' ? 'text-[#D97736]' : 'text-muted-foreground hover:text-foreground'}`}
        >
          จัดการรายการยา
          {currentTab === 'meds' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D97736]" />}
        </button>
      </div>

      {currentTab === 'summary' ? (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">นัดหมายทั้งหมด</p>
              <p className="text-3xl font-black">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-bold text-green-600 uppercase mb-1">มาตรงนัด</p>
              <p className="text-3xl font-black text-green-600">{stats.onTime}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
              <p className="text-xs font-bold text-rose-600 uppercase mb-1">ขาดนัด</p>
              <p className="text-3xl font-black text-rose-600">{stats.missed}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-sm">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1">ความสม่ำเสมอ</p>
              <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{stats.rate}%</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm font-bold text-muted-foreground shrink-0">ช่วงวันที่:</span>
              <input 
                type="date" 
                className="bg-gray-50 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="text-muted-foreground">-</span>
              <input 
                type="date" 
                className="bg-gray-50 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ HN..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-lg text-sm outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground">ผู้ป่วย</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground">วันนัดหมาย</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground">วันที่มาจริง</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground">สถานะ</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground">ส่วนต่าง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                  {attendanceData.map((record, i) => (
                    <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-bold">{record.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">HN: {record.hn}</div>
                      </td>
                      <td className="p-4 font-mono text-sm">{record.appointmentDate}</td>
                      <td className="p-4 font-mono text-sm">{record.visitDate || '-'}</td>
                      <td className="p-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="p-4 text-sm font-bold">
                        {record.diffDays !== null ? (
                          <span className={record.diffDays === 0 ? 'text-green-600' : record.diffDays > 0 ? 'text-rose-500' : 'text-blue-500'}>
                            {record.diffDays === 0 ? '✓ ตรงนัด' : `${record.diffDays > 0 ? '+' : ''}${record.diffDays} วัน`}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                  {attendanceData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center italic text-muted-foreground">ไม่พบข้อมูลนัดหมายในช่วงเวลานี้</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : currentTab === 'import' ? (
        <ImportVisits patients={patients} visits={visits} />
      ) : (
        <MedicationManagement />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'On-time':
      return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><CheckCircle size={10} /> On-time</span>;
    case 'Early':
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><Clock size={10} /> Early</span>;
    case 'Late':
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><AlertCircle size={10} /> Late</span>;
    case 'Missed':
      return <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><XCircle size={10} /> Missed</span>;
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase w-fit">Unknown</span>;
  }
}
