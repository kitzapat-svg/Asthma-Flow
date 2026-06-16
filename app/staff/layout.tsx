"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Users, PieChart, UserCog, Wind, Menu, X, User, Database, Activity, AlertTriangle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect, ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";

const staffNavItems = [
  { href: "/staff/patients", icon: Users, label: "รายชื่อผู้ป่วย" },
  { href: "/staff/dashboard", icon: PieChart, label: "แดชบอร์ด & สถิติ" },
  { href: "/staff/today-pefr", icon: Activity, label: "Record PEFR" },
  { href: "/staff/drp-management", icon: AlertTriangle, label: "จัดการ DRP" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans transition-colors duration-300">
      {/* --- SIDEBAR MENU (Desktop Mode) --- */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-card border-r-2 border-border flex-col justify-between z-30 overflow-y-auto print:hidden">
        <div className="flex flex-col gap-6 p-6">
          {/* Logo & Brand */}
          <Link href="/staff/patients" className="flex items-center gap-3 group">
            <motion.div
              className="h-10 w-10 bg-primary border-2 border-foreground flex items-center justify-center"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Wind size={20} strokeWidth={2.5} className="text-primary-foreground" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-foreground uppercase leading-none">
                Asthma Flow
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Clinic Portal
              </span>
            </div>
          </Link>

          <div className="border-t-2 border-border my-1" />

          {/* Navigation Groups */}
          <div className="space-y-6">
            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                เมนูหลัก
              </p>
              <div className="space-y-1">
                {staffNavItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={pathname === item.href}
                    isHovered={hoveredHref === item.href}
                    onMouseEnter={() => setHoveredHref(item.href)}
                    onMouseLeave={() => setHoveredHref(null)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                การจัดการ
              </p>
              <div className="space-y-1">
                <SidebarNavLink
                  href="/staff/users"
                  icon={UserCog}
                  label="จัดการผู้ใช้"
                  isActive={pathname === "/staff/users"}
                  isHovered={hoveredHref === "/staff/users"}
                  onMouseEnter={() => setHoveredHref("/staff/users")}
                  onMouseLeave={() => setHoveredHref(null)}
                />
                {(session?.user as { role?: string })?.role === 'Admin' && (
                  <SidebarNavLink
                    href="/staff/data-management"
                    icon={Database}
                    label="จัดการข้อมูล"
                    isActive={pathname === "/staff/data-management"}
                    isHovered={hoveredHref === "/staff/data-management"}
                    onMouseEnter={() => setHoveredHref("/staff/data-management")}
                    onMouseLeave={() => setHoveredHref(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t-2 border-border bg-secondary/30 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              ธีมระบบ
            </span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 p-2 bg-background border-2 border-border retro-box-sm">
            <div className="h-9 w-9 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">
                {session?.user?.name || "Staff"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-bold">
                {(session?.user as { role?: string })?.role || "Staff"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider retro-button-primary cursor-pointer"
          >
            <LogOut size={14} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT & MOBILE NAV WRAPPER --- */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">

        {/* --- MOBILE HEADER (Visible on Mobile only) --- */}
        <div className="sticky top-0 z-50 px-4 pt-4 print:hidden md:hidden">
          <nav className="mx-auto max-w-7xl flex h-16 items-center justify-between px-6 bg-background/90 backdrop-blur-md retro-box-static">
            {/* Logo & Brand */}
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

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-11 w-11 flex items-center justify-center retro-button bg-background"
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

          {/* Mobile Dropdown Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="mx-auto max-w-7xl mt-2 origin-top"
              >
                <nav className="bg-background/95 backdrop-blur-lg retro-box-static p-3 space-y-1.5">
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

                  <div className="border-t-2 border-border my-2" />

                  {/* Mobile User Info */}
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

                  {/* Mobile Management Links */}
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

                  {(session?.user as { role?: string })?.role === 'Admin' && (
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

                  {/* Mobile Logout Button */}
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

        {/* --- DESKTOP TOP BAR (Breadcrumbs / Title) --- */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b-2 border-border bg-background/50 backdrop-blur-md sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <span>ระบบจัดการข้อมูลแพทย์ / คลินิกโรคหืด</span>
            <span className="text-border/50">/</span>
            <span className="text-foreground uppercase tracking-tight">
              {staffNavItems.find(item => item.href === pathname)?.label ||
                (pathname === "/staff/users" ? "จัดการผู้ใช้" : pathname === "/staff/data-management" ? "จัดการข้อมูล" : "")}
            </span>
          </div>
        </header>

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
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ─── Desktop Sidebar Nav Link ─── */
function SidebarNavLink({
  href,
  icon: Icon,
  label,
  isActive,
  onMouseEnter,
  onMouseLeave,
  isHovered,
}: {
  href: string;
  icon: ElementType;
  label: string;
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
      className={`relative px-4 py-3 text-sm font-black transition-all uppercase tracking-tight group flex items-center gap-3 no-underline z-10 w-full ${isActive
        ? "text-primary dark:text-white"
        : "text-muted-foreground hover:text-foreground"
        }`}
    >
      <span className="relative z-20 flex items-center gap-3">
        <Icon size={18} className={isActive ? "text-primary dark:text-white" : "text-muted-foreground group-hover:text-foreground"} />
        {label}
      </span>

      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.div
            layoutId="sidebar-nav-pill"
            className={`absolute inset-0 z-10 border-2 ${isActive
              ? "bg-primary/10 border-primary shadow-sm"
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

