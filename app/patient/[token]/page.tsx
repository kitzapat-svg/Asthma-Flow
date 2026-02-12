"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, FileText, CheckCircle, AlertTriangle, XCircle, Clock, Pill, Printer } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/theme-toggle'; // <--- เรียกใช้ปุ่มปรับธีม

// --- Types ---
interface Patient {
  hn: string;
  prefix: string;
  first_name: string;
  last_name: string;
  dob: string;
  height: string;
  public_token: string;
}

interface Visit {
  hn: string;
  date: string;
  pefr: string;
  control_level: string;
  next_appt: string;
  advice: string;
  controller: string;
  reliever: string;
}

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
  const handlePrint = () => {
    window.print();
  };

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

  // --- Logic Action Plan ---
  const renderActionPlan = (visit: Visit) => {
    const controller = visit.controller || "ยาควบคุม";
    const reliever = visit.reliever || "ยาฉุกเฉิน";

    if (visit.control_level === 'Well-controlled') {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-8 border-green-500 rounded-lg p-5 mt-6 shadow-sm">
          <h3 className="text-green-800 dark:text-green-400 font-black text-lg flex items-center gap-2">
            <CheckCircle /> โซนสีเขียว: สบายดี
          </h3>
          <ul className="mt-3 space-y-2 text-green-900 dark:text-green-200 text-sm font-medium list-disc pl-5">
            <li>คุณไม่มีอาการหอบเหนื่อย สามารถทำกิจกรรมได้ปกติ</li>
            <li><strong>การใช้ยา:</strong> ใช้ยา <span className="font-bold underline">{controller}</span> วันละ 2 ครั้ง เช้า-เย็น อย่างต่อเนื่อง (ห้ามหยุดยาเอง)</li>
            <li>ใช้ยา <span className="font-bold underline">{reliever}</span> เฉพาะเวลามีอาการ หรือก่อนออกกำลังกาย</li>
          </ul>
        </div>
      );
    } else if (visit.control_level === 'Partly Controlled') {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-8 border-yellow-500 rounded-lg p-5 mt-6 shadow-sm">
          <h3 className="text-yellow-800 dark:text-yellow-400 font-black text-lg flex items-center gap-2">
            <AlertTriangle /> โซนสีเหลือง: เริ่มมีอาการ
          </h3>
          <ul className="mt-3 space-y-2 text-yellow-900 dark:text-yellow-200 text-sm font-medium list-disc pl-5">
            <li>มีอาการไอ เหนื่อย หรือตื่นมาไอตอนกลางคืน</li>
            <li><strong>การใช้ยา:</strong> ใช้ยา <span className="font-bold underline">{controller}</span> ต่อเนื่องตามปกติ</li>
            <li>เพิ่มการใช้ยา <span className="font-bold underline">{reliever}</span> 2 พัฟ ทุก 4-6 ชั่วโมง</li>
            <li>ถ้าอาการไม่ดีขึ้นใน 24 ชั่วโมง ให้รีบมาพบแพทย์</li>
          </ul>
        </div>
      );
    } else {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-8 border-red-500 rounded-lg p-5 mt-6 shadow-sm animate-pulse">
          <h3 className="text-red-800 dark:text-red-400 font-black text-lg flex items-center gap-2">
            <XCircle /> โซนสีแดง: อันตราย!
          </h3>
          <ul className="mt-3 space-y-2 text-red-900 dark:text-red-200 text-sm font-medium list-disc pl-5">
            <li>หอบเหนื่อยมาก พูดได้ทีละคำ หายใจมีเสียงหวีด</li>
            <li><strong>การปฏิบัติตัวด่วน:</strong> พ่นยา <span className="font-bold underline">{reliever}</span> 2-4 พัฟ ทันที!</li>
            <li>ถ้าไม่ดีขึ้น ให้พ่นซ้ำได้ทุก 15 นาที (ไม่เกิน 3 ครั้ง)</li>
            <li><strong>รีบไปโรงพยาบาลที่ใกล้ที่สุดทันที</strong> หรือโทร 1669</li>
          </ul>
        </div>
      );
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEFCF8] dark:bg-black">
      <div className="animate-spin text-[#D97736] mb-4"><Activity size={40} /></div>
      <p className="text-[#6B6560] dark:text-gray-400 font-bold">กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FEFCF8] dark:bg-black text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h1 className="text-xl font-black text-[#2D2A26] dark:text-white">ไม่พบข้อมูล</h1>
      <p className="text-[#6B6560] dark:text-gray-400 mt-2">QR Code อาจไม่ถูกต้อง หรือข้อมูลถูกลบไปแล้ว</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-black pb-10 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">

      {/* ส่วนแสดงผลหน้าจอ (ซ่อนตอนพิมพ์) */}
      <div className="print:hidden">

        {/* Header */}
        <div className="bg-[#2D2A26] dark:bg-[#1a1a1a] text-white p-6 rounded-b-[30px] shadow-lg relative overflow-hidden transition-colors">
          {/* ปุ่มเปลี่ยนธีม (ลอยขวาบน) */}
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>

          <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={120} /></div>
          <div className="relative z-10 pt-4">
            <p className="text-white/60 text-sm font-bold mb-1">สวัสดีคุณ</p>
            <h1 className="text-3xl font-black">{patient.first_name} {patient.last_name}</h1>
            <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
              <FileText size={14} /> HN: {patient.hn}
            </div>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-20 space-y-6">

          {/* 1. Status Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-zinc-800 transition-colors">
            <h2 className="text-[#6B6560] dark:text-zinc-400 font-bold text-xs uppercase mb-4 tracking-wider">ผลการประเมินล่าสุด</h2>
            {lastVisit ? (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${getStatusColor(lastVisit.control_level)}`}>
                  {getStatusIcon(lastVisit.control_level)}
                </div>
                <h3 className="text-xl font-black text-[#2D2A26] dark:text-white mb-1">{getStatusText(lastVisit.control_level)}</h3>
                <p className="text-[#6B6560] dark:text-zinc-400 text-sm">อัปเดต: {new Date(lastVisit.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">ยังไม่มีประวัติการตรวจ</div>
            )}
          </div>

          {/* 2. Action Plan */}
          {lastVisit && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-4 opacity-60 dark:opacity-40">
                <div className="h-[1px] bg-black dark:bg-white flex-1"></div>
                <span className="text-xs font-bold uppercase tracking-wider dark:text-white">Asthma Action Plan</span>
                <div className="h-[1px] bg-black dark:bg-white flex-1"></div>
              </div>
              {renderActionPlan(lastVisit)}
            </div>
          )}

          {/* 3. Next Appointment */}
          {lastVisit?.next_appt && (
            <div className="bg-[#D97736] dark:bg-[#b05d28] text-white rounded-2xl p-6 shadow-lg flex items-center justify-between transition-colors">
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
              <h3 className="font-bold flex items-center gap-2 mb-4 text-[#2D2A26] dark:text-white"><Pill size={18} /> รายการยาปัจจุบัน</h3>
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
              <h3 className="font-bold flex items-center gap-2 mb-4 text-[#D97736]"><Activity size={18} /> แนวโน้มค่าปอด (PEFR)</h3>
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

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="w-full bg-[#2D2A26] dark:bg-white dark:text-black text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform mb-8"
          >
            <Printer size={20} /> พิมพ์บัตรประจำตัว Asthma ID
          </button>

        </div>

        <div className="text-center mt-4 pb-8 text-gray-400 text-xs">
          <p>© Sawankhalok Hospital Asthma Clinic</p>
        </div>
      </div>

      {/* ========================================
        ส่วนที่ 2: หน้าตาบัตร (Print View - ไม่ต้อง Dark Mode)
        ========================================
      */}
      <div className="hidden print:flex print:items-center print:justify-center print:min-h-screen bg-white">
        <div className="w-[85.6mm] h-[54mm] border border-gray-300 rounded-lg overflow-hidden relative shadow-none print:shadow-none bg-white flex flex-col text-black">
          <div className="bg-[#D97736] text-white p-2 flex items-center justify-between h-[12mm]">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-full text-[#D97736]">
                <Activity size={12} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">Asthma Alert Card</span>
            </div>
            <span className="text-[8px] font-bold opacity-80">โรงพยาบาลสวรรคโลก</span>
          </div>
          <div className="flex-1 p-3 flex gap-3 items-center">
            <div className="w-[28mm] flex flex-col items-center justify-center">
              <div className="border-2 border-[#2D2A26] p-1 bg-white">
                <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${patient?.public_token}`} size={80} />
              </div>
              <span className="text-[6px] font-bold text-center mt-1 text-gray-600">สแกนเพื่อดูแผนฉุกเฉิน</span>
            </div>
            <div className="flex-1 space-y-1">
              <div>
                <p className="text-[7px] text-gray-500 uppercase font-bold">Name</p>
                <p className="text-[12px] font-black text-[#2D2A26] leading-none truncate">
                  {patient?.prefix}{patient?.first_name} {patient?.last_name}
                </p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[7px] text-gray-500 uppercase font-bold">HN</p>
                  <p className="text-[10px] font-bold font-mono text-[#D97736]">{patient?.hn}</p>
                </div>
                <div>
                  <p className="text-[7px] text-gray-500 uppercase font-bold">DOB</p>
                  <p className="text-[10px] font-bold">{new Date(patient?.dob || '').toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div className="pt-1">
                <div className="bg-red-50 border border-red-100 p-1 rounded">
                  <p className="text-[6px] text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle size={6} /> ในกรณีฉุกเฉิน (Emergency)
                  </p>
                  <p className="text-[8px] font-bold text-red-700">
                    โทร 1669 หรือ นำส่งโรงพยาบาลทันที
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#2D2A26] h-[3mm] w-full mt-auto"></div>
        </div>
      </div>

    </div>
  );
}
