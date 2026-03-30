import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ติดต่อเรา",
    description: "ติดต่อทีม Asthma Flow สำหรับสอบถามข้อมูลหรือเสนอแนะการใช้งาน",
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
