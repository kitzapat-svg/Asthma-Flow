// lib/db.ts
import { supabase, supabaseAdmin } from './supabase';
import { normalizeHN } from './helpers';
import { Patient, Medication } from './types';

// --- Patient Functions ---

export async function getPatients() {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('hn', { ascending: true });
    if (error) throw error;
    return data;
}

export async function getPatientByHN(hn: string) {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('hn', normalizeHN(hn))
        .single();
    if (error) return null;
    return data;
}

export async function getPatientByToken(token: string) {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('public_token', token)
        .single();
    if (error) return null;
    return data;
}

export async function getAdvice(hn: string) {
    const { data, error } = await supabase
        .from('staff_advice')
        .select('*')
        .eq('hn', normalizeHN(hn))
        .order('date', { ascending: false });
    if (error) return [];
    return data;
}

export async function updatePatientStatus(hn: string, status: string) {
    const { error } = await supabase
        .from('patients')
        .update({ status })
        .eq('hn', normalizeHN(hn));
    return { success: !error, error };
}

export async function updatePatientData(hn: string, data: any) {
    // data can be array (from sheets refactor) or object
    // If array: [HN, Prefix, First, Last, DOB, PEFR, Height, Status, Token, Phone]
    let payload = data;
    if (Array.isArray(data)) {
        payload = {
            hn: normalizeHN(data[0]),
            prefix: data[1],
            first_name: data[2],
            last_name: data[3],
            dob: data[4] || null,
            best_pefr: parseInt(data[5]) || 0,
            height: parseFloat(data[6]) || 0,
            status: data[7],
            public_token: data[8],
            phone: data[9]
        };
    }
    const { error } = await supabase
        .from('patients')
        .update(payload)
        .eq('hn', normalizeHN(hn));
    return { success: !error, error };
}

export async function createPatientData(data: any[]) {
    const payload = {
        hn: normalizeHN(data[0]),
        prefix: data[1],
        first_name: data[2],
        last_name: data[3],
        dob: data[4] || null,
        best_pefr: parseInt(data[5]) || 0,
        height: parseFloat(data[6]) || 0,
        status: data[7],
        public_token: data[8],
        phone: data[9]
    };
    const { error } = await supabase
        .from('patients')
        .insert(payload);
    return { success: !error, error };
}

// --- Visit Functions ---

export async function saveVisit(data: any[]) {
    // Array: [HN, Date, PEFR, Level, Controller, Reliever, Adherence, DRP, Advice, Technique, NextAppt, Note, NewCase, InhalerScore]
    const payload = {
        hn: normalizeHN(data[0]),
        visit_date: data[1],
        pefr: parseInt(data[2]) || 0,
        control_level: data[3],
        controller: data[4],
        reliever: data[5],
        adherence: data[6],
        drp: data[7],
        advice: data[8],
        technique_check: data[9],
        next_appt: data[10] || null,
        note: data[11],
        is_new_case: data[12] === 'TRUE' || data[12] === true,
        inhaler_score: parseInt(data[13]) || 0
    };
    const { error } = await supabase.from('visits').insert(payload);
    return { success: !error, error };
}

export async function getVisitHistory(hn: string) {
    const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('hn', normalizeHN(hn))
        .order('visit_date', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getAllVisits() {
    const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('visit_date', { ascending: false });
    if (error) return [];
    return data;
}

export async function getAllDrps() {
    const { data, error } = await supabase
        .from('drps')
        .select('*')
        .order('created_date', { ascending: false });
    if (error) return [];
    return data;
}

export async function getDrpsByHN(hn: string) {
    const { data, error } = await supabase
        .from('drps')
        .select('*')
        .eq('hn', normalizeHN(hn))
        .order('created_date', { ascending: false });
    if (error) return [];
    return data;
}

export async function getAllTechniqueChecks() {
    const { data, error } = await supabase
        .from('technique_checks')
        .select('*')
        .order('date', { ascending: false });
    if (error) return [];
    return data;
}

export async function getTechniqueChecksByHN(hn: string) {
    const { data, error } = await supabase
        .from('technique_checks')
        .select('*')
        .eq('hn', normalizeHN(hn))
        .order('date', { ascending: false });
    if (error) return [];
    return data;
}

export async function saveTechniqueCheck(data: any[]) {
    const payload = {
        hn: normalizeHN(data[0]),
        date: data[1],
        step1: data[2], step2: data[3], step3: data[4], step4: data[5],
        step5: data[6], step6: data[7], step7: data[8], step8: data[9],
        score: parseInt(data[10]) || 0,
        note: data[11]
    };
    const { error } = await supabase.from('technique_checks').insert(payload);
    return { success: !error, error };
}

// --- DRP Functions ---

export async function saveDRP(data: any[]) {
    // Array: [ID, HN, CreatedDate, VisitDate, Cat, Type, Cause, Int, Out, Note]
    const payload = {
        id: data[0],
        hn: normalizeHN(data[1]),
        created_date: data[2],
        visit_date: data[3],
        category: data[4],
        type: data[5],
        cause: data[6],
        intervention: data[7],
        outcome: data[8],
        note: data[9]
    };
    const { error } = await supabase.from('drps').insert(payload);
    return { success: !error, error };
}

export async function updateDRP(id: string, updatedData: any) {
    const { error } = await supabase
        .from('drps')
        .update({
            intervention: updatedData.intervention,
            outcome: updatedData.outcome,
            note: updatedData.note || '-'
        })
        .eq('id', id);
    return { success: !error, error };
}

// --- Medication Functions ---

export async function saveMedication(data: any[]) {
    const payload = {
        hn: normalizeHN(data[0]),
        date: data[1],
        c1_name: data[2],
        c1_puffs: data[3],
        c1_freq: data[4],
        c2_name: data[5],
        c2_puffs: data[6],
        c2_freq: data[7],
        reliever_name: data[8],
        reliever_label: data[9],
        note: data[10]
    };
    const { error } = await supabase.from('medications').insert(payload);
    return { success: !error, error };
}

export async function getLatestMedication(hn: string): Promise<Medication | null> {
    const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('hn', normalizeHN(hn))
        .order('date', { ascending: false })
        .limit(1)
        .single();
    if (error) return null;
    return data as any;
}

// --- Medication List Functions ---

export interface MedicationListItem {
    name: string;
    generic_name: string;
    type: 'Controller' | 'Reliever';
}

export async function getMedicationList() {
    const { data, error } = await supabase.from('medication_list').select('*');
    if (error) throw error;

    // Full objects for management UI
    const controllerItems: MedicationListItem[] = data
        .filter((r: any) => r.type === 'Controller')
        .map((r: any) => ({ name: r.name, generic_name: r.generic_name || '', type: 'Controller' as const }));
    const relieverItems: MedicationListItem[] = data
        .filter((r: any) => r.type === 'Reliever')
        .map((r: any) => ({ name: r.name, generic_name: r.generic_name || '', type: 'Reliever' as const }));

    // Backward-compatible string arrays for dropdowns
    const controllers = controllerItems.map(r => r.name);
    const relievers = relieverItems.map(r => r.name);

    return { controllers, relievers, controllerItems, relieverItems };
}

export async function addMedicationItem(type: 'Controller' | 'Reliever', name: string, generic_name?: string) {
    const { error } = await supabase.from('medication_list').insert({ type, name, generic_name: generic_name || '' });
    return { success: !error, error };
}

export async function updateMedicationItem(oldName: string, newName: string, generic_name?: string) {
    const payload: Record<string, string> = { name: newName };
    if (generic_name !== undefined) payload.generic_name = generic_name;
    const { error } = await supabase.from('medication_list').update(payload).eq('name', oldName);
    return { success: !error, error };
}

export async function deleteMedicationItem(name: string) {
    const { error } = await supabase.from('medication_list').delete().eq('name', name);
    return { success: !error, error };
}

// --- User Functions ---

export async function getUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
}

export async function getUserByUsername(username: string) {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
    if (error) return null;
    return data;
}

export async function createUser(user: any[]) {
    // [username, password_hash, role, name, email, position]
    const payload = {
        username: user[0],
        password_hash: user[1],
        role: user[2],
        name: user[3],
        email: user[4],
        position: user[5]
    };
    const { error } = await supabase.from('users').insert(payload);
    return { success: !error, error };
}

export async function updateUser(username: string, data: any[]) {
    const payload = {
        password_hash: data[1],
        role: data[2],
        name: data[3],
        email: data[4],
        position: data[5]
    };
    const { error } = await supabase.from('users').update(payload).eq('username', username);
    return { success: !error, error };
}

export async function deleteUser(username: string) {
    const { error } = await supabase.from('users').delete().eq('username', username);
    return { success: !error, error };
}

// --- Advice Functions ---

export async function updateAdvice(hn: string, staffUsername: string, date: string, advice: string) {
    const { error } = await supabase
        .from('staff_advice')
        .update({ advice })
        .match({ hn: normalizeHN(hn), staff_username: staffUsername, date });
    return { success: !error, error };
}

export async function deleteAdvice(hn: string, staffUsername: string, date: string) {
    const { error } = await supabase
        .from('staff_advice')
        .delete()
        .match({ hn: normalizeHN(hn), staff_username: staffUsername, date });
    return { success: !error, error };
}

import { logAudit } from './logger';

// --- Logging ---

export async function logActivity(email: string, action: string, details: string) {
    // Map legacy parameters to new AuditLogEntry structure
    await logAudit({
        action_type: (action.toUpperCase() as any) || 'UPDATE',
        module: 'SYSTEM',
        actor_id: email,
        payload: { details }
    });
    return { success: true };
}

// --- Generic Row Updates & Deletes ---

export async function updateRowByHnAndDate(tabName: string, hn: string, date: string, data: any[]) {
    const normalizedHn = normalizeHN(hn);
    let error;

    if (tabName === 'visits') {
        const payload = {
            visit_date: data[1], // Allow date update
            pefr: parseInt(data[2]) || 0,
            control_level: data[3],
            controller: data[4],
            reliever: data[5],
            adherence: data[6],
            drp: data[7],
            advice: data[8],
            technique_check: data[9],
            next_appt: data[10] || null,
            note: data[11],
            is_new_case: data[12] === 'TRUE' || data[12] === true,
            inhaler_score: parseInt(data[13]) || 0
        };
        const res = await supabase.from('visits').update(payload).match({ hn: normalizedHn, visit_date: date });
        error = res.error;
    } else if (tabName === 'medications') {
        const payload = {
            date: data[1], // Allow date update
            c1_name: data[2],
            c1_puffs: data[3],
            c1_freq: data[4],
            c2_name: data[5],
            c2_puffs: data[6],
            c2_freq: data[7],
            reliever_name: data[8],
            reliever_label: data[9],
            note: data[10]
        };
        const res = await supabase.from('medications').update(payload).match({ hn: normalizedHn, date });
        error = res.error;
    } else if (tabName === 'technique_checks') {
        const payload = {
            step1: data[2], step2: data[3], step3: data[4], step4: data[5],
            step5: data[6], step6: data[7], step7: data[8], step8: data[9],
            score: parseInt(data[10]) || 0,
            note: data[11]
        };
        
        // Check if existing record exists for this date
        const { data: existing } = await supabase.from('technique_checks').select('id').match({ hn: normalizedHn, date }).maybeSingle();
        
        if (existing) {
            // Update existing record, also updating date if needed
            const res = await supabase.from('technique_checks').update({
                date: data[1], // Update date
                ...payload
            }).match({ hn: normalizedHn, date });
            error = res.error;
        } else {
            // Create new record for the NEW date (data[1])
            const res = await supabase.from('technique_checks').insert({
                hn: normalizedHn,
                date: data[1], 
                ...payload
            });
            error = res.error;
        }
    }

    return { success: !error, error };
}

export async function deleteRow(tabName: string, hn: string) {
    const { error } = await supabase.from(tabName).delete().eq('hn', normalizeHN(hn));
    return { success: !error, error };
}

export async function deleteAllRowsByHn(tabName: string, hn: string) {
    const { error } = await supabase.from(tabName).delete().eq('hn', normalizeHN(hn));
    return { success: !error, error };
}

export async function deleteAllRowsByHnAndDate(tabName: string, hn: string, date: string) {
    const normalizedHn = normalizeHN(hn);
    let column = (tabName === 'visits') ? 'visit_date' : 'date';
    if (tabName === 'drps') column = 'visit_date'; // DRPs use visit_date for matching visit deletion
    
    const { error } = await supabase.from(tabName).delete().match({ hn: normalizedHn, [column]: date });
    return { success: !error, error };
}
