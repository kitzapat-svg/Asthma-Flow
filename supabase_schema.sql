-- Supabase Schema for Asthma-Flow

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    hn TEXT PRIMARY KEY, -- 7-digit string
    prefix TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    best_pefr INTEGER,
    height NUMERIC,
    status TEXT DEFAULT 'Active',
    public_token TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Visits Table
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hn TEXT REFERENCES public.patients(hn) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    pefr INTEGER,
    control_level TEXT,
    controller TEXT,
    reliever TEXT,
    adherence TEXT,
    drp TEXT,
    advice TEXT,
    technique_check TEXT,
    next_appt DATE,
    note TEXT,
    is_new_case BOOLEAN DEFAULT FALSE,
    inhaler_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DRPs Table
CREATE TABLE IF NOT EXISTS public.drps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hn TEXT REFERENCES public.patients(hn) ON DELETE CASCADE,
    created_date DATE DEFAULT CURRENT_DATE,
    visit_date DATE,
    category TEXT,
    type TEXT,
    cause TEXT,
    intervention TEXT,
    outcome TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hn TEXT REFERENCES public.patients(hn) ON DELETE CASCADE,
    date DATE NOT NULL,
    c1_name TEXT,
    c1_puffs TEXT,
    c1_freq TEXT,
    c2_name TEXT,
    c2_puffs TEXT,
    c2_freq TEXT,
    reliever_name TEXT,
    reliever_label TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Technique Checks Table
CREATE TABLE IF NOT EXISTS public.technique_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hn TEXT REFERENCES public.patients(hn) ON DELETE CASCADE,
    date DATE NOT NULL,
    step1 TEXT,
    step2 TEXT,
    step3 TEXT,
    step4 TEXT,
    step5 TEXT,
    step6 TEXT,
    step7 TEXT,
    step8 TEXT,
    score INTEGER,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Staff Advice Table
CREATE TABLE IF NOT EXISTS public.staff_advice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hn TEXT REFERENCES public.patients(hn) ON DELETE CASCADE,
    staff_username TEXT,
    staff_name TEXT,
    staff_position TEXT,
    advice TEXT,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medication List Table (Master List)
CREATE TABLE IF NOT EXISTS public.medication_list (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'Controller' or 'Reliever'
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff',
    name TEXT,
    email TEXT,
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    email TEXT,
    action TEXT,
    details TEXT
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_hn ON public.visits(hn);
CREATE INDEX IF NOT EXISTS idx_drps_hn ON public.drps(hn);
CREATE INDEX IF NOT EXISTS idx_medications_hn ON public.medications(hn);
CREATE INDEX IF NOT EXISTS idx_technique_checks_hn ON public.technique_checks(hn);
CREATE INDEX IF NOT EXISTS idx_staff_advice_hn ON public.staff_advice(hn);
