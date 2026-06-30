# SECURITY_READINESS.md

อัปเดตล่าสุด: 2026-06-30

เอกสารนี้เป็นหลักฐาน readiness แบบเบาสำหรับ Asthma-Flow ใช้ประกอบการพัฒนาและเตรียม audit ภายใน เช่น OWASP, CIS/SANS baseline, HIPAA/PDPA/GDPR privacy controls, ISMS/ISO privacy และ HAIT/TMI readiness

ไม่ใช่ใบรับรอง compliance และไม่แทนการตรวจประเมินจริง

## Current Security Posture

### Access Control

- Staff routes: protected by `proxy.ts` via NextAuth.
- Admin routes: `/admin/:path*` requires JWT role `Admin`.
- Medication master data API: `POST`, `PUT`, `DELETE` require `Admin`.
- User management and destructive patient/visit deletion: protected in `app/api/db/route.ts`.

Evidence:

- `proxy.ts`
- `app/api/medication-list/route.ts`
- `app/api/db/route.ts`

### Patient Public Link

- Patient public API requires `public_token` plus DOB verification.
- Raw public token is not written to audit payload; token events use `token_fingerprint`.
- Token metadata baseline exists: created, expires, revoked, rotated.
- New patient public tokens default to 1 year expiry.
- Admin-only rotate/revoke API is available; UI is still pending.

Evidence:

- `app/api/patient/route.ts`
- `lib/db.ts`
- `supabase/migrations/20260630_patient_public_token_governance.sql`

### Supabase Client Boundary

- Browser-safe Supabase anon client is in `lib/supabase.ts`.
- Service-role client is isolated in `lib/supabase-admin.ts`.
- `lib/supabase-admin.ts` imports `server-only` and validates required admin environment variables.
- Approved service-role uses today:
  - audit log insert in `lib/logger.ts`
  - backup/export in `app/api/backup/route.ts`
  - staff credential lookup in `lib/db.ts`

RLS note:

- The current app primarily enforces authorization in NextAuth route handlers and server actions.
- Enabling broad Supabase RLS immediately may break existing server-side anon-client flows because the app is not using Supabase Auth user identity for staff sessions.
- Before enabling RLS table-by-table, define policies that match the NextAuth/server model, or move sensitive server-side mutations to `supabaseAdmin` with narrow server-only wrappers.

Evidence:

- `lib/supabase.ts`
- `lib/supabase-admin.ts`
- `lib/logger.ts`
- `app/api/backup/route.ts`
- `lib/db.ts`

### Security Headers

Global headers are configured in `next.config.ts`:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

Evidence:

- `next.config.ts`

## Lightweight Audit Evidence Checklist

Keep this checklist current in `DEV_LOG.md` after each security-relevant change.

| Area | Evidence To Keep | Current Status |
| --- | --- | --- |
| Change log | Daily/task summary with files changed and verification | Active in `DEV_LOG.md` |
| Access review | Who has `Admin` and why | Pending operational review |
| Backup governance | Backup destination, access list, retention, restore test | Partial; backup exists, restore test pending |
| Incident response | Contact, severity, containment, notification workflow | Pending |
| Dependency review | `npm audit` result and accepted risks | Pending |
| Supabase schema | Migration files and RLS/service-role decision record | Partial; migration files exist |
| Patient privacy | Token lifecycle, audit log minimization, privacy notice alignment | Partial |
| HAIT evidence | Access control, audit trail, backup, change management, training proof | Partial |

## Verification Commands

Use these commands when closing a security task:

```bash
npm.cmd exec tsc -- --noEmit
npm.cmd exec eslint -- <changed-files>
npm.cmd exec supabase -- --version
```

Run full repo lint when addressing lint debt:

```bash
npm.cmd run lint
```

Current caveat: full repo lint has existing lint debt unrelated to the security quick wins.

## Next Security Tasks

1. Apply Supabase migrations to the target environment and record result.
2. Add Admin UI controls for patient token rotate/revoke.
3. Review backup PHI export to Google Sheets: access, retention, restore test, and token handling.
4. Decide RLS strategy table-by-table and record accepted risks.
5. Run dependency audit and document remediation/accepted risk.
6. Create short incident response procedure.
