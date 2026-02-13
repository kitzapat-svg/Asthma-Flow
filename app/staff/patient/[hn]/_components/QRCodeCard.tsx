"use client";

import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeCardProps {
    publicToken: string;
}

export function QRCodeCard({ publicToken }: QRCodeCardProps) {
    return (
        <div className="bg-[#2D2A26] dark:bg-zinc-800 p-6 text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[6px_6px_0px_0px_#888] dark:shadow-none text-center transition-colors">
            <div className="bg-white p-4 w-fit mx-auto mb-4 border-4 border-[#D97736]">
                <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${publicToken}`} size={150} />
            </div>
            <h3 className="font-bold text-lg flex items-center justify-center gap-2"><QrCode size={20} /> Patient QR Code</h3>
            <p className="text-white/60 text-sm mt-1">ให้ผู้ป่วยสแกนเพื่อดูผลการรักษา</p>
        </div>
    );
}
