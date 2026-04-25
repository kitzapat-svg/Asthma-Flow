"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Database, ArrowLeft, Calendar, Search, 
  FileUp, CheckCircle, XCircle, Clock, 
  ChevronRight, AlertCircle, TrendingUp,
  Users, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Patient, Visit } from '@/lib/types';
import { toBangkokDateString } from '@/lib/date-utils';
import { FadeContent } from '@/components/animated/fade-content';
import { ImportVisits } from './_components/ImportVisits';
import { MedicationManagement } from './_components/MedicationManagement';
import { Pill } from 'lucide-react';

type AttendanceStatus = 'On-time' | 'Early' | 'Late' | 'Missed' | 'Walk-in' | 'Unknown';

interface AttendanceRecord {
  hn: string;
  name: string;
  appointmentDate: string;
  visitDate: string | null;
  status: AttendanceStatus;
  diffDays: number | null;
  isWalkIn?: boolean;
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
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'All'>('All');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'Admin') {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push('/staff/patients');
      } else {
        fetchData();
      }
    }
    // Only fetch data when status changes to authenticated
  }, [status, router]); 

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
   * Build all attendance records (unfiltered) — used for both stats and table.
   * 1. Standard flow: look at next_appt in visits and check if patient came
   * 2. Walk-in detection: find visits in the date range that don't match any appointment
   */
  const allRecords = useMemo(() => {
    if (patients.length === 0 || visits.length === 0) return [];

    const records: AttendanceRecord[] = [];
    
    // Group visits by HN, sorted by date
    const visitsByHn: Record<string, Visit[]> = {};
    visits.forEach(v => {
      if (!visitsByHn[v.hn]) visitsByHn[v.hn] = [];
      visitsByHn[v.hn].push(v);
    });

    // Track which visit dates are "accounted for" by an appointment
    const accountedVisits = new Set<string>();

    // --- Part 1: Build appointment-based records ---
    Object.keys(visitsByHn).forEach(hn => {
      const pVisits = visitsByHn[hn].sort((a, b) => {
        const dateA = a.visit_date ?? a.date ?? '';
        const dateB = b.visit_date ?? b.date ?? '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      const patient = patients.find(p => p.hn === hn);
      const name = patient ? `${patient.prefix}${patient.first_name} ${patient.last_name}` : `HN: ${hn}`;

      pVisits.forEach((visit, index) => {
        if (visit.next_appt) {
          const apptDate = visit.next_appt;
          
          // Filter by date range
          if (apptDate < startDate || apptDate > endDate) return;

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

            accountedVisits.add(`${hn}|${visitDate}`);
          } else {
            const now = new Date();
            now.setHours(0,0,0,0);
            const dAppt = new Date(apptDate);
            if (dAppt < now) {
              status = 'Missed';
            }
          }

          records.push({ hn, name, appointmentDate: apptDate, visitDate, status, diffDays, isWalkIn: false });
        }
      });
    });

    // --- Part 2: Detect Walk-in visits (visits not tied to any appointment) ---
    Object.keys(visitsByHn).forEach(hn => {
      const pVisits = visitsByHn[hn];
      const patient = patients.find(p => p.hn === hn);
      const name = patient ? `${patient.prefix}${patient.first_name} ${patient.last_name}` : `HN: ${hn}`;

      pVisits.forEach(visit => {
        const visitDate = visit.visit_date ?? visit.date ?? null;
        if (!visitDate) return;
        if (visitDate < startDate || visitDate > endDate) return;
        if (accountedVisits.has(`${hn}|${visitDate}`)) return;

        // Check if a previous visit's next_appt matches this visit date
        const hasMatchingAppt = pVisits.some(v => {
          const vDate = v.visit_date ?? v.date ?? '';
          return vDate !== visitDate && v.next_appt === visitDate;
        });

        if (!hasMatchingAppt) {
          records.push({ hn, name, appointmentDate: '-', visitDate, status: 'Walk-in', diffDays: null, isWalkIn: true });
        }
      });
    });

    return records;
  }, [patients, visits, startDate, endDate]);

  /** Filtered view for the table — applies search & status filter */
  const attendanceData = useMemo(() => {
    return allRecords
      .filter(r => 
        r.hn.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(r => statusFilter === 'All' || r.status === statusFilter)
      .sort((a, b) => {
        const dateA = a.isWalkIn ? (a.visitDate ?? '') : a.appointmentDate;
        const dateB = b.isWalkIn ? (b.visitDate ?? '') : b.appointmentDate;
        return dateB.localeCompare(dateA);
      });
  }, [allRecords, searchTerm, statusFilter]);

  /** Stats are always computed from unfiltered allRecords */
  const stats = useMemo(() => {
    const total = allRecords.length;
    const onTime = allRecords.filter(r => r.status === 'On-time').length;
    const early = allRecords.filter(r => r.status === 'Early').length;
    const late = allRecords.filter(r => r.status === 'Late').length;
    const missed = allRecords.filter(r => r.status === 'Missed').length;
    const walkIn = allRecords.filter(r => r.status === 'Walk-in').length;
    const totalVisited = onTime + early + late + walkIn;
    const totalScheduled = onTime + early + late + missed;
    const rate = totalScheduled > 0 ? Math.round(((onTime + early + late) / totalScheduled) * 100) : 0;
    
    return { total, onTime, early, late, missed, walkIn, totalVisited, totalScheduled, rate };
  }, [allRecords]);

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
          {/* Quick Stats - Enhanced with Walk-in & Total Visitors */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Visitors (highlighted) */}
            <button
              onClick={() => setStatusFilter('All')}
              className={`p-4 rounded-2xl border shadow-sm text-left transition-all hover:scale-[1.02] ${
                statusFilter === 'All'
                  ? 'bg-gradient-to-br from-[#D97736] to-[#E8944A] text-white border-[#D97736] ring-2 ring-[#D97736]/30'
                  : 'bg-gradient-to-br from-[#D97736]/10 to-[#E8944A]/10 border-[#D97736]/20 dark:from-[#D97736]/5 dark:to-[#E8944A]/5'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Users size={14} className={statusFilter === 'All' ? 'text-white/80' : 'text-[#D97736]'} />
                <p className={`text-[10px] font-black uppercase ${statusFilter === 'All' ? 'text-white/80' : 'text-[#D97736]'}`}>
                  มารับบริการทั้งหมด
                </p>
              </div>
              <p className={`text-3xl font-black ${statusFilter === 'All' ? 'text-white' : 'text-[#D97736]'}`}>
                {stats.totalVisited}
              </p>
            </button>

            {/* On-time */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'On-time' ? 'All' : 'On-time')}
              className={`p-4 rounded-2xl border shadow-sm text-left transition-all hover:scale-[1.02] ${
                statusFilter === 'On-time'
                  ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-600/30'
                  : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={14} className={statusFilter === 'On-time' ? 'text-white/80' : 'text-green-600'} />
                <p className={`text-[10px] font-black uppercase ${statusFilter === 'On-time' ? 'text-white/80' : 'text-green-600'}`}>
                  มาตรงนัด
                </p>
              </div>
              <p className={`text-3xl font-black ${statusFilter === 'On-time' ? 'text-white' : 'text-green-600'}`}>{stats.onTime}</p>
            </button>

            {/* Early */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Early' ? 'All' : 'Early')}
              className={`p-4 rounded-2xl border shadow-sm text-left transition-all hover:scale-[1.02] ${
                statusFilter === 'Early'
                  ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600/30'
                  : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={14} className={statusFilter === 'Early' ? 'text-white/80' : 'text-blue-600'} />
                <p className={`text-[10px] font-black uppercase ${statusFilter === 'Early' ? 'text-white/80' : 'text-blue-600'}`}>
                  มาก่อนนัด
                </p>
              </div>
              <p className={`text-3xl font-black ${statusFilter === 'Early' ? 'text-white' : 'text-blue-600'}`}>{stats.early}</p>
            </button>

            {/* Late */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Late' ? 'All' : 'Late')}
              className={`p-4 rounded-2xl border shadow-sm text-left transition-all hover:scale-[1.02] ${
                statusFilter === 'Late'
                  ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-600/30'
                  : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle size={14} className={statusFilter === 'Late' ? 'text-white/80' : 'text-orange-600'} />
                <p className={`text-[10px] font-black uppercase ${statusFilter === 'Late' ? 'text-white/80' : 'text-orange-600'}`}>
                  มาหลังนัด
                </p>
              </div>
              <p className={`text-3xl font-black ${statusFilter === 'Late' ? 'text-white' : 'text-orange-600'}`}>{stats.late}</p>
            </button>

            {/* Walk-in */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Walk-in' ? 'All' : 'Walk-in')}
              className={`p-4 rounded-2xl border shadow-sm text-left transition-all hover:scale-[1.02] ${
                statusFilter === 'Walk-in'
                  ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600/30'
                  : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <UserPlus size={14} className={statusFilter === 'Walk-in' ? 'text-white/80' : 'text-purple-600'} />
                <p className={`text-[10px] font-black uppercase ${statusFilter === 'Walk-in' ? 'text-white/80' : 'text-purple-600'}`}>
                  Walk-in
                </p>
              </div>
              <p className={`text-3xl font-black ${statusFilter === 'Walk-in' ? 'text-white' : 'text-purple-600'}`}>{stats.walkIn}</p>
            </button>

            {/* Missed */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Missed' ? 'All' : 'Missed')}
              className={`p-4 rounded-2xl border shadow-sm text-left transition-all hover:scale-[1.02] ${
                statusFilter === 'Missed'
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-600/30'
                  : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={14} className={statusFilter === 'Missed' ? 'text-white/80' : 'text-rose-600'} />
                <p className={`text-[10px] font-black uppercase ${statusFilter === 'Missed' ? 'text-white/80' : 'text-rose-600'}`}>
                  ขาดนัด
                </p>
              </div>
              <p className={`text-3xl font-black ${statusFilter === 'Missed' ? 'text-white' : 'text-rose-600'}`}>{stats.missed}</p>
            </button>
          </div>

          {/* Attendance Rate Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#D97736]" />
                <span className="text-sm font-bold text-muted-foreground">อัตราการมาตามนัด</span>
              </div>
              <span className="text-lg font-black text-[#D97736]">{stats.rate}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D97736] to-[#E8944A] transition-all duration-700"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-bold">
              <span>นัดหมาย {stats.totalScheduled} ครั้ง | มาตามนัด {stats.onTime + stats.early + stats.late} ครั้ง</span>
              <span>Walk-in เพิ่มเติม {stats.walkIn} ครั้ง</span>
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

          {/* Active Filter Indicator */}
          {statusFilter !== 'All' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">กำลังแสดง:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                statusFilter === 'On-time' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                statusFilter === 'Early' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                statusFilter === 'Late' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                statusFilter === 'Walk-in' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                statusFilter === 'Missed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                'bg-gray-100 text-gray-700'
              }`}>
                {statusFilter === 'On-time' ? 'มาตรงนัด' : 
                 statusFilter === 'Early' ? 'มาก่อนนัด' : 
                 statusFilter === 'Late' ? 'มาหลังนัด' : 
                 statusFilter === 'Walk-in' ? 'Walk-in' : 
                 statusFilter === 'Missed' ? 'ขาดนัด' : statusFilter}
                {' '}{attendanceData.length} รายการ
              </span>
              <button
                onClick={() => setStatusFilter('All')}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                ดูทั้งหมด
              </button>
            </div>
          )}

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
                    <tr 
                      key={i} 
                      className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                        record.isWalkIn ? 'bg-purple-50/50 dark:bg-purple-900/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {record.isWalkIn && (
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" title="Walk-in" />
                          )}
                          <div>
                            <div className="font-bold">{record.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">HN: {record.hn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">
                        {record.appointmentDate === '-' ? (
                          <span className="text-muted-foreground italic text-xs">ไม่มีนัด</span>
                        ) : (
                          record.appointmentDate
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">{record.visitDate || '-'}</td>
                      <td className="p-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="p-4 text-sm font-bold">
                        {record.isWalkIn ? (
                          <span className="text-purple-600 dark:text-purple-400 text-xs">Walk-in</span>
                        ) : record.diffDays !== null ? (
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
    case 'Walk-in':
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><UserPlus size={10} /> Walk-in</span>;
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase w-fit">Unknown</span>;
  }
}
