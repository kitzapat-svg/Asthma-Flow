-- SQL Migration: DRP System Redesign
-- Date: 2026-06-16

-- 1. Create DRP Dropdown Lists Configurations Tables

-- DRP Categories (Indication, Effectiveness, Safety, Compliance)
CREATE TABLE IF NOT EXISTS drp_categories (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DRP Types (e.g. 1.1 Untreated Indication)
CREATE TABLE IF NOT EXISTS drp_types (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES drp_categories(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, code)
);

-- DRP Causes (e.g. ยังไม่ได้รับยาควบคุมอาการ)
CREATE TABLE IF NOT EXISTS drp_causes (
    id SERIAL PRIMARY KEY,
    type_id INT NOT NULL REFERENCES drp_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DRP Interventions
CREATE TABLE IF NOT EXISTS drp_interventions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DRP Outcomes
CREATE TABLE IF NOT EXISTS drp_outcomes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Alter existing `drps` table to support status, audit fields
DO $$ 
BEGIN
    -- status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drps' AND column_name = 'status') THEN
        ALTER TABLE drps ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
    END IF;

    -- created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drps' AND column_name = 'created_by') THEN
        ALTER TABLE drps ADD COLUMN created_by TEXT;
    END IF;

    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drps' AND column_name = 'updated_at') THEN
        ALTER TABLE drps ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- updated_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drps' AND column_name = 'updated_by') THEN
        ALTER TABLE drps ADD COLUMN updated_by TEXT;
    END IF;

    -- closed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drps' AND column_name = 'closed_at') THEN
        ALTER TABLE drps ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    -- closed_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drps' AND column_name = 'closed_by') THEN
        ALTER TABLE drps ADD COLUMN closed_by TEXT;
    END IF;
END $$;

-- 3. Create index for status and hn
CREATE INDEX IF NOT EXISTS idx_drps_status ON drps(status);
CREATE INDEX IF NOT EXISTS idx_drps_hn_status ON drps(hn, status);

-- 4. Create DRP History tracking table
CREATE TABLE IF NOT EXISTS drp_history (
    id BIGSERIAL PRIMARY KEY,
    drp_id UUID NOT NULL REFERENCES drps(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'CLOSE', 'REOPEN', 'DELETE'
    changed_by TEXT NOT NULL, -- staff username
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changes JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_drp_history_drp_id ON drp_history(drp_id);
CREATE INDEX IF NOT EXISTS idx_drp_history_changed_at ON drp_history(changed_at DESC);

-- 5. Seed initial config tables if empty
-- Categories
INSERT INTO drp_categories (code, name, sort_order) VALUES
('1', '1. ปัญหาด้านความจำเป็น (Indication)', 1),
('2', '2. ปัญหาด้านประสิทธิภาพ (Effectiveness)', 2),
('3', '3. ปัญหาด้านความปลอดภัย (Safety)', 3),
('4', '4. ปัญหาด้านความร่วมมือในการใช้ยา (Compliance / Adherence)', 4)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Helper variables to reference parent IDs
-- Let's populate the child tables dynamically
DO $$
DECLARE
    cat1_id INT;
    cat2_id INT;
    cat3_id INT;
    cat4_id INT;
    
    t1_1_id INT;
    t1_2_id INT;
    t2_1_id INT;
    t2_2_id INT;
    t3_1_id INT;
    t3_2_id INT;
    t3_3_id INT;
    t4_1_id INT;
    t4_2_id INT;
    t4_3_id INT;
    t4_4_id INT;
BEGIN
    SELECT id INTO cat1_id FROM drp_categories WHERE code = '1';
    SELECT id INTO cat2_id FROM drp_categories WHERE code = '2';
    SELECT id INTO cat3_id FROM drp_categories WHERE code = '3';
    SELECT id INTO cat4_id FROM drp_categories WHERE code = '4';

    -- Seed Types
    INSERT INTO drp_types (category_id, code, name, sort_order) VALUES
    (cat1_id, '1.1', '1.1 มีข้อบ่งใช้แต่ไม่ได้รับยา (Untreated Indication)', 1),
    (cat1_id, '1.2', '1.2 ได้รับยาโดยไม่มีข้อบ่งใช้ (Drug Use Without Indication)', 2)
    ON CONFLICT (category_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
    
    INSERT INTO drp_types (category_id, code, name, sort_order) VALUES
    (cat2_id, '2.1', '2.1 การเลือกใช้ยาไม่เหมาะสม (Improper Drug Selection)', 1),
    (cat2_id, '2.2', '2.2 ขนาดยาหรือความถี่ต่ำเกินไป (Subtherapeutic Dosage)', 2)
    ON CONFLICT (category_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
    
    INSERT INTO drp_types (category_id, code, name, sort_order) VALUES
    (cat3_id, '3.1', '3.1 ขนาดยาหรือความถี่สูงเกินไป (Overdosage)', 1),
    (cat3_id, '3.2', '3.2 อาการไม่พึงประสงค์จากยา (Adverse Drug Reaction - ADR)', 2),
    (cat3_id, '3.3', '3.3 ปฏิกิริยาระหว่างยา (Drug Interaction)', 3)
    ON CONFLICT (category_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
    
    INSERT INTO drp_types (category_id, code, name, sort_order) VALUES
    (cat4_id, '4.1', '4.1 เทคนิคการใช้ยาไม่ถูกต้อง (Improper Inhaler Technique)', 1),
    (cat4_id, '4.2', '4.2 ความไม่ร่วมมือแบบไม่ได้ตั้งใจ (Unintentional Non-adherence)', 2),
    (cat4_id, '4.3', '4.3 ความไม่ร่วมมือแบบตั้งใจ (Intentional Non-adherence)', 3),
    (cat4_id, '4.4', '4.4 ปัญหาด้านการเข้าถึงยา (Barrier to Drug Access)', 4)
    ON CONFLICT (category_id, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

    -- Retrieve Type IDs
    SELECT id INTO t1_1_id FROM drp_types WHERE code = '1.1';
    SELECT id INTO t1_2_id FROM drp_types WHERE code = '1.2';
    SELECT id INTO t2_1_id FROM drp_types WHERE code = '2.1';
    SELECT id INTO t2_2_id FROM drp_types WHERE code = '2.2';
    SELECT id INTO t3_1_id FROM drp_types WHERE code = '3.1';
    SELECT id INTO t3_2_id FROM drp_types WHERE code = '3.2';
    SELECT id INTO t3_3_id FROM drp_types WHERE code = '3.3';
    SELECT id INTO t4_1_id FROM drp_types WHERE code = '4.1';
    SELECT id INTO t4_2_id FROM drp_types WHERE code = '4.2';
    SELECT id INTO t4_3_id FROM drp_types WHERE code = '4.3';
    SELECT id INTO t4_4_id FROM drp_types WHERE code = '4.4';

    -- Seed Causes
    -- 1.1
    DELETE FROM drp_causes WHERE type_id = t1_1_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t1_1_id, 'ยังไม่ได้รับยาควบคุมอาการ (No controller prescribed - เช่น ไม่ได้ ICS)', 1),
    (t1_1_id, 'มีโรคร่วมที่กระตุ้นหอบหืดแต่ยังไม่ได้รับการรักษา (เช่น ภูมิแพ้จมูกอักเสบ, กรดไหลย้อน, ไซนัสอักเสบ)', 2),
    (t1_1_id, 'ผู้ป่วยมีข้อบ่งชี้ แต่ยังไม่ได้รับวัคซีนที่จำเป็น (เช่น ไข้หวัดใหญ่, นิวโมคอกคัส)', 3),
    (t1_1_id, 'แพทย์ยังไม่ได้ปรับเพิ่มสเต็ปยา (No Step-up) ทั้งที่คุมอาการไม่ได้', 4),
    (t1_1_id, 'อื่นๆ (ระบุ)...', 5);

    -- 1.2
    DELETE FROM drp_causes WHERE type_id = t1_2_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t1_2_id, 'ได้รับยาซ้ำซ้อน (Therapeutic duplication เช่น MDI กับ DPI ตัวเดียวกัน)', 1),
    (t1_2_id, 'คุมอาการได้ดีต่อเนื่องเกิน 3 เดือน แต่ยังไม่ได้ปรับลดยา (No Step-down)', 2),
    (t1_2_id, 'สั่งจ่ายยาที่ผู้ป่วยไม่มีความจำเป็นต้องใช้แล้ว', 3),
    (t1_2_id, 'อื่นๆ (ระบุ)...', 4);

    -- 2.1
    DELETE FROM drp_causes WHERE type_id = t2_1_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t2_1_id, 'สั่งจ่ายยา SABA เดี่ยวๆ โดยไม่มี ICS', 1),
    (t2_1_id, 'เลือกรูปแบบอุปกรณ์พ่นยา (Device) ไม่เหมาะสมกับผู้ป่วย (เช่น ผู้สูงอายุ/เด็กเล็ก)', 2),
    (t2_1_id, 'มียาตัวอื่นที่มีประสิทธิภาพดีกว่าหรือเหมาะสมกว่าใน Step การรักษาปัจจุบัน', 3),
    (t2_1_id, 'อื่นๆ (ระบุ)...', 4);

    -- 2.2
    DELETE FROM drp_causes WHERE type_id = t2_2_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t2_2_id, 'แพทย์สั่งจ่ายขนาดยา (Dose) ต่ำเกินไป ไม่เพียงพอต่อการควบคุมโรค', 1),
    (t2_2_id, 'แพทย์สั่งจ่ายความถี่ในการพ่นยา (Frequency) น้อยเกินไป', 2),
    (t2_2_id, 'อื่นๆ (ระบุ)...', 3);

    -- 3.1
    DELETE FROM drp_causes WHERE type_id = t3_1_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t3_1_id, 'พึ่งพายาขยายหลอดลมฉุกเฉินมากเกินไป (SABA Over-reliance)', 1),
    (t3_1_id, 'แพทย์สั่งจ่ายขนาดยา (Dose) หรือความถี่ (Frequency) สูงเกินความจำเป็น', 2),
    (t3_1_id, 'อื่นๆ (ระบุ)...', 3);

    -- 3.2
    DELETE FROM drp_causes WHERE type_id = t3_2_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t3_2_id, 'เกิดเชื้อราในช่องปาก (Oral thrush)', 1),
    (t3_2_id, 'เสียงแหบ / ระคายคอ (Hoarseness / Dysphonia)', 2),
    (t3_2_id, 'ใจสั่น / มือสั่น / หัวใจเต้นผิดจังหวะ (Palpitations / Tremor)', 3),
    (t3_2_id, 'มีอาการแพ้ยา (Allergic reaction เช่น ผื่นคัน, บวม)', 4),
    (t3_2_id, 'อื่นๆ (ระบุ)...', 5);

    -- 3.3
    DELETE FROM drp_causes WHERE type_id = t3_3_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t3_3_id, 'ได้รับยาที่กระตุ้นให้หอบหืดกำเริบ (เช่น NSAIDs/Aspirin, Non-selective Beta-blockers)', 1),
    (t3_3_id, 'ได้รับยาที่ตีกันทางเภสัชจลนศาสตร์ (เช่น กลุ่ม Macrolides กับ Theophylline)', 2),
    (t3_3_id, 'อื่นๆ (ระบุ)...', 3);

    -- 4.1
    DELETE FROM drp_causes WHERE type_id = t4_1_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t4_1_id, 'ไม่ได้พ่นลมหายใจออกให้สุดก่อนสูดยา', 1),
    (t4_1_id, 'แรงสูดไม่เพียงพอ / สูดไม่แรงและเร็วพอ (สำหรับ DPI)', 2),
    (t4_1_id, 'สูดเร็วและแรงเกินไป (สำหรับ MDI)', 3),
    (t4_1_id, 'การกดหลอดยาและการสูดหายใจไม่สัมพันธ์กัน (Poor hand-breath coordination)', 4),
    (t4_1_id, 'ไม่กลั้นหายใจหลังสูดยา (No breath-holding 5-10 วินาที)', 5),
    (t4_1_id, 'ไม่ได้บ้วนปากและกลั้วคอหลังพ่นยาที่มีสเตียรอยด์ (ICS)', 6),
    (t4_1_id, 'ประกอบอุปกรณ์ผิด / ทำความสะอาดอุปกรณ์หรือ Spacer ผิดวิธี', 7),
    (t4_1_id, 'อื่นๆ (ระบุ)...', 8);

    -- 4.2
    DELETE FROM drp_causes WHERE type_id = t4_2_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t4_2_id, 'ผู้ป่วยลืมพ่นยา (Forgetfulness)', 1),
    (t4_2_id, 'ผู้ป่วยเข้าใจคำสั่งแพทย์หรือเภสัชกรผิด (Misunderstanding)', 2),
    (t4_2_id, 'ผู้ดูแลหรือญาติพ่นยาให้ไม่ถูกต้อง', 3),
    (t4_2_id, 'มีปัญหาข้อจำกัดทางกายภาพ (เช่น นิ้วล็อค กดขวดพ่นยาไม่ได้)', 4),
    (t4_2_id, 'อื่นๆ (ระบุ)...', 5);

    -- 4.3
    DELETE FROM drp_causes WHERE type_id = t4_3_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t4_3_id, 'หยุดยาเอง หรือ พ่นห่างขึ้น เพราะคิดว่าอาการดีขึ้นแล้ว', 1),
    (t4_3_id, 'พ่นเฉพาะตอนมีอาการหอบกำเริบเท่านั้น (ใช้ยา Controller ผิดวัตถุประสงค์)', 2),
    (t4_3_id, 'กลัวผลข้างเคียงของยาสเตียรอยด์ (Steroid phobia)', 3),
    (t4_3_id, 'เบื่อหน่ายที่ต้องใช้ยาเป็นประจำทุกวัน (Treatment fatigue)', 4),
    (t4_3_id, 'อื่นๆ (ระบุ)...', 5);

    -- 4.4
    DELETE FROM drp_causes WHERE type_id = t4_4_id;
    INSERT INTO drp_causes (type_id, name, sort_order) VALUES
    (t4_4_id, 'ยาหมดก่อนวันนัด', 1),
    (t4_4_id, 'ขาดนัดแพทย์ (Missed appointment)', 2),
    (t4_4_id, 'ทำยาหาย / อุปกรณ์พ่นยาชำรุดเสียหาย', 3),
    (t4_4_id, 'ปัญหาด้านเศรษฐานะ / สิทธิการรักษา', 4),
    (t4_4_id, 'อื่นๆ (ระบุ)...', 5);
END $$;

-- Seed Interventions
INSERT INTO drp_interventions (name, sort_order) VALUES
('แนะนำเทคนิคการใช้ยาที่ถูกต้อง', 1),
('ปรับเปลี่ยนรูปแบบ/อุปกรณ์พ่นยา', 2),
('ปรึกษาแพทย์ปรับเพิ่มขนาดยา (Step-up)', 3),
('ปรึกษาแพทย์ปรับลดขนาดยา (Step-down)', 4),
('ปรึกษาแพทย์เพิ่มการรักษา/ยาที่ผู้ป่วยสมควรได้รับ', 5),
('ปรึกษาแพทย์และแนะนำผู้ป่วยเนื่องจากเกิดอาการไม่พึงประสงค์จากยา', 6),
('ปรึกษาแพทย์ในการเลือกใช้ยาให้เหมาะสมกับผู้ป่วย', 7),
('ปรึกษาแพทย์และแนะนำผู้ป่วยเรื่องการติดตามประสิทธิผลของยา', 8),
('ปรึกษาแพทย์และแนะนำผู้ป่วยเรื่องติดตามความปลอดภัยในการใช้ยา', 9),
('แนะนำผู้ป่วยเรื่องความร่วมมือในการใช้ยา', 10),
('แนะนำให้หลีกเลี่ยงปัจจัยกระตุ้น/การปฏิบัติตัว', 11),
('โทรปรึกษาแพทย์เพื่อพิจารณาการรักษาผู้ป่วย', 12),
('อื่นๆ (ระบุ)...', 13)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- Seed Outcomes
INSERT INTO drp_outcomes (name, sort_order) VALUES
('แก้ไขปัญหาสำเร็จ (Resolved)', 1),
('อยู่ระหว่างติดตามผล (Monitoring / Follow-up required)', 2),
('ผู้ป่วย/แพทย์ปฏิเสธการแก้ไข (Refused intervention)', 3),
('จัดการไม่สำเร็จ', 4),
('อื่นๆ (ระบุ)...', 5)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- 6. Migrate status of existing DRP records
-- "Set all existing DRPs to status = 'open' unless their outcome contains 'Resolved' or 'สำเร็จ' (then set to 'resolved'). Leave created_by as null for historical records."
UPDATE drps 
SET status = 'resolved' 
WHERE outcome LIKE '%Resolved%' OR outcome LIKE '%สำเร็จ%' AND status = 'open';
