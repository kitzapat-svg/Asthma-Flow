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
    const excelDate = new Date((dateVal - 25569) * 86400 * 1000);
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
      const result = Papa.parse(decoded, { header: true, skipEmptyLines: true });
      rawData = result.data;
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawData = XLSX.utils.sheet_to_json(worksheet);
    }

    if (rawData.length === 0) return { success: false, error: "Empty file" };

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
    const visitKeySet = new Set(allVisits.map((v: any) => `${normalizeHN(v.hn)}|${v.visit_date}`));

    let insertCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    for (const row of rawData) {
      const systemHn = normalizeHN(String(row["HN"]).trim());
      const cleanHn = systemHn.padStart(7, '0');
      const visitDate = normalizeDate(row["วันที่รับบริการ"]);
      const nextAppt = normalizeDate(row["วันนัดถัดไป"]) || "";

      if (!systemHn || !visitDate || !patientHns.has(systemHn)) {
        skipCount++;
        continue;
      }

      const key = `${systemHn}|${visitDate}`;

      if (visitKeySet.has(key)) {
        const existing = allVisits.find((v: any) => `${normalizeHN(v.hn)}|${v.visit_date}` === key);
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
            nextAppt, 
            existing.note || "อัปเดตจาก HOSxP",
            existing.is_new_case ? 'TRUE' : 'FALSE',
            existing.inhaler_score || "0"
          ];
          await updateRowByHnAndDate("visits", cleanHn, visitDate, updatedRow);
          updateCount++;
        }
      } else {
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
