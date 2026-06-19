# 🫁 Asthma-Flow (v1.5.4)

**Asthma-Flow** เป็นระบบบริหารจัดการคลินิกโรคหืด (Asthma Clinic Management System) ระดับเวิลด์คลาสและทันสมัยที่สุด ได้รับการพัฒนาด้วยสถาปัตยกรรม Next.js 16, React 19, และ TypeScript ร่วมกับการเชื่อมโยงฐานข้อมูล Supabase (PostgreSQL) และมีระบบสำรองข้อมูลอัตโนมัติรายวันไปยัง Google Sheets เพื่อเสถียรภาพสูงสุดของข้อมูล

ระบบถูกออกแบบด้วยความตระหนักในประสบการณ์ผู้ใช้งาน (UX/UI) ที่เป็นเลิศ โดยใช้ธีม **Warm Cream & Paper Theme (Claude-inspired)** สลับกับ **Softer Dark Slate Mode** ในโหมดมืด ผสานกับสไตล์ **Neo-brutalist** และ **Glassmorphism** ที่พรีเมียม สวยงาม ทันสมัย และลดความเมื่อยล้าทางสายตาของบุคลากรทางการแพทย์

---

## 🌟 ฟีเจอร์เด่นของระบบ (Core Features)

### 1. แดชบอร์ดหลักของคลินิก (Staff Clinical Dashboard)
*   **ระบบสถิติอัจฉริยะ:** แสดงอัตรากำลังคัดกรอง, ยอดผู้ป่วยเฉลี่ย, และจำนวนผู้ป่วยใหม่รายวัน/รายเดือนอย่างแม่นยำ โดยคำนวณจากแฟล็ก `is_new_case` จากตารางบันทึกการตรวจจริงในระบบ
*   **Next Tuesday Appointment Widget:** วิดเจ็ตอัจฉริยะสำหรับกรองแสดงรายชื่อผู้ป่วยที่มีนัดหมายในวันอังคารถัดไป พร้อมดรอปดาวน์ปรับช่วงเวลาได้ถึง 9 สัปดาห์ (ดูย้อนหลัง 4 สัปดาห์ และดูอนาคตล่วงหน้า 4 สัปดาห์) ช่วยในการบริหารทีมงานได้ล่วงหน้าอย่างมีประสิทธิภาพ

### 2. บันทึกประวัติการรักษาผู้ป่วย (Clinical Visit Entry)
*   **Form Mode Separation:** แยกสถานะแบบเด็ดขาดระหว่างการบันทึกประวัติการตรวจปกติประจำวัน (New Visit Mode) และการแก้ไขบันทึกย้อนหลัง (Edit Mode)
*   **Auto-fill Medications:** ระบบดึงข้อมูลยาเดิมจากครั้งล่าสุดของผู้ป่วยมาป้อนลงฟอร์มให้อัตโนมัติ พร้อมแจ้งเตือนผ่าน Toast Notification ช่วยย่นระยะเวลาการทำงานของบุคลากรได้อย่างยอดเยี่ยม
*   **Relative Pickup Prevention:** ออกแบบระบบให้ช่อง "ญาติรับยาแทน" จะไม่ถูกเช็คค่าเริ่มต้น เพื่อป้องกันการกรอกผิดพลาดโดยไม่ตั้งใจ
*   **1-Day-1-Visit Safeguard:** ระบบป้องกันการบันทึกประวัติการรักษาสนทนากลางซ้ำซ้อนในวันเดียวกันสำหรับผู้ป่วยรายคน เพื่อรักษาความสะอาดของฐานข้อมูล

### 3. บันทึกผล PEFR ประจำวันของพยาบาล (Nurse Daily PEFR Module)
*   **ระบบบันทึกตรวจเป่าปอดของวันปัจจุบัน:** หน้าจอเฉพาะสำหรับพยาบาลดึงรายชื่อผู้ป่วยที่มาวันนี้ เพื่อตรวจและบันทึกค่า PEFR พร้อมประเมินผลคำนวณเป็นเปอร์เซ็นต์ตามมาตรฐานทางการแพทย์ทันที
*   **Walk-in Patient Lookup:** ระบบค้นหาและเพิ่มผู้ป่วยกรณีเดินทางมาตรวจนอกตารางนัดหมาย (Walk-in) ได้อย่างรวดเร็ว โดยมีระบบตรวจสอบไม่ให้สร้างประวัติซ้ำซ้อน
*   **Medical Precision:** คำนวณค่า Predicted PEFR อ้างอิงตารางวิจัยมาตรฐานไทยของ *Dejsomritrutai 2000* และแสดงสัดส่วนร้อยละในทศนิยม 2 ตำแหน่ง (`%.2f`) เพื่อความถูกต้องแม่นยำสูงสุดทางการแพทย์

### 4. ระบบวิเคราะห์ปัญหาการใช้ยา (Pharmacist DRP Tracker)
*   **Drug-Related Problems (DRP) Matrix:** ระบบช่วยเภสัชกรคัดกรองวิเคราะห์ปัญหาจากการใช้ยา โดยสามารถกรอกหมวดหมู่ (Category), ชนิด (Type), สาเหตุ (Cause), แนวทางการแก้ไข (Intervention), และผลลัพธ์การดูแล (Outcome) เพื่อการติดตามผู้ป่วยแบบบูรณาการ

### 5. ประเมินและฝึกสอนเทคนิคพ่นยา (MDI Technique Checklist)
*   **8-Step MDI Evaluation:** หน้าเช็คลิสต์มาตรฐาน 8 ขั้นตอนสำหรับการประเมินพฤติกรรมการพ่นยาของผู้ป่วย เพื่อลดอัตราการพ่นยาผิดวิธี พร้อมระบบคำนวณคะแนนแสดงประวัติพัฒนาการย้อนหลัง

### 6. ใบแผนการควบคุมโรคหืดเฉพาะบุคคล (Asthma Action Plan Printable)
*   **Dynamic Sarabun Print Layout:** ระบบสร้างใบแผนการควบคุมโรคหืดเฉพาะบุคคล (Green / Yellow / Red Zones) ตามค่า PEFR ที่มีดีไซน์พอดีกระดาษ A4 (A4 Fit) ใช้ฟอนต์มาตรฐาน TH Sarabun สวยงามสะดุดตาและคมชัดสำหรับการพิมพ์แจกผู้ป่วย

### 7. บอร์ดคำแนะนำของบุคลากร (Staff Advice Carousel)
*   **Dynamic Auto-scroll Carousel:** แสดงคำแนะนำย้อนหลังของเจ้าหน้าที่บนแถบความรู้ข้างฟอร์มบันทึกการรักษา เล่นสลับอัตโนมัติพร้อมการควบคุมด้วยมือ
*   **Role-Based Deletion Protection:** จำกัดการลบตามสิทธิ์การใช้งาน เจ้าหน้าที่ธรรมดาสามารถลบข้อมูลที่ตนเขียนขึ้นมาได้เท่านั้น ขณะที่ผู้ดูแลระบบ (Admin) สามารถบริหารจัดการลบข้อมูลใดๆ ก็ได้

### 8. ระบบจัดการประเภทยาระดับสูง (Medication Master List)
*   **Brand & Generic Binding:** บัญชีรายชื่อยาทั้งยาควบคุมอาการ (Controller) และยาบรรเทาอาการ (Reliever) รองรับทั้งการระบุชื่อทางการค้า และชื่อสามัญทางยา (Generic Name) พร้อมระบบแก้ไขแบบอินไลน์ (Inline Edit UI)
*   **Active/Inactive Patient Status:** รองรับการทำเครื่องหมายคัดแยกผู้ป่วยที่ยุติการรักษา (Inactive) เพื่อลดความซ้ำซ้อนในการติดตามนัดหมาย

### 9. ระบบสำรองข้อมูลอัตโนมัติ (Automated Vercel Sheets Backup)
*   **Cron-Triggered Backup:** ระบบรัน Cron Job ทุกเที่ยงคืนผ่าน Vercel `/api/backup` ดึงข้อมูลทั้งหมดจาก Supabase สำรองทับลงบน Google Sheets
*   **Pagination Support:** สถาปัตยกรรมการดึงข้อมูลในระดับ Chunking รองรับการสำรองข้อมูลขนาดใหญ่จากตารางที่มีจำนวนมากกว่า 1,000 แถวได้อย่างมีประสิทธิภาพและไร้ปัญหาระบบล่ม

### 10. ระบบตรวจสอบสิทธิ์และเก็บบันทึกระบบ (Security & Auditing System)
*   **NextAuth Google Sign-In & Credentials Login:** ปลดล็อกตามสิทธิ์ผู้ใช้งาน (RBAC) ทั้งสิทธิ์ของ Admin, Pharmacist, Nurse, และ Staff ทั่วไป
*   **Strict UTC+7 Auditing:** ระบบจัดทำบันทึกประวัติการใช้งานอย่างโปร่งใส บันทึกการเพิ่ม ลบ แก้ไข นำเข้าข้อมูล และล็อกอิน ลงบนตาราง `logs` ใน Supabase บังคับใช้โซนเวลาประเทศไทย (Asia/Bangkok) ในฟอร์แมต `YYYY-MM-DD HH:mm:ss.SSS [UTC+7]` ทุกตารางอย่างเคร่งครัด
*   **PDPA Cookie Consent & Access Validation:** มีระบบ Pop-up ความยินยอมคุ้มครองข้อมูลส่วนบุคคล (PDPA) พร้อมการเข้าชมประวัติผ่านการยืนยันวันเดือนปีเกิด (DOB Verification) เมื่อเข้าผ่าน QR Code

---

## 🛠️ เทคโนโลยีที่เลือกใช้ (Technology Stack)

| เลเยอร์ (Layer) | เทคโนโลยีที่เลือกใช้ (Technology) | เวอร์ชัน (Version) |
|---|---|---|
| **Framework** | Next.js (App Router, Server Components) | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS (v4 พร้อมสไตล์ Inline Theme) | 4.x |
| **Database** | Supabase (PostgreSQL Client & Admin Service) | ^2.101.1 |
| **Authentication** | NextAuth.js | ^4.24.5 |
| **External Integration** | Google APIs Node.js SDK (Sheets API v4) | ^140.0.0 |
| **Charts** | Recharts | ^2.12.0 |
| **Motion** | Framer Motion | ^12.29.2 |
| **Unit Testing** | Vitest, React Testing Library | ^4.0.18 |

---

## 📂 โครงสร้างโฟลเดอร์ของโครงการ (Project Directory Structure)

```
Asthma-Flow/
├── actions/                # Server Actions สำหรับระบบ
├── app/                    # Next.js App Router (โครงสร้างหน้าเว็บและ API)
│   ├── api/               # API Route Handlers (Auth, Data Synchronize, Backup System)
│   │   ├── backup/        # Vercel Cron Daily Backup endpoint (Supabase -> Google Sheets)
│   │   ├── db/            # Database synchronization endpoints
│   │   └── patient/       # API จัดการข้อมูลผู้ป่วยรายคน
│   ├── staff/             # ระบบย่อยของกลุ่มเจ้าหน้าที่ (Dashboard, Patients, Visit, Stats)
│   │   ├── dashboard/     # หน้าสถิติและตารางนัดหมายวันอังคารถัดไป
│   │   ├── today-pefr/    # หน้าบันทึก PEFR ประจำวันกลุ่มพยาบาล
│   │   └── visit/         # หน้าบันทึกและแก้ไขประวัติการตรวจ (Edit & New visit)
│   ├── patient/           # ระบบตรวจสอบฝั่งผู้ป่วยผ่านลิงก์สาธารณะและ QR
│   ├── auth/              # หน้าจอเข้าสู่ระบบรักษาความปลอดภัย (Signin Page)
│   ├── globals.css        # สไตล์หลักและชุดตัวแปรดีไซน์ Tailwind CSS v4 Neo-brutalist
│   └── layout.tsx         # โครงสร้าง Layout หลักของเว็บแอปพลิเคชัน
├── components/            # คอมโพเนนต์ React ส่วนกลาง
│   ├── ui/                # shadcn/ui อะตอมมิกดีไซน์ระดับล่าง (Button, Modal, Skeleton)
│   ├── animated/          # คอมโพเนนต์ภาพเคลื่อนไหวอนิเมชันระดับพรีเมียม
│   ├── sections/          # เลย์เอาต์เฉพาะส่วน (Header, Footer, Navbar)
│   └── cookie-consent.tsx # คอมโพเนนต์ยืนยันข้อตกลงคุ้มครองข้อมูลส่วนบุคคล (PDPA)
├── lib/                   # ไลบรารีและ Data Access Layer (DAL)
│   ├── db.ts              # Data Access Layer สื่อสาร Supabase (CRUD, Row Edit Handling)
│   ├── supabase.ts        # การกำหนดตั้งค่าไคลเอนต์ Supabase (Anon Key & Admin)
│   ├── sheets.ts          # ตัวเชื่อมต่อสำรองข้อมูล Google Sheets API
│   ├── logger.ts          # ระบบตรวจสอบและเก็บบันทึกประวัติการกระทำแบบ UTC+7
│   ├── pef-reference.ts   # ตารางวิจัย predicted PEFR (Dejsomritrutai 2000)
│   └── date-utils.ts      # ฟังก์ชันจัดการแปลงเวลาเป็นโซนกรุงเทพฯ (GMT+7)
├── public/                # Static assets (ไอคอน, รูปภาพ)
├── scripts/               # ชุดสคริปต์เสริมสำหรับอำนวยความสะดวกการทำระบบ
├── types/                 # โครงสร้าง Type definition (TypeScript)
├── package.json           # รายการแพ็กเกจที่ต้องการใช้งาน
└── AGENTS.md              # กฎและข้อบังคับในการพัฒนาโปรเจกต์สำหรับ AI coding agents
```

---

## 🏗️ โครงสร้างฐานข้อมูล (Database Schema Details)

แอปพลิเคชันจัดเก็บข้อมูลหลักอยู่บน **Supabase PostgreSQL** โดยแบ่งความสัมพันธ์ออกเป็นดังนี้:

```mermaid
erDiagram
    patients ||--o{ visits : "has"
    patients ||--o{ medications : "receives"
    patients ||--o{ technique_checks : "performs"
    patients ||--o{ drps : "reported"
    patients ||--o{ staff_advice : "receives"

    patients {
        string hn PK
        string prefix
        string first_name
        string last_name
        date dob
        float height
        int best_pefr
        string status
        string public_token
        string phone
    }

    visits {
        int id PK
        string hn FK
        date visit_date
        int pefr
        string control_level
        string controller
        string reliever
        boolean is_new_case
        int inhaler_score
        string technique_check
        date next_appt
        string note
    }

    medications {
        int id PK
        string hn FK
        date date
        string c1_name
        string c1_puffs
        string c1_freq
        string c2_name
        string c2_puffs
        string c2_freq
        string reliever_name
        string reliever_label
        string note
    }

    technique_checks {
        int id PK
        string hn FK
        date date
        string step1
        string step2
        string step3
        string step4
        string step5
        string step6
        string step7
        string step8
        int score
        string note
    }

    drps {
        uuid id PK
        string hn FK
        date visit_date
        string category
        string type
        string cause
        string intervention
        string outcome
        string note
        timestamp created_date
    }
```

*   **`patients`**: ข้อมูลทะเบียนประวัติผู้ป่วย ระบุเลข HN เป็นคีย์หลัก (Primary Key)
*   **`visits`**: ประวัติการรักษารายครั้ง บันทึกความเสถียรของโรคหืด, ระดับ PEFR, ผลประเมิน และวันนัดครั้งต่อไป
*   **`medications`**: รายละเอียดการรับยาที่ผู้ป่วยพ่นจริง
*   **`technique_checks`**: คะแนนและผลการประเมินวิธีกดพ่นยา MDI 8 ขั้นตอน
*   **`drps`**: ตารางบันทึกปัญหาการใช้ยาสำหรับทีมเภสัชกร
*   **`staff_advice`**: ประวัติบันทึกคำแนะนำของคลินิก
*   **`medication_list`**: ตาราง Master ยาในระบบ แยกเป็น Controller และ Reliever พร้อมชื่อสามัญ
*   **`users`**: รายชื่อบัญชีผู้ใช้งานระบบ พร้อมบทบาทควบคุมสิทธิ์ (Role-Based Access Control)
*   **`logs`**: เก็บบันทึกความปลอดภัยระบบ (Audit Logs) ทั้งการ Auth และการทำ CRUD โดยบังคับโซนเวลากรุงเทพฯ (GMT+7) เสมอ

---

## 🚀 เริ่มต้นใช้งานและตั้งค่า (Getting Started & Setup)

### 1. การติดตั้งไลบรารีและแพ็กเกจ
แนะนำให้ใช้งานผ่าน **npm** หรือ **bun** ตามไฟล์ล็อกที่มีอยู่ในระบบ:

```bash
# ติดตั้ง dependencies ผ่าน npm
npm install

# หรือใช้งานผ่าน bun
bun install
```

### 2. การกำหนดค่าตัวแปรสภาพแวดล้อม (Environment Variables Setup)
สร้างไฟล์ `.env.local` ไว้ที่โฟลเดอร์หลักของโปรเจกต์ และระบุค่าตัวแปรก่อนรันแอปพลิเคชัน:

```env
# Google OAuth configuration for NextAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="your-nextauth-secret-key-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Supabase database connectivity
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" # สำหรับข้ามสิทธิ์ RLS ในการ Backup/Cron และ API แอดมิน

# Google Sheets API configuration (For backup system)
GOOGLE_CLIENT_EMAIL="your-service-account-email@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourSecretPrivateKey...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID="your-spreadsheet-id"

# System Admin Fallback Account
ADMIN_PASSWORD="your-secure-admin-password"

# Allowed staff emails list for Google authentication
ALLOWED_EMAILS="staff1@gmail.com,staff2@hospital.com"
```

### 3. คำสั่งพัฒนาและทดสอบระบบ (CLI Commands)

```bash
# 1. รันระบบเซิร์ฟเวอร์บนสภาพแวดล้อมจำลอง (Development Server)
npm run dev
# เปิดลิงก์ http://localhost:3000 บนเว็บเบราว์เซอร์เพื่อเข้าชมระบบ

# 2. ทำการตรวจสอบโครงสร้างโค้ดและมาตรฐานการเขียน (Linting check)
npm run lint

# 3. รันระบบทดสอบระดับหน่วย (Unit Testing with Vitest)
npm test

# 4. คอมไพล์โปรเจกต์เพื่อนำส่งเข้าเซิร์ฟเวอร์จำลองการผลิต (Production Build)
npm run build

# 5. สตาร์ตเซิร์ฟเวอร์แบบ Production
npm start
```

---

## 🔒 แนวทางความปลอดภัยทางการแพทย์ (Medical Security & Compliance)
*   **การปกป้องสิทธิ์ผู้ป่วย (Patient Privacy):** ลิงก์ตรวจสอบประวัติยาล่าสุดของผู้ป่วยภายนอกผ่านการสแกน QR Code จะเข้าถึงได้ก็ต่อเมื่อระบุ วัน/เดือน/ปีเกิด (DOB) ได้อย่างถูกต้องเท่านั้น
*   **การป้องกันความปลอดภัย (RLS & Service Role):** แอปพลิเคชันฝั่งผู้ใช้งานทั่วไปจะเข้าใช้ผ่าน Anon Key ของ Supabase ซึ่งมีนโยบายควบคุมความปลอดภัยในระดับแถว (Row-Level Security) อย่างหนาแน่น ส่วนสคริปต์ระบบสำรองข้อมูลหรือแอดมินลบข้อมูลเท่านั้นที่จะได้สิทธิ์เรียกผ่าน `supabaseAdmin` (Service Role Key)
*   **การเก็บบันทึกระบบ (System Audit Trail):** การเข้าใช้ระบบและการแก้ไข/ลบข้อมูลที่เป็นความลับของผู้ป่วยจะถูกส่งไปที่ส่วนบันทึก (Logging System) เพื่อป้องกันข้อมูลสูญหายและการเข้าถึงโดยมิชอบอย่างถาวร

---

## 📄 ใบอนุญาต (License)
ลิขสิทธิ์ของคลินิกโรคหืดและการพัฒนาแอปพลิเคชัน จัดการภายใต้สัญญาอนุญาตสิทธิ์ภายในของศูนย์บริการรักษาโรคและสถาบันเครือข่ายของแอปพลิเคชัน Asthma-Flow ห้ามลอกเลียนแบบหรือใช้งานโดยมิได้รับอนุญาตอย่างเป็นทางการ
