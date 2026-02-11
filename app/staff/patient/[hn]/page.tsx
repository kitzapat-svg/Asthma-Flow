"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Calendar, User, 
  Ruler, QrCode, FileText, ChevronDown, ChevronUp, Clock, Pill,
  AlertTriangle, Timer, CheckCircle, Sparkles, X, List, History
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Label 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/theme-toggle';

interface Patient {
  hn: string;
  prefix: string;
  first_name: string;
  last_name: string;
  dob: string;
  height: string;
  best_pefr: string;
  status: string;
  public_token: string;
}

interface Visit {
  hn: string;
  date: string;
  pefr: string;
  control_level: string;
  controller: string;
  reliever: string;
  note: string;
  technique_check: string;
}

interface TechniqueCheck {
    hn: string;
    date: string;
    steps: string[];
    total_score: string;
    note: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [techniqueHistory, setTechniqueHistory] = useState<TechniqueCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);

  const mdiSteps = [
    "เขย่าหลอด", "ถือแนวตั้ง", "หายใจออกสุด", "ตั้งศีรษะตรง", 
    "อมปากสนิท", "กดพร้อมสูด", "กลั้น 10 วิ", "ผ่อนลมหายใจ"
  ];

  useEffect(() => {
    fetchData();
  }, [params.hn]);

  const fetchData = async () => {
    try {
      const resPatients = await fetch('/api/db?type=patients');
      const dataPatients: Patient[] = await resPatients.json();
      const foundPatient = dataPatients.find(p => p.hn === params.hn);

      if (foundPatient) {
        setPatient(foundPatient);
        const resVisits = await fetch('/api/db?type=visits');
        const dataVisits: Visit[] = await resVisits.json();
        const resTechniques = await fetch('/api/db?type=technique_checks');
        const dataTechniques: any[] = await resTechniques.json();

        const history = dataVisits
          .filter(v => v.hn === params.hn)
          .map(v => ({
            ...v,
            dateDisplay: new Date(v.date).toLocaleDateString('th-TH', { 
                day: '2-digit', month: 'short', year: '2-digit' 
            }),
            fullDate: v.date,
            pefr: parseInt(v.pefr) || 0
          }))
          .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
        setVisitHistory(history);

        const techHistory = dataTechniques
            .filter(t => t[0] === params.hn)
            .map(t => ({
                hn: t[0],
                date: t[1],
                steps: t.slice(2, 10),
                total_score: t[10],
                note: t[11] || '-'
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTechniqueHistory(techHistory);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInhalerStatus = () => {
    const lastReview = [...visitHistory].reverse().find(v => v.technique_check === 'ทำ');
    if (!lastReview) return { status: 'never', days: 0, lastDate: null };
    
    const lastDate = new Date(lastReview.fullDate);
    const nextDate = new Date(lastDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1); 
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays), lastDate: lastDate };
    else return { status: 'ok', days: diffDays, lastDate: lastDate };
  };

  const inhalerStatus = getInhalerStatus();

  const getAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatePredictedPEFR = (p: Patient) => {
    const age = getAge(p.dob);
    const height = parseFloat(p.height || "0");
    if (height === 0) return 0;
    let predicted = 0;
    if (["นาย", "ด.ช."].includes(p.prefix)) predicted = (5.48 * height) - (1.51 * age) - 279.7;
    else predicted = (3.72 * height) - (2.24 * age) - 96.6;
    return Math.max(0, Math.round(predicted));
  };

  const getStatusStyle = (status: string) => {
     if (status === 'Active') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
     if (status === 'COPD') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
     return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FEFCF8] dark:bg-black text-[#2D2A26] dark:text-white"><Activity className="animate-spin text-[#D97736]" size={48} /><p className="text-[#6B6560] dark:text-zinc-400 font-bold">กำลังโหลดข้อมูล...</p></div>;
  if (!patient) return <div className="p-10 text-center text-red-500 font-bold">ไม่พบข้อมูลผู้ป่วย HN: {params.hn}</div>;

  const predictedVal = calculatePredictedPEFR(patient);
  const age = getAge(patient.dob);
  const graphData = visitHistory.length > 0 ? visitHistory : [{ date: 'Start', pefr: 0 }];

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors">
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        <div className="flex items-center gap-4">
            <div className="relative">
                <select 
                    value={patient.status}
                    onChange={(e) => {
                        const newStatus = e.target.value;
                        const confirmChange = window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`);
                        if (confirmChange) {
                            const update = async () => {
                                setUpdatingStatus(true);
                                await fetch('/api/db', { method: 'PUT', body: JSON.stringify({ type: 'patients', hn: patient.hn, status: newStatus })});
                                setPatient({...patient, status: newStatus});
                                setUpdatingStatus(false);
                            };
                            update();
                        }
                    }}
                    disabled={updatingStatus}
                    className={`appearance-none px-4 py-1.5 text-xs font-bold border rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97736] transition-all ${getStatusStyle(patient.status)} ${updatingStatus ? 'opacity-50' : ''}`}
                >
                    <option value="Active">🟢 Active</option>
                    <option value="COPD">🟠 COPD</option>
                    <option value="Discharge">⚪ Discharge</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6Z"/></svg></div>
            </div>
            <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          {/* ข้อมูลส่วนตัว */}
          <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700"><User size={24} /></div>
                <div>
                    <h1 className="text-xl font-black">{patient.prefix}{patient.first_name}</h1>
                    <p className="text-[#6B6560] dark:text-zinc-400 font-medium">{patient.last_name}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><FileText size={14}/> HN</p><p className="font-bold font-mono text-lg">{patient.hn}</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Calendar size={14}/> อายุ</p><p className="font-bold text-lg">{age} ปี</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Ruler size={14}/> ส่วนสูง</p><p className="font-bold text-lg">{patient.height || "-"} cm</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Activity size={14}/> Best PEFR</p><p className="font-bold text-lg">{patient.best_pefr || "-"} L/min</p></div>
            </div>
          </div>

          <div className="bg-[#2D2A26] dark:bg-zinc-800 p-6 text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[6px_6px_0px_0px_#888] dark:shadow-none text-center transition-colors">
             <div className="bg-white p-4 w-fit mx-auto mb-4 border-4 border-[#D97736]">
                <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${patient.public_token}`} size={150} />
             </div>
             <h3 className="font-bold text-lg flex items-center justify-center gap-2"><QrCode size={20}/> Patient QR Code</h3>
             <p className="text-white/60 text-sm mt-1">ให้ผู้ป่วยสแกนเพื่อดูผลการรักษา</p>
          </div>

          {/* Inhaler Review (Warm Retro Theme) */}
          <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className={`w-12 h-12 flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700 ${
                    inhalerStatus.status === 'never' ? 'bg-red-500' :
                    inhalerStatus.status === 'overdue' ? 'bg-[#D97736]' : // Orange
                    'bg-green-600'
                }`}>
                    {inhalerStatus.status === 'ok' ? <Timer size={24}/> : <AlertTriangle size={24}/>}
                </div>
                <div>
                    <h3 className="text-lg font-black text-[#2D2A26] dark:text-white">ทบทวนเทคนิคพ่นยา</h3>
                    <p className="text-xs text-[#6B6560] dark:text-zinc-400 font-bold uppercase tracking-wider">Inhaler Technique</p>
                </div>
             </div>
             
             <div className="space-y-4">
                 {inhalerStatus.status === 'never' && (
                    <div className="text-center py-2">
                        <p className="text-red-600 dark:text-red-400 font-bold text-lg">⚠️ ยังไม่เคยสอน</p>
                    </div>
                )}

                {inhalerStatus.status === 'overdue' && (
                    <div>
                         <p className="text-[#D97736] font-black text-lg">
                            เลยกำหนด {inhalerStatus.days} วัน
                         </p>
                         <p className="text-sm text-[#6B6560] dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                            <Clock size={14}/> ล่าสุด: {inhalerStatus.lastDate?.toLocaleDateString('th-TH', {day: '2-digit', month: 'short', year: '2-digit'})}
                         </p>
                    </div>
                )}

                {inhalerStatus.status === 'ok' && (
                     <div>
                         <p className="text-green-600 dark:text-green-500 font-black text-lg">
                            เหลืออีก {inhalerStatus.days} วัน
                         </p>
                         <p className="text-sm text-[#6B6560] dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                            <CheckCircle size={14}/> ล่าสุด: {inhalerStatus.lastDate?.toLocaleDateString('th-TH', {day: '2-digit', month: 'short', year: '2-digit'})}
                         </p>
                    </div>
                )}

                {/* ปุ่มดูรายละเอียด (Retro Style) */}
                <button 
                    onClick={() => setShowTechniqueModal(true)}
                    className="w-full py-3 bg-[#F7F3ED] dark:bg-zinc-800 text-[#2D2A26] dark:text-white font-bold border-2 border-[#3D3834] dark:border-zinc-600 shadow-[2px_2px_0px_0px_#3D3834] dark:shadow-none hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <History size={16} /> ดูประวัติคะแนนละเอียด
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-[#2D2A26] dark:text-white">
                        <Activity size={20} className="text-[#D97736]"/> แนวโน้มค่า PEFR
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                            <XAxis dataKey="dateDisplay" tick={{fontSize: 12, fill: '#888888'}} />
                            <YAxis domain={[0, 800]} tick={{fontSize: 12, fill: '#888888'}} />
                            <Tooltip contentStyle={{ borderRadius: '0px', border: '2px solid #3D3834', boxShadow: '4px 4px 0px 0px #3D3834', color: '#000' }}/>
                            <ReferenceLine y={predictedVal * 0.8} stroke="#22c55e" strokeDasharray="3 3"><Label value="Green Zone" fill="#22c55e" fontSize={10} position="insideTopRight" /></ReferenceLine>
                            <ReferenceLine y={predictedVal * 0.6} stroke="#ef4444" strokeDasharray="3 3"><Label value="Red Zone" fill="#ef4444" fontSize={10} position="insideTopRight" /></ReferenceLine>
                            <Line type="monotone" dataKey="pefr" stroke="#D97736" strokeWidth={3} dot={{ r: 4, fill: '#D97736', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Link href={`/staff/visit/${patient.hn}`}>
                    <button className="w-full py-4 border-2 border-[#3D3834] dark:border-zinc-600 font-bold hover:bg-[#F7F3ED] dark:hover:bg-zinc-800 dark:text-white transition-colors flex items-center justify-center gap-2">
                        <FileText size={20}/> บันทึกการตรวจ (Visit)
                    </button>
                </Link>
                <button className="py-4 bg-[#D97736] text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-none font-bold hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2">
                    <Activity size={20}/> พ่นยาฉุกเฉิน
                </button>
            </div>

            <div className="border-2 border-[#3D3834] dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
                <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-4 bg-[#F7F3ED] dark:bg-zinc-800 hover:bg-[#eae5dd] dark:hover:bg-zinc-700 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-[#2D2A26] dark:text-white"><Clock size={20} className="text-[#D97736]"/> ประวัติการตรวจย้อนหลัง ({visitHistory.length})</div>
                    {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showHistory && (
                    <div className="overflow-x-auto p-4 animate-in slide-in-from-top-2 duration-300">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-3">วันที่</th>
                                    <th className="p-3">PEFR</th>
                                    <th className="p-3">อาการ</th>
                                    <th className="p-3">ยาที่ใช้</th>
                                    <th className="p-3">Inhaler Check</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                                {[...visitHistory].reverse().map((visit, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-3 font-mono font-bold whitespace-nowrap dark:text-zinc-300">{visit.dateDisplay}</td>
                                        <td className="p-3"><span className={`font-black ${visit.pefr > predictedVal * 0.8 ? 'text-green-600' : visit.pefr > predictedVal * 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>{visit.pefr}</span></td>
                                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs border ${visit.control_level === 'Well-controlled' ? 'bg-green-50 text-green-700 border-green-200' : visit.control_level === 'Partly Controlled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{visit.control_level}</span></td>
                                        <td className="p-3 text-xs dark:text-zinc-400"><div className="flex flex-col gap-1"><span className="flex items-center gap-1"><Pill size={10} className="text-blue-500"/> {visit.controller}</span><span className="flex items-center gap-1"><Pill size={10} className="text-orange-500"/> {visit.reliever}</span></div></td>
                                        <td className="p-3 text-xs">{visit.technique_check === 'ทำ' ? <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> สอนแล้ว</span> : <span className="text-gray-400">-</span>}</td>
                                    </tr>
                                ))}
                                {visitHistory.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">ไม่มีประวัติการตรวจ</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* MODAL: รายละเอียดคะแนนเทคนิคพ่นยา */}
      {showTechniqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#3D3834] dark:border-zinc-700 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-6 rounded-lg relative">
                
                <button onClick={() => setShowTechniqueModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-black mb-1 flex items-center gap-2 text-[#2D2A26] dark:text-white">
                    <Sparkles className="text-[#D97736]" /> ประวัติการสอนพ่นยา
                </h2>
                <p className="text-sm text-gray-500 mb-6">รายละเอียดคะแนนและข้อผิดพลาดที่พบ</p>

                {techniqueHistory.length > 0 ? (
                    <div className="space-y-6">
                        {techniqueHistory.map((record, index) => (
                            <div key={index} className="border border-gray-200 dark:border-zinc-800 rounded-lg p-4 bg-gray-50 dark:bg-zinc-800/50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-lg dark:text-white flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400"/>
                                            {new Date(record.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                        </p>
                                        <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${parseInt(record.total_score) >= 7 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            คะแนนรวม: {record.total_score} / 8
                                        </div>
                                    </div>
                                </div>

                                {/* รายการที่ผิด (ไม่ได้ติ๊ก) */}
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">จุดที่ทำไม่ได้ / ต้องปรับปรุง:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {record.steps.map((passed, i) => (
                                            passed === "0" && (
                                                <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded flex items-center gap-1">
                                                    <X size={10} /> {mdiSteps[i]}
                                                </span>
                                            )
                                        ))}
                                        {record.steps.every(s => s === "1") && (
                                            <span className="text-xs text-green-600 flex items-center gap-1 font-bold">
                                                <CheckCircle size={12}/> ทำได้ถูกต้องครบถ้วน
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="bg-white dark:bg-zinc-900 p-3 rounded border border-dashed border-gray-300 dark:border-zinc-700 text-sm">
                                    <span className="font-bold text-gray-500 mr-2">Note:</span>
                                    <span className="text-gray-800 dark:text-zinc-300">{record.note}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <History size={48} className="mx-auto mb-2 opacity-20"/>
                        <p>ยังไม่มีประวัติการประเมินเทคนิคพ่นยา</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
