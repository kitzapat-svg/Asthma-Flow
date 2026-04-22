"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Users, PieChart, ChevronDown, UserCog, Wind, Menu, X, User, Database, Activity } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const staffNavItems = [
  { href: "/staff/patients", icon: Users, label: "รายชื่อผู้ป่วย" },
  { href: "/staff/dashboard", icon: PieChart, label: "แดชบอร์ด & สถิติ" },
  { href: "/staff/today-pefr", icon: Activity, label: "Record PEFR" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans transition-colors duration-300">
      {/* --- MENU BAR ด้านบน (Retro Static + Glassmorphism blend) --- */}
      <div className="sticky top-0 z-50 px-4 pt-4 print:hidden">
        <nav className="mx-auto max-w-7xl flex h-16 items-center justify-between px-6 bg-background/90 backdrop-blur-md retro-box-static">

          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="/staff/patients" className="flex items-center gap-3 group">
              <motion.div
                className="h-10 w-10 bg-primary border-2 border-foreground flex items-center justify-center"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Wind size={20} strokeWidth={2.5} className="text-primary-foreground" />
              </motion.div>
              <span className="text-lg font-black tracking-tight text-foreground uppercase">
                Asthma Flow
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 ml-2 bg-secondary/30 p-1 rounded-xl">
              {staffNavItems.map((item, index) => (
                <StaffNavLink
                  key={item.href}
                  href={item.href}
                  isActive={pathname === item.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  isHovered={hoveredIndex === index}
                >
                  <item.icon size={16} /> {item.label}
                </StaffNavLink>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {/* Desktop: User Dropdown */}
            <div className="hidden md:block">
              <UserDropdown session={session} onLogout={handleLogout} />
            </div>
            {/* Mobile: Hamburger Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden h-11 w-11 flex items-center justify-center retro-button bg-background"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>

        {/* --- MOBILE DROPDOWN MENU --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden mx-auto max-w-7xl mt-2 origin-top"
            >
              <nav className="bg-background/95 backdrop-blur-lg retro-box-static p-3 space-y-1.5">
                {/* Navigation Links */}
                {staffNavItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3.5 text-sm font-bold uppercase tracking-wide transition-all ${isActive
                          ? "bg-primary text-primary-foreground retro-box-sm"
                          : "text-foreground hover:bg-secondary retro-box-sm"
                          }`}
                      >
                        <item.icon size={18} /> {item.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Divider */}
                <div className="border-t-2 border-border my-2" />

                {/* User Info */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 bg-secondary border-2 border-border flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {session?.user?.name || "Staff"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session?.user?.email || "staff@clinic"}
                      </p>
                    </div>
                  </div>
                </motion.div>
                {/* User Management Link */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    href="/staff/users"
                    className="flex items-center gap-3 px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-foreground hover:bg-secondary retro-box-sm transition-all"
                  >
                    <UserCog size={18} /> จัดการผู้ใช้
                  </Link>
                </motion.div>

                {(session?.user as any)?.role === 'Admin' && (
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 }}
                  >
                    <Link
                      href="/staff/data-management"
                      className="flex items-center gap-3 px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-foreground hover:bg-secondary retro-box-sm transition-all"
                    >
                      <Database size={18} /> จัดการข้อมูล
                    </Link>
                  </motion.div>
                )}

                {/* Logout Button */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-1"
                >
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center py-3.5 text-sm font-bold uppercase tracking-wider retro-button-primary cursor-pointer"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LogOut size={16} /> ออกจากระบบ
                    </span>
                  </button>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- CONTENT AREA --- */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1">
        {children}
      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-auto py-6 px-6 border-t-2 border-border bg-secondary/30 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            &copy; {new Date().getFullYear()} Asthma Flow.
          </p>
          <div className="text-right flex flex-col items-center sm:items-end">

            <p className="text-[13px] font-medium text-muted-foreground mt-1 tracking-wide">
              Version: 1.4.1 - Update: 22-04-2026 21:25
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Desktop Nav Link ─── */
function StaffNavLink({
  href,
  children,
  isActive,
  onMouseEnter,
  onMouseLeave,
  isHovered,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHovered?: boolean;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative px-4 py-2 text-sm font-black transition-all uppercase tracking-tight group flex items-center gap-2 no-underline z-10 ${isActive
        ? "text-primary dark:text-white"
        : "text-muted-foreground hover:text-foreground"
        }`}
    >
      <span className="relative z-20 flex items-center gap-2">{children}</span>

      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.div
            layoutId="nav-pill"
            className={`absolute inset-0 z-10 rounded-lg border ${isActive
              ? "bg-primary/10 border-primary/20 shadow-sm"
              : "bg-secondary border-border"
              }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        )}
      </AnimatePresence>
    </Link>
  );
}

/* ─── Desktop User Dropdown ─── */
function UserDropdown({
  session,
  onLogout,
}: {
  session: any;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-border bg-background hover:bg-secondary transition-colors cursor-pointer"
        whileHover={{ y: -1 }}
        whileTap={{ y: 0 }}
      >
        <div className="h-6 w-6 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
          <User size={12} className="text-muted-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground max-w-[120px] truncate">
          {session?.user?.name || "Staff"}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-52 bg-card border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b-2 border-border bg-secondary/50">
              <p className="text-sm font-bold text-foreground truncate">
                {session?.user?.name || "Staff"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || ""}
              </p>
            </div>

            {/* Menu Items */}
            <div className="p-1.5">
              <Link
                href="/staff/users"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition-colors cursor-pointer">
                  <UserCog size={16} className="text-muted-foreground" />
                  จัดการผู้ใช้
                </div>
              </Link>
              {(session?.user as any)?.role === 'Admin' && (
                <Link
                  href="/staff/data-management"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition-colors cursor-pointer">
                    <Database size={16} className="text-muted-foreground" />
                    จัดการข้อมูล
                  </div>
                </Link>
              )}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                ออกจากระบบ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
