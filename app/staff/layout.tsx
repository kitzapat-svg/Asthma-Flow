"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Users, PieChart, ChevronDown, UserCog } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useRef, useEffect } from "react";

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
            <ThemeToggle />
            <UserDropdown session={session} onLogout={handleLogout} />
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

function UserDropdown({ session, onLogout }: { session: any, onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="text-sm font-bold text-[#6B6560] dark:text-zinc-400">
          👤 {session?.user?.name || "Staff"}
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            <Link href="/staff/users" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
                <UserCog size={16} />
                จัดการผู้ใช้
              </div>
            </Link>
            <hr className="my-1 border-gray-100 dark:border-zinc-800" />
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <LogOut size={16} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
