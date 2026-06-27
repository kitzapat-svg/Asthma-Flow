// lib/config.ts
export const SHEET_CONFIG = {
  // ชื่อ Tab ใน Google Sheets ของคุณ (ต้องตรงเป๊ะๆ)
  PATIENTS_TAB: "patients",
  VISITS_TAB: "visits",
};

/**
 * Fallback base URL สำหรับ QR Code และ link ที่ต้องการ absolute URL
 * ใช้เมื่อ window.location.origin ไม่พร้อมใช้งาน (เช่น SSR หรือ print context)
 * อัปเดตที่นี่ที่เดียวเมื่อ deploy domain เปลี่ยน
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asthma-flow.vercel.app";
