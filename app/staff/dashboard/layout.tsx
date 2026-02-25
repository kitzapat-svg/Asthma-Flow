import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard — Asthma Care",
    description:
        "ภาพรวมผู้ป่วยคลินิกโรคหืด ค้นหาผู้ป่วย ดูนัดหมายที่ใกล้จะมาถึง",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
