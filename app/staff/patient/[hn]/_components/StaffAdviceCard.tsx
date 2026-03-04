"use client";

import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, User, ChevronUp, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Advice {
    hn: string;
    staff_username: string;
    staff_name: string;
    staff_position: string;
    advice: string;
    date: string;
}

interface StaffAdviceCardProps {
    adviceList: Advice[];
    currentUserId: string;
    currentUserRole: string;
    onRefresh: () => void;
}

export function StaffAdviceCard({ adviceList, currentUserId, currentUserRole, onRefresh }: StaffAdviceCardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Edit state
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [saving, setSaving] = useState(false);

    // Auto-scroll every 10 seconds
    useEffect(() => {
        if (!isAutoScrolling || adviceList.length <= 1 || editingIndex !== null) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % adviceList.length);
        }, 10000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAutoScrolling, adviceList.length, editingIndex]);

    // Reset index if list changes
    useEffect(() => {
        if (currentIndex >= adviceList.length) setCurrentIndex(0);
    }, [adviceList.length]);

    const handleManualScroll = (direction: 'up' | 'down') => {
        setIsAutoScrolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        setCurrentIndex(prev => {
            if (direction === 'up') return prev > 0 ? prev - 1 : adviceList.length - 1;
            return (prev + 1) % adviceList.length;
        });
    };

    const canEditOrDelete = (advice: Advice) => {
        return currentUserRole === 'Admin' || currentUserId === advice.staff_username;
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditText(adviceList[index].advice);
        setIsAutoScrolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditText('');
    };

    const handleSaveEdit = async () => {
        if (editingIndex === null || !editText.trim()) return;
        const advice = adviceList[editingIndex];
        setSaving(true);

        try {
            const res = await fetch('/api/db', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'advice_update',
                    hn: advice.hn,
                    staff_username: advice.staff_username,
                    date: advice.date,
                    advice: editText.trim(),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed');
            }

            toast.success('แก้ไขคำแนะนำเรียบร้อย');
            setEditingIndex(null);
            setEditText('');
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || 'ไม่สามารถแก้ไขได้');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (advice: Advice) => {
        if (!window.confirm('ต้องการลบคำแนะนำนี้ใช่หรือไม่?')) return;

        try {
            const params = new URLSearchParams({
                type: 'advice',
                hn: advice.hn,
                staff_username: advice.staff_username,
                date: advice.date,
            });
            const res = await fetch(`/api/db?${params.toString()}`, { method: 'DELETE' });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed');
            }

            toast.success('ลบคำแนะนำเรียบร้อย');
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || 'ไม่สามารถลบได้');
        }
    };

    if (adviceList.length === 0) return null;

    const current = adviceList[currentIndex];
    const isEditing = editingIndex === currentIndex;

    return (
        <div className="bg-white dark:bg-card rounded-lg border-2 border-[#3D3834] dark:border-zinc-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#D97736]/10 to-[#D97736]/5 dark:from-orange-900/30 dark:to-orange-900/10 border-b-2 border-[#3D3834] dark:border-zinc-700">
                <div className="bg-[#D97736] text-white p-1.5 rounded border border-[#3D3834] dark:border-zinc-600">
                    <MessageSquareText size={14} />
                </div>
                <h4 className="font-black text-sm text-[#2D2A26] dark:text-orange-300">
                    💬 คำแนะนำจากทีมดูแล
                </h4>
                {adviceList.length > 1 && (
                    <span className="ml-auto text-[10px] font-bold bg-[#D97736]/20 text-[#D97736] px-2 py-0.5 rounded-full">
                        {currentIndex + 1}/{adviceList.length}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4 min-h-[100px] relative">
                <div key={currentIndex} className="animate-fade-up">
                    {/* Staff info + action buttons */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#F7F3ED] dark:bg-zinc-800 flex items-center justify-center border border-[#3D3834]/20 dark:border-zinc-600">
                            <User size={14} className="text-[#6B6560] dark:text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#2D2A26] dark:text-white leading-tight truncate">
                                {current.staff_name}
                            </p>
                            {current.staff_position && (
                                <p className="text-[10px] text-[#6B6560] dark:text-zinc-400 leading-tight">
                                    {current.staff_position}
                                </p>
                            )}
                        </div>
                        <span className="text-[10px] text-[#6B6560] dark:text-zinc-500 font-medium whitespace-nowrap">
                            {new Date(current.date).toLocaleDateString('th-TH', {
                                day: 'numeric', month: 'short', year: '2-digit'
                            })}
                        </span>
                    </div>

                    {/* Advice text or edit form */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-24 px-3 py-2 border-2 border-[#D97736]/40 rounded-lg bg-[#FFF8F0] dark:bg-zinc-800 text-sm text-[#2D2A26] dark:text-white focus:outline-none focus:border-[#D97736] resize-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-bold text-[#6B6560] dark:text-zinc-400 border border-[#3D3834]/20 dark:border-zinc-600 rounded-lg hover:bg-[#F7F3ED] dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={12} className="inline mr-1" />ยกเลิก
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving || !editText.trim()}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#D97736] rounded-lg hover:bg-[#c46a2e] transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                    {saving ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={12} />
                                    )}
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#FFF8F0] dark:bg-orange-950/20 rounded-lg p-3 border border-[#D97736]/15 dark:border-orange-800/30">
                            <p className="text-sm text-[#2D2A26] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {current.advice}
                            </p>
                        </div>
                    )}

                    {/* Edit / Delete buttons */}
                    {!isEditing && canEditOrDelete(current) && (
                        <div className="flex justify-end gap-1 mt-2">
                            <button
                                onClick={() => handleEdit(currentIndex)}
                                className="p-1.5 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] hover:bg-[#D97736]/10 rounded-lg transition-colors"
                                title="แก้ไข"
                            >
                                <Pencil size={13} />
                            </button>
                            <button
                                onClick={() => handleDelete(current)}
                                className="p-1.5 text-[#6B6560] dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                title="ลบ"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation (only if multiple) */}
            {adviceList.length > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-[#3D3834]/10 dark:border-zinc-700/50 bg-[#F7F3ED]/50 dark:bg-zinc-900/50">
                    <button
                        onClick={() => handleManualScroll('up')}
                        className="p-1 rounded hover:bg-[#D97736]/10 dark:hover:bg-orange-900/30 transition-colors"
                    >
                        <ChevronUp size={16} className="text-[#6B6560] dark:text-zinc-400" />
                    </button>

                    {/* Dots */}
                    <div className="flex gap-1">
                        {adviceList.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex
                                    ? 'bg-[#D97736] w-3'
                                    : 'bg-[#D97736]/25 dark:bg-zinc-600'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => handleManualScroll('down')}
                        className="p-1 rounded hover:bg-[#D97736]/10 dark:hover:bg-orange-900/30 transition-colors"
                    >
                        <ChevronDown size={16} className="text-[#6B6560] dark:text-zinc-400" />
                    </button>

                    {!isAutoScrolling && editingIndex === null && (
                        <button
                            onClick={() => setIsAutoScrolling(true)}
                            className="text-[10px] font-bold text-[#D97736] hover:underline ml-2"
                        >
                            ▶ เล่นอัตโนมัติ
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
