"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import {
    AlertCircle, CheckCircle, Clock, AlertTriangle, ChevronDown,
    ChevronUp, Edit2, Trash2, History, Plus, X, User, ChevronRight
} from 'lucide-react';
import { getOpenDrps, getClosedDrps } from '@/lib/drp-helpers';
import { Modal } from '@/components/ui/modal';
import { DRP_DATA, INTERVENTION_OPTIONS, OUTCOME_OPTIONS } from '@/lib/drp-data';

function safeDateDisplay(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

interface DrpListCardProps {
    drpHistory: any[];
    hn: string;
    onRefresh: () => void;
}

export function DrpListCard({ drpHistory = [], hn, onRefresh }: DrpListCardProps) {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || "Staff";
    const isAdminOrPharmacist = userRole === "Admin" || userRole === "Pharmacist";
    const isAdmin = userRole === "Admin";

    const [expanded, setExpanded] = useState(false);

    // Dynamic config dropdowns state
    const [dbConfig, setDbConfig] = useState<any>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [selectedDrp, setSelectedDrp] = useState<any | null>(null);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Create Form state
    const [createForm, setCreateForm] = useState({
        visit_date: new Date().toISOString().split('T')[0],
        category: "",
        type: "",
        cause: "",
        customCause: "",
        intervention: "",
        customIntervention: "",
        outcome: "อยู่ระหว่างติดตามผล (Monitoring / Follow-up required)",
        customOutcome: "",
        note: ""
    });

    // Edit Form state
    const [editForm, setEditForm] = useState({
        category: "",
        type: "",
        cause: "",
        customCause: "",
        intervention: "",
        customIntervention: "",
        outcome: "",
        customOutcome: "",
        status: 'open' as 'open' | 'resolved' | 'failed',
        note: "",
        visit_date: ""
    });

    // Fetch DRP configurations on mount
    useEffect(() => {
        const fetchConfig = async () => {
            setLoadingConfig(true);
            try {
                const res = await fetch("/api/db?type=drp_config");
                if (res.ok) {
                    const data = await res.json();
                    setDbConfig(data);
                }
            } catch (error) {
                console.error("Failed to fetch DRP config:", error);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    // Get active config source
    const configSource = useMemo(() => {
        if (dbConfig && dbConfig.categories && dbConfig.categories.length > 0) {
            return {
                categories: dbConfig.categories,
                interventions: dbConfig.interventions,
                outcomes: dbConfig.outcomes
            };
        }
        return {
            categories: DRP_DATA.map(c => ({
                id: c.id,
                name: c.name,
                types: c.types.map(t => ({
                    id: t.id,
                    name: t.name,
                    causes: t.causes
                }))
            })),
            interventions: INTERVENTION_OPTIONS,
            outcomes: OUTCOME_OPTIONS
        };
    }, [dbConfig]);

    const unresolved = getOpenDrps(drpHistory);
    const resolved = getClosedDrps(drpHistory);

    const getOutcomeStyle = (outcome: string, status: string) => {
        if (status === 'resolved' || outcome?.includes('Resolved') || outcome?.includes('สำเร็จ')) {
            return { icon: <CheckCircle size={12} className="text-green-600" />, cls: 'bg-green-50 text-green-700 border-green-200' };
        }
        if (status === 'failed' || outcome?.includes('ไม่สำเร็จ')) {
            return { icon: <AlertCircle size={12} className="text-red-500" />, cls: 'bg-red-50 text-red-700 border-red-200' };
        }
        return { icon: <Clock size={12} className="text-amber-600" />, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    };

    // Handle stand-alone creation submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.category || !createForm.type || !createForm.cause || !createForm.intervention) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        const finalCause = createForm.cause === "อื่นๆ (ระบุ)..." ? createForm.customCause : createForm.cause;
        const finalIntervention = createForm.intervention === "อื่นๆ (ระบุ)..." ? createForm.customIntervention : createForm.intervention;
        const finalOutcome = createForm.outcome === "อื่นๆ (ระบุ)..." ? createForm.customOutcome : createForm.outcome;

        const newDrp = {
            id: crypto.randomUUID(),
            hn: hn,
            created_date: new Date().toISOString(),
            visit_date: createForm.visit_date,
            category: createForm.category,
            type: createForm.type,
            cause: finalCause,
            intervention: finalIntervention,
            outcome: finalOutcome,
            note: createForm.note || "-",
            status: (finalOutcome.includes('Resolved') || finalOutcome.includes('สำเร็จ')) ? 'resolved' : 'open'
        };

        try {
            const res = await fetch("/api/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "drp_standalone",
                    data: newDrp
                })
            });

            if (res.ok) {
                setIsCreateOpen(false);
                setCreateForm({
                    visit_date: new Date().toISOString().split('T')[0],
                    category: "",
                    type: "",
                    cause: "",
                    customCause: "",
                    intervention: "",
                    customIntervention: "",
                    outcome: "อยู่ระหว่างติดตามผล (Monitoring / Follow-up required)",
                    customOutcome: "",
                    note: ""
                });
                onRefresh();
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Open Edit DRP modal
    const openEditModal = (drp: any) => {
        setSelectedDrp(drp);

        const categoryObj = configSource.categories.find((c: any) => c.name === drp.category);
        const typeObj = categoryObj?.types.find((t: any) => t.name === drp.type);
        const isStandardCause = typeObj?.causes.includes(drp.cause);

        const isStandardIntervention = configSource.interventions.includes(drp.intervention);
        const isStandardOutcome = configSource.outcomes.includes(drp.outcome);

        setEditForm({
            category: drp.category || "",
            type: drp.type || "",
            cause: isStandardCause ? drp.cause : (drp.cause ? "อื่นๆ (ระบุ)..." : ""),
            customCause: isStandardCause ? "" : (drp.cause || ""),
            intervention: isStandardIntervention ? drp.intervention : (drp.intervention ? "อื่นๆ (ระบุ)..." : ""),
            customIntervention: isStandardIntervention ? "" : (drp.intervention || ""),
            outcome: isStandardOutcome ? drp.outcome : (drp.outcome ? "อื่นๆ (ระบุ)..." : ""),
            customOutcome: isStandardOutcome ? "" : (drp.outcome || ""),
            status: drp.status || 'open',
            note: drp.note || "",
            visit_date: drp.visit_date || ""
        });
        setIsEditOpen(true);
    };

    // Handle edit submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDrp) return;

        const finalCause = editForm.cause === "อื่นๆ (ระบุ)..." ? editForm.customCause : editForm.cause;
        const finalIntervention = editForm.intervention === "อื่นๆ (ระบุ)..." ? editForm.customIntervention : editForm.intervention;
        const finalOutcome = editForm.outcome === "อื่นๆ (ระบุ)..." ? editForm.customOutcome : editForm.outcome;

        let status = editForm.status;
        if (finalOutcome.includes('Resolved') || finalOutcome.includes('สำเร็จ')) {
            status = 'resolved';
        } else if (finalOutcome.includes('ไม่สำเร็จ')) {
            status = 'failed';
        }

        const payload = {
            category: editForm.category,
            type: editForm.type,
            cause: finalCause,
            intervention: finalIntervention,
            outcome: finalOutcome,
            note: editForm.note,
            status: status,
            visit_date: editForm.visit_date
        };

        try {
            const res = await fetch("/api/db", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "drp_update",
                    id: selectedDrp.id,
                    data: payload
                })
            });

            if (res.ok) {
                setIsEditOpen(false);
                onRefresh();
            } else {
                alert("เกิดข้อผิดพลาดในการแก้ไข");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch and open history timeline
    const openHistoryModal = async (drp: any) => {
        setSelectedDrp(drp);
        setIsHistoryOpen(true);
        setLoadingHistory(true);
        try {
            const res = await fetch(`/api/db?type=drp_history&id=${drp.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistoryLogs(data);
            } else {
                setHistoryLogs([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Delete DRP handler
    const handleDelete = async (id: string) => {
        if (!confirm("คุณต้องการลบ DRP นี้ใช่หรือไม่?")) return;
        try {
            const res = await fetch(`/api/db?type=drp&id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                onRefresh();
            } else {
                alert("ลบข้อมูลไม่สำเร็จ");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderDrpItem = (drp: any, index: number) => {
        const drpType = drp.type || drp.Type || '-';
        const drpCategory = drp.category || drp.Category || '-';
        const drpCause = drp.cause || drp.Cause || '-';
        const drpIntervention = drp.intervention || drp.Intervention || '-';
        const drpOutcome = drp.outcome || drp.Outcome || '';
        const drpNote = drp.note || drp.Note || '';
        const drpVisitDate = drp.visit_date || drp.VisitDate || drp.created_date || '';
        const outcomeStyle = getOutcomeStyle(drpOutcome, drp.status);
        const isUnresolved = drp.status === 'open';

        return (
            <div
                key={drp.id || index}
                className={`rounded-lg border-2 overflow-hidden transition-shadow duration-200 ${isUnresolved
                        ? 'border-[#D97736]/50 shadow-[2px_2px_0px_0px_#D97736]/20 dark:border-orange-700'
                        : 'border-[#3D3834]/15 dark:border-zinc-700'
                    }`}
            >
                {/* Card Header: stacked layout — no overflow */}
                <div className={`px-3 pt-2.5 pb-2.5 space-y-1 ${isUnresolved
                        ? 'bg-gradient-to-r from-[#FFF4E8] to-[#FFF8F2] dark:from-orange-950/30 dark:to-orange-950/10'
                        : 'bg-[#F7F5F2] dark:bg-zinc-800/50'
                    }`}>
                    {/* Row 1: status dot + category pill */}
                    <div className="flex items-center gap-1.5">
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${isUnresolved ? 'bg-[#D97736] animate-pulse' : 'bg-green-500'
                            }`} />
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none ${isUnresolved
                                ? 'bg-[#D97736]/15 text-[#B85C1A] dark:bg-orange-900/30 dark:text-orange-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                            {drpCategory}
                        </span>
                    </div>
                    {/* Row 2: type name — wraps freely */}
                    <div className="text-xs font-extrabold text-[#2D2A26] dark:text-white leading-snug">
                        {drpType}
                    </div>
                    {/* Row 3: date */}
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#6B6560] dark:text-zinc-400">
                        <Clock size={9} className="opacity-60 shrink-0" />
                        {safeDateDisplay(drpVisitDate)}
                    </div>
                </div>

                {/* Card Body: cause & intervention */}
                <div className="px-3 py-2 space-y-1.5 bg-white dark:bg-zinc-900">
                    <div className="flex gap-2 text-xs">
                        <span className="shrink-0 font-bold text-[#3D3834] dark:text-zinc-300 w-[52px]">สาเหตุ</span>
                        <span className="text-[#5A5450] dark:text-zinc-400 leading-snug">{drpCause}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="shrink-0 font-bold text-[#3D3834] dark:text-zinc-300 w-[52px]">จัดการ</span>
                        <span className="text-[#5A5450] dark:text-zinc-400 leading-snug">{drpIntervention}</span>
                    </div>
                    {drpNote && (
                        <div className="flex gap-2 text-xs">
                            <span className="shrink-0 font-bold text-[#3D3834] dark:text-zinc-300 w-[52px]">Note</span>
                            <span className="text-[#5A5450] dark:text-zinc-400 leading-snug whitespace-pre-line">{drpNote}</span>
                        </div>
                    )}
                </div>

                {/* Card Footer: outcome + actions */}
                {drpOutcome && (
                    <div className="px-3 py-2 border-t border-[#3D3834]/08 dark:border-zinc-700/50 bg-[#FAFAF8] dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2">
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${outcomeStyle.cls
                            }`}>
                            {outcomeStyle.icon}
                            {drpOutcome}
                        </div>
                        <div className="flex items-center gap-1">
                            {isAdminOrPharmacist && (
                                <button
                                    onClick={() => openEditModal(drp)}
                                    className="p-1.5 hover:bg-[#F7F3ED] dark:hover:bg-zinc-700 rounded text-[#D97736] cursor-pointer transition-colors duration-150"
                                    title="แก้ไข DRP"
                                >
                                    <Edit2 size={12} />
                                </button>
                            )}
                            <button
                                onClick={() => openHistoryModal(drp)}
                                className="p-1.5 hover:bg-[#F7F3ED] dark:hover:bg-zinc-700 rounded text-[#6B6560] dark:text-zinc-400 cursor-pointer transition-colors duration-150"
                                title="ดูประวัติการแก้ไข"
                            >
                                <History size={12} />
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDelete(drp.id)}
                                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-rose-500 cursor-pointer transition-colors duration-150"
                                    title="ลบ DRP"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const selectedCreateCategory = configSource.categories.find((c: any) => c.name === createForm.category);
    const selectedCreateType = selectedCreateCategory?.types.find((t: any) => t.name === createForm.type);

    const selectedEditCategory = configSource.categories.find((c: any) => c.name === editForm.category);
    const selectedEditType = selectedEditCategory?.types.find((t: any) => t.name === editForm.type);

    return (
        <div className="rounded-xl border-2 border-[#3D3834] dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-[3px_3px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            {/* Card Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F7F3ED] dark:bg-zinc-800 border-b-2 border-[#3D3834] dark:border-zinc-700">
                {/* Icon */}
                <div className="shrink-0 p-1.5 bg-[#D97736]/15 rounded-lg">
                    <AlertCircle size={15} className="text-[#D97736]" />
                </div>

                {/* Title — collapse button */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex-1 flex items-center gap-2 text-left cursor-pointer min-w-0"
                >
                    <span className="font-black text-sm text-[#2D2A26] dark:text-white whitespace-nowrap">ประวัติ DRP</span>
                    <span className="text-[10px] font-medium text-[#6B6560] dark:text-zinc-400 whitespace-nowrap">({drpHistory.length})</span>
                    {unresolved.length > 0 && (
                        <span className="text-[10px] font-black bg-[#D97736] text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                            ค้าง {unresolved.length}
                        </span>
                    )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {isAdminOrPharmacist && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-1 text-[10px] font-black bg-[#D97736] text-white border-2 border-[#3D3834] dark:border-zinc-600 shadow-[2px_2px_0px_0px_#3D3834] dark:shadow-none px-2 py-1 rounded cursor-pointer hover:translate-y-px hover:shadow-none transition-all duration-150 uppercase"
                        >
                            <Plus size={11} /> บันทึก DRP
                        </button>
                    )}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1.5 hover:bg-[#EAE5DD] dark:hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors duration-150"
                    >
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    {/* Unresolved / Open */}
                    {unresolved.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                                    <AlertTriangle size={12} className="text-[#D97736]" />
                                    <span className="text-[10px] font-black text-[#B85C1A] dark:text-amber-400 uppercase tracking-wide">
                                        ยังไม่แก้ไข · {unresolved.length} รายการ
                                    </span>
                                </div>
                                <div className="flex-1 h-px bg-[#D97736]/20 dark:bg-orange-800/30" />
                            </div>
                            <div className="space-y-2.5">
                                {unresolved.map(renderDrpItem)}
                            </div>
                        </div>
                    )}

                    {/* Resolved / Failed */}
                    {resolved.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <CheckCircle size={12} className="text-green-500" />
                                    <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-wide">
                                        ปิดเคสแล้ว · {resolved.length} รายการ
                                    </span>
                                </div>
                                <div className="flex-1 h-px bg-green-200/50 dark:bg-green-800/30" />
                            </div>
                            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                {resolved.map(renderDrpItem)}
                            </div>
                        </div>
                    )}

                    {drpHistory.length === 0 && (
                        <div className="text-center py-8 px-4">
                            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#F7F3ED] dark:bg-zinc-800 flex items-center justify-center">
                                <AlertCircle size={20} className="text-[#C4BDB5] dark:text-zinc-600" />
                            </div>
                            <p className="text-xs text-[#9A928A] dark:text-zinc-500 font-medium">ยังไม่มีบันทึก DRP สำหรับผู้ป่วยรายนี้</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- CREATE STANDALONE DRP FOR HN MODAL --- */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="บันทึกปัญหาจากการใช้ยา DRP (ผู้ป่วยรายนี้)">
                <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
                    <div className="bg-secondary/20 p-3 border border-border/60 rounded text-xs font-bold">
                        ผู้ป่วย: HN {hn}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">วันที่พบปัญหา*</label>
                        <input
                            type="date"
                            required
                            value={createForm.visit_date}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, visit_date: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                        />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">หมวดหมู่ DRP (Category)*</label>
                            <select
                                required
                                value={createForm.category}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value, type: "", cause: "", customCause: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                            >
                                <option value="">-- เลือกหมวดหมู่ --</option>
                                {configSource.categories.map((c: any) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">ชนิด DRP (Type)*</label>
                            <select
                                required
                                disabled={!createForm.category}
                                value={createForm.type}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value, cause: "", customCause: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
                            >
                                <option value="">-- เลือกชนิด DRP --</option>
                                {selectedCreateCategory?.types.map((t: any) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">สาเหตุ DRP (Cause)*</label>
                            <select
                                required
                                disabled={!createForm.type}
                                value={createForm.cause}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, cause: e.target.value, customCause: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
                            >
                                <option value="">-- เลือกสาเหตุ DRP --</option>
                                {selectedCreateType?.causes.map((c: any) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {createForm.cause === "อื่นๆ (ระบุ)..." && (
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">ระบุสาเหตุเพิ่มเติม*</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ระบุสาเหตุอื่นๆ..."
                                    value={createForm.customCause}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, customCause: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 font-bold">Intervention*</label>
                            <select
                                required
                                value={createForm.intervention}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, intervention: e.target.value, customIntervention: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                            >
                                <option value="">-- เลือกการจัดการ --</option>
                                {configSource.interventions.map((i: any) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                            {createForm.intervention === "อื่นๆ (ระบุ)..." && (
                                <input
                                    type="text"
                                    required
                                    placeholder="ระบุการจัดการอื่นๆ..."
                                    value={createForm.customIntervention}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, customIntervention: e.target.value }))}
                                    className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 font-bold">Outcome*</label>
                            <select
                                required
                                value={createForm.outcome}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, outcome: e.target.value, customOutcome: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                            >
                                <option value="">-- เลือกผลลัพธ์ --</option>
                                {configSource.outcomes.map((o: any) => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                            {createForm.outcome === "อื่นๆ (ระบุ)..." && (
                                <input
                                    type="text"
                                    required
                                    placeholder="ระบุผลลัพธ์อื่นๆ..."
                                    value={createForm.customOutcome}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, customOutcome: e.target.value }))}
                                    className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">รายละเอียดเพิ่มเติม</label>
                        <textarea
                            placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            rows={3}
                            value={createForm.note}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary bg-background rounded outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border/40 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="px-4 py-2 text-xs font-bold border-2 border-border bg-background hover:bg-secondary rounded cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-bold retro-button-primary cursor-pointer"
                        >
                            บันทึกข้อมูล
                        </button>
                    </div>
                </form>
            </Modal>

            {/* --- EDIT DRP MODAL --- */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="แก้ไขและอัปเดตผล DRP">
                <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">วันที่ตรวจ (Visit Date)</label>
                            <input
                                type="date"
                                required
                                value={editForm.visit_date}
                                onChange={(e) => setEditForm(prev => ({ ...prev, visit_date: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">สถานะติดตามเคส</label>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded font-bold"
                            >
                                <option value="open">🟠 กำลังติดตาม (Open)</option>
                                <option value="resolved">🟢 แก้ไขสำเร็จ (Resolved)</option>
                                <option value="failed">🔴 จัดการไม่สำเร็จ (Failed)</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-border/45 my-2" />

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">หมวดหมู่ DRP (Category)*</label>
                            <select
                                required
                                value={editForm.category}
                                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value, type: "", cause: "", customCause: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                            >
                                <option value="">-- เลือกหมวดหมู่ --</option>
                                {configSource.categories.map((c: any) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">ชนิด DRP (Type)*</label>
                            <select
                                required
                                disabled={!editForm.category}
                                value={editForm.type}
                                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value, cause: "", customCause: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
                            >
                                <option value="">-- เลือกชนิด DRP --</option>
                                {selectedEditCategory?.types.map((t: any) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">สาเหตุ DRP (Cause)*</label>
                            <select
                                required
                                disabled={!editForm.type}
                                value={editForm.cause}
                                onChange={(e) => setEditForm(prev => ({ ...prev, cause: e.target.value, customCause: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
                            >
                                <option value="">-- เลือกสาเหตุ DRP --</option>
                                {selectedEditType?.causes.map((c: any) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {editForm.cause === "อื่นๆ (ระบุ)..." && (
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">ระบุสาเหตุเพิ่มเติม*</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ระบุสาเหตุอื่นๆ..."
                                    value={editForm.customCause}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, customCause: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 font-bold">Intervention*</label>
                            <select
                                required
                                value={editForm.intervention}
                                onChange={(e) => setEditForm(prev => ({ ...prev, intervention: e.target.value, customIntervention: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                            >
                                <option value="">-- เลือกการจัดการ --</option>
                                {configSource.interventions.map((i: any) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                            {editForm.intervention === "อื่นๆ (ระบุ)..." && (
                                <input
                                    type="text"
                                    required
                                    placeholder="ระบุการจัดการอื่นๆ..."
                                    value={editForm.customIntervention}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, customIntervention: e.target.value }))}
                                    className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 font-bold">Outcome*</label>
                            <select
                                required
                                value={editForm.outcome}
                                onChange={(e) => setEditForm(prev => ({ ...prev, outcome: e.target.value, customOutcome: "" }))}
                                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                            >
                                <option value="">-- เลือกผลลัพธ์ --</option>
                                {configSource.outcomes.map((o: any) => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                            {editForm.outcome === "อื่นๆ (ระบุ)..." && (
                                <input
                                    type="text"
                                    required
                                    placeholder="ระบุผลลัพธ์อื่นๆ..."
                                    value={editForm.customOutcome}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, customOutcome: e.target.value }))}
                                    className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">รายละเอียดเพิ่มเติม</label>
                        <textarea
                            placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            rows={3}
                            value={editForm.note}
                            onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary bg-background rounded outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border/40 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(false)}
                            className="px-4 py-2 text-xs font-bold border-2 border-border bg-background hover:bg-secondary rounded cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-bold retro-button-primary cursor-pointer"
                        >
                            บันทึกการแก้ไข
                        </button>
                    </div>
                </form>
            </Modal>

            {/* --- DRP HISTORY TIMELINE MODAL --- */}
            <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="ประวัติการบันทึก DRP">
                <div className="space-y-6 text-left max-h-[60vh] overflow-y-auto pr-2">
                    {loadingHistory ? (
                        <div className="p-8 text-center space-y-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                            <p className="text-xs text-muted-foreground font-bold">กำลังดึงข้อมูลประวัติการแก้ไข...</p>
                        </div>
                    ) : historyLogs.length === 0 ? (
                        <div className="p-8 text-center bg-secondary/15 border border-border rounded text-xs text-muted-foreground italic">
                            ไม่พบประวัติการแก้ไข (บันทึกเริ่มแรกไม่ได้ระบุรายละเอียด)
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6 py-2">
                            {historyLogs.map((log) => {
                                const actionBadge =
                                    log.action_type === 'CREATE'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : log.action_type === 'CLOSE'
                                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                                            : log.action_type === 'REOPEN'
                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                : 'bg-blue-100 text-blue-800 border-blue-300';

                                return (
                                    <div key={log.id} className="relative">
                                        <div className="absolute -left-[31px] top-1 bg-background border-2 border-border rounded-full h-4 w-4 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 bg-foreground rounded-full" />
                                        </div>

                                        <div className="bg-card border border-border/80 rounded p-4 space-y-2">
                                            <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[11px]">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 font-black rounded border ${actionBadge} uppercase tracking-wider`}>
                                                        {log.action_type}
                                                    </span>
                                                    <span className="font-black text-foreground flex items-center gap-1">
                                                        <User size={12} className="inline-block" /> {log.changed_by}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground font-bold">
                                                    {new Intl.DateTimeFormat('th-TH', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    }).format(new Date(log.changed_at))} น.
                                                </span>
                                            </div>

                                            {log.action_type === 'CREATE' && log.changes?.snapshot && (
                                                <div className="text-xs space-y-1 text-muted-foreground font-bold">
                                                    <div className="text-foreground">ข้อมูลเริ่มต้น:</div>
                                                    <div className="pl-2 border-l border-border/50">
                                                        <div>• Intervention: {log.changes.snapshot.intervention}</div>
                                                        <div>• Outcome: {log.changes.snapshot.outcome}</div>
                                                        {log.changes.snapshot.note && <div>• รายละเอียด: {log.changes.snapshot.note}</div>}
                                                    </div>
                                                </div>
                                            )}

                                            {log.action_type === 'UPDATE' && log.changes?.fields && (
                                                <div className="text-xs space-y-1 font-bold">
                                                    <div className="text-muted-foreground">ฟิลด์ที่แก้ไข:</div>
                                                    <div className="space-y-1 pl-2 border-l border-border/50">
                                                        {log.changes.fields.map((f: any, idx: number) => {
                                                            let fName = f.field;
                                                            if (f.field === 'category') fName = 'หมวดหมู่ DRP';
                                                            if (f.field === 'type') fName = 'ชนิด DRP';
                                                            if (f.field === 'cause') fName = 'สาเหตุ DRP';
                                                            if (f.field === 'intervention') fName = 'Intervention';
                                                            if (f.field === 'outcome') fName = 'Outcome';
                                                            if (f.field === 'note') fName = 'รายละเอียด';
                                                            if (f.field === 'status') fName = 'สถานะ';
                                                            if (f.field === 'visit_date') fName = 'วันที่บันทึก';

                                                            return (
                                                                <div key={idx} className="text-muted-foreground">
                                                                    • <span className="text-foreground">{fName}</span>:{" "}
                                                                    <span className="line-through text-rose-500 font-normal">{f.old || "(ว่าง)"}</span>{" "}
                                                                    <ChevronRight size={10} className="inline-block" />{" "}
                                                                    <span className="text-emerald-600 font-black">{f.new || "(ว่าง)"}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-border/40 pt-4 mt-6">
                        <button
                            onClick={() => setIsHistoryOpen(false)}
                            className="px-4 py-2 text-xs font-bold border-2 border-border bg-background hover:bg-secondary rounded cursor-pointer"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
