import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase Environment Variables in .env.local!");
    console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    process.exit(1);
}

// Setup Supabase (Using Service Role for Migration)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Setup Google Sheets
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const normalizeHN = (val) => {
    if (val === null || val === undefined) return '';
    const cleaned = String(val).trim().replace(/^0+/, '');
    if (cleaned === '') return '';
    return cleaned.padStart(7, '0');
};

const safeDate = (val) => {
    if (!val || String(val).trim() === "" || String(val).trim() === "-") return null;
    const str = String(val).trim();
    // If it's just a number like "500", it's not a valid date for our DB
    if (/^\d+$/.test(str) && str.length < 8) return null; 
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : str;
};

async function getSheetData(tabName) {
    console.log(`Fetching ${tabName}...`);
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${tabName}!A:Z`,
    });
    const rows = res.data.values;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
            const key = h.toLowerCase().trim().replace(/ /g, '_');
            obj[key] = row[i] || "";
        });
        return obj;
    });
}

// Map headers for specific tables if they don't match 1:1
const formatters = {
    patients: (r) => ({
        hn: normalizeHN(r.hn),
        prefix: r.prefix,
        first_name: r.first_name,
        last_name: r.last_name,
        dob: safeDate(r.dob),
        best_pefr: parseInt(r.best_pefr) || 0,
        height: parseFloat(r.height) || 0,
        status: r.status || 'Active',
        public_token: r.public_token,
        phone: r.phone
    }),
    visits: (r) => ({
        hn: normalizeHN(r.hn),
        visit_date: safeDate(r.date || r.visit_date),
        pefr: parseInt(r.pefr) || 0,
        control_level: r.control_level,
        controller: r.controller,
        reliever: r.reliever,
        adherence: r.adherence,
        drp: r.drp,
        advice: r.advice,
        technique_check: r.technique_check,
        next_appt: safeDate(r.next_appt),
        note: r.note,
        is_new_case: String(r.is_new_case).toUpperCase() === 'TRUE',
        inhaler_score: parseInt(r.inhaler_score) || 0
    }),
    drps: (r) => ({
        id: r.id,
        hn: normalizeHN(r.hn),
        created_date: safeDate(r.date || r.created_date),
        visit_date: safeDate(r.visit_date),
        category: r.category,
        type: r.type,
        cause: r.cause,
        intervention: r.intervention,
        outcome: r.outcome,
        note: r.note
    }),
    medications: (r) => ({
        hn: normalizeHN(r.hn),
        date: safeDate(r.date),
        c1_name: r.c1_name,
        c1_puffs: r.c1_puffs,
        c1_freq: r.c1_freq,
        c2_name: r.c2_name,
        c2_puffs: r.c2_puffs,
        c2_freq: r.c2_freq,
        reliever_name: r.reliever_name,
        reliever_label: r.reliever_label,
        note: r.note
    }),
    technique_checks: (r) => ({
        hn: normalizeHN(r.hn),
        date: safeDate(r.date),
        step1: r.step_1 || r.step1 || "0",
        step2: r.step_2 || r.step2 || "0",
        step3: r.step_3 || r.step3 || "0",
        step4: r.step_4 || r.step4 || "0",
        step5: r.step_5 || r.step5 || "0",
        step6: r.step_6 || r.step6 || "0",
        step7: r.step_7 || r.step7 || "0",
        step8: r.step_8 || r.step8 || "0",
        score: parseInt(r.score || r.total_score) || 0,
        note: r.note
    }),
    users: (r) => ({
        username: r.username,
        password_hash: r.password_hash,
        role: r.role || 'Staff',
        name: r.name,
        email: r.email,
        position: r.position
    }),
    medication_list: (r) => ({
        type: r.type,
        name: r.name
    }),
    staff_advice: (r) => ({
        hn: normalizeHN(r.hn),
        staff_username: r.staff_username,
        staff_name: r.staff_name,
        staff_position: r.staff_position,
        advice: r.advice,
        date: safeDate(r.date)
    }),
    logs: (r) => ({
        timestamp: safeDate(r.timestamp),
        email: r.email,
        action: r.action,
        details: r.details
    })
};

async function migrateTable(tabName, supabaseTable, formatter, validHns = null) {
    try {
        const data = await getSheetData(tabName);
        if (data.length === 0) {
            console.log(`No data for ${tabName}. Skipping.`);
            return;
        }

        const formatted = data.map(formatter).filter(row => {
            if (['patients', 'visits', 'drps', 'medications', 'technique_checks', 'staff_advice'].includes(supabaseTable)) {
                if (!row.hn) return false;
                if (validHns && supabaseTable !== 'patients' && !validHns.has(row.hn)) {
                    return false;
                }
                return true;
            }
            return true;
        });

        if (formatted.length === 0) {
            console.log(`No valid rows to migrate for ${tabName}. Skipping.`);
            return;
        }

        // --- NEW: Clear existing data in this table first to avoid duplicates ---
        console.log(`Clearing existing data in ${supabaseTable}...`);
        if (supabaseTable === 'users') {
            await supabase.from(supabaseTable).delete().neq('username', '');
        } else if (supabaseTable === 'medication_list') {
            await supabase.from(supabaseTable).delete().neq('id', 0);
        } else if (supabaseTable === 'logs') {
            await supabase.from(supabaseTable).delete().neq('email', 'null');
        } else {
            // Tables with HN
            await supabase.from(supabaseTable).delete().neq('hn', 'null');
        }

        console.log(`Upserting ${formatted.length} rows into ${supabaseTable}...`);
        const { error } = await supabase.from(supabaseTable).upsert(formatted);
        if (error) throw error;
        console.log(`Successfully migrated ${tabName} to ${supabaseTable}.`);
    } catch (error) {
        console.error(`Error migrating ${tabName}:`, error.message);
    }
}

async function run() {
    console.log("Starting Migration (with Auto-Clear)...");

    // --- 1. Clear Dependent Tables First (to avoid FK issues when clearing Patients) ---
    console.log("Preparing database (clearing dependent tables)...");
    await supabase.from('visits').delete().neq('hn', 'null');
    await supabase.from('medications').delete().neq('hn', 'null');
    await supabase.from('drps').delete().neq('hn', 'null');
    await supabase.from('technique_checks').delete().neq('hn', 'null');
    await supabase.from('staff_advice').delete().neq('hn', 'null');

    // --- 2. Migrate Patients ---
    await migrateTable('patients', 'patients', formatters.patients);
    
    // Fetch valid HNs
    const { data: patientRows, error: fetchError } = await supabase.from('patients').select('hn');
    if (fetchError) {
        console.error("Critical Error: Could not fetch migrated HNs.");
        return;
    }
    const validHns = new Set(patientRows.map(p => p.hn));

    // --- 3. Migrate Others ---
    await migrateTable('users', 'users', formatters.users);
    await migrateTable('medication_list', 'medication_list', formatters.medication_list);
    await migrateTable('visits', 'visits', formatters.visits, validHns);
    await migrateTable('drps', 'drps', formatters.drps, validHns);
    await migrateTable('medications', 'medications', formatters.medications, validHns);
    await migrateTable('technique_checks', 'technique_checks', formatters.technique_checks, validHns);
    await migrateTable('staff_advice', 'staff_advice', formatters.staff_advice, validHns);
    await migrateTable('logs', 'logs', formatters.logs);

    console.log("Migration Complete!");
}

run();
