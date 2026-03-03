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

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-[#2D2A26] dark:text-white">
                    <Activity size={20} className="text-[#D97736]" /> แนวโน้มค่า PEFR
                </h3>
            </div>
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
