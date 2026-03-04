"use client";

import { useState } from 'react';
import { X, Send, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';

interface AddAdviceModalProps {
    patientHn: string;
    onClose: () => void;
    onSaved: () => void;
}

export function AddAdviceModal({ patientHn, onClose, onSaved }: AddAdviceModalProps) {
    const [adviceText, setAdviceText] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!adviceText.trim()) {
            toast.error('กรุณาใส่คำแนะนำก่อนบันทึก');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'advice',
                    data: [patientHn, adviceText.trim()],
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }

            toast.success('บันทึกคำแนะนำเรียบร้อย');
            onSaved();
            onClose();
        } catch (error) {
            console.error('Save advice error:', error);
            toast.error('ไม่สามารถบันทึกได้ กรุณาลองใหม่');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-up">
            <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md border-2 border-[#3D3834] dark:border-zinc-700 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#D97736] to-[#E8943D] text-white">
                    <div className="flex items-center gap-2">
                        <MessageSquareText size={20} />
                        <h3 className="font-black text-lg">เพิ่มคำแนะนำ</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#2D2A26] dark:text-zinc-300 mb-2">
                            คำแนะนำสำหรับผู้ป่วย (HN: {patientHn})
                        </label>
                        <textarea
                            value={adviceText}
                            onChange={(e) => setAdviceText(e.target.value)}
                            placeholder="พิมพ์คำแนะนำที่ต้องการส่งถึงผู้ป่วย..."
                            className="w-full h-32 px-4 py-3 border-2 border-[#3D3834]/30 dark:border-zinc-600 rounded-lg bg-[#FFF8F0] dark:bg-zinc-800 text-[#2D2A26] dark:text-white text-sm focus:outline-none focus:border-[#D97736] focus:ring-2 focus:ring-[#D97736]/20 transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                            autoFocus
                        />
                        <p className="text-[10px] text-[#6B6560] dark:text-zinc-500 mt-1">
                            * ชื่อ-สกุล และตำแหน่งจะถูกบันทึกจากบัญชีที่ Login อัตโนมัติ
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 py-3 border-2 border-[#3D3834]/30 dark:border-zinc-600 font-bold text-sm text-[#6B6560] dark:text-zinc-400 rounded-lg hover:bg-[#F7F3ED] dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !adviceText.trim()}
                            className="flex-1 py-3 bg-[#D97736] text-white font-bold text-sm rounded-lg border-2 border-[#3D3834] dark:border-zinc-700 shadow-[3px_3px_0px_0px_#3D3834] dark:shadow-none hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_#3D3834]"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> บันทึกคำแนะนำ
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
