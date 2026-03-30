import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ฟีเจอร์",
    description: "ฟีเจอร์ทั้งหมดของ Asthma Flow ระบบติดตามดูแลผู้ป่วยโรคหืดแบบครบวงจร",
};

export default function FeaturesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
