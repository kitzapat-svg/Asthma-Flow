import React from 'react';
import { Patient, Visit, Medication } from '@/lib/types'; // Import Medication
import { QRCodeSVG } from 'qrcode.react';
import { Activity, CheckCircle, AlertTriangle, XCircle, FileText, Phone } from 'lucide-react';

interface ActionPlanPrintProps {
    patient: Patient | null;
    visit: Visit | null;
    medication: Medication | null; // Add prop
}

export const ActionPlanPrint: React.FC<ActionPlanPrintProps> = ({ patient, visit, medication }) => {
    if (!patient || !visit) return null;

    const mapFreqToThai = (freq: string) => {
        if (!freq) return "";
        if (freq === "OD") return "วันละ 1 ครั้ง"; // User requested: no time specific
        if (freq === "BID") return "วันละ 2 ครั้ง (เช้า-เย็น)";
        if (freq === "PRN") return "เมื่อมีอาการ";
        return freq;
    };

    // Fix Med Display logic
    const formatMed = (name?: string, puffs?: string, freq?: string) => {
        if (!name || name === '-' || name === "" || name === "null") return "-";
        return `${name} ${puffs ? puffs + ' puffs' : ''} ${mapFreqToThai(freq || '')}`;
    };
    // Controller String
    let controllerText = "ตามแพทย์สั่ง"; // Default
    if (medication) {
        if (medication.c1_name && medication.c1_name !== '-') {
            controllerText = `${formatMed(medication.c1_name, medication.c1_puffs, medication.c1_freq)} (ใช้ต่อเนื่อง)`;
            if (medication.c2_name && medication.c2_name !== '-') {
                controllerText += ` และ ${formatMed(medication.c2_name, medication.c2_puffs, medication.c2_freq)} (ใช้ต่อเนื่อง)`;
            }
        } else {
            controllerText = "-"; // Explicitly show dash if medication data exists but name is empty/dash
        }
    } else if (visit.controller) {
        controllerText = `${visit.controller} (ใช้ต่อเนื่อง)`;
    }

    // Reliever String
    let relieverText = "ตามแพทย์สั่ง";
    if (medication) {
        if (medication.reliever_name && medication.reliever_name !== '-') {
            relieverText = `${medication.reliever_name} ${medication.reliever_label}`;
        } else {
            relieverText = "-";
        }
    } else if (visit.reliever) {
        relieverText = `${visit.reliever}`;
    }

    return (
        <div className="w-[210mm] h-[297mm] bg-white text-black p-8 font-sans relative flex flex-col">
            {/* Header Area - Rearranged */}
            <div className="flex justify-between items-start border-b-2 border-[#2D2A26] pb-4 mb-4">
                {/* Left: Patient Info */}
                <div className="text-left">
                    <h2 className="text-2xl font-black text-[#2D2A26]">{patient.prefix}{patient.first_name} {patient.last_name}</h2>
                    <p className="text-lg font-mono text-[#D97736] font-bold">HN: {patient.hn}</p>
                    <p className="text-sm text-gray-500 font-bold">Date: {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>
                </div>

                {/* Right: Title & QR */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <h1 className="text-xl font-black uppercase tracking-wider text-[#2D2A26]">Asthma Action Plan</h1>
                        <p className="text-xs font-bold text-gray-500">แผนปฏิบัติการสำหรับผู้ป่วยหอบหืด</p>
                    </div>
                    <div className="bg-white border-2 border-black p-1">
                        <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${patient.public_token}`} size={60} />
                    </div>
                </div>
            </div>

            {/* Zones Grid */}
            <div className="flex-1 flex flex-col gap-3">

                {/* 1. GREEN ZONE - WELL */}
                <div className="flex border-2 border-green-500 rounded-xl overflow-hidden relative flex-1 min-h-[160px]">
                    <div className="w-14 bg-green-100 flex flex-col items-center justify-center border-r border-green-200">
                        <CheckCircle size={28} className="text-green-600 mb-2" />
                        <div className="vertical-text font-black text-green-700 tracking-widest uppercase rotate-180 text-xs" style={{ writingMode: 'vertical-rl' }}>Green Zone</div>
                    </div>
                    <div className="flex-1 p-3 bg-green-50/30 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-lg font-black text-green-800">สบายดี (ควบคุมได้)</h3>
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">ทำกิจวัตรได้ปกติ</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-gray-800 mb-2">
                                <li>ไม่มีอาการไอ ไม่หอบเหนื่อย</li>
                                <li>นอนหลับได้ดี ไม่ตื่นกลางดึก</li>
                                <li>ค่า PEFR มากกว่า 80% ของค่าที่ดีที่สุด</li>
                            </ul>
                        </div>

                        <div className="bg-white border border-green-200 rounded-lg p-2 shadow-sm">
                            <p className="font-bold text-green-800 underline mb-1 text-xs">การใช้ยา:</p>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                                <div className="flex items-start gap-2">
                                    <span className="min-w-[70px] font-bold text-gray-600">ยาควบคุม:</span>
                                    <span className="font-bold text-[#2D2A26] flex-1">{controllerText}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="min-w-[70px] font-bold text-gray-600">ยาฉุกเฉิน:</span>
                                    <span className="font-bold text-[#2D2A26] flex-1">{relieverText} (เมื่อมีอาการ)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. YELLOW ZONE - CAUTION */}
                <div className="flex border-2 border-yellow-500 rounded-xl overflow-hidden relative flex-1 min-h-[160px]">
                    <div className="w-14 bg-yellow-100 flex flex-col items-center justify-center border-r border-yellow-200">
                        <AlertTriangle size={28} className="text-yellow-600 mb-2" />
                        <div className="vertical-text font-black text-yellow-700 tracking-widest uppercase rotate-180 text-xs" style={{ writingMode: 'vertical-rl' }}>Yellow Zone</div>
                    </div>
                    <div className="flex-1 p-3 bg-yellow-50/30 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-lg font-black text-yellow-800">เริ่มมีอาการ (ระวัง)</h3>
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-[10px] font-bold">เหนื่อยง่ายขึ้น</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-gray-800 mb-2">
                                <li>มีอาการไอ เหนื่อย แน่นหน้าอก</li>
                                <li>ตื่นกลางดึกเพราะไอ</li>
                                <li>ค่า PEFR อยู่ระหว่าง 50-80%</li>
                            </ul>
                        </div>

                        <div className="bg-white border border-yellow-200 rounded-lg p-2 shadow-sm">
                            <p className="font-bold text-yellow-800 underline mb-1 text-xs">การปฏิบัติตัว:</p>
                            <ul className="list-decimal pl-4 space-y-0.5 text-xs text-gray-800">
                                <li>ใช้ยาควบคุม <span className="font-bold">{controllerText}</span> ต่อเนื่อง</li>
                                <li>พ่นยาฉุกเฉิน <span className="font-bold">{medication?.reliever_name || visit.reliever || "Salbutamol"}</span> 2 พัฟ ทุก 4-6 ชั่วโมง</li>
                                <li>ถ้าอาการไม่ดีขึ้นใน 1 วัน ให้ไปพบแพทย์</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. RED ZONE - EMERGENCY */}
                <div className="flex border-2 border-red-500 rounded-xl overflow-hidden relative flex-1 min-h-[160px]">
                    <div className="w-14 bg-red-100 flex flex-col items-center justify-center border-r border-red-200">
                        <XCircle size={28} className="text-red-600 mb-2" />
                        <div className="vertical-text font-black text-red-700 tracking-widest uppercase rotate-180 text-xs" style={{ writingMode: 'vertical-rl' }}>Red Zone</div>
                    </div>
                    <div className="flex-1 p-3 bg-red-50/30 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-lg font-black text-red-800">อันตราย (ฉุกเฉิน)</h3>
                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">รีบพบแพทย์!</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-gray-800 mb-2 cursor-auto">
                                <li>หอบเหนื่อยมาก พูดไม่เป็นประโยค</li>
                                <li>ริมฝีปากเขียว ซึมลง</li>
                                <li>ค่า PEFR ต่ำกว่า 50%</li>
                            </ul>
                        </div>

                        <div className="bg-white border border-red-200 rounded-lg p-2 shadow-sm">
                            <p className="font-bold text-red-800 underline mb-1 text-xs">การปฏิบัติตัว:</p>
                            <div className="flex items-center gap-2 mb-1">
                                <Phone size={16} className="text-red-600 animate-bounce" />
                                <span className="text-base font-black text-red-600">โทร 1669 หรือไปโรงพยาบาลทันที</span>
                            </div>
                            <ul className="list-decimal pl-4 space-y-0.5 text-xs text-gray-800">
                                <li>พ่นยาฉุกเฉิน 2-4 พัฟ ทันที</li>
                                <li>พ่นซ้ำได้ทุก 15-20 นาที ระหว่างเดินทาง</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Signature */}
            <div className="mt-4 flex justify-between items-end border-t border-gray-300 pt-4">
                <div className="text-left">
                    <p className="text-[10px] text-gray-400">Scan for Digital Plan: asthsawan.vercel.app</p>
                </div>
                <div className="text-center">
                    <div className="w-64 border-b border-black mb-2"></div>
                    <p className="text-xs font-bold text-[#2D2A26]">( เภสัชกร / พยาบาล / แพทย์ )</p>
                    <p className="text-[10px] text-gray-500">ผู้ให้คำแนะนำ</p>
                </div>
            </div>
        </div>
    );
};
