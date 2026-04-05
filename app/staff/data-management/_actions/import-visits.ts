"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSheetData, appendData, updateRowByHnAndDate, logActivity } from "@/lib/sheets";
import { normalizeHN } from "@/lib/helpers";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import iconv from "iconv-lite";

/**
 * Robust Date Normalization
 * Converts Excel serial numbers or string dates (DD/MM/YYYY, YYYY-MM-DD) to YYYY-MM-DD
 */
function normalizeDate(dateVal: any): string | null {
  if (!dateVal) return null;

  // 1. Handle Excel Serial Number
  if (typeof dateVal === "number") {
    // 25569 is the difference in days between 1900 and 1970
    const excelDate = new Date((dateVal - 25569) * 86400 * 1000);
    return excelDate.toISOString().split("T")[0];
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // 2. Handle DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [_, d, m, y] = ddmmyyyy;
    // Handle Buddhist Year (if > 2400)
    const year = parseInt(y) > 2400 ? parseInt(y) - 543 : parseInt(y);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. Handle YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const [_, y, m, d] = yyyymmdd;
    const year = parseInt(y) > 2400 ? parseInt(y) - 543 : parseInt(y);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

export async function importVisitsAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "Admin") {
    return { success: false, error: "Unauthorized: Admin only" };
  }

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file uploaded" };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawData: any[] = [];

    // --- 1. Parsing ---
    if (file.name.endsWith(".csv")) {
      // Decode with TIS-620 or CP874 (common for Thai HIS)
      const decoded = iconv.decode(buffer, "win874");
      const result = Papa.parse(decoded, { header: true, skipEmptyLines: true });
      rawData = result.data;
    } else {
      // Excel parsing
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawData = XLSX.utils.sheet_to_json(worksheet);
    }

    if (rawData.length === 0) return { success: false, error: "Empty file" };

    // --- 2. Header Validation ---
    const headers = Object.keys(rawData[0]);
    const required = ["HN", "วันที่รับบริการ", "วันนัดถัดไป"];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return { success: false, error: `Missing required columns: ${missing.join(", ")}` };
    }

    // --- 3. Initial Data Fetching ---
    const [allPatients, allVisits] = await Promise.all([
      getSheetData("patients"),
      getSheetData("visits")
    ]);

    const patientHns = new Set(allPatients.map((p: any) => normalizeHN(p.hn)));
    const visitKeySet = new Set(allVisits.map((v: any) => `${normalizeHN(v.hn)}|${v.date}`));

    // --- 4. Processing ---
    let insertCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    for (const row of rawData) {
      const rawHn = String(row["HN"]).trim();
      // System normalization (removes zeros for comparison)
      const systemHn = normalizeHN(rawHn);
      // User requirement: Pad to 7 digits for storage
      const cleanHn = systemHn.padStart(7, '0');
      
      const visitDate = normalizeDate(row["วันที่รับบริการ"]);
      const nextAppt = normalizeDate(row["วันนัดถัดไป"]) || "";

      if (!systemHn || !visitDate) {
        skipCount++;
        continue;
      }

      // Check if patient exists using normalized HN
      if (!patientHns.has(systemHn)) {
        skipCount++;
        continue;
      }

      const key = `${systemHn}|${visitDate}`;

      if (visitKeySet.has(key)) {
        // Update existing visit (Next Appt only)
        // We need to fetch the full row to preserve other data?
        // Sheets update Row by HN + Date logic usually updates the whole row
        // So we should find the existing record first.
        const existing = allVisits.find((v: any) => `${normalizeHN(v.hn)}|${v.date}` === key);
        if (existing) {
          const updatedRow = [
            cleanHn,
            visitDate,
            existing.pefr || "0",
            existing.control_level || "-",
            existing.controller || "-",
            existing.reliever || "-",
            existing.adherence || "0",
            existing.drp || "-",
            existing.advice || "-",
            existing.technique_check || "-",
            nextAppt, // Updated
            existing.note || "อัปเดตจาก HOSxP",
            existing.is_new_case || "FALSE",
            existing.inhaler_score || "0"
          ];
          await updateRowByHnAndDate("visits", cleanHn, visitDate, updatedRow, 14);
          updateCount++;
        }
      } else {
        // Insert new visit with defaults
        const newRow = [
          cleanHn,
          visitDate,
          "0",          // PEFR
          "-",          // control_level
          "-",          // controller
          "-",          // reliever
          "0",          // adherence
          "-",          // drp
          "-",          // advice
          "-",          // technique_check
          nextAppt,     // next_appt
          "นำเข้าจาก HOSxP", // note
          "FALSE",      // is_new_case
          "0"           // inhaler_score
        ];
        await appendData("visits", newRow);
        insertCount++;
      }
    }

    await logActivity(
      session.user?.email || "Admin",
      "Bulk Import",
      `Success: ${insertCount} inserts, ${updateCount} updates, ${skipCount} skipped.`
    );

    return { 
      success: true, 
      summary: { insertCount, updateCount, skipCount } 
    };

  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, error: error.message || "Failed to process import" };
  }
}
