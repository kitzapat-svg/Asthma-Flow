import { NextResponse } from 'next/server';
import { getSheetData, appendData, updatePatientStatus } from '@/lib/sheets';

// Config ชื่อ Tab ให้ตรงกับใน Google Sheets
const SHEET_CONFIG = {
  PATIENTS_TAB: 'patients',
  VISITS_TAB: 'visits',
  TECHNIQUE_TAB: 'technique_checks', // <--- เพิ่มบรรทัดนี้
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB; // <--- เพิ่มเงื่อนไขนี้
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const data = await getSheetData(tabName);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB; // <--- เพิ่มเงื่อนไขนี้
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, hn, status } = body;

    if (!type || !hn || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let tabName = "";
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    // (PUT ปัจจุบันใช้แค่แก้สถานะคนไข้ เลยยังไม่ต้องเพิ่ม technique_checks ตรงนี้ก็ได้ครับ)
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const result = await updatePatientStatus(tabName, hn, status);
    
    if (result.success) {
      return NextResponse.json({ message: "Update success" });
    } else {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

  } catch (error) {
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}
