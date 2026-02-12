import { withAuth } from "next-auth/middleware"

// Next.js 16 ใช้ proxy.ts แทน middleware.ts
// ต้อง export function ชื่อ "proxy" หรือ default export
export const proxy = withAuth({
    pages: {
        signIn: '/auth/signin',
    },
})

export const config = {
    matcher: ["/staff/:path*"],
}
