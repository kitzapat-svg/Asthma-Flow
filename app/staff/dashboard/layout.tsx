import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard  — Asthma Flow",
    description:
        "วิเคราะห์ข้อมูลการให้บริการ สถิติรายสัปดาห์ รายเดือน สัดส่วนสถานะผู้ป่วย",
};

export default function StatsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
