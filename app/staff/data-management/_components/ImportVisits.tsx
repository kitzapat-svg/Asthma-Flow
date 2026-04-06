"use client";

import { useState, useRef } from "react";
import { FileUp, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X, Database, SkipForward, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { importVisitsAction } from "../_actions/import-visits";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import iconv from "iconv-lite";
import { Visit } from "@/lib/types";

type RowStatus = "import" | "has_appt" | "no_patient";

interface ImportPreview {
  hn: string;
  visitDate: string;
  nextAppt: string;
  originalHN: string;
  name: string;
  status: RowStatus;
}

export function ImportVisits({ patients, visits }: { patients: any[]; visits: Visit[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) await processFile(selected);
  };

  const processFile = async (selected: File) => {
    setFile(selected);
    setIsParsing(true);
    setPreview([]);

    try {
      const buffer = await selected.arrayBuffer();
      let data: any[] = [];

      if (selected.name.endsWith(".csv")) {
        const decoder = new TextDecoder("windows-874");
        const decoded = decoder.decode(buffer);
        const result = Papa.parse(decoded, { header: true, skipEmptyLines: true });
        data = result.data;
      } else {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // defval: '' ensures rows with empty cells are NOT dropped
        data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      }

      // Clean keys and values (remove BOM, extra spaces, and quotes)
      data = data.map(row => {
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
      // e.g. "วันรับบริการ" → "วันที่รับบริการ"
      data = data.map(row => {
        if ('วันรับบริการ' in row && !('วันที่รับบริการ' in row)) {
          row['วันที่รับบริการ'] = row['วันรับบริการ'];
        }
        return row;
      });

      // Check headers
      const firstRow = data[0] || {};
      const required = ["HN", "วันที่รับบริการ", "วันนัดถัดไป"];
      const missing = required.filter(h => !(h in firstRow));

      if (missing.length > 0) {
        toast.error(`ไฟล์ไม่ถูกต้อง: ขาดคอลัมน์ ${missing.join(", ")}`);
        setFile(null);
        return;
      }

      const formatDateValue = (val: any) => {
        if (!val || String(val).trim() === '-' || String(val).trim() === '') return "-";
        if (typeof val === 'number') {
          const excelDate = new Date(Math.round((val - 25569) * 86400 * 1000));
          return excelDate.toISOString().split("T")[0];
        }
        return String(val).split('T')[0];
      };

      // Build a lookup: "normHN|visitDate" -> next_appt value
      const visitApptMap = new Map<string, string | null>();
      visits.forEach(v => {
        const normHn = String(v.hn).trim().replace(/^0+/, '');
        const vDate = v.visit_date ?? (v as any).date ?? '';
        visitApptMap.set(`${normHn}|${vDate}`, v.next_appt ?? null);
      });

      // Create preview (all rows, no artificial limit)
      const previewRows = data.map(row => {
        const rawHn = String(row.HN);
        const normHn = rawHn.trim().replace(/^0+/, '');
        const patient = patients.find(p => String(p.hn).trim().replace(/^0+/, '') === normHn);
        const visitDate = formatDateValue(row.วันที่รับบริการ);
        const nextAppt = formatDateValue(row.วันนัดถัดไป);
        const name = patient
          ? `${patient.prefix}${patient.first_name} ${patient.last_name}`
          : "- (ไม่พบข้อมูลในระบบ)";

        let status: RowStatus = "import";
        if (!patient) {
          status = "no_patient";
        } else {
          const existingAppt = visitApptMap.get(`${normHn}|${visitDate}`);
          if (existingAppt && existingAppt !== '-' && existingAppt !== '') {
            status = "has_appt";
          }
        }

        return {
          hn: normHn.padStart(7, '0'),
          visitDate,
          nextAppt,
          originalHN: rawHn,
          name,
          status,
        };
      });

      setPreview(previewRows);
      toast.success(`โหลดข้อมูลสำเร็จ: พบ ${data.length} รายการ`);
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setIsImporting(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await importVisitsAction(formData);
      if (res.success) {
        toast.success(`นำเข้าสำเร็จ!`, {
          description: `เพิ่มใหม่ ${res.summary?.insertCount} รายการ, อัปเดต ${res.summary?.updateCount} รายการ, มีวันนัดแล้ว ${res.summary?.hasApptCount} รายการ (ข้าม ${res.summary?.skipCount} รายการ)`,
          duration: 6000
        });
        setFile(null);
        setPreview([]);
      } else {
        toast.error("การนำเข้าล้มเหลว", { description: res.error });
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการนำเข้า");
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importCount = preview.filter(r => r.status === "import").length;
  const hasApptCount = preview.filter(r => r.status === "has_appt").length;
  const noPatientCount = preview.filter(r => r.status === "no_patient").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files[0];
            if (dropped) await processFile(dropped);
          }}
          className="border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-[#D97736] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 text-muted-foreground rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-[#D97736] transition-all">
            <FileUp size={40} />
          </div>
          <h3 className="text-xl font-bold mb-2">ลากไฟล์ CSV หรือ Excel มาที่นี่</h3>
          <p className="text-muted-foreground max-w-sm">
            รองรับไฟล์ .csv (TIS-620), .xls, .xlsx จากระบบ HOSxP<br/>
            (ต้องมีหัวตาราง: HN, วันที่รับบริการ, วันนัดถัดไป)
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv, .xls, .xlsx" 
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden border-t-4 border-t-[#D97736]">
          {/* File Header Info */}
          <div className="p-6 border-b border-gray-50 dark:border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <p className="font-black text-lg">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB • พร้อมนำเข้า</p>
              </div>
            </div>
            <button 
              onClick={reset}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Summary Badges */}
          {preview.length > 0 && (
            <div className="px-6 pt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                <CheckCircle size={12} />
                จะนำเข้า {importCount} รายการ
              </div>
              {hasApptCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">
                  <SkipForward size={12} />
                  มีวันนัดอยู่แล้ว {hasApptCount} รายการ (จะข้าม)
                </div>
              )}
              {noPatientCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-full text-xs font-bold">
                  <UserX size={12} />
                  ไม่พบในระบบ {noPatientCount} รายการ (จะข้าม)
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold flex items-center gap-2">
                <Loader2 className={`animate-spin ${isParsing ? "block" : "hidden"}`} size={16} />
                ตัวอย่างข้อมูล (20 แถวแรก)
              </p>
              <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 text-[10px] font-black uppercase rounded">
                7-Digit HN Padding Active
              </div>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr className="border-b">
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">สถานะ</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">ผู้ป่วย</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">HN (Original)</th>
                    <th className="p-3 font-black text-[#D97736] uppercase text-[10px]">HN (Cleaned)</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">วันที่รับบริการ</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">วันนัดถัดไป</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr
                      key={i}
                      className={`font-mono transition-colors ${
                        row.status === "has_appt"
                          ? "bg-amber-50/60 dark:bg-amber-900/10 opacity-70"
                          : row.status === "no_patient"
                          ? "bg-rose-50/60 dark:bg-rose-900/10 opacity-60"
                          : "hover:bg-black/[0.015] dark:hover:bg-white/[0.015]"
                      }`}
                    >
                      <td className="p-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="p-3 font-bold text-xs">{row.name}</td>
                      <td className="p-3 text-muted-foreground">{row.originalHN}</td>
                      <td className="p-3">{row.hn}</td>
                      <td className="p-3">{row.visitDate}</td>
                      <td className="p-3">{row.nextAppt}</td>
                    </tr>
                  ))}
                  {preview.length === 0 && !isParsing && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center italic text-muted-foreground">ไม่มีข้อมูลแสดงผล</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                onClick={handleConfirm} 
                disabled={isImporting || isParsing || importCount === 0}
                className="bg-[#D97736] hover:bg-[#b05d28] text-white flex-1 font-bold h-12 shadow-lg shadow-orange-500/10 disabled:opacity-40"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    กำลังประมวลผลข้อมูล...
                  </>
                ) : (
                  <>
                    <Database className="mr-2" size={20} />
                    {importCount > 0 ? `ยืนยันการนำเข้า (${importCount} รายการ)` : "ไม่มีรายการที่จะนำเข้า"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                disabled={isImporting}
                className="font-bold h-12 border-2"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 p-5 rounded-2xl">
        <h4 className="font-black text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2 text-sm">
          <AlertCircle size={18} />
          ข้อควรรู้ในการเตรียมไฟล์:
        </h4>
        <ul className="text-xs text-blue-700/80 dark:text-blue-400 space-y-2 list-disc pl-4">
          <li><strong>หัวตารางต้องเป๊ะ:</strong> ระบบจะมองหาคอลัมน์ชื่อ <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded font-bold">HN</code>, <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded font-bold">วันที่รับบริการ</code> และ <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded font-bold">วันนัดถัดไป</code></li>
          <li><strong>รูปแบบไฟล์ CSV:</strong> รองรับการเข้ารหัสแบบ <code className="font-bold">TIS-620</code> หรือ <code className="font-bold">CP874</code> ที่ส่งออกมาจาก HOSxP โดยตรง</li>
          <li><strong>ข้ามอัตโนมัติ:</strong> รายการที่มีวันนัดถัดไปบันทึกไว้ในระบบอยู่แล้ว หรือ HN ไม่พบในฐานข้อมูลจะ<strong>ไม่ถูก</strong>นำเข้า</li>
          <li><strong>ความปลอดภัย:</strong> เฉพาะ HN ที่มีตัวตนในฐานข้อมูลผู้ป่วยเท่านั้นที่จะถูกนำเข้า</li>
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RowStatus }) {
  if (status === "import") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-black uppercase">
        <CheckCircle size={10} /> นำเข้า
      </span>
    );
  }
  if (status === "has_appt") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] font-black uppercase">
        <SkipForward size={10} /> มีวันนัดแล้ว
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded text-[10px] font-black uppercase">
      <UserX size={10} /> ไม่พบในระบบ
    </span>
  );
}
