import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { 
  getPatients, 
  getVisitHistory,
  getAllVisits,
  getAllDrps,
  getDrpsByHN,
  getAllTechniqueChecks,
  getTechniqueChecksByHN,
  getLatestMedication, 
  saveVisit, 
  saveMedication, 
  saveDRP, 
  updateDRP, 
  updatePatientStatus, 
  updatePatientData, 
  createPatientData,
  updateRowByHnAndDate, 
  deleteRow,
  deleteAllRowsByHn,
  deleteAllRowsByHnAndDate,
  getMedicationList,
  getPatientByHN,
  getUserByUsername,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateAdvice,
  deleteAdvice
} from '@/lib/db';
import { logAudit } from '@/lib/logger';
import { normalizeHN } from '@/lib/helpers';
import { hashPassword } from '@/lib/auth';
import { getBangkokISOString } from '@/lib/date-utils';

const SHEET_CONFIG = {
  PATIENTS_TAB: 'patients',
  VISITS_TAB: 'visits',
  TECHNIQUE_TAB: 'technique_checks',
  USERS_TAB: 'users',
  MEDICATIONS_TAB: 'medications',
  DRP_TAB: 'drps',
  ADVICE_TAB: 'staff_advice',
};

// --- GET ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const hn = searchParams.get('hn'); 

    if (type === 'users') {
      const currentUserRole = (session.user as any).role;
      const currentUserId = (session.user as any).id; 

      const users: any[] = await getUsers();
      let safeUsers = users.map((u: any) => ({
        username: u.username,
        role: u.role,
        name: u.name,
        email: u.email,
        position: u.position,
      }));

      if (currentUserRole !== 'Admin') {
        safeUsers = safeUsers.filter(u => u.username === currentUserId);
      }
      return NextResponse.json(safeUsers);
    }

    if (type === 'medications') {
      if (!hn) return NextResponse.json({ error: "Missing HN" }, { status: 400 });
      const med = await getLatestMedication(hn);
      return NextResponse.json(med || {}); 
    }

    if (type === 'medication_list') {
      const list = await getMedicationList();
      return NextResponse.json(list);
    }

    if (type === 'patients') {
        if (hn) {
            const patient = await getPatientByHN(hn);
            return NextResponse.json(patient ? [patient] : []); // Return as array for compatibility
        }
        const patients = await getPatients();
        return NextResponse.json(patients);
    }

    if (type === 'visits') {
        // If HN provided → single patient's history; otherwise → all visits (for Dashboard)
        if (hn) {
            const visits = await getVisitHistory(hn);
            return NextResponse.json(visits);
        }
        const visits = await getAllVisits();
        return NextResponse.json(visits);
    }

    if (type === 'drps') {
        if (hn) {
            const drps = await getDrpsByHN(hn);
            return NextResponse.json(drps);
        }
        const drps = await getAllDrps();
        return NextResponse.json(drps);
    }

    if (type === 'technique_checks') {
        if (hn) {
            const checks = await getTechniqueChecksByHN(hn);
            return NextResponse.json(checks);
        }
        const checks = await getAllTechniqueChecks();
        return NextResponse.json(checks);
    }

    // Generic fallbacks for other types if needed, though they should be specific
    return NextResponse.json({ error: 'Invalid type or missing parameters' }, { status: 400 });

  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

import { patientRowSchema, visitRowSchema, strictTechniqueCheckRowSchema, drpRowSchema } from '@/lib/schemas';

// --- POST ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'users') {
      const currentUserRole = (session.user as any).role;
      if (currentUserRole !== 'Admin') {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      }

      const username = data[0]; 
      const plainPassword = data[1];
      const role = data[2];
      const name = data[3];
      const email = data[4];
      const position = data[5] || "";

      const hashedPassword = await hashPassword(plainPassword);
      const newUser = [username, hashedPassword, role, name, email, position];

      const result = await createUser(newUser);
      if (result.success) {
        await logAudit({
          action_type: 'CREATE',
          module: 'USER',
          actor_id: session.user?.email || "Unknown",
          payload: { username, role, name }
        });
        return NextResponse.json({ message: 'User created' });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    let result;
    if (type === 'patients') {
        const parse = patientRowSchema.safeParse(data);
        if (!parse.success) return NextResponse.json({ error: "Invalid Data Format" }, { status: 400 });
        // Patient "append" in sheets was actually "add new"
        // In DB we should use an insertPatient if it exists, or updatePatientData with upsert behavior? 
        // For now, assume it's a new patient. 
        // Sheets logic was simply `appendData`.
        // Let's use `updatePatientData` which I'll make sure handles insertion if I didn't.
        // Actually I'll use a new `createPatient` for clarity.
        // I need to add `createPatient` to `lib/db.ts` or just use `supabase.insert`.
        // Now using `createPatientData`.
        result = await createPatientData(data); 
    }
    else if (type === 'visits') {
      const parse = visitRowSchema.safeParse(data);
      if (!parse.success) return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
      result = await saveVisit(data);
    }
    else if (type === 'medications') {
      result = await saveMedication(data);
    }
    else if (type === 'drps') {
      const parse = drpRowSchema.safeParse(data);
      if (!parse.success) return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
      result = await saveDRP(data);
    }
    else if (type === 'advice') {
      const hn = data[0];
      const adviceText = data[1];
      const staffUsername = (session.user as any).id || '';
      const staffName = session.user?.name || staffUsername;
      
      let staffPosition = '';
      const user = await getUserByUsername(staffUsername);
      if (user) staffPosition = user.position || '';

      const now = getBangkokISOString();
      // adviceRow for DB: we need to handle staff_advice insert.
      // I'll add a helper for this in `lib/db.ts` or use supabase directly.
      // For now, let's keep it clean.
      const { supabase: sbAdmin } = await import('@/lib/supabase');
      const { error } = await sbAdmin.from('staff_advice').insert({
        hn: normalizeHN(hn),
        staff_username: staffUsername,
        staff_name: staffName,
        staff_position: staffPosition,
        advice: adviceText,
        date: now
      });
      result = { success: !error, error };
    }
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    if (result.success) {
      await logAudit({
        action_type: 'CREATE',
        module: type.toUpperCase() as any,
        actor_id: session.user?.email || "Unknown",
        target_hn: data[0],
        payload: { type }
      });
      return NextResponse.json({ message: 'Success' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

// --- PUT (Update) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, hn, status, data, username } = body; 

    if (type === 'users') {
      const targetUsername = username || data[0];
      const currentUserRole = (session.user as any).role;
      const currentUserId = (session.user as any).id; 

      if (currentUserRole !== 'Admin' && currentUserId !== targetUsername) {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      }

      const user = await getUserByUsername(targetUsername);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      if (currentUserRole !== 'Admin' && data[2] !== user.role) {
        return NextResponse.json({ error: "Access Denied: Role mismatch" }, { status: 403 });
      }

      const newPassword = data[1];
      let finalPasswordHash = user.password_hash;
      if (newPassword && newPassword.trim() !== '') {
        finalPasswordHash = await hashPassword(newPassword);
      }
      const updatedRow = [data[0], finalPasswordHash, data[2], data[3], data[4], data[5]];

      const result = await updateUser(targetUsername, updatedRow);
      if (result.success) {
        await logAudit({
          action_type: 'UPDATE',
          module: 'USER',
          actor_id: session.user?.email || "Unknown",
          payload: { 
            targetUsername, 
            updatedData: { 
              name: data[3], 
              email: data[4], 
              role: data[2], 
              position: data[5] 
            } 
          }
        });
        return NextResponse.json({ message: "Update success" });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    if (!type || !hn) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    if (type === 'visits' || type === 'medications' || type === 'technique_checks') {
      const { date } = body;
      if (!date || !data) return NextResponse.json({ error: "Missing date" }, { status: 400 });

      const result = await updateRowByHnAndDate(type, hn, date, data);
      if (result.success) {
        await logAudit({
          action_type: 'UPDATE',
          module: type.toUpperCase() as any,
          actor_id: session.user?.email || "Unknown",
          target_hn: hn,
          payload: { date }
        });
        return NextResponse.json({ message: "Update success" });
      } else {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
    }

    if (type === 'drp_update') {
      const { id, data: drpData } = body;
      const result = await updateDRP(id, drpData);
      if (result.success) {
        await logAudit({
          action_type: 'UPDATE',
          module: 'VISIT',
          actor_id: session.user?.email || "Unknown",
          payload: { id, event: 'DRP Outcome Update' }
        });
        return NextResponse.json({ message: "Update success" });
      } else {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
    }

    if (type === 'advice_update') {
      const { hn: adviceHn, staff_username, date: adviceDate, advice: newAdviceText } = body;
      const currentUserId = (session.user as any).id || '';
      const currentUserRole = (session.user as any).role;
      if (currentUserRole !== 'Admin' && currentUserId !== staff_username) {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      }

      const result = await updateAdvice(adviceHn, staff_username, adviceDate, newAdviceText);
      if (result.success) {
        await logAudit({
          action_type: 'UPDATE',
          module: 'VISIT',
          actor_id: session.user?.email || "Unknown",
          payload: { targetHn: adviceHn, event: 'Staff Advice Update' }
        });
        return NextResponse.json({ message: "Update success" });
      } else {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
    }

    let result;
    if (data) {
      result = await updatePatientData(hn, data);
    } else if (status) {
      result = await updatePatientStatus(hn, status);
    } else {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }

    if (result.success) {
      await logAudit({
        action_type: 'UPDATE',
        module: 'PATIENT',
        actor_id: session.user?.email || "Unknown",
        target_hn: hn,
        payload: { event: status ? 'Status Change' : 'Patient Data Edit' }
      });
      return NextResponse.json({ message: "Update success" });
    } else {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

  } catch (error) {
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const hn = searchParams.get('hn');
    const id = searchParams.get('id');

    if (type === 'users') {
      if ((session.user as any).role !== 'Admin') return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      const result = await deleteUser(id!);
      if (result.success) {
        await logAudit({
          action_type: 'DELETE',
          module: 'USER',
          actor_id: session.user?.email || "Unknown",
          payload: { deletedUserId: id }
        });
      }
      return NextResponse.json({ success: result.success });
    }

    if (type === 'advice') {
      const staffUsername = searchParams.get('staff_username');
      const date = searchParams.get('date');
      const result = await deleteAdvice(hn!, staffUsername!, date!);
      if (result.success) {
        await logAudit({
          action_type: 'DELETE',
          module: 'VISIT',
          actor_id: session.user?.email || "Unknown",
          target_hn: hn!,
          payload: { event: 'Deleted Staff Advice', date }
        });
      }
      return NextResponse.json({ success: result.success });
    }

    if (type === 'visit_entry') {
      const date = searchParams.get('date');
      if ((session.user as any).role !== 'Admin') return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      
      await Promise.all([
        deleteAllRowsByHnAndDate('visits', hn!, date!),
        deleteAllRowsByHnAndDate('medications', hn!, date!),
        deleteAllRowsByHnAndDate('technique_checks', hn!, date!),
        deleteAllRowsByHnAndDate('drps', hn!, date!)
      ]);
      await logAudit({
        action_type: 'DELETE',
        module: 'VISIT',
        actor_id: session.user?.email || "Unknown",
        target_hn: hn!,
        payload: { event: 'Deleted Visit Entry', date }
      });
      return NextResponse.json({ message: "Success" });
    }

    if (type === 'patients') {
      if ((session.user as any).role !== 'Admin') return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      
      const deleteHistory = searchParams.get('deleteHistory') === 'true';
      if (deleteHistory) {
        await Promise.all([
          deleteAllRowsByHn('visits', hn!),
          deleteAllRowsByHn('medications', hn!),
          deleteAllRowsByHn('technique_checks', hn!),
          deleteAllRowsByHn('staff_advice', hn!),
          deleteAllRowsByHn('drps', hn!)
        ]);
      }
      const result = await deleteRow('patients', hn!);
      if (result.success) {
        await logAudit({
          action_type: 'DELETE',
          module: 'PATIENT',
          actor_id: session.user?.email || "Unknown",
          target_hn: hn!,
          payload: { event: 'Deleted Patient', deleteHistory }
        });
      }
      return NextResponse.json({ success: result.success });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
