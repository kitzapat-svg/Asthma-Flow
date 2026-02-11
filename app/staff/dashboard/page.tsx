"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Search, LogOut, Activity, Calendar, 
  FileText, Plus, ArrowUpRight, User 
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle'; // <--- เรียกใช้ปุ่มปรับธีม

// 1. อัปเดต Type ให้ตรงกับหัวตาราง Google Sheets ใหม่
interface Patient {
  hn: string;
  prefix: string;
  first_name: string;
  last_name: string;
  dob: string;       // วันเกิด (YYYY-MM-DD)
  status: string;
  phone?: string;    // (ถ้ามี)
  lastVisit?: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // เช็ค Login (ถ้าใช้ Middleware แล้ว อาจจะไม่ต้องเช็คตรงนี้ก็ได้ แต่กันเหนียวไว้ครับ)
    const isAuth = localStorage.getItem("isLoggedIn"); // หรือเช็ค Session
    
    fetch('/api/db?type=patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatients(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 2. ฟังก์ชันคำนวณอายุจากวันเกิด
  const calculateAge = (dob: string) => {
    if (!dob) return "-";
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return isNaN(age) ? "-" : age;
    } catch (e) {
      return "-";
    }
  };

  // กรองข้อมูล
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || p.hn?.includes(search);
  });

  // Helper เลือกสีสถานะ (รองรับ Dark Mode)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Discharge': return 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'COPD': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default: return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'; // Uncontrolled
    }
  };

  return (
    <div className="min-h-screen pb-20 font-sans text-[#2D2A26] dark:text-white bg-[#FEFCF8] dark:bg-black transition-colors duration-300">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b-2 border-[#3D3834] dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D97736] border-2 border-[#3D3834] dark:border-zinc-700 shadow-[2px_2px_0px_0px_#3D3834] dark:shadow-none flex items-center justify-center text-white">
              <Activity size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#2D2A26] dark:text-white">Asthma Care Connect</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* ปุ่มเปลี่ยนธีม */}
            <ThemeToggle />

            <button 
                onClick={() => {
                localStorage.removeItem("isLoggedIn");
                router.push("/api/auth/signout");
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-[#3D3834] dark:border-zinc-700 dark:text-zinc-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all active:translate-y-0.5"
            >
                <LogOut size={16} /> <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-none relative overflow-hidden transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#6B6560] dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">ผู้ป่วยทั้งหมด</p>
                <h2 className="text-4xl font-black text-[#D97736] mt-1">{patients.length}</h2>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-100 dark:border-orange-900">
                <Users className="text-[#D97736]" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 w-fit px-2 py-1 border border-green-200 dark:border-green-800 rounded">
              <ArrowUpRight size={14} /> Active Cases: {patients.filter(p => p.status === 'Active').length}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#F7F3ED] dark:bg-zinc-800/50 p-6 border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-none transition-colors">
             <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#6B6560] dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">กลุ่ม COPD</p>
                <h2 className="text-4xl font-black text-[#2D2A26] dark:text-white mt-1">
                  {patients.filter(p => p.status === 'COPD').length}
                </h2>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-700 rounded-full border border-gray-200 dark:border-zinc-600">
                <Activity className="text-[#6B6560] dark:text-zinc-300" size={24} />
              </div>
            </div>
            <p className="text-sm text-[#6B6560] dark:text-zinc-400">โรคปอดอุดกั้นเรื้อรัง</p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#2D2A26] dark:bg-black text-white p-6 border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-[4px_4px_0px_0px_#D97736] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/60 font-bold text-xs uppercase tracking-wider">นัดหมายวันนี้</p>
                <h2 className="text-4xl font-black text-white mt-1">0</h2>
              </div>
              <div className="p-3 bg-white/10 rounded-full">
                <Calendar className="text-white" size={24} />
              </div>
            </div>
            <button className="w-full mt-2 bg-[#D97736] hover:bg-[#c66a2e] text-white text-xs font-bold py-2 border border-white/20 transition-colors">
              ดูตารางงาน
            </button>
          </div>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div className="w-full md:w-1/2 relative">
            <label className="block text-sm font-bold mb-2 ml-1 text-[#2D2A26] dark:text-zinc-300">ค้นหาผู้ป่วย</label>
            <div className="relative group">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#D97736] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาด้วย HN หรือ ชื่อ-นามสกุล..." 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#2D2A26] dark:shadow-none outline-none focus:border-[#D97736] focus:shadow-[4px_4px_0px_0px_#D97736] dark:focus:border-[#D97736] dark:text-white transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Link href="/staff/register">
            <button className="flex items-center gap-2 bg-[#2D2A26] dark:bg-white text-white dark:text-black px-6 py-3 font-bold border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#888] dark:shadow-[4px_4px_0px_0px_#D97736] hover:bg-[#D97736] hover:shadow-[4px_4px_0px_0px_#3D3834] dark:hover:bg-gray-200 active:translate-y-0.5 active:shadow-none transition-all">
              <Plus size={20} /> ลงทะเบียนผู้ป่วยใหม่
            </button>
          </Link>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F3ED] dark:bg-zinc-800 border-b-2 border-[#3D3834] dark:border-zinc-700 text-sm uppercase tracking-wider text-[#6B6560] dark:text-zinc-400">
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/10 dark:border-zinc-700 w-24">HN</th>
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/10 dark:border-zinc-700">ชื่อ - นามสกุล</th>
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/10 dark:border-zinc-700 text-center w-20">อายุ</th>
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/10 dark:border-zinc-700 w-32">สถานะ</th>
                  <th className="p-4 font-extrabold text-center w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3834]/10 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400 dark:text-zinc-600">
                      <div className="animate-pulse flex flex-col items-center gap-2">
                        <Activity size={32} className="animate-spin text-[#D97736]" />
                        <span className="font-bold text-sm">กำลังเชื่อมต่อฐานข้อมูล...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400 dark:text-zinc-600">
                      <div className="flex flex-col items-center gap-2">
                        <User size={48} className="opacity-20"/>
                        <span className="font-bold">ไม่พบข้อมูลผู้ป่วย</span>
                        <span className="text-xs">ลองค้นหาด้วยคำอื่น หรือลงทะเบียนใหม่</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, index) => (
                    <tr key={index} className="group hover:bg-[#FFF9F0] dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 border-r border-[#3D3834]/10 dark:border-zinc-800 font-mono font-bold text-[#D97736] text-lg">
                        {patient.hn}
                      </td>
                      <td className="p-4 border-r border-[#3D3834]/10 dark:border-zinc-800 font-medium text-[#2D2A26] dark:text-zinc-200">
                        <div className="flex flex-col">
                          <span className="font-bold text-base">
                            {patient.prefix}{patient.first_name} {patient.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-r border-[#3D3834]/10 dark:border-zinc-800 text-center font-bold text-gray-600 dark:text-zinc-400">
                        {calculateAge(patient.dob)}
                      </td>
                      <td className="p-4 border-r border-[#3D3834]/10 dark:border-zinc-800">
                        <span className={`inline-flex items-center px-3 py-1 border border-current text-xs font-bold rounded-full shadow-sm ${getStatusColor(patient.status)}`}>
                          {patient.status || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Link href={`/staff/patient/${patient.hn}`}>
                            <button className="text-sm font-bold text-[#2D2A26] dark:text-zinc-300 underline decoration-2 decoration-[#D97736]/30 hover:decoration-[#D97736] hover:text-[#D97736] dark:hover:text-[#D97736] transition-all">
                            ดูประวัติ
                            </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-[#F7F3ED] dark:bg-zinc-800 p-3 text-xs text-right text-[#6B6560] dark:text-zinc-400 font-medium border-t-2 border-[#3D3834] dark:border-zinc-700 transition-colors">
            แสดงผล {filteredPatients.length} รายการ
          </div>
        </div>

      </main>
    </div>
  );
}
