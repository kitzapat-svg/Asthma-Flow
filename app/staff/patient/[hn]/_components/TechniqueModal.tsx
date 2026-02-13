"use client";

import { X, Sparkles, Calendar, CheckCircle, History } from 'lucide-react';
import { TechniqueCheck, MDI_STEPS } from './types';

interface TechniqueModalProps {
    techniqueHistory: TechniqueCheck[];
    onClose: () => void;
}

export function TechniqueModal({ techniqueHistory, onClose }: TechniqueModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#3D3834] dark:border-zinc-700 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-6 rounded-lg relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
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
                                            <Calendar size={16} className="text-gray-400" />
                                            {new Date(record.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                        </p>
                                        <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${parseInt(record.total_score) >= 7 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            คะแนนรวม: {record.total_score} / 8
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">จุดที่ทำไม่ได้ / ต้องปรับปรุง:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {record.steps.map((passed, i) => (
                                            passed === "0" && (
                                                <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded flex items-center gap-1">
                                                    <X size={10} /> {MDI_STEPS[i]}
                                                </span>
                                            )
                                        ))}
                                        {record.steps.every(s => s === "1") && (
                                            <span className="text-xs text-green-600 flex items-center gap-1 font-bold">
                                                <CheckCircle size={12} /> ทำได้ถูกต้องครบถ้วน
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-3 rounded border border-dashed border-gray-300 dark:border-zinc-700 text-sm">
                                    <span className="font-bold text-gray-500 mr-2">Note:</span>
                                    <span className="text-gray-800 dark:text-zinc-300">{record.note}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <History size={48} className="mx-auto mb-2 opacity-20" />
                        <p>ยังไม่มีประวัติการประเมินเทคนิคพ่นยา</p>
                    </div>
                )}
            </div>
        </div>
    );
}
