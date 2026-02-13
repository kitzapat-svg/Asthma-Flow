"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, FileText } from 'lucide-react';

import { Patient, Visit, TechniqueCheck, VisitDisplay } from './_components/types';
import { normalizeHN, getAge, calculatePredictedPEFR, getStatusStyle, getInhalerStatus } from './_components/utils';
import { PatientInfoCard } from './_components/PatientInfoCard';
import { QRCodeCard } from './_components/QRCodeCard';
import { InhalerReviewCard } from './_components/InhalerReviewCard';
import { PEFRChart } from './_components/PEFRChart';
import { VisitHistoryTable } from './_components/VisitHistoryTable';
import { TechniqueModal } from './_components/TechniqueModal';
import { EditPatientModal } from './_components/EditPatientModal';

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [visitHistory, setVisitHistory] = useState<VisitDisplay[]>([]);
    const [techniqueHistory, setTechniqueHistory] = useState<TechniqueCheck[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showTechniqueModal, setShowTechniqueModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

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

        setUpdatingStatus(true);
        await fetch('/api/db', {
            method: 'PUT',
            body: JSON.stringify({ type: 'patients', hn: patient.hn, status: newStatus })
        });
        setPatient({ ...patient, status: newStatus });
        setUpdatingStatus(false);
    };

    if (loading) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FEFCF8] dark:bg-black text-[#2D2A26] dark:text-white"><Activity className="animate-spin text-[#D97736]" size={48} /><p className="text-[#6B6560] dark:text-zinc-400 font-bold">กำลังโหลดข้อมูล...</p></div>;
    if (!patient) return <div className="p-10 text-center text-red-500 font-bold">ไม่พบข้อมูลผู้ป่วย HN: {params.hn}</div>;

    const predictedVal = calculatePredictedPEFR(patient);
    const age = getAge(patient.dob);
    const inhalerStatus = getInhalerStatus(visitHistory);

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
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
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

                    <VisitHistoryTable visitHistory={visitHistory} predictedVal={predictedVal} />
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
        </div>
    );
}
