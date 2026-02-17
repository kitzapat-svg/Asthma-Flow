"use client";

import { useEffect, useState } from 'react';
import {
  Activity, PieChart as PieChartIcon, BarChart3, RefreshCw,
  CalendarDays, TrendingUp, Users, CalendarRange, LineChart,
  Stethoscope, AlertCircle, BookOpen, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, subMonths, startOfMonth, endOfMonth, addDays, getDay, isSameDay, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

import { Patient, Visit, TechniqueCheck, MDI_STEPS } from '@/lib/types';
import { getAge, normalizeHN } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CountUp } from '@/components/animated/count-up';
import { FadeContent } from '@/components/animated/fade-content';

export default function StatsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [techniqueChecks, setTechniqueChecks] = useState<TechniqueCheck[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [weeklyVisits, setWeeklyVisits] = useState(0);
  const [monthlyVisits, setMonthlyVisits] = useState(0);
  const [newPatients, setNewPatients] = useState(0);

  // Drill-down State
  const [selectedStat, setSelectedStat] = useState<'weekly' | 'monthly' | null>(null);

  // New Features State
  const [nextTuesdayDate, setNextTuesdayDate] = useState<Date | null>(null);
  const [nextTuesdayAppts, setNextTuesdayAppts] = useState<{ hn: string, name: string, time: string }[]>([]);

  const [fiscalYearStats, setFiscalYearStats] = useState<any[]>([]);
  const [selectedFy, setSelectedFy] = useState<number>(new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0)); // Default to current FY (Oct starts new FY)


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPatients, resVisits, resTech] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits'),
        fetch('/api/db?type=technique_checks')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();
      const dataTech: TechniqueCheck[] = await resTech.json();

      const validPatients = Array.isArray(dataPatients) ? dataPatients : [];
      const validVisits = Array.isArray(dataVisits) ? dataVisits : [];
      const validTech = Array.isArray(dataTech) ? dataTech : [];

      setPatients(validPatients);
      setVisits(validVisits);
      setTechniqueChecks(validTech);

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

      // --- 4. Next Tuesday Appointments ---
      calculateNextTuesdayAppts(validVisits, validPatients);

      // --- 5. Fiscal Year Stats ---
      calculateFiscalYearStats(validTech);


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

  const calculateNextTuesdayAppts = (visits: Visit[], patients: Patient[]) => {
    const today = new Date();
    const currentDay = getDay(today); // 0=Sun, 1=Mon, 2=Tue...

    // Logic: Find next Tuesday. 
    // If today is Tuesday (2), do we show today? Or next week? 
    // Usually "Next Tuesday" implies upcoming. If today is Tue, let's show Today + Next Week? No, usually just upcoming.
    // Let's assume: If today is Tue, show Today. If passed or not Tue, show next Tue.

    let daysUntilTue = (2 - currentDay + 7) % 7;
    // If daysUntilTue is 0 (Today is Tue), we keep it 0 to show today's appts.

    const nextTue = addDays(today, daysUntilTue);
    setNextTuesdayDate(nextTue);

    const nextTueStr = format(nextTue, 'yyyy-MM-dd');

    // Filter visits that have next_appt on this date
    // We need to check all visits. If any visit has `next_appt` = `nextTueStr`, then that patient is coming.
    // Ideally we should check if that appointment wasn't already fulfilled or simpler: just check unique patients with that appt date.

    // Group by HN to ensure unique listing
    const patientsWithAppt = new Set<string>();

    visits.forEach(v => {
      if (v.next_appt === nextTueStr) {
        patientsWithAppt.add(v.hn);
      }
    });

    const apptDetails = Array.from(patientsWithAppt).map(hn => {
      const p = patients.find(pat => normalizeHN(pat.hn) === normalizeHN(hn));
      return {
        hn: hn,
        name: p ? `${p.prefix}${p.first_name} ${p.last_name}` : 'Unknown',
        time: '13:00 - 16:00' // Default Clinic Time
      };
    });

    setNextTuesdayAppts(apptDetails);
  };

  const getFiscalYear = (date: Date) => {
    // Fiscal Year: Oct 1 - Sep 30
    // If Month >= 9 (Oct is 9 in JS 0-indexed), then FY = Year + 1
    return date.getMonth() >= 9 ? date.getFullYear() + 1 : date.getFullYear();
  };

  const calculateFiscalYearStats = (techChecks: TechniqueCheck[]) => {
    const groupedByFy: Record<number, TechniqueCheck[]> = {};

    techChecks.forEach(t => {
      const d = new Date(t.date);
      const fy = getFiscalYear(d);
      if (!groupedByFy[fy]) groupedByFy[fy] = [];
      groupedByFy[fy].push(t);
    });

    const stats = Object.keys(groupedByFy).map(fyStr => {
      const fy = parseInt(fyStr);
      const checks = groupedByFy[fy];
      const uniquePatients = new Set(checks.map(c => c.hn)).size;

      // Common Mistakes
      // Steps data: ["1", "0", "1"...] -> 1=Done/Correct, 0=Missed/Incorrect (Based on checkbox logic: checked=1)
      // Usually "1" means checked (Done/Correct). So "0" means Mistake/Missed.
      const mistakeCounts = new Array(MDI_STEPS.length).fill(0);

      checks.forEach(c => {
        // Steps might be undefined if old data, handle safely
        if (Array.isArray(c.steps)) {
          c.steps.forEach((val, idx) => {
            // Form sends "1" for checked, "0" for unchecked.
            // If unchecked (0) => Mistake
            if (val === "0" || val === "false") {
              mistakeCounts[idx]++;
            }
          });
        }
      });

      // Map to { step: string, count: number }
      const mistakesMapped = mistakeCounts.map((count, idx) => ({
        step: MDI_STEPS[idx],
        count
      })).filter(m => m.count > 0);

      // Sort desc
      mistakesMapped.sort((a, b) => b.count - a.count);

      return {
        fy,
        totalPatients: uniquePatients,
        totalChecks: checks.length,
        topMistakes: mistakesMapped.slice(0, 3) // Top 3
      };
    });

    // Sort by FY desc
    stats.sort((a, b) => b.fy - a.fy);
    setFiscalYearStats(stats);

    // Set default selected FY if not set or available
    if (stats.length > 0 && !stats.find(s => s.fy === selectedFy)) {
      setSelectedFy(stats[0].fy);
    }
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

  // Current FY Data for Display
  const currentFyData = fiscalYearStats.find(s => s.fy === selectedFy) || { totalPatients: 0, topMistakes: [] };

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

      {/* NEW SECTION: Appointments & Teaching Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. Next Tuesday Appointments */}
        <FadeContent delay={0.3} className="stat-card bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 lg:col-span-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <CalendarDays size={20} /> ผู้ป่วยนัดอังคารหน้า
          </h3>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-orange-600 dark:text-orange-300 bg-white dark:bg-black/20 w-fit px-3 py-1 rounded-full border border-orange-100">
              📅 {nextTuesdayDate ? format(nextTuesdayDate, 'd MMM yyyy', { locale: th }) : '-'}
            </p>
            <span className="text-sm font-bold bg-orange-200 text-orange-800 px-3 py-1 rounded-full">
              {nextTuesdayAppts.length} คน
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {nextTuesdayAppts.length > 0 ? (
              nextTuesdayAppts.map((appt, i) => (
                <div key={i} className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-orange-100 dark:border-zinc-700 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold text-foreground">{appt.name}</p>
                    <p className="text-xs text-muted-foreground">HN: {appt.hn}</p>
                  </div>
                  <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">{appt.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg border-dashed border-2">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>ไม่มีนัดหมาย</p>
              </div>
            )}
          </div>
        </FadeContent>

        {/* 2. Fiscal Year Stats */}
        <FadeContent delay={0.35} className="stat-card bg-[#eefcfc] dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800 lg:col-span-7">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-cyan-800 dark:text-cyan-200">
                <Stethoscope size={20} /> สรุปการสอนพ่นยา (รายปีงบ)
              </h3>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                ปีงบ {selectedFy + 543} (1 ต.ค. {selectedFy - 1 + 543} - 30 ก.ย. {selectedFy + 543})
              </p>
            </div>
            <div className="flex gap-2">
              {fiscalYearStats.map(s => (
                <button
                  key={s.fy}
                  onClick={() => setSelectedFy(s.fy)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedFy === s.fy ? 'bg-cyan-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50'}`}
                >
                  {s.fy + 543}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Count */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl border border-cyan-100 dark:border-cyan-900/50 flex flex-col justify-center items-center text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2">
                <BookOpen size={24} />
              </div>
              <h4 className="text-4xl font-black text-cyan-900 dark:text-cyan-100">
                <CountUp target={currentFyData.totalPatients} />
              </h4>
              <p className="text-sm font-bold text-cyan-700/70 dark:text-cyan-300/70">ผู้ป่วยที่รับการสอน</p>
            </div>

            {/* Mistakes */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500" /> ข้อที่ผิดบ่อย 3 อันดับแรก
              </h4>
              {currentFyData.topMistakes.length > 0 ? (
                currentFyData.topMistakes.map((m: any, i: number) => (
                  <div key={i} className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-3 items-start shadow-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center mt-0.5">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground line-clamp-2">{m.step}</p>
                      <p className="text-xs text-red-500 font-bold mt-1">{m.count} ครั้ง</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  ไม่มีข้อมูลข้อผิดพลาด
                </div>
              )}
            </div>
          </div>
        </FadeContent>
      </div>

      {/* Charts Section (Original) */}
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
