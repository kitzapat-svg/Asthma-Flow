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
    date: string;
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
    steps: string[];
    total_score: string;
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
    "เขย่าหลอด", "ถือแนวตั้ง", "หายใจออกสุด", "ตั้งศีรษะตรง",
    "อมปากสนิท", "กดพร้อมสูด", "กลั้น 10 วิ", "ผ่อนลมหายใจ"
];
