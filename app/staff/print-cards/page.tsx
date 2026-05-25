"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, ChevronLeft, Calendar, Search, CheckSquare, 
  Square, AlertCircle, Heart, Phone, Sparkles, Check, Info, FileText
} from 'lucide-react';
import { getBangkokDateString, toBangkokDateString } from '@/lib/date-utils';
import { getAge, normalizeHN } from '@/lib/helpers';
import { Patient, Visit, Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

// Card Theme configuration type
interface ThemeConfig {
  id: string;
  name: string;
  cardBg: string;
  borderColor: string;
  titleColor: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  qrBorder: string;
  qrBadgeBg: string;
  footerLeftBg: string;
  footerLeftText: string;
  inhalerColor: string;
}

const CARD_THEMES: ThemeConfig[] = [
  {
    id: 'blue',
    name: 'Clinical Blue',
    cardBg: 'bg-gradient-to-br from-white via-sky-50/50 to-sky-100/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-sky-950/20',
    borderColor: 'border-sky-500/20',
    titleColor: 'text-sky-950 dark:text-sky-200',
    accentText: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 border border-sky-100 dark:bg-sky-950/80',
    badgeText: 'text-sky-800 dark:text-sky-300',
    qrBorder: 'border-sky-300 dark:border-sky-800',
    qrBadgeBg: 'bg-sky-500 hover:bg-sky-600',
    footerLeftBg: 'bg-sky-950 dark:bg-sky-950/80',
    footerLeftText: 'text-white',
    inhalerColor: 'text-sky-400 dark:text-sky-700'
  },
  {
    id: 'green',
    name: 'Clinical Green',
    cardBg: 'bg-gradient-to-br from-white via-green-50/50 to-green-100/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-green-950/20',
    borderColor: 'border-green-500/20',
    titleColor: 'text-green-950 dark:text-green-200',
    accentText: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-50 border border-green-100 dark:bg-green-950/80',
    badgeText: 'text-green-800 dark:text-green-300',
    qrBorder: 'border-green-300 dark:border-green-800',
    qrBadgeBg: 'bg-green-700 hover:bg-green-800',
    footerLeftBg: 'bg-green-900 dark:bg-green-950/80',
    footerLeftText: 'text-white',
    inhalerColor: 'text-green-400 dark:text-green-700'
  },
  {
    id: 'purple',
    name: 'Clinical Purple',
    cardBg: 'bg-gradient-to-br from-white via-purple-50/50 to-purple-100/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-purple-950/20',
    borderColor: 'border-purple-500/20',
    titleColor: 'text-purple-950 dark:text-purple-200',
    accentText: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 border border-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-300',
    qrBorder: 'border-purple-300 dark:border-purple-800',
    qrBadgeBg: 'bg-purple-600 hover:bg-purple-700',
    footerLeftBg: 'bg-purple-900 dark:bg-purple-950/80',
    footerLeftText: 'text-white',
    inhalerColor: 'text-purple-400 dark:text-purple-700'
  },
  {
    id: 'charcoal',
    name: 'Luxury Charcoal',
    cardBg: 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 dark:from-black dark:via-black dark:to-zinc-900',
    borderColor: 'border-amber-500/20',
    titleColor: 'text-amber-100',
    accentText: 'text-amber-500',
    badgeBg: 'bg-amber-950/40 border border-amber-900/30',
    badgeText: 'text-amber-300',
    qrBorder: 'border-amber-500/30',
    qrBadgeBg: 'bg-amber-600 hover:bg-amber-700',
    footerLeftBg: 'bg-zinc-950 border-r border-zinc-800',
    footerLeftText: 'text-amber-100/80',
    inhalerColor: 'text-amber-500/20 dark:text-amber-500/10'
  }
];

export default function PrintCardsPage() {
  const router = useRouter();
  const { status } = useSession();

  // Selected Appt Date
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHns, setSelectedHns] = useState<Set<string>>(new Set());
  
  // Options Customization
  const [showCutGuidelines, setShowCutGuidelines] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string>('blue');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    setSelectedDate(getBangkokDateString());
  }, []);

  // Fetch initial base records
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchBaseData();
    }
  }, [status, router]);

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [resPatients, resVisits] = await Promise.all([
        fetch('/api/db?type=patients'),
        fetch('/api/db?type=visits')
      ]);

      const dataPatients: Patient[] = await resPatients.json();
      const dataVisits: Visit[] = await resVisits.json();

      setPatients(Array.isArray(dataPatients) ? dataPatients : []);
      setVisits(Array.isArray(dataVisits) ? dataVisits : []);
    } catch (err) {
      console.error("Failed to load base records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Find patients with appointments on the selected date
  const patientsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    
    // Find unique HNs scheduled for selectedDate
    const scheduledHns = new Set<string>();
    visits.forEach(v => {
      if (v.next_appt && v.next_appt.trim() === selectedDate) {
        scheduledHns.add(normalizeHN(v.hn));
      }
    });

    // Map scheduled HNs to actual Patient records
    const list = patients.filter(p => scheduledHns.has(normalizeHN(p.hn)));
    
    // By default, auto-select all newly fetched patients
    const newSelected = new Set<string>();
    list.forEach(p => newSelected.add(normalizeHN(p.hn)));
    setSelectedHns(newSelected);

    return list;
  }, [selectedDate, patients, visits]);

  // Filter list by Search Term
  const filteredPatients = useMemo(() => {
    return patientsOnDate.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      return (
        !q ||
        p.hn.toLowerCase().includes(q) ||
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q)
      );
    });
  }, [patientsOnDate, searchTerm]);

  // Selection Toggles
  const handleToggleSelect = (hn: string) => {
    const next = new Set(selectedHns);
    const normalized = normalizeHN(hn);
    if (next.has(normalized)) {
      next.delete(normalized);
    } else {
      next.add(normalized);
    }
    setSelectedHns(next);
  };

  const handleSelectAll = () => {
    const next = new Set<string>();
    filteredPatients.forEach(p => next.add(normalizeHN(p.hn)));
    setSelectedHns(next);
  };

  const handleDeselectAll = () => {
    setSelectedHns(new Set());
  };

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Build list of patients selected for printing
  const selectedPatientsList = useMemo(() => {
    return patientsOnDate.filter(p => selectedHns.has(normalizeHN(p.hn)));
  }, [patientsOnDate, selectedHns]);

  // Pagination calculations: 10 cards per A4 page (2 columns x 5 rows)
  const paginatedPages = useMemo(() => {
    const pageSize = 10;
    const pages: Patient[][] = [];
    for (let i = 0; i < selectedPatientsList.length; i += pageSize) {
      pages.push(selectedPatientsList.slice(i, i + pageSize));
    }
    return pages;
  }, [selectedPatientsList]);

  // Theme object for rendering styles
  const activeTheme = CARD_THEMES.find(t => t.id === selectedTheme) || CARD_THEMES[0];

  return (
    <div className={`space-y-8 pb-20 ${sarabun.className}`}>
      
      {/* Dynamic @media print CSS injection */}
      <style jsx global>{`
        @media print {
          /* Force A4 limits and kill native headers/footers */
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          
          /* Wipe out all UI margins/paddings */
          body, html, #__next, main, div.min-h-screen {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          /* Hide all general navigation/sidebar layout elements */
          .print\\:hidden, 
          header, 
          footer, 
          nav,
          .no-print {
            display: none !important;
          }

          /* Reset padding/margins inside NextJS layouts */
          main.max-w-7xl {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }

          /* Print page template layout */
          .print-page-container {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            box-sizing: border-box !important;
            padding-top: 0.6cm !important;
            padding-bottom: 0.9cm !important;
            padding-left: 1.4cm !important;
            padding-right: 1.4cm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: center !important;
            background: white !important;
            overflow: hidden !important;
          }

          /* Cards spacing grid (Exactly 2 x 5) */
          .print-cards-grid {
            display: grid !important;
            grid-template-columns: 8.6cm 8.6cm !important;
            grid-template-rows: repeat(5, 5.4cm) !important;
            gap: 0.3cm 1.0cm !important; /* 0.3cm row-gap, 1.0cm col-gap */
            justify-content: center !important;
            align-content: center !important;
            box-sizing: border-box !important;
          }

          /* Direct exact dimensions for the printed card */
          .physical-card {
            width: 8.6cm !important;
            height: 5.4cm !important;
            box-sizing: border-box !important;
            background: white !important;
            overflow: hidden !important;
            position: relative !important;
          }

          /* Enforce exact colors rendering */
          * {
            font-family: ${sarabun.style.fontFamily} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* --- UI INTERFACE (no-print) --- */}
      <div className="no-print space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/staff/patients">
              <Button variant="outline" size="icon" className="rounded-full shadow hover:bg-secondary">
                <ChevronLeft size={20} />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-black text-[#2D2A26] dark:text-white flex items-center gap-2">
                <Printer size={28} className="text-primary" /> พิมพ์บัตรประจำตัวผู้ป่วยหอบหืด
              </h2>
              <p className="text-muted-foreground mt-1">Asthma Flow Alert Cards Printer Portal</p>
            </div>
          </div>
          
          {selectedPatientsList.length > 0 && (
            <Button 
              onClick={handlePrint}
              className="bg-primary text-white hover:bg-primary/95 dark:text-white shadow-xl hover:-translate-y-0.5 transition-all font-bold gap-2 px-8 py-6 rounded-2xl text-lg shrink-0"
            >
              <Printer size={22} /> พิมพ์บัตร ({selectedPatientsList.length} ใบ)
            </Button>
          )}
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls - Left */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Control card 1: Select date & settings */}
            <div className="glass-card p-6 space-y-5 rounded-3xl border border-border">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2 text-foreground">
                <Calendar size={18} className="text-primary" /> เลือกวันนัดตรวจ
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">วันที่มีนัดหมาย</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full pl-4 pr-10 py-3 bg-secondary/30 dark:bg-black/20 border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-bold text-sm text-foreground">ตั้งค่าบัตรและหน้าพิมพ์</h4>
                
                {/* Guidelines Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                    <Info size={14} /> แสดงเส้นปะช่วยตัดการ์ด
                  </span>
                  <button 
                    onClick={() => setShowCutGuidelines(!showCutGuidelines)}
                    className={`relative w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${showCutGuidelines ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${showCutGuidelines ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">รูปแบบสีบัตร (Theme Color)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CARD_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedTheme === theme.id 
                            ? 'bg-primary text-white border-primary shadow-md scale-102' 
                            : 'bg-white dark:bg-zinc-800 text-muted-foreground hover:bg-secondary border-border'
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Control card 2: Select Patient checkboxes */}
            <div className="glass-card p-6 space-y-4 rounded-3xl border border-border max-h-[500px] flex flex-col">
              <div>
                <h3 className="font-bold text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2"><CheckSquare size={18} className="text-primary" /> รายชื่อผู้ป่วยนัด</span>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-black">
                    {patientsOnDate.length} คน
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">ติ๊กเลือกบัตรที่ต้องการจัดพิมพ์</p>
              </div>

              {/* Search filter in checklist */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, HN..."
                  className="w-full pl-9 pr-3 py-2 bg-secondary/30 dark:bg-black/20 border border-border rounded-xl text-sm font-semibold focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {patientsOnDate.length > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSelectAll}
                    className="flex-1 text-center py-1.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold border border-border"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button 
                    onClick={handleDeselectAll}
                    className="flex-1 text-center py-1.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold border border-border"
                  >
                    ไม่เลือกใคร
                  </button>
                </div>
              )}

              {/* Checklist scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">กำลังโหลดข้อมูลผู้ป่วย...</div>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map(p => {
                    const normalized = normalizeHN(p.hn);
                    const isChecked = selectedHns.has(normalized);
                    return (
                      <div 
                        key={p.hn}
                        onClick={() => handleToggleSelect(p.hn)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-primary/5 border-primary text-foreground' 
                            : 'bg-transparent border-transparent hover:bg-secondary/50 text-muted-foreground'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="text-primary shrink-0" size={18} />
                        ) : (
                          <Square className="text-zinc-300 dark:text-zinc-600 shrink-0" size={18} />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isChecked ? 'text-foreground' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {p.prefix}{p.first_name} {p.last_name}
                          </p>
                          <p className="text-[11px] font-mono leading-none mt-0.5">HN: {p.hn}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center justify-center border border-dashed rounded-xl">
                    <AlertCircle className="opacity-40 mb-1" size={24} />
                    <p>ไม่มีรายชื่อนัดตรวจ</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Cards Preview - Right */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-xl flex items-center gap-2">
                <Sparkles className="text-yellow-500 animate-pulse" size={20} /> หน้าตัวอย่างก่อนพิมพ์ (Print Preview Grid)
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedPatientsList.length} cards | {Math.ceil(selectedPatientsList.length / 10)} sheets of A4
              </span>
            </div>

            {selectedPatientsList.length > 0 ? (
              <div className="space-y-12 bg-zinc-100 dark:bg-zinc-950 p-6 sm:p-10 rounded-3xl border border-border border-dashed shadow-inner max-h-[850px] overflow-y-auto">
                {paginatedPages.map((pagePatients, pageIdx) => (
                  <div 
                    key={pageIdx} 
                    className="relative bg-white dark:bg-zinc-900 border-2 shadow-2xl border-zinc-200 dark:border-zinc-800 mx-auto rounded-xl flex flex-col justify-start items-center p-[0.6cm] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:16px_16px]"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Header line inside sheet preview */}
                    <div className="w-full flex justify-between items-center border-b pb-1 mb-3 text-zinc-400 dark:text-zinc-500 font-mono text-xs select-none">
                      <span>📄 Asthma-Flow Alert Sheet (A4) - Page {pageIdx + 1} of {paginatedPages.length}</span>
                      <span>10 Cards Alignment Layout</span>
                    </div>

                    {/* Cards grid template */}
                    <div className="grid grid-cols-2 gap-x-[1.0cm] gap-y-[0.3cm] justify-center align-content-center w-full">
                      {pagePatients.map(patient => (
                        <div 
                          key={patient.hn}
                          className="physical-card"
                          style={{
                            width: '8.6cm',
                            height: '5.4cm'
                          }}
                        >
                          <AlertCardInner 
                            patient={patient}
                            theme={activeTheme}
                            origin={origin}
                            dottedBorder={showCutGuidelines}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-border py-32 flex flex-col items-center justify-center text-center">
                <FileText size={48} className="text-zinc-300 dark:text-zinc-700 mb-4 animate-bounce" />
                <h4 className="font-bold text-lg text-foreground">รอรับคำสั่งพ่นสีบัตร</h4>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  เลือกวันที่และติ๊กเลือกผู้ป่วยนัดตรวจทางซ้ายมือ เพื่อโหลดหน้าบัตรประจำตัวตัวอย่างขึ้นมาพรีวิวได้ทันที!
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* --- PURE PRINTABLE LAYOUT DOM (Only visible during printing) --- */}
      <div className="hidden print:block">
        {paginatedPages.map((pagePatients, pageIdx) => (
          <div key={pageIdx} className="print-page-container">
            <div className="print-cards-grid">
              {pagePatients.map(patient => (
                <div key={patient.hn} className="physical-card">
                  <AlertCardInner 
                    patient={patient}
                    theme={activeTheme}
                    origin={origin}
                    dottedBorder={showCutGuidelines}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// Internal reusable Single Card card details component
interface AlertCardInnerProps {
  patient: Patient;
  theme: ThemeConfig;
  origin: string;
  dottedBorder: boolean;
}

function AlertCardInner({ patient, theme, origin, dottedBorder }: AlertCardInnerProps) {
  const qrUrl = origin ? `${origin}/patient/${patient.public_token}` : `https://asthma-flow.vercel.app/patient/${patient.public_token}`;

  return (
    <div 
      className={`w-full h-full p-2.5 flex flex-col justify-between text-black ${sarabun.className} box-sizing-border-box select-none overflow-hidden relative ${theme.cardBg} ${
        dottedBorder ? 'border-2 border-dashed border-zinc-400' : 'border border-zinc-200'
      }`}
      style={{
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between shrink-0 select-none">
        {/* Brand logo details */}
        <div className="flex items-center gap-1 shrink-0 select-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-3.5 h-3.5 ${theme.accentText} shrink-0`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          </svg>
          <div className="flex flex-col text-left">
            <span className={`text-[8px] font-black tracking-tight leading-none ${theme.id === 'charcoal' ? 'text-white' : 'text-zinc-800 dark:text-white'}`}>
              asthma<span className={theme.accentText}>flow</span>
            </span>
            <span className="text-[4px] text-zinc-400 dark:text-zinc-500 font-bold leading-none mt-0.5 select-none">หายใจคล่อง ชีวิตดีขึ้น</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Body Grid (Detail & Qrcode) */}
      <div className="flex items-stretch justify-between flex-1 my-1 overflow-hidden select-none relative">
        
        {/* Abstract inhaler background outline SVG */}
        <svg viewBox="0 0 64 80" className={`absolute -right-2 bottom-0 w-11 h-auto opacity-[0.08] dark:opacity-20 pointer-events-none ${theme.inhalerColor}`}>
          <path d="M22 8h20v40H22z" fill="currentColor" rx="4" />
          <path d="M22 42h32v24H22z" fill="currentColor" rx="4" />
          <path d="M30 2v6h4V2z" fill="currentColor" opacity="0.8" />
          <circle cx="32" cy="18" r="6" fill="white" opacity="0.4" />
          <path d="M30 48v8h12v-8z" fill="currentColor" opacity="0.9" />
        </svg>

        {/* Left Column - Patient credentials details (Only Name & HN) */}
        <div className="w-[185px] flex flex-col justify-between text-left pr-2 select-none z-10">
          
          {/* Card title typography */}
          <div className="flex flex-col">
            <h1 className={`text-[17px] font-black leading-none uppercase tracking-tight ${theme.id === 'charcoal' ? 'text-amber-100' : 'text-slate-800 dark:text-slate-100'}`}>
              ASTHMA
            </h1>
            <h2 className={`text-[11px] font-black leading-none tracking-tight ${theme.accentText} uppercase`}>
              FLOW ALERT CARD
            </h2>
            <p className="text-[6.5px] font-bold text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
              บัตรประจำตัวผู้ป่วยโรคหืด
            </p>
          </div>

          {/* Emergency card shield icon advice */}
          <div className="flex items-start gap-1 my-0.5">
            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center ${theme.badgeBg} shrink-0`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 ${theme.accentText}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className={`text-[6px] font-black leading-none ${theme.id === 'charcoal' ? 'text-amber-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                พกบัตรนี้เสมอ
              </span>
              <span className="text-[4.8px] text-zinc-400 dark:text-zinc-500 font-bold leading-tight mt-0.5">
                เพื่อความปลอดภัยในการฉุกเฉิน แพทย์จะได้รับข้อมูลที่สำคัญอย่างรวดเร็ว
              </span>
            </div>
          </div>

          {/* Minimal Patient Details */}
          <div className="space-y-1.5 mb-0.5">
            {/* Full Name display */}
            <div className="flex items-center gap-1.5">
              <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${theme.badgeBg} shrink-0`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 ${theme.accentText}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[4.5px] text-zinc-400 dark:text-zinc-500 font-bold leading-none">ชื่อ-สกุล</span>
                <span className={`text-[8.5px] font-black leading-tight truncate ${theme.id === 'charcoal' ? 'text-zinc-100' : 'text-zinc-950 dark:text-zinc-50'}`}>
                  {patient.prefix}{patient.first_name} {patient.last_name}
                </span>
              </div>
            </div>

            {/* HN identification display */}
            <div className="flex items-center gap-1.5">
              <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${theme.badgeBg} shrink-0`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 ${theme.accentText}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 003.181 0l5.103-5.102a2.25 2.25 0 000-3.181l-9.58-9.581A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[4.5px] text-zinc-400 dark:text-zinc-500 font-bold leading-none">HN</span>
                <span className={`text-[8.5px] font-black font-mono leading-none ${theme.id === 'charcoal' ? 'text-amber-200' : 'text-zinc-800 dark:text-zinc-200'}`}>
                  {patient.hn}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - QR Code details */}
        <div className="flex flex-col justify-center items-center shrink-0 pr-1 select-none z-10">
          <div className={`p-1 bg-white rounded-xl border-2 ${theme.qrBorder} shadow-sm shrink-0 flex items-center justify-center`}>
            <QRCodeSVG value={qrUrl} size={62} />
          </div>
          
          <div className={`mt-1.5 px-2 py-0.5 rounded-full text-white text-[5.5px] font-black ${theme.qrBadgeBg} shadow-sm select-none whitespace-nowrap`}>
            สแกนเพื่อดูข้อมูลสุขภาพ
          </div>
        </div>

      </div>

      {/* 3. Bottom Slanted Split Footer Block */}
      <div className="flex h-[28px] overflow-hidden select-none text-[6.5px] leading-none shrink-0 font-bold -mx-2.5 -mb-2.5 z-10">
        <div className={`flex-1 flex items-center gap-1.5 pl-3.5 pr-2 ${theme.footerLeftBg} ${theme.footerLeftText}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-white shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <span>ฉันเป็นผู้ป่วยโรคหืด กรุณาให้ความช่วยเหลืออย่างเหมาะสม</span>
        </div>
        <div className={`w-[92px] flex items-center justify-center gap-1 pl-3 pr-2 relative text-white ${theme.id === 'charcoal' ? 'bg-amber-800' : 'bg-red-600'}`} style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 shrink-0">
            <path d="M1.5 10.036a.75.75 0 0 1 .172-.034l2.236-.223a.75.75 0 0 1 .632.316l1.247 1.248 3.13-3.13-1.248-1.247a.75.75 0 0 1-.316-.633L7.58 4.1a.75.75 0 0 1 .034-.172l.45-1.353a.75.75 0 0 1 .672-.525l3.525-.353a.75.75 0 0 1 .802.63l.4 4a.75.75 0 0 1-.223.597l-2.001 2c-.443.443-.637 1.077-.492 1.688a10.024 10.024 0 0 0 4.195 4.195c.61.145 1.245-.049 1.688-.492l2-2.001a.75.75 0 0 1 .597-.223l4 .4a.75.75 0 0 1 .63.802l-.353 3.525a.75.75 0 0 1-.525.672l-1.353.45a.75.75 0 0 1-.172.034l-2.236.223a.75.75 0 0 1-.632-.316l-1.247-1.248-3.13 3.13 1.248 1.247a.75.75 0 0 1 .316.633l.223 2.236a.75.75 0 0 1-.034.172l-.45 1.353a.75.75 0 0 1-.672.525L6.6 23.953a.75.75 0 0 1-.802-.63l-.4-4a.75.75 0 0 1 .223-.597l2.001-2c.443-.443.637-1.077.492-1.688a10.024 10.024 0 0 0-4.195-4.195c-.61-.145-1.245.049-1.688.492l-2 2.001a.75.75 0 0 1-.597.223l-4-.4a.75.75 0 0 1-.63-.802l.353-3.525a.75.75 0 0 1 .525-.672l1.353-.45Z" />
          </svg>
          <div className="flex flex-col">
            <span className="text-[7.2px] font-black">ฉุกเฉิน โทร 1669</span>
            <span className="text-[4.5px] opacity-85 mt-0.5 leading-none">ตลอด 24 ชั่วโมง</span>
          </div>
        </div>
      </div>

    </div>
  );
}
