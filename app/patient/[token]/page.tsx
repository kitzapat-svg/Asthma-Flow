"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, FileText, CheckCircle, AlertTriangle, XCircle, Clock, Pill, ChevronDown, Phone, Heart, Star, Shield } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { ThemeToggle } from '@/components/theme-toggle';

import { ActionPlanPrint } from './_components/ActionPlanPrint';
import { Patient, Visit, Medication } from '@/lib/types';
import { blindName } from '@/lib/helpers';

export default function PatientPublicPage() {
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/patient?token=${params.token}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        const foundPatient = data.patient;
        const visits: Visit[] = data.visits;
        const medData: Medication | null = data.medication;

        if (foundPatient) {
          setPatient(foundPatient);
          if (medData) setMedication(medData);

          if (visits.length > 0) {
            setLastVisit(visits[0]);
            setAllVisits(visits);

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

  // ✨ NEW: Friendly encouragement messages
  const getEncouragementMessage = (level: string) => {
    if (level === 'Well-controlled') return '🎉 ยอดเยี่ยม! อาการของคุณคุมได้ดี ขอให้ใช้ยาอย่างต่อเนื่องนะคะ';
    if (level === 'Partly Controlled') return '💛 อาการยังไม่เข้าที่ แต่ไม่ต้องกังวล ปฏิบัติตามแผนด้านล่างนะคะ';
    return '🚨 ระวัง! กรุณาทำตามคำแนะนำฉุกเฉินด้านล่างทันที';
  };

  const getEncouragementStyle = (level: string) => {
    if (level === 'Well-controlled') return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    if (level === 'Partly Controlled') return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
  };

  // ✨ NEW: Well-controlled streak
  const getWellControlledStreak = () => {
    let streak = 0;
    for (const v of allVisits) {
      if (v.control_level === 'Well-controlled') streak++;
      else break;
    }
    return streak;
  };

  // ✨ NEW: Appointment countdown helper
  const getAppointmentCountdown = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(dateStr);
    apptDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: 'วันนี้!', urgent: true };
    if (diff === 1) return { text: 'พรุ่งนี้', urgent: true };
    if (diff < 0) return { text: `เกินมาแล้ว ${Math.abs(diff)} วัน`, urgent: true };
    if (diff <= 3) return { text: `อีก ${diff} วัน`, urgent: true };
    return { text: `อีก ${diff} วัน`, urgent: false };
  };

  // State for collapsible plan - auto-open if not Well-controlled
  const [showFullPlan, setShowFullPlan] = useState(false);

  // Auto-open plan for Yellow/Red
  useEffect(() => {
    if (lastVisit && lastVisit.control_level !== 'Well-controlled') {
      setShowFullPlan(true);
    }
  }, [lastVisit]);

  // ✨ NEW: Freq mapper
  const mapFreqToThai = (freq: string) => {
    if (!freq) return "";
    if (freq === "OD") return "วันละ 1 ครั้ง";
    if (freq === "BID") return "วันละ 2 ครั้ง (เช้า-เย็น)";
    if (freq === "PRN") return "เมื่อมีอาการ";
    return freq;
  };

  const renderFullActionPlan = (visit: Visit) => {
    let controllerText = "ตามแพทย์สั่ง";
    if (medication) {
      if (medication.c1_name) {
        controllerText = `${medication.c1_name} ${medication.c1_puffs} puffs ${mapFreqToThai(medication.c1_freq)} (ใช้ต่อเนื่อง)`;
        if (medication.c2_name) {
          controllerText += ` และ ${medication.c2_name} ${medication.c2_puffs} puffs ${mapFreqToThai(medication.c2_freq)} (ใช้ต่อเนื่อง)`;
        }
      }
    } else if (visit.controller) {
      controllerText = `${visit.controller} (ใช้ต่อเนื่อง)`;
    }

    let relieverText = "ตามแพทย์สั่ง";
    if (medication && medication.reliever_name) {
      relieverText = `${medication.reliever_name} ${medication.reliever_label}`;
    } else if (visit.reliever) {
      relieverText = `${visit.reliever}`;
    }

    const currentLevel = visit.control_level;
    const isGreenHighlighted = currentLevel === 'Well-controlled';
    const isYellowHighlighted = currentLevel === 'Partly Controlled';
    const isRedHighlighted = currentLevel === 'Uncontrolled';

    return (
      <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Highlight notice */}
        <p className="text-xs text-muted-foreground text-center">
          ⬇️ โซนที่มีกรอบหนาคือโซนที่ตรงกับสถานะปัจจุบันของคุณ
        </p>

        {/* Green */}
        <div className={`border rounded-xl overflow-hidden transition-all ${isGreenHighlighted ? 'border-green-500 border-2 ring-2 ring-green-200 dark:ring-green-800 shadow-lg' : 'border-green-200 dark:border-green-800'}`}>
          <div className="bg-green-100 dark:bg-green-900/40 p-3 flex items-center gap-3">
            <CheckCircle className="text-green-600 dark:text-green-400" />
            <h3 className="font-black text-green-800 dark:text-green-300">🟢 สบายดี (Green Zone)</h3>
            {isGreenHighlighted && <span className="ml-auto bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">👈 คุณอยู่ตรงนี้</span>}
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
            <ul className="space-y-2 list-disc pl-5">
              <li>ไม่มีอาการหอบเหนื่อย ทำกิจวัตรได้ปกติ</li>
              <li>ใช้ยาควบคุม <span className="font-bold">{controllerText}</span></li>
              <li>ใช้ยาฉุกเฉิน <span className="font-bold">{relieverText}</span> (ถ้ามีอาการ)</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">⚠️ ใช้ยาอย่างต่อเนื่อง แม้ไม่มีอาการก็ห้ามหยุดยาเอง</p>
          </div>
        </div>

        {/* Yellow */}
        <div className={`border rounded-xl overflow-hidden transition-all ${isYellowHighlighted ? 'border-yellow-500 border-2 ring-2 ring-yellow-200 dark:ring-yellow-800 shadow-lg' : 'border-yellow-200 dark:border-yellow-800'}`}>
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 flex items-center gap-3">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-black text-yellow-800 dark:text-yellow-300">🟡 เริ่มมีอาการ (Yellow Zone)</h3>
            {isYellowHighlighted && <span className="ml-auto bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">👈 คุณอยู่ตรงนี้</span>}
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
            <ul className="space-y-2 list-disc pl-5">
              <li>มีอาการไอ เหนื่อย แน่นหน้าอก</li>
              <li>ใช้ยาควบคุม <span className="font-bold">{controllerText}</span> ต่อเนื่อง</li>
              <li>เพิ่มยาฉุกเฉิน <span className="font-bold">{medication?.reliever_name || visit.reliever || "Salbutamol"}</span> 2 พัฟ ทุก 4-6 ชม.</li>
              <li className="text-red-600 dark:text-red-400 font-bold">ถ้าอาการไม่ดีขึ้นภายใน 24 ชม. ให้รีบมาพบแพทย์</li>
            </ul>
          </div>
        </div>

        {/* Red */}
        <div className={`border rounded-xl overflow-hidden transition-all ${isRedHighlighted ? 'border-red-500 border-2 ring-2 ring-red-200 dark:ring-red-800 shadow-lg' : 'border-red-200 dark:border-red-800'}`}>
          <div className="bg-red-100 dark:bg-red-900/40 p-3 flex items-center gap-3">
            <XCircle className="text-red-600 dark:text-red-400" />
            <h3 className="font-black text-red-800 dark:text-red-300">🔴 อันตราย (Red Zone)</h3>
            {isRedHighlighted && <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">👈 คุณอยู่ตรงนี้</span>}
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
            <div className="flex items-center gap-2 mb-2 text-red-600 font-bold animate-pulse">
              <Phone size={16} /> <span>โทร 1669 หรือไป รพ. ทันที</span>
            </div>
            <ul className="space-y-2 list-disc pl-5">
              <li>หอบมาก พูดไม่เป็นประโยค</li>
              <li>พ่นยาฉุกเฉิน <span className="font-bold">{medication?.reliever_name || visit.reliever || "Salbutamol"}</span> 2-4 พัฟ ระหว่างเดินทาง</li>
              <li>พ่นซ้ำได้ทุก 15 นาที</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // ✨ NEW: PEFR zone boundaries (based on best_pefr if available)
  const getPefrZones = () => {
    const bestPefr = patient?.best_pefr ? parseInt(patient.best_pefr) : 500;
    return {
      greenMin: Math.round(bestPefr * 0.8),
      yellowMin: Math.round(bestPefr * 0.6),
      max: Math.max(bestPefr, 800),
    };
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

  const streak = getWellControlledStreak();
  const zones = getPefrZones();

  return (
    <div className="min-h-screen bg-secondary/30 dark:bg-black pb-10 font-sans text-foreground dark:text-white transition-colors duration-300">

      {/* ส่วนแสดงผลหน้าจอ (ซ่อนตอนพิมพ์) */}
      <div className="print:hidden">

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
            <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
              <span className="flex items-center gap-1"><FileText size={14} /> HN: {patient.hn}</span>
              {allVisits.length > 0 && (
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-xs">
                  <Heart size={12} /> มาพบแพทย์แล้ว {allVisits.length} ครั้ง
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-20 space-y-6">

          {/* 1. Status Card (Enhanced) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-zinc-800 transition-colors">
            <h2 className="text-muted-foreground dark:text-zinc-400 font-bold text-xs uppercase mb-4 tracking-wider">ผลการประเมินล่าสุด</h2>
            {lastVisit ? (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${getStatusColor(lastVisit.control_level)}`}>
                  {getStatusIcon(lastVisit.control_level)}
                </div>
                <h3 className="text-xl font-black text-foreground dark:text-white mb-1">{getStatusText(lastVisit.control_level)}</h3>
                <p className="text-muted-foreground dark:text-zinc-400 text-sm">อัปเดต: {new Date(lastVisit.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>

                {/* ✨ Encouragement Message */}
                <div className={`mt-4 p-3 rounded-xl border text-sm font-bold ${getEncouragementStyle(lastVisit.control_level)}`}>
                  {getEncouragementMessage(lastVisit.control_level)}
                </div>

                {/* ✨ Well-controlled Streak */}
                {streak >= 2 && (
                  <div className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                    <Star size={18} className="text-amber-500" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                      คุมอาการดีติดต่อกัน {streak} ครั้ง! สุดยอดมาก!
                    </span>
                    <span className="text-lg">⭐</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">ยังไม่มีประวัติการตรวจ</div>
            )}
          </div>

          {/* 2. Action Plan (Auto-open for Yellow/Red + Zone Highlight) */}
          {lastVisit && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
              <button
                onClick={() => setShowFullPlan(!showFullPlan)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                    <Shield size={18} className="text-primary" /> แผนการปฏิบัติตัว (Action Plan)
                  </h3>
                </div>
                <div className={`transition-transform duration-300 ${showFullPlan ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </button>

              {showFullPlan && renderFullActionPlan(lastVisit)}
            </div>
          )}

          {/* 3. Appointment Countdown (Enhanced) */}
          {lastVisit?.next_appt && (() => {
            const countdown = getAppointmentCountdown(lastVisit.next_appt);
            return (
              <div className={`rounded-2xl p-6 shadow-lg flex items-center justify-between transition-colors ${countdown.urgent ? 'bg-primary dark:bg-[#b05d28] animate-pulse-slow' : 'bg-primary dark:bg-[#b05d28]'} text-white`}>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase mb-1">นัดหมายครั้งต่อไป</p>
                  <h3 className="text-2xl font-black">{new Date(lastVisit.next_appt).toLocaleDateString('th-TH', { dateStyle: 'long' })}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={14} />
                    <span className={`text-sm font-bold ${countdown.urgent ? 'text-white' : 'text-white/80'}`}>
                      ⏳ {countdown.text}
                    </span>
                    {!countdown.urgent && <span className="text-xs text-white/60">อย่าลืมนัดนะคะ 💪</span>}
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-full"><Calendar size={24} /></div>
              </div>
            );
          })()}

          {/* 4. Medications (Enhanced with dosage details) */}
          {lastVisit && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-foreground dark:text-white"><Pill size={18} /> รายการยาปัจจุบัน</h3>

              <div className="space-y-3 text-sm">
                {/* Controller */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💊</span>
                    <span className="font-bold text-blue-900 dark:text-blue-300">ยาควบคุม (Controller)</span>
                  </div>
                  <p className="font-bold text-blue-800 dark:text-blue-200 text-base">
                    {medication?.c1_name || lastVisit.controller || "-"}
                  </p>
                  {medication?.c1_puffs && (
                    <p className="text-blue-600 dark:text-blue-400 mt-1">
                      {medication.c1_puffs} puffs · {mapFreqToThai(medication.c1_freq)}
                    </p>
                  )}
                  {medication?.c2_name && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <p className="font-bold text-indigo-800 dark:text-indigo-300">{medication.c2_name}</p>
                      <p className="text-indigo-600 dark:text-indigo-400">
                        {medication.c2_puffs} puffs · {mapFreqToThai(medication.c2_freq)}
                      </p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> ห้ามหยุดยาเอง แม้ไม่มีอาการ
                  </p>
                </div>

                {/* Reliever */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🆘</span>
                    <span className="font-bold text-orange-900 dark:text-orange-300">ยาฉุกเฉิน (Reliever)</span>
                  </div>
                  <p className="font-bold text-orange-800 dark:text-orange-200 text-base">
                    {medication?.reliever_name || lastVisit.reliever || "-"}
                  </p>
                  {medication?.reliever_label && (
                    <p className="text-orange-600 dark:text-orange-400 mt-1">
                      {medication.reliever_label}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
                    ใช้เมื่อมีอาการเหนื่อยหอบ หรือก่อนออกกำลังกาย
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. PEFR Chart with Zone Highlighting */}
          {visitHistory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
              <h3 className="font-bold flex items-center gap-2 mb-2 text-primary"><Activity size={18} /> แนวโน้มค่าปอด (PEFR)</h3>
              <p className="text-xs text-muted-foreground mb-4">พื้นหลังสีแสดงระดับ: 🟢 ดี / 🟡 ระวัง / 🔴 อันตราย</p>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitHistory}>
                    {/* Zone backgrounds */}
                    <ReferenceArea y1={zones.greenMin} y2={zones.max} fill="#22c55e" fillOpacity={0.08} />
                    <ReferenceArea y1={zones.yellowMin} y2={zones.greenMin} fill="#eab308" fillOpacity={0.08} />
                    <ReferenceArea y1={0} y2={zones.yellowMin} fill="#ef4444" fillOpacity={0.08} />

                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis domain={[0, zones.max]} tick={{ fontSize: 10, fill: '#888888' }} width={35} />
                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', color: '#000' }} />
                    <Line type="monotone" dataKey="pefr" stroke="#D97736" strokeWidth={3} dot={{ r: 4, fill: '#D97736', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Zone legend */}
              <div className="flex justify-center gap-4 mt-3 text-xs font-bold">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span> ดี (&gt;{zones.greenMin})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> ระวัง ({zones.yellowMin}-{zones.greenMin})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> อันตราย (&lt;{zones.yellowMin})</span>
              </div>
            </div>
          )}

        </div>

        <div className="text-center mt-6 pb-8 text-gray-400 text-xs">
          <p>© Sawankhalok Hospital Asthma Clinic</p>
        </div>
      </div>

    </div>
  );
}
