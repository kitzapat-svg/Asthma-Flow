-- 1. Rename existing 'logs' table to preserve legacy data
ALTER TABLE IF EXISTS public.logs RENAME TO logs_old;

-- 2. Create the new 'logs' table with exactly the same schema as 'audit_logs'
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'AUTH'
  module TEXT NOT NULL,      -- 'PATIENT', 'VISIT', 'AUTH', 'MEDICATION', 'USER', 'SYSTEM'
  actor_id TEXT NOT NULL,    -- Staff email or user ID
  target_hn TEXT,           -- Normalized Patient HN
  payload JSONB,            -- { old_data: ..., new_data: ..., details: ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  formatted_time_th TEXT    -- "YYYY-MM-DD HH:mm:ss.SSS [UTC+7]"
);

-- 3. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_logs_target_hn ON public.logs(target_hn);
CREATE INDEX IF NOT EXISTS idx_logs_actor_id ON public.logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_logs_module ON public.logs(module);

-- 4. Update the combined cleanup function
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Cleanup dedicated 'audit_logs' table (if it exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
  END IF;
  
  -- Cleanup new 'logs' table
  DELETE FROM public.logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Cleanup the legacy 'logs_old' table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'logs_old') THEN
    -- If logs_old has 'timestamp' column (TIMESTAMPTZ), use it
    DELETE FROM public.logs_old 
    WHERE timestamp < (NOW() - INTERVAL '90 days');
  END IF;
END;
$$ LANGUAGE plpgsql;
