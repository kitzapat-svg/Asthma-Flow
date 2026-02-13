"use client";

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Pill, CheckCircle } from 'lucide-react';
import { VisitDisplay } from './types';

interface VisitHistoryTableProps {
    visitHistory: VisitDisplay[];
    predictedVal: number;
}

export function VisitHistoryTable({ visitHistory, predictedVal }: VisitHistoryTableProps) {
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="border-2 border-[#3D3834] dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
            <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-4 bg-[#F7F3ED] dark:bg-zinc-800 hover:bg-[#eae5dd] dark:hover:bg-zinc-700 transition-colors">
                <div className="flex items-center gap-2 font-bold text-[#2D2A26] dark:text-white"><Clock size={20} className="text-[#D97736]" /> ประวัติการตรวจย้อนหลัง ({visitHistory.length})</div>
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
                                    <td className="p-3">
                                        <span className={`font-black ${!visit.pefr ? 'text-gray-400' :
                                                visit.pefr > predictedVal * 0.8 ? 'text-green-600' :
                                                    visit.pefr > predictedVal * 0.6 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {visit.pefr || "-"}
                                        </span>
                                    </td>
                                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs border ${visit.control_level === 'Well-controlled' ? 'bg-green-50 text-green-700 border-green-200' : visit.control_level === 'Partly Controlled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{visit.control_level}</span></td>
                                    <td className="p-3 text-xs dark:text-zinc-400"><div className="flex flex-col gap-1"><span className="flex items-center gap-1"><Pill size={10} className="text-blue-500" /> {visit.controller}</span><span className="flex items-center gap-1"><Pill size={10} className="text-orange-500" /> {visit.reliever}</span></div></td>
                                    <td className="p-3 text-xs">{visit.technique_check === 'ทำ' ? <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12} /> สอนแล้ว</span> : <span className="text-gray-400">-</span>}</td>
                                </tr>
                            ))}
                            {visitHistory.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">ไม่มีประวัติการตรวจ</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
