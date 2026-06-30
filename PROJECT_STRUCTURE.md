# PROJECT_STRUCTURE.md

ไฟล์นี้คือแผนที่ของโปรเจค Asthma-Flow อ้างอิงจากโครงสร้างไฟล์จริงใน repository เพื่อให้คนทำงานและ AI เข้าใจบริบทเดียวกันก่อนแก้โค้ดทุกครั้ง

อัปเดตล่าสุด: 2026-06-28

## ภาพรวมระบบ

Asthma-Flow เป็นเว็บแอปสำหรับบริหารคลินิกโรคหืด ใช้ Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/ui, NextAuth และ Supabase PostgreSQL

ข้อมูลในระบบเป็นข้อมูลสุขภาพและข้อมูลระบุตัวบุคคล เช่น HN, ชื่อ, วันเกิด, เบอร์โทร, ประวัติ visit, ค่า PEFR, ยา, DRP, technique check และคำแนะนำจากเจ้าหน้าที่ จึงต้องพัฒนาโดยยึด privacy และ security เป็นค่าเริ่มต้น

## โครงสร้างหลัก

```text
app/                     Next.js App Router pages, layouts, API routes
actions/                 Server actions หรือ action helpers
components/              Shared React components
components/ui/           shadcn/ui primitives
lib/                     Business logic, Supabase client, auth, validation, logging
public/                  Static assets and inhaler guide images
scripts/                 Utility scripts for DB/schema checks
supabase/migrations/     Database migration SQL
types/                   TypeScript type augmentation
design-system/           Design documentation
```

## Public Pages

- `app/page.tsx` - landing page และหน้าข้อมูลภาพรวมของระบบ
- `app/privacy/page.tsx` - privacy policy
- `app/terms/page.tsx` - terms of service
- `app/auth/signin/page.tsx` - staff sign-in page
- `app/not-found.tsx` และ `app/global-error.tsx` - error handling ระดับแอป
- `app/layout.tsx` - root layout, provider, metadata และ shell หลัก
- `app/globals.css` - global style และ Tailwind CSS v4 theme tokens

## Staff Portal

พื้นที่ `app/staff/` เป็นโซนเจ้าหน้าที่ ต้องผ่าน NextAuth middleware/proxy ที่ `proxy.ts`

- `app/staff/layout.tsx` - staff shell/layout
- `app/staff/dashboard/page.tsx` - dashboard ภาพรวมคลินิก สถิติ และรายการนัด
- `app/staff/patients/page.tsx` - รายชื่อผู้ป่วย ค้นหา/เลือกผู้ป่วย
- `app/staff/patient/[hn]/page.tsx` - patient profile รายบุคคลตาม HN รวมข้อมูล visit, PEFR, DRP, advice, QR/action plan
- `app/staff/patient/[hn]/_components/` - component ย่อยของ patient profile เช่น `PatientInfoCard`, `PEFRChart`, `VisitHistoryTable`, `TechniqueModal`, `ActionPlanPrint`
- `app/staff/visit/[hn]/page.tsx` - บันทึก visit รายผู้ป่วย
- `app/staff/register/page.tsx` - ลงทะเบียนผู้ป่วยใหม่
- `app/staff/today-pefr/page.tsx` - บันทึก PEFR ประจำวัน
- `app/staff/drp-management/page.tsx` - DRP tracker สำหรับติดตามปัญหาการใช้ยา
- `app/staff/drp-management/config/page.tsx` - ตั้งค่า master data ของ DRP dropdowns
- `app/staff/data-management/page.tsx` - จัดการข้อมูลระบบและ import visit
- `app/staff/data-management/_actions/import-visits.ts` - server action สำหรับ import visit
- `app/staff/data-management/_components/` - UI สำหรับ import visits และ medication management
- `app/staff/print-cards/page.tsx` - พิมพ์ patient/action plan cards
- `app/staff/users/page.tsx` - จัดการผู้ใช้ staff/admin
- `app/staff/error.tsx`, `loading.tsx` ในบาง route - error/loading state เฉพาะ staff

## Patient Portal

- `app/patient/[token]/page.tsx` - patient view ผ่าน public token และ DOB verification
- `app/patient/[token]/_components/ActionPlanPrint.tsx` - printable action plan สำหรับ patient-facing view

ข้อควรระวัง: patient portal เป็น public surface ที่มีข้อมูลสุขภาพ ต้องจำกัดข้อมูลที่ส่งออก, rate limit การยืนยัน DOB, ไม่ log token แบบไม่จำเป็น และควรมี token rotation/expiry ในอนาคต

## Admin Area

- `app/admin/medications/page.tsx` - หน้าจัดการรายการยาในระดับ admin

หมายเหตุ: ตรวจสอบ route protection ของ `app/admin/` ทุกครั้งก่อนเพิ่มหน้าใหม่ เพราะ `proxy.ts` ตอนนี้ match เฉพาะ `/staff/:path*`

## API Routes

- `app/api/auth/[...nextauth]/route.ts` - NextAuth credentials provider, staff login, JWT session, auth audit log, rate limit
- `app/api/patient/route.ts` - public patient API ใช้ token + DOB verification, คืนข้อมูลแบบจำกัด
- `app/api/backup/route.ts` - backup/export workflow
- `app/api/db/route.ts` - database utility endpoint
- `app/api/medication-list/route.ts` - medication master data endpoint

แนวทางสำหรับ API route ใหม่:

- validate input ด้วย Zod หรือ schema ที่ชัดเจน
- ตรวจ session/role ก่อนเข้าถึงข้อมูล staff/admin
- หลีกเลี่ยงการใช้ `supabaseAdmin` ยกเว้นงาน system/audit/backup ที่จำเป็นจริง
- return error แบบไม่เปิดเผย stack trace หรือ PHI
- log audit เฉพาะข้อมูลที่จำเป็นต่อการตรวจสอบ

## Shared Libraries

- `lib/supabase.ts` - Supabase standard client และ admin client
- `lib/db.ts` - data access functions สำหรับ patients, visits, medications, DRP, technique checks, users, advice
- `lib/auth.ts` - password hashing/verification ด้วย bcrypt
- `lib/rate-limit.ts` - in-memory rate limiter สำหรับ auth และ patient verification
- `lib/logger.ts` - audit logging ลงตาราง `logs` ผ่าน admin client และบังคับ timezone Asia/Bangkok
- `lib/schemas.ts` - Zod schemas สำหรับ form/database row validation
- `lib/types.ts` - shared TypeScript types
- `lib/helpers.ts`, `lib/drp-helpers.ts`, `lib/date-utils.ts`, `lib/pef-reference.ts` - helper logic
- `lib/sheets.ts` - Google Sheets integration
- `lib/config.ts` - configuration helpers

## Database And Migrations

- `supabase/migrations/20260616_drp_redesign.sql` - DRP redesign migration: config tables, status fields, `drp_history`, indexes และ seed data

ตารางหลักที่ระบบอ้างอิง:

- `patients` - patient demographics, HN, DOB, token, status
- `visits` - clinical visit history, PEFR, control level, medication summary, next appointment
- `medications` - medication regimen per date
- `technique_checks` - inhaler technique checklist
- `drps` - drug-related problems
- `drp_history` - DRP change history
- `drp_categories`, `drp_types`, `drp_causes`, `drp_interventions`, `drp_outcomes` - DRP master data
- `users` - staff/admin accounts
- `staff_advice` - advice notes
- `medication_list` - medication master data
- `logs` - audit logs

## Security And Compliance Map

This section is a practical baseline, not a certification claim. It maps the project to common healthcare security expectations without overengineering.

### Standards Baseline

- OWASP Top 10:2025 - application security risks เช่น access control, misconfiguration, supply chain, crypto, injection, auth, logging
- CIS Controls v8.1 - เดิมคือแนวคิด SANS Top 20 ปัจจุบันใช้ CIS Controls เป็น cyber hygiene baseline
- HIPAA Security Rule - administrative, physical, technical safeguards สำหรับ ePHI
- PDPA/GDPR - lawful basis, data minimization, purpose limitation, rights handling, breach response
- ISO/IEC 27001:2022 - ISMS, risk assessment, risk treatment, continuous improvement
- ISO/IEC 27701 - privacy information management controls
- HAIT/TMI readiness - เตรียมหลักฐานด้าน governance, access control, audit trail, backup, incident response, change management และ user training

### Data Classification

- High sensitivity: patient identity, DOB, HN, phone, clinical visits, PEFR, medications, DRP, advice, public token
- Medium sensitivity: staff user data, audit logs, operational reports
- Low sensitivity: public landing page content, static assets, non-sensitive UI copy

### Controls Already Present

- Staff route protection via `proxy.ts` for `/staff/:path*`
- NextAuth session with 8-hour JWT max age
- Credentials login uses bcrypt password verification
- Auth rate limiting for staff login
- Patient public view requires token plus DOB verification
- Patient API returns a reduced `safePatient` object
- Audit logging via `lib/logger.ts`
- DRP change history via `drp_history`
- Zod schemas for important form/row validation
- Supabase admin client separated from standard client

### Main Security Risks To Watch

| Risk | Area | Current Concern | Practical Control |
| --- | --- | --- | --- |
| Broken access control | Staff/Admin routes | `proxy.ts` protects `/staff`, but `app/admin` needs explicit review | Extend protection to admin routes and add role checks |
| PHI leakage via logs | Patient API/logging | Patient token is currently included in audit payload on patient auth events | Avoid storing raw token; store hashed token prefix or event metadata only |
| Public token exposure | Patient portal | Token links may live long and can be shared | Add expiry/rotation/revoke status for tokens |
| In-memory rate limit | Auth/patient verification | Resets across serverless instances/restarts | Use DB/Redis-backed limiter when deployed beyond single instance |
| Service role misuse | Supabase admin | Admin client bypasses RLS | Restrict to server-only modules and document allowed use cases |
| RLS gaps | Supabase tables | Some migration tables explicitly disable RLS | Confirm threat model; enable RLS where client-side access could occur |
| Injection/data tampering | Generic update/delete helpers | Some helpers accept `tabName` | Allowlist table names and validate payload shape |
| Backup exposure | Backup API/Google Sheets | Backup can duplicate PHI outside database | Protect endpoint, encrypt/limit access, document retention |
| Supply chain risk | npm dependencies | Healthcare app depends on many packages | Run `npm audit`, lockfile review, update policy |
| HAIT audit evidence | Governance | Controls may exist in code but not as evidence | Keep DEV_LOG, change notes, access review, backup test records |

### Minimum Non-Overengineered Security Checklist

Before production or hospital pilot:

- Protect `/admin/:path*` and require Admin role for medication/user/admin functions
- Remove raw token from audit payloads; never log DOB, full patient name, phone, or clinical detail unless required
- Add a small access-control helper for staff/admin role checks
- Add allowlist validation for generic table update/delete helpers
- Confirm Supabase RLS strategy and document which operations intentionally use service role
- Add security headers in Next.js config or hosting layer: HSTS, frame protection/CSP policy, no-sniff, referrer policy
- Run dependency audit and record accepted risks in `DEV_LOG.md`
- Test backup restore, not only backup creation
- Document breach response contact, severity levels, and notification workflow
- Keep privacy notice aligned with actual data flows: Supabase, Google Sheets backup, NextAuth, Google OAuth if enabled

## Agent Working Rules

เมื่อเริ่มงานใหม่:

1. อ่าน `PROJECT_STRUCTURE.md`, `DEV_LOG.md`, `AGENTS.md`
2. ตรวจไฟล์จริงก่อนสรุปโครงสร้างหรือแก้โค้ด
3. ถ้างานแตะข้อมูลผู้ป่วย ให้คิดเรื่อง PHI/PII, access control, audit log และ data minimization ก่อน
4. เมื่อจบงานหรือจบวัน ให้อัปเดต `DEV_LOG.md`

## Reference Sources

- OWASP Top 10: https://owasp.org/Top10/2025/
- CIS Controls: https://www.cisecurity.org/controls
- HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- GDPR legal framework: https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en
- ISO/IEC 27001:2022: https://www.iso.org/standard/27001
- ISO/IEC 27701:2019: https://www.iso.org/standard/71670.html

## Readiness Evidence

- `SECURITY_READINESS.md` - lightweight security/HAIT/ISMS readiness checklist, evidence map, and current gaps
