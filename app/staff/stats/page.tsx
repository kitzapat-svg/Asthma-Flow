"use client";

import { useEffect, useState } from 'react';
import {
  Activity, PieChart as PieChartIcon, BarChart3, RefreshCw,
  CalendarDays, TrendingUp, Users, CalendarRange, LineChart
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

import { Patient, Visit } from '@/lib/types';
import { getAge } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CountUp } from '@/components/animated/count-up';
import { FadeContent } from '@/components/animated/fade-content';

export default function StatsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [weeklyVisits, setWeeklyVisits] = useState(0);
  const [monthlyVisits, setMonthlyVisits] = useState(0);
  const [newPatients, setNewPatients] = useState(0);

  // Drill-down State
  const [selectedStat, setSelectedStat] = useState<'weekly' | 'monthly' | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPatients, resVisits] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();

      const validPatients = Array.isArray(dataPatients) ? dataPatients : [];
      const validVisits = Array.isArray(dataVisits) ? dataVisits : [];

      setPatients(validPatients);
      setVisits(validVisits);

      // --- Calculate Snapshot Stats ---
      const now = new Date();

      // 1. Weekly Visits (Last 7 Days)
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);

      const weeklyCount = validVisits.filter(v => {
        const d = new Date(v.date);
        return d >= oneWeekAgo && d <= now;
      }).length;
      setWeeklyVisits(weeklyCount);

      // 2. Monthly Visits (This Month)
      const startOfCurrentMonth = startOfMonth(now);
      const monthlyCount = validVisits.filter(v => {
        const d = new Date(v.date);
        return d >= startOfCurrentMonth && d <= now;
      }).length;
      setMonthlyVisits(monthlyCount);

      // 3. New Patients (First visit in this month)
      const firstVisits = getFirstVisitsMap(validVisits);
      const newPatientsCount = Object.values(firstVisits).filter(d =>
        d >= startOfCurrentMonth && d <= now
      ).length;
      setNewPatients(newPatientsCount);

    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
  const getFirstVisitsMap = (allVisits: Visit[]) => {
    const firstVisits: Record<string, Date> = {};
    allVisits.forEach(v => {
      const d = new Date(v.date);
      if (!firstVisits[v.hn] || d < firstVisits[v.hn]) {
        firstVisits[v.hn] = d;
      }
    });
    return firstVisits;
  };

  // --- Historical Data Generators ---

  // 1. Weekly Trend (Last 8 Weeks)
  const getWeeklyTrend = () => {
    const weeks = [];
    const now = new Date();
    const firstVisits = getFirstVisitsMap(visits);

    for (let i = 7; i >= 0; i--) {
      const d = subDays(now, i * 7);
      const start = startOfWeek(d, { weekStartsOn: 1 }); // Monday start
      const end = endOfWeek(d, { weekStartsOn: 1 });
      const label = `W${format(start, 'w')} (${format(start, 'd MMM')})`; // Week number + Date
      const dateRange = `${format(start, 'd MMM')} - ${format(end, 'd MMM', { locale: th })}`;

      // Count visits in this week
      const visitCount = visits.filter(v => {
        const vd = new Date(v.date);
        return vd >= start && vd <= end;
      }).length;

      // Count new patients in this week
      const newCount = Object.values(firstVisits).filter(vd =>
        vd >= start && vd <= end
      ).length;

      weeks.push({
        name: label,
        fullDate: dateRange,
        visits: visitCount,
        newPatients: newCount
      });
    }
    return weeks;
  };

  // 2. Monthly Trend (Last 24 Months)
  const getMonthlyTrend = () => {
    const months = [];
    const now = new Date();
    const firstVisits = getFirstVisitsMap(visits);

    for (let i = 23; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, 'MMM yy', { locale: th });

      // Count visits in this month
      const visitCount = visits.filter(v => {
        const vd = new Date(v.date);
        return vd >= start && vd <= end;
      }).length;

      // Count new patients in this month
      const newCount = Object.values(firstVisits).filter(vd =>
        vd >= start && vd <= end
      ).length;

      months.push({
        name: label,
        visits: visitCount,
        newPatients: newCount
      });
    }
    return months;
  };

  // --- Current Charts Data ---
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Activity className="animate-spin text-primary mb-4" size={48} />
      <p className="text-muted-foreground font-bold animate-pulse">กำลังคำนวณสถิติ...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-white">Statistics</h2>
          <p className="text-muted-foreground mt-1">วิเคราะห์ข้อมูลการให้บริการ</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} className="rounded-full hover:rotate-180 transition-all duration-500">
          <RefreshCw size={20} />
        </Button>
      </div>

      {/* Top Stats Row (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="จำนวนผู้รับบริการ (7 วัน)"
          value={weeklyVisits}
          sub="คน"
          icon={<CalendarDays size={20} />}
          delay={0.1}
          trend="+5%"
          onClick={() => setSelectedStat('weekly')}
          clickable
        />
        <StatTile
          label="จำนวนผู้รับบริการ (เดือนนี้)"
          value={monthlyVisits}
          sub="คน"
          icon={<CalendarRange size={20} />}
          delay={0.15}
          trend="+12%"
          onClick={() => setSelectedStat('monthly')}
          clickable
        />
        <StatTile
          label="ผู้ป่วยใหม่ (เดือนนี้)"
          value={newPatients}
          sub="patients"
          icon={<Users size={20} />}
          delay={0.2}
          color="text-primary"
          onClick={() => setSelectedStat('monthly')}
          clickable
        />
        <StatTile
          label="ผู้ป่วย Active"
          value={statusCounts.Active}
          sub="total"
          icon={<Activity size={20} />}
          delay={0.25}
          color="text-green-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Status Pie Chart */}
        <FadeContent delay={0.3} className="stat-card bg-white dark:bg-zinc-900">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
            <PieChartIcon size={20} className="text-primary" /> สัดส่วนสถานะ (Status)
          </h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.2))' }} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: 'var(--card)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <defs>
                  {statusData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 text-center pointer-events-none">
              <span className="text-3xl font-black text-foreground">{patients.length}</span>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Total</p>
            </div>
          </div>
        </FadeContent>

        {/* Age Bar Chart */}
        <FadeContent delay={0.4} className="stat-card bg-white dark:bg-zinc-900">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
            <BarChart3 size={20} className="text-primary" /> ช่วงอายุผู้ป่วย (Age Groups)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: 'var(--card)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FadeContent>
      </div>

      {/* Drill-down Modal */}
      <Modal
        isOpen={selectedStat !== null}
        onClose={() => setSelectedStat(null)}
        title={selectedStat === 'weekly' ? 'สถิติรายสัปดาห์ (ย้อนหลัง 8 สัปดาห์)' : 'สถิติรายเดือน (ย้อนหลัง 24 เดือน)'}
      >
        <div className="h-[400px] w-full">
          {selectedStat && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={selectedStat === 'weekly' ? getWeeklyTrend() : getMonthlyTrend()}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <YAxis yAxisId="left" tick={{ fill: 'var(--muted-foreground)' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--primary)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: 'var(--card)' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                />
                <Legend />
                <defs>
                  <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97736" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#D97736" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area yAxisId="left" type="monotone" dataKey="visits" name="จำนวนผู้รับบริการ" fill="url(#visitGradient)" stroke="var(--primary)" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="newPatients" name="ผู้ป่วยใหม่" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        {selectedStat === 'weekly' && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            * ข้อมูลย้อนหลัง 8 สัปดาห์ล่าสุด (นับตามสัปดาห์ปฏิทิน จันทร์-อาทิตย์)
          </div>
        )}
      </Modal>

    </div>
  );
}

function StatTile({ label, value, sub, icon, delay, trend, color, onClick, clickable }: any) {
  return (
    <FadeContent delay={delay} className={`glass-card p-5 relative overflow-hidden group transition-all duration-300 ${clickable ? 'cursor-pointer hover:border-primary/50 hover:shadow-primary/10' : ''}`} >
      <div className="absolute inset-0 z-0 bg-transparent group-hover:bg-primary/5 transition-colors" onClick={onClick} />
      <div className="flex justify-between items-start mb-4 relative z-10 pointer-events-none">
        <div className={`p-2 rounded-xl bg-black/5 dark:bg-white/10 ${color || 'text-foreground'}`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            <TrendingUp size={12} className="mr-1" /> {trend}
          </span>
        )}
      </div>
      <div className="relative z-10 pointer-events-none">
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline justify-between">
          <h4 className="text-3xl font-black text-foreground flex items-baseline gap-1">
            <CountUp target={value} />
            <span className="text-sm font-normal text-muted-foreground/50">{sub}</span>
          </h4>
          {clickable && <LineChart size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
    </FadeContent>
  );
}
