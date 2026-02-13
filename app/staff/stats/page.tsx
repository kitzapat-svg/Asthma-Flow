"use client";

import { useEffect, useState } from 'react';
import { Activity, PieChart as PieChartIcon, BarChart3, RefreshCw } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { Patient } from '@/lib/types';
import { getAge } from '@/lib/helpers';
import { Button } from '@/components/ui/button';



export default function StatsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/db?type=patients');
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Status Data
  const statusCounts = {
    Active: patients.filter(p => p.status === 'Active').length,
    COPD: patients.filter(p => p.status === 'COPD').length,
    Discharge: patients.filter(p => p.status === 'Discharge').length,
  };
  const statusData = [
    { name: 'Active', value: statusCounts.Active, color: '#22c55e' },
    { name: 'COPD', value: statusCounts.COPD, color: '#f97316' },
    { name: 'Discharge', value: statusCounts.Discharge, color: '#9ca3af' },
  ].filter(item => item.value > 0);

  // 2. Age Data


  const ageGroups = patients.reduce((acc, p) => {
    const age = getAge(p.dob);
    if (age < 15) acc['0-14']++;
    else if (age < 60) acc['15-59']++;
    else acc['60+']++;
    return acc;
  }, { '0-14': 0, '15-59': 0, '60+': 0 });

  const ageData = [
    { name: 'เด็ก (0-14)', value: ageGroups['0-14'] },
    { name: 'ผู้ใหญ่ (15-59)', value: ageGroups['15-59'] },
    { name: 'สูงอายุ (60+)', value: ageGroups['60+'] },
  ];

  if (loading) return <div className="flex justify-center p-10"><Activity className="animate-spin text-[#D97736]" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-white">ภาพรวมระบบ (Dashboard)</h2>
          <p className="text-muted-foreground dark:text-zinc-400">สถิติผู้ป่วยทั้งหมด {patients.length} คน</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchPatients} className="rounded-full hover:rotate-180 transition-all duration-500">
          <RefreshCw size={20} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-border dark:border-zinc-800 shadow-[6px_6px_0px_0px_var(--border)] dark:shadow-none p-6 rounded-lg">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
            <PieChartIcon size={20} /> สัดส่วนสถานะ (Status)
          </h3>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-border dark:border-zinc-800 shadow-[6px_6px_0px_0px_var(--border)] dark:shadow-none p-6 rounded-lg">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
            <BarChart3 size={20} /> ช่วงอายุผู้ป่วย (Age Groups)
          </h3>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#000' }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>

            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
