import React from 'react';
import { Patient, Visit, Medication } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
    weight: ['300', '400', '500', '600', '700', '800'],
    subsets: ['thai', 'latin'],
    display: 'swap',
});

interface ActionPlanPrintProps {
    patient: Patient | null;
    visit: Visit | null;
    medication: Medication | null;
}

const TrafficLight = ({ color }: { color: 'green' | 'yellow' | 'red' }) => (
    <div className="bg-[#2D2A26] p-1.5 rounded-full flex flex-col items-center gap-1.5 w-10 mx-auto border-[3px] border-gray-300 shadow-md shrink-0">
        <div className={`w-4 h-4 rounded-full border border-black/50 ${color === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-red-950 opacity-40'}`}></div>
        <div className={`w-4 h-4 rounded-full border border-black/50 ${color === 'yellow' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]' : 'bg-yellow-900 opacity-40'}`}></div>
        <div className={`w-4 h-4 rounded-full border border-black/50 ${color === 'green' ? 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-green-900 opacity-40'}`}></div>
    </div>
);

export const ActionPlanPrint: React.FC<ActionPlanPrintProps> = ({ patient, visit, medication }) => {
    if (!patient || !visit) return null;

    const mapFreqToThai = (freq: string) => {
        if (!freq) return "";
        if (freq === "OD") return "วันละ 1 ครั้ง";
        if (freq === "BID") return "วันละ 2 ครั้ง (เช้า-เย็น)";
        if (freq === "PRN") return "เมื่อมีอาการ";
        return freq;
    };

    const formatMed = (name?: string, puffs?: string, freq?: string) => {
        if (!name || name === '-' || name === "" || name === "null") return "-";
        return `${name} ${puffs ? puffs + ' puffs' : ''} ${mapFreqToThai(freq || '')}`;
    };

    let controllerText = "ตามแพทย์สั่ง";
    if (medication) {
        if (medication.c1_name && medication.c1_name !== '-') {
            controllerText = `${formatMed(medication.c1_name, medication.c1_puffs, medication.c1_freq)} (ใช้ต่อเนื่อง)`;
            if (medication.c2_name && medication.c2_name !== '-') {
                controllerText += ` และ ${formatMed(medication.c2_name, medication.c2_puffs, medication.c2_freq)} (ใช้ต่อเนื่อง)`;
            }
        } else {
            controllerText = "-";
        }
    } else if (visit.controller) {
        controllerText = `${visit.controller} (ใช้ต่อเนื่อง)`;
    }

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
        <div className={`${sarabun.className} bg-white text-[13px]`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            {/* PAGE 1 */}
            <div className="w-[210mm] min-h-[282mm] bg-white text-black p-5 mx-auto flex flex-col" style={{ pageBreakAfter: 'always' }}>
                
                {/* Page 1 Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-2.5 mb-2.5 shrink-0">
                    <div className="text-left">
                        <h2 className="text-2xl font-black text-gray-900">{patient.prefix}{patient.first_name} {patient.last_name}</h2>
                        <p className="text-lg font-mono text-[#D97736] font-bold leading-tight mt-1">HN: {patient.hn}</p>
                        <p className="text-sm text-gray-500 font-bold leading-tight mt-1">Date: {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <h1 className="text-xl font-black uppercase tracking-wider text-gray-900 leading-tight">Asthma Action Plan</h1>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">แผนปฏิบัติการสำหรับผู้ป่วยหอบหืด</p>
                        </div>
                        <div className="bg-white border-2 border-black p-1">
                            <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://asthma-flow.vercel.app'}/patient/${patient.public_token}`} size={56} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {/* 1. GREEN ZONE */}
                    <div className="flex border-4 border-green-500 rounded-xl overflow-hidden relative shadow-sm">
                        <div className="w-14 bg-green-100 flex flex-col items-center py-4 border-r-4 border-green-500 font-bold shrink-0">
                            <TrafficLight color="green" />
                        </div>
                        <div className="flex-1 bg-[#F0FDF4] flex flex-col p-0">
                            <div className="bg-green-100 text-green-800 font-black text-[15px] p-1.5 text-center border-b border-green-200 shadow-sm leading-tight">
                                “รู้สึกสบายดี หายใจสะดวก ไม่แน่นหน้าอกหรือไอ”
                            </div>
                            <div className="p-2.5 text-[13px] text-gray-800 flex flex-col justify-between flex-1 gap-1">
                                <ul className="space-y-1 list-none font-medium ml-2">
                                    <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" /> <span className="leading-relaxed">ใช้ <span className="text-green-700 font-bold underline">ยาป้องกันหอบ</span> เป็นประจำทุกวัน <span className="text-red-600 font-bold">ไม่ปรับลดยาเอง</span><br/><span className="text-[#D97736] font-bold">➔ {controllerText}</span></span></li>
                                    <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" /> <span>หลีกเลี่ยงสิ่งกระตุ้นที่ทำให้อาการแย่ลง</span></li>
                                    <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" /> <span>ถ้าหอบจากการออกกำลังกาย ให้พ่นยา <span className="font-bold text-[#D97736]">{medication?.reliever_name || visit.reliever || "ยาฉุกเฉิน"}</span> ก่อนออกกำลังกาย 15 นาที</span></li>
                                    <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" /> <span>ควรอบอุ่นร่างกายและผ่อนคลายกล้ามเนื้อ 10-15 นาที ก่อนและหลังออกกำลังกาย</span></li>
                                </ul>
                                
                                <div className="border border-green-300 rounded-lg p-1.5 bg-white relative mt-1.5">
                                    <div className="absolute -top-3 left-3 bg-white px-1 text-[11px] font-bold text-green-700">สิ่งกระตุ้นที่ควรหลีกเลี่ยง</div>
                                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-[11px] mt-1 ml-2 font-medium text-gray-700">
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> ไรฝุ่น</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> สัตว์เลี้ยง</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> เกสร/ดอกไม้</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> ควัน/บุหรี่</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> แมลงสาบ</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> เชื้อรา</label>
                                        <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> พรม</label>
                                        <label className="flex items-center gap-1.5 whitespace-nowrap"><input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> อาหาร___________</label>
                                    </div>
                                    <div className="mt-1 ml-2 font-medium text-[11px] text-gray-700 flex items-center gap-1.5">
                                        <input type="checkbox" className="rounded border-gray-300 w-3 h-3" /> อื่นๆ___________________________________________
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#22C55E] text-white font-black text-center text-[15px] tracking-widest uppercase mt-auto leading-tight py-1">
                                รู้สึกสบายดี (Green Zone)
                            </div>
                        </div>
                    </div>

                    {/* 2. YELLOW ZONE */}
                    <div className="flex border-4 border-yellow-400 rounded-xl overflow-hidden relative shadow-sm">
                        <div className="w-14 bg-yellow-100 flex flex-col items-center py-4 border-r-4 border-yellow-400 shrink-0">
                            <TrafficLight color="yellow" />
                        </div>
                        <div className="flex-1 bg-[#FEFCE8] flex flex-col p-0">
                            <div className="bg-yellow-200 text-yellow-800 font-black text-[15px] p-1.5 text-center border-b border-yellow-300 shadow-sm leading-tight">
                                “รู้สึกว่าอาการกำเริบ ควบคุมได้บ้าง”
                            </div>
                            <div className="p-2.5 text-[13px] text-gray-800 flex flex-col flex-1 gap-1.5 justify-between">
                                <div>
                                    <p className="text-center font-bold text-gray-700 leading-relaxed mb-1.5 px-2 whitespace-pre-wrap text-[12.5px]">
                                        มีอาการไอ แน่นหน้าอก หายใจลำบาก หายใจมีเสียงหวีด ตื่นมาไอตลอดกลางคืน เหนื่อยง่าย เล่นหรือทำงานได้น้อยลง
                                    </p>
                                    <div className="mt-1 px-2">
                                        <h3 className="font-bold text-gray-800 text-[13.5px] mb-2">ปฏิบัติดังนี้</h3>
                                        <ul className="space-y-1.5 list-none font-medium ml-1.5 text-[12.5px]">
                                            <li className="flex gap-2 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 shrink-0 mt-1.5"></div>
                                                <div className="flex-1">
                                                    <span className="font-bold text-gray-800">พ่นยาฉุกเฉินและรอดูอาการ 15 นาที</span>
                                                    <ul className="space-y-1 ml-2 text-[12px] text-gray-700 mt-1">
                                                        <li className="flex gap-2 items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-1.5"></div>
                                                            <span><span className="font-bold">{medication?.reliever_name && medication.reliever_name !== '-' ? medication.reliever_name : visit?.reliever || "ยาฉุกเฉิน"}</span> 1 ชุด คือ กดยา {(medication as any)?.reliever_puffs || '4'} ครั้ง แต่ละครั้งห่างกัน 10 วินาที</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </li>
                                            <li className="flex gap-2 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 shrink-0 mt-1.5"></div>
                                                <span className="font-bold text-gray-800">ถ้าพ่น 3 ชุดแล้วไม่ดีขึ้น โทรเรียกรถพยาบาลมารับ</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#FBBF24] text-yellow-900 font-black text-center text-[15px] tracking-widest uppercase mt-auto leading-tight py-1">
                                อาการกำเริบ - หอบ (Yellow Zone)
                            </div>
                        </div>
                    </div>

                    {/* 3. RED ZONE */}
                    <div className="flex border-4 border-red-500 rounded-xl overflow-hidden relative shadow-sm">
                        <div className="w-14 bg-red-100 flex flex-col items-center py-4 border-r-4 border-red-500 shrink-0">
                            <TrafficLight color="red" />
                        </div>
                        <div className="flex-1 bg-[#FEF2F2] flex flex-col p-0 text-[13px] text-gray-800">
                            <div className="bg-red-200 text-red-800 font-black text-[15px] p-1.5 text-center border-b border-red-300 shadow-sm leading-tight flex justify-between items-center px-4">
                                <span>“อาการแย่มาก ควบคุมไม่ได้ !!”</span>
                                <span className="text-[11px] font-bold text-red-700 bg-white px-2 py-0.5 rounded border border-red-300">ค่า Peak Flow น้อยกว่า ..........</span>
                            </div>
                            
                            <div className="p-2.5 flex flex-col flex-1 gap-1.5 justify-between">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-bold text-red-900 px-2 text-[12px]">
                                    <div>• ไม่มีแรง เดินไม่ไหว</div>
                                    <div>• หอบจนหน้าอกบุ๋ม กระสับกระส่าย</div>
                                    <div>• หัวใจเต้นเร็วมาก อยู่เฉยๆ ก็เหนื่อย</div>
                                    <div>• ปลายนิ้วหรือริมฝีปากเขียว</div>
                                    <div>• หายใจลำบาก แรงและเร็ว</div>
                                    <div>• พูดได้เป็นคำ ไม่เป็นประโยค</div>
                                </div>

                                <div className="bg-white border-2 text-center shadow-sm mx-1 p-1.5 border-red-400 rounded-lg">
                                    <p className="font-bold text-red-800 text-[13px] leading-tight mb-0.5">คุณอยู่ในภาวะฉุกเฉิน ให้พบแพทย์ทันที !!</p>
                                    <p className="font-bold text-red-600 text-[13px] leading-tight mt-0.5 mb-1.5">และใช้ <span className="underline">ยาฉุกเฉิน</span> ขยายหลอดลมทุก 15 นาที จนกว่าจะถึงโรงพยาบาล</p>
                                    <p className="text-[11px] font-bold text-gray-700 bg-red-50 p-1 rounded border border-red-100 mt-1 mx-2">
                                        ยาฉุกเฉิน สูดพ่นครั้งละ {(medication as any)?.reliever_puffs || '4'} สูด = 1 ชุด. หากอาการไม่ดีขึ้น สูดพ่นยาฉุกเฉินชุดต่อไปซ้ำได้ทุก 15 นาที
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 text-[10.5px] text-gray-700 font-medium mx-1">
                                    <div className="border border-gray-300 rounded p-1.5 bg-white shadow-sm">
                                        <p className="font-bold text-gray-900 border-b border-gray-200 pb-0.5 mb-1">ประวัติการมาพ่นยาที่ห้องฉุกเฉิน</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <span>ครั้งที่ 1 ____/____</span>
                                            <span>ครั้งที่ 2 ____/____</span>
                                            <span>ครั้งที่ 3 ____/____</span>
                                            <span>ครั้งที่ 4 ____/____</span>
                                        </div>
                                    </div>
                                    <div className="border border-gray-300 rounded p-1.5 bg-white shadow-sm">
                                        <p className="font-bold text-gray-900 border-b border-gray-200 pb-0.5 mb-1">ประวัติการนอนโรงพยาบาลด้วยโรคหืด</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <span>ครั้งที่ 1 ____/____</span>
                                            <span>ครั้งที่ 2 ____/____</span>
                                            <span>ครั้งที่ 3 ____/____</span>
                                            <span>ครั้งที่ 4 ____/____</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#EF4444] text-white font-black text-center text-[15px] tracking-widest uppercase mt-auto leading-tight py-1">
                                มีอาการรุนแรง - หอบมาก (Red Zone)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature Box */}
                <div className="mt-auto flex justify-between items-end pt-2 px-2 pb-1">
                    <p className="text-[11px] text-gray-400 font-bold mb-0.5">
                        Data from Asthma Flow 
                    </p>
                    <div className="text-center mr-4">
                        <div className="w-56 border-b border-gray-800 mb-1.5 mt-2"></div>
                        <p className="text-[11px] font-bold text-gray-800">( เภสัชกร / พยาบาล / แพทย์ )</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">ผู้ให้คำแนะนำและประเมิน</p>
                    </div>
                </div>
            </div>

            {/* PAGE 2 - Triggers */}
            <div className="w-[210mm] min-h-[282mm] bg-white text-black p-6 mx-auto leading-relaxed flex flex-col" style={{ pageBreakInside: 'avoid' }}>
                <div className="text-center mb-5 border-b-2 border-gray-800 pb-3">
                    <h1 className="text-[28px] font-black text-[#2D2A26] mb-1.5">สิ่งกระตุ้นที่ควรหลีกเลี่ยงในโรคหืด</h1>
                    <h2 className="text-[16px] font-bold text-gray-500 italic">Learn how to avoid triggers to control your asthma</h2>
                    <p className="text-[12.5px] font-bold text-gray-700 mt-2.5 bg-blue-50 py-1.5 px-5 rounded-full inline-block border border-blue-200 shadow-sm">
                        การหลีกเลี่ยงสิ่งกระตุ้นสามารถช่วยให้คุณควบคุมโรคหืดได้ดีขึ้น และลดการใช้ยาฉุกเฉิน
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[13px] flex-1">
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex gap-2.5 shadow-sm h-fit">
                        <div className="text-3xl shrink-0 mt-1">🚭</div>
                        <div>
                            <h3 className="text-[13.5px] font-black text-red-800 mb-1 border-b border-red-200 pb-1">ควันบุหรี่และควันไฟ (Smoke)</h3>
                            <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                <li><strong>เลิกสูบบุหรี่</strong> และขอร้องไม่ให้ผู้อื่นสูบบุหรี่ในบ้านหรือในรถ</li>
                                <li>ควันบุหรี่มือสองทำให้โรคหืดกำเริบได้ง่าย โดยเฉพาะในเด็ก</li>
                                <li>หลีกเลี่ยงควันจากการเผาขยะ เผาหญ้า หรือการจุดธูปเทียนในที่อับ</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex gap-2.5 shadow-sm h-fit">
                        <div className="text-3xl shrink-0 mt-1">🦠</div>
                        <div>
                            <h3 className="text-[13.5px] font-black text-orange-800 mb-1 border-b border-orange-200 pb-1">ไรฝุ่น (Dust Mites)</h3>
                            <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                <li>ใช้ผ้าปูที่นอนและปลอกหมอนกันไรฝุ่น</li>
                                <li>ซักปลอกหมอน ผ้ารองที่นอน และผ้าห่ม ใน<strong>น้ำร้อน</strong> (55°C-60°C) สัปดาห์ละ 1 ครั้ง</li>
                                <li>หลีกเลี่ยงการใช้พรมในห้องนอน และไม่ควรวางตุ๊กตาขนฟูไว้บนเตียง</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex gap-2.5 shadow-sm h-fit">
                        <div className="text-3xl shrink-0 mt-1">🪳</div>
                        <div>
                            <h3 className="text-[13.5px] font-black text-amber-800 mb-1 border-b border-amber-200 pb-1">แมลงสาบ (Cockroach)</h3>
                            <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                <li>เก็บอาหารและขยะในภาชนะที่มีฝาปิดมิดชิด</li>
                                <li>ทำความสะอาดเศษอาหารทันที ไม่ควรทิ้งจานชามค้างคืน</li>
                                <li>ปิดช่องว่างหรือรอยแตกร้าวตามผนังบ้านเพื่อป้องกันแมลง</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex gap-2.5 shadow-sm h-fit">
                        <div className="text-3xl shrink-0 mt-1">🐾</div>
                        <div>
                            <h3 className="text-[13.5px] font-black text-emerald-800 mb-1 border-b border-emerald-200 pb-1">สัตว์เลี้ยงมีขน (Pets)</h3>
                            <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                <li><strong>ไม่ควรนำสัตว์เลี้ยงเข้ามาในห้องนอน</strong> และควรปิดประตูห้องนอนเสมอ</li>
                                <li>หากเป็นไปได้ ควรเลี้ยงสัตว์ไว้บริเวณนอกบ้าน</li>
                                <li>ดูดฝุ่นและทำความสะอาดบ้านอย่างสม่ำเสมอ อาบน้ำให้สัตว์เลี้ยงสัปดาห์ละครั้ง</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-100 flex gap-2.5 shadow-sm h-fit">
                        <div className="text-3xl shrink-0 mt-1">🍄</div>
                        <div>
                            <h3 className="text-[13.5px] font-black text-cyan-800 mb-1 border-b border-cyan-200 pb-1">เชื้อรา (Mold)</h3>
                            <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                <li>ทำความสะอาดบริเวณที่ชื้น เช่น ห้องน้ำ หรือห้องครัว ทันที</li>
                                <li>ซ่อมแซมรอยรั่วซึมตามท่อน้ำหรือหลังคา เพื่อลดความชื้นสะสม</li>
                                <li>เปิดหน้าต่างรับแสงแดด และระบายอากาศในบ้านให้ถ่ายเทได้ดี</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex gap-2.5 shadow-sm h-fit">
                        <div className="text-3xl shrink-0 mt-1">😷</div>
                        <div>
                            <h3 className="text-[13.5px] font-black text-blue-800 mb-1 border-b border-blue-200 pb-1">การติดเชื้อทางเดินหายใจ (Infections)</h3>
                            <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                <li>การเป็นไข้หวัดหรือไข้หวัดใหญ่อาจทำให้อาการหอบกำเริบรุนแรง</li>
                                <li>ล้างมือด้วยสบู่บ่อยๆ เพื่อป้องกันการรับเชื้อและแพร่เชื้อ</li>
                                <li><strong>ฉีดวัคซีนป้องกันไข้หวัดใหญ่</strong> เป็นประจำอย่างน้อยปีละครั้ง</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 flex gap-3 shadow-sm h-fit col-span-2">
                        <div className="text-3xl shrink-0 mt-1">🌫️</div>
                        <div className="w-full">
                            <h3 className="text-[14px] font-black text-purple-800 mb-1.5 border-b border-purple-200 pb-1">สิ่งกระตุ้นอื่นๆ: มลพิษ, กลิ่นฉุน, และสภาพอากาศ (Other Triggers)</h3>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                    <li><strong>ฝุ่น PM 2.5:</strong> สวมหน้ากากและงดกิจกรรมกลางแจ้งเมื่อค่าฝุ่นสูง</li>
                                    <li><strong>กลิ่นฉุน:</strong> หลีกเลี่ยงน้ำหอม สเปรย์ฉีดผม หรือผลิตภัณฑ์ที่มีกลิ่นฉุนรุนแรง</li>
                                    <li><strong>ยาบางชนิด:</strong> แจ้งแพทย์ทุกครั้งว่าเป็นโรคหืด ยาบางกลุ่มอาจทำให้อาการกำเริบ</li>
                                </ul>
                                <ul className="list-disc pl-4 space-y-1 text-gray-800 font-medium">
                                    <li><strong>สภาพอากาศเย็น:</strong> สวมหน้ากากหรือผ้าพันคอปิดจมูกเมื่ออากาศเย็นจัด</li>
                                    <li><strong>ความเครียด:</strong> พักผ่อนให้เพียงพอ ทำจิตใจให้สงบและจัดการความเครียด</li>
                                    <li><strong>การออกกำลังกาย:</strong> หากหอบจากการออกกำลังกาย ให้พ่นยาฉุกเฉินก่อนทำกิจกรรม 15 นาทีตามแพทย์สั่ง อบอุ่นร่างกายก่อนเสมอ</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto text-center text-[11px] font-bold text-gray-400 flex justify-between items-end pt-3 pb-1">
                    <p className="text-left">อ้างอิงข้อมูล: Centers for Disease Control and Prevention (CDC) - Asthma Action Plan</p>
                    <p>{typeof window !== 'undefined' ? window.location.host : 'asthma-flow.vercel.app'}</p>
                </div>
            </div>
        </div>
    );
};
