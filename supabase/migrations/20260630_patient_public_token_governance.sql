-- Patient public token governance
-- Adds expiry/revoke/rotation metadata for patient-facing QR links.
-- Existing tokens remain valid unless explicitly revoked or given a past expiry.

ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS public_token_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS public_token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS public_token_revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS public_token_rotated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_patients_public_token_active
    ON patients (public_token)
    WHERE public_token_revoked_at IS NULL;
