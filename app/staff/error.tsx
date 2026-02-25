'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StaffError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Staff section error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground max-w-md mb-6">
                ขออภัย เกิดปัญหาบางอย่างขึ้น กรุณาลองใหม่อีกครั้ง
            </p>
            <Button
                onClick={reset}
                className="gap-2 font-bold"
            >
                <RefreshCw size={16} /> ลองใหม่
            </Button>
        </div>
    );
}
