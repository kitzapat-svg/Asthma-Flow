import { NextResponse } from 'next/server';
import { 
    getPatientByToken, 
    getVisitHistory, 
    getLatestMedication, 
    getAdvice,
} from '@/lib/db';
import { logAudit } from '@/lib/logger';
import { normalizeHN } from '@/lib/helpers';
import { Patient, Visit } from '@/lib/types';
import { patientRateLimiter } from '@/lib/rate-limit';

// --- PUBLIC Patient API ---
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const dobInput = searchParams.get('dob'); 

        if (!token) {
            return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 });
        }

        if (patientRateLimiter.isBlocked(token)) {
            const remainingMins = patientRateLimiter.getRemainingTime(token);
            return NextResponse.json({ 
                error: `บัญชีถูกระงับชั่วคราวจากการยืนยันตัวตนผิดพลาดหลายครั้ง กรุณาลองใหม่ในอีก ${remainingMins} นาที` 
            }, { status: 429 });
        }

        const patient = await getPatientByToken(token);
        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        if (!dobInput) {
            const firstName = patient.first_name || '';
            const maskedName = firstName.charAt(0) + '***';
            return NextResponse.json({
                requireVerification: true,
                maskedName: `${patient.prefix || ''}${maskedName}`,
            });
        }

        const patientDob = new Date(patient.dob);
        const [dayStr, monthStr, yearStr] = dobInput.split('/');
        let inputYear = parseInt(yearStr);
        const inputMonth = parseInt(monthStr);
        const inputDay = parseInt(dayStr);

        if (inputYear > 2400) inputYear -= 543;

        const dobMatch =
            patientDob.getFullYear() === inputYear &&
            (patientDob.getMonth() + 1) === inputMonth &&
            patientDob.getDate() === inputDay;

        if (!dobMatch) {
            patientRateLimiter.increment(token);
            await logAudit({
                action_type: 'AUTH',
                module: 'PATIENT',
                actor_id: 'System/Guest',
                payload: { event: 'DOB Verify Failed', token }
            });
            return NextResponse.json({ error: 'วันเดือนปีเกิดไม่ถูกต้อง', verified: false }, { status: 403 });
        }

        patientRateLimiter.reset(token);
        await logAudit({
            action_type: 'AUTH',
            module: 'PATIENT',
            actor_id: 'System/Guest',
            target_hn: patient.hn,
            payload: { event: 'Patient View Success', token }
        });

        const [visits, medication, advice] = await Promise.all([
            getVisitHistory(patient.hn),
            getLatestMedication(patient.hn),
            getAdvice(patient.hn)
        ]);

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
            visits,
            medication,
            advice,
        });
    } catch (error) {
        console.error('Public Patient API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
