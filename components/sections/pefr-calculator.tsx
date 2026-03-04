"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RetroCard } from "@/components/animated/card-3d";
import { getDejsomritrutaiPefr } from "@/lib/pef-reference";
import { Calculator, RotateCcw } from "lucide-react";

export function PefrCalculator() {
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [pefr, setPefr] = useState("");
    const [gender, setGender] = useState<"male" | "female">("male");
    const [result, setResult] = useState<{ predicted: number; percent: number } | null>(null);

    const handleCalculate = () => {
        const ageNum = parseFloat(age);
        const heightNum = parseFloat(height);
        const pefrNum = parseFloat(pefr);

        if (!ageNum || !heightNum || !pefrNum) return;

        const predicted = getDejsomritrutaiPefr(ageNum, heightNum, gender === "male");
        if (!predicted || predicted <= 0) {
            setResult(null);
            return;
        }

        const percent = Math.round((pefrNum / predicted) * 100);
        setResult({ predicted: Math.round(predicted), percent });
    };

    const handleReset = () => {
        setAge("");
        setHeight("");
        setPefr("");
        setResult(null);
    };

    const getZoneColor = (percent: number) => {
        if (percent >= 80) return { zone: "🟢 Green Zone", label: "ปกติ (≥80%)", bg: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700", text: "text-green-700 dark:text-green-300" };
        if (percent >= 50) return { zone: "🟡 Yellow Zone", label: "ระวัง (50–79%)", bg: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700", text: "text-yellow-700 dark:text-yellow-300" };
        return { zone: "🔴 Red Zone", label: "อันตราย (<50%)", bg: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700", text: "text-red-700 dark:text-red-300" };
    };

    return (
        <section id="pefr-calculator" className="py-24 lg:py-32 relative">
            <div className="absolute inset-0 retro-dots opacity-20" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="inline-block mb-6">
                        <motion.span className="retro-badge bg-secondary text-foreground" whileHover={{ scale: 1.05 }}>
                            🧮 Tools
                        </motion.span>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase">
                        คำนวณ %PEFR
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                        เครื่องมือคำนวณเปอร์เซ็นต์ PEFR เทียบกับค่ามาตรฐาน (Predicted PEFR) ตามสูตร Dejsomritrutai
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="max-w-lg mx-auto"
                >
                    <RetroCard className="p-8 space-y-6">
                        {/* Gender */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-3">เพศ</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setGender("male")}
                                    className={`py-3 font-bold text-sm border-2 transition-all ${gender === "male"
                                        ? "bg-[#D97736] text-white border-[#2D2A26] dark:border-zinc-600 shadow-[3px_3px_0px_0px_#2D2A26] dark:shadow-none"
                                        : "bg-white dark:bg-zinc-800 text-foreground border-border dark:border-zinc-600 hover:border-[#D97736]"
                                        }`}
                                >
                                    👨 ชาย
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender("female")}
                                    className={`py-3 font-bold text-sm border-2 transition-all ${gender === "female"
                                        ? "bg-[#D97736] text-white border-[#2D2A26] dark:border-zinc-600 shadow-[3px_3px_0px_0px_#2D2A26] dark:shadow-none"
                                        : "bg-white dark:bg-zinc-800 text-foreground border-border dark:border-zinc-600 hover:border-[#D97736]"
                                        }`}
                                >
                                    👩 หญิง
                                </button>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">อายุ (ปี)</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="อายุ"
                                    className="w-full px-3 py-3 bg-secondary dark:bg-zinc-800 border-2 border-border dark:border-zinc-600 focus:border-[#D97736] outline-none font-bold text-center text-lg text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">สูง (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    placeholder="ส่วนสูง"
                                    className="w-full px-3 py-3 bg-secondary dark:bg-zinc-800 border-2 border-border dark:border-zinc-600 focus:border-[#D97736] outline-none font-bold text-center text-lg text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">PEFR</label>
                                <input
                                    type="number"
                                    value={pefr}
                                    onChange={(e) => setPefr(e.target.value)}
                                    placeholder="L/min"
                                    className="w-full px-3 py-3 bg-secondary dark:bg-zinc-800 border-2 border-border dark:border-zinc-600 focus:border-[#D97736] outline-none font-bold text-center text-lg text-foreground"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCalculate}
                                disabled={!age || !height || !pefr}
                                className="flex-1 py-4 bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider border-2 border-[#2D2A26] dark:border-zinc-200 shadow-[4px_4px_0px_0px_#888] dark:shadow-none hover:bg-[#D97736] dark:hover:bg-gray-200 hover:shadow-[4px_4px_0px_0px_#2D2A26] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Calculator size={18} /> คำนวณ
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-4 bg-white dark:bg-zinc-800 text-foreground font-bold border-2 border-border dark:border-zinc-600 hover:border-[#D97736] transition-all flex items-center justify-center"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>

                        {/* Result */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-secondary dark:bg-zinc-800 border-2 border-border dark:border-zinc-700 p-4 text-center">
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Predicted PEFR</p>
                                        <p className="text-3xl font-black text-foreground">{result.predicted}</p>
                                        <p className="text-xs text-muted-foreground font-medium">L/min</p>
                                    </div>
                                    <div className="bg-secondary dark:bg-zinc-800 border-2 border-border dark:border-zinc-700 p-4 text-center">
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">%PEFR</p>
                                        <p className="text-3xl font-black text-[#D97736]">{result.percent}%</p>
                                        <p className="text-xs text-muted-foreground font-medium">ของค่า Predicted</p>
                                    </div>
                                </div>

                                {(() => {
                                    const zone = getZoneColor(result.percent);
                                    return (
                                        <div className={`p-4 rounded-lg border-2 ${zone.bg} text-center`}>
                                            <p className={`text-lg font-black ${zone.text}`}>
                                                {zone.zone}
                                            </p>
                                            <p className={`text-sm font-bold ${zone.text} opacity-80`}>
                                                {zone.label}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </RetroCard>
                </motion.div>
            </div>
        </section>
    );
}
