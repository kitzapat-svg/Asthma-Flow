import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "เกี่ยวกับเรา",
    description: "เรียนรู้เกี่ยวกับ Asthma Flow ระบบจัดการข้อมูลผู้ป่วยโรคหืดที่พัฒนาโดยทีมเภสัชกร",
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
