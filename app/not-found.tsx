import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-[#FEFCF8] dark:bg-black">
            <div className="text-8xl font-black text-primary/20 mb-4">404</div>
            <h2 className="text-2xl font-black text-foreground mb-2">ไม่พบหน้าที่ต้องการ</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                ขออภัย หน้าที่คุณกำลังค้นหาไม่มีอยู่หรือถูกย้ายไปแล้ว
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
                กลับหน้าหลัก
            </Link>
        </div>
    );
}
