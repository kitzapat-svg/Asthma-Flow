import { withAuth } from "next-auth/middleware"

// เปลี่ยนจากการ export default มาเป็น export const proxy
export const proxy = withAuth({
  pages: {
    signIn: '/auth/signin', // ให้เด้งไปหน้าล็อกอินอัตโนมัติ
  },
})

// Config ยังใช้เหมือนเดิมครับ
export const config = { 
  matcher: ["/staff/:path*"] 
}
