"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FieldError, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Activity, CheckCircle, Stethoscope, FileText, ClipboardList, RefreshCw, Users } from 'lucide-react';
import { MDI_STEPS } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';




import { visitSchema } from '@/lib/schemas';

// 1. Schema Validation - MOVED TO lib/schemas.ts

type VisitFormValues = z.infer<typeof visitSchema>;

export default function RecordVisitPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [checklist, setChecklist] = useState<boolean[]>(new Array(8).fill(false));



  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      pefr: '',
      control_level: 'Well-controlled',
      controller: 'Seretide',
      reliever: 'Salbutamol',
      adherence: '100',
      drp: '-',
      advice: '-',
      technique_check: 'ไม่',
      technique_note: '-',
      note: '-',
      is_new_case: false,
      is_relative_pickup: false,
      no_pefr: false,
    }
  });

  // Watchers: เฝ้าดูค่าเพื่อทำ Logic อัตโนมัติ
  const isRelative = useWatch({ control, name: 'is_relative_pickup' });
  const noPefr = useWatch({ control, name: 'no_pefr' });
  const techniqueCheck = useWatch({ control, name: 'technique_check' });

  // Logic 1: ถ้าญาติมาแทน -> เทคนิคพ่นยาต้องเป็น "ไม่"
  useEffect(() => {
    if (isRelative) setValue('technique_check', 'ไม่');
  }, [isRelative, setValue]);

  // Logic 2: ถ้าไม่ได้เป่า -> เคลียร์ค่า PEFR
  useEffect(() => {
    if (noPefr) setValue('pefr', '');
  }, [noPefr, setValue]);

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/db?type=visits&hn=${params.hn}`);
        const data = await res.json();
        const history = data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (history.length > 0) {
          setValue('controller', history[0].controller || 'Seretide');
          setValue('reliever', history[0].reliever || 'Salbutamol');
        }
      } catch (err) { console.error(err); }
      finally { setFetchingHistory(false); }
    };
    fetchHistory();
  }, [params.hn, setValue]);

  const toggleCheck = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index] = !newChecklist[index];
    setChecklist(newChecklist);
  };

  const onSubmit = async (data: VisitFormValues) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const totalScore = checklist.filter(Boolean).length;
      const inhalerScore = data.technique_check === 'ทำ' ? totalScore.toString() : '-';

      const finalPefr = data.no_pefr ? "-" : data.pefr;
      let finalNote = data.note || "-";
      if (data.is_relative_pickup) {
        finalNote = finalNote === '-' || finalNote.trim() === '' ? 'ญาติรับยาแทน' : `${finalNote} (ญาติรับยาแทน)`;
      }

      const visitData = [
        params.hn, today, finalPefr, data.control_level, data.controller, data.reliever,
        data.adherence + '%', data.drp, data.advice, data.technique_check, data.next_appt || '',
        finalNote, data.is_new_case ? 'TRUE' : 'FALSE', inhalerScore
      ];

      const promises = [
        fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'visits', data: visitData }) })
      ];

      if (data.technique_check === 'ทำ') {
        const checklistData = [params.hn, today, ...checklist.map(c => c ? "1" : "0"), totalScore.toString(), data.technique_note || '-'];
        promises.push(fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'technique_checks', data: checklistData }) }));
      }

      await Promise.all(promises);
      toast.success("บันทึกเรียบร้อย!");

      router.push(`/staff/patient/${params.hn}`);
    } catch (e) {
      toast.error("Error saving data");

    } finally {
      setLoading(false);
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
        <div className="flex gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800 items-center">
          <div className="w-12 h-12 bg-primary flex items-center justify-center text-white border-2 border-border dark:border-zinc-700"><Activity size={24} /></div>
          <div><h1 className="text-xl font-black">บันทึกการตรวจรักษา</h1><p className="text-muted-foreground font-medium">HN: {params.hn}</p></div>

        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* 1. Clinical */}
          <div className="bg-[#F7F3ED] dark:bg-zinc-800/50 p-6 border border-[#3D3834]/20 rounded-lg space-y-4">
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
            <div className="flex justify-between">
              <h3 className="font-bold flex gap-2 text-primary"><Stethoscope size={18} /> 2. การใช้ยา</h3>

              {fetchingHistory && <span className="text-xs text-gray-400 animate-pulse flex gap-1"><RefreshCw size={12} className="animate-spin" /> กำลังดึงข้อมูล...</span>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="text-sm font-bold mb-2 block">Controller</label><select {...register("controller")} className={inputClass()}><option value="Seretide">Seretide</option><option value="Budesonide">Budesonide</option><option value="Symbicort">Symbicort</option><option value="Flixotide">Flixotide</option></select></div>
              <div><label className="text-sm font-bold mb-2 block">Reliever</label><select {...register("reliever")} className={inputClass()}><option value="Salbutamol">Salbutamol</option><option value="Berodual">Berodual</option><option value="Ventolin">Ventolin</option></select></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="text-sm font-bold mb-2 block">ความสม่ำเสมอ</label><input type="range" {...register("adherence")} min="0" max="100" step="10" className="w-full accent-[#D97736]" /></div>
              <div><label className="text-sm font-bold mb-2 block">DRP</label><input type="text" {...register("drp")} className={inputClass()} /></div>
            </div>
          </div>

          {/* 3. Technique */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex gap-2 text-primary"><ClipboardList size={18} /> 3. เทคนิคพ่นยา</h3>

              <select {...register("technique_check")} disabled={isRelative} className="px-3 py-1 border rounded bg-white dark:bg-zinc-800 disabled:opacity-50">
                <option value="ไม่">❌ ไม่ประเมิน</option><option value="ทำ">✅ ประเมิน</option>
              </select>
            </div>
            {techniqueCheck === 'ทำ' && (
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
            )}
          </div>

          {/* 4. Plan */}
          <div className="bg-orange-50 dark:bg-orange-900/10 p-6 border border-primary/30 rounded-lg space-y-4">
            <h3 className="font-bold flex gap-2 text-primary"><FileText size={18} /> 4. แผนการรักษา</h3>

            <div><label className="text-sm font-bold mb-2 block">คำแนะนำ</label><input type="text" {...register("advice")} className={inputClass()} /></div>
            <div><label className="text-sm font-bold mb-2 block">Note</label><textarea {...register("note")} rows={2} className={inputClass()} /></div>
            <div><label className="text-sm font-bold mb-2 block">วันนัดถัดไป</label><input type="date" {...register("next_appt")} className={inputClass()} /></div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-foreground text-background font-bold text-lg h-14 border-2 border-border shadow-[4px_4px_0px_0px_#888] hover:bg-primary hover:text-white hover:shadow-none active:translate-y-0.5 transition-all flex justify-center gap-2">
            {loading ? "กำลังบันทึก..." : <><Save size={20} /> บันทึกผล</>}
          </Button>

        </form>
      </div>
    </div>
  );
}
