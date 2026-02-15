import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSheetData, appendData, updatePatientStatus, updatePatientData, deleteRow, logActivity, getUsers, createUser, updateUser, deleteUser } from '@/lib/sheets';
import { normalizeHN } from '@/lib/helpers';
import { Patient } from '@/lib/types';
import { hashPassword } from '@/lib/auth';

const SHEET_CONFIG = {
  PATIENTS_TAB: 'patients',
  VISITS_TAB: 'visits',
  TECHNIQUE_TAB: 'technique_checks',
  USERS_TAB: 'users',
  MEDICATIONS_TAB: 'medications',
};



// --- GET ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const hn = searchParams.get('hn'); // Can be HN or Username (for users)

    // --- User Management Logic ---
    if (type === 'users') {
      const currentUserRole = (session.user as any).role;
      const currentUserId = (session.user as any).id; // Username is stored in session.user.username

      // GET: Admin sees all. Staff sees ONLY themselves.
      if (request.method === 'GET') {
        const users: any[] = await getUsers();
        let safeUsers = users.map((u: any) => ({
          username: u.username,
          role: u.role,
          name: u.name,
          email: u.email,
          position: u.position, // Add position
          // Do NOT send password_hash
        }));

        if (currentUserRole !== 'Admin') {
          // If not Admin, filter to only show their own user
          safeUsers = safeUsers.filter(u => u.username === currentUserId);
        }
        return NextResponse.json(safeUsers);
      }
    }

    if (type === 'medications') {
      if (!hn) return NextResponse.json({ error: "Missing HN" }, { status: 400 });
      const { getLatestMedication } = await import('@/lib/sheets');
      const med = await getLatestMedication(hn);
      return NextResponse.json(med || {}); // Return empty object if no history
    }

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB;
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const data = await getSheetData(tabName);
    if (!data) return NextResponse.json([]);

    if (hn) {
      const filteredData = Array.isArray(data)
        ? data.filter((item: Patient) => normalizeHN(item.hn) === normalizeHN(hn))
        : data;
      return NextResponse.json(filteredData);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

import { patientRowSchema, visitRowSchema, strictTechniqueCheckRowSchema } from '@/lib/schemas';

// --- POST ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, data } = body;
    // data for users: [username, password, role, name, email] -> Need to Hash Password!

    if (type === 'users') {
      // RPAC: Only Admin can create users
      const currentUserRole = (session.user as any).role;
      if (currentUserRole !== 'Admin') {
        return NextResponse.json({ error: "Access Denied: Only Admin can create users" }, { status: 403 });
      }

      const username = data[0]; // TODO: Validate
      const plainPassword = data[1];
      const role = data[2];
      const name = data[3];
      const email = data[4];
      const position = data[5] || ""; // New field

      // Hash Password
      const hashedPassword = await hashPassword(plainPassword);
      const newUser = [username, hashedPassword, role, name, email, position];

      const result = await createUser(newUser);
      if (result.success) {
        await logActivity(session.user?.email || "Unknown", `Add User`, `Success (Username: ${username})`);
        return NextResponse.json({ message: 'User created' });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    let tabName = '';
    // Validation Logic
    if (type === 'patients') {
      tabName = SHEET_CONFIG.PATIENTS_TAB;
      const result = patientRowSchema.safeParse(data);
      if (!result.success) return NextResponse.json({ error: "Invalid Data Format", details: result.error.errors }, { status: 400 });
    }
    else if (type === 'visits') {
      tabName = SHEET_CONFIG.VISITS_TAB;
      const result = visitRowSchema.safeParse(data);
      if (!result.success) return NextResponse.json({ error: "Invalid Data Format", details: result.error.errors }, { status: 400 });
    }
    else if (type === 'technique_checks') {
      tabName = SHEET_CONFIG.TECHNIQUE_TAB;
      const result = strictTechniqueCheckRowSchema.safeParse(data);
      if (!result.success) return NextResponse.json({ error: "Invalid Data Format", details: result.error.errors }, { status: 400 });
    }
    else if (type === 'medications') {
      tabName = SHEET_CONFIG.MEDICATIONS_TAB;
      // Validate array length or content if needed. For now allow any array.
      if (!Array.isArray(data)) return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const result = await appendData(tabName, data); // Type is implicitly any[] but vetted by Zod

    if (result.success) {
      // Log Activity
      const entityId = data.hn || data[0] || "Unknown";
      // data[0] is usually HN for visits/patients if array
      // But data comes in as object for Zod? 
      // Wait, `appendData` expects array. 
      // The `data` in body IS array for `appendData`? 
      // Let's check schemas or how it's sent.
      // Front-end sends array.
      // So data[0] should be HN in most cases.
      // For techniques, it might be ID or HN. 
      // Let's just log "Success".
      await logActivity(session.user?.email || "Unknown", `Add ${type}`, `Success (Data[0]: ${Array.isArray(data) ? data[0] : JSON.stringify(data)})`);

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
    // รองรับ 2 แบบ:
    // 1. อัปเดตสถานะ: { type, hn, status }
    // 2. แก้ไขข้อมูลผู้ป่วย: { type, hn, data: [...] }
    const { type, hn, status, data, username } = body; // username for users update

    if (type === 'users') {
      const targetUsername = username || data[0];
      const currentUserRole = (session.user as any).role;
      const currentUserId = (session.user as any).id; // Username is ID

      // RBAC: 
      // 1. Admin can edit anyone.
      // 2. Staff can edit ONLY themselves.
      if (currentUserRole !== 'Admin' && currentUserId !== targetUsername) {
        return NextResponse.json({ error: "Access Denied: You can only edit your own profile" }, { status: 403 });
      }

      // Also prevent Staff from changing their own ROLE
      // If not admin, force role to remain what it was? 
      // Implementation detail: The frontend sends the full row.
      // We should probably fetch old user, check if role changed.
      // For simplicity: If not Admin, we ignore the role passed in data and keep old role?
      // Let's do that for safety.

      const users: any[] = await getUsers();
      const oldUser = users.find((u: any) => u.username === targetUsername);

      if (!oldUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      // Security: If not Admin, Role must match oldUser.role
      if (currentUserRole !== 'Admin' && data[2] !== oldUser.role) {
        return NextResponse.json({ error: "Access Denied: You cannot change your own role" }, { status: 403 });
      }

      const newPassword = data[1];
      let finalPasswordHash = oldUser.password_hash;

      if (newPassword && newPassword.trim() !== '') {
        finalPasswordHash = await hashPassword(newPassword);
      }

      const updatedRow = [
        data[0], // username
        finalPasswordHash,
        data[2], // role
        data[3], // name
        data[4],  // email
        data[5] || "" // position
      ];

      const result = await updateUser(targetUsername, updatedRow);
      if (result.success) {
        await logActivity(session.user?.email || "Unknown", `Edit User`, `Success (Username: ${targetUsername})`);
        return NextResponse.json({ message: "Update success" });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    if (!type || !hn) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    let tabName = "";
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    let result;
    let actionDetail = "";

    if (data) {
      if (type === 'patients') {
        const result = patientRowSchema.safeParse(data);
        if (!result.success) return NextResponse.json({ error: "Invalid Data Format", details: result.error.errors }, { status: 400 });
      }
      // กรณีมี data เข้ามา แปลว่าเป็น Full Edit
      result = await updatePatientData(tabName, hn, data);
      actionDetail = `Full Edit (HN: ${hn})`;
    } else if (status) {
      // กรณีมีแค่ status แปลว่าเป็น Quick Update Status
      result = await updatePatientStatus(tabName, hn, status);
      actionDetail = `Update Status to ${status} (HN: ${hn})`;
    } else {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }

    if (result.success) {
      await logActivity(session.user?.email || "Unknown", `Edit ${type}`, actionDetail);
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
    const id = searchParams.get('id'); // ID/Username for users

    if (type === 'users') {
      // RBAC: Only Admin can delete users
      const currentUserRole = (session.user as any).role;
      if (currentUserRole !== 'Admin') {
        return NextResponse.json({ error: "Access Denied: Only Admin can delete users" }, { status: 403 });
      }

      if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      const result = await deleteUser(id);
      if (result.success) {
        await logActivity(session.user?.email || "Unknown", `Delete User`, `Success (Username: ${id})`);
        return NextResponse.json({ message: "Delete success" });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    if (!type || !hn) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    let tabName = "";
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const result = await deleteRow(tabName, hn);

    if (result.success) {
      await logActivity(session.user?.email || "Unknown", `Delete ${type}`, `Success (HN: ${hn})`);
      return NextResponse.json({ message: "Delete success" });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
