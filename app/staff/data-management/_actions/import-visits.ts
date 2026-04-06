"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  getPatients, 
  getAllVisits, 
  updateRowByHnAndDate, 
  saveVisit, 
  logActivity 
} from "@/lib/db";
import { normalizeHN } from "@/lib/helpers";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import iconv from "iconv-lite";

/**
 * Robust Date Normalization
 */
function normalizeDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (typeof dateVal === "number") {
    const excelDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return excelDate.toISOString().split("T")[0];
  }
  const str = String(dateVal).trim();
  if (!str) return null;
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [_, d, m, y] = ddmmyyyy;
    const year = parseInt(y) > 2400 ? parseInt(y) - 543 : parseInt(y);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
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

    if (file.name.endsWith(".csv")) {
      const decoded = iconv.decode(buffer, "win874");
      const result = Papa.parse(decoded, { 
        header: true, 
        skipEmptyLines: true,
        delimiter: "" // auto detection
      });
      rawData = result.data;
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    }

    if (rawData.length === 0) return { success: false, error: "Empty file" };

    rawData = rawData.map(row => {
      const cleanedRow: any = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.replace(/^[\uFEFF\u200B]+|[\uFEFF\u200B]+$/g, '').replace(/^"|"$/g, '').trim();
        let val = row[key];
        if (typeof val === 'string') {
          val = val.replace(/^"|"$/g, '').trim();
        }
        cleanedRow[cleanKey] = val;
      });
      return cleanedRow;
    });

    // Normalize column aliases from HOSxP variants
    // "วันรับบริการ" → "วันที่รับบริการ"
    rawData = rawData.map(row => {
      if ('วันรับบริการ' in row && !('วันที่รับบริการ' in row)) {
        row['วันที่รับบริการ'] = row['วันรับบริการ'];
      }
      return row;
    });

    const headers = Object.keys(rawData[0]);
    const required = ["HN", "วันที่รับบริการ", "วันนัดถัดไป"];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return { success: false, error: `Missing required columns: ${missing.join(", ")}` };
    }

    const [allPatients, allVisits] = await Promise.all([
      getPatients(),
      getAllVisits()
    ]);

    const patientHns = new Set(allPatients.map((p: any) => normalizeHN(p.hn)));

    // Build a map: "normHN|visitDate" -> existing visit
    const visitMap = new Map<string, any>();
    allVisits.forEach((v: any) => {
      const key = `${normalizeHN(v.hn)}|${v.visit_date}`;
      visitMap.set(key, v);
    });

    let insertCount = 0;
    let updateCount = 0;
    let skipCount = 0;
    let hasApptCount = 0;

    for (const row of rawData) {
      const systemHn = normalizeHN(String(row["HN"]).trim());
      const cleanHn = systemHn.padStart(7, '0');
      const visitDate = normalizeDate(row["วันที่รับบริการ"]);
      const nextAppt = normalizeDate(row["วันนัดถัดไป"]) || "";

      // Skip if HN not in system or no visit date
      if (!systemHn || !visitDate || !patientHns.has(systemHn)) {
        skipCount++;
        continue;
      }

      const key = `${systemHn}|${visitDate}`;
      const existing = visitMap.get(key);

      if (existing) {
        // If visit already has next_appt recorded — skip, don't overwrite
        const alreadyHasAppt = existing.next_appt && existing.next_appt.trim() !== '' && existing.next_appt !== '-';
        if (alreadyHasAppt) {
          hasApptCount++;
          continue;
        }

        // Visit exists but no next_appt yet — update
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
          nextAppt,
          existing.note || "อัปเดตจาก HOSxP",
          existing.is_new_case ? 'TRUE' : 'FALSE',
          existing.inhaler_score || "0"
        ];
        await updateRowByHnAndDate("visits", cleanHn, visitDate, updatedRow);
        updateCount++;
      } else {
        // No visit record at all — create new
        const newRow = [
          cleanHn,
          visitDate,
          "0",
          "-",
          "-",
          "-",
          "0",
          "-",
          "-",
          "-",
          nextAppt,
          "นำเข้าจาก HOSxP",
          "FALSE",
          "0"
        ];
        await saveVisit(newRow);
        insertCount++;
      }
    }

    await logActivity(
      session.user?.email || "Admin",
      "Bulk Import",
      `Success: ${insertCount} inserts, ${updateCount} updates, ${skipCount} skipped (no patient), ${hasApptCount} skipped (already has appt).`
    );

    return { 
      success: true, 
      summary: { insertCount, updateCount, skipCount, hasApptCount } 
    };

  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, error: error.message || "Failed to process import" };
  }
}
