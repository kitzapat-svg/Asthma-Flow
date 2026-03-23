"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm, FieldError, useWatch, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, AlertTriangle, ArrowLeft, Send, CheckCircle, Activity, LayoutDashboard, Search, FileText, Pill, Plus, X, Trash2, CalendarDays, RefreshCw, Stethoscope, Users, RefreshCcw, ClipboardList, Save, CalendarClock } from 'lucide-react';
import { MDI_STEPS } from '@/lib/types';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PatientContextBar } from '@/components/staff/patient-context-bar';
import { Patient } from '@/lib/types';
import { DRP_DATA, INTERVENTION_OPTIONS, OUTCOME_OPTIONS } from '@/lib/drp-data';
import { v4 as uuidv4 } from 'uuid';
import { getBangkokDateString, getBangkokISOString } from '@/lib/date-utils';
import { getUnresolvedDrps } from '@/lib/drp-helpers';
import { DRP } from '@/lib/types';




import { visitSchema } from '@/lib/schemas';

// 1. Schema Validation - MOVED TO lib/schemas.ts

type VisitFormValues = z.infer<typeof visitSchema> & {
  c1_name: string;
  c1_puffs: string;
  c1_freq: string;
  c2_name: string;
  c2_puffs: string;
  c2_freq: string;
  reliever_name: string;
  reliever_label: string;
  show_c2: boolean;
  medication_note: string;
  drpList: {
    category: string;
    type: string;
    cause: string;
    customCause: string;
    intervention: string;
    customIntervention: string;
    outcome: string;
    customOutcome: string;
    note?: string;
  }[];
};

export default function RecordVisitPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [checklist, setChecklist] = useState<boolean[]>(new Array(8).fill(false));
  const [medOptions, setMedOptions] = useState<{ controllers: string[], relievers: string[] }>({
    controllers: ['Seretide', 'Budesonide', 'Symbicort', 'Flixotide', 'Spiromax', 'Spiriva'],
    relievers: ['Salbutamol', 'Berodual']
  });
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestControlLevel, setLatestControlLevel] = useState<string>('');
  const [existingUnresolvedDrps, setExistingUnresolvedDrps] = useState<DRP[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null); // date being edited (null = today)
  const [appointmentInfo, setAppointmentInfo] = useState<{ scheduledDate: string; diffDays: number; type: 'early' | 'late' | 'on-time' } | null>(null);
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date'); // e.g. ?date=2026-01-15



  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      visit_date: getBangkokDateString(),
      pefr: '',
      control_level: 'Well-controlled',
      controller: 'Seretide',
      reliever: 'Salbutamol',
      adherence: '100',
      drp: '-', // Keep the old one for backward compatibility or submit '-'
      drpList: [],
      advice: '-',
      technique_check: 'ไม่',
      technique_note: '-',
      note: '-',
      medication_note: '-',
      is_new_case: false,
      is_relative_pickup: false,
      no_pefr: false,
      c1_name: 'Seretide', c1_puffs: '1', c1_freq: 'BID',
      c2_name: '', c2_puffs: '', c2_freq: 'OD',
      reliever_name: 'Salbutamol', reliever_label: '1 puff prn',
      show_c2: false,
    }
  });

  const { fields: drpFields, append: appendDrp, remove: removeDrp } = useFieldArray({
    control,
    name: "drpList"
  });

  const [autoFilled, setAutoFilled] = useState(false);
  const [resolvingDrp, setResolvingDrp] = useState<any | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  // Watchers: เฝ้าดูค่าเพื่อทำ Logic อัตโนมัติ
  const isRelative = useWatch({ control, name: 'is_relative_pickup' });
  const noPefr = useWatch({ control, name: 'no_pefr' });
  const techniqueCheck = useWatch({ control, name: 'technique_check' });
  const showC2 = useWatch({ control, name: 'show_c2' });
  const adherence = useWatch({ control, name: 'adherence' });

  // Watchers for Med Names (to hide usage if '-')
  const c1Name = useWatch({ control, name: 'c1_name' });
  const c2Name = useWatch({ control, name: 'c2_name' });
  const relieverName = useWatch({ control, name: 'reliever_name' });

  const clinicianNote = useWatch({ control, name: 'note' });
  const medNote = useWatch({ control, name: 'medication_note' });

  // Logic 1: ถ้าญาติมาแทน -> เทคนิคพ่นยาต้องเป็น "ไม่" และ ความร่วมมือเป็น "0"
  useEffect(() => {
    if (isRelative) {
      setValue('technique_check', 'ไม่');
      setValue('adherence', '0');
    }
  }, [isRelative, setValue]);

  // Logic 2: ถ้าไม่ได้เป่า -> เคลียร์ค่า PEFR
  useEffect(() => {
    if (noPefr) setValue('pefr', '');
  }, [noPefr, setValue]);

  // Fetch existing DRPs for alert banner
  const fetchExistingDrps = async () => {
    try {
      const res = await fetch(`/api/db?type=drps&hn=${params.hn}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const unresolved = getUnresolvedDrps(data);
        setExistingUnresolvedDrps(unresolved);
      }
    } catch (err) { console.error('Failed to fetch DRPs:', err); }
  };

  // Handler for resolving past DRPs
  const handleResolveDrp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resolvingDrp) return;
    const formData = new FormData(e.currentTarget);
    const intervention = formData.get('intervention') as string;
    const outcome = formData.get('outcome') as string;
    const note = formData.get('note') as string;

    if (!intervention || !outcome) {
      toast.error('กรุณาระบุการจัดการและผลลัพธ์');
      return;
    }

    setResolveLoading(true);
    try {
      const drpId = resolvingDrp.id || resolvingDrp.ID;
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'drp_update',
          id: drpId,
          data: { intervention, outcome, note }
        })
      });

      if (res.ok) {
        toast.success('อัพเดตสถานะ DRP สำเร็จ');
        setResolvingDrp(null);
        fetchExistingDrps();
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัพเดต DRP');
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setResolveLoading(false);
    }
  };

  // Fetch History & Latest Meds
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingHistory(true);
        setAutoFilled(false);
        // 1. Visits History
        const resVisit = await fetch(`/api/db?type=visits&hn=${params.hn}&t=${Date.now()}`, { cache: 'no-store' });
        const visitData = await resVisit.json();

        // Fetch Patient details for context bar
        const resPatient = await fetch(`/api/db?type=patients&hn=${params.hn}`);
        const patientData: Patient[] = await resPatient.json();
        const foundPatient = patientData.find(p => p.hn.replace(/\D/g, '') === (params.hn as string).replace(/\D/g, ''));
        if (foundPatient) setPatient(foundPatient);

        // 2. Latest Meds
        const resMed = await fetch(`/api/db?type=medications&hn=${params.hn}&t=${Date.now()}`, { cache: 'no-store' });
        const medData = await resMed.json();

        // 3. Med List Options
        const resList = await fetch('/api/medication-list');
        const listData = await resList.json();
        if (listData.controllers && listData.controllers.length > 0) {
          setMedOptions(prev => ({ ...prev, controllers: listData.controllers }));
        }
        if (listData.relievers && listData.relievers.length > 0) {
          setMedOptions(prev => ({ ...prev, relievers: listData.relievers }));
        }

        // Determine which date to check for existing visit
        const todayStr = getBangkokDateString();
        const targetDate = dateParam || todayStr;
        setValue('visit_date', targetDate);

        // Check appointment timing: compare today with the most recent previous visit's next_appt
        if (Array.isArray(visitData) && visitData.length > 0 && !dateParam) {
          const getDate = (v: any) => v.date || v.Date || '';
          const getNextAppt = (v: any) => v.next_appt || v['Next Appt'] || v['next appt'] || v.NextAppt || '';

          const sorted = [...visitData].sort((a: any, b: any) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
          // Find the most recent visit that is NOT today (to get its next_appt)
          const prevVisit = sorted.find((v: any) => getDate(v) !== todayStr);
          const nextApptValue = prevVisit ? getNextAppt(prevVisit) : '';
          
          console.log('[Appt Check] prevVisit date:', prevVisit ? getDate(prevVisit) : 'none', '| next_appt:', nextApptValue, '| today:', todayStr);
          
          if (prevVisit && nextApptValue) {
            const scheduled = new Date(nextApptValue);
            const today = new Date(todayStr);
            // Reset time parts to compare dates only
            scheduled.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const diffMs = today.getTime() - scheduled.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            console.log('[Appt Check] scheduled:', scheduled.toISOString(), '| diff:', diffDays, 'days');
            if (diffDays !== 0) {
              setAppointmentInfo({
                scheduledDate: nextApptValue,
                diffDays: Math.abs(diffDays),
                type: diffDays < 0 ? 'early' : 'late',
              });
            }
          }
        }

        // Check if there's already a visit for the target date
        if (Array.isArray(visitData)) {
          const targetVisit = visitData.find((v: any) => v.date === targetDate);
          if (targetVisit) {
            // Edit Mode — populate form with existing data
            setIsEditMode(true);
            setEditDate(targetDate);
            setValue('pefr', targetVisit.pefr === '-' ? '' : (targetVisit.pefr || ''));
            setValue('no_pefr', targetVisit.pefr === '-');
            setValue('control_level', targetVisit.control_level || 'Well Controlled');
            setValue('adherence', (targetVisit.adherence || '100%').replace('%', ''));
            setValue('advice', targetVisit.advice || '-');
            setValue('technique_check', targetVisit.technique_check || 'ไม่');
            setValue('next_appt', targetVisit.next_appt || '');
            setValue('note', targetVisit.note || '-');
            setValue('is_new_case', targetVisit.is_new_case === 'TRUE');

            // Parse inhaler score for technique checklist
            if (targetVisit.technique_check === 'ทำ') {
              // Fetch technique data for target date
              try {
                const resTech = await fetch(`/api/db?type=technique_checks&hn=${params.hn}`);
                const techData = await resTech.json();
                if (Array.isArray(techData)) {
                  const matchedTech = techData.find((t: any) => t.date === targetDate);
                  if (matchedTech) {
                    const steps = matchedTech.steps || [];
                    if (Array.isArray(steps) && steps.length === 8) {
                      setChecklist(steps.map((s: string) => s === '1'));
                    }
                    setValue('technique_note', matchedTech.note || '');
                  }
                }
              } catch { /* ignore */ }
            }

            if (dateParam) {
              toast.info(`✏️ แก้ไข Visit วันที่ ${new Date(targetDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`);
            } else {
              toast.info('📋 พบข้อมูลที่บันทึกไว้วันนี้ — โหมดแก้ไข');
            }

            // Load existing DRPs for this visit date
            try {
              const resDrps = await fetch(`/api/db?type=drps&hn=${params.hn}`);
              const drpsData = await resDrps.json();
              if (Array.isArray(drpsData)) {
                const visitDrps = drpsData.filter((d: any) => {
                  const dVisitDate = d.visit_date || d.VisitDate || '';
                  return dVisitDate === targetDate;
                });
                if (visitDrps.length > 0) {
                  // Clear existing drpList and populate with saved DRPs
                  setValue('drpList', visitDrps.map((d: any) => ({
                    category: d.category || d.Category || '',
                    type: d.type || d.Type || '',
                    cause: d.cause || d.Cause || '',
                    customCause: '',
                    intervention: d.intervention || d.Intervention || '',
                    customIntervention: '',
                    outcome: d.outcome || d.Outcome || '',
                    customOutcome: '',
                  })));
                }
              }
            } catch { /* ignore */ }
          }
        }

        // Set medication data (same logic, but meds also come from today's edit)
        if (medData && medData.date) {
          // Check if medData date is today — if yes, it's from today's visit
          setValue('c1_name', medData.c1_name || 'Seretide');
          setValue('c1_puffs', medData.c1_puffs || '1');
          setValue('c1_freq', medData.c1_freq || 'BID');

          if (medData.c2_name) {
            setValue('show_c2', true);
            setValue('c2_name', medData.c2_name);
            setValue('c2_puffs', medData.c2_puffs || '1');
            setValue('c2_freq', medData.c2_freq || 'OD');
          } else {
            setValue('show_c2', false);
            setValue('c2_name', '');
            setValue('c2_puffs', '');
            setValue('c2_freq', 'OD');
          }

          setValue('reliever_name', medData.reliever_name || 'Salbutamol');
          setValue('reliever_label', medData.reliever_label || '1 puff prn');
          // Only pre-fill medication note if this is actually the data for the target date (Edit Mode)
          const isSameDate = (medData.date === targetDate) || (medData.Date === targetDate);
          setValue('medication_note', isSameDate ? (medData.note || '') : '');
          setAutoFilled(true);
        } else {
          // Fallback to visit history
          if (Array.isArray(visitData) && visitData.length > 0) {
            const history = visitData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (history[0]) {
              setValue('c1_name', history[0].controller || 'Seretide');
              setValue('reliever_name', history[0].reliever || 'Salbutamol');
              setLatestControlLevel(history[0].control_level || '');
            }
          }
        }

      } catch (err) { console.error(err); }
      finally { setFetchingHistory(false); }
    };

    fetchData();
    fetchExistingDrps();
  }, [params.hn, setValue]);

  // Autosave Draft Logic
  useEffect(() => {
    const draftKey = `asthma_draft_${params.hn}`;
    // Save draft when notes change
    if (clinicianNote !== '-' || medNote !== '-') {
      const draftData = {
        note: clinicianNote,
        medication_note: medNote,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [clinicianNote, medNote, params.hn]);

  // Load Draft Logic on Mount
  useEffect(() => {
    const draftKey = `asthma_draft_${params.hn}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Only show toast if draft is younger than 24 hours and has content
        if (Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000) {
          if ((draftData.note && draftData.note !== '-') || (draftData.medication_note && draftData.medication_note !== '-')) {
            toast('พบข้อมูลร่างที่บันทึกไว้ค้างอยู่', {
              duration: 10000,
              action: {
                label: 'กู้คืนข้อมูล',
                onClick: () => {
                  if (draftData.note && draftData.note !== '-') setValue('note', draftData.note);
                  if (draftData.medication_note && draftData.medication_note !== '-') setValue('medication_note', draftData.medication_note);
                  toast.success('กู้คืนข้อมูลร่างเรียบร้อยแล้ว');
                }
              },
              cancel: {
                label: 'ลบทิ้ง',
                onClick: () => localStorage.removeItem(draftKey)
              }
            });
          }
        } else {
          localStorage.removeItem(draftKey); // Clear old drafts
        }
      } catch (e) {
        console.error("Failed to parse draft");
      }
    }
  }, [params.hn, setValue]);

  // Keyboard Shortcut (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser save dialog
        if (!loading) {
          handleSubmit(onSubmit)();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, loading]);

  const toggleCheck = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index] = !newChecklist[index];
    setChecklist(newChecklist);
  };

  const currentDrpList = useWatch({ control, name: 'drpList' });

  const onSubmit = async (data: VisitFormValues) => {
    setLoading(true);
    try {
      const originalDate = editDate || getBangkokDateString();
      const visitDate = data.visit_date;
      const totalScore = checklist.filter(Boolean).length;
      const inhalerScore = data.technique_check === 'ทำ' ? totalScore.toString() : '-';

      const finalPefr = data.no_pefr ? "-" : data.pefr;
      let finalNote = data.note || "-";
      if (data.is_relative_pickup) {
        finalNote = finalNote === '-' || finalNote.trim() === '' ? 'ญาติรับยาแทน' : `${finalNote} (ญาติรับยาแทน)`;
      }

      const finalAdherence = data.is_relative_pickup ? '0' : `${data.adherence}%`;

      const visitData = [
        params.hn, visitDate, finalPefr, data.control_level, data.c1_name, data.reliever_name,
        finalAdherence, data.drpList && data.drpList.length > 0 ? `${data.drpList.length} DRP(s)` : '-', data.advice, data.technique_check, data.next_appt || '',
        finalNote, data.is_new_case ? 'TRUE' : 'FALSE', inhalerScore
      ];

      const httpMethod = isEditMode ? 'PUT' : 'POST';

      const promises = [
        fetch('/api/db', {
          method: httpMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'visits', hn: params.hn, date: originalDate, data: visitData })
        })
      ];

      if (data.technique_check === 'ทำ') {
        const checklistData = [params.hn, visitDate, ...checklist.map(c => c ? "1" : "0"), totalScore.toString(), data.technique_note || '-'];
        promises.push(fetch('/api/db', {
          method: httpMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'technique_checks', hn: params.hn, date: originalDate, data: checklistData })
        }));
      }

      // Save Medications
      const medData = [
        params.hn,
        visitDate,
        data.c1_name, data.c1_puffs, data.c1_freq,
        data.show_c2 ? data.c2_name : "", data.show_c2 ? data.c2_puffs : "", data.show_c2 ? data.c2_freq : "",
        data.reliever_name, data.reliever_label,
        data.medication_note || '-'
      ];
      promises.push(fetch('/api/db', {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'medications', hn: params.hn, date: originalDate, data: medData })
      }));

      // Save DRPs
      if (data.drpList && data.drpList.length > 0) {
        for (const drp of data.drpList) {
          const drpId = uuidv4();
          const finalCause = drp.cause === "อื่นๆ (ระบุ)..." ? `อื่นๆ: ${drp.customCause || '-'}` : (drp.cause || '-');
          const finalIntervention = drp.intervention === "อื่นๆ (ระบุ)..." ? `อื่นๆ: ${drp.customIntervention || '-'}` : (drp.intervention || '-');
          const finalOutcome = drp.outcome === "อื่นๆ (ระบุ)..." ? `อื่นๆ: ${drp.customOutcome || '-'}` : (drp.outcome || '-');

          // [ID, HN, Date, Visit_Date, Category, Type, Cause, Intervention, Outcome, Note]
          const drpRow = [
            drpId,
            params.hn,
            getBangkokISOString(),
            visitDate,
            drp.category || '-',
            drp.type || '-',
            finalCause,
            finalIntervention,
            finalOutcome,
            drp.note || '-'
          ];
          promises.push(fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'drps', data: drpRow }) }));
        }
      }

      await Promise.all(promises);

      // Save advice to staff_advice sheet if non-empty (only on new visits, not edits)
      if (data.advice && data.advice.trim() !== '' && data.advice.trim() !== '-') {
        try {
          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'advice',
              data: [params.hn, data.advice.trim()],
            }),
          });
        } catch { /* ignore — visit save already succeeded */ }
      }

      // Optimistic success feedback
      setSaveSuccess(true);
      toast.success(isEditMode ? 'อัพเดตข้อมูลเรียบร้อย!' : 'บันทึกเรียบร้อย!');

      // Clear draft on successful save
      localStorage.removeItem(`asthma_draft_${params.hn}`);

      // Brief delay to show success state before navigating
      setTimeout(() => {
        router.push(`/staff/patient/${params.hn}`);
      }, 400);
    } catch (e) {
      toast.error("Error saving data");

    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async () => {
    const originalDate = editDate || getBangkokDateString();
    if (!confirm(`⚠️ ยืนยันการลบประวัติการตรวจของวันที่ ${originalDate} ใช่หรือไม่?\n\nข้อมูลการตรวจ ยาที่ใช้ เทคนิคพ่นยา และ DRP ของวันนี้จะถูกลบทิ้งทั้งหมดและไม่สามารถกู้คืนได้`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/db?type=visit_entry&hn=${params.hn}&date=${originalDate}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete visit');
      toast.success('ลบประวัติการตรวจเรียบร้อยแล้ว');
      router.push(`/staff/patient/${params.hn}`);
    } catch (e) {
      toast.error('ไม่สามารถลบประวัติการตรวจได้');
      setIsDeleting(false);
    }
  };

  const inputClass = (err?: FieldError) => `w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 ${err ? 'border-red-500' : 'border-border dark:border-zinc-600'} focus:border-primary outline-none font-bold dark:text-white transition-colors`;



  return (
    <div className="min-h-screen bg-background dark:bg-black p-6 pb-20 font-sans text-foreground dark:text-white transition-colors duration-300">
      <nav className="max-w-3xl mx-auto mb-8 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()} className="flex gap-2 font-bold hover:text-primary">
          <ArrowLeft size={20} /> ยกเลิก
        </Button>


      </nav>

      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border-2 border-border dark:border-zinc-800 shadow-[8px_8px_0px_0px_var(--border)] dark:shadow-none p-8">
        <PatientContextBar patient={patient} latestControlLevel={latestControlLevel} />

        {/* Appointment Timing Alert Banner */}
        {appointmentInfo && (
          <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 animate-in fade-in border-2 ${
            appointmentInfo.type === 'early'
              ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700'
              : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'
          }`}>
            <div className={`p-2 rounded-lg shrink-0 text-white ${
              appointmentInfo.type === 'early' ? 'bg-sky-500' : 'bg-rose-500'
            }`}>
              <CalendarClock size={18} />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${
                appointmentInfo.type === 'early'
                  ? 'text-sky-800 dark:text-sky-300'
                  : 'text-rose-800 dark:text-rose-300'
              }`}>
                {appointmentInfo.type === 'early'
                  ? `📅 ผู้ป่วยมาก่อนนัด ${appointmentInfo.diffDays} วัน`
                  : `📅 ผู้ป่วยมาหลังนัด ${appointmentInfo.diffDays} วัน`}
              </h4>
              <p className={`text-xs mt-0.5 ${
                appointmentInfo.type === 'early'
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                วันนัดเดิม: {new Date(appointmentInfo.scheduledDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Editing old visit info banner */}
        {isEditMode && editDate && editDate !== getBangkokDateString() && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-6 flex items-center gap-3 animate-in fade-in">
            <div className="bg-blue-500 text-white p-2 rounded-lg shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                ✏️ กำลังแก้ไข Visit วันที่ {new Date(editDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">ข้อมูลจะถูกอัพเดตไปยังแถวเดิมในฐานข้อมูล</p>
            </div>
          </div>
        )}

        {/* Unresolved DRP Warning Banner */}
        {existingUnresolvedDrps.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3 animate-in fade-in">
            <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                ⚠️ ผู้ป่วยรายนี้มี DRP ค้างอยู่ {existingUnresolvedDrps.length} รายการ
              </h4>
              <ul className="mt-2 space-y-2">
                {existingUnresolvedDrps.slice(0, 5).map((drp: any, i) => {
                  const drpType = drp.type || drp.Type || '-';
                  const drpCause = drp.cause || drp.Cause || '-';
                  const drpIntervention = drp.intervention || drp.Intervention || '-';
                  const drpOutcome = drp.outcome || drp.Outcome || '';
                  const drpNote = drp.note || drp.Note || '';
                  const drpVisitDate = drp.visit_date || drp.visitdate || drp.VisitDate || drp.date || drp.Date || '';
                  const dateDisplay = drpVisitDate ? new Date(drpVisitDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-';
                  return (
                    <li key={drp.id || drp.ID || i} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 rounded-md p-2 flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            {drpType}
                          </div>
                          <span className="text-[10px] font-bold bg-amber-200/50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                            📅 {dateDisplay}
                          </span>
                        </div>
                        <div className="ml-3 mt-1 space-y-0.5 text-amber-600 dark:text-amber-500">
                          <div>สาเหตุ: <span className="font-semibold">{drpCause}</span></div>
                          <div>การจัดการ: <span className="font-semibold">{drpIntervention}</span></div>
                          {drpOutcome && drpOutcome !== '-' && <div>ผลลัพธ์: <span className="font-semibold">{drpOutcome}</span></div>}
                          {drpNote && drpNote !== '-' && (
                            <div className="mt-1 pt-1 border-t border-amber-200/50 dark:border-amber-800/50 text-amber-700/80 dark:text-amber-400/80 italic">
                              <span className="font-medium not-italic">Note:</span> {drpNote}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResolvingDrp(drp)}
                        className="self-end md:self-stretch mt-2 md:mt-0 shrink-0 bg-white dark:bg-zinc-800 border-2 border-amber-300 dark:border-amber-700 hover:border-amber-500 text-amber-700 dark:text-amber-400 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <AlertCircle size={14} className="text-amber-500" /> อัพเดตสถานะ
                      </button>
                    </li>
                  );
                })}
                {existingUnresolvedDrps.length > 5 && (
                  <li className="text-xs text-amber-600 font-bold ml-3">...และอีก {existingUnresolvedDrps.length - 5} รายการ</li>
                )}
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">กรุณาตรวจสอบและติดตามผลในครั้งนี้</p>
            </div>
          </div>
        )}

        {/* Resolve DRP Modal */}
        {resolvingDrp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-700 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none w-full max-w-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-[#D97736] p-4 text-white flex justify-between items-center shrink-0 border-b-2 border-[#3D3834]">
                <h3 className="font-black flex items-center gap-2">
                  <AlertCircle size={20} /> อัพเดตสถานะ DRP
                </h3>
                <button type="button" onClick={() => setResolvingDrp(null)} className="hover:bg-white/20 p-1 rounded-md transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded border border-amber-200 dark:border-amber-800 mb-5 text-sm space-y-1">
                  <div className="font-bold text-amber-800 dark:text-amber-600">{resolvingDrp.type || resolvingDrp.Type}</div>
                  <div className="text-amber-700 dark:text-amber-500 text-xs">สาเหตุ: {resolvingDrp.cause || resolvingDrp.Cause}</div>
                </div>

                <form id="resolve-drp-form" onSubmit={handleResolveDrp} className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-[#3D3834] dark:text-white block mb-1">ผลลัพธ์ใหม่ (Outcome) <span className="text-red-500">*</span></label>
                    <select
                      name="outcome"
                      defaultValue={resolvingDrp.outcome || resolvingDrp.Outcome || ''}
                      className={inputClass()}
                      required
                    >
                      <option value="">-- เลือกผลลัพธ์ --</option>
                      {OUTCOME_OPTIONS.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#3D3834] dark:text-white block mb-1">การจัดการ (Intervention) <span className="text-red-500">*</span></label>
                    <select
                      name="intervention"
                      defaultValue={resolvingDrp.intervention || resolvingDrp.Intervention || ''}
                      className={inputClass()}
                      required
                    >
                      <option value="">-- เลือกการจัดการ --</option>
                      {INTERVENTION_OPTIONS.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#3D3834] dark:text-white block mb-1">บันทึกเพิ่มเติม (Note)</label>
                    <textarea
                      name="note"
                      defaultValue={resolvingDrp.note || resolvingDrp.Note === '-' ? '' : resolvingDrp.note || resolvingDrp.Note || ''}
                      placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                      className={`${inputClass()} resize-none h-20`}
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-t-2 border-[#3D3834]/20 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setResolvingDrp(null)}
                  className="px-4 py-2 text-sm font-bold border-2 border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="resolve-drp-form"
                  disabled={resolveLoading}
                  className="px-4 py-2 text-sm font-bold border-2 border-[#3D3834] rounded bg-[#D97736] text-white hover:bg-[#c2652a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {resolveLoading && <RefreshCw size={14} className="animate-spin" />}
                  บันทึกการอัพเดต
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800 items-center">
          <div className="w-12 h-12 bg-primary flex items-center justify-center text-white border-2 border-border dark:border-zinc-700"><Activity size={24} /></div>
          <div><h1 className="text-xl font-black">บันทึกการตรวจรักษา</h1><p className="text-muted-foreground font-medium">HN: {params.hn}</p></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* 1. Clinical */}
          <div className="bg-[#F7F3ED] dark:bg-zinc-800/50 p-6 border border-[#3D3834]/20 rounded-lg space-y-4">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#3D3834]/10 dark:border-zinc-700/50">
              <h3 className="font-bold flex gap-2 text-[#D97736]"><CalendarDays size={18} /> วันที่รับบริการ</h3>
              <div className="w-48">
                <input
                  type="date"
                  {...register("visit_date")}
                  className={inputClass(errors.visit_date)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-bold flex gap-2 text-primary"><Activity size={18} /> 1. การประเมินผล</h3>
              <label className="flex gap-2 cursor-pointer bg-white dark:bg-zinc-900 px-3 py-1 rounded border hover:border-primary">
                <input type="checkbox" {...register("is_relative_pickup")} className="accent-primary" />

                <span className="text-sm font-bold flex gap-1"><Users size={14} /> ญาติรับยาแทน</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold">ค่า PEFR <span className="text-red-500">*</span></label>
                  <label className="flex gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" {...register("no_pefr")} className="accent-primary" /> ไม่ได้เป่า (N/A)

                  </label>
                </div>
                <input type="number" {...register("pefr")} disabled={noPefr} placeholder={noPefr ? "-" : "000"} className={`${inputClass(errors.pefr)} text-center text-xl ${noPefr ? 'opacity-50 cursor-not-allowed' : ''}`} />
                {errors.pefr && <p className="text-red-500 text-xs mt-1 font-bold">{errors.pefr.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">ระดับการควบคุม</label>
                <select {...register("control_level")} className={inputClass()}>
                  <option value="Well-controlled">🟢 Well-controlled</option>
                  <option value="Partly Controlled">🟡 Partly Controlled</option>
                  <option value="Uncontrolled">🔴 Uncontrolled</option>
                </select>
              </div>
            </div>
            <label className="flex gap-2 cursor-pointer mt-2">
              <input type="checkbox" {...register("is_new_case")} className="accent-primary w-5 h-5" />

              <span className="font-bold text-sm">ผู้ป่วยรายใหม่ (New Case)</span>
            </label>
          </div>

          {/* 2. Medication */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold flex gap-2 text-primary"><Stethoscope size={18} /> 2. การใช้ยา</h3>
                {autoFilled && !fetchingHistory && (
                  <span className="text-xs text-green-600 font-bold flex gap-1 animate-in fade-in slide-in-from-left-2 ml-6">
                    ✨ ระบบดึงรายการยาจากครั้งล่าสุดมาให้แล้ว
                  </span>
                )}
              </div>

              {fetchingHistory && <span className="text-xs text-gray-400 animate-pulse flex gap-1"><RefreshCw size={12} className="animate-spin" /> กำลังดึงข้อมูล...</span>}
            </div>
            <div className="grid gap-6">
              {/* Controller 1 */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <label className="text-sm font-bold mb-2 block text-blue-800 dark:text-blue-300">Controller 1 (ยาควบคุมหลัก)</label>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 md:col-span-6">
                    <select {...register("c1_name")} className={inputClass()}>
                      <option value="-">- (No Medication)</option>
                      {medOptions.controllers.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                  </div>
                  {c1Name !== '-' && (
                    <>
                      <div className="col-span-3 md:col-span-3 relative">
                        <input type="number" {...register("c1_puffs")} placeholder="#" className={inputClass()} />
                        <span className="absolute right-3 top-3 text-sm text-gray-400">puffs</span>
                      </div>
                      <div className="col-span-3 md:col-span-3">
                        <select {...register("c1_freq")} className={inputClass()}><option value="OD">OD</option><option value="BID">BID</option></select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Controller 2 (Optional) */}
              {showC2 ? (
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 relative animate-in slide-in-from-top-2">
                  <button type="button" onClick={() => setValue('show_c2', false)} className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700 font-bold">❌ ลบ</button>
                  <label className="text-sm font-bold mb-2 block text-indigo-800 dark:text-indigo-300">Controller 2 (ยาควบคุมเสริม)</label>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 md:col-span-6">
                      <select {...register("c2_name")} className={inputClass()}>
                        <option value="-">- (No Medication)</option>
                        {medOptions.controllers.map((m, i) => <option key={i} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {c2Name !== '-' && (
                      <>
                        <div className="col-span-3 md:col-span-3 relative">
                          <input type="number" {...register("c2_puffs")} placeholder="#" className={inputClass()} />
                          <span className="absolute right-3 top-3 text-sm text-gray-400">puffs</span>
                        </div>
                        <div className="col-span-3 md:col-span-3">
                          <select {...register("c2_freq")} className={inputClass()}><option value="OD">OD</option><option value="BID">BID</option></select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setValue('show_c2', true)} className="text-sm text-primary font-bold hover:underline text-left">+ เพิ่ม Controller ตัวที่ 2</button>
              )}

              {/* Reliever */}
              <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-800">
                <label className="text-sm font-bold mb-2 block text-green-800 dark:text-green-300">Reliever (ยาบรรเทาอาการ)</label>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 md:col-span-6">
                    <select {...register("reliever_name")} className={inputClass()}>
                      <option value="-">- (No Medication)</option>
                      {medOptions.relievers.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                  </div>
                  {relieverName !== '-' && (
                    <div className="col-span-6 md:col-span-6">
                      <input type="text" {...register("reliever_label")} placeholder="วิธีใช้ (Ex. 1 puff prn)" className={inputClass()} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mt-6 items-start">
              {/* Left Column: Adherence & Note */}
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <label className="text-sm font-bold mb-2 flex justify-between">
                    ความสม่ำเสมอ
                    <span className={isRelative ? "text-muted-foreground" : "text-[#D97736]"}>
                      {isRelative ? 'ไม่ได้ประเมิน' : `${adherence}%`}
                    </span>
                  </label>
                  <input 
                    type="range" 
                    {...register("adherence")} 
                    disabled={isRelative}
                    min="0" 
                    max="100" 
                    step="10" 
                    className={`w-full ${isRelative ? 'accent-gray-400 cursor-not-allowed opacity-50' : 'accent-[#D97736]'}`} 
                  />
                </div>
                <div className="mt-auto pt-8">
                  <label className="text-sm font-bold mb-2 block">Note (Medication/DRP)</label>
                  <input type="text" {...register("medication_note")} className={inputClass()} />
                </div>
              </div>

              {/* Right Column: DRP */}
              <div className="flex flex-col gap-3">
                <div className="border-t border-[#3D3834]/30 dark:border-zinc-700 w-full mb-2"></div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2 text-[#D97736]">DRP (Drug-Related Problems)</h4>
                  <button type="button" onClick={() => appendDrp({ category: '', type: '', cause: '', customCause: '', intervention: '', customIntervention: '', outcome: '', customOutcome: '', note: '' })} className="text-xs font-bold px-3 py-1.5 border-2 border-[#3D3834] dark:border-zinc-600 bg-white dark:bg-zinc-800 text-[#2D2A26] dark:text-white shadow-[2px_2px_0px_0px_#3D3834] dark:shadow-none hover:bg-gray-50 transition-all active:translate-y-px active:shadow-none">
                    + เพิ่ม DRP
                  </button>
                </div>

                {drpFields.map((field, index) => {
                  const selectedCategory = DRP_DATA.find(c => c.name === currentDrpList?.[index]?.category);
                  const selectedType = selectedCategory?.types.find(t => t.name === currentDrpList?.[index]?.type);

                  return (
                    <div key={field.id} className="p-4 border-2 border-[#3D3834]/20 rounded-md bg-white dark:bg-zinc-900 relative space-y-3">
                      <button type="button" onClick={() => removeDrp(index)} className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700 font-bold">❌ ลบ</button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold mb-1 block">หมวดหมู่ (Category)</label>
                          <select {...register(`drpList.${index}.category`)} className="w-full px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800">
                            <option value="">-- เลือกหมวดหมู่ --</option>
                            {DRP_DATA.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-1 block">ปัญหา (Type)</label>
                          <select {...register(`drpList.${index}.type`)} disabled={!selectedCategory} className="w-full px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800 disabled:opacity-50">
                            <option value="">-- เลือกปัญหา --</option>
                            {selectedCategory?.types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs font-bold mb-1 block">สาเหตุ (Cause)</label>
                          <select {...register(`drpList.${index}.cause`)} disabled={!selectedType} className="w-full px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800 disabled:opacity-50">
                            <option value="">-- เลือกสาเหตุ --</option>
                            {selectedType?.causes.map((cause, i) => <option key={i} value={cause}>{cause}</option>)}
                          </select>
                          {currentDrpList?.[index]?.cause === "อื่นๆ (ระบุ)..." && (
                            <input type="text" {...register(`drpList.${index}.customCause`)} placeholder="ระบุสาเหตุอื่นๆ..." className="w-full mt-2 px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 mt-3 border-t border-dashed border-[#3D3834]/20">
                        <div>
                          <label className="text-xs font-bold mb-1 block">การจัดการ (Intervention)</label>
                          <select {...register(`drpList.${index}.intervention`)} className="w-full px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800">
                            <option value="">-- เลือกการจัดการ --</option>
                            {INTERVENTION_OPTIONS.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                          </select>
                          {currentDrpList?.[index]?.intervention === "อื่นๆ (ระบุ)..." && (
                            <input type="text" {...register(`drpList.${index}.customIntervention`)} placeholder="ระบุการจัดการอื่นๆ..." className="w-full mt-2 px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800" />
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-1 block">ผลลัพธ์ (Outcome)</label>
                          <select {...register(`drpList.${index}.outcome`)} className="w-full px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800">
                            <option value="">-- เลือกผลลัพธ์ --</option>
                            {OUTCOME_OPTIONS.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                          </select>
                          {currentDrpList?.[index]?.outcome === "อื่นๆ (ระบุ)..." && (
                            <input type="text" {...register(`drpList.${index}.customOutcome`)} placeholder="ระบุผลลัพธ์อื่นๆ..." className="w-full mt-2 px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800" />
                          )}
                        </div>

                        <div className="md:col-span-2 mt-2">
                          <label className="text-xs font-bold mb-1 block">บันทึกเพิ่มเติม (Note)</label>
                          <textarea {...register(`drpList.${index}.note`)} rows={2} placeholder="ระบุรายละเอียดเพิ่มเติม..." className="w-full px-3 py-2 text-sm border-2 border-[#3D3834]/20 focus:border-[#D97736] outline-none rounded bg-white dark:bg-zinc-800 resize-none" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {drpFields.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-[#3D3834]/30 rounded text-muted-foreground text-sm font-bold">
                    ไม่มีปัญหา DRP ในครั้งนี้
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Technique */}
          < div className="border-t pt-6 space-y-4" >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="font-bold flex gap-2 text-primary"><ClipboardList size={18} /> 3. เทคนิคพ่นยา</h3>
                {techniqueCheck === 'ทำ' && (
                  <span className={`text-sm font-bold px-3 py-0.5 rounded-full border ${checklist.filter(Boolean).length >= 7 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    คะแนน: {checklist.filter(Boolean).length} / 8
                  </span>
                )}
              </div>

              <select {...register("technique_check")} disabled={isRelative} className="px-3 py-1 border rounded bg-white dark:bg-zinc-800 disabled:opacity-50">
                <option value="ไม่">❌ ไม่ประเมิน</option><option value="ทำ">✅ ประเมิน</option>
              </select>
            </div>
            {
              techniqueCheck === 'ทำ' && (
                <div className="bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-700 p-4 rounded-lg space-y-3 animate-in fade-in">
                  {MDI_STEPS.map((step, index) => (

                    <label key={index} className="flex gap-3 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${checklist[index] ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                        <input type="checkbox" className="hidden" checked={checklist[index]} onChange={() => toggleCheck(index)} />
                        {checklist[index] && <CheckCircle size={16} className="text-white" />}
                      </div>
                      <span className={`text-sm ${checklist[index] ? 'text-primary font-bold' : 'text-muted-foreground dark:text-zinc-400'}`}>{step}</span>

                    </label>
                  ))}
                  <textarea {...register("technique_note")} rows={2} placeholder="บันทึกเพิ่มเติม..." className="w-full mt-2 p-2 border rounded dark:bg-zinc-800 dark:text-white" />
                </div>
              )
            }
          </div >

          {/* 4. Plan */}
          < div className="bg-orange-50 dark:bg-orange-900/10 p-6 border border-primary/30 rounded-lg space-y-4" >
            <h3 className="font-bold flex gap-2 text-primary"><FileText size={18} /> 4. แผนการรักษา</h3>

            <div><label className="text-sm font-bold mb-2 block">คำแนะนำ</label><input type="text" {...register("advice")} className={inputClass()} /></div>
            <div><label className="text-sm font-bold mb-2 block">Note</label><textarea {...register("note")} rows={2} className={inputClass()} /></div>
            <div><label className="text-sm font-bold mb-2 block">วันนัดถัดไป</label><input type="date" {...register("next_appt")} className={inputClass()} /></div>
          </div >

          <div className="flex gap-4">
            {isEditMode && session?.user && (session.user as any).role === 'Admin' && (
              <Button type="button" onClick={handleDeleteVisit} disabled={loading || saveSuccess || isDeleting} className="w-1/3 font-bold text-lg h-14 border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-800 dark:text-red-400 transition-all flex justify-center gap-2">
                 {isDeleting ? <><RefreshCw size={20} className="animate-spin" /> กำลังลบ...</> : <><Trash2 size={20} /> ลบ Visit นี้</>}
              </Button>
            )}
            <Button type="submit" disabled={loading || saveSuccess || isDeleting} className={`flex-1 font-bold text-lg h-14 border-2 border-border transition-all flex justify-center gap-2 ${saveSuccess ? 'bg-green-600 text-white shadow-none border-green-700' : isEditMode ? 'bg-amber-600 text-white shadow-[4px_4px_0px_0px_#888] hover:bg-amber-700 hover:shadow-none active:translate-y-0.5' : 'bg-foreground text-background shadow-[4px_4px_0px_0px_#888] hover:bg-primary hover:text-white hover:shadow-none active:translate-y-0.5'}`}>
              {saveSuccess ? <><CheckCircle size={20} className="animate-pulse" /> {isEditMode ? 'อัพเดตสำเร็จ!' : 'บันทึกสำเร็จ!'}</> : loading ? <><RefreshCw size={20} className="animate-spin" /> กำลังบันทึก...</> : isEditMode ? <><Save size={20} /> อัพเดตข้อมูลวันนี้</> : <><Save size={20} /> บันทึกผล</>}
            </Button>
          </div>

        </form >
      </div >
    </div >
  );
}
