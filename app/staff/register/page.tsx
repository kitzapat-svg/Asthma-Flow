"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, UserPlus, AlertCircle } from 'lucide-react';


// 1. สร้าง Schema กฎการตรวจสอบข้อมูล (Validation Rules)
const registerSchema = z.object({
  hn: z.string().min(1, "กรุณากรอก HN").regex(/^\d+$/, "HN ต้องเป็นตัวเลขเท่านั้น"),
  prefix: z.string(),
  first_name: z.string().min(1, "กรุณากรอกชื่อจริง"),
  last_name: z.string().min(1, "กรุณากรอกนามสกุล"),
  dob: z.string().refine((date) => date !== "", "กรุณาระบุวันเกิด"),
  height: z.string().min(1, "กรุณาระบุส่วนสูง").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "ส่วนสูงต้องเป็นตัวเลข"),
  phone: z.string().regex(/^0\d{9}$/, "เบอร์โทรต้องเป็นตัวเลข 10 หลัก (เช่น 0812345678)").optional().or(z.literal('')),
  status: z.string(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPatientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. เรียกใช้ React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      hn: '',
      prefix: 'นาย',
      first_name: '',
      last_name: '',
      dob: '',
      height: '',
      phone: '',
      status: 'Active',
    },
  });

  // Helper: สร้าง Token UUID
  const generateToken = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Auto-pad HN
      const formattedHN = data.hn.trim().padStart(7, '0');

      // 2. Check Duplicate
      const checkRes = await fetch(`/api/db?type=patients&hn=${formattedHN}`);
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        alert(`❌ HN: ${formattedHN} มีในระบบแล้ว!`);
        setIsSubmitting(false);
        return;
      }

      // 3. Prepare Data
      const token = generateToken();
      const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
      const h = parseFloat(data.height);
      let predicted = 0;

      if (['นาย', 'ด.ช.'].includes(data.prefix)) {
        predicted = (5.48 * h) - (1.51 * age) - 279.7;
      } else {
        predicted = (3.72 * h) - (2.24 * age) - 96.6;
      }
      predicted = Math.max(0, Math.round(predicted));

      const patientData = [
        formattedHN,
        data.prefix,
        data.first_name.trim(),
        data.last_name.trim(),
        data.dob,
        predicted.toString(),
        data.height,
        data.status,
        token,
        data.phone ? data.phone.trim() : ""
      ];

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'patients', data: patientData })
      });

      if (res.ok) {
        alert(`✅ ลงทะเบียนสำเร็จ!\nHN: ${formattedHN}`);
        router.push('/staff/dashboard');
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error(error);
      alert("Server Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper สำหรับ Input Style
  const inputClass = (error?: any) => `w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 ${error ? 'border-red-500 focus:border-red-500' : 'border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736]'} outline-none font-bold dark:text-white transition-colors`;

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      <nav className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] font-bold">
          <ArrowLeft size={20} /> ยกเลิก
        </button>

      </nav>

      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">ลงทะเบียนผู้ป่วยใหม่</h1>
            <p className="text-[#6B6560] dark:text-zinc-400 font-medium">ระบบตรวจสอบข้อมูลอัตโนมัติ (Zod Validation)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* HN */}
          <div>
            <label className="block text-sm font-bold mb-2">HN (Hospital Number) <span className="text-red-500">*</span></label>
            <input
              {...register("hn")}
              type="text"
              className={inputClass(errors.hn)}
              placeholder="Ex. 1234"
            />
            {errors.hn && <p className="text-red-500 text-xs mt-1 font-bold">{errors.hn.message}</p>}
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> ระบบจะเติม 0 ให้ครบ 7 หลัก</p>
          </div>

          {/* Name Info */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold mb-2">คำนำหน้า</label>
              <select {...register("prefix")} className={inputClass()}>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="น.ส.">น.ส.</option>
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
              </select>
            </div>
            <div className="col-span-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">ชื่อ <span className="text-red-500">*</span></label>
                  <input {...register("first_name")} type="text" className={inputClass(errors.first_name)} />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">นามสกุล <span className="text-red-500">*</span></label>
                  <input {...register("last_name")} type="text" className={inputClass(errors.last_name)} />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Physical Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">วันเกิด (DOB) <span className="text-red-500">*</span></label>
              <input {...register("dob")} type="date" className={inputClass(errors.dob)} />
              {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">ส่วนสูง (cm) <span className="text-red-500">*</span></label>
              <input {...register("height")} type="number" className={inputClass(errors.height)} placeholder="165" />
              {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-bold mb-2">เบอร์โทรศัพท์</label>
            <input {...register("phone")} type="tel" className={inputClass(errors.phone)} placeholder="08x-xxx-xxxx" />
            {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold text-lg py-4 border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#888] hover:bg-[#D97736] hover:shadow-[4px_4px_0px_0px_#3D3834] dark:hover:bg-gray-200 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2">
            {isSubmitting ? "กำลังบันทึก..." : <><Save size={20} /> ยืนยันการลงทะเบียน</>}
          </button>

        </form>
      </div>
    </div>
  );
}
