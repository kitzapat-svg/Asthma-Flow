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
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  qrBorder: string;
  qrBadgeBg: string;
  qrBadgeText: string;
  footerLeftBg: string;
  footerLeftText: string;
  footerRightBg: string;
}

const CARD_THEMES: ThemeConfig[] = [
  {
    id: 'orange',
    name: 'Warm Orange',
    cardBg: 'bg-[#FAF6F0] dark:bg-zinc-900',
    borderColor: 'border-[#f4e6da] dark:border-zinc-700',
    titleColor: 'text-[#0F2942] dark:text-amber-100',
    accentText: 'text-[#D2432C] dark:text-[#E0533C]',
    accentColor: '#D2432C',
    badgeBg: 'bg-[#F4EFEA] dark:bg-zinc-800',
    badgeText: 'text-[#6B6560] dark:text-zinc-300',
    qrBorder: 'border-[#f4e6da] dark:border-zinc-700',
    qrBadgeBg: 'bg-[#fbeee4] dark:bg-amber-950/40',
    qrBadgeText: 'text-[#8C3B20] dark:text-amber-300',
    footerLeftBg: 'bg-[#dce6e1] dark:bg-[#20322b]',
    footerLeftText: 'text-[#0F2942] dark:text-emerald-100',
    footerRightBg: 'bg-[#D2432C] dark:bg-[#C23A25]'
  },
  {
    id: 'blue',
    name: 'Clinical Blue',
    cardBg: 'bg-[#F5F9FC] dark:bg-zinc-900',
    borderColor: 'border-[#d6e4f0] dark:border-zinc-700',
    titleColor: 'text-[#0F2942] dark:text-sky-100',
    accentText: 'text-[#1B75BC] dark:text-[#38bdf8]',
    accentColor: '#1B75BC',
    badgeBg: 'bg-[#EAF2F8] dark:bg-zinc-800',
    badgeText: 'text-[#1B75BC] dark:text-zinc-300',
    qrBorder: 'border-[#d6e4f0] dark:border-zinc-700',
    qrBadgeBg: 'bg-[#e6f0fa] dark:bg-sky-950/40',
    qrBadgeText: 'text-[#1B75BC] dark:text-sky-300',
    footerLeftBg: 'bg-[#dce6eb] dark:bg-[#202b32]',
    footerLeftText: 'text-[#0F2942] dark:text-sky-100',
    footerRightBg: 'bg-[#1B75BC] dark:bg-[#155e96]'
  },
  {
    id: 'green',
    name: 'Clinical Green',
    cardBg: 'bg-[#F4F9F6] dark:bg-zinc-900',
    borderColor: 'border-[#d6ebd6] dark:border-zinc-700',
    titleColor: 'text-[#0F2942] dark:text-emerald-100',
    accentText: 'text-[#0F8A5F] dark:text-[#34d399]',
    accentColor: '#0F8A5F',
    badgeBg: 'bg-[#EAF5F0] dark:bg-zinc-800',
    badgeText: 'text-[#0F8A5F] dark:text-zinc-300',
    qrBorder: 'border-[#d6ebd6] dark:border-zinc-700',
    qrBadgeBg: 'bg-[#e6fae6] dark:bg-emerald-950/40',
    qrBadgeText: 'text-[#0F8A5F] dark:text-emerald-300',
    footerLeftBg: 'bg-[#dcebde] dark:bg-[#203223]',
    footerLeftText: 'text-[#0F2942] dark:text-emerald-100',
    footerRightBg: 'bg-[#0F8A5F] dark:bg-[#0a6645]'
  },
  {
    id: 'purple',
    name: 'Clinical Purple',
    cardBg: 'bg-[#F8F5FB] dark:bg-zinc-900',
    borderColor: 'border-[#eedff4] dark:border-zinc-700',
    titleColor: 'text-[#0F2942] dark:text-purple-100',
    accentText: 'text-[#7C3AED] dark:text-[#c084fc]',
    accentColor: '#7C3AED',
    badgeBg: 'bg-[#F3EAF8] dark:bg-zinc-800',
    badgeText: 'text-[#7C3AED] dark:text-zinc-300',
    qrBorder: 'border-[#eedff4] dark:border-zinc-700',
    qrBadgeBg: 'bg-[#fae6fa] dark:bg-purple-950/40',
    qrBadgeText: 'text-[#7C3AED] dark:text-purple-300',
    footerLeftBg: 'bg-[#ebdcfa] dark:bg-[#2b2032]',
    footerLeftText: 'text-[#0F2942] dark:text-purple-100',
    footerRightBg: 'bg-[#7C3AED] dark:bg-[#632ecb]'
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
  const [selectedTheme, setSelectedTheme] = useState<string>('orange');
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

  // Pagination calculations: 8 cards per A4 page (2 columns x 4 rows)
  const paginatedPages = useMemo(() => {
    const pageSize = 8;
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
            padding-top: 2.1cm !important;
            padding-bottom: 2.1cm !important;
            padding-left: 1.0cm !important;
            padding-right: 1.0cm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: center !important;
            background: white !important;
            overflow: hidden !important;
          }

          /* Cards spacing grid (Exactly 2 x 4) */
          .print-cards-grid {
            display: grid !important;
            grid-template-columns: 9.0cm 9.0cm !important;
            grid-template-rows: repeat(4, 6.0cm) !important;
            gap: 0.5cm 1.0cm !important; /* 0.5cm row-gap, 1.0cm col-gap */
            justify-content: center !important;
            align-content: center !important;
            box-sizing: border-box !important;
          }

          /* Direct exact dimensions for the printed card */
          .physical-card {
            width: 9.0cm !important;
            height: 6.0cm !important;
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
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${selectedTheme === theme.id
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
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${isChecked
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
                {selectedPatientsList.length} cards | {Math.ceil(selectedPatientsList.length / 8)} sheets of A4
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
                      <span>8 Cards Alignment Layout</span>
                    </div>

                    {/* Cards grid template */}
                    <div className="grid grid-cols-2 gap-x-[1.0cm] gap-y-[0.5cm] justify-center align-content-center w-full">
                      {pagePatients.map(patient => (
                        <div
                          key={patient.hn}
                          className="physical-card"
                          style={{
                            width: '9.0cm',
                            height: '6.0cm'
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

  const getThaiIssueDate = () => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bangkokTime = new Date(utc + (3600000 * 7));
    const day = bangkokTime.getDate();
    const month = months[bangkokTime.getMonth()];
    const year = bangkokTime.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  return (
    <div
      className={`w-full h-full pt-3 px-4 pb-3 flex flex-col justify-between text-black ${sarabun.className} box-sizing-border-box select-none overflow-hidden relative ${theme.cardBg} ${dottedBorder ? 'border-2 border-dashed border-zinc-400' : 'border border-zinc-200'
        } rounded-[18px] shadow-sm`}
      style={{
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header Row */}
      <div className="flex items-start justify-between shrink-0 select-none mb-1 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
        {/* Left Side: ASTHMA FLOW ALERT CARD */}
        <div className="flex flex-col text-left">
          <h1 className="text-[24px] font-black leading-none uppercase tracking-tight text-[#0F2942] dark:text-white">
            ASTHMA
          </h1>
          <h2 className={`text-[12px] font-black leading-none tracking-tight ${theme.accentText} uppercase mt-0.5`}>
            FLOW ALERT CARD
          </h2>
          <div className="flex items-center gap-1 mt-1.5 text-zinc-300 dark:text-zinc-700">
            <div className="h-[0.5px] w-4 bg-current"></div>
            <p className="text-[7.5px] font-bold text-zinc-500 dark:text-zinc-400 leading-none">
              บัตรประจำตัวผู้ป่วยโรคหืด
            </p>
            <div className="h-[0.5px] w-4 bg-current"></div>
          </div>
        </div>

        {/* Right Side: Brand logo */}
        <div className="flex items-center gap-1 shrink-0 select-none mt-1">
          <svg viewBox="0 0 40 30" className="w-7 h-5.5 shrink-0" fill="none">
            {/* Wind curves */}
            <path d="M4 11h8M2 15h11M5 19h6" stroke={theme.accentColor} strokeWidth="2" strokeLinecap="round" />
            {/* Cloud outline */}
            <path d="M12 19c-1.5 0-3-1-3-2.5s1.5-2.5 3-2.5c.2 0 .5 0 .7.1A4.5 4.5 0 0121 11a4 4 0 014 4c0 .3 0 .5-.1.8A3.5 3.5 0 0128 19H12z" fill="none" stroke="#0F2942" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-white" />
          </svg>
          <div className="flex flex-col text-right">
            <span className={`text-[11px] font-black tracking-tight leading-none text-[#0F2942] dark:text-white`}>
              asthma<span style={{ color: theme.accentColor }}>flow</span>
            </span>
            <span className="text-[5.5px] text-zinc-500 dark:text-zinc-400 font-bold italic leading-none mt-0.5 select-none">Breathe easier, live better.</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Body Grid (Detail & Qrcode) */}
      <div className="flex justify-between items-stretch flex-1 my-0.5 overflow-hidden select-none relative">

        {/* Left Column - Patient credentials details */}
        <div className="w-[200px] flex flex-col justify-start gap-2 text-left pr-1 select-none z-10 mt-1">
          {/* Row 1: Danger Symptoms */}
          <div className="flex items-start gap-1.5">
            <div className="relative shrink-0">
              <div className="w-[24px] h-[24px] rounded-full bg-[#dbeae3] dark:bg-emerald-950/60 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-[13px] h-[13px] text-emerald-800 dark:text-emerald-200">
                  <path d="M12 4v7M12 11c-1-1.5-3-3-6-3-3.3 0-5 2.5-5 5.5 0 5 4.5 7.5 8 9 1-.5 2-1 3-2.5M12 11c1-1.5 3-3 6-3 3.3 0 5 2.5 5 5.5 0 5-4.5 7.5-8 9-1-.5-2-1-3-2.5" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] bg-[#D2432C] rounded-full flex items-center justify-center border border-white text-white text-[7px] font-black leading-none select-none">
                +
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[6.5px] text-zinc-500 dark:text-zinc-400 font-bold leading-none">อาการที่เสี่ยง</span>
              <span className="text-[7.5px] font-black text-[#0F2942] dark:text-zinc-100 leading-tight mt-0.5">
                หายใจลำบาก ไอ แน่นหน้าอก หายใจมีเสียงหวีด
              </span>
            </div>
          </div>

          {/* Row 2: HN */}
          <div className="flex items-center gap-1.5">
            <div className={`w-[24px] h-[24px] rounded-full ${theme.badgeBg} flex items-center justify-center shrink-0`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`w-[13px] h-[13px] ${theme.badgeText}`}>
                <rect width="18" height="14" x="3" y="5" rx="2" />
                <path d="M7 10h4M7 14h6M17 10v4" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[6.5px] text-zinc-500 dark:text-zinc-400 font-bold leading-none">HN</span>
              <span className="text-[11px] font-black font-mono text-[#0F2942] dark:text-zinc-100 leading-none mt-0.5">
                {patient.hn}
              </span>
            </div>
          </div>

          {/* Row 3: Issue Date */}
          <div className="flex items-center gap-1.5">
            <div className={`w-[24px] h-[24px] rounded-full ${theme.badgeBg} flex items-center justify-center shrink-0 relative`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`w-[13px] h-[13px] ${theme.badgeText}`}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] bg-zinc-700 dark:bg-zinc-650 rounded-full flex items-center justify-center border border-white text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="w-[6px] h-[6px]">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[6.5px] text-zinc-500 dark:text-zinc-400 font-bold leading-none">วันที่ออกบัตร</span>
              <span className="text-[8.5px] font-black text-[#0F2942] dark:text-zinc-100 leading-none mt-0.5">
                {getThaiIssueDate()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code details */}
        <div className="flex flex-col justify-center items-center shrink-0 pl-2 select-none z-10">
          <div className={`p-1 bg-white rounded-[12px] border-2 ${theme.qrBorder} shadow-sm shrink-0 flex items-center justify-center`}>
            <QRCodeSVG value={qrUrl} size={68} />
          </div>

          <div className={`mt-1 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm select-none whitespace-nowrap ${theme.qrBadgeBg}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 shrink-0 ${theme.qrBadgeText}`}>
              {/* Smartphone body */}
              <rect x="6" y="2" width="12" height="20" rx="2" />
              {/* Home button dot */}
              <circle cx="12" cy="18.5" r="0.75" fill="currentColor" stroke="none" />
              {/* QR scanner corners inside phone */}
              <path d="M9 6h1.5M9 6v1.5M15 6h-1.5M15 6v1.5M9 12h1.5M9 12v-1.5M15 12h-1.5M15 12v-1.5" strokeWidth="2" strokeLinecap="round" />
              {/* Laser line scan indicator */}
              <line x1="8.5" y1="9" x2="15.5" y2="9" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className={`text-[7px] font-black tracking-tight leading-none ${theme.qrBadgeText}`}>
              สแกนเพื่อดูข้อมูลสุขภาพ
            </span>
          </div>
          <span className="text-[5.5px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5 leading-none whitespace-nowrap">
            (คำแนะนำ • แผนการรักษา • วันนัดหมาย)
          </span>
        </div>

      </div>

      {/* 3. Bottom Slanted Split Footer Block */}
      <div className="flex h-[36px] overflow-hidden select-none text-[6.5px] leading-none shrink-0 font-bold -mx-4 -mb-3 z-10 mt-1">
        {/* Left Footer: Warning Advice */}
        <div className={`flex-1 flex items-center gap-2 pl-4 pr-1 ${theme.footerLeftBg} ${theme.footerLeftText}`}>
          <div className="shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="none">
              <path d="M12 2L1 21h22L12 2z" fill="#D2432C" />
              <path d="M12 8v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1.5" fill="white" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[8.5px] font-black leading-tight text-[#0F2942] dark:text-[#E2E8F0]">
              ฉันเป็นผู้ป่วยโรคหืด
            </span>
            <span className="text-[6.8px] font-medium leading-none text-[#0F2942]/80 dark:text-[#CBD5E1] mt-0.5">
              กรุณาให้ความช่วยเหลืออย่างเหมาะสม
            </span>
          </div>
        </div>

        {/* Right Footer: Emergency Call */}
        <div
          className={`w-[115px] flex flex-col justify-center items-center pl-3 pr-2 relative text-white ${theme.footerRightBg} shrink-0 -ml-5`}
          style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)' }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-[15px] h-[15px] rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke={theme.accentColor} strokeWidth="3.5" className="w-2.5 h-2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="text-[9.5px] font-black tracking-tight leading-none">ฉุกเฉิน โทร 1669</span>
          </div>

          <div className="flex items-center justify-center gap-1 mt-0.5 text-white/90 w-full px-1">
            <svg viewBox="0 0 40 10" className="w-5 h-2 opacity-80" stroke="currentColor" strokeWidth="1.2" fill="none">
              <path d="M0 5 h10 l2 -3 l2 6 l2 -5 l2 2 h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[5.5px] font-bold tracking-wider whitespace-nowrap">ตลอด 24 ชั่วโมง</span>
            <svg viewBox="0 0 40 10" className="w-5 h-2 opacity-80" stroke="currentColor" strokeWidth="1.2" fill="none">
              <path d="M0 5 h10 l2 -3 l2 6 l2 -5 l2 2 h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

    </div>
  );
}
