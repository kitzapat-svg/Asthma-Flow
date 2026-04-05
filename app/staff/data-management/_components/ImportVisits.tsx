"use client";

import { useState, useRef } from "react";
import { FileUp, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { importVisitsAction } from "../_actions/import-visits";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import iconv from "iconv-lite";

interface ImportPreview {
  hn: string;
  visitDate: string;
  nextAppt: string;
  originalHN: string;
}

export function ImportVisits({ patients }: { patients: any[] }) {
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
        // Read as buffer to decode Thai encoding
        const uint8 = new Uint8Array(buffer);
        const decoded = iconv.decode(Buffer.from(uint8), "win874");
        const result = Papa.parse(decoded, { header: true, skipEmptyLines: true });
        data = result.data;
      } else {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(sheet);
      }

      // Check headers
      const firstRow = data[0] || {};
      const required = ["HN", "วันที่รับบริการ", "วันนัดถัดไป"];
      const missing = required.filter(h => !(h in firstRow));

      if (missing.length > 0) {
        toast.error(`ไฟล์ไม่ถูกต้อง: ขาดคอลัมน์ ${missing.join(", ")}`);
        setFile(null);
        return;
      }

      // Create limited preview (max 20 rows)
      const previewRows = data.slice(0, 20).map(row => {
        const rawHn = String(row.HN);
        const normHn = String(rawHn).trim().replace(/^0+/, '');
        const patient = patients.find(p => String(p.hn).trim().replace(/^0+/, '') === normHn);
        const name = patient ? `${patient.prefix}${patient.first_name} ${patient.last_name}` : "- (ไม่พบข้อมูลในระบบ)";
        
        return {
          hn: normHn.padStart(7, '0'),
          visitDate: String(row.วันที่รับบริการ).split('T')[0],
          nextAppt: String(row.วันนัดถัดไป || "-").split('T')[0],
          originalHN: rawHn,
          name
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
          description: `เพิ่มใหม่ ${res.summary?.insertCount} รายการ, อัปเดต ${res.summary?.updateCount} รายการ (ข้าม ${res.summary?.skipCount} รายการ)`,
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
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">ผู้ป่วย</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">HN (Original)</th>
                    <th className="p-3 font-black text-[#D97736] uppercase text-[10px]">HN (Cleaned)</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">วันที่รับบริการ</th>
                    <th className="p-3 font-black text-muted-foreground uppercase text-[10px]">วันนัดถัดไป</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row: any, i) => (
                    <tr key={i} className="font-mono">
                      <td className="p-3 font-bold text-xs">{row.name}</td>
                      <td className="p-3 text-muted-foreground">{row.originalHN}</td>
                      <td className="p-3">{row.hn}</td>
                      <td className="p-3">{row.visitDate}</td>
                      <td className="p-3">{row.nextAppt}</td>
                    </tr>
                  ))}
                  {preview.length === 0 && !isParsing && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center italic text-muted-foreground">ไม่มีข้อมูลแสดงผล</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                onClick={handleConfirm} 
                disabled={isImporting || isParsing}
                className="bg-[#D97736] hover:bg-[#b05d28] text-white flex-1 font-bold h-12 shadow-lg shadow-orange-500/10"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    กำลังประมวลผลข้อมูล...
                  </>
                ) : (
                  <>
                    <Database className="mr-2" size={20} />
                    ยืนยันการนำเข้าข้อมูล
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
          <li><strong>รูปแบบไฟล์ CSV:</strong> รองรับการเข้ารหัสแบบ <code className="font-bold">TIS-620</code> หรือ <code className="font-bold">CP874</code> ที่ส่งออกมาจาก HOSxP โดยตรง (แก้ปัญหาภาษาไทยอ่านไม่ออก)</li>
          <li><strong>การจัดการข้อมูล:</strong> ระบบจะอัปเดตเฉพาะ "วันนัดถัดไป" หากพบว่ามีประวัติ HN และวันที่มาตรวจนั้นอยู่แล้ว หากยังไม่มีจะสร้างรายการใหม่ให้โดยอัตโนมัติ</li>
          <li><strong>ความปลอดภัย:</strong> เฉพาะ HN ที่ระบุว่ามีตัวตนในฐานข้อมูลผู้ป่วยของระบบเท่านั้นที่จะถูกนําเข้า</li>
        </ul>
      </div>
    </div>
  );
}
