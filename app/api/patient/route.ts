import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';
import { normalizeHN } from '@/lib/helpers';
import { Patient, Visit } from '@/lib/types';



const SHEET_CONFIG = {
    PATIENTS_TAB: 'patients',
    VISITS_TAB: 'visits',
};



// --- PUBLIC Patient API (ไม่ต้อง auth — ผู้ป่วยเข้าผ่าน QR Code) ---
// ต้องยืนยันวันเดือนปีเกิดก่อนจึงจะดูข้อมูลได้
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const dobInput = searchParams.get('dob'); // DD/MM/YYYY (พ.ศ.)

        if (!token) {
            return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 });
        }

        // 1. ค้นหาผู้ป่วยจาก token
        const patients = await getSheetData(SHEET_CONFIG.PATIENTS_TAB) as any[];
        const patient = patients.find((p: Patient) => p.public_token === token);

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // 2. ถ้ายังไม่ได้ส่ง DOB → ส่งแค่ชื่อมาสก์กลับไปให้แสดงบนหน้า verify
        if (!dobInput) {
            const firstName = patient.first_name || '';
            const maskedName = firstName.charAt(0) + '***';
            return NextResponse.json({
                requireVerification: true,
                maskedName: `${patient.prefix || ''}${maskedName}`,
            });
        }

        // 3. ตรวจสอบ DOB
        // รองรับ input เป็น DD/MM/YYYY (พ.ศ.) หรือ DD/MM/YYYY (ค.ศ.)
        const patientDob = new Date(patient.dob);
        const [dayStr, monthStr, yearStr] = dobInput.split('/');
        let inputYear = parseInt(yearStr);
        const inputMonth = parseInt(monthStr);
        const inputDay = parseInt(dayStr);

        // ถ้าเป็น พ.ศ. (ปี > 2400) ให้แปลงเป็น ค.ศ.
        if (inputYear > 2400) {
            inputYear -= 543;
        }

        const dobMatch =
            patientDob.getFullYear() === inputYear &&
            (patientDob.getMonth() + 1) === inputMonth &&
            patientDob.getDate() === inputDay;

        if (!dobMatch) {
            return NextResponse.json({ error: 'วันเดือนปีเกิดไม่ถูกต้อง', verified: false }, { status: 403 });
        }

        // 4. DOB ถูกต้อง → ดึง visits เฉพาะของผู้ป่วยคนนี้
        const allVisits = await getSheetData(SHEET_CONFIG.VISITS_TAB) as any[];
        const patientVisits = allVisits
            .filter((v: Visit) => normalizeHN(v.hn) === normalizeHN(patient.hn))
            .sort((a: Visit, b: Visit) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 5. ดึงข้อมูลยา (Medication) ล่าสุด
        const { getLatestMedication } = await import('@/lib/sheets');
        const medication = await getLatestMedication(patient.hn);

        // 6. ส่งคืนข้อมูล
        const safePatient = {
            hn: patient.hn,
            prefix: patient.prefix,
            first_name: patient.first_name,
            last_name: patient.last_name,
            dob: patient.dob,
            height: patient.height,
        };

        return NextResponse.json({
            verified: true,
            patient: safePatient,
            visits: patientVisits,
            medication: medication,
        });
    } catch (error) {
        console.error('Public Patient API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
