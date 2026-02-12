import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 1. Export authOptions เพื่อให้ API อื่น (เช่น api/db) เรียกใช้ตรวจสอบสิทธิ์ได้
export const authOptions: AuthOptions = {
  providers: [
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
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
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
