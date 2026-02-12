import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

const SHEET_CONFIG = {
    PATIENTS_TAB: 'patients',
    VISITS_TAB: 'visits',
};

const normalize = (val: any) => String(val).trim().replace(/^0+/, '');

// --- PUBLIC Patient API (ไม่ต้อง auth — ผู้ป่วยเข้าผ่าน QR Code) ---
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 });
        }

        // 1. ค้นหาผู้ป่วยจาก token
        const patients = await getSheetData(SHEET_CONFIG.PATIENTS_TAB) as any[];
        const patient = patients.find((p: any) => p.public_token === token);

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // 2. ดึง visits เฉพาะของผู้ป่วยคนนี้
        const allVisits = await getSheetData(SHEET_CONFIG.VISITS_TAB) as any[];
        const patientVisits = allVisits
            .filter((v: any) => normalize(v.hn) === normalize(patient.hn))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 3. ส่งคืนเฉพาะข้อมูลที่จำเป็น (ไม่ส่ง phone, public_token)
        const safePatient = {
            hn: patient.hn,
            prefix: patient.prefix,
            first_name: patient.first_name,
            last_name: patient.last_name,
            dob: patient.dob,
            height: patient.height,
        };

        return NextResponse.json({
            patient: safePatient,
            visits: patientVisits,
        });
    } catch (error) {
        console.error('Public Patient API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
