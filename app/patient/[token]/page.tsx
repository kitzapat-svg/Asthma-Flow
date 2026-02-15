"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, FileText, CheckCircle, AlertTriangle, XCircle, Clock, Pill, Printer, ChevronDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/theme-toggle'; // <--- เรียกใช้ปุ่มปรับธีม

import { ActionPlanPrint } from './_components/ActionPlanPrint';
import { Patient, Visit } from '@/lib/types';
import { blindName } from '@/lib/helpers';
import { Button } from '@/components/ui/button';



export default function PatientPublicPage() {
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ใช้ public API ที่กรองข้อมูลฝั่ง server (ไม่ดึงข้อมูลทุกคน)
        const res = await fetch(`/api/patient?token=${params.token}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        const foundPatient = data.patient;
        const visits: Visit[] = data.visits;

        if (foundPatient) {
          setPatient(foundPatient);

          if (visits.length > 0) {
            setLastVisit(visits[0]);

            const graphData = [...visits]
              .reverse()
              .map(v => ({
                date: new Date(v.date).toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                }),
                pefr: parseInt(v.pefr) || 0
              }));
            setVisitHistory(graphData);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.token]);

  // --- Helpers ---
  const getStatusColor = (level: string) => {
    if (level === 'Well-controlled') return 'bg-green-500 text-white dark:bg-green-600';
    if (level === 'Partly Controlled') return 'bg-yellow-500 text-white dark:bg-yellow-600';
    return 'bg-red-500 text-white dark:bg-red-600';
  };

  const getStatusIcon = (level: string) => {
    if (level === 'Well-controlled') return <CheckCircle size={32} />;
    if (level === 'Partly Controlled') return <AlertTriangle size={32} />;
    return <XCircle size={32} />;
  };

  const getStatusText = (level: string) => {
    if (level === 'Well-controlled') return 'คุมอาการได้ดี (Well)';
    if (level === 'Partly Controlled') return 'คุมได้บางส่วน (Partly)';
    return 'ยังคุมไม่ได้ (Uncontrolled)';
  };

  // State for collapsible plan
  const [showFullPlan, setShowFullPlan] = useState(false);

  // ... (renderActionPlan removed or ignored?) 
  // Let's create a new function for the 3 zones

  const renderFullActionPlan = (visit: Visit) => {
    const controller = visit.controller || "ยาควบคุม";
    const reliever = visit.reliever || "ยาฉุกเฉิน";

    return (
      <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Green */}
        <div className="border border-green-200 dark:border-green-800 rounded-xl overflow-hidden">
          <div className="bg-green-100 dark:bg-green-900/40 p-3 flex items-center gap-3">
            <CheckCircle className="text-green-600 dark:text-green-400" />
            <h3 className="font-black text-green-800 dark:text-green-300">สบายดี (Green)</h3>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
            <ul className="space-y-2 list-disc pl-5">
              <li>ไม่มีอาการหอบเหนื่อย</li>
              <li>ใช้ยาควบคุม <span className="font-bold">{controller}</span> เช้า-เย็น</li>
              <li>ใช้ยาฉุกเฉิน <span className="font-bold">{reliever}</span> เมื่อมีอาการ</li>
            </ul>
          </div>
        </div>

        {/* Yellow */}
        <div className="border border-yellow-200 dark:border-yellow-800 rounded-xl overflow-hidden">
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 flex items-center gap-3">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-black text-yellow-800 dark:text-yellow-300">เริ่มมีอาการ (Yellow)</h3>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
            <ul className="space-y-2 list-disc pl-5">
              <li>มีอาการไอ เหนื่อย แน่นหน้าอก</li>
              <li>ใช้ยาควบคุม <span className="font-bold">{controller}</span> ต่อเนื่อง</li>
              <li>เพิ่มยาฉุกเฉิน <span className="font-bold">{reliever}</span> 2 พัฟ ทุก 4-6 ชม.</li>
            </ul>
          </div>
        </div>

        {/* Red */}
        <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
          <div className="bg-red-100 dark:bg-red-900/40 p-3 flex items-center gap-3">
            <XCircle className="text-red-600 dark:text-red-400" />
            <h3 className="font-black text-red-800 dark:text-red-300">อันตราย (Red)</h3>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
            <ul className="space-y-2 list-disc pl-5">
              <li>หอบมาก พูดไม่เป็นประโยค</li>
              <li><span className="font-bold text-red-600">ไปโรงพยาบาลทันที!</span></li>
              <li>พ่นยาฉุกเฉิน <span className="font-bold">{reliever}</span> 2-4 พัฟ ระหว่างเดินทาง</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-black">
      <div className="animate-spin text-primary mb-4"><Activity size={40} /></div>
      <p className="text-muted-foreground dark:text-gray-400 font-bold">กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background dark:bg-black text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h1 className="text-xl font-black text-foreground dark:text-white">ไม่พบข้อมูล</h1>
      <p className="text-muted-foreground dark:text-gray-400 mt-2">QR Code อาจไม่ถูกต้อง หรือข้อมูลถูกลบไปแล้ว</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/30 dark:bg-black pb-10 font-sans text-foreground dark:text-white transition-colors duration-300">


      {/* ส่วนแสดงผลหน้าจอ (ซ่อนตอนพิมพ์) */}
      <div className="print:hidden">

        {/* Header */}
        {/* Header */}
        <div className="bg-foreground dark:bg-[#1a1a1a] text-background p-6 rounded-b-[30px] shadow-lg relative overflow-hidden transition-colors">

          {/* ปุ่มเปลี่ยนธีม (ลอยขวาบน) */}
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>

          <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={120} /></div>
          <div className="relative z-10 pt-4">
            <p className="text-white/60 text-sm font-bold mb-1">สวัสดีคุณ</p>
            <h1 className="text-3xl font-black">{blindName(patient.first_name)} {blindName(patient.last_name)}</h1>
            <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
              <FileText size={14} /> HN: {patient.hn}
            </div>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-20 space-y-6">

          {/* 1. Status Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-zinc-800 transition-colors">
            <h2 className="text-muted-foreground dark:text-zinc-400 font-bold text-xs uppercase mb-4 tracking-wider">ผลการประเมินล่าสุด</h2>
            {lastVisit ? (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${getStatusColor(lastVisit.control_level)}`}>
                  {getStatusIcon(lastVisit.control_level)}
                </div>
                <h3 className="text-xl font-black text-foreground dark:text-white mb-1">{getStatusText(lastVisit.control_level)}</h3>
                <p className="text-muted-foreground dark:text-zinc-400 text-sm">อัปเดต: {new Date(lastVisit.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
              </div>

            ) : (
              <div className="text-center py-4 text-gray-400">ยังไม่มีประวัติการตรวจ</div>
            )}
          </div>

          {/* 2. Action Plan (Collapsible) */}
          {lastVisit && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
              <button
                onClick={() => setShowFullPlan(!showFullPlan)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> แผนการปฏิบัติตัว (Action Plan)
                  </h3>
                </div>
                <div className={`transition-transform duration-300 ${showFullPlan ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </button>

              {showFullPlan && renderFullActionPlan(lastVisit)}
            </div>
          )}

          {/* 3. Next Appointment */}
          {lastVisit?.next_appt && (
            <div className="bg-primary dark:bg-[#b05d28] text-white rounded-2xl p-6 shadow-lg flex items-center justify-between transition-colors">

              <div>
                <p className="text-white/80 text-xs font-bold uppercase mb-1">นัดหมายครั้งต่อไป</p>
                <h3 className="text-2xl font-black">{new Date(lastVisit.next_appt).toLocaleDateString('th-TH', { dateStyle: 'long' })}</h3>
              </div>
              <div className="bg-white/20 p-3 rounded-full"><Calendar size={24} /></div>
            </div>
          )}

          {/* 4. Medications */}
          {lastVisit && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-foreground dark:text-white"><Pill size={18} /> รายการยาปัจจุบัน</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">ยาควบคุม</span>
                  <span className="font-bold text-blue-900 dark:text-blue-300">{lastVisit.controller || "-"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">ยาฉุกเฉิน</span>
                  <span className="font-bold text-orange-900 dark:text-orange-300">{lastVisit.reliever || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Mini Chart */}
          {visitHistory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-primary"><Activity size={18} /> แนวโน้มค่าปอด (PEFR)</h3>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis domain={[0, 800]} tick={{ fontSize: 10, fill: '#888888' }} width={30} />
                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', color: '#000' }} />
                    <Line type="monotone" dataKey="pefr" stroke="#D97736" strokeWidth={3} dot={{ r: 3, fill: '#D97736', stroke: '#fff', strokeWidth: 1 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}




        </div>

        <div className="text-center mt-4 pb-8 text-gray-400 text-xs">
          <p>© Sawankhalok Hospital Asthma Clinic</p>
        </div>
      </div>



    </div>
  );
}
