"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle'; // <--- เรียกใช้ปุ่มปรับธีม

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // เก็บค่าต่างๆ ของฟอร์ม
  const [formData, setFormData] = useState({
    hn: '',
    prefix: 'นาย', 
    firstName: '',
    lastName: '',
    dob: '',        // วันเกิด
    bestPefr: '',   // ค่า Best PEFR
    height: '',   
    status: 'Active'
  });

  // ฟังก์ชันสร้าง Token สุ่ม
  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedHN = formData.hn.padStart(7, '0');
      const token = generateToken();

      const dataRow = [
        formattedHN,        
        formData.prefix,    
        formData.firstName,      
        formData.lastName,
        formData.dob,
        formData.bestPefr,
        formData.height,
        formData.status,
        token               
      ];

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'patients',
          data: dataRow
        })
      });

      if (res.ok) {
        alert(`บันทึกสำเร็จ!\nHN: ${formattedHN}\nระบบได้สร้าง Token เรียบร้อยแล้ว`);
        router.push('/staff/dashboard');
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error(error);
      alert("เชื่อมต่อ Server ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors"
        >
          <ArrowLeft size={20} /> ย้อนกลับ
        </button>
        
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <UserPlus size={24} className="text-[#D97736]" /> <span className="hidden sm:inline">ลงทะเบียนผู้ป่วยใหม่</span>
            </h1>
            
            {/* ปุ่มเปลี่ยนธีม */}
            <ThemeToggle />
        </div>
      </nav>

      {/* Main Form Card */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-8 transition-colors">
        
        {/* Alert Info */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300 rounded">
           <AlertCircle size={20} className="shrink-0" />
           <p>กรุณากรอกข้อมูลให้ครบถ้วน HN จะถูกเติม 0 ให้ครบ 7 หลักอัตโนมัติ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HN Row */}
          <div>
              <label className="block text-sm font-bold mb-2 dark:text-zinc-300">รหัส HN <span className="text-red-500">*</span></label>
              <input 
                name="hn" required
                value={formData.hn} onChange={handleChange}
                type="text" placeholder="เช่น 2154" 
                className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold font-mono tracking-wider text-lg dark:text-white transition-colors"
              />
          </div>

          {/* Prefix, First Name, Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
                <label className="block text-sm font-bold mb-2 dark:text-zinc-300">คำนำหน้า</label>
                <select 
                    name="prefix"
                    value={formData.prefix} onChange={handleChange}
                    className="w-full px-2 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold cursor-pointer dark:text-white transition-colors"
                >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.ญ.">ด.ญ.</option>
                </select>
            </div>
            <div className="md:col-span-3 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-2 dark:text-zinc-300">ชื่อจริง <span className="text-red-500">*</span></label>
                    <input 
                        name="firstName" required
                        value={formData.firstName} onChange={handleChange}
                        type="text" placeholder="ชื่อ" 
                        className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-medium dark:text-white transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 dark:text-zinc-300">นามสกุล <span className="text-red-500">*</span></label>
                    <input 
                        name="lastName" required
                        value={formData.lastName} onChange={handleChange}
                        type="text" placeholder="นามสกุล" 
                        className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-medium dark:text-white transition-colors"
                    />
                </div>
            </div>
          </div>

          {/* DOB & Height & Best PEFR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 dark:text-zinc-300">วันเดือนปีเกิด <span className="text-red-500">*</span></label>
              <input 
                name="dob" required
                value={formData.dob} onChange={handleChange}
                type="date"
                className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[#D97736]">ส่วนสูง (cm)</label>
              <input 
                name="height" required
                value={formData.height} onChange={handleChange}
                type="number" placeholder="จำเป็น" 
                className="w-full px-4 py-3 bg-[#FFF3E0] dark:bg-orange-900/20 border-2 border-[#D97736] focus:border-[#D97736] outline-none font-bold text-center placeholder:text-[#D97736]/50 dark:text-white transition-colors"
              />
            </div>
             <div>
              <label className="block text-sm font-bold mb-2 dark:text-zinc-300">Best PEFR</label>
              <input 
                name="bestPefr"
                value={formData.bestPefr} onChange={handleChange}
                type="number" placeholder="ค่าที่ดีที่สุด" 
                className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold text-center dark:text-white transition-colors"
              />
            </div>
          </div>

          {/* Status */}
          <div>
              <label className="block text-sm font-bold mb-2 dark:text-zinc-300">สถานะผู้ป่วย</label>
              <select 
                name="status"
                value={formData.status} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold appearance-none cursor-pointer dark:text-white transition-colors"
              >
                <option value="Active">🟢 Active (กำลังรักษา)</option>
                <option value="Discharge">⚪ Discharge (จำหน่าย/ส่งต่อ)</option>
                <option value="COPD">🟠 COPD (โรคปอดอุดกั้นฯ)</option>
              </select>
          </div>

          <hr className="border-[#3D3834]/10 dark:border-zinc-700 my-4" />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold text-lg py-4 border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#888] dark:shadow-none hover:bg-[#D97736] dark:hover:bg-gray-200 hover:shadow-[4px_4px_0px_0px_#3D3834] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? "กำลังบันทึก..." : (
              <>
                <Save size={20} /> บันทึกข้อมูลผู้ป่วย
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
