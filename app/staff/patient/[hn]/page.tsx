"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getUnresolvedDrps } from '@/lib/drp-helpers';

import { Patient, Visit, TechniqueCheck, VisitDisplay, Medication } from './_components/types';
import { normalizeHN, getAge, calculatePredictedPEFR, getStatusStyle, getInhalerStatus } from './_components/utils';
import { PatientInfoCard } from './_components/PatientInfoCard';
import { QRCodeCard } from './_components/QRCodeCard';
import { InhalerReviewCard } from './_components/InhalerReviewCard';
import { DrpListCard } from './_components/DrpListCard';
import { PEFRChart } from './_components/PEFRChart';
import { VisitHistoryTable } from './_components/VisitHistoryTable';
import { TechniqueModal } from './_components/TechniqueModal';
import { EditPatientModal } from './_components/EditPatientModal';
import { ActionPlanPrint } from './_components/ActionPlanPrint';
import { QRCodeSVG } from 'qrcode.react';


export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [visitHistory, setVisitHistory] = useState<VisitDisplay[]>([]);
    const [techniqueHistory, setTechniqueHistory] = useState<TechniqueCheck[]>([]);
    const [drpHistory, setDrpHistory] = useState<any[]>([]); // Added for DRPs
    const [medication, setMedication] = useState<Medication | null>(null); // State for Med
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showTechniqueModal, setShowTechniqueModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // --- Print Logic ---
    const [printMode, setPrintMode] = useState<'card' | 'plan'>('card');

    const handlePrintCard = () => {
        setPrintMode('card');
        setTimeout(() => window.print(), 100);
    };

    const handlePrintPlan = () => {
        setPrintMode('plan');
        setTimeout(() => window.print(), 100);
    };


    useEffect(() => {
        fetchData();
    }, [params.hn]);

    const fetchData = async () => {
        try {
            const resPatients = await fetch(`/api/db?type=patients&hn=${params.hn}`);
            const dataPatients: Patient[] = await resPatients.json();
            const foundPatient = dataPatients.find(p => normalizeHN(p.hn) === normalizeHN(params.hn));

            if (foundPatient) {
                setPatient(foundPatient);

                const resVisits = await fetch(`/api/db?type=visits&hn=${params.hn}`);
                const dataVisits: Visit[] = await resVisits.json();

                const resTechniques = await fetch(`/api/db?type=technique_checks&hn=${params.hn}`);
                const rawTechniqueData = await resTechniques.json();

                // Medication
                const resMed = await fetch(`/api/db?type=medications&hn=${params.hn}`);
                const medData = await resMed.json();
                if (medData.date) setMedication(medData);

                // DRPs
                const resDrps = await fetch(`/api/db?type=drps&hn=${params.hn}`);
                const dataDrps = await resDrps.json();

                if (Array.isArray(dataDrps)) {
                    const drpList = dataDrps
                        .filter(d => normalizeHN(d.hn) === normalizeHN(params.hn))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setDrpHistory(drpList);
                }

                const history: VisitDisplay[] = dataVisits
                    .filter(v => normalizeHN(v.hn) === normalizeHN(params.hn))
                    .map(v => ({
                        ...v,
                        dateDisplay: new Date(v.date).toLocaleDateString('th-TH', {
                            day: '2-digit', month: 'short', year: '2-digit'
                        }),
                        fullDate: v.date,
                        pefr: parseInt(v.pefr) || null
                    }))
                    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
                setVisitHistory(history);

                if (Array.isArray(rawTechniqueData)) {
                    const techHistory: TechniqueCheck[] = rawTechniqueData
                        .filter((t: any) => normalizeHN(t.hn) === normalizeHN(params.hn))
                        .map((t: any) => ({
                            hn: t.hn,
                            date: t.date,
                            steps: [t.step_1, t.step_2, t.step_3, t.step_4, t.step_5, t.step_6, t.step_7, t.step_8],
                            total_score: t.total_score,
                            note: t.note || '-'
                        }))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setTechniqueHistory(techHistory);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!patient) return;
        const confirmChange = window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`);
        if (!confirmChange) return;

        // Optimistic: update UI immediately
        const previousStatus = patient.status;
        setPatient({ ...patient, status: newStatus });
        setUpdatingStatus(true);

        try {
            const res = await fetch('/api/db', {
                method: 'PUT',
                body: JSON.stringify({ type: 'patients', hn: patient.hn, status: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" เรียบร้อย`);
        } catch (e) {
            // Rollback on failure
            setPatient({ ...patient, status: previousStatus });
            toast.error('ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่');
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FEFCF8] dark:bg-background p-6 pb-20 font-sans transition-colors animate-fade-up">
            <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
                <div className="h-5 w-28 skeleton-shimmer rounded" />
                <div className="h-8 w-24 skeleton-shimmer rounded-full" />
            </nav>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column Skeleton */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-card rounded-lg p-6 border border-border">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full skeleton-shimmer" />
                            <div className="flex-1 space-y-2">
                                <div className="h-6 w-40 skeleton-shimmer rounded" />
                                <div className="h-4 w-28 skeleton-shimmer rounded" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 w-full skeleton-shimmer rounded" />
                            <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                        </div>
                    </div>
                    <div className="h-32 skeleton-shimmer rounded-lg" />
                </div>
                {/* Right Column Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-card rounded-lg p-6 border border-border">
                        <div className="h-5 w-36 skeleton-shimmer rounded mb-4" />
                        <div className="h-[200px] skeleton-shimmer rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-14 skeleton-shimmer rounded" />
                        <div className="h-14 skeleton-shimmer rounded" />
                    </div>
                    <div className="bg-white dark:bg-card rounded-lg p-6 border border-border space-y-3">
                        <div className="h-5 w-32 skeleton-shimmer rounded" />
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-10 skeleton-shimmer rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    if (!patient) return <div className="p-10 text-center text-red-500 font-bold">ไม่พบข้อมูลผู้ป่วย HN: {params.hn}</div>;

    const predictedVal = calculatePredictedPEFR(patient);
    const age = getAge(patient.dob);
    const inhalerStatus = getInhalerStatus(visitHistory);
    const unresolvedDrps = getUnresolvedDrps(drpHistory);

    return (
        <div className="min-h-screen bg-[#FEFCF8] dark:bg-black font-sans text-[#2D2A26] dark:text-white transition-colors duration-300 print:min-h-0 print:h-auto">
            {/* Screen Content (Hidden on Print) */}
            <div className="print:hidden p-6 pb-20">
                <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors">
                        <ArrowLeft size={20} /> กลับหน้าหลัก
                    </button>
                    {/* ... (rest of nav) ... */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={patient.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={updatingStatus}
                                className={`appearance-none px-4 py-1.5 text-xs font-bold border rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97736] transition-all ${getStatusStyle(patient.status)} ${updatingStatus ? 'opacity-50' : ''}`}
                            >
                                <option value="Active">🟢 Active</option>
                                <option value="COPD">🟠 COPD</option>
                                <option value="Discharge">⚪ Discharge</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6Z" /></svg></div>
                        </div>
                    </div>
                </nav>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <PatientInfoCard patient={patient} age={age} onEdit={() => setShowEditModal(true)} />
                        <QRCodeCard publicToken={patient.public_token} />
                        <InhalerReviewCard inhalerStatus={inhalerStatus} onShowHistory={() => setShowTechniqueModal(true)} />
                        {drpHistory.length > 0 && <DrpListCard drpHistory={drpHistory} />}
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Unresolved DRP Alert Banner */}
                        {unresolvedDrps.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 flex items-start gap-3 animate-in fade-in">
                                <div className="bg-red-500 text-white p-2 rounded-lg shrink-0 mt-0.5">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-700 dark:text-red-300 text-sm">
                                        ⚠️ พบ DRP ที่ยังไม่ได้แก้ไข {unresolvedDrps.length} รายการ
                                    </h4>
                                    <ul className="mt-2 space-y-1">
                                        {unresolvedDrps.slice(0, 3).map((drp, i) => (
                                            <li key={drp.id || i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                <span className="font-bold">{drp.type}</span>
                                                <span className="text-red-400">—</span>
                                                <span>{drp.outcome || 'ยังไม่ระบุผลลัพธ์'}</span>
                                            </li>
                                        ))}
                                        {unresolvedDrps.length > 3 && (
                                            <li className="text-xs text-red-500 font-bold">...และอีก {unresolvedDrps.length - 3} รายการ</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <PEFRChart visitHistory={visitHistory} predictedVal={predictedVal} />

                        <div className="grid grid-cols-2 gap-4">
                            <Link href={`/staff/visit/${patient.hn}`}>
                                <button className="w-full py-4 border-2 border-[#3D3834] dark:border-zinc-600 font-bold hover:bg-[#F7F3ED] dark:hover:bg-zinc-800 dark:text-white transition-colors flex items-center justify-center gap-2">
                                    <FileText size={20} /> บันทึกการตรวจ (Visit)
                                </button>
                            </Link>
                            <button className="py-4 bg-[#D97736] text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-none font-bold hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2">
                                <Activity size={20} /> พ่นยาฉุกเฉิน
                            </button>
                        </div>

                        <VisitHistoryTable visitHistory={visitHistory} predictedVal={predictedVal} patientHn={patient.hn} />
                    </div>
                </div>

                {/* Modals */}
                {showTechniqueModal && (
                    <TechniqueModal techniqueHistory={techniqueHistory} onClose={() => setShowTechniqueModal(false)} />
                )}
                {showEditModal && (
                    <EditPatientModal
                        patient={patient}
                        onClose={() => setShowEditModal(false)}
                        onSaved={(updated) => setPatient(updated)}
                    />
                )}

                {/* Print Buttons (Visible only on screen) */}
                <div className="fixed bottom-6 right-6 flex flex-col gap-3 print:hidden">
                    <button
                        onClick={handlePrintCard}
                        className="bg-[#2D2A26] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold"
                        title="พิมพ์บัตรประจำตัว"
                    >
                        <div className="bg-white/20 p-1.5 rounded"><Activity size={20} /></div>
                        <span className="hidden md:inline">Print Card</span>
                    </button>
                    <button
                        onClick={handlePrintPlan}
                        className="bg-white text-[#D97736] border-2 border-[#D97736] p-4 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 font-bold"
                        title="พิมพ์แผนการรักษา"
                    >
                        <FileText size={20} />
                        <span className="hidden md:inline">Print Plan</span>
                    </button>
                </div>
            </div>

            {/* ========================================
                ส่วนที่ 2: หน้าตาบัตร (Print View - ไม่ต้อง Dark Mode)
                ========================================
              */}
            {/* 1. Wallet Card View */}
            {printMode === 'card' && (
                <div className="hidden print:flex print:items-center print:justify-center print:h-screen bg-white text-black print:absolute print:top-0 print:left-0 print:w-full print:z-[9999]">
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
            )}

            {/* 2. Action Plan A4 View */}
            {printMode === 'plan' && visitHistory.length > 0 && (
                <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:h-auto print:bg-white print:z-[9999]">
                    <ActionPlanPrint patient={patient} visit={visitHistory[visitHistory.length - 1] as unknown as Visit} medication={medication} />
                </div>
            )}
        </div>
    );
}
