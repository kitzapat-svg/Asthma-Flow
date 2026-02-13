import { withAuth } from "next-auth/middleware"

// Next.js 16 ใช้ proxy.ts สำหรับ middleware
// ต้อง export default
export default withAuth({
    pages: {
        signIn: '/auth/signin',
    },
})

export const config = {
    matcher: ["/staff/:path*"],
}
