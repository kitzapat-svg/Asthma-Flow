import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authRateLimiter } from "@/lib/rate-limit";
import { logActivity } from "@/lib/sheets";

// 1. Export authOptions เพื่อให้ API อื่น (เช่น api/db) เรียกใช้ตรวจสอบสิทธิ์ได้
export const authOptions: AuthOptions = {
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = credentials?.username || "admin"; // Admin login uses just password usually, but we might migrate to username
        const password = credentials?.password;

        if (!password) return null;

        // 1. Check vs Sheet (New System)
        try {
          const { getUserByUsername } = await import('@/lib/sheets');
          const { verifyPassword } = await import('@/lib/auth');

          // If the form provides a username (we need to update the form to ask for it, or assume 'admin' if likely?)
          // Wait, current form ONLY asks for password.
          // To fallback, we need to ask for Username if we want multi-user.
          // For now, let's look for a user with username "admin" OR loop through all users?
          // Better: Update the Sign In form to ask for Username first. 
          // BUT, to keep it backward compatible, if only password is provided:
          // We can't really guess.
          // So, STEP 1 is actually updating the Sign In Form to accept Username.
          // However, for the `authorize` function, let's assume `credentials` will have `username`.

          if (credentials?.username) {
            const user = await getUserByUsername(credentials.username);
            if (user && user.password_hash) {
              const isValid = await verifyPassword(password, user.password_hash);
              if (isValid) {
                return {
                  id: user.username,
                  name: user.name || user.username,
                  email: user.email || `${user.username}@hospital.com`,
                  role: user.role // We need to add this to the session type later
                };
              }
            }
          }
        } catch (error) {
          console.error("Sheet Auth Error:", error);
        }

        // 2. Fallback: Environment Variable (Old System / Super Admin)
        // Check if username is 'admin' AND password matches env
        if (credentials?.username === 'admin' && password === process.env.ADMIN_PASSWORD) {
          return { id: "1", name: "Staff Admin", email: "staff@hospital.com", role: 'Admin' };
        }

        // Return null if all checks fail
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
        session.user.id = token.id;
        session.user.role = token.role;
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
