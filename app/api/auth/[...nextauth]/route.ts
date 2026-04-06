import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authRateLimiter } from "@/lib/rate-limit";
import { getUserByUsername } from "@/lib/db";
import { logAudit } from "@/lib/logger";
import { verifyPassword } from "@/lib/auth";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (!password || !username) return null;

        try {
          const user = await getUserByUsername(username);
          if (user && user.password_hash) {
            const isValid = await verifyPassword(password, user.password_hash);
            if (isValid) {
              return {
                id: user.username,
                name: user.name || user.username,
                email: user.email || `${user.username}@hospital.com`,
                role: user.role 
              };
            }
          }
        } catch (error) {
          console.error("Auth Error:", error);
        }

        if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
          return { id: "admin", name: "Staff Admin", email: "staff@hospital.com", role: 'Admin' };
        }

        return null;
      },
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;

      const email = user.email;
      if (!email) return false;

      if (authRateLimiter.isBlocked(email)) {
        return false;
      }

      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
      const isAllowed = allowedEmails.includes(email);

      if (isAllowed) {
        await logAudit({
          action_type: "AUTH",
          module: "AUTH",
          actor_id: email,
          payload: { status: "Success", provider: account?.provider }
        });
        authRateLimiter.reset(email);
        return true;
      } else {
        await logAudit({
          action_type: "AUTH",
          module: "AUTH",
          actor_id: email,
          payload: { status: "Denied", reason: "Email not allowed", provider: account?.provider }
        });
        authRateLimiter.increment(email); 
        return false; 
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
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', 
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, 
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
