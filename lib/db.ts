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
        inhaler_score: parseInt(data[13]) || 0,
        predicted_pefr: data[14] ?? 0,
        pefr_percent_predicted: data[15] ?? 0
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

export async function saveDRP(data: any[], username: string | null = 'System') {
    // Array: [ID, HN, CreatedDate, VisitDate, Cat, Type, Cause, Int, Out, Note]
    const outcome = data[8] || '-';
    // Logic: Set status = 'resolved' if outcome contains Resolved or สำเร็จ; otherwise 'open'
    const status = (outcome.includes('Resolved') || outcome.includes('สำเร็จ')) ? 'resolved' : 'open';
    
    const payload = {
        id: data[0],
        hn: normalizeHN(data[1]),
        created_date: data[2],
        visit_date: data[3],
        category: data[4],
        type: data[5],
        cause: data[6],
        intervention: data[7],
        outcome: outcome,
        note: data[9] || '-',
        status: status,
        created_by: username,
        updated_by: username,
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('drps').insert(payload);
    if (!error) {
        // Log to drp_history
        await supabase.from('drp_history').insert({
            drp_id: payload.id,
            action_type: 'CREATE',
            changed_by: username || 'System',
            changes: { snapshot: payload }
        });
    }
    return { success: !error, error };
}

export async function saveDRPObject(drp: any, username: string | null = 'System') {
    const outcome = drp.outcome || '-';
    const status = (outcome.includes('Resolved') || outcome.includes('สำเร็จ')) ? 'resolved' : 'open';
    
    const payload = {
        id: drp.id,
        hn: normalizeHN(drp.hn),
        created_date: drp.created_date || new Date().toISOString(),
        visit_date: drp.visit_date || null,
        category: drp.category,
        type: drp.type,
        cause: drp.cause,
        intervention: drp.intervention,
        outcome: outcome,
        note: drp.note || '-',
        status: status,
        created_by: username,
        updated_by: username,
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('drps').insert(payload);
    if (!error) {
        // Log to drp_history
        await supabase.from('drp_history').insert({
            drp_id: payload.id,
            action_type: 'CREATE',
            changed_by: username || 'System',
            changes: { snapshot: payload }
        });
    }
    return { success: !error, error };
}

export async function updateDRP(id: string, updatedData: any, username: string | null = 'System') {
    // 1. Fetch current DRP to detect changes
    const { data: current, error: fetchErr } = await supabase
        .from('drps')
        .select('*')
        .eq('id', id)
        .single();
        
    if (fetchErr || !current) {
        return { success: false, error: fetchErr || new Error('DRP not found') };
    }

    // Determine status from updated outcome or direct status field
    let status = current.status;
    const outcome = updatedData.outcome !== undefined ? updatedData.outcome : current.outcome;
    
    if (updatedData.status !== undefined) {
        status = updatedData.status;
    } else if (updatedData.outcome !== undefined) {
        if (outcome.includes('Resolved') || outcome.includes('สำเร็จ')) {
            status = 'resolved';
        } else if (outcome.includes('ไม่สำเร็จ')) {
            status = 'failed';
        } else {
            status = 'open';
        }
    }

    const payload: any = {
        updated_by: username,
        updated_at: new Date().toISOString()
    };

    if (updatedData.category !== undefined) payload.category = updatedData.category;
    if (updatedData.type !== undefined) payload.type = updatedData.type;
    if (updatedData.cause !== undefined) payload.cause = updatedData.cause;
    if (updatedData.intervention !== undefined) payload.intervention = updatedData.intervention;
    if (updatedData.outcome !== undefined) payload.outcome = updatedData.outcome;
    if (updatedData.note !== undefined) payload.note = updatedData.note;
    if (updatedData.visit_date !== undefined) payload.visit_date = updatedData.visit_date || null;
    payload.status = status;

    if (status !== current.status) {
        if (status === 'resolved' || status === 'failed') {
            payload.closed_at = new Date().toISOString();
            payload.closed_by = username;
        } else {
            payload.closed_at = null;
            payload.closed_by = null;
        }
    }

    const { error } = await supabase
        .from('drps')
        .update(payload)
        .eq('id', id);

    if (!error) {
        // Calculate fields that changed
        const fieldsChanged: any[] = [];
        const trackFields = ['category', 'type', 'cause', 'intervention', 'outcome', 'note', 'status', 'visit_date'];
        
        trackFields.forEach(f => {
            if (payload[f] !== undefined && payload[f] !== current[f]) {
                fieldsChanged.push({
                    field: f,
                    old: current[f],
                    new: payload[f]
                });
            }
        });

        // Log to history
        let actionType: 'UPDATE' | 'CLOSE' | 'REOPEN' = 'UPDATE';
        if (current.status === 'open' && (status === 'resolved' || status === 'failed')) {
            actionType = 'CLOSE';
        } else if ((current.status === 'resolved' || current.status === 'failed') && status === 'open') {
            actionType = 'REOPEN';
        }

        await supabase.from('drp_history').insert({
            drp_id: id,
            action_type: actionType,
            changed_by: username || 'System',
            changes: { fields: fieldsChanged }
        });
    }

    return { success: !error, error };
}

export async function deleteDRPById(id: string) {
    const { error } = await supabase
        .from('drps')
        .delete()
        .eq('id', id);
    return { success: !error, error };
}

export async function getDrpHistory(drpId: string) {
    const { data, error } = await supabase
        .from('drp_history')
        .select('*')
        .eq('drp_id', drpId)
        .order('changed_at', { ascending: false });
    if (error) return [];
    return data;
}

export async function getAllDrpsWithPatients() {
    const { data, error } = await supabase
        .from('drps')
        .select(`
            *,
            patients (
                first_name,
                last_name,
                prefix
            )
        `)
        .order('created_date', { ascending: false });
        
    if (error) throw error;
    
    // Map patient name into flat fields for compatibility
    return data.map((d: any) => ({
        ...d,
        patient_name: d.patients ? `${d.patients.first_name} ${d.patients.last_name}` : 'Unknown',
        patient_prefix: d.patients ? d.patients.prefix : ''
    }));
}

// --- DRP Dropdown Config Management Functions ---

export async function getDrpConfig() {
    const { data: categories, error: catErr } = await supabase
        .from('drp_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
    const { data: types, error: typeErr } = await supabase
        .from('drp_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
    const { data: causes, error: causeErr } = await supabase
        .from('drp_causes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    const { data: interventions, error: intErr } = await supabase
        .from('drp_interventions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    const { data: outcomes, error: outErr } = await supabase
        .from('drp_outcomes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (catErr || typeErr || causeErr || intErr || outErr) {
        throw new Error('Failed to fetch DRP config');
    }

    // Structure hierarchical categories -> types -> causes
    const structuredCategories = categories.map((cat: any) => {
        const catTypes = types
            .filter((t: any) => t.category_id === cat.id)
            .map((t: any) => {
                const typeCauses = causes
                    .filter((c: any) => c.type_id === t.id)
                    .map((c: any) => c.name);
                return {
                    id: t.code,
                    dbId: t.id,
                    name: t.name,
                    causes: typeCauses
                };
            });
        return {
            id: cat.code,
            dbId: cat.id,
            name: cat.name,
            types: catTypes
        };
    });

    return {
        categories: structuredCategories,
        interventions: interventions.map((i: any) => i.name),
        outcomes: outcomes.map((o: any) => o.name),
        raw: {
            categories,
            types,
            causes,
            interventions,
            outcomes
        }
    };
}

// Config CRUD helper functions
export async function addDrpCategory(code: string, name: string, sortOrder: number = 0) {
    const { error } = await supabase.from('drp_categories').insert({ code, name, sort_order: sortOrder });
    return { success: !error, error };
}

export async function updateDrpCategory(id: number, name: string) {
    const { error } = await supabase.from('drp_categories').update({ name }).eq('id', id);
    return { success: !error, error };
}

export async function deleteDrpCategory(id: number) {
    // Soft delete
    const { error } = await supabase.from('drp_categories').update({ is_active: false }).eq('id', id);
    return { success: !error, error };
}

export async function addDrpType(categoryId: number, code: string, name: string, sortOrder: number = 0) {
    const { error } = await supabase.from('drp_types').insert({ category_id: categoryId, code, name, sort_order: sortOrder });
    return { success: !error, error };
}

export async function updateDrpType(id: number, name: string) {
    const { error } = await supabase.from('drp_types').update({ name }).eq('id', id);
    return { success: !error, error };
}

export async function deleteDrpType(id: number) {
    const { error } = await supabase.from('drp_types').update({ is_active: false }).eq('id', id);
    return { success: !error, error };
}

export async function addDrpCause(typeId: number, name: string, sortOrder: number = 0) {
    const { error } = await supabase.from('drp_causes').insert({ type_id: typeId, name, sort_order: sortOrder });
    return { success: !error, error };
}

export async function updateDrpCause(id: number, name: string) {
    const { error } = await supabase.from('drp_causes').update({ name }).eq('id', id);
    return { success: !error, error };
}

export async function deleteDrpCause(id: number) {
    const { error } = await supabase.from('drp_causes').update({ is_active: false }).eq('id', id);
    return { success: !error, error };
}

export async function addDrpIntervention(name: string, sortOrder: number = 0) {
    const { error } = await supabase.from('drp_interventions').insert({ name, sort_order: sortOrder });
    return { success: !error, error };
}

export async function updateDrpIntervention(id: number, name: string) {
    const { error } = await supabase.from('drp_interventions').update({ name }).eq('id', id);
    return { success: !error, error };
}

export async function deleteDrpIntervention(id: number) {
    const { error } = await supabase.from('drp_interventions').update({ is_active: false }).eq('id', id);
    return { success: !error, error };
}

export async function addDrpOutcome(name: string, sortOrder: number = 0) {
    const { error } = await supabase.from('drp_outcomes').insert({ name, sort_order: sortOrder });
    return { success: !error, error };
}

export async function updateDrpOutcome(id: number, name: string) {
    const { error } = await supabase.from('drp_outcomes').update({ name }).eq('id', id);
    return { success: !error, error };
}

export async function deleteDrpOutcome(id: number) {
    const { error } = await supabase.from('drp_outcomes').update({ is_active: false }).eq('id', id);
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
        note: data[10],
        c1_med_id: data[11] !== undefined ? data[11] : null,
        c2_med_id: data[12] !== undefined ? data[12] : null,
        reliever_med_id: data[13] !== undefined ? data[13] : null
    };
    const { error } = await supabase.from('medications').insert(payload);
    return { success: !error, error };
}

export async function getLatestMedication(hn: string): Promise<Medication | null> {
    const { data, error } = await supabase
        .from('medications')
        .select(`
            *,
            c1_med:medication_list!c1_med_id(name),
            c2_med:medication_list!c2_med_id(name),
            reliever_med:medication_list!reliever_med_id(name)
        `)
        .eq('hn', normalizeHN(hn))
        .order('date', { ascending: false })
        .limit(1);
    if (error || !data || data.length === 0) return null;
    
    const row = data[0] as any;
    return {
        ...row,
        c1_name: row.c1_med?.name || row.c1_name,
        c2_name: row.c2_med?.name || row.c2_name,
        reliever_name: row.reliever_med?.name || row.reliever_name
    } as Medication;
}

export async function getMedicationByDate(hn: string, date: string): Promise<Medication | null> {
    const { data, error } = await supabase
        .from('medications')
        .select(`
            *,
            c1_med:medication_list!c1_med_id(name),
            c2_med:medication_list!c2_med_id(name),
            reliever_med:medication_list!reliever_med_id(name)
        `)
        .eq('hn', normalizeHN(hn))
        .eq('date', date)
        .limit(1);
    if (error || !data || data.length === 0) return null;
    
    const row = data[0] as any;
    return {
        ...row,
        c1_name: row.c1_med?.name || row.c1_name,
        c2_name: row.c2_med?.name || row.c2_name,
        reliever_name: row.reliever_med?.name || row.reliever_name
    } as Medication;
}

// --- Medication List Functions ---

export interface MedicationListItem {
    id: number;
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
        .map((r: any) => ({ id: r.id, name: r.name, generic_name: r.generic_name || '', type: 'Controller' as const }));
    const relieverItems: MedicationListItem[] = data
        .filter((r: any) => r.type === 'Reliever')
        .map((r: any) => ({ id: r.id, name: r.name, generic_name: r.generic_name || '', type: 'Reliever' as const }));

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
            inhaler_score: parseInt(data[13]) || 0,
            predicted_pefr: data[14] ?? 0,
            pefr_percent_predicted: data[15] ?? 0
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
            note: data[10],
            c1_med_id: data[11] !== undefined ? data[11] : null,
            c2_med_id: data[12] !== undefined ? data[12] : null,
            reliever_med_id: data[13] !== undefined ? data[13] : null
        };
        const { data: existing } = await supabase.from('medications').select('hn').match({ hn: normalizedHn, date: date }).limit(1);
        if (existing && existing.length > 0) {
            const res = await supabase.from('medications').update(payload).match({ hn: normalizedHn, date: date });
            error = res.error;
        } else {
            const res = await supabase.from('medications').insert({ hn: normalizedHn, ...payload });
            error = res.error;
        }
    } else if (tabName === 'technique_checks') {
        const payload = {
            step1: data[2], step2: data[3], step3: data[4], step4: data[5],
            step5: data[6], step6: data[7], step7: data[8], step8: data[9],
            score: parseInt(data[10]) || 0,
            note: data[11]
        };
        
        // Check if existing record exists for this date
        const { data: existing } = await supabase.from('technique_checks').select('id').match({ hn: normalizedHn, date }).limit(1);
        
        if (existing && existing.length > 0) {
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
