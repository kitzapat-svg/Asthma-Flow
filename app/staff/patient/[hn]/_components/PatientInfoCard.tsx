"use client";

import { User, FileText, Calendar, Ruler, Activity, Edit, Baby } from 'lucide-react';
import { Patient } from './types';

interface PatientInfoCardProps {
    patient: Patient;
    age: number;
    onEdit: () => void;
}

export function PatientInfoCard({ patient, age, onEdit }: PatientInfoCardProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors relative">
            <button
                onClick={onEdit}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#D97736] transition-colors"
                title="แก้ไขข้อมูล"
            >
                <Edit size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                {(() => {
                    const prefix = patient.prefix?.trim() || "";
                    let Icon = User;
                    if (prefix === 'ด.ช.' || prefix === 'ด.ญ.') {
                        Icon = Baby;
                    }
                    return (
                        <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700">
                            <Icon size={24} />
                        </div>
                    );
                })()}
                <div>
                    <h1 className="text-xl font-black">{patient.prefix}{patient.first_name}</h1>
                    <p className="text-[#6B6560] dark:text-zinc-400 font-medium">{patient.last_name}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><FileText size={14} /> HN</p><p className="font-bold font-mono text-lg">{patient.hn}</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Calendar size={14} /> อายุ</p><p className="font-bold text-lg">{age} ปี</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Ruler size={14} /> ส่วนสูง</p><p className="font-bold text-lg">{patient.height || "-"} cm</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Activity size={14} /> Best PEFR</p><p className="font-bold text-lg">{patient.best_pefr || "-"} L/min</p></div>
            </div>
        </div>
    );
}
