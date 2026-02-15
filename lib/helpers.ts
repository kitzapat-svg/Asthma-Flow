import { Patient, VisitDisplay, InhalerStatus } from './types';

export const normalizeHN = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim().replace(/^0+/, '');
};

export const getAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }
    return age;
};

export const calculatePredictedPEFR = (p: Pick<Patient, 'height' | 'prefix' | 'dob'>): number => {
    const age = getAge(p.dob);
    const height = parseFloat(p.height || "0");
    if (height === 0) return 0;
    let predicted = 0;
    if (["นาย", "ด.ช."].includes(p.prefix)) {
        predicted = (5.48 * height) - (1.51 * age) - 279.7;
    } else {
        predicted = (3.72 * height) - (2.24 * age) - 96.6;
    }
    return Math.max(0, Math.round(predicted));
};

export const getStatusStyle = (status: string): string => {
    if (status === 'Active') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    if (status === 'COPD') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
};

export const getInhalerStatus = (visitHistory: VisitDisplay[]): InhalerStatus => {
    const lastReview = [...visitHistory].reverse().find(v => v.technique_check === 'ทำ');
    if (!lastReview) return { status: 'never', days: 0, lastDate: null };

    const lastDate = new Date(lastReview.fullDate);
    const nextDate = new Date(lastDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays), lastDate };
    return { status: 'ok', days: diffDays, lastDate };
};

export const blindName = (name: string): string => {
    if (!name) return "";
    // Show first character, then mask the rest with ***
    // Example: "Somchai" -> "S******"
    const firstChar = name.charAt(0);
    return `${firstChar}******`;
};
