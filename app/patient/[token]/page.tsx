"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Activity, Calendar, FileText, CheckCircle, AlertTriangle, XCircle, Clock, Pill, ChevronDown, Phone, Heart, Star, Shield, Lock, KeyRound, MessageSquareText, User } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { ThemeToggle } from '@/components/theme-toggle';

import { ActionPlanPrint } from './_components/ActionPlanPrint';
import { Patient, Visit, Medication } from '@/lib/types';
import { blindName } from '@/lib/helpers';
import { getDejsomritrutaiPefr } from '@/lib/pef-reference';

export default function PatientPublicPage() {
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [adviceList, setAdviceList] = useState<any[]>([]);

  // --- DOB Verification State ---
  const [verified, setVerified] = useState(false);
  const [maskedName, setMaskedName] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Step 1: Check if already verified in this session, otherwise fetch masked name
  useEffect(() => {
    const checkVerification = async () => {
      const storedDob = sessionStorage.getItem(`verified_dob_${params.token}`);
      if (storedDob) {
        // Already verified in this session → load data directly
        await fetchPatientData(storedDob);
        return;
      }

      // Not verified → get masked name from API
      try {
        const res = await fetch(`/api/patient?token=${params.token}`);
        if (!res.ok) {
          try {
             const errData = await res.json();
             if (errData.error) setVerifyError(errData.error);
          } catch {}
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.requireVerification) {
          setMaskedName(data.maskedName);
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    checkVerification();
  }, [params.token]);

  // Step 2: Verify DOB
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifying(true);

    // Validate format
    const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dobRegex.test(dobInput)) {
      setVerifyError('กรุณาใส่ในรูปแบบ วว/ดด/ปปปป เช่น 15/06/2510');
      setVerifying(false);
      return;
    }

    await fetchPatientData(dobInput);
  };

  // Fetch full patient data with DOB
  const fetchPatientData = async (dob: string) => {
    try {
      const res = await fetch(`/api/patient?token=${params.token}&dob=${encodeURIComponent(dob)}`);

      if (res.status === 403) {
        setVerifyError('วันเดือนปีเกิดไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setVerifying(false);
        return;
      }

      if (!res.ok) {
        try {
          const errData = await res.json();
          setVerifyError(errData.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        } catch {
          setVerifyError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
        setVerifying(false);
        return;
      }

      const data = await res.json();
      if (data.verified) {
        // Save verification to session
        sessionStorage.setItem(`verified_dob_${params.token}`, dob);
        setVerified(true);

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
                date: new Date(v.visit_date ?? v.date ?? '').toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                }),
                pefr: parseInt(v.pefr as string) > 0 ? parseInt(v.pefr as string) : null,
                hasData: parseInt(v.pefr as string) > 0
              }));
            setVisitHistory(graphData);
          }
        }
      }

      // Advice
      if (data.advice && Array.isArray(data.advice)) {
        setAdviceList(data.advice);
      }
    } catch (error) {
      console.error("Error:", error);
      setVerifyError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

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
  // State for inhaler guide
  const [showInhalerGuide, setShowInhalerGuide] = useState(false);

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
              <li>ใช้ยาควบคุม <span className="font-bold">{controllerText}</span></li>
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

  // ✨ NEW: PEFR zone boundaries (based on Predicted PEFR)
  // Green: >= 80%, Yellow: 50% - 79%, Red: < 50%
  const getPefrZones = () => {
    const predicted = getPredictedPefr();
    const referenceValue = predicted || (patient?.best_pefr ? parseInt(patient.best_pefr) : 500);
    return {
      greenMin: Math.round(referenceValue * 0.8),
      yellowMin: Math.round(referenceValue * 0.5),
      max: Math.max(referenceValue, 800),
    };
  };

  // ✨ NEW: Predicted PEFR using Thai Reference (Dejsomritrutai W, et al. 2000)
  // Exact lookup from published tables in J Med Assoc Thai. 2000
  const getPredictedPefr = (): number | null => {
    if (!patient) return null;
    const heightCm = parseFloat(patient.height);
    const dob = patient.dob;
    if (!heightCm || !dob) return null;
    const ageMs = Date.now() - new Date(dob).getTime();
    const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
    const isMale = patient.prefix === 'นาย' || patient.prefix === 'ด.ช.';

    // Accurate table lookup
    return getDejsomritrutaiPefr(age, heightCm, isMale);
  };

  // ✨ NEW: Find most recent visit with valid PEFR (> 0), fallback to previous visits
  const getLatestValidPefr = (): { pefr: number; date: string } | null => {
    for (const v of allVisits) {
      const p = parseInt(v.pefr as string);
      const dateStr = v.visit_date ?? v.date ?? '';
      if (p > 0) return { pefr: p, date: dateStr };
    }
    return null;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-black">
      <div className="animate-spin text-primary mb-4"><Activity size={40} /></div>
      <p className="text-muted-foreground dark:text-gray-400 font-bold">กำลังโหลดข้อมูล...</p>
    </div>
  );

  // --- DOB Verification Screen ---
  if (!verified && !patient) {
    if (!maskedName && verifyError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background dark:bg-black text-center">
          <AlertTriangle size={48} className="text-orange-500 mb-4" />
          <h1 className="text-xl font-black text-foreground dark:text-white">ระงับการเข้าถึงชั่วคราว</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">{verifyError}</p>
        </div>
      );
    }
    
    if (!maskedName) {
      // No masked name = token not found
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background dark:bg-black text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-xl font-black text-foreground dark:text-white">ไม่พบข้อมูล</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">QR Code อาจไม่ถูกต้อง หรือข้อมูลถูกลบไปแล้ว</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white dark:from-zinc-950 dark:to-black p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D97736] to-[#E8943D] text-white shadow-lg mb-4">
              <Shield size={36} />
            </div>
            <h1 className="text-2xl font-black text-[#2D2A26] dark:text-white">ยืนยันตัวตน</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">เพื่อความปลอดภัย กรุณายืนยันตัวตนก่อนดูข้อมูล</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6">
            {/* Masked name */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#D97736]/20 flex items-center justify-center">
                <Lock size={18} className="text-[#D97736]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">ข้อมูลของ</p>
                <p className="font-bold text-[#2D2A26] dark:text-white">{maskedName}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  <KeyRound size={14} className="inline mr-1.5 -mt-0.5" />
                  วันเดือนปีเกิด (พ.ศ.)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="วว/ดด/ปปปป"
                  value={dobInput}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^\d/]/g, '');
                    // Auto-add slashes
                    if (val.length === 2 && dobInput.length < 2) val += '/';
                    if (val.length === 5 && dobInput.length < 5) val += '/';
                    if (val.length <= 10) setDobInput(val);
                    setVerifyError('');
                  }}
                  className="w-full px-4 py-3 text-lg font-mono text-center tracking-widest border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 focus:border-[#D97736] focus:ring-2 focus:ring-[#D97736]/20 outline-none transition-all text-[#2D2A26] dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                  maxLength={10}
                  autoFocus
                />
              </div>

              {/* Guide */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-bold mb-1">📋 รูปแบบการใส่รหัส:</p>
                <p>ใส่เป็น <span className="font-mono font-bold bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">วว/ดด/ปปปป</span> (พ.ศ.)</p>
                <p className="mt-1.5 text-blue-600 dark:text-blue-400">
                  ตัวอย่าง: เกิดวันที่ 15 มิถุนายน 2510 → <span className="font-mono font-bold">15/06/2510</span>
                </p>
              </div>

              {/* Error */}
              {verifyError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                  <XCircle size={16} />
                  {verifyError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={verifying || dobInput.length < 10}
                className="w-full py-3.5 bg-gradient-to-r from-[#D97736] to-[#E8943D] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังตรวจสอบ...</>
                ) : (
                  <><CheckCircle size={20} /> ยืนยันตัวตน</>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-gray-400 dark:text-zinc-600 mt-4">
            🔒 ข้อมูลของท่านจะถูกเก็บรักษาอย่างปลอดภัย
          </p>
        </div>
      </div>
    );
  }

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
                <p className="text-muted-foreground dark:text-zinc-400 text-sm">อัปเดต: {new Date(lastVisit.visit_date ?? lastVisit.date ?? '').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>

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

          {/* ✨ Staff Advice Section */}
          {adviceList.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-md border border-orange-100 dark:border-orange-900/30 transition-colors">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-[#D97736]">
                <MessageSquareText size={18} /> คำแนะนำจากทีมดูแล
              </h3>
              <div className="space-y-3">
                {adviceList.map((advice: any, i: number) => (
                  <div key={i} className="bg-orange-50/60 dark:bg-orange-950/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-[#D97736]/10 flex items-center justify-center">
                        <User size={14} className="text-[#D97736]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#2D2A26] dark:text-white leading-tight truncate">
                          {advice.staff_name}
                        </p>
                        {advice.staff_position && (
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
                            {advice.staff_position}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                        {new Date(advice.date).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'short', year: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[#2D2A26] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {advice.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* 5. Inhaler Technique Guide */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden transition-colors">
            <button
              onClick={() => setShowInhalerGuide(!showInhalerGuide)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  {/* MDI inhaler mini icon */}
                  <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}>
                    <rect x="9" y="2" width="6" height="3" rx="1" />
                    <rect x="7" y="5" width="10" height="14" rx="3" />
                    <rect x="10" y="19" width="4" height="3" rx="1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-foreground dark:text-white text-sm">วิธีใช้ยาพ่น (MDI) ที่ถูกต้อง</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">กดเพื่อดูขั้นตอน 6 ข้อ พร้อมภาพประกอบ</p>
                </div>
              </div>
              <div className={`transition-transform duration-300 ${showInhalerGuide ? 'rotate-180' : ''}`}>
                <ChevronDown size={20} className="text-gray-400" />
              </div>
            </button>

            {showInhalerGuide && (
              <div className="px-5 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">

                {/* Intro */}
                <p className="text-xs text-muted-foreground text-center bg-secondary/50 dark:bg-zinc-800 rounded-xl p-3">
                  💨 การพ่นยาให้ถูกวิธี ช่วยให้ยาเข้าปอดได้มากขึ้น อาการดีขึ้นเร็วกว่า
                </p>

                {/* Steps 1-2 */}
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-white">
                  <Image
                    src="/inhaler-guide/step-1-2.png"
                    alt="ขั้นตอนที่ 1-2: เขย่ายา และหายใจออกให้สุด"
                    width={180}
                    height={180}
                    className="w-full max-w-[180px] mx-auto object-contain py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">①</span>
                    <p className="font-bold text-blue-900 dark:text-blue-200 mt-1">จับหลอดยาตั้งตรง</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">ถอดฝาออก แล้วเขย่า 3-4 ครั้งในแนวตั้ง</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">②</span>
                    <p className="font-bold text-blue-900 dark:text-blue-200 mt-1">หายใจออกให้สุด</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">ผ่อนลมออกทางปากให้มากที่สุดก่อนพ่นยา</p>
                  </div>
                </div>

                {/* Steps 3-4 */}
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-white">
                  <Image
                    src="/inhaler-guide/step-3-4.png"
                    alt="ขั้นตอนที่ 3-4: อมปากกระบอกยา และกดพร้อมสูด"
                    width={180}
                    height={180}
                    className="w-full max-w-[180px] mx-auto object-contain py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800">
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">③</span>
                    <p className="font-bold text-indigo-900 dark:text-indigo-200 mt-1">อมปากกระบอกยาให้สนิท</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">ริมฝีปากปิดสนิท ตั้งศีรษะตรงหรือเงยเล็กน้อย</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800">
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">④</span>
                    <p className="font-bold text-indigo-900 dark:text-indigo-200 mt-1">กดพร้อมสูดช้าๆ ลึกๆ</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">กดหลอดพร้อมหายใจเข้าทางปากช้าๆ ลึกๆ ทันที</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-white">
                  <Image
                    src="/inhaler-guide/step-5-hold.png"
                    alt="ขั้นตอนที่ 5: กลั้นลมหายใจ 10 วินาที"
                    width={120}
                    height={120}
                    className="w-full max-w-[120px] mx-auto object-contain py-2"
                  />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800 text-sm">
                  <span className="text-base font-black text-green-600 dark:text-green-400">⑤</span>
                  <p className="font-bold text-green-900 dark:text-green-200 mt-1">กลั้นลมหายใจ ~10 วินาที</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">แล้วจึงหายใจออกช้าๆ เพื่อให้ยาซึมเข้าปอดได้เต็มที่</p>
                </div>

                {/* Step 6 */}
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 border border-gray-200 dark:border-zinc-700 text-sm">
                  <span className="text-base font-black text-gray-600 dark:text-gray-400">⑥</span>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">ถ้าต้องพ่นซ้ำให้รอ 1-3 นาที</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">แล้วจึงทำซ้ำตั้งแต่ขั้นตอนที่ ③</p>
                </div>

                {/* 🚨 MOUTH RINSE WARNING */}
                <div className="rounded-xl overflow-hidden border-2 border-red-300 dark:border-red-700">
                  <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-black text-sm">สำคัญมาก! ต้องบ้วนปากทุกครั้ง</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="bg-white rounded-lg mb-3">
                      <Image
                        src="/inhaler-guide/mouthrinse.png"
                        alt="บ้วนปากและกลั้วคอหลังพ่นยาสเตียรอยด์"
                        width={140}
                        height={140}
                        className="w-full max-w-[140px] mx-auto object-contain py-2 rounded-lg"
                      />
                    </div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-200 text-center">
                      หลังพ่นยาที่มีสเตียรอยด์ (ICS)
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 text-center mt-1">
                      <span className="font-black">บ้วนปากและกลั้วคอด้วยน้ำทุกครั้ง</span>
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-start gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2">
                        <span className="text-red-500 font-bold shrink-0">✗</span>
                        <span>ถ้าไม่บ้วนปาก → เกิดเชื้อราในปาก (ปากเป็นฝ้า เจ็บคอ เสียงแหบ)</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2">
                        <span className="text-green-600 font-bold shrink-0">✓</span>
                        <span>บ้วนปาก + กลั้วคอ แล้วบ้วนทิ้ง <span className="font-bold">ห้ามกลืน</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800 text-xs space-y-1.5">
                  <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">💡 เคล็ดลับเพิ่มเติม</p>
                  <p className="text-amber-700 dark:text-amber-300">• ถ้ามือสั่นหรือกดไม่ถนัด ให้ใช้ Spacer ช่วย</p>
                  <p className="text-amber-700 dark:text-amber-300">• เช็ดปากหลอดพ่นยา แล้วปิดฝาหลังใช้ทุกครั้ง</p>
                  <p className="text-amber-700 dark:text-amber-300">• ไม่แน่ใจให้สอบถามเภสัชกรหรือพยาบาลคลินิกได้เลย</p>
                </div>

              </div>
            )}
          </div>

          {/* 6. PEFR Chart with Zone Highlighting */}
          {visitHistory.length > 0 && (() => {
            const predicted = getPredictedPefr();
            const latestValid = getLatestValidPefr();
            const pctOfPredicted = predicted && latestValid ? Math.round((latestValid.pefr / predicted) * 100) : null;
            const pctColor =
              pctOfPredicted === null ? ''
                : pctOfPredicted >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                  : pctOfPredicted >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';

            return (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md transition-colors">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-primary"><Activity size={18} /> แนวโน้มค่าปอด (PEFR)</h3>
                <p className="text-xs text-muted-foreground mb-4">พื้นหลังสีแสดงระดับ: 🟢 ดี / 🟡 ระวัง / 🔴 อันตราย</p>

                {/* % of predicted badge */}
                {pctOfPredicted !== null && latestValid && (
                  <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center justify-between ${pctColor}`}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide opacity-70">ค่าปอดล่าสุด vs ค่าเป้าหมาย</p>
                      <p className="text-2xl font-black mt-0.5">
                        {latestValid.pefr} <span className="text-sm font-bold">L/min</span>
                        <span className="ml-3 text-base">
                          {pctOfPredicted >= 80 ? '🟢' : pctOfPredicted >= 60 ? '🟡' : '🔴'}&nbsp;
                          {pctOfPredicted}% ของค่าเป้าหมาย
                        </span>
                      </p>
                      <p className="text-xs opacity-70 mt-0.5">
                        ค่าเป้าหมาย (Predicted): {predicted} L/min
                        {allVisits[0] && parseInt(allVisits[0].pefr) === 0 && (
                          <> · ใช้ข้อมูลจากครั้งก่อน ({new Date(latestValid.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

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
                      <Tooltip
                        contentStyle={{ borderRadius: '10px', fontSize: '12px', color: '#000' }}
                        formatter={(value: any) => [value || 'ไม่มีข้อมูล', 'PEFR']}
                      />
                      <Line connectNulls={false} type="monotone" dataKey="pefr" stroke="#D97736" strokeWidth={3} dot={{ r: 4, fill: '#D97736', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Zone legend */}
                <div className="flex justify-center flex-wrap gap-4 mt-3 text-xs font-bold">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span> ดี (&gt;{zones.greenMin})</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> ระวัง ({zones.yellowMin}-{zones.greenMin})</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> อันตราย (&lt;{zones.yellowMin})</span>
                </div>

                {visitHistory.some(v => !v.hasData) && (
                  <p className="text-center text-[10px] text-muted-foreground mt-3">
                    * หมายเหตุ: จุดที่ไม่มีข้อมูลกราฟ คือ visit ที่ไม่ได้เป่าปอด
                  </p>
                )}
              </div>
            );
          })()}

        </div>

        <div className="text-center mt-6 pb-8 text-gray-400 text-xs">
          <p>© Sawankhalok Hospital Asthma Clinic</p>
        </div>
      </div>

    </div>
  );
}
