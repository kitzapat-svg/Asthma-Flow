"use client";

import { useEffect, useState } from 'react';
import {
  BarChart3, RefreshCw, CalendarDays, TrendingUp, Users, CalendarRange,
  LineChart, Stethoscope, AlertCircle, BookOpen, Pill, CheckCircle2, Clock3, XCircle,
  ListChecks, Search, PieChart as PieChartIcon
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area
} from 'recharts';
import { format, addDays, getDay, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { Patient, Visit, TechniqueCheck, MDI_STEPS, DRP } from '@/lib/types';
import { getAge, normalizeHN } from '@/lib/helpers';
import { Modal } from '@/components/ui/modal';
import { CountUp } from '@/components/animated/count-up';
import { FadeContent } from '@/components/animated/fade-content';
import Link from 'next/link';

export default function StatsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [techniqueChecks, setTechniqueChecks] = useState<TechniqueCheck[]>([]);
  const [drps, setDrps] = useState<DRP[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1); // 1-4

  // Trend Chart display toggles
  const [showVisitsTrend, setShowVisitsTrend] = useState(true);
  const [showDrpsTrend, setShowDrpsTrend] = useState(true);
  const [showTechChecksTrend, setShowTechChecksTrend] = useState(true);

  // Drill-down Modal States
  const [activeDrillDown, setActiveDrillDown] = useState<'visits' | 'drps' | 'techChecks' | 'newPatients' | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // Tuesday Appointments State
  const [selectedTuesday, setSelectedTuesday] = useState<Date | null>(null);
  const [tuesdayOptions, setTuesdayOptions] = useState<Date[]>([]);
  const [tuesdayAppts, setTuesdayAppts] = useState<{ hn: string, name: string, firstName?: string, time: string }[]>([]);
  const [tuesdaySort, setTuesdaySort] = useState<'hn' | 'name' | 'none'>('none');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPatients, resVisits, resTech, resDrps] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits'),
        fetch('/api/db?type=technique_checks'),
        fetch('/api/db?type=drps')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();
      const dataTech: TechniqueCheck[] = await resTech.json();
      const dataDrps: DRP[] = await resDrps.json();

      const validPatients = Array.isArray(dataPatients) ? dataPatients : [];
      const validVisits = Array.isArray(dataVisits) ? dataVisits : [];
      const validTech = Array.isArray(dataTech) ? dataTech : [];
      const validDrps = Array.isArray(dataDrps) ? dataDrps : [];

      setPatients(validPatients);
      setVisits(validVisits);
      setTechniqueChecks(validTech);
      setDrps(validDrps);

      // --- Tuesday Appointments (Default next Tuesday) ---
      const today = new Date();
      const currentDay = getDay(today);
      const daysUntilTue = (2 - currentDay + 7) % 7;
      const nextTue = addDays(today, daysUntilTue);
      setSelectedTuesday(nextTue);

      const options = [];
      for (let i = -4; i <= 4; i++) {
        options.push(addDays(nextTue, i * 7));
      }
      setTuesdayOptions(options);
      calculateTuesdayAppts(validVisits, validPatients, nextTue);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const cleanThaiPrefix = (name: string): string => {
    let cleaned = name.trim();
    const prefixes = [
      /^นาย\s*/,
      /^นางสาว\s*/,
      /^นาง\s*/,
      /^น\.ส\.\s*/,
      /^ด\.ช\.\s*/,
      /^ด\.ญ\.\s*/,
      /^เด็กชาย\s*/,
      /^เด็กหญิง\s*/,
      /^พระครู\s*/,
      /^พระ\s*/,
      /^นพ\.\s*/,
      /^พญ\.\s*/,
      /^ทพ\.\s*/,
      /^ทญ\.\s*/,
    ];
    for (const prefix of prefixes) {
      if (prefix.test(cleaned)) {
        cleaned = cleaned.replace(prefix, '');
        break;
      }
    }
    return cleaned;
  };

  const calculateTuesdayAppts = (allVisits: Visit[], allPatients: Patient[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const patientsWithAppt = new Set<string>();

    allVisits.forEach(v => {
      const dbNextAppt = String(v.next_appt || '').trim();
      if (dbNextAppt === dateStr) {
        patientsWithAppt.add(normalizeHN(v.hn));
      }
    });

    const apptDetails = Array.from(patientsWithAppt).map(normHn => {
      const p = allPatients.find(pat => normalizeHN(pat.hn) === normHn);
      return {
        hn: normHn,
        name: p ? `${p.prefix || ''}${p.first_name} ${p.last_name}` : 'Unknown',
        firstName: p ? p.first_name : 'Unknown',
        time: '13:00 - 16:00'
      };
    });

    setTuesdayAppts(apptDetails);
  };

  const getSortedTuesdayAppts = () => {
    const list = [...tuesdayAppts];
    if (tuesdaySort === 'hn') {
      return list.sort((a, b) => a.hn.localeCompare(b.hn, 'th'));
    }
    if (tuesdaySort === 'name') {
      return list.sort((a, b) => {
        const nameA = a.firstName || cleanThaiPrefix(a.name);
        const nameB = b.firstName || cleanThaiPrefix(b.name);
        return nameA.localeCompare(nameB, 'th');
      });
    }
    return list;
  };

  const handleTuesdayChange = (dateStr: string) => {
    const newDate = new Date(dateStr);
    setSelectedTuesday(newDate);
    calculateTuesdayAppts(visits, patients, newDate);
  };

  // Helper: Date formatters
  const toThaiShortDate = (dateStr: string | Date | undefined | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate();
    const month = date.toLocaleDateString('th-TH', { month: 'short' });
    const year = String((date.getFullYear() + 543) % 100).padStart(2, '0');
    return `${day} ${month} ${year}`;
  };

  const getPatientName = (hn: string) => {
    const p = patients.find(pat => normalizeHN(pat.hn) === normalizeHN(hn));
    return p ? `${p.prefix}${p.first_name} ${p.last_name}` : 'ไม่ทราบชื่อ';
  };

  const getPatientStatus = (hn: string) => {
    const p = patients.find(pat => normalizeHN(pat.hn) === normalizeHN(hn));
    return p ? p.status : '-';
  };

  const getPatientPhone = (hn: string) => {
    const p = patients.find(pat => normalizeHN(pat.hn) === normalizeHN(hn));
    return p ? p.phone || '-' : '-';
  };

  const getMissedSteps = (c: TechniqueCheck) => {
    const missed = [];
    for (let idx = 0; idx < MDI_STEPS.length; idx++) {
      const key = `step${idx + 1}` as keyof TechniqueCheck;
      const val = c[key] as unknown;
      if (val === 0 || val === '0' || val === false || val === 'false' || String(val) === '0' || String(val) === 'false') {
        missed.push(idx + 1);
      }
    }
    return missed.length > 0 ? `พลาดข้อ: ${missed.join(', ')}` : 'ถูกต้องทุกข้อ';
  };

  // Time Range Helpers
  const getPeriodRange = (type: 'month' | 'quarter' | 'year', yr: number, val: number) => {
    let startDate: Date;
    let endDate: Date;

    if (type === 'month') {
      startDate = new Date(yr, val, 1);
      endDate = new Date(yr, val + 1, 0, 23, 59, 59, 999);
    } else if (type === 'quarter') {
      // Fiscal quarters (Fiscal Year starts in October of calendar year yr-1)
      // Q1: Oct - Dec (yr - 1)
      // Q2: Jan - Mar (yr)
      // Q3: Apr - Jun (yr)
      // Q4: Jul - Sep (yr)
      if (val === 1) {
        startDate = new Date(yr - 1, 9, 1); // 9 = October
        endDate = new Date(yr - 1, 12, 0, 23, 59, 59, 999); // Dec 31
      } else if (val === 2) {
        startDate = new Date(yr, 0, 1); // 0 = January
        endDate = new Date(yr, 3, 0, 23, 59, 59, 999); // Mar 31
      } else if (val === 3) {
        startDate = new Date(yr, 3, 1); // 3 = April
        endDate = new Date(yr, 6, 0, 23, 59, 59, 999); // Jun 30
      } else {
        startDate = new Date(yr, 6, 1); // 6 = July
        endDate = new Date(yr, 9, 0, 23, 59, 59, 999); // Sep 30
      }
    } else {
      // 'year' mode: entire Fiscal Year 'yr' (October 1st of yr - 1 to September 30th of yr)
      startDate = new Date(yr - 1, 9, 1); // October 1st
      endDate = new Date(yr, 9, 0, 23, 59, 59, 999); // September 30th
    }

    return { startDate, endDate };
  };

  const getPreviousPeriodRange = (type: 'month' | 'quarter' | 'year', yr: number, val: number) => {
    if (type === 'month') {
      const prevMonth = val === 0 ? 11 : val - 1;
      const prevYear = val === 0 ? yr - 1 : yr;
      return getPeriodRange('month', prevYear, prevMonth);
    } else if (type === 'quarter') {
      const prevQuarter = val === 1 ? 4 : val - 1;
      const prevYear = val === 1 ? yr - 1 : yr;
      return getPeriodRange('quarter', prevYear, prevQuarter);
    } else {
      // 'year' mode: previous fiscal year is yr - 1
      return getPeriodRange('year', yr - 1, val);
    }
  };

  const filterListByRange = <T extends { visit_date?: string; date?: string; created_date?: string }>(
    list: T[],
    start: Date,
    end: Date
  ) => {
    return list.filter(item => {
      const dateStr = item.visit_date || item.created_date || item.date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    });
  };

  // --- Dynamic Stats Calculations ---
  const currentVal = filterType === 'month' ? selectedMonth : selectedQuarter;
  const currentRange = getPeriodRange(filterType, selectedYear, currentVal);
  const previousRange = getPreviousPeriodRange(filterType, selectedYear, currentVal);

  const currentVisits = filterListByRange(visits, currentRange.startDate, currentRange.endDate);
  const previousVisits = filterListByRange(visits, previousRange.startDate, previousRange.endDate);

  const currentDrps = filterListByRange(drps, currentRange.startDate, currentRange.endDate);
  const previousDrps = filterListByRange(drps, previousRange.startDate, previousRange.endDate);

  const currentTechChecks = filterListByRange(techniqueChecks, currentRange.startDate, currentRange.endDate);
  const previousTechChecks = filterListByRange(techniqueChecks, previousRange.startDate, previousRange.endDate);

  const currentNewPatients = currentVisits.filter(v => {
    return v.is_new_case === true || String(v.is_new_case).toUpperCase() === 'TRUE';
  });
  const previousNewPatients = previousVisits.filter(v => {
    return v.is_new_case === true || String(v.is_new_case).toUpperCase() === 'TRUE';
  });

  const getTrendPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  };

  // Drilldown lists search filtering
  const getFilteredModalData = () => {
    const query = modalSearchTerm.toLowerCase().trim();
    if (activeDrillDown === 'visits') {
      return currentVisits.filter(v => {
        const name = getPatientName(v.hn).toLowerCase();
        return v.hn.toLowerCase().includes(query) || name.includes(query);
      });
    }
    if (activeDrillDown === 'drps') {
      return currentDrps.filter(d => {
        const name = getPatientName(d.hn).toLowerCase();
        return d.hn.toLowerCase().includes(query) || name.includes(query) || d.category.toLowerCase().includes(query) || d.type.toLowerCase().includes(query);
      });
    }
    if (activeDrillDown === 'techChecks') {
      return currentTechChecks.filter(t => {
        const name = getPatientName(t.hn).toLowerCase();
        return t.hn.toLowerCase().includes(query) || name.includes(query) || (t.note || '').toLowerCase().includes(query);
      });
    }
    if (activeDrillDown === 'newPatients') {
      return currentNewPatients.filter(v => {
        const name = getPatientName(v.hn).toLowerCase();
        return v.hn.toLowerCase().includes(query) || name.includes(query);
      });
    }
    return [];
  };

  // --- Dynamic breakdowns for current period ---
  const periodTechStats = (() => {
    if (currentTechChecks.length === 0) return { totalChecks: 0, totalPatients: 0, topMistakes: [] };
    const uniquePatients = new Set(currentTechChecks.map(c => c.hn)).size;

    const mistakeCounts = new Array(MDI_STEPS.length).fill(0);
    currentTechChecks.forEach(c => {
      for (let idx = 0; idx < MDI_STEPS.length; idx++) {
        const key = `step${idx + 1}` as keyof TechniqueCheck;
        const val = c[key] as unknown;
        if (val === 0 || val === '0' || val === false || val === 'false' || String(val) === '0' || String(val) === 'false') {
          mistakeCounts[idx]++;
        }
      }
    });

    const mistakesMapped = mistakeCounts.map((count, idx) => ({
      step: MDI_STEPS[idx],
      count
    })).filter(m => m.count > 0);

    mistakesMapped.sort((a, b) => b.count - a.count);

    return {
      totalChecks: currentTechChecks.length,
      totalPatients: uniquePatients,
      topMistakes: mistakesMapped.slice(0, 3)
    };
  })();

  const periodDrpStats = (() => {
    if (currentDrps.length === 0) {
      return {
        totalDrps: 0,
        totalPatients: 0,
        resolved: 0,
        followUp: 0,
        refused: 0,
        topCategories: [],
        topTypes: []
      };
    }

    const uniqueHns = new Set(currentDrps.map(d => normalizeHN(d.hn)));

    let resolved = 0;
    let followUp = 0;
    let refused = 0;

    currentDrps.forEach(d => {
      const o = (d.outcome || '').toLowerCase();
      if (o.includes('resolved') || o.includes('สำเร็จ')) {
        resolved++;
      } else if (o.includes('monitoring') || o.includes('follow') || o.includes('ติดตาม')) {
        followUp++;
      } else if (o.includes('refused') || o.includes('ปฏิเสธ')) {
        refused++;
      }
    });

    const catCount: Record<string, number> = {};
    currentDrps.forEach(d => {
      const cat = (d.category || '').trim();
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const topCategories = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const typeCount: Record<string, number> = {};
    currentDrps.forEach(d => {
      const t = (d.type || '').trim();
      if (t) typeCount[t] = (typeCount[t] || 0) + 1;
    });
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalDrps: currentDrps.length,
      totalPatients: uniqueHns.size,
      resolved,
      followUp,
      refused,
      topCategories,
      topTypes
    };
  })();

  // --- Trend Charts Generator (Rolling last 12 months / 8 quarters) ---
  const getTrendData = () => {
    const data = [];
    if (filterType === 'month') {
      for (let i = 11; i >= 0; i--) {
        let m = selectedMonth - i;
        let y = selectedYear;
        if (m < 0) {
          m += 12;
          y -= 1;
        }

        const { startDate, endDate } = getPeriodRange('month', y, m);
        const thaiYearShort = String((startDate.getFullYear() + 543) % 100).padStart(2, '0');
        const monthName = startDate.toLocaleDateString('th-TH', { month: 'short' });
        const label = `${monthName} ${thaiYearShort}`;

        const periodVisits = filterListByRange(visits, startDate, endDate);
        const periodDrps = filterListByRange(drps, startDate, endDate);
        const periodTechChecks = filterListByRange(techniqueChecks, startDate, endDate);

        data.push({
          name: label,
          visits: periodVisits.length,
          drps: periodDrps.length,
          techChecks: periodTechChecks.length,
        });
      }
    } else if (filterType === 'quarter') {
      for (let i = 7; i >= 0; i--) {
        let q = selectedQuarter - i;
        let y = selectedYear;
        while (q <= 0) {
          q += 4;
          y -= 1;
        }

        const { startDate, endDate } = getPeriodRange('quarter', y, q);
        const thaiYearShort = String((y + 543) % 100).padStart(2, '0');
        const label = `Q${q}/${thaiYearShort}`;

        const periodVisits = filterListByRange(visits, startDate, endDate);
        const periodDrps = filterListByRange(drps, startDate, endDate);
        const periodTechChecks = filterListByRange(techniqueChecks, startDate, endDate);

        data.push({
          name: label,
          visits: periodVisits.length,
          drps: periodDrps.length,
          techChecks: periodTechChecks.length,
        });
      }
    } else {
      // 'year' mode: show last 5 fiscal years
      for (let i = 4; i >= 0; i--) {
        const y = selectedYear - i;
        const { startDate, endDate } = getPeriodRange('year', y, 0);
        const label = `ปีงบฯ ${y + 543}`;

        const periodVisits = filterListByRange(visits, startDate, endDate);
        const periodDrps = filterListByRange(drps, startDate, endDate);
        const periodTechChecks = filterListByRange(techniqueChecks, startDate, endDate);

        data.push({
          name: label,
          visits: periodVisits.length,
          drps: periodDrps.length,
          techChecks: periodTechChecks.length,
        });
      }
    }
    return data;
  };

  // Status and Age charts
  const statusCounts = {
    Active: patients.filter(p => p.status === 'Active').length,
    COPD: patients.filter(p => p.status === 'COPD').length,
    Discharge: patients.filter(p => p.status === 'Discharge').length,
  };
  const statusData = [
    { name: 'Active', value: statusCounts.Active, color: '#D97736' },
    { name: 'COPD', value: statusCounts.COPD, color: '#8B5A2B' },
    { name: 'Discharge', value: statusCounts.Discharge, color: '#8A8580' },
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
    <div className="space-y-8 pb-20 animate-fade-up">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-36 skeleton-shimmer rounded-lg" />
          <div className="h-4 w-52 skeleton-shimmer rounded mt-2" />
        </div>
        <div className="h-10 w-10 skeleton-shimmer rounded-full" />
      </div>
      {/* Skeleton Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="retro-box-static p-5 bg-card">
            <div className="flex justify-between items-start mb-4">
              <div className="h-9 w-9 skeleton-shimmer rounded" />
              <div className="h-5 w-12 skeleton-shimmer rounded" />
            </div>
            <div className="h-3 w-28 skeleton-shimmer rounded mb-2" />
            <div className="h-8 w-16 skeleton-shimmer rounded" />
          </div>
        ))}
      </div>
      {/* Skeleton Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="retro-box-static bg-card p-6">
            <div className="h-5 w-44 skeleton-shimmer rounded mb-6" />
            <div className="h-[280px] skeleton-shimmer rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );

  const getFormattedPeriodLabel = () => {
    if (filterType === 'month') {
      const date = new Date(selectedYear, selectedMonth, 1);
      return `${date.toLocaleDateString('th-TH', { month: 'long' })} ${selectedYear + 543}`;
    } else if (filterType === 'quarter') {
      return `ไตรมาส ${selectedQuarter} (ปีงบประมาณ พ.ศ. ${selectedYear + 543})`;
    } else {
      return `ปีงบประมาณ พ.ศ. ${selectedYear + 543} (1 ต.ค. ${String((selectedYear - 1 + 543) % 100).padStart(2, '0')} - 30 ก.ย. ${String((selectedYear + 543) % 100).padStart(2, '0')})`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground uppercase tracking-tight font-sans">Dashboard & Statistics</h2>
          <p className="text-muted-foreground mt-1 font-sans">วิเคราะห์ข้อมูลการให้บริการและผลการรักษา</p>
        </div>
        <button
          onClick={fetchData}
          className="p-3 bg-card border-2 border-border shadow-retro-sm hover:shadow-retro hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer w-fit"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw size={18} className="text-foreground" />
        </button>
      </div>

      {/* --- Filter Navigation Bar --- */}
      <FadeContent delay={0.05}>
        <div className="retro-box-static bg-card p-5 flex flex-col md:flex-row gap-5 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto font-sans">
            <span className="text-sm font-black text-foreground uppercase tracking-wider shrink-0">มุมมองตัวกรอง:</span>

            {/* Toggle tabs */}
            <div className="flex border-2 border-border p-1 bg-secondary/30 w-full sm:w-auto">
              <button
                onClick={() => setFilterType('month')}
                className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer ${filterType === 'month'
                  ? 'bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] -translate-x-0.5 -translate-y-0.5'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setFilterType('quarter')}
                className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer ${filterType === 'quarter'
                  ? 'bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] -translate-x-0.5 -translate-y-0.5'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                รายไตรมาส
              </button>
              <button
                onClick={() => setFilterType('year')}
                className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer ${filterType === 'year'
                  ? 'bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] -translate-x-0.5 -translate-y-0.5'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                รายปีงบประมาณ
              </button>
            </div>
          </div>

          {/* Time selectors */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto font-sans">
            <span className="text-sm font-black text-muted-foreground uppercase">
              {filterType === 'month' ? 'เลือกปี/เดือน:' : filterType === 'quarter' ? 'เลือกปีงบประมาณ/ไตรมาส:' : 'เลือกปีงบประมาณ:'}
            </span>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-2.5 text-xs font-bold border-2 border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
            >
              {[2024, 2025, 2026, 2027].map(yr => (
                <option key={yr} value={yr}>
                  {filterType === 'month' ? `ปี พ.ศ. ${yr + 543}` : `ปีงบประมาณ พ.ศ. ${yr + 543}`}
                </option>
              ))}
            </select>

            {/* Month Selector */}
            {filterType === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="p-2.5 text-xs font-bold border-2 border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-40"
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {new Date(0, idx).toLocaleDateString('th-TH', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}

            {/* Quarter Selector */}
            {filterType === 'quarter' && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="p-2.5 text-xs font-bold border-2 border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
              >
                <option value={1}>ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
                <option value={2}>ไตรมาส 2 (ม.ค. - มี.ค.)</option>
                <option value={3}>ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
                <option value={4}>ไตรมาส 4 (ก.ค. - ก.ย.)</option>
              </select>
            )}
          </div>
        </div>
      </FadeContent>

      {/* --- Key Stats Row --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label={`ยอดผู้รับบริการ (${filterType === 'month' ? 'เดือนนี้' : filterType === 'quarter' ? 'ไตรมาสนี้' : 'ปีงบประมาณนี้'})`}
          value={currentVisits.length}
          sub="คน"
          icon={<CalendarRange size={18} />}
          delay={0.1}
          trend={getTrendPercentage(currentVisits.length, previousVisits.length)}
          onClick={() => {
            setActiveDrillDown('visits');
            setModalSearchTerm('');
          }}
          clickable
        />
        <StatTile
          label={`ยอด DRP (${filterType === 'month' ? 'เดือนนี้' : filterType === 'quarter' ? 'ไตรมาสนี้' : 'ปีงบประมาณนี้'})`}
          value={currentDrps.length}
          sub="รายการ"
          icon={<Pill size={18} />}
          delay={0.15}
          trend={getTrendPercentage(currentDrps.length, previousDrps.length)}
          color="text-[#8B5A2B]"
          onClick={() => {
            setActiveDrillDown('drps');
            setModalSearchTerm('');
          }}
          clickable
        />
        <StatTile
          label={`สอนพ่นยา (${filterType === 'month' ? 'เดือนนี้' : filterType === 'quarter' ? 'ไตรมาสนี้' : 'ปีงบประมาณนี้'})`}
          value={currentTechChecks.length}
          sub="ครั้ง"
          icon={<Stethoscope size={18} />}
          delay={0.2}
          trend={getTrendPercentage(currentTechChecks.length, previousTechChecks.length)}
          color="text-[#059669]"
          onClick={() => {
            setActiveDrillDown('techChecks');
            setModalSearchTerm('');
          }}
          clickable
        />
        <StatTile
          label={`ผู้ป่วยใหม่ (${filterType === 'month' ? 'เดือนนี้' : filterType === 'quarter' ? 'ไตรมาสนี้' : 'ปีงบประมาณนี้'})`}
          value={currentNewPatients.length}
          sub="คน"
          icon={<Users size={18} />}
          delay={0.25}
          trend={getTrendPercentage(currentNewPatients.length, previousNewPatients.length)}
          color="text-primary"
          onClick={() => {
            setActiveDrillDown('newPatients');
            setModalSearchTerm('');
          }}
          clickable
        />
      </div>

      {/* --- Main Analytics Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Trend Analysis Chart Card (Left 8 Columns) */}
        <FadeContent delay={0.3} className="lg:col-span-8">
          <div className="retro-box-static bg-card p-6 h-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 font-sans">
              <div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                  <LineChart size={18} className="text-primary" /> แนวโน้มผลการดำเนินงานย้อนหลัง
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  แสดงเปรียบเทียบ {filterType === 'month' ? '12 เดือนล่าสุด' : filterType === 'quarter' ? '8 ไตรมาสล่าสุด' : '5 ปีงบประมาณล่าสุด'} จนถึง {getFormattedPeriodLabel()}
                </p>
              </div>

              {/* Checkbox toggles for Recharts lines */}
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showVisitsTrend}
                    onChange={(e) => setShowVisitsTrend(e.target.checked)}
                    className="accent-primary w-4.5 h-4.5 border-2 border-border"
                  />
                  ผู้รับบริการ
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDrpsTrend}
                    onChange={(e) => setShowDrpsTrend(e.target.checked)}
                    className="accent-[#8B5A2B] w-4.5 h-4.5 border-2 border-border"
                  />
                  DRP
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTechChecksTrend}
                    onChange={(e) => setShowTechChecksTrend(e.target.checked)}
                    className="accent-[#059669] w-4.5 h-4.5 border-2 border-border"
                  />
                  สอนพ่นยา
                </label>
              </div>
            </div>

            <div className="h-[320px] w-full mt-4 font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={getTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 'bold' }}
                    axisLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#8B5A2B' }}
                    axisLine={{ stroke: '#8B5A2B', strokeWidth: 1.5 }}
                    tickLine={{ stroke: '#8B5A2B' }}
                    name="DRP"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '2px solid var(--border)',
                      boxShadow: 'var(--retro-shadow-sm)',
                      fontFamily: 'inherit',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 'black', color: 'var(--foreground)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>

                  {/* Lines/Areas */}
                  {showVisitsTrend && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="visits"
                      name="ยอดผู้รับบริการ (คน)"
                      fill="url(#visitGrad)"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }}
                    />
                  )}
                  {showTechChecksTrend && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="techChecks"
                      name="สอนพ่นยา (ครั้ง)"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1.5, fill: 'var(--card)' }}
                    />
                  )}
                  {showDrpsTrend && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="drps"
                      name="ยอด DRP (รายการ)"
                      stroke="#8B5A2B"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, strokeWidth: 2, fill: '#8B5A2B' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeContent>

        {/* Tuesday Roster Card (Right 4 Columns) */}
        <FadeContent delay={0.35} className="lg:col-span-4">
          <div className="retro-card p-6 h-full flex flex-col justify-between bg-card font-sans">
            <div>
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 mb-2">
                <CalendarDays size={18} className="text-primary" /> ตารางผู้ป่วยนัด (วันอังคาร)
              </h3>

              <div className="flex flex-col gap-3 my-4 font-sans">
                <select
                  className="w-full text-xs font-bold text-foreground bg-card p-2.5 border-2 border-border cursor-pointer focus:outline-none"
                  value={selectedTuesday ? format(selectedTuesday, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleTuesdayChange(e.target.value)}
                >
                  {tuesdayOptions.map(d => (
                    <option key={d.toISOString()} value={format(d, 'yyyy-MM-dd')}>
                      📅 {format(d, 'd MMM yyyy', { locale: th })} {isSameDay(d, new Date()) ? '(วันนี้)' : ''}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider bg-secondary/50 p-2.5 border-2 border-border">
                  <span>ผู้ป่วยนัดทั้งหมด</span>
                  <span className="bg-primary text-primary-foreground px-2 py-0.5 border border-border">
                    {tuesdayAppts.length} คน
                  </span>
                </div>
              </div>

              {tuesdayAppts.length > 0 && (
                <div className="flex border-2 border-border p-0.5 bg-secondary/30 w-full mb-3 text-[10px] font-black uppercase font-sans">
                  <span className="self-center px-2 text-muted-foreground">จัดเรียง:</span>
                  <button
                    onClick={() => setTuesdaySort(tuesdaySort === 'hn' ? 'none' : 'hn')}
                    className={`flex-1 py-1.5 text-center transition-all cursor-pointer border ${
                      tuesdaySort === 'hn'
                        ? 'bg-primary text-primary-foreground border-border shadow-[1px_1px_0px_0px_var(--border)] -translate-y-0.5 -translate-x-0.5'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    เรียงตาม HN
                  </button>
                  <button
                    onClick={() => setTuesdaySort(tuesdaySort === 'name' ? 'none' : 'name')}
                    className={`flex-1 py-1.5 text-center transition-all cursor-pointer border ${
                      tuesdaySort === 'name'
                        ? 'bg-primary text-primary-foreground border-border shadow-[1px_1px_0px_0px_var(--border)] -translate-y-0.5 -translate-x-0.5'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    เรียงตามชื่อ
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 font-sans">
                {tuesdayAppts.length > 0 ? (
                  getSortedTuesdayAppts().map((appt, i) => (
                    <div key={i} className="bg-card p-2.5 border-2 border-border flex justify-between items-center shadow-[2px_2px_0px_0px_var(--border-light)] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform">
                      <div>
                        <Link href={`/staff/patient/${appt.hn}`} className="font-bold text-xs text-foreground hover:text-primary transition-colors block">
                          {appt.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">HN: {appt.hn}</p>
                      </div>
                      <span className="text-[10px] font-black bg-secondary px-2 py-0.5 border border-border">{appt.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/60 bg-secondary/20">
                    <Users size={24} className="mx-auto mb-1 opacity-40 text-muted-foreground" />
                    <p className="text-xs font-bold">ไม่มีนัดหมายในสัปดาห์นี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeContent>

      </div>

      {/* --- Clinical Breakdown & Mistakes for the selected period --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* DRP breakdown in period */}
        <FadeContent delay={0.4}>
          <div className="retro-card p-6 bg-card flex flex-col justify-between h-full font-sans">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Pill size={18} className="text-[#8B5A2B]" /> รายละเอียด DRP ในช่วงเวลา
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ประมวลผลสำหรับช่วง {getFormattedPeriodLabel()}
                  </p>
                </div>
              </div>

              {/* Stats Chips Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                <div className="bg-secondary/40 border-2 border-border p-3 text-center">
                  <div className="flex justify-center mb-1"><ListChecks size={16} className="text-foreground" /></div>
                  <p className="text-xl font-black text-foreground">{periodDrpStats.totalPatients}</p>
                  <p className="text-[10px] text-muted-foreground font-black mt-0.5">พบ DRP</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border-2 border-border p-3 text-center">
                  <div className="flex justify-center mb-1"><CheckCircle2 size={16} className="text-green-600" /></div>
                  <p className="text-xl font-black text-green-700 dark:text-green-400">{periodDrpStats.resolved}</p>
                  <p className="text-[10px] text-green-700 dark:text-green-300 font-black mt-0.5">แก้ไขสำเร็จ</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-border p-3 text-center">
                  <div className="flex justify-center mb-1"><Clock3 size={16} className="text-amber-600" /></div>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-400">{periodDrpStats.followUp}</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 font-black mt-0.5">รอติดตาม</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-border p-3 text-center">
                  <div className="flex justify-center mb-1"><XCircle size={16} className="text-rose-500" /></div>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400">{periodDrpStats.refused}</p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-300 font-black mt-0.5">ปฏิเสธ/ไม่สำเร็จ</p>
                </div>
              </div>

              {/* Breakdown lists */}
              {currentDrps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category breakdown */}
                  <div className="bg-secondary/20 p-4 border-2 border-border">
                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <AlertCircle size={12} className="text-primary" /> ประเภทของปัญหา (Category)
                    </h4>
                    <div className="space-y-3">
                      {periodDrpStats.topCategories.map((cat, i) => {
                        const maxCount = periodDrpStats.topCategories[0]?.count || 1;
                        const pct = Math.round((cat.count / maxCount) * 100);
                        const shortName = cat.name.replace(/^\d+\.\s*/, '').replace(/\s*\(.*\)/, '').trim();
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center text-[10px] mb-0.5">
                              <span className="font-bold text-foreground truncate max-w-[120px]" title={cat.name}>
                                #{i + 1} {shortName}
                              </span>
                              <span className="font-black text-[#8B5A2B] shrink-0 ml-1">{cat.count} ราย</span>
                            </div>
                            <div className="w-full bg-border-light dark:bg-zinc-800 h-1.5 border border-border">
                              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Problem Type breakdown */}
                  <div className="bg-secondary/20 p-4 border-2 border-border">
                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <AlertCircle size={12} className="text-rose-500" /> ลักษณะย่อยของปัญหา
                    </h4>
                    <div className="space-y-3">
                      {periodDrpStats.topTypes.map((t, i) => {
                        const maxCount = periodDrpStats.topTypes[0]?.count || 1;
                        const pct = Math.round((t.count / maxCount) * 100);
                        const shortName = t.name.replace(/^[\d.]+\s*/, '').replace(/\s*\(.*\)/, '').trim();
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center text-[10px] mb-0.5">
                              <span className="font-bold text-foreground truncate max-w-[120px]" title={t.name}>
                                #{i + 1} {shortName}
                              </span>
                              <span className="font-black text-rose-600 shrink-0 ml-1">{t.count} ราย</span>
                            </div>
                            <div className="w-full bg-border-light dark:bg-zinc-800 h-1.5 border border-border">
                              <div className="bg-rose-400 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs font-bold text-muted-foreground border-2 border-dashed border-border bg-secondary/10">
                  ไม่มีประวัติการบันทึก DRP ในช่วงเวลานี้
                </div>
              )}
            </div>
          </div>
        </FadeContent>

        {/* Inhaler mistakes breakdown in period */}
        <FadeContent delay={0.45}>
          <div className="retro-card p-6 bg-card flex flex-col justify-between h-full font-sans">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Stethoscope size={18} className="text-[#059669]" /> สรุปการสอนพ่นยาในช่วงเวลา
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ประมวลผลสำหรับช่วง {getFormattedPeriodLabel()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Checks Count */}
                <div className="border-2 border-border bg-secondary/10 p-5 flex flex-col justify-center items-center text-center">
                  <div className="w-10 h-10 border-2 border-border bg-secondary text-[#059669] flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_var(--border)]">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="text-4xl font-black text-foreground font-sans">
                    <CountUp target={periodTechStats.totalChecks} />
                  </h4>
                  <p className="text-xs font-black text-muted-foreground uppercase mt-1">จำนวนการสอน (ครั้ง)</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                    ครอบคลุมคนไข้ {periodTechStats.totalPatients} คน
                  </p>
                </div>

                {/* Common mistakes */}
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-500" /> ข้อผิดพลาดพบบ่อย 3 อันดับ
                  </h4>

                  {periodTechStats.topMistakes.length > 0 ? (
                    <div className="space-y-2">
                      {periodTechStats.topMistakes.map((m: { step: string; count: number }, i: number) => (
                        <div key={i} className="bg-card p-2.5 border-2 border-border flex gap-3 items-start shadow-[2px_2px_0px_0px_var(--border-light)]">
                          <span className="flex-shrink-0 w-5 h-5 border border-border bg-rose-100 text-rose-700 font-black text-[10px] flex items-center justify-center mt-0.5">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="text-[11px] font-bold text-foreground leading-tight">{m.step}</p>
                            <p className="text-[10px] text-rose-500 font-black mt-1">พ่นผิด {m.count} ครั้ง</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs font-bold text-muted-foreground border-2 border-dashed border-border bg-secondary/10">
                      ไม่มีการบันทึกข้อผิดพลาดการพ่นยา
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeContent>

      </div>

      {/* --- Patient Demographic Overview (Status & Age - Pie & Bar Charts) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Status Pie Chart */}
        <FadeContent delay={0.5} className="retro-box-static bg-card p-6">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 mb-6 font-sans">
            <PieChartIcon size={18} className="text-primary" /> สัดส่วนสถานะผู้ป่วยคลินิกทั้งหมด
          </h3>
          <div className="h-[260px] w-full relative font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="var(--border)"
                  strokeWidth={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '2px solid var(--border)',
                    boxShadow: 'var(--retro-shadow-sm)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="rect" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-10 text-center pointer-events-none">
              <span className="text-2xl font-black text-foreground">{patients.length}</span>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">ทั้งหมด (คน)</p>
            </div>
          </div>
        </FadeContent>

        {/* Age Groups Bar Chart */}
        <FadeContent delay={0.55} className="retro-box-static bg-card p-6">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2 mb-6 font-sans">
            <BarChart3 size={18} className="text-primary" /> สัดส่วนช่วงอายุผู้ป่วยสะสม
          </h3>
          <div className="h-[260px] w-full font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 'bold' }}
                  axisLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  axisLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                  tickLine={{ stroke: 'var(--border)' }}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--secondary)', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '2px solid var(--border)',
                    boxShadow: 'var(--retro-shadow-sm)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" name="จำนวนคน" fill="var(--primary)" stroke="var(--border)" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FadeContent>

      </div>

      {/* --- Advanced Drill-Down Modals --- */}

      {/* 1. Patient Visits Drill-down */}
      <Modal
        isOpen={activeDrillDown === 'visits'}
        onClose={() => setActiveDrillDown(null)}
        title={`ประวัติผู้รับบริการ: ${getFormattedPeriodLabel()} (${currentVisits.length} รายการ)`}
      >
        <div className="space-y-4">
          <div className="relative font-sans">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="ค้นหา HN หรือ ชื่อผู้ป่วย..."
              className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-border bg-card focus:outline-none"
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto border-2 border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-secondary/70 border-b-2 border-border text-foreground font-black sticky top-0 z-10 font-sans">
                <tr>
                  <th className="p-3">วันที่</th>
                  <th className="p-3">HN</th>
                  <th className="p-3">ชื่อ-นามสกุล</th>
                  <th className="p-3">PEFR</th>
                  <th className="p-3">ระดับการควบคุม</th>
                  <th className="p-3">นัดครั้งถัดไป</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border font-sans">
                {(getFilteredModalData() as Visit[]).map((v, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors bg-card">
                    <td className="p-3 font-bold">{toThaiShortDate(v.visit_date ?? v.date ?? '')}</td>
                    <td className="p-3">
                      <Link href={`/staff/patient/${v.hn}`} onClick={() => setActiveDrillDown(null)} className="text-primary font-black hover:underline cursor-pointer font-mono">
                        {v.hn}
                      </Link>
                    </td>
                    <td className="p-3 font-bold text-foreground">{getPatientName(v.hn)}</td>
                    <td className="p-3 font-mono font-bold text-foreground">
                      {v.pefr ? `${v.pefr} L/min` : '-'}
                    </td>
                    <td className="p-3">
                      {v.control_level === 'Controlled' ? (
                        <span className="px-2 py-0.5 border border-border bg-emerald-100 text-emerald-800 font-bold text-[10px]">Controlled</span>
                      ) : v.control_level === 'Partly Controlled' ? (
                        <span className="px-2 py-0.5 border border-border bg-amber-100 text-amber-800 font-bold text-[10px]">Partly Controlled</span>
                      ) : v.control_level === 'Uncontrolled' ? (
                        <span className="px-2 py-0.5 border border-border bg-rose-100 text-rose-800 font-bold text-[10px]">Uncontrolled</span>
                      ) : (
                        <span className="px-2 py-0.5 border border-border bg-muted text-muted-foreground font-bold text-[10px]">{v.control_level || '-'}</span>
                      )}
                    </td>
                    <td className="p-3 font-bold">{toThaiShortDate(v.next_appt)}</td>
                  </tr>
                ))}
                {getFilteredModalData().length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold bg-card">
                      ไม่พบประวัติผู้รับบริการในช่วงเวลานี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 2. DRP Problems Drill-down */}
      <Modal
        isOpen={activeDrillDown === 'drps'}
        onClose={() => setActiveDrillDown(null)}
        title={`ปัญหาการใช้ยา (DRP): ${getFormattedPeriodLabel()} (${currentDrps.length} รายการ)`}
      >
        <div className="space-y-4 font-sans">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="ค้นหา HN, ชื่อ, ปัญหา, ประเภทปัญหา..."
              className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-border bg-card focus:outline-none"
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto border-2 border-border">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead className="bg-secondary/70 border-b-2 border-border text-foreground font-black sticky top-0 z-10">
                <tr>
                  <th className="p-3">วันที่</th>
                  <th className="p-3">HN</th>
                  <th className="p-3">ชื่อ-นามสกุล</th>
                  <th className="p-3">ประเภทปัญหา (Category)</th>
                  <th className="p-3">ลักษณะปัญหา (Type)</th>
                  <th className="p-3">การช่วยเหลือ</th>
                  <th className="p-3">ผลลัพธ์</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {(getFilteredModalData() as DRP[]).map((d, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors bg-card">
                    <td className="p-3 font-bold">{toThaiShortDate(d.visit_date || d.created_date || d.date)}</td>
                    <td className="p-3">
                      <Link href={`/staff/patient/${d.hn}`} onClick={() => setActiveDrillDown(null)} className="text-primary font-black hover:underline cursor-pointer font-mono">
                        {d.hn}
                      </Link>
                    </td>
                    <td className="p-3 font-bold text-foreground">{getPatientName(d.hn)}</td>
                    <td className="p-3 font-bold text-foreground truncate max-w-[150px]" title={d.category}>{d.category}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[150px]" title={d.type}>{d.type}</td>
                    <td className="p-3 text-foreground truncate max-w-[150px]" title={d.intervention}>{d.intervention || '-'}</td>
                    <td className="p-3">
                      {(() => {
                        const o = (d.outcome || '').toLowerCase();
                        if (o.includes('resolved') || o.includes('สำเร็จ')) {
                          return <span className="px-2 py-0.5 border border-border bg-green-100 text-green-800 font-bold text-[10px]">Resolved</span>;
                        } else if (o.includes('monitoring') || o.includes('follow') || o.includes('ติดตาม')) {
                          return <span className="px-2 py-0.5 border border-border bg-amber-100 text-amber-800 font-bold text-[10px]">Follow-up</span>;
                        } else if (o.includes('refused') || o.includes('ปฏิเสธ')) {
                          return <span className="px-2 py-0.5 border border-border bg-rose-100 text-rose-800 font-bold text-[10px]">Refused</span>;
                        }
                        return <span className="px-2 py-0.5 border border-border bg-muted text-muted-foreground font-bold text-[10px]">{d.outcome || '-'}</span>;
                      })()}
                    </td>
                  </tr>
                ))}
                {getFilteredModalData().length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground font-bold bg-card">
                      ไม่พบประวัติปัญหา DRP ในช่วงเวลานี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3. Inhaler Technique checks Drill-down */}
      <Modal
        isOpen={activeDrillDown === 'techChecks'}
        onClose={() => setActiveDrillDown(null)}
        title={`สรุปการสอนพ่นยา: ${getFormattedPeriodLabel()} (${currentTechChecks.length} รายการ)`}
      >
        <div className="space-y-4 font-sans">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="ค้นหา HN, ชื่อ, หมายเหตุ..."
              className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-border bg-card focus:outline-none"
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto border-2 border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-secondary/70 border-b-2 border-border text-foreground font-black sticky top-0 z-10">
                <tr>
                  <th className="p-3">วันที่</th>
                  <th className="p-3">HN</th>
                  <th className="p-3">ชื่อ-นามสกุล</th>
                  <th className="p-3">คะแนน</th>
                  <th className="p-3">จุดที่ยังทำไม่ถูกต้อง</th>
                  <th className="p-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {(getFilteredModalData() as TechniqueCheck[]).map((t, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors bg-card">
                    <td className="p-3 font-bold">{toThaiShortDate(t.date)}</td>
                    <td className="p-3">
                      <Link href={`/staff/patient/${t.hn}`} onClick={() => setActiveDrillDown(null)} className="text-primary font-black hover:underline cursor-pointer font-mono">
                        {t.hn}
                      </Link>
                    </td>
                    <td className="p-3 font-bold text-foreground">{getPatientName(t.hn)}</td>
                    <td className="p-3 font-mono font-bold text-foreground">
                      <span className={`px-2 py-0.5 border border-border font-bold text-xs ${t.score === 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {t.score}/8
                      </span>
                    </td>
                    <td className="p-3 font-bold text-rose-600 truncate max-w-[200px]" title={getMissedSteps(t)}>
                      {getMissedSteps(t)}
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[150px]" title={t.note || '-'}>{t.note || '-'}</td>
                  </tr>
                ))}
                {getFilteredModalData().length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold bg-card">
                      ไม่พบข้อมูลการประเมินการสอนพ่นยาในช่วงเวลานี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 4. New Patients Drill-down */}
      <Modal
        isOpen={activeDrillDown === 'newPatients'}
        onClose={() => setActiveDrillDown(null)}
        title={`รายชื่อผู้ป่วยรายใหม่: ${getFormattedPeriodLabel()} (${currentNewPatients.length} คน)`}
      >
        <div className="space-y-4 font-sans font-sans">
          <div className="relative font-sans">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="ค้นหา HN หรือ ชื่อผู้ป่วย..."
              className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-border bg-card focus:outline-none"
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto border-2 border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-secondary/70 border-b-2 border-border text-foreground font-black sticky top-0 z-10">
                <tr>
                  <th className="p-3">วันที่เริ่มรับบริการ</th>
                  <th className="p-3">HN</th>
                  <th className="p-3">ชื่อ-นามสกุล</th>
                  <th className="p-3">เบอร์ติดต่อ</th>
                  <th className="p-3">สถานะการรักษา</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {(getFilteredModalData() as Visit[]).map((v, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors bg-card">
                    <td className="p-3 font-bold">{toThaiShortDate(v.visit_date ?? v.date ?? '')}</td>
                    <td className="p-3">
                      <Link href={`/staff/patient/${v.hn}`} onClick={() => setActiveDrillDown(null)} className="text-primary font-black hover:underline cursor-pointer font-mono">
                        {v.hn}
                      </Link>
                    </td>
                    <td className="p-3 font-bold text-foreground">{getPatientName(v.hn)}</td>
                    <td className="p-3 font-mono text-foreground">{getPatientPhone(v.hn)}</td>
                    <td className="p-3">
                      {(() => {
                        const status = getPatientStatus(v.hn);
                        return (
                          <span className={`px-2 py-0.5 border border-border font-bold text-[10px] ${status === 'Active' ? 'bg-green-100 text-green-800' : status === 'COPD' ? 'bg-orange-100 text-orange-800' : 'bg-muted text-muted-foreground'
                            }`}>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {getFilteredModalData().length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground font-bold bg-card">
                      ไม่พบประวัติผู้ป่วยรายใหม่ในช่วงเวลานี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  delay: number;
  trend?: string;
  color?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StatTile({ label, value, sub, icon, delay, trend, color, onClick, clickable }: StatTileProps) {
  const isNegativeTrend = trend ? trend.startsWith('-') : false;
  const isZeroTrend = trend ? trend === '0%' : true;

  return (
    <FadeContent delay={delay} className="w-full font-sans">
      <div
        onClick={clickable ? onClick : undefined}
        className={`bg-card border-2 border-border shadow-retro-sm p-5 relative overflow-hidden group transition-all duration-150 ${clickable ? 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-retro' : ''
          }`}
      >
        <div className="absolute inset-0 z-0 bg-transparent group-hover:bg-primary/5 transition-colors" />

        <div className="flex justify-between items-start mb-4 relative z-10 pointer-events-none">
          <div className={`p-2 border-2 border-border bg-secondary/30 ${color || 'text-foreground'}`}>
            {icon}
          </div>
          {trend && (
            <span
              className={`flex items-center text-xs font-black border-2 border-border px-2 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isZeroTrend
                ? 'bg-muted text-muted-foreground'
                : isNegativeTrend
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
                }`}
            >
              {!isZeroTrend && <TrendingUp size={12} className={`mr-1 ${isNegativeTrend ? 'rotate-180 text-rose-600' : 'text-green-600'}`} />}
              {trend}
            </span>
          )}
        </div>

        <div className="relative z-10 pointer-events-none">
          <p className="text-muted-foreground text-xs font-black uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-3xl font-black text-foreground flex items-baseline gap-1">
              <CountUp target={value} />
              <span className="text-sm font-normal text-muted-foreground">{sub}</span>
            </h4>
            {clickable && (
              <LineChart size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>
    </FadeContent>
  );
}
