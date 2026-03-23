import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "รายชื่อผู้ป่วย — Asthma Flow",
    description:
        "ค้นหาผู้ป่วยคลินิกโรคหืด ดูนัดหมายที่ใกล้จะมาถึง",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
