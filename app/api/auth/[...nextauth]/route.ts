// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ... (โค้ดตรวจสอบรหัสผ่านเดิมของคุณ)
        const password = credentials?.password;
        if (password === process.env.ADMIN_PASSWORD || password === "1234") { // รหัสสมมติ
          return { id: "1", name: "Staff Admin", email: "staff@hospital.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  // --- ส่วนที่เพิ่มเข้ามา (Timeout) ---
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 ชั่วโมง (หน่วยเป็นวินาที)
  },
  jwt: {
    maxAge: 8 * 60 * 60, // ต้องตั้งให้เท่ากับ session
  },
  // --------------------------------
});

export { handler as GET, handler as POST };
