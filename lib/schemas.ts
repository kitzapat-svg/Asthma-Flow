import * as z from 'zod';

// --- Form Schemas (Frontend Input) ---

export const registerSchema = z.object({
    hn: z.string().min(1, "กรุณากรอก HN").regex(/^\d+$/, "HN ต้องเป็นตัวเลขเท่านั้น"),
    prefix: z.string(),
    first_name: z.string().min(1, "กรุณากรอกชื่อจริง"),
    last_name: z.string().min(1, "กรุณากรอกนามสกุล"),
    dob: z.string().refine((date) => date !== "", "กรุณาระบุวันเกิด"),
    height: z.string().min(1, "กรุณาระบุส่วนสูง").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "ส่วนสูงต้องเป็นตัวเลข"),
    phone: z.string().regex(/^0\d{9}$/, "เบอร์โทรต้องเป็นตัวเลข 10 หลัก (เช่น 0812345678)").optional().or(z.literal('')),
    status: z.string(),
});

export const visitSchema = z.object({
    pefr: z.string().optional(),
    control_level: z.string(),
    controller: z.string(),
    reliever: z.string(),
    adherence: z.string(),
    drp: z.string(),
    advice: z.string(),
    technique_check: z.string(),
    technique_note: z.string().optional(),
    next_appt: z.string().optional(),
    note: z.string().optional(),
    is_new_case: z.boolean(),
    is_relative_pickup: z.boolean(),
    no_pefr: z.boolean(),
}).superRefine((data, ctx) => {
    if (!data.no_pefr) {
        if (!data.pefr || data.pefr.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "กรุณากรอกค่า PEFR หรือติ๊ก 'ไม่ได้เป่า'",
                path: ["pefr"],
            });
        } else if (Number(data.pefr) < 0 || Number(data.pefr) > 900) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "ค่า PEFR ไม่ถูกต้อง (0-900)",
                path: ["pefr"],
            });
        }
    }
});

// --- Database Row Schemas (Backend Array Validation) ---

export const patientRowSchema = z.tuple([
    z.string(), // 0: HN
    z.string(), // 1: Prefix
    z.string(), // 2: First Name
    z.string(), // 3: Last Name
    z.string(), // 4: DOB
    z.string(), // 5: Predicted PEFR
    z.string(), // 6: Height
    z.string(), // 7: Status
    z.string(), // 8: Token
    z.string(), // 9: Phone
]);

export const visitRowSchema = z.tuple([
    z.string(), // 0: HN
    z.string(), // 1: Date
    z.string(), // 2: PEFR
    z.string(), // 3: Control Level
    z.string(), // 4: Controller
    z.string(), // 5: Reliever
    z.string(), // 6: Adherence
    z.string(), // 7: DRP
    z.string(), // 8: Advice
    z.string(), // 9: Technique Check
    z.string(), // 10: Next Appt
    z.string(), // 11: Note
    z.enum(['TRUE', 'FALSE']), // 12: Is New Case
    z.string(), // 13: Inhaler Score
]);

export const techniqueCheckRowSchema = z.tuple([
    z.string(), // 0: HN
    z.string(), // 1: Date
    z.string(), // 2-9: Steps (0/1) - We can validate length or just rely on spread
    z.string(), // ...
    z.string(), // ...
    z.string(), // ...
    z.string(), // ...
    z.string(), // ...
    z.string(), // ...
    z.string(), // ...
    z.string(), // Total Score
    z.string(), // Note
]).rest(z.string()); // Allow variable length if needed but basically it's fixed length usually.
// Technique checks row is: HN, Date, 8 steps, score, note = 12 columns.
// Let's match exact length if possible or use loose validation for steps.
// checklistData = [params.hn, today, ...checklist.map(c => c ? "1" : "0"), totalScore.toString(), note];
// 2 + 8 + 2 = 12 items.

export const strictTechniqueCheckRowSchema = z.tuple([
    z.string(), // HN
    z.string(), // Date
    z.string(), // Step 1
    z.string(), // Step 2
    z.string(), // Step 3
    z.string(), // Step 4
    z.string(), // Step 5
    z.string(), // Step 6
    z.string(), // Step 7
    z.string(), // Step 8
    z.string(), // Score
    z.string(), // Note
]);
