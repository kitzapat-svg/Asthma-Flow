"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Printer, ChevronLeft, Calendar, Search, CheckSquare,
  Square, AlertCircle, Heart, Phone, Sparkles, Check, Info, FileText
} from 'lucide-react';
import { getBangkokDateString, toBangkokDateString } from '@/lib/date-utils';
import { getAge, normalizeHN } from '@/lib/helpers';
import { Patient, Visit, Medication } from '@/lib/types';
import { SITE_URL } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { AlertCardInner, CARD_THEMES, sarabunFont as sarabun } from '@/components/AlertCard';
import type { ThemeConfig } from '@/components/AlertCard';

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



