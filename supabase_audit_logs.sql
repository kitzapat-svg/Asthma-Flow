-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'IMPORT'
  module TEXT NOT NULL,      -- 'PATIENT', 'VISIT', 'AUTH', 'MEDICATION'
  actor_id TEXT NOT NULL,    -- Staff email or username
  target_hn TEXT,           -- Normalized Patient HN
  payload JSONB,            -- { old_data: ..., new_data: ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  formatted_time_th TEXT    -- "YYYY-MM-DD HH:mm:ss.SSS [UTC+7]"
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_hn ON audit_logs(target_hn);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);

-- ---------------------------------------------------------
-- RETENTION POLICY: Keep logs for 90 days
-- ---------------------------------------------------------

-- 1. Enable the pg_cron extension (Run this in Supabase Dashboard -> Database -> Extensions)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Cleanup Function
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Also cleanup the legacy 'logs' table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'logs') THEN
    DELETE FROM logs WHERE timestamp < (NOW() - INTERVAL '90 days')::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule Daily Cleanup at 00:00 (UTC/Server Time)
-- You must have 'pg_cron' enabled for this to work.
-- SELECT cron.schedule('cleanup-audit-logs', '0 0 * * *', 'SELECT delete_old_audit_logs()');
