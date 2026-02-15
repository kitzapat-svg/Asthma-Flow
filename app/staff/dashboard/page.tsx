"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Users, Activity, FileText, Search, X, Filter,
  Calendar, ChevronRight, Clock, AlertCircle
} from 'lucide-react';
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Patient, Visit } from '@/lib/types';
import { CountUp } from '@/components/animated/count-up';
import { FadeContent } from '@/components/animated/fade-content';

// Extended type for internal use
interface PatientWithAppt extends Patient {
  nextAppt: Date | null;
  lastVisit: Date | null;
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
  const [isFocused, setIsFocused] = useState(false);


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
      const [resPatients, resVisits] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();

      if (!Array.isArray(dataPatients)) return;

      // Process Data: Join Patients with Visits to find Next Appointment
      const processed = dataPatients.map(p => {
        // Find visits for this patient
        const pVisits = Array.isArray(dataVisits)
          ? dataVisits.filter(v => v.hn === p.hn)
          : [];

        // Find next appointment (future date)
        // Logic: specific field 'next_appt' in visit, pick the one that is closest to now but in future
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let nextAppt: Date | null = null;
        let lastVisit: Date | null = null;

        // Sort visits by date descending
        pVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (pVisits.length > 0) {
          lastVisit = new Date(pVisits[0].date);

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

        return {
          ...p,
          nextAppt,
          lastVisit
        };
      });

      setPatients(processed);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic: Focus Mode vs Search Mode ---
  const displayedPatients = useMemo(() => {
    // 1. Filter first
    let filtered = patients.filter(p => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.hn.toLowerCase().includes(query) ||
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query);

      const matchStatus = filterStatus === 'All' || p.status === filterStatus;

      return matchSearch && matchStatus;
    });

    // 2. Sort Logic
    // If searching, sort by relevance (name match) or HN
    // If NOT searching (Default View), sort by Next Appointment (Nearest first), then Last Visit (Recent first)
    if (!searchTerm) {
      filtered.sort((a, b) => {
        // Priority 1: Has Next Appointment (Nearest wins)
        if (a.nextAppt && b.nextAppt) return a.nextAppt.getTime() - b.nextAppt.getTime();
        if (a.nextAppt) return -1; // a comes first
        if (b.nextAppt) return 1;  // b comes first

        // Priority 2: Last Visit (Recent wins)
        if (a.lastVisit && b.lastVisit) return b.lastVisit.getTime() - a.lastVisit.getTime();

        // Priority 3: Fallback to HN
        return b.hn.localeCompare(a.hn);
      });

      // Focus Mode: Limit to top 30
      // But only if we have patients with appointments or recent activity
      // If we have very few patients with appointments, we might want to show others too?
      // Requirement said: "Only show top 20-30... hide others"
      return filtered.slice(0, 30);
    }

    return filtered; // Return all matches when searching
  }, [patients, searchTerm, filterStatus]);

  // Stats for Cards
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'Active').length,
    copd: patients.filter(p => p.status === 'COPD').length,
    discharge: patients.filter(p => p.status === 'Discharge').length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="animate-spin text-primary mb-4" size={48} />
        <p className="text-muted-foreground font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">

      {/* 1. Header & Stats Section */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-[#2D2A26] dark:text-white">Dashboard</h2>
            <p className="text-muted-foreground mt-1">ภาพรวมผู้ป่วยคลินิกโรคหืด</p>
          </div>
          <Link href="/staff/register">
            <Button className="bg-primary text-white hover:bg-primary/90 dark:text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold gap-2 px-6">
              <UserPlus size={18} /> ลงทะเบียนใหม่
            </Button>
          </Link>
        </div>

        {/* Animated Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="ผู้ป่วยทั้งหมด" value={stats.total} icon={<Users size={20} />} color="bg-blue-500" delay={0.1} />
          <StatCard label="Active" value={stats.active} icon={<Activity size={20} />} color="bg-green-500" delay={0.15} />
          <StatCard label="COPD" value={stats.copd} icon={<AlertCircle size={20} />} color="bg-orange-500" delay={0.2} />
          <StatCard label="Discharge" value={stats.discharge} icon={<FileText size={20} />} color="bg-gray-500" delay={0.25} />
        </div>
      </div>

      {/* 2. Search & Filter Bar (Glassmorphism) */}
      <div className="sticky top-20 z-30 -mx-2 px-2 py-4">
        <div className={`glass-input p-2 rounded-2xl flex flex-col md:flex-row gap-2 transition-all duration-300 ${isFocused ? 'shadow-2xl ring-2 ring-primary/20 scale-[1.01]' : 'shadow-sm'}`}>

          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, HN..."
              className="w-full pl-12 pr-10 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-bold placeholder:font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="h-px md:h-auto md:w-px bg-border/50 mx-2" />

          <div className="relative min-w-[180px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-full pl-4 pr-10 py-3 bg-transparent border-none focus:ring-0 font-bold cursor-pointer appearance-none"
            >
              <option value="All">สถานะ: ทั้งหมด</option>
              <option value="Active">Active</option>
              <option value="COPD">COPD</option>
              <option value="Discharge">Discharge</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* 3. Patient List (Clean & Pro) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {searchTerm ? (
              <>
                <Search size={18} className="text-primary" />
                ผลการค้นหา <span className="text-muted-foreground text-sm font-normal">({displayedPatients.length} รายการ)</span>
              </>
            ) : (
              <>
                <Calendar size={18} className="text-primary" />
                นัดหมายใกล้มาถึง <span className="text-muted-foreground text-sm font-normal">(Top 30 เรียงตามเวลานัด)</span>
              </>
            )}
          </h3>
          {!searchTerm && displayedPatients.length > 0 && (
            <span className="text-xs text-muted-foreground bg-black/5 dark:bg-white/10 px-2 py-1 rounded-full">
              Auto-sorted by Appointment
            </span>
          )}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-border"
              >
                <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-bold">ไม่พบรายชื่อที่ค้นหา</p>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="mt-2 text-primary text-sm hover:underline">
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

// --- Components ---

function StatCard({ label, value, icon, color, delay }: any) {
  return (
    <FadeContent delay={delay} className="stat-card group">
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 transition-all group-hover:scale-150 group-hover:opacity-20`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-4xl font-black text-foreground">
          <CountUp target={value} duration={1.5} />
        </div>
      </div>
    </FadeContent>
  );
}

function PatientRowItem({ patient, index }: { patient: PatientWithAppt, index: number }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
      case 'COPD': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
      case 'Discharge': return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  const getDayDiff = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);

    const diff = Math.ceil((dateCopy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return { text: 'วันนี้', color: 'text-red-500 animate-pulse' };
    if (diff === 1) return { text: 'วันพรุ่งนี้', color: 'text-orange-500' };
    if (diff < 0) return { text: `${Math.abs(diff)} วันที่แล้ว (เกินกำหนด)`, color: 'text-red-500' };
    return { text: `อีก ${diff} วัน`, color: 'text-primary' };
  };

  const nextApptInfo = patient.nextAppt ? getDayDiff(patient.nextAppt) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/staff/patient/${patient.hn}`}>
        <div className="glass-card hover:bg-white dark:hover:bg-zinc-900 p-4 pl-6 rounded-2xl flex items-center justify-between group transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary hover:shadow-2xl hover:-translate-y-1">

          <div className="flex items-center gap-4">
            {/* Avatar Placeholder */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg bg-gradient-to-br from-gray-100 to-gray-300 dark:from-zinc-800 dark:to-zinc-700 text-foreground shadow-inner`}>
              {patient.first_name[0]}{patient.last_name[0]}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
                  {patient.prefix}{patient.first_name} {patient.last_name}
                </h4>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mt-0.5">
                HN: {patient.hn}
                {patient.phone && <span className="ml-3 border-l pl-3 border-border">📞 {patient.phone}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Next Appointment Info */}
            <div className="hidden md:flex flex-col items-end text-right">
              {patient.nextAppt ? (
                <>
                  <div className={`text-sm font-bold flex items-center gap-1.5 ${nextApptInfo?.color}`}>
                    <Clock size={14} /> {nextApptInfo?.text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    นัด: {patient.nextAppt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground/50 italic">ไม่มีนัดหมายเร็วๆ นี้</div>
              )}
            </div>

            <div className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-white group-hover:bg-primary transition-all">
              <ChevronRight size={20} />
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
