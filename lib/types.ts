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
    predicted_pefr?: number;
    pefr_percent_predicted?: number;
    control_level: string;
    controller: string;
    reliever: string;
    note: string;
    technique_check: string;
    next_appt?: string;
    advice?: string;
    is_new_case?: boolean | string;
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
    predicted_pefr?: number | null;
    pefr_percent_predicted?: number | null;
    control_level: string;
    controller: string;
    reliever: string;
    technique_check: string;
    note: string;
    next_appt?: string;
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
    c1_med_id?: number | null;
    c2_med_id?: number | null;
    reliever_med_id?: number | null;
}

export interface DRP {
    id: string;
    hn: string;
    date?: string; // backwards compatibility
    created_date?: string;
    visit_date: string;
    category: string;
    type: string;
    cause: string;
    intervention: string;
    outcome: string;
    note: string;
    created_at?: string;
    status: 'open' | 'resolved' | 'failed';
    created_by?: string | null;
    updated_at?: string;
    updated_by?: string | null;
    closed_at?: string | null;
    closed_by?: string | null;
}

export interface DrpWithPatient extends DRP {
    patient_name?: string;
    patient_prefix?: string;
}

export interface DrpHistoryEntry {
    id: number;
    drp_id: string;
    action_type: 'CREATE' | 'UPDATE' | 'CLOSE' | 'REOPEN' | 'DELETE';
    changed_by: string;
    changed_at: string;
    changes: {
        snapshot?: Record<string, any>;
        fields?: Array<{ field: string; old: any; new: any }>;
        close_reason?: 'resolved' | 'failed';
    };
}

export interface DrpCategoryConfig {
    id: number;
    code: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
    types?: DrpTypeConfig[];
}

export interface DrpTypeConfig {
    id: number;
    category_id: number;
    code: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
    causes?: DrpCauseConfig[];
}

export interface DrpCauseConfig {
    id: number;
    type_id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
}

export interface DrpInterventionConfig {
    id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
}

export interface DrpOutcomeConfig {
    id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at?: string;
}

