"use client";

import { AlertTriangle, Timer, Clock, CheckCircle, History } from 'lucide-react';
import { InhalerStatus } from './types';

interface InhalerReviewCardProps {
    inhalerStatus: InhalerStatus;
    onShowHistory: () => void;
}

export function InhalerReviewCard({ inhalerStatus, onShowHistory }: InhalerReviewCardProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className={`w-12 h-12 flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700 ${inhalerStatus.status === 'never' ? 'bg-red-500' :
                        inhalerStatus.status === 'overdue' ? 'bg-[#D97736]' :
                            'bg-green-600'
                    }`}>
                    {inhalerStatus.status === 'ok' ? <Timer size={24} /> : <AlertTriangle size={24} />}
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
                            <Clock size={14} /> ล่าสุด: {inhalerStatus.lastDate?.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                    </div>
                )}

                {inhalerStatus.status === 'ok' && (
                    <div>
                        <p className="text-green-600 dark:text-green-500 font-black text-lg">
                            เหลืออีก {inhalerStatus.days} วัน
                        </p>
                        <p className="text-sm text-[#6B6560] dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                            <CheckCircle size={14} /> ล่าสุด: {inhalerStatus.lastDate?.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                    </div>
                )}

                <button
                    onClick={onShowHistory}
                    className="w-full py-3 bg-[#F7F3ED] dark:bg-zinc-800 text-[#2D2A26] dark:text-white font-bold border-2 border-[#3D3834] dark:border-zinc-600 shadow-[2px_2px_0px_0px_#3D3834] dark:shadow-none hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <History size={16} /> ดูประวัติคะแนนละเอียด
                </button>
            </div>
        </div>
    );
}
