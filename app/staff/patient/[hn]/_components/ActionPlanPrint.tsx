import { Patient, Visit } from "@/lib/types";
import { CheckCircle, AlertTriangle, XCircle, Phone, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ActionPlanPrintProps {
    patient: Patient;
    visit: Visit;
}

export function ActionPlanPrint({ patient, visit }: ActionPlanPrintProps) {
    const controller = visit.controller || "ยาควบคุม";
    const reliever = visit.reliever || "ยาฉุกเฉิน";

    return (
        <div className="hidden print:block w-full max-w-[210mm] h-auto bg-white text-black p-4 font-sans relative">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4">
                <div>
                    <h1 className="text-xl font-black uppercase text-[#D97736] leading-none">Asthma Action Plan</h1>
                    <p className="text-xs font-bold text-gray-500">แผนการดูแลรักษาโรคหืดเบื้องต้น</p>
                    <div className="mt-2 space-y-0.5">
                        <p className="text-base">ชื่อ-นามสกุล: <span className="font-bold border-b border-dotted border-black px-2">{patient.prefix}{patient.first_name} {patient.last_name}</span></p>
                        <p className="text-sm">HN: <span className="font-mono font-bold">{patient.hn}</span> อายุ: <span className="font-bold">{new Date().getFullYear() - new Date(patient.dob).getFullYear()}</span> ปี</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="border p-1 mb-1">
                        <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${patient.public_token}`} size={56} />
                    </div>
                    <p className="text-[10px] text-gray-400">Scan for Digital Card</p>
                    <p className="text-xs font-bold mt-1">วันที่: {new Date(visit.date).toLocaleDateString('th-TH')}</p>
                </div>
            </div>

            {/* Zones */}
            <div className="space-y-3">

                {/* GREEN ZONE */}
                <div className="border-2 border-green-500 rounded-lg overflow-hidden">
                    <div className="bg-green-500 text-white p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={32} />
                            <div>
                                <h2 className="text-xl font-black">สบายดี (Green Zone)</h2>
                                <p className="text-xs">ไม่มีอาการหอบเหนื่อย, ทำกิจวัตรได้ปกติ, นอนหลับได้ดี</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">PEFR มากกว่า 80%</p>
                            <p className="text-xs opacity-80">(ค่าเป้าหมาย: {patient.best_pefr})</p>
                        </div>
                    </div>
                    <div className="p-4 bg-green-50 space-y-2">
                        <p className="font-bold underline mb-2">การปฏิบัติ:</p>
                        <div className="flex items-start gap-2">
                            <span className="bg-green-200 px-2 rounded font-bold text-sm min-w-[20px] text-center">1</span>
                            <p>ใช้ยาควบคุมอาการ <span className="font-bold text-green-700">{controller}</span></p>
                        </div>
                        <p className="pl-8 text-sm text-gray-600">พ่นวันละ 2 ครั้ง เช้า-เย็น (ห้ามหยุดยาเองแม้ไม่มีอาการ)</p>
                        <div className="flex items-start gap-2 mt-2">
                            <span className="bg-green-200 px-2 rounded font-bold text-sm min-w-[20px] text-center">2</span>
                            <p>ใช้ยาฉุกเฉิน <span className="font-bold text-green-700">{reliever}</span></p>
                        </div>
                        <p className="pl-8 text-sm text-gray-600">พ่น 2 พัฟ ก่อนออกกำลังกาย 15 นาที (ถ้ามีอาการเหนื่อยง่าย)</p>
                    </div>
                </div>

                {/* YELLOW ZONE */}
                <div className="border-2 border-yellow-500 rounded-lg overflow-hidden">
                    <div className="bg-yellow-500 text-white p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={32} />
                            <div>
                                <h2 className="text-xl font-black">เริ่มมีอาการ (Yellow Zone)</h2>
                                <p className="text-xs text-black/60 font-bold">มีอาการไอ, เหนื่อย, แน่นหน้าอก, หรือตื่นมาไอตอนกลางคืน</p>
                            </div>
                        </div>
                        <div className="text-right text-black/60">
                            <p className="text-sm font-bold">PEFR 60-80%</p>
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 space-y-2">
                        <p className="font-bold underline mb-2 text-yellow-800">การปฏิบัติ:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
                            <li>ใช้ยาควบคุมอาการ <span className="font-bold">{controller}</span> ต่อเนื่องตามปกติ</li>
                            <li>
                                เริ่มใช้ยาฉุกเฉิน <span className="font-bold text-red-600">{reliever}</span>
                                <p className="text-gray-700">พ่น 2 พัฟ ทุก 4-6 ชั่วโมง</p>
                            </li>
                            <li className="text-red-600 font-bold">ถ้าอาการไม่ดีขึ้นภายใน 24 ชั่วโมง ให้รีบมาพบแพทย์</li>
                        </ul>
                    </div>
                </div>

                {/* RED ZONE */}
                <div className="border-2 border-red-500 rounded-lg overflow-hidden">
                    <div className="bg-red-500 text-white p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <XCircle size={32} />
                            <div>
                                <h2 className="text-xl font-black">อันตราย (Red Zone)</h2>
                                <p className="text-xs">หอบเหนื่อยมาก, พูดได้ทีละคำ, ปีกจมูกบาน, ซึมลง</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">PEFR ต่ำกว่า 60%</p>
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 space-y-2">
                        <p className="font-bold underline mb-2 text-red-600">การปฏิบัติทันที (Emergency):</p>
                        <div className="bg-white border-2 border-red-500 p-4 rounded text-center">
                            <p className="text-xl font-black text-red-600 animate-pulse">ไปโรงพยาบาลทันที!</p>
                            <p className="text-sm">หรือโทร 1669</p>
                        </div>
                        <ul className="list-decimal pl-5 space-y-2 text-sm font-medium mt-2">
                            <li>ใช้ยาฉุกเฉิน <span className="font-bold text-red-600">{reliever}</span> พ่น 2-4 พัฟ ทันที</li>
                            <li>ถ้าอาการไม่ดีขึ้น ให้พ่นซ้ำได้ทุก 15 นาที (ไม่เกิน 3 ครั้ง) ระหว่างเดินทางไปโรงพยาบาล</li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end">
                <div>
                    <p className="font-bold text-sm">คลินิกโรคหืด โรงพยาบาลสวรรคโลก</p>
                    <p className="text-xs text-gray-500">โทร. 055-641-333</p>
                </div>
                <div className="text-right">
                    <div className="h-10 border-b border-black w-40 mb-1"></div>
                    <p className="text-xs text-center">ลายเซ็นแพทย์/พยาบาล</p>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 text-[10px] text-gray-300">
                Generated by AsthmaFlow
            </div>
        </div>
    );
}
