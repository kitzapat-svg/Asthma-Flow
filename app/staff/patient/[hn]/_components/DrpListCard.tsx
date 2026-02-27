import { DRP } from './types';
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { isResolved, getUnresolvedDrps, getResolvedDrps } from '@/lib/drp-helpers';

export function DrpListCard({ drpHistory }: { drpHistory: DRP[] }) {
    if (!drpHistory || drpHistory.length === 0) return null;

    const unresolved = getUnresolvedDrps(drpHistory);
    const resolved = getResolvedDrps(drpHistory);

    const getOutcomeIcon = (outcome: string) => {
        if (isResolved(outcome)) return <CheckCircle size={14} className="text-green-500" />;
        if (outcome.includes('Monitoring') || outcome.includes('ติดตามผล')) return <Clock size={14} className="text-yellow-500" />;
        return <AlertCircle size={14} className="text-red-500" />;
    };

    const getOutcomeBadge = (outcome: string) => {
        if (isResolved(outcome)) return 'bg-green-100 text-green-700 border-green-200';
        if (outcome.includes('Monitoring') || outcome.includes('ติดตามผล')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return 'bg-red-50 text-red-700 border-red-200';
    };

    const renderDrpItem = (drp: DRP, index: number) => (
        <div key={drp.id || index} className={`p-4 rounded-lg border ${isResolved(drp.outcome) ? 'bg-zinc-50 dark:bg-zinc-900 border-border' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-muted-foreground bg-white dark:bg-black px-2 py-1 rounded">
                    Visit: {new Date(drp.visit_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${getOutcomeBadge(drp.outcome)}`}>
                    {getOutcomeIcon(drp.outcome)}
                    <span>{drp.outcome || '-'}</span>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div>
                    <span className="font-bold text-primary block text-xs">{drp.category}</span>
                    <span className="font-bold">{drp.type}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 border-t dark:border-zinc-800 pt-2">
                    <div>
                        <span className="text-xs text-muted-foreground block font-bold mb-1">สาเหตุ (Cause)</span>
                        <p className="bg-white dark:bg-black p-2 rounded text-xs">{drp.cause}</p>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground block font-bold mb-1">การจัดการ (Intervention)</span>
                        <p className="bg-white dark:bg-black p-2 rounded text-xs">{drp.intervention}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-card rounded-lg p-6 border border-border mt-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                ประวัติปัญหา DRPs ({drpHistory.length})
            </h3>

            {/* Unresolved Section */}
            {unresolved.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-200 dark:border-red-800">
                        <AlertTriangle size={16} className="text-red-500" />
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            ยังไม่แก้ไข ({unresolved.length})
                        </span>
                    </div>
                    <div className="space-y-3">
                        {unresolved.map(renderDrpItem)}
                    </div>
                </div>
            )}

            {/* Resolved Section */}
            {resolved.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200 dark:border-green-800">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            แก้ไขแล้ว ({resolved.length})
                        </span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {resolved.map(renderDrpItem)}
                    </div>
                </div>
            )}
        </div>
    );
}
