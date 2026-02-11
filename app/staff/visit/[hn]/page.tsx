"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Activity, CheckCircle, Stethoscope, FileText, ClipboardList, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface VisitData {
  hn: string;
  date: string;
  controller: string;
  reliever: string;
}

export default function RecordVisitPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  
  const mdiSteps = [
    "1. เขย่าหลอดพ่นยาในแนวตั้ง 3-4 ครั้ง",
    "2. ถือหลอดพ่นยาในแนวตั้ง",
    "3. หายใจออกทางปากให้สุดเต็มที่",
    "4. ตั้งศีรษะให้ตรง",
    "5. ใช้ริมฝีปากอมปากหลอดพ่นยาให้สนิท",
    "6. หายใจเข้าทางปากช้าๆ ลึกๆ พร้อมกับกดที่พ่นยา 1 ครั้ง",
    "7. กลั้นลมหายใจประมาณ 10 วินาที",
    "8. ผ่อนลมหายใจออกทางปากหรือจมูกช้าๆ"
  ];

  const [checklist, setChecklist] = useState<boolean[]>(new Array(8).fill(false));

  const [formData, setFormData] = useState({
    pefr: '',
    control_level: 'Well-controlled',
    controller: 'Seretide',
    reliever: 'Salbutamol',
    adherence: '100',
    drp: '-',
    advice: '-',
    technique_check: 'ไม่',
    technique_note: '-', // <--- เพิ่ม state เก็บ Note ของเทคนิค
    next_appt: '',
    note: '-',
    is_new_case: 'FALSE',
  });

  useEffect(() => {
    const fetchLastMedication = async () => {
        try {
            const res = await fetch('/api/db?type=visits');
            const data: VisitData[] = await res.json();
            const history = data
                .filter(v => v.hn === params.hn)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (history.length > 0) {
                const lastVisit = history[0];
                setFormData(prev => ({
                    ...prev,
                    controller: lastVisit.controller || 'Seretide',
                    reliever: lastVisit.reliever || 'Salbutamol'
                }));
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setFetchingHistory(false);
        }
    };
    fetchLastMedication();
  }, [params.hn]);

  const totalScore = checklist.filter(Boolean).length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCheck = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index] = !newChecklist[index];
    setChecklist(newChecklist);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const inhalerScore = formData.technique_check === 'ทำ' ? totalScore.toString() : '-';

      const visitData = [
        params.hn,
        today,
        formData.pefr,
        formData.control_level,
        formData.controller,
        formData.reliever,
        formData.adherence + '%',
        formData.drp,
        formData.advice,
        formData.technique_check,
        formData.next_appt,
        formData.note,
        formData.is_new_case,
        inhalerScore
      ];

      // เพิ่ม technique_note ลงไปท้ายสุด
      const checklistData = [
        params.hn,
        today,
        ...checklist.map(checked => checked ? "1" : "0"),
        totalScore.toString(),
        formData.technique_note // <--- ส่ง Note ไปบันทึก
      ];

      const promises = [
        fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'visits', data: visitData })
        })
      ];

      if (formData.technique_check === 'ทำ') {
        promises.push(
            fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'technique_checks', data: checklistData })
            })
        );
      }

      const [resVisit] = await Promise.all(promises);

      if (resVisit.ok) {
        alert("บันทึกเรียบร้อย!");
        router.push(`/staff/patient/${params.hn}`);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error(error);
      alert("เชื่อมต่อ Server ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      <nav className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors">
          <ArrowLeft size={20} /> ยกเลิก
        </button>
        <ThemeToggle />
      </nav>

      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-8 transition-colors">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
           <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700">
              <Activity size={24} />
           </div>
           <div>
              <h1 className="text-xl font-black">บันทึกการตรวจรักษา (Visit)</h1>
              <p className="text-[#6B6560] dark:text-zinc-400 font-medium">HN: {params.hn}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[#F7F3ED] dark:bg-zinc-800/50 p-6 border border-[#3D3834]/20 dark:border-zinc-700 rounded-lg space-y-4">
             <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><Activity size={18}/> 1. การประเมินผล (Clinical)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ค่า PEFR (L/min) <span className="text-red-500">*</span></label>
                    <input type="number" name="pefr" required className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] outline-none font-black text-xl text-center dark:text-white" value={formData.pefr} onChange={handleChange} placeholder="000" />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">ระดับการควบคุม</label>
                    <select name="control_level" value={formData.control_level} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none font-bold dark:text-white">
                        <option value="Well-controlled">🟢 Well-controlled</option>
                        <option value="Partly Controlled">🟡 Partly Controlled</option>
                        <option value="Uncontrolled">🔴 Uncontrolled</option>
                    </select>
                </div>
             </div>
             <div className="flex items-center gap-4 pt-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_new_case === 'TRUE'} onChange={(e) => setFormData({...formData, is_new_case: e.target.checked ? 'TRUE' : 'FALSE'})} className="w-5 h-5 accent-[#D97736]" />
                    <span className="font-bold text-sm dark:text-zinc-300">ผู้ป่วยรายใหม่ (New Case)</span>
                 </label>
             </div>
          </div>

          <div className="space-y-4 relative">
             <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><Stethoscope size={18}/> 2. การใช้ยา (Medication)</h3>
                {fetchingHistory && <span className="text-xs text-gray-400 flex items-center gap-1 animate-pulse"><RefreshCw size={12} className="animate-spin"/> กำลังดึงข้อมูลยาเดิม...</span>}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ยาควบคุม (Controller)</label>
                    <select name="controller" value={formData.controller} onChange={handleChange} className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-all">
                        <option value="-">-</option>
                        <option value="Seretide">Seretide</option>
                        <option value="Budesonide">Budesonide</option>
                        <option value="Symbicort">Symbicort</option> 
                        <option value="Flixotide">Flixotide</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">ยาบรรเทา (Reliever)</label>
                    <select name="reliever" value={formData.reliever} onChange={handleChange} className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-all">
                        <option value="-">-</option>
                        <option value="Salbutamol">Salbutamol</option>
                        <option value="Berodual">Berodual</option>
                        <option value="Ventolin">Ventolin</option>
                    </select>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ความสม่ำเสมอ ({formData.adherence}%)</label>
                    <input type="range" name="adherence" min="0" max="100" step="10" className="w-full accent-[#D97736]" value={formData.adherence} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">ปัญหาการใช้ยา (DRP)</label>
                    <input type="text" name="drp" value={formData.drp} onChange={handleChange} className="w-full px-4 py-2 bg-[#F7F3ED] dark:bg-zinc-800 border border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white" />
                </div>
             </div>
          </div>

          <div className="space-y-4 border-t border-gray-200 dark:border-zinc-800 pt-6">
             <div className="flex justify-between items-center">
                 <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><ClipboardList size={18}/> 3. เทคนิคพ่นยา MDI</h3>
                 <select name="technique_check" value={formData.technique_check} onChange={handleChange} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded text-sm cursor-pointer">
                    <option value="ไม่">❌ ไม่ประเมิน</option>
                    <option value="ทำ">✅ ประเมิน</option>
                 </select>
             </div>
             
             {formData.technique_check === 'ทำ' ? (
                 <div className="bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-700 p-4 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {mdiSteps.map((step, index) => (
                        <label key={index} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded transition-colors">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checklist[index] ? 'bg-[#D97736] border-[#D97736]' : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'}`}>
                                <input type="checkbox" className="hidden" checked={checklist[index]} onChange={() => toggleCheck(index)} />
                                {checklist[index] && <CheckCircle size={16} className="text-white" />}
                            </div>
                            <span className={`text-sm font-medium transition-colors ${checklist[index] ? 'text-[#D97736] font-bold' : 'text-gray-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white'}`}>
                                {step}
                            </span>
                        </label>
                    ))}
                    
                    {/* เพิ่มช่อง Note สำหรับเทคนิคพ่นยา */}
                    <div className="pt-2">
                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-zinc-300">รายละเอียดเพิ่มเติม/ปัญหาที่พบ (Technique Note)</label>
                        <textarea 
                            name="technique_note" 
                            rows={2} 
                            value={formData.technique_note} 
                            onChange={handleChange}
                            placeholder="ระบุจุดที่ทำผิด หรือสิ่งที่สอนเพิ่มเติม..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 outline-none resize-none dark:text-white rounded focus:border-[#D97736]"
                        />
                    </div>

                    <div className="mt-2 pt-3 border-t border-dashed border-gray-300 dark:border-zinc-700 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-500">ผลการประเมินรวม</span>
                        <div className={`text-lg font-black px-4 py-1 rounded border-2 ${totalScore >= 7 ? 'bg-green-50 text-green-600 border-green-200' : totalScore >= 4 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {totalScore} / 8 คะแนน
                        </div>
                    </div>
                 </div>
             ) : (
                <div className="text-sm text-gray-400 italic pl-6">* เลือก "ประเมิน" เพื่อเปิดแบบฟอร์มตรวจสอบเทคนิค</div>
             )}
          </div>

          <div className="bg-[#FFF9F0] dark:bg-orange-900/10 p-6 border border-[#D97736]/30 rounded-lg space-y-4">
             <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><FileText size={18}/> 4. แผนการรักษา (Plan)</h3>
             <div>
                <label className="block text-sm font-bold mb-2">คำแนะนำ (Advice)</label>
                <input type="text" name="advice" value={formData.advice} onChange={handleChange} className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white" />
             </div>
             <div>
                <label className="block text-sm font-bold mb-2">บันทึกเพิ่มเติม (Note)</label>
                <textarea name="note" rows={2} value={formData.note} onChange={handleChange} className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-[#3D3834] dark:border-zinc-600 outline-none resize-none dark:text-white" />
             </div>
             <div>
                <label className="block text-sm font-bold mb-2">วันนัดครั้งถัดไป</label>
                <input type="date" name="next_appt" value={formData.next_appt} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] outline-none font-bold dark:text-white" />
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold text-lg py-4 border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#888] dark:shadow-none hover:bg-[#D97736] dark:hover:bg-gray-200 hover:shadow-[4px_4px_0px_0px_#3D3834] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2">
            {loading ? "กำลังบันทึก..." : <><Save size={20} /> บันทึกผลการรักษา</>}
          </button>
        </form>
      </div>
    </div>
  );
}
