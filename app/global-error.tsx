'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html lang="th">
            <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        textAlign: 'center',
                        padding: '2rem',
                        backgroundColor: '#FEFCF8',
                    }}
                >
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            fontSize: 36,
                        }}
                    >
                        ⚠️
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
                        เกิดข้อผิดพลาดร้ายแรง
                    </h2>
                    <p style={{ color: '#6b7280', maxWidth: 400, marginBottom: 24 }}>
                        ระบบเกิดปัญหาที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#D97736',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        🔄 ลองใหม่
                    </button>
                </div>
            </body>
        </html>
    );
}
