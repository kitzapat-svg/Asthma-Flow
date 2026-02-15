"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle"; // <--- เรียกใช้ปุ่มปรับธีม

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: username,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
      } else {
        router.push("/staff/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FEFCF8] dark:bg-black relative overflow-hidden transition-colors duration-300">

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#D97736 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Theme Toggle (มุมขวาบน) */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white dark:bg-zinc-900 border-2 border-[#2D2A26] dark:border-zinc-700 shadow-[8px_8px_0px_0px_#2D2A26] dark:shadow-[8px_8px_0px_0px_#D97736] p-8 md:p-10 transition-all duration-300">

          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#2D2A26] dark:border-white shadow-[4px_4px_0px_0px_#2D2A26] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              <Activity size={32} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#2D2A26] dark:text-white mb-2">
              Staff Portal
            </h1>
            <p className="text-[#6B6560] dark:text-zinc-400 font-medium">
              เข้าสู่ระบบเจ้าหน้าที่
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#2D2A26] dark:text-zinc-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#2D2A26] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold text-lg text-[#2D2A26] dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 transition-colors"
                placeholder="ชื่อผู้ใช้งาน (Admin/Staff)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#2D2A26] dark:text-zinc-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400 group-focus-within:text-[#D97736] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#2D2A26] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold text-lg text-[#2D2A26] dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 transition-colors"
                  placeholder="รหัสผ่านเข้าสู่ระบบ"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#D97736] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 border border-red-100 dark:border-red-900 rounded">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider py-4 border-2 border-[#2D2A26] dark:border-zinc-200 shadow-[4px_4px_0px_0px_#888] dark:shadow-none hover:bg-[#D97736] dark:hover:bg-gray-200 hover:text-white dark:hover:text-black hover:shadow-[4px_4px_0px_0px_#2D2A26] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:border-[#2D2A26] dark:hover:border-white active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="animate-pulse">Checking...</span>
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer Credit */}
        <div className="text-center mt-8 text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
          Sawankhalok Hospital Asthma Clinic
        </div>
      </div>
    </div>
  );
}
