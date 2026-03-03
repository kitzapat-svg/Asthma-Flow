"use client";

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

export function PEFRChart({ visitHistory, predictedVal }: PEFRChartProps) {
    const graphData = visitHistory.length > 0 ? visitHistory : [{ date: 'Start', pefr: 0 }];

    // Find latest valid PEFR (> 0), fallback to previous visits
    const latestValid = [...visitHistory].reverse().find(v => v.pefr && v.pefr > 0);
    const latestPefr = latestValid?.pefr ?? null;
    const pefrPercent = (latestPefr && predictedVal > 0) ? Math.round((latestPefr / predictedVal) * 100) : null;
    const percentColor = pefrPercent !== null
        ? pefrPercent >= 80 ? 'text-green-600 dark:text-green-400' : pefrPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
        : '';
    const dotColor = pefrPercent !== null
        ? pefrPercent >= 80 ? 'bg-green-500' : pefrPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
        : '';

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-[#2D2A26] dark:text-white">
                    <Activity size={20} className="text-[#D97736]" /> แนวโน้มค่า PEFR
                </h3>
            </div>
            {/* Latest PEFR % badge */}
            {latestPefr && pefrPercent !== null && (
                <div className="mb-4 flex items-center gap-3 text-xs text-[#6B6560] dark:text-zinc-400">
                    <span className="font-bold">{latestPefr} L/min</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${percentColor}`}>
                        <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
                        {pefrPercent}% ของ Predicted
                    </span>
                    <span className="opacity-60">(Predicted: {predictedVal} L/min)</span>
                    {latestValid?.fullDate && (
                        <span className="opacity-50">· ณ วันที่ {new Date(latestValid.fullDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    )}
                </div>
            )}
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                        <XAxis dataKey="dateDisplay" tick={{ fontSize: 12, fill: '#888888' }} />
                        <YAxis domain={[0, 800]} tick={{ fontSize: 12, fill: '#888888' }} />
                        <Tooltip contentStyle={{ borderRadius: '0px', border: '2px solid #3D3834', boxShadow: '4px 4px 0px 0px #3D3834', color: '#000' }} />
                        <ReferenceArea y1={predictedVal * 0.8} y2={Math.max(predictedVal, 800)} fill="#22c55e" fillOpacity={0.08} />
                        <ReferenceArea y1={predictedVal * 0.5} y2={predictedVal * 0.8} fill="#eab308" fillOpacity={0.08} />
                        <ReferenceArea y1={0} y2={predictedVal * 0.5} fill="#ef4444" fillOpacity={0.08} />
                        <Line type="monotone" dataKey="pefr" stroke="#D97736" strokeWidth={3} dot={{ r: 4, fill: '#D97736', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
