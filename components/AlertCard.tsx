"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sarabun } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import { Patient } from '@/lib/types';

export const sarabunFont = Sarabun({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

// Card Theme configuration type
export interface ThemeConfig {
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

export const CARD_THEMES: ThemeConfig[] = [
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

// Internal reusable Single Card card details component
export interface AlertCardInnerProps {
  patient: Patient;
  theme: ThemeConfig;
  origin: string;
  dottedBorder: boolean;
}

export function AlertCardInner({ patient, theme, origin, dottedBorder }: AlertCardInnerProps) {
  const qrUrl = origin ? `${origin}/patient/${patient.public_token}` : `${SITE_URL}/patient/${patient.public_token}`;

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
      className={`w-full h-full pt-3 px-4 pb-3 flex flex-col justify-between text-black ${sarabunFont.className} box-sizing-border-box select-none overflow-hidden relative ${theme.cardBg} ${dottedBorder ? 'border-2 border-dashed border-zinc-400' : 'border border-zinc-200'
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
