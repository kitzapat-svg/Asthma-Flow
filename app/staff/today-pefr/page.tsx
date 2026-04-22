"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Save, Activity, CheckCircle, Clock, AlertTriangle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Patient, Visit } from '@/lib/types';
import { calculatePredictedPEFR } from '@/lib/helpers';
import { getBangkokDateString, toBangkokMidnight } from '@/lib/date-utils';

// We create an extended interface for the view
interface PatientWithAppt extends Patient {
  todayVisit: Visit | null;
  predictedPefr: number;
}

export default function RecordPefrPage() {
  const router = useRouter();
  const { status, data: session } = useSession();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed lists
  const [activePatients, setActivePatients] = useState<PatientWithAppt[]>([]);
  
  // Walk-in Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // PEFR Drafts { [hn]: string }
  const [pefrDrafts, setPefrDrafts] = useState<Record<string, string>>({});
  const [savingHn, setSavingHn] = useState<string | null>(null);

  const todayStr = getBangkokDateString();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPatients, resVisits] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();

      if (!Array.isArray(dataPatients) || !Array.isArray(dataVisits)) return;

      setPatients(dataPatients);
      setVisits(dataVisits);

      // Now determine who is scheduled for today OR already walked in today
      const activeList: PatientWithAppt[] = [];
      const drafts: Record<string, string> = {};

      const todayStart = new Date(todayStr);
      todayStart.setHours(0, 0, 0, 0);

      dataPatients.forEach(p => {
        const pVisits = dataVisits.filter(v => v.hn === p.hn)
          .sort((a, b) => new Date(b.visit_date || b.date || '').getTime() - new Date(a.visit_date || a.date || '').getTime());
        
        let isToday = false;
        let todayVisit: Visit | null = null;

        // 1. Check if patient already has a visit recorded today
        const existingToday = pVisits.find(v => (v.visit_date || v.date) === todayStr);
        if (existingToday) {
          isToday = true;
          todayVisit = existingToday;
          // Pre-fill draft with existing PEFR if it's not empty or "-"
          if (existingToday.pefr && existingToday.pefr !== '-' && existingToday.pefr !== '0') {
            drafts[p.hn] = existingToday.pefr.toString();
          }
        } else {
          // 2. Check if they have an appointment today
          // Look at the most recent visit before today to find their next_appt
          const prevValidVisit = pVisits.find(v => (v.visit_date || v.date) !== todayStr && v.next_appt);
          if (prevValidVisit && prevValidVisit.next_appt) {
            const scheduled = new Date(prevValidVisit.next_appt);
            scheduled.setHours(0, 0, 0, 0);
            if (scheduled.getTime() === todayStart.getTime()) {
              isToday = true;
            }
          }
        }

        if (isToday) {
          activeList.push({
            ...p,
            todayVisit,
            predictedPefr: calculatePredictedPEFR(p)
          });
        }
      });

      setActivePatients(activeList);
      setPefrDrafts(drafts);

    } catch (error) {
      console.error('Failed to fetch PEFR data:', error);
      toast.error('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // --- Walk-in Search Logic ---
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const query = searchTerm.toLowerCase().trim();
    // Exclude patients already in the active list
    const activeHns = new Set(activePatients.map(p => p.hn));

    return patients.filter(p => {
      if (activeHns.has(p.hn)) return false;
      return p.hn.toLowerCase().includes(query) || 
             p.first_name.toLowerCase().includes(query) || 
             p.last_name.toLowerCase().includes(query);
    }).slice(0, 5); // Limit to top 5 results
  }, [patients, activePatients, searchTerm]);

  const addWalkInPatient = (p: Patient) => {
    const newActivePatient: PatientWithAppt = {
      ...p,
      todayVisit: null,
      predictedPefr: calculatePredictedPEFR(p)
    };
    
    setActivePatients(prev => [newActivePatient, ...prev]);
    setSearchTerm('');
    toast.success(`เพิ่ม ${p.prefix}${p.first_name} เข้าสู่คิววันนี้แล้ว`);
  };

  // --- Save PEFR Logic ---
  const handleSavePEFR = async (patient: PatientWithAppt) => {
    const draftPefr = pefrDrafts[patient.hn]?.trim();
    
    if (!draftPefr) {
      toast.error('กรุณากรอกค่า PEFR');
      return;
    }

    // Zod validation for PEFR range: 0 - 900
    const pefrSchema = z.coerce.number()
      .min(0, "ค่า PEFR ไม่ถูกต้อง (0-900)")
      .max(900, "ค่า PEFR ไม่ถูกต้อง (0-900)");
    
    const result = pefrSchema.safeParse(draftPefr);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSavingHn(patient.hn);

    try {
      const isEdit = !!patient.todayVisit;

      if (isEdit) {
        // Prepare Full Data Array for PUT
        const visit = patient.todayVisit as any;
        const updatedData = [
          visit.hn,
          visit.visit_date || visit.date,
          draftPefr,
          visit.control_level || '-',
          visit.controller || '-',
          visit.reliever || '-',
          visit.adherence || '-',
          visit.drp || '-',
          visit.advice || '-',
          visit.technique_check || '-',
          visit.next_appt || '',
          visit.note || '-',
          visit.is_new_case ? 'TRUE' : 'FALSE',
          visit.inhaler_score || '-' // To string maybe? Wait, schema is string
        ];

        // Ensure string conversion for PUT API format
        for(let i=0; i<updatedData.length; i++){
           if(updatedData[i] === undefined || updatedData[i] === null) updatedData[i] = '-';
           updatedData[i] = String(updatedData[i]);
        }

        const res = await fetch('/api/db', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'visits', 
            hn: patient.hn, 
            date: todayStr, 
            data: updatedData 
          })
        });

        if (!res.ok) throw new Error('Update failed');
      } else {
        // Create STUB for today
        // Determine previous meds so pharmacist has pre-filled data, or let pharmacist load it.
        // Pharmacist's page loads meds from history if today's visit meds aren't saved yet, 
        // BUT wait, visit page checks if today is in visitData. If today is in visitData it defaults to what's in there.
        // It's safest to provide the pharmacist fallback defaults.
        const pVisits = visits.filter(v => v.hn === patient.hn)
          .sort((a, b) => new Date(b.visit_date || b.date || '').getTime() - new Date(a.visit_date || a.date || '').getTime());
        
        let lastCL = 'Well-controlled';
        let lastC = 'Seretide';
        let lastR = 'Salbutamol';
        if (pVisits.length > 0) {
          lastCL = pVisits[0].control_level || lastCL;
          lastC = pVisits[0].controller || lastC;
          lastR = pVisits[0].reliever || lastR;
        }

        const newData = [
          patient.hn,
          todayStr,
          draftPefr,
          lastCL,
          lastC,
          lastR,
          '100', // default adherence
          '-',
          '-',
          'ไม่', // default technique check
          '',
          '-',
          'FALSE', // new case
          '-'
        ];

        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'visits', 
            data: newData 
          })
        });

        if (!res.ok) throw new Error('Create failed');
      }

      toast.success('บันทึก PEFR สำเร็จ');
      
      // Update local state to reflect the saved visit
      const savedPefrNum = draftPefr;
      setActivePatients(prev => prev.map(p => {
        if (p.hn === patient.hn) {
          return {
            ...p,
            todayVisit: {
              ...(p.todayVisit || { 
                  hn: patient.hn, 
                  visit_date: todayStr, 
                  controller: '', 
                  reliever: '', 
                  control_level: '', 
                  note: '', 
                  technique_check: '' 
              }),
              pefr: savedPefrNum,
              controller: p.todayVisit?.controller || '',
              control_level: p.todayVisit?.control_level || ''
            }
          };
        }
        return p;
      }));

    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSavingHn(null);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6 pb-20 animate-fade-up">
        {/* Skeleton Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
            <div className="h-4 w-64 skeleton-shimmer rounded mt-2" />
          </div>
        </div>
        {/* Skeleton Patient Rows */}
        <div className="space-y-3 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full skeleton-shimmer" />
                <div className="space-y-2">
                  <div className="h-5 w-40 skeleton-shimmer rounded" />
                  <div className="h-3 w-24 skeleton-shimmer rounded" />
                </div>
              </div>
              <div className="h-10 w-48 skeleton-shimmer rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#2D2A26] dark:text-white flex items-center gap-3">
            <Activity className="text-primary" size={32} />
            Record PEFR
          </h2>
          <p className="text-muted-foreground mt-1">
            ลงบันทึกค่าสมรรถภาพปอด (PEFR) ประจำวันที่ {new Date(todayStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric'})}
          </p>
        </div>
      </div>

      {/* 2. Walk-in / Search Bar */}
      <div className="bg-white/50 dark:bg-zinc-900/50 p-6 rounded-2xl border-2 border-border/50">
        <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
          <UserPlus size={16} className="text-primary"/> 
          เพิ่มผู้ป่วย Walk-in หรือมาผิดวันนัด
        </label>
        <div className="relative">
          <div className={`flex items-center bg-white dark:bg-zinc-800 border-2 rounded-xl px-4 py-1 transition-colors ${searchFocused ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
            <Search className={`transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล หรือ HN..."
              className="w-full bg-transparent border-none focus:ring-0 px-3 py-2 font-bold outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchTerm.trim().length > 0 && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-xl overflow-hidden"
              >
                {searchResults.map((p) => (
                  <div 
                    key={p.hn}
                    onClick={() => addWalkInPatient(p)}
                    className="px-4 py-3 hover:bg-secondary border-b border-border last:border-0 cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.prefix}{p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">HN: {p.hn} | ย้ายเป็นรายการวันนี้</div>
                    </div>
                    <Plus size={18} className="text-muted-foreground group-hover:text-primary" />
                  </div>
                ))}
              </motion.div>
            )}
            {searchTerm.trim().length > 0 && searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-xl p-4 text-center"
              >
                <div className="text-sm font-bold text-muted-foreground">ไม่พบผู้ป่วยที่สามารถเพิ่มได้ (หรือผู้ป่วยอยู่ในคิวแล้ว)</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Patient List for PEFR Recording */}
      <div className="space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          รายชื่อผู้ป่วยของวันนี้ <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{activePatients.length} คน</span>
        </h3>

        {activePatients.length === 0 ? (
          <div className="glass-card py-16 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
               <Activity size={32} className="text-muted-foreground/50" />
            </div>
            <p className="font-bold text-muted-foreground">ไม่มีผู้ป่วยสำหรับวันนี้</p>
            <p className="text-sm text-muted-foreground/70 mt-1">สามารถค้นหาและเพิ่มผู้ป่วย Walk-in ได้จากด้านบน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {activePatients.map((patient) => {
                const recordedPefr = patient.todayVisit?.pefr && patient.todayVisit.pefr !== '-' ? patient.todayVisit.pefr : null;
                const draftVal = pefrDrafts[patient.hn] ?? '';
                const isSaved = !!recordedPefr && (patient.todayVisit?.pefr?.toString() === draftVal);
                
                // Calculate percentage based on current input value or recorded value
                const valToCalc = Number(draftVal);
                let percentage = 0;
                if (!isNaN(valToCalc) && valToCalc > 0 && patient.predictedPefr > 0) {
                  percentage = Math.round((valToCalc / patient.predictedPefr) * 100);
                }

                return (
                  <motion.div
                    key={patient.hn}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass-card p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSaved ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' : 'border-border/50 hover:border-border'
                    }`}
                  >
                    {/* Patient Info */}
                    <div className="flex items-center gap-4">
                      {/* Status Icon Indicator */}
                      <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center shadow-inner ${
                        isSaved ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border-2 border-border'
                      }`}>
                        {isSaved ? <CheckCircle size={24} /> : <UserPlus size={24} />}
                      </div>

                      <div className="min-w-0">
                        <Link href={`/staff/patient/${patient.hn}`} className="hover:underline">
                          <h4 className="text-lg font-bold text-foreground truncate">
                            {patient.prefix}{patient.first_name} {patient.last_name}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">HN: {patient.hn}</span>
                          {patient.todayVisit ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                              <CheckCircle size={12} /> มี Visit Record แล้ว
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium text-xs">
                              <AlertTriangle size={12} /> ยังไม่มี Visit Record
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PEFR Input Area */}
                    <div className="flex flex-col md:items-end gap-2 md:max-w-md w-full">
                      <div className="flex w-full gap-2 items-center">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            max="900"
                            placeholder="ระบุค่า PEFR"
                            value={draftVal}
                            onChange={(e) => {
                              setPefrDrafts(prev => ({ ...prev, [patient.hn]: e.target.value }));
                            }}
                            className={`w-full text-lg font-black text-center pl-4 pr-12 py-3 rounded-xl border-2 transition-colors outline-none focus:ring-0 ${
                              isSaved ? 'bg-transparent border-primary/30 text-primary' : 'bg-white dark:bg-zinc-800 border-border focus:border-primary text-foreground'
                            }`}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                            L/min
                          </span>
                        </div>
                        
                        <button
                          disabled={savingHn === patient.hn || (isSaved && draftVal === patient.todayVisit?.pefr?.toString())}
                          onClick={() => handleSavePEFR(patient)}
                          className={`
                            shrink-0 h-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                            ${(isSaved && draftVal === patient.todayVisit?.pefr?.toString()) 
                              ? 'bg-secondary text-muted-foreground border-2 border-border/50 hover:bg-secondary shadow-none' 
                              : 'bg-primary text-white border-2 border-primary hover:-translate-y-0.5 hover:shadow-lg'}`}
                        >
                          {savingHn === patient.hn ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              {isSaved && draftVal === patient.todayVisit?.pefr?.toString() ? <CheckCircle size={18} /> : <Save size={18} />}
                              {isSaved && draftVal === patient.todayVisit?.pefr?.toString() ? 'บันทึกแล้ว' : 'บันทึก'}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Predicted Result Stats */}
                      <div className="flex items-center gap-2 px-1 text-sm pt-1 min-h-[24px]">
                        {patient.predictedPefr > 0 ? (
                          <>
                            <span className="text-muted-foreground text-xs font-medium">Predicted: <strong className="text-foreground">{patient.predictedPefr}</strong> L/min</span>
                            <span className="text-border">|</span>
                            {percentage > 0 ? (
                              <span className={`font-black ${percentage >= 80 ? 'text-green-600 dark:text-green-400' : percentage >= 50 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                                {percentage}% เทียบกับค่าอ้างอิง
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 italic text-xs">รอระบุผล...</span>
                            )}
                          </>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400 text-xs flex items-center gap-1 font-medium">
                            <AlertTriangle size={12}/> ไม่สามารถคำนวณ Predicted PEFR ได้ (ขาดอายุหรือส่วนสูง)
                          </span>
                        )}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
