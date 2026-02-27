"use client";

import { useState } from 'react';
import { DRP } from './types';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { isResolved, getUnresolvedDrps, getResolvedDrps } from '@/lib/drp-helpers';

function safeDateDisplay(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function DrpListCard({ drpHistory }: { drpHistory: any[] }) {
    const [expanded, setExpanded] = useState(false);

    if (!drpHistory || drpHistory.length === 0) return null;

    const unresolved = getUnresolvedDrps(drpHistory);
    const resolved = getResolvedDrps(drpHistory);

    const getOutcomeStyle = (outcome: string) => {
        if (!outcome) return { icon: <AlertCircle size={12} className="text-gray-400" />, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
        if (isResolved(outcome)) return { icon: <CheckCircle size={12} className="text-green-600" />, cls: 'bg-green-50 text-green-700 border-green-200' };
        if (outcome.includes('Monitoring') || outcome.includes('ติดตามผล')) return { icon: <Clock size={12} className="text-amber-600" />, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { icon: <AlertCircle size={12} className="text-red-500" />, cls: 'bg-red-50 text-red-700 border-red-200' };
    };

    const renderDrpItem = (drp: any, index: number) => {
        const drpType = drp.type || drp.Type || '-';
        const drpCategory = drp.category || drp.Category || '-';
        const drpCause = drp.cause || drp.Cause || '-';
        const drpIntervention = drp.intervention || drp.Intervention || '-';
        const drpOutcome = drp.outcome || drp.Outcome || '';
        const drpVisitDate = drp.visit_date || drp.visitdate || drp.VisitDate || drp.date || drp.Date || '';
        const outcomeStyle = getOutcomeStyle(drpOutcome);
        const isUnresolved = !isResolved(drpOutcome);

        return (
            <div key={drp.id || drp.ID || index} className={`border-2 p-3 ${isUnresolved ? 'border-[#D97736]/40 bg-[#FFF8F0] dark:bg-orange-950/10 dark:border-orange-800' : 'border-[#3D3834]/10 bg-white dark:bg-zinc-900 dark:border-zinc-700'}`}>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="text-[10px] font-bold text-[#D97736]">{drpCategory}</span>
                        <div className="font-bold text-sm text-[#2D2A26] dark:text-white">{drpType}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-[#F7F3ED] dark:bg-zinc-800 text-[#D97736] px-2 py-0.5 border border-[#D97736]/30 shrink-0 whitespace-nowrap">
                        📅 {safeDateDisplay(drpVisitDate)}
                    </span>
                </div>

                <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                        <span className="font-bold text-[#3D3834] dark:text-zinc-400 shrink-0 w-14">สาเหตุ:</span>
                        <span className="text-gray-600 dark:text-zinc-400">{drpCause}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-[#3D3834] dark:text-zinc-400 shrink-0 w-14">จัดการ:</span>
                        <span className="text-gray-600 dark:text-zinc-400">{drpIntervention}</span>
                    </div>
                </div>

                {drpOutcome && (
                    <div className="mt-2 pt-2 border-t border-[#3D3834]/10 dark:border-zinc-700">
                        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${outcomeStyle.cls}`}>
                            {outcomeStyle.icon}
                            {drpOutcome}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="border-2 border-[#3D3834] dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 bg-[#F7F3ED] dark:bg-zinc-800 hover:bg-[#eae5dd] dark:hover:bg-zinc-700 transition-colors"
            >
                <div className="flex items-center gap-2 font-bold text-[#2D2A26] dark:text-white">
                    <AlertCircle size={20} className="text-[#D97736]" />
                    ประวัติ DRPs ({drpHistory.length})
                    {unresolved.length > 0 && (
                        <span className="text-[10px] font-black bg-[#D97736] text-white px-2 py-0.5 rounded-sm">
                            ค้าง {unresolved.length}
                        </span>
                    )}
                </div>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expanded && (
                <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Unresolved */}
                    {unresolved.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#D97736]/30">
                                <AlertTriangle size={14} className="text-[#D97736]" />
                                <span className="text-xs font-black text-[#D97736]">
                                    ยังไม่แก้ไข ({unresolved.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {unresolved.map(renderDrpItem)}
                            </div>
                        </div>
                    )}

                    {/* Resolved */}
                    {resolved.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-green-300/50">
                                <CheckCircle size={14} className="text-green-500" />
                                <span className="text-xs font-black text-green-600 dark:text-green-400">
                                    แก้ไขแล้ว ({resolved.length})
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {resolved.map(renderDrpItem)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
