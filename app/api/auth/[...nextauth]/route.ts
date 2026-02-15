import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authRateLimiter } from "@/lib/rate-limit";
import { logActivity } from "@/lib/sheets";

// 1. Export authOptions เพื่อให้ API อื่น (เช่น api/db) เรียกใช้ตรวจสอบสิทธิ์ได้
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const password = credentials?.password;

        // 2. ความปลอดภัย: ตรวจสอบกับ Environment Variable เท่านั้น
        if (password === process.env.ADMIN_PASSWORD) {
          return { id: "1", name: "Staff Admin", email: "staff@hospital.com" };
        }
        return null;
      },
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // อนุญาตให้ Login แบบ Credentials โดยไม่ต้องเช็ค Google Logic
      if (account?.provider === 'credentials') return true;

      const email = user.email;
      if (!email) return false;

      // 1. Rate Limiting Check
      if (authRateLimiter.isBlocked(email)) {
        console.warn(`Blocked login attempt for ${email}`);
        return false;
      }

      // 2. Allowlist Check
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
      const isAllowed = allowedEmails.includes(email);

      if (isAllowed) {
        await logActivity(email, "Login", "Success");
        authRateLimiter.reset(email); // Reset เมื่อ Login สำเร็จ
        return true;
      } else {
        await logActivity(email, "Login", "Denied");
        authRateLimiter.increment(email); // นับจำนวนครั้งที่พยายาม Login ผิด
        return false; // Access Denied
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // หน้า Error ถ้า Login ไม่ผ่าน
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 ชั่วโมง
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
