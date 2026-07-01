# DEV_LOG.md

ไฟล์นี้คือสมุดบันทึกการพัฒนา Asthma-Flow ใช้บันทึกความคืบหน้า ความเสี่ยงที่พบ และงานถัดไป เพื่อให้คนทำงานและ AI ต่อบริบทได้เร็วขึ้น

## กติกาสำหรับ AI และผู้พัฒนา

1. เมื่อจบงานสำคัญ จบวัน หรือส่งมอบ feature ให้เพิ่ม log ใหม่ไว้ด้านบนสุดของ History
2. บันทึกสั้น กระชับ แต่ต้องมี enough context: ทำอะไร, แตะไฟล์ไหน, สำเร็จหรือไม่, เหลืออะไร
3. ถ้างานเกี่ยวกับข้อมูลผู้ป่วย ให้ระบุ security/privacy impact ทุกครั้ง
4. ถ้ามีการตัดสินใจด้านความปลอดภัย ให้บันทึกเหตุผลแบบ practical ไม่ต้องสร้างเอกสารแยกถ้าไม่จำเป็น
5. ถ้ามี test/lint/build ให้บันทึกผลลัพธ์ ถ้าไม่ได้รันให้บอกว่าไม่ได้รัน

## Template สำหรับ log ใหม่

```md
### YYYY-MM-DD - ชื่องาน

เป้าหมาย:
- ...

ทำเสร็จ:
- ...

Security/Privacy:
- ...

ปัญหา/ข้อสังเกต:
- ...

Next steps:
- ...

Verification:
- ...
```

## History

### 2026-07-01 - Implement Staff QR Token Management (Renew, Rotate, Revoke)

เป้าหมาย:
- เพิ่ม UX สำหรับเจ้าหน้าที่ในการจัดการ patient public token แบบปลอดภัย (Renew, Rotate, Revoke)

ทำเสร็จ:
- เพิ่มฟังก์ชัน `renewPatientPublicToken` ใน `lib/db.ts` และรองรับ action `renew` ใน `app/api/db/route.ts` พร้อม Audit Log
- อัปเดต `QRCodeCard.tsx` ให้แสดง 4 สถานะ (ใช้งานได้, ใกล้หมดอายุ, หมดอายุ, ถูกยกเลิก) และเพิ่ม 3 ปุ่มควบคุมสำหรับ Admin
- ทำ Confirm Dialog โดยใช้ `Modal` component แยกคำเตือนตามผลกระทบของแต่ละ Action ชัดเจน
- ส่ง props ใหม่และ Callback `onRefresh` จาก `app/staff/patient/[hn]/page.tsx` ไปยัง `QRCodeCard` เพื่ออัปเดตข้อมูลอัตโนมัติหลังทำรายการ

Security/Privacy:
- บังคับสิทธิ์ Admin ผ่าน API guard ก่อนที่จะอนุญาตให้จัดการ token (Renew/Rotate/Revoke)
- ซ่อนปุ่มและจำกัดการเข้าใช้งานปุ่มต่างๆ สำหรับ non-Admin บน UI (Defense in depth)
- แยกความแตกต่างของ dialog ชัดเจนเพื่อความปลอดภัย: เตือนให้ใช้ Rotate/Revoke หากสงสัยว่าลิงก์หลุดแทนที่จะใช้ Renew

ปัญหา/ข้อสังเกต:
- ไม่มีปัญหา, โครงสร้าง TypeScript ตรวจสอบแล้วผ่านสมบูรณ์ 100%

Next steps:
- ทดสอบการกดทำรายการจริงในสภาพแวดล้อมระบบพร้อมฐานข้อมูล
- สังเกตการณ์ Audit Logs ในระบบหลังมีการใช้งานจริง

Verification:
- รัน `tsc --noEmit` เพื่อตรวจสอบไทป์ผ่านแบบสมบูรณ์

### 2026-06-30 - Planned handoff: staff QR token controls

เป้าหมาย:
- ส่งต่องานให้ Antigravity เพิ่ม UX สำหรับเจ้าหน้าที่ในการจัดการ patient public token จากหน้ารายละเอียดผู้ป่วยจริง

ทำเสร็จ:
- ระบุงานถัดไปที่ควรทำ: เพิ่มปุ่ม renew/rotate/revoke ใน `QRCodeCard` และแสดงสถานะวันหมดอายุของ QR ให้เจ้าหน้าที่เห็นชัด ๆ
- จุด UI หลัก:
  - `app/staff/patient/[hn]/page.tsx`
  - `app/staff/patient/[hn]/_components/QRCodeCard.tsx`
- API ที่พร้อมใช้แล้ว:
  - `PUT /api/db` body `{ "type": "patient_public_token", "hn": "...", "action": "rotate" }`
  - `PUT /api/db` body `{ "type": "patient_public_token", "hn": "...", "action": "revoke" }`
- API ที่ควรเพิ่ม:
  - `PUT /api/db` body `{ "type": "patient_public_token", "hn": "...", "action": "renew" }`
  - backend ควรตั้ง `public_token_expires_at` ใหม่เป็นวันนี้ + 1 ปี โดยไม่เปลี่ยน `public_token`
  - ถ้าต้องการรองรับภายหลัง อาจรับ `expiresAt` จาก body ได้ แต่รอบแรกแนะนำ fixed 1 ปีเพื่อลดความซับซ้อน
- Workflow ที่ต้องการ:
  - ปุ่ม `ต่ออายุ QR` สำหรับ QR ใกล้หมดอายุ/หมดอายุแล้ว แต่ไม่มีความเสี่ยงว่าลิงก์หลุด และไม่อยากพิมพ์บัตรใหม่
  - ปุ่ม `ออก QR ใหม่` สำหรับ token หมดอายุ, QR หาย, ผู้ป่วยขอบัตรใหม่, หรือสงสัยว่าลิงก์หลุด
  - ปุ่ม `ยกเลิก QR นี้` สำหรับปิด QR เดิมทันทีเมื่อแจกผิดคนหรือมีความเสี่ยงข้อมูลรั่ว
  - หลัง renew สำเร็จ ให้ refresh patient data แล้วแสดงวันหมดอายุใหม่ โดย QR/token เดิมต้องไม่เปลี่ยน
  - หลัง rotate สำเร็จ ให้ refresh patient data แล้ว QR บนหน้าจอเปลี่ยนเป็น token ใหม่ทันที
  - หลัง revoke สำเร็จ ให้แสดงสถานะว่า QR ถูกยกเลิกและไม่ควรให้พิมพ์/ใช้งาน QR เดิม

Security/Privacy:
- ปุ่ม renew/rotate/revoke ต้องเรียก API ที่ตรวจ role `Admin` อยู่แล้ว ห้ามจัดการ token จาก client โดยตรง
- UI ไม่ควรแสดง raw token ถ้าไม่จำเป็น แสดง QR/link และสถานะพอสำหรับงานหน้าเคาน์เตอร์
- ควรมี confirm dialog ก่อน renew/rotate/revoke โดยข้อความต้องแยกผลกระทบให้ชัด:
  - renew = QR เดิมใช้ต่อได้ ไม่ต้องพิมพ์ใหม่
  - rotate = QR เดิมใช้ไม่ได้ ต้องพิมพ์/ออก QR ใหม่
  - revoke = QR เดิมถูกปิดทันที
- ถ้าสงสัยว่า QR หลุดหรือแจกผิดคน ห้ามใช้ renew ควรใช้ rotate หรือ revoke ตามสถานการณ์

ปัญหา/ข้อสังเกต:
- API rotate/revoke พร้อมแล้ว แต่ UI ยังไม่มีปุ่มให้เจ้าหน้าที่กด
- API renew ยังต้อง implement เพิ่มใน `app/api/db/route.ts` และ helper ใน `lib/db.ts`
- ต้องแน่ใจว่า type `Patient` ฝั่ง staff รองรับ `public_token_expires_at`, `public_token_revoked_at`, และ `public_token_rotated_at`
- migration `20260630_patient_public_token_governance.sql` ต้องถูก apply ไป Supabase จริงก่อน field สถานะเหล่านี้จะมีในฐานข้อมูลจริง

Next steps:
- เพิ่ม props ให้ `QRCodeCard` รับ `hn`, `publicToken`, `publicTokenExpiresAt`, `publicTokenRevokedAt`, callback `onRefresh`
- เพิ่มสถานะ QR เช่น `ใช้งานได้`, `ใกล้หมดอายุ`, `หมดอายุ`, `ถูกยกเลิก`
- เพิ่ม helper เช่น `renewPatientPublicToken(hn, expiresAt = getDefaultPublicTokenExpiry())` โดย update เฉพาะ `public_token_expires_at` และ clear `public_token_revoked_at` เฉพาะเมื่อเป็นการต่ออายุที่ได้รับอนุญาตตาม policy
- เพิ่ม action `renew` ใน `app/api/db/route.ts` พร้อม audit log event `Patient public token renewed`
- เพิ่มปุ่มพร้อม loading state และ toast feedback สำหรับ renew/rotate/revoke
- ทดสอบที่หน้า `/staff/patient/[hn]` ว่า:
  - renew แล้ว token/QR เดิมไม่เปลี่ยน แต่วันหมดอายุเปลี่ยน
  - rotate แล้ว token/QR เปลี่ยนและต้องพิมพ์ใหม่
  - revoke แล้วสถานะปิดใช้งานถูกต้อง

Verification:
- ยังไม่ได้ implement UI ในรอบนี้ เป็น planned handoff สำหรับรอบถัดไป

### 2026-06-30 - Harden Supabase boundary, security headers, and readiness evidence

เป้าหมาย:
- งาน security quick win ที่ 5-7: แยก Supabase service-role boundary, เพิ่ม production security headers และทำ checklist หลักฐานแบบเบาๆ สำหรับ OWASP / SANS / HIPAA / PDPA / GDPR / ISMS / ISO privacy / HAIT โดยไม่ overengineering

ทำเสร็จ:
- แยก `supabaseAdmin` ไปไว้ที่ `lib/supabase-admin.ts` พร้อม `server-only` guard เพื่อกัน service role client หลุดไปฝั่ง browser
- ปรับ `lib/supabase.ts` ให้เหลือเฉพาะ anon client สำหรับงานที่ควรผ่าน RLS
- อัปเดตจุดที่ต้องใช้ admin client แบบตั้งใจใน `lib/db.ts`, `lib/logger.ts`, และ `app/api/backup/route.ts`
- เพิ่ม security headers กลางใน `next.config.ts` ได้แก่ HSTS, CSP baseline, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, และ `Permissions-Policy`
- เพิ่ม `SECURITY_READINESS.md` เป็น evidence checklist สำหรับ audit/readiness และเชื่อมไว้ใน `PROJECT_STRUCTURE.md`
- ตรวจสอบ Supabase CLI แบบ local devDependency สำเร็จผ่าน `npm exec supabase -- --version` ได้เวอร์ชัน `2.108.0`

Security/Privacy:
- ลดโอกาสใช้ service role key ผิดที่ โดยทำให้ admin Supabase client import ได้เฉพาะฝั่ง server
- เพิ่ม browser-layer hardening ตามแนว OWASP แบบ pragmatic โดย CSP ยังเปิด `unsafe-inline` / `unsafe-eval` เพื่อไม่ให้กระทบ Next.js development/runtime ก่อนมี CSP nonce เต็มรูปแบบ
- เพิ่มเอกสารหลักฐานช่วย mapping controls สำหรับข้อมูลผู้ป่วยและ readiness audit โดยยังไม่แทนที่เอกสารนโยบาย/กระบวนการองค์กรจริง

ปัญหา/ข้อสังเกต:
- global command `supabase` ยังไม่อยู่ใน PATH แต่ local CLI ใช้งานได้ผ่าน `npm exec supabase -- ...`
- การรัน Supabase CLI ใน sandbox ต้องขอสิทธิ์เพิ่ม เพราะ CLI เขียน telemetry/cache ไปที่ user profile (`C:\Users\Kitza\.supabase`)
- ยังมี lint debt เดิมใน repo บางส่วน จึงตรวจเฉพาะไฟล์ที่เกี่ยวข้องกับงานชุดนี้

Next steps:
- ผลักดัน Supabase migrations ไปฐานข้อมูลจริงเมื่อพร้อมอนุมัติ
- ทำ RLS policy inventory/verification เพิ่มเติมในฐานข้อมูลจริง
- ค่อยๆ ลด CSP `unsafe-inline` / `unsafe-eval` เมื่อโครงสร้างรองรับ nonce/hash

Verification:
- `npm.cmd exec tsc -- --noEmit` ผ่าน
- `npm.cmd exec eslint -- next.config.ts lib/supabase.ts lib/supabase-admin.ts lib/logger.ts app/api/backup/route.ts` ผ่าน
- `npm.cmd exec supabase -- --version` แสดง `2.108.0`

### 2026-06-30 - Install Supabase CLI and apply migrations

เป้าหมาย:
- ติดตั้งและตั้งค่า Supabase CLI เพื่อให้ผู้พัฒนาและ AI (Antigravity) สามารถตรวจสอบสถานะ รันคิวรี และจัดการ migration บนฐานข้อมูล Supabase ได้โดยตรง
- ผลักดันการอัปเดตโครงสร้างฐานข้อมูล (`20260630_patient_public_token_governance.sql`) ขึ้นรีโมตฐานข้อมูลจริง

ทำเสร็จ:
- ติดตั้ง `supabase` CLI เป็น devDependency ในโครงการด้วย `npm install -D supabase --legacy-peer-deps` เพื่อแก้ปัญหา peer dependency conflict ของ React 19 / qrcode.react
- ตรวจสอบความถูกต้องของการเชื่อมโยงบัญชีและโครงการ พบว่า CLI ได้รับการตรวจสอบสิทธิ์และเชื่อมโยงกับโครงการ `themcfpftndtiekjsovm` (Asthma-Flow) บนเครื่องนี้แล้ว
- ทดสอบคิวรีตารางข้อมูลจริงบนรีโมตฐานข้อมูลผ่าน `npx supabase db query --linked "..."`
- ผลักดัน migrations สำเร็จด้วย `npx supabase db push --linked` ซึ่งทำการลงทะเบียนโครงสร้าง DRP เดิมที่ถูกติดตั้งด้วยวิธีอื่นก่อนหน้านี้ (`20260616_drp_redesign.sql` - ข้ามตาราง/อินเด็กซ์ที่ซ้ำโดยอัตโนมัติ) และทำการรันไฟล์ `20260630_patient_public_token_governance.sql` เพื่อเพิ่มคอลัมน์และดัชนีสำหรับความปลอดภัยของ Public QR Token สำเร็จ

Security/Privacy:
- การใช้คำสั่งเชื่อมต่อแบบ `--linked` ผ่าน Management API ไม่จำเป็นต้องกรอกหรือบันทึกรหัสผ่านฐานข้อมูล (Postgres database password) ในไฟล์การตั้งค่า ช่วยลดความเสี่ยงข้อมูลความลับรั่วไหล
- โครงสร้างใหม่ของ Token Metadata (created_at, expires_at, revoked_at, rotated_at) ได้ถูกนำไปใช้ในฐานข้อมูลจริงแล้วเพื่อรอรับการเรียกใช้งานจาก API และ UI

ปัญหา/ข้อสังเกต:
- คำสั่ง `npx supabase status` บนเครื่องนี้จำเป็นต้องรันร่วมกับ Docker ซึ่งในสภาพแวดล้อม Windows จำเป็นต้องเปิดใช้งาน Docker Desktop และอาจต้องการ elevated privileges จึงไม่แสดงผลในปัจจุบัน แต่ไม่มีผลกระทบต่อการทำงานจัดการฐานข้อมูลจริงผ่านรีโมต

Next steps:
- พัฒนาส่วนประกอบและ UI ฝั่งเจ้าหน้าที่ (เช่น `QRCodeCard`) ให้รองรับการกดปุ่มเพื่อหมุนเวียน (Rotate) หรือยกเลิก (Revoke) Token ในหน้าประวัติผู้ป่วย

Verification:
- `npx supabase --version` แสดงเวอร์ชัน `2.108.0`
- `npx supabase db query --linked` ค้นพบฟิลด์ความปลอดภัยของ Token ในตาราง `patients` ได้สำเร็จ (`public_token_created_at`, `public_token_expires_at`, `public_token_revoked_at`, และ `public_token_rotated_at`)

### 2026-06-30 - Add patient public token governance baseline

เป้าหมาย:
- งาน security quick win ที่ 4: เพิ่มฐานรองรับ expiry/revoke/rotation สำหรับ patient public token แบบไม่ทำลาย QR เดิมทันที

ทำเสร็จ:
- เพิ่ม migration `supabase/migrations/20260630_patient_public_token_governance.sql`
  - `public_token_created_at`
  - `public_token_expires_at`
  - `public_token_revoked_at`
  - `public_token_rotated_at`
  - partial index สำหรับ active public token
- แก้ `lib/db.ts` ให้ `getPatientByToken` รับเฉพาะ token ที่ยังไม่ revoke และยังไม่ expire
- เพิ่ม default expiry 1 ปีสำหรับ patient token ใหม่ผ่าน `createPatientData`
- เพิ่ม helper `rotatePatientPublicToken` และ `revokePatientPublicToken`
- เพิ่ม API action ใน `app/api/db/route.ts` สำหรับ Admin เท่านั้น:
  - `PUT /api/db` body `{ type: "patient_public_token", hn, action: "rotate" }`
  - `PUT /api/db` body `{ type: "patient_public_token", hn, action: "revoke" }`
- อัปเดต `lib/types.ts` และ backup patient export ให้รวม token metadata

Security/Privacy:
- ลดความเสี่ยง public token ที่อยู่ได้นานเกินไป โดย token ใหม่มี expiry 1 ปี
- รองรับการ revoke token เมื่อ QR/link หลุดหรือผู้ป่วยไม่ควรใช้ link เดิมแล้ว
- รองรับ rotation โดย server สร้าง UUID ใหม่เอง ไม่รับ token ใหม่จาก client
- Token เดิมที่ยังไม่มี `public_token_expires_at` จะยัง valid เพื่อไม่ให้ QR เดิมพังทันที

ปัญหา/ข้อสังเกต:
- Supabase CLI ไม่มีในเครื่องนี้ (`supabase` command not found) จึงสร้าง migration file โดยตรง ยังไม่ได้ apply กับ database live
- ยังไม่มี UI ปุ่ม rotate/revoke ใน patient profile รอบนี้ เป็น server/API baseline ก่อน
- ยังไม่ได้ทำ persistent rate limit สำหรับ public patient flow

Next steps:
- Apply migration กับ Supabase environment แล้วทดสอบ token active/expired/revoked ด้วยข้อมูลทดสอบ
- เพิ่ม UI เฉพาะ Admin สำหรับ rotate/revoke QR token ในหน้า patient profile
- Review backup/export governance เพราะ patient backup ยังมี PHI และ public token

Verification:
- `npm.cmd exec tsc -- --noEmit` ผ่าน
- ตรวจ references ด้วย `Select-String` สำหรับ `public_token_expires_at`, `rotatePatientPublicToken`, `revokePatientPublicToken`, `patient_public_token`

### 2026-06-30 - Add allowlist for generic DB helpers

เป้าหมาย:
- งาน security quick win ที่ 3: ลดความเสี่ยง data tampering จาก generic DB helpers ที่รับชื่อ table

ทำเสร็จ:
- แก้ `lib/db.ts` เพิ่ม allowlist แยกตาม operation:
  - `updateRowByHnAndDate`: อนุญาตเฉพาะ `visits`, `medications`, `technique_checks`
  - `deleteRow` / `deleteAllRowsByHn`: อนุญาตเฉพาะ `patients`, `visits`, `medications`, `technique_checks`, `staff_advice`, `drps`
  - `deleteAllRowsByHnAndDate`: อนุญาตเฉพาะ `visits`, `medications`, `technique_checks`, `drps`
- เพิ่ม type guard และ error response สำหรับ table ที่ไม่อยู่ใน allowlist ก่อนเรียก `supabase.from(tabName)`
- ปรับ date column mapping ให้ชัดเจน: `visits` และ `drps` ใช้ `visit_date`, ตารางอื่นใช้ `date`

Security/Privacy:
- ลดโอกาสที่ endpoint หรือ code path ใด ๆ จะส่ง table name แปลกเข้ามาแล้วลบ/แก้ข้อมูลนอกขอบเขต
- จำกัด blast radius ของ helper ที่ยังจำเป็นต้อง generic เพื่อรองรับ workflow เดิม

ปัญหา/ข้อสังเกต:
- ยังมี lint debt เดิมใน `lib/db.ts` จำนวนมากจาก `any` และ pattern เก่า จึงยังไม่ได้ทำให้ทั้งไฟล์ผ่าน ESLint ในรอบนี้
- งานนี้ไม่เปลี่ยน API contract หรือ UI behavior เดิม

Next steps:
- Review backup/export governance และข้อมูล PHI ที่ถูกส่งไป Google Sheets
- วางแผน persistent rate limit และ token expiry/rotation สำหรับ patient public link

Verification:
- `npm.cmd exec tsc -- --noEmit` ผ่าน
- `rg "supabase\\.from\\(tabName\\)" lib app actions -n` พบเฉพาะ helper ที่มี allowlist guard แล้ว
- `rg "deleteAllRowsByHn|deleteAllRowsByHnAndDate|deleteRow\\(|updateRowByHnAndDate" lib app actions -n` ยืนยันจุดเรียกยังเป็น workflow เดิม

### 2026-06-30 - Sanitize patient token audit logging

เป้าหมาย:
- งาน security quick win ที่ 2: ลดความเสี่ยง PHI/secret leakage ใน audit log ของ public patient flow

ทำเสร็จ:
- แก้ `app/api/patient/route.ts` ไม่ให้บันทึก raw public token ใน `logAudit`
- เพิ่ม token fingerprint ด้วย SHA-256 แบบสั้น (`token_fingerprint`) เพื่อให้ trace เหตุการณ์ได้โดยไม่เก็บ token จริง
- ลบ unused imports ใน patient API route ที่เกี่ยวข้องกับ warning เดิม
- เพิ่ม `target_hn` ใน DOB verification failure หลังจาก resolve patient ได้ เพื่อให้ audit trail ยังตาม HN ได้

Security/Privacy:
- ลดความเสี่ยง token leakage จาก audit table, log export หรือ backup
- ยังรักษาความสามารถตรวจสอบเหตุการณ์สำคัญ: DOB fail และ patient view success
- ไม่เปลี่ยนพฤติกรรม patient verification, response shape หรือ rate limiter

ปัญหา/ข้อสังเกต:
- Token ยังถูกใช้เป็น key ของ in-memory rate limiter ตามเดิม งาน persistent rate limit/token expiry ยังเป็น next phase

Next steps:
- งาน security ถัดไป: เพิ่ม allowlist validation สำหรับ generic DB helpers ที่รับ `tabName`
- ต่อด้วย review backup export ไม่ให้กระจาย PHI เกินจำเป็น

Verification:
- `rg "payload: \\{[^\\n]*token|token_fingerprint|DOB Verify|Patient View" app\\api\\patient\\route.ts app lib actions -n` ไม่พบ raw token ใน patient audit payload แล้ว
- `npm.cmd exec eslint -- app/api/patient/route.ts` ผ่าน
- `npm.cmd exec tsc -- --noEmit` ผ่าน

### 2026-06-29 - ปิด access control สำหรับ admin medication management

เป้าหมาย:
- เริ่ม security quick win งานแรก: protect `/admin` และบังคับ role `Admin` สำหรับหน้าจัดการยา

ทำเสร็จ:
- แก้ `proxy.ts` ให้ route `/admin/:path*` ต้อง login และต้องมี JWT role เป็น `Admin`
- แก้ `app/admin/medications/page.tsx` ให้เช็ก session/role ฝั่ง UI และแสดง access denied สำหรับ non-admin
- แก้ `app/api/medication-list/route.ts` ให้ GET ต้องมี session และ POST/PUT/DELETE ต้องเป็น `Admin`

Security/Privacy:
- ลดความเสี่ยง Broken Access Control ตาม OWASP สำหรับ admin surface
- ป้องกัน staff/non-admin แก้ medication master data ผ่าน API โดยตรง
- ยังไม่ได้แตะ patient PHI โดยตรงในรอบนี้

ปัญหา/ข้อสังเกต:
- `npm run lint` ผ่าน PowerShell ถูก block ด้วย execution policy จึงใช้ `npm.cmd`
- full repo lint ยัง fail จาก lint debt เดิมจำนวนมาก เช่น `any`, unused imports และ React hook rules ในหลายไฟล์ที่ไม่เกี่ยวกับงานนี้

Next steps:
- งาน security ถัดไป: sanitize audit logging ใน patient API ไม่ให้เก็บ raw public token
- ต่อด้วย allowlist validation สำหรับ generic DB helpers ที่รับ `tabName`

Verification:
- `npm.cmd exec eslint -- proxy.ts app/admin/medications/page.tsx app/api/medication-list/route.ts` ผ่าน
- `npm.cmd exec tsc -- --noEmit` ผ่าน
- `npm.cmd run lint` ยังไม่ผ่านจากปัญหาเดิมทั้ง repo ไม่ใช่จากไฟล์ที่แก้รอบนี้

### 2026-06-28 - จัดทำ project map และ security baseline

เป้าหมาย:
- ปรับ `PROJECT_STRUCTURE.md` และ `DEV_LOG.md` ให้เป็นเอกสารนำทางระยะยาวสำหรับทำงานร่วมกับ AI
- เพิ่มกรอบประเมินความเสี่ยง security/privacy ตาม OWASP, CIS/SANS, HIPAA, PDPA/GDPR, ISO/IEC 27001, ISO/IEC 27701 และ HAIT/TMI readiness แบบไม่ overengineering

ทำเสร็จ:
- อ่านโครงสร้างจริงของ repository จาก `app/`, `components/`, `lib/`, `supabase/migrations/`, `package.json`
- เขียน `PROJECT_STRUCTURE.md` ใหม่ให้ครอบคลุม public pages, staff portal, patient portal, admin area, API routes, shared libraries และ database tables
- เขียน `DEV_LOG.md` ใหม่เป็น UTF-8 พร้อมกติกาและ template สำหรับบันทึกงานรายวัน
- เพิ่ม security/compliance map ใน `PROJECT_STRUCTURE.md` พร้อม risks, controls ที่มีอยู่, gaps และ checklist ขั้นต่ำก่อน production/pilot

Security/Privacy:
- ระบุว่า patient/clinical data เป็น high sensitivity data
- ชี้ gap สำคัญที่ควรปิดก่อนใช้งานจริง: route protection สำหรับ `/admin`, raw token ใน audit payload, token expiry/rotation, rate limiter แบบ persistent, table allowlist สำหรับ generic helpers, RLS strategy และ backup governance
- ย้ำว่าเอกสารนี้เป็น readiness baseline ไม่ใช่การรับรองว่า compliant แล้ว

ปัญหา/ข้อสังเกต:
- ไฟล์ markdown เดิมมีอาการ encoding เพี้ยนในบาง output จึงเขียนใหม่เป็น UTF-8
- ยังไม่ได้ทำ code change ด้าน security จริงในรอบนี้ เป็นการจัดทำแผนที่และ assessment baseline
- HAIT/TMI ต้องตรวจเกณฑ์ล่าสุดกับเอกสาร/ผู้ประเมินโดยตรงก่อน audit จริง

Next steps:
- ปิด quick wins ด้าน security: protect `/admin`, ลดข้อมูลใน audit log, เพิ่ม allowlist ให้ generic DB helpers
- ทำ checklist สำหรับ production readiness และบันทึกผลใน log นี้
- รัน `npm run lint`, `npm test`, `npm run build` เมื่อเริ่มแก้โค้ดจริง

Verification:
- ตรวจโครงสร้างไฟล์ด้วย `rg --files`
- อ่านไฟล์สำคัญ: `package.json`, `proxy.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/patient/route.ts`, `lib/supabase.ts`, `lib/db.ts`, `lib/logger.ts`, `lib/rate-limit.ts`, `lib/schemas.ts`
- ไม่ได้รัน lint/test/build เพราะรอบนี้แก้เฉพาะเอกสาร
