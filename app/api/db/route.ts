import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSheetData, appendData, updatePatientStatus, updatePatientData, deleteRow } from '@/lib/sheets';

const SHEET_CONFIG = {
  PATIENTS_TAB: 'patients',
  VISITS_TAB: 'visits',
  TECHNIQUE_TAB: 'technique_checks',
};

const normalize = (val: any) => String(val).trim().replace(/^0+/, '');

// --- GET ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const hn = searchParams.get('hn');

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB;
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const data = await getSheetData(tabName);
    if (!data) return NextResponse.json([]);

    if (hn) {
        const filteredData = Array.isArray(data) 
            ? data.filter((item: any) => normalize(item.hn || item[0]) === normalize(hn))
            : data;
        return NextResponse.json(filteredData);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// --- POST ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, data } = body;

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB;
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const result = await appendData(tabName, data);

    if (result.success) {
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
    const { type, hn, status, data } = body;

    if (!type || !hn) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    let tabName = "";
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    let result;
    if (data) {
        // กรณีมี data เข้ามา แปลว่าเป็น Full Edit
        result = await updatePatientData(tabName, hn, data);
    } else if (status) {
        // กรณีมีแค่ status แปลว่าเป็น Quick Update Status
        result = await updatePatientStatus(tabName, hn, status);
    } else {
        return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }
    
    if (result.success) {
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

        if (!type || !hn) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        let tabName = "";
        if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
        else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

        const result = await deleteRow(tabName, hn);

        if (result.success) {
            return NextResponse.json({ message: "Delete success" });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
