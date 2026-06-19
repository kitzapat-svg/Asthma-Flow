"use client";

import { useState } from 'react';
import { Activity } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { VisitDisplay } from './types';

interface PEFRChartProps {
    visitHistory: VisitDisplay[];
    predictedVal: number;
}

/** Custom tooltip that displays PEFR and % Predicted depending on current mode */
function CombinedTooltip({ active, payload, label }: any) {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;
    const pefr = data.pefr;
    const percent = data.pefrPercent;
    const isEstimate = data.isEstimate;

    const zoneLabel = percent ? (percent >= 80 ? 'Green Zone' : percent >= 50 ? 'Yellow Zone' : 'Red Zone') : '';
    const zoneColor = percent ? (percent >= 80 ? '#16a34a' : percent >= 50 ? '#ca8a04' : '#dc2626') : '';

    return (
        <div className="bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-none p-3 text-sm min-w-[180px]">
            <p className="font-bold text-[#2D2A26] dark:text-white mb-1.5">{label}</p>
            {pefr !== null && pefr !== undefined && (
                <p className="text-xs text-[#6B6560] dark:text-zinc-400 mb-1">
                    PEFR: <span className="font-black text-sm text-[#D97736]">{pefr}</span> L/min
                </p>
            )}
            {percent !== null && percent !== undefined && (
                <>
                    <p className="text-xs text-[#6B6560] dark:text-zinc-400 mb-1">
                        % Predicted: <span className="font-black text-sm" style={{ color: zoneColor }}>
                            {isEstimate ? '~' : ''}{percent.toFixed(2)}%
                        </span>
                    </p>
                    <p className="text-xs font-bold" style={{ color: zoneColor }}>
                        สถานะ: {zoneLabel}
                    </p>
                    {isEstimate && (
                        <p className="text-[10px] text-[#9B9590] dark:text-zinc-500 mt-1.5 italic">
                            ~ ประมาณจาก Predicted ปัจจุบัน
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

export function PEFRChart({ visitHistory, predictedVal }: PEFRChartProps) {
    const [showPercent, setShowPercent] = useState(false);

    const graphData = visitHistory.length > 0 ? visitHistory : [{ dateDisplay: 'Start', pefr: 0 }];

    // --- Latest PEFR badge ---
    const latestValid = [...visitHistory].reverse().find(v => v.pefr && v.pefr > 0);
    const latestPefr = latestValid?.pefr ?? null;
    const pefrPercent = (latestPefr && predictedVal > 0)
        ? parseFloat(((latestPefr / predictedVal) * 100).toFixed(2))
        : null;
    const percentColor = pefrPercent !== null
        ? pefrPercent >= 80 ? 'text-green-600 dark:text-green-400' : pefrPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
        : '';
    const dotColor = pefrPercent !== null
        ? pefrPercent >= 80 ? 'bg-green-500' : pefrPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
        : '';

    // --- Combined Chart Data ---
    const chartData = graphData.map((v: any) => {
        if (!v.pefr || v.pefr <= 0) return { ...v, pefr: null, pefrPercent: null, isEstimate: false };

        const storedPercent = v.pefr_percent_predicted;
        const hasStored = storedPercent !== null && storedPercent !== undefined && storedPercent > 0;
        const calculatedPercent = predictedVal > 0
            ? parseFloat(((v.pefr / predictedVal) * 100).toFixed(2))
            : null;

        return {
            ...v,
            pefrPercent: hasStored ? storedPercent : calculatedPercent,
            isEstimate: !hasStored,
        };
    });

    // Max % for right Y-axis domain
    const maxPercent = Math.max(
        120,
        ...chartData.map((d: any) => d.pefrPercent ?? 0)
    );
    const yPercentMax = Math.ceil(maxPercent / 10) * 10; // Round up to nearest 10

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            {/* Header / Toggle Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2 text-[#2D2A26] dark:text-white">
                        <Activity size={20} className="text-[#D97736]" /> แนวโน้มค่า PEFR
                    </h3>
                </div>
                {/* Toggle switch for showing % Predicted */}
                <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={showPercent}
                            onChange={() => setShowPercent(!showPercent)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D97736]/40 rounded-full peer peer-checked:bg-[#D97736] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full transition-colors duration-200" />
                        <span className="ms-2 text-xs font-bold text-[#6B6560] dark:text-zinc-400 group-hover:text-[#D97736] transition-colors">
                            แสดง % Predicted
                        </span>
                    </label>
                </div>
            </div>

            {/* Latest PEFR % badge */}
            {latestPefr && pefrPercent !== null && (
                <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6B6560] dark:text-zinc-400">
                    <span className="font-bold text-[#2D2A26] dark:text-white">ล่าสุด: {latestPefr} L/min</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${percentColor}`}>
                        <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
                        {pefrPercent.toFixed(2)}% ของ Predicted
                    </span>
                    <span className="opacity-60">(Predicted: {predictedVal} L/min)</span>
                    {latestValid?.fullDate && (
                        <span className="opacity-50">· ณ วันที่ {new Date(latestValid.fullDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    )}
                </div>
            )}

            {/* Toggleable Single Chart */}
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: -10, right: -10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                        <XAxis dataKey="dateDisplay" tick={{ fontSize: 12, fill: '#888888' }} />
                        
                        {showPercent ? (
                            // Left YAxis showing percentage %
                            <YAxis
                                domain={[0, yPercentMax]}
                                tick={{ fontSize: 11, fill: '#888888' }}
                                tickFormatter={(val: number) => `${val}%`}
                                label={{ value: '% of Predicted', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: '#888888' }}
                            />
                        ) : (
                            // Left YAxis showing PEFR raw L/min values
                            <YAxis 
                                domain={[0, 800]} 
                                tick={{ fontSize: 12, fill: '#888888' }} 
                                label={{ value: 'PEFR (L/min)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: '#888888' }}
                            />
                        )}

                        <Tooltip content={<CombinedTooltip />} />

                        {/* Color zones based on % Predicted thresholds (80% / 50%) when showPercent is true */}
                        {showPercent && <ReferenceArea y1={80} y2={yPercentMax} fill="#22c55e" fillOpacity={0.08} />}
                        {showPercent && <ReferenceArea y1={50} y2={80} fill="#eab308" fillOpacity={0.08} />}
                        {showPercent && <ReferenceArea y1={0} y2={50} fill="#ef4444" fillOpacity={0.08} />}

                        {/* Color zones based on absolute PEFR values calculated from predictedVal when showPercent is false */}
                        {!showPercent && <ReferenceArea y1={predictedVal * 0.8} y2={Math.max(predictedVal, 800)} fill="#22c55e" fillOpacity={0.08} />}
                        {!showPercent && <ReferenceArea y1={predictedVal * 0.5} y2={predictedVal * 0.8} fill="#eab308" fillOpacity={0.08} />}
                        {!showPercent && <ReferenceArea y1={0} y2={predictedVal * 0.5} fill="#ef4444" fillOpacity={0.08} />}

                        {showPercent ? (
                            // % Predicted Line
                            <Line
                                type="monotone"
                                dataKey="pefrPercent"
                                stroke="#3B82F6"
                                strokeWidth={2.5}
                                strokeDasharray="6 3"
                                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#2563EB' }}
                                connectNulls
                            />
                        ) : (
                            // PEFR Line
                            <Line 
                                type="monotone" 
                                dataKey="pefr" 
                                stroke="#D97736" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#D97736', strokeWidth: 2, stroke: '#fff' }} 
                                activeDot={{ r: 6 }} 
                                connectNulls 
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend info / Footnotes */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-[#6B6560] dark:text-zinc-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-green-500 inline-block opacity-40" /> ≥80% Green Zone
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-yellow-500 inline-block opacity-40" /> 50-79% Yellow Zone
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-red-500 inline-block opacity-40" /> &lt;50% Red Zone
                    </span>
                </div>
                {showPercent && chartData.some((d: any) => d.isEstimate) && (
                    <span className="italic font-normal">
                        * เครื่องหมาย ~ หมายถึงค่าประมาณจาก Predicted ปัจจุบัน
                    </span>
                )}
            </div>
        </div>
    );
}
