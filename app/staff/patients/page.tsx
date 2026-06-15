"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Users, Activity, Search, X, Filter,
  Calendar, ChevronRight, Clock, AlertCircle, CheckCircle, Printer
} from 'lucide-react';
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Patient, Visit } from '@/lib/types';
import { getUnresolvedDrps } from '@/lib/drp-helpers';
import { getBangkokDateString } from '@/lib/date-utils';

// Extended type for internal use
interface PatientWithAppt extends Patient {
  nextAppt: Date | null;
  lastVisit: Date | null;
  latestControlLevel: string | null;
  hasUnresolvedDRP?: boolean;
  visitDates: Set<string>;
}

export default function PatientListPage() {
  const router = useRouter();
  const { status } = useSession();

  // Data State
  const [patients, setPatients] = useState<PatientWithAppt[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState('VisitOnDate'); // 'VisitOnDate', 'ApptOnDate', 'All', 'UnresolvedDRP', 'Warning'
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setSelectedDate(getBangkokDateString());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Parallel fetch for speed
      const [resPatients, resVisits, resDrps] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits'),
        fetch('/api/db?type=drps')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();
      const dataDrps = await resDrps.json();

      if (!Array.isArray(dataPatients)) return;

      const unresolvedDrps = Array.isArray(dataDrps) ? getUnresolvedDrps(dataDrps) : [];
      const hnsWithUnresolvedDrps = new Set(unresolvedDrps.map((d) => String(d.hn)));

      // Process Data: Join Patients with Visits to find Next Appointment and Visit Dates
      const processed = dataPatients.map(p => {
        // Find visits for this patient
        const pVisits = Array.isArray(dataVisits)
          ? dataVisits.filter(v => v.hn === p.hn)
          : [];

        // Extract visit dates (YYYY-MM-DD)
        const visitDates = new Set(
          pVisits
            .map(v => {
              const dStr = v.visit_date ?? v.date ?? '';
              if (!dStr) return '';
              return dStr.split('T')[0];
            })
            .filter(Boolean)
        );

        // Find next appointment (future date)
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let nextAppt: Date | null = null;
        let lastVisit: Date | null = null;
        let latestControlLevel: string | null = null;

        // Sort visits by date descending
        pVisits.sort((a, b) => new Date(b.visit_date ?? b.date ?? '').getTime() - new Date(a.visit_date ?? a.date ?? '').getTime());

        if (pVisits.length > 0) {
          lastVisit = new Date(pVisits[0].visit_date ?? pVisits[0].date ?? '');
          latestControlLevel = pVisits[0].control_level || null;

          // Check for explicit next appointment fields
          // Filter valid future dates
          const futureAppts = pVisits
            .map(v => v.next_appt ? new Date(v.next_appt) : null)
            .filter(d => d && !isNaN(d.getTime()) && d >= now) as Date[];

          if (futureAppts.length > 0) {
            // Sort ascending to get nearest
            futureAppts.sort((a, b) => a.getTime() - b.getTime());
            nextAppt = futureAppts[0];
          }
        }

        const hasUnresolvedDRP = hnsWithUnresolvedDrps.has(String(p.hn));

        return {
          ...p,
          nextAppt,
          lastVisit,
          latestControlLevel,
          hasUnresolvedDRP,
          visitDates
        };
      });

      setPatients(processed);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic counts for triage filters
  const counts = useMemo(() => {
    const dateToCheck = selectedDate || getBangkokDateString();
    
    let visitsCount = 0;
    let apptsCount = 0;
    let drpCount = 0;
    let warningCount = 0;

    patients.forEach(p => {
      if (p.visitDates && p.visitDates.has(dateToCheck)) {
        visitsCount++;
      }
      if (p.nextAppt) {
        const apptStr = p.nextAppt.toISOString().split('T')[0];
        if (apptStr === dateToCheck) {
          apptsCount++;
        }
      }
      if (p.hasUnresolvedDRP) {
        drpCount++;
      }
      if (p.latestControlLevel === 'Partly Controlled' || p.latestControlLevel === 'Uncontrolled') {
        warningCount++;
      }
    });

    return {
      visits: visitsCount,
      appointments: apptsCount,
      drps: drpCount,
      warnings: warningCount,
      total: patients.length
    };
  }, [patients, selectedDate]);

  // --- Filter and Sort Logic ---
  const displayedPatients = useMemo(() => {
    const dateToCheck = selectedDate || getBangkokDateString();

    // 1. Filter first
    const filtered = patients.filter(p => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.hn.toLowerCase().includes(query) ||
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query);

      const matchStatus = filterStatus === 'All' || p.status === filterStatus;

      let matchQuick = true;

      if (quickFilter === 'VisitOnDate') {
        matchQuick = p.visitDates && p.visitDates.has(dateToCheck);
      } else if (quickFilter === 'ApptOnDate') {
        if (p.nextAppt) {
          const apptStr = p.nextAppt.toISOString().split('T')[0];
          matchQuick = apptStr === dateToCheck;
        } else {
          matchQuick = false;
        }
      } else if (quickFilter === 'Warning') {
        matchQuick = p.latestControlLevel === 'Partly Controlled' || p.latestControlLevel === 'Uncontrolled';
      } else if (quickFilter === 'UnresolvedDRP') {
        matchQuick = !!p.hasUnresolvedDRP;
      }

      return matchSearch && matchStatus && matchQuick;
    });

    // 2. Sort Logic
    if (!searchTerm) {
      if (quickFilter === 'VisitOnDate' || quickFilter === 'ApptOnDate') {
        // Sort by HN or Name for active lists
        filtered.sort((a, b) => a.hn.localeCompare(b.hn, undefined, { numeric: true }));
      } else {
        filtered.sort((a, b) => {
          // Priority 1: Has Next Appointment (Nearest wins)
          if (a.nextAppt && b.nextAppt) {
            const timeDiff = a.nextAppt.getTime() - b.nextAppt.getTime();
            if (timeDiff !== 0) return timeDiff;
          } else if (a.nextAppt) {
            return -1; // a comes first
          } else if (b.nextAppt) {
            return 1;  // b comes first
          }

          // Priority 2: HN (Ascending)
          const hnDiff = a.hn.localeCompare(b.hn, undefined, { numeric: true });
          if (hnDiff !== 0) return hnDiff;

          // Priority 3: Last Visit (Recent wins)
          if (a.lastVisit && b.lastVisit) {
            return b.lastVisit.getTime() - a.lastVisit.getTime();
          }

          return 0;
        });

        if (quickFilter === 'All') {
          return filtered.slice(0, 30);
        }
      }
    }

    return filtered;
  }, [patients, searchTerm, filterStatus, quickFilter, selectedDate]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-8 pb-20 animate-fade-up">
        {/* Skeleton Header */}
        <div className="flex justify-between items-end border-b-2 border-border pb-6">
          <div>
            <div className="h-8 w-40 skeleton-shimmer rounded-lg" />
            <div className="h-4 w-56 skeleton-shimmer rounded mt-2" />
          </div>
          <div className="h-10 w-36 skeleton-shimmer rounded-lg" />
        </div>
        {/* Skeleton Patient Rows */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border-2 border-border p-4 flex items-center gap-4 bg-background">
              <div className="w-12 h-12 skeleton-shimmer rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 skeleton-shimmer rounded" />
                <div className="h-3 w-32 skeleton-shimmer rounded" />
              </div>
              <div className="h-4 w-20 skeleton-shimmer rounded hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-border pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#2D2A26] dark:text-white uppercase tracking-tight">รายชื่อผู้ป่วย</h2>
          <p className="text-muted-foreground mt-1 font-bold">จัดการข้อมูลและคัดกรองผู้ป่วยคลินิกโรคหืด</p>
        </div>
        <div className="flex gap-3">
          <Link href="/staff/print-cards">
            <Button variant="outline" className="retro-button bg-background text-foreground font-bold gap-2 px-6 py-2.5 h-auto cursor-pointer">
              <Printer size={18} /> พิมพ์บัตรประจำตัว
            </Button>
          </Link>
          <Link href="/staff/register">
            <Button className="retro-button-primary font-bold gap-2 px-6 py-2.5 h-auto cursor-pointer">
              <UserPlus size={18} /> ลงทะเบียนใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Control Panel (Search, Status, Date) */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-sm py-4 -mx-2 px-2 border-b-2 border-border/10">
        <div className={`p-4 bg-background border-2 border-border retro-box-static transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/20' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Search Box */}
            <div className="lg:col-span-6 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อ, นามสกุล หรือ HN..."
                className="w-full pl-12 pr-10 py-3 bg-background border-2 border-border font-bold focus:outline-none focus:border-primary transition-all text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="lg:col-span-3 relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full py-3 pl-4 pr-10 bg-background border-2 border-border font-bold focus:outline-none focus:border-primary cursor-pointer appearance-none text-sm md:text-base"
              >
                <option value="All">สถานะ: ทั้งหมด</option>
                <option value="Active">Active Only</option>
                <option value="COPD">COPD Only</option>
                <option value="Discharge">Discharge Only</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
            </div>

            {/* Date Selection */}
            <div className="lg:col-span-3 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  className="w-full py-3 pl-3 pr-2 bg-background border-2 border-border font-bold focus:outline-none focus:border-primary text-sm md:text-base"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (quickFilter !== 'VisitOnDate' && quickFilter !== 'ApptOnDate') {
                      setQuickFilter('VisitOnDate');
                    }
                  }}
                />
              </div>
              <button
                onClick={() => {
                  setSelectedDate(getBangkokDateString());
                  if (quickFilter !== 'VisitOnDate' && quickFilter !== 'ApptOnDate') {
                    setQuickFilter('VisitOnDate');
                  }
                }}
                className="px-3 bg-secondary hover:bg-secondary/80 border-2 border-border font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer"
                title="วันนี้"
              >
                วันนี้
              </button>
            </div>

          </div>
        </div>

        {/* Triage Tabs & Alarm Filter Badges */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-4">
          {/* Main Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickFilter('VisitOnDate')}
              className={`px-4 py-2 border-2 border-border font-black text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                quickFilter === 'VisitOnDate'
                  ? 'bg-primary text-white shadow-[2px_2px_0px_0px_rgba(61,56,52,1)] dark:shadow-[2px_2px_0px_0px_rgba(240,237,232,0.8)] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-background hover:bg-secondary text-foreground'
              }`}
            >
              <Activity size={16} />
              <span>มารับบริการในวันที่เลือก ({counts.visits})</span>
            </button>

            <button
              onClick={() => setQuickFilter('ApptOnDate')}
              className={`px-4 py-2 border-2 border-border font-black text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                quickFilter === 'ApptOnDate'
                  ? 'bg-primary text-white shadow-[2px_2px_0px_0px_rgba(61,56,52,1)] dark:shadow-[2px_2px_0px_0px_rgba(240,237,232,0.8)] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-background hover:bg-secondary text-foreground'
              }`}
            >
              <Calendar size={16} />
              <span>นัดหมายในวันที่เลือก ({counts.appointments})</span>
            </button>

            <button
              onClick={() => setQuickFilter('All')}
              className={`px-4 py-2 border-2 border-border font-black text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                quickFilter === 'All'
                  ? 'bg-primary text-white shadow-[2px_2px_0px_0px_rgba(61,56,52,1)] dark:shadow-[2px_2px_0px_0px_rgba(240,237,232,0.8)] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-background hover:bg-secondary text-foreground'
              }`}
            >
              <Users size={16} />
              <span>ผู้ป่วยทั้งหมด ({counts.total})</span>
            </button>
          </div>

          {/* Warning Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickFilter('UnresolvedDRP')}
              className={`px-4 py-2 border-2 border-border font-black text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                quickFilter === 'UnresolvedDRP'
                  ? 'bg-amber-500 text-foreground shadow-[2px_2px_0px_0px_rgba(61,56,52,1)] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-background hover:bg-amber-500/10 text-amber-600 border-amber-500/30'
              }`}
            >
              <AlertCircle size={16} />
              <span>ต้องติดตาม DRP ({counts.drps})</span>
            </button>

            <button
              onClick={() => setQuickFilter('Warning')}
              className={`px-4 py-2 border-2 border-border font-black text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                quickFilter === 'Warning'
                  ? 'bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(61,56,52,1)] dark:shadow-[2px_2px_0px_0px_rgba(240,237,232,0.8)] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-background hover:bg-red-500/10 text-red-500 border-red-500/30'
              }`}
            >
              <AlertCircle size={16} />
              <span>ต้องเฝ้าระวัง ({counts.warnings})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Patient List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 border-b border-border pb-2">
          <h3 className="font-black text-lg flex items-center gap-2 text-foreground">
            {(() => {
              const dateObj = new Date(selectedDate || getBangkokDateString());
              const formattedDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
              
              if (searchTerm) {
                return (
                  <>
                    <Search size={18} className="text-primary" />
                    <span>ผลการค้นหา: &ldquo;{searchTerm}&rdquo; <span className="text-muted-foreground text-sm font-bold">({displayedPatients.length} รายการ)</span></span>
                  </>
                );
              }
              
              switch (quickFilter) {
                case 'VisitOnDate':
                  return (
                    <>
                      <Activity size={18} className="text-primary" />
                      <span>ผู้มารับบริการวันที่ {formattedDate} <span className="text-muted-foreground text-sm font-bold">({displayedPatients.length} คน)</span></span>
                    </>
                  );
                case 'ApptOnDate':
                  return (
                    <>
                      <Calendar size={18} className="text-primary" />
                      <span>ผู้มีนัดหมายวันที่ {formattedDate} <span className="text-muted-foreground text-sm font-bold">({displayedPatients.length} คน)</span></span>
                    </>
                  );
                case 'UnresolvedDRP':
                  return (
                    <>
                      <AlertCircle size={18} className="text-amber-500 animate-pulse" />
                      <span>ผู้ป่วยต้องติดตาม DRP <span className="text-muted-foreground text-sm font-bold">({displayedPatients.length} คน)</span></span>
                    </>
                  );
                case 'Warning':
                  return (
                    <>
                      <AlertCircle size={18} className="text-red-500" />
                      <span>ผู้ป่วยกลุ่มเฝ้าระวัง (คุมอาการไม่ได้/บางส่วน) <span className="text-muted-foreground text-sm font-bold">({displayedPatients.length} คน)</span></span>
                    </>
                  );
                default:
                  return (
                    <>
                      <Users size={18} className="text-primary" />
                      <span>ผู้ป่วยทั้งหมด <span className="text-muted-foreground text-sm font-bold">(แสดง 30 รายชื่อแรกเรียงตามวันนัดหมาย)</span></span>
                    </>
                  );
              }
            })()}
          </h3>
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="popLayout">
            {displayedPatients.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {displayedPatients.map((patient, index) => (
                  <PatientRowItem key={patient.hn} patient={patient} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-secondary/10 border-2 border-dashed border-border"
              >
                <div className="w-16 h-16 bg-secondary border-2 border-border flex items-center justify-center mb-4">
                  <Search size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-black">ไม่พบรายชื่อผู้ป่วยในกลุ่มนี้</p>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="mt-2 text-primary font-bold text-sm hover:underline cursor-pointer">
                    ล้างคำค้นหา
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

function PatientRowItem({ patient, index }: { patient: PatientWithAppt, index: number }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-805 border-emerald-350 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'COPD': return 'bg-orange-100 text-orange-805 border-orange-350 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40';
      case 'Discharge': return 'bg-zinc-100 text-zinc-650 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      default: return 'bg-zinc-100 text-zinc-650 border-zinc-300';
    }
  };

  const getControlLevelStyle = (level: string | null) => {
    if (!level) return null;
    switch (level) {
      case 'Controlled':
      case 'Well-controlled':
        return 'bg-emerald-50 text-emerald-750 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Partly Controlled':
        return 'bg-amber-50 text-amber-750 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Uncontrolled':
        return 'bg-red-50 text-red-750 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  const getDayDiff = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);

    const diff = Math.ceil((dateCopy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return { text: 'วันนี้', color: 'text-red-500 font-extrabold animate-pulse' };
    if (diff === 1) return { text: 'วันพรุ่งนี้', color: 'text-orange-500' };
    if (diff < 0) return { text: `${Math.abs(diff)} วันที่แล้ว (เกินกำหนด)`, color: 'text-red-500' };
    return { text: `อีก ${diff} วัน`, color: 'text-primary' };
  };

  const nextApptInfo = patient.nextAppt ? getDayDiff(patient.nextAppt) : null;

  const isVisitedToday = (() => {
    if (!patient.lastVisit) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(patient.lastVisit);
    lastDate.setHours(0, 0, 0, 0);
    return lastDate.getTime() === today.getTime();
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Link href={`/staff/patient/${patient.hn}`}>
        <div className="bg-background border-2 border-border p-4 pl-5 md:pl-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(61,56,52,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(240,237,232,0.8)] cursor-pointer group">
          
          {/* Patient Profile Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Gender Avatar (Neo-brutalism shape outline) */}
            {(() => {
              const prefix = patient.prefix?.trim() || "";
              const isFemale = prefix === 'นาง' || prefix === 'นางสาว' || prefix === 'น.ส.' || prefix === 'ด.ญ.';
              const isChild = prefix === 'ด.ช.' || prefix === 'ด.ญ.';
              const size = isChild ? 20 : 23;
              const colorClass = "bg-[#FAF6F1] dark:bg-zinc-800 text-[#D97736] border-2 border-border";

              return (
                <div className={`w-12 h-12 flex items-center justify-center ${colorClass} shrink-0 shadow-[2px_2px_0px_0px_rgba(61,56,52,1)]`}>
                  {isFemale ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M12 13 L7 22 H17 L12 13Z" />
                      <path d="M9.5 13.5 Q12 15.5 14.5 13.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="7" r="4" />
                      <rect x="7" y="13" width="10" height="9" rx="1" />
                    </svg>
                  )}
                </div>
              );
            })()}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-black group-hover:text-primary transition-colors truncate">
                  {patient.prefix}{patient.first_name} {patient.last_name}
                </h4>
                <span className={`px-2.5 py-0.5 border text-[10px] font-black uppercase tracking-wider ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
                
                {isVisitedToday && (
                  <span className="px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle size={10} /> มาตรวจวันนี้แล้ว
                  </span>
                )}
                
                {patient.hasUnresolvedDRP && (
                  <span className="px-2 py-0.5 border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40 text-[10px] font-black flex items-center gap-1">
                    <AlertCircle size={10} /> DRP ต้องติดตาม
                  </span>
                )}

                {patient.latestControlLevel && (
                  <span className={`px-2 py-0.5 border text-[10px] font-black ${getControlLevelStyle(patient.latestControlLevel)}`}>
                    คุมอาการ: {
                      (patient.latestControlLevel === 'Controlled' || patient.latestControlLevel === 'Well-controlled')
                        ? 'ดี'
                        : patient.latestControlLevel === 'Partly Controlled'
                          ? 'บางส่วน'
                          : 'ไม่ได้'
                    }
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground font-bold font-mono mt-1 flex flex-wrap items-center gap-x-4">
                <span>HN: {patient.hn}</span>
                {patient.phone && (
                  <span className="border-l-2 border-border pl-3 text-muted-foreground font-semibold">
                    📞 {patient.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Appointment Details & Actions */}
          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
            {/* Next Appointment Info */}
            <div className="flex flex-col items-start md:items-end text-left md:text-right min-w-[120px]">
              {patient.nextAppt ? (
                <>
                  <div className={`text-sm font-black flex items-center gap-1.5 ${nextApptInfo?.color}`}>
                    <Clock size={14} /> {nextApptInfo?.text}
                  </div>
                  <div className="text-xs text-muted-foreground font-bold mt-0.5">
                    นัด: {patient.nextAppt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground/60 italic font-bold">ไม่มีนัดหมายเร็วๆ นี้</div>
              )}
            </div>

            {/* Direct Action Link */}
            <div className="retro-button p-2.5 bg-secondary group-hover:bg-primary group-hover:text-white transition-all text-foreground cursor-pointer">
              <ChevronRight size={18} strokeWidth={2.5} />
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
