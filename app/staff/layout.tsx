"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Users, PieChart } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  const isActive = (path: string) => pathname === path ? "bg-[#D97736] text-white" : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300";

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black font-sans transition-colors duration-300">
      {/* --- MENU BAR ด้านบน --- */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b-2 border-[#3D3834] dark:border-zinc-800 px-6 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black flex items-center gap-2 text-[#2D2A26] dark:text-white">
              <span className="bg-[#D97736] text-white px-2 py-1 transform -rotate-2 text-lg">ASTHMA</span>
              CARE
            </h1>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
                <Link href="/staff/dashboard">
                    <button className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${isActive('/staff/dashboard')}`}>
                        <Users size={18} /> รายชื่อผู้ป่วย
                    </button>
                </Link>
                <Link href="/staff/stats">
                    <button className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${isActive('/staff/stats')}`}>
                        <PieChart size={18} /> แดชบอร์ด & สถิติ
                    </button>
                </Link>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-sm font-bold text-[#6B6560] dark:text-zinc-400">
                👤 {session?.user?.name || "Staff"}
             </div>
             <ThemeToggle />
             <button 
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="ออกจากระบบ"
             >
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </nav>

      {/* --- CONTENT AREA --- */}
      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
