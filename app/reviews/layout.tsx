import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "รีวิวจากผู้ใช้งาน",
    description: "รีวิวและความคิดเห็นจากทีมเภสัชกรและบุคลากรที่ใช้งาน Asthma Flow",
};

export default function ReviewsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
