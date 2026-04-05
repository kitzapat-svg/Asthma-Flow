export interface Patient {
    hn: string;
    prefix: string;
    first_name: string;
    last_name: string;
    dob: string;
    height: string;
    best_pefr: string;
    status: string;
    public_token: string;
    phone?: string;
}

export interface Visit {
    hn: string;
    visit_date: string;  // Supabase column name
    date?: string;       // alias kept for backwards compat
    pefr: string;
    control_level: string;
    controller: string;
    reliever: string;
    note: string;
    technique_check: string;
    next_appt?: string;
    advice?: string;
}

export interface TechniqueCheck {
    hn: string;
    date: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
    step7: string;
    step8: string;
    score: number;
    note: string;
}

export interface VisitDisplay {
    dateDisplay: string;
    fullDate: string;
    pefr: number | null;
    control_level: string;
    controller: string;
    reliever: string;
    technique_check: string;
    note: string;
}

export interface InhalerStatus {
    status: 'never' | 'overdue' | 'ok';
    days: number;
    lastDate: Date | null;
}

export const MDI_STEPS = [
    "1. เขย่าหลอดพ่นยาในแนวตั้ง 3-4 ครั้ง",
    "2. ถือหลอดพ่นยาในแนวตั้ง",
    "3. หายใจออกทางปากให้สุดเต็มที่",
    "4. ตั้งศีรษะให้ตรง",
    "5. ใช้ริมฝีปากอมปากหลอดพ่นยาให้สนิท",
    "6. หายใจเข้าทางปากช้าๆ ลึกๆ พร้อมกด",
    "7. กลั้นลมหายใจประมาณ 10 วินาที",
    "8. ผ่อนลมหายใจออกทางปากหรือจมูกช้าๆ"
];

export interface Medication {
    hn: string;
    date: string;
    c1_name: string;
    c1_puffs: string;
    c1_freq: string;
    c2_name: string;
    c2_puffs: string;
    c2_freq: string;
    reliever_name: string;
    reliever_label: string;
    note: string;
}

export interface DRP {
    id: string; // 0
    hn: string; // 1
    date: string; // 2
    visit_date: string; // 3
    category: string; // 4
    type: string; // 5
    cause: string; // 6
    intervention: string; // 7
    outcome: string; // 8
    note: string; // 9
}
