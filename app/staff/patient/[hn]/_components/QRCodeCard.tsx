"use client";

import { useState, useEffect } from 'react';
import { 
    QrCode, RefreshCw, ShieldOff, CalendarPlus, 
    ShieldCheck, Clock, ShieldX, Ban, ExternalLink, AlertTriangle 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SITE_URL } from '@/lib/config';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';

interface QRCodeCardProps {
    hn: string;
    publicToken: string;
    publicTokenExpiresAt?: string | null;
    publicTokenRevokedAt?: string | null;
    publicTokenRotatedAt?: string | null;
    userRole: string;
    onRefresh: () => Promise<void>;
}

type TokenStatus = 'active' | 'expiring' | 'expired' | 'revoked';

export function QRCodeCard({ 
    hn, 
    publicToken, 
    publicTokenExpiresAt, 
    publicTokenRevokedAt, 
    publicTokenRotatedAt,
    userRole,
    onRefresh 
}: QRCodeCardProps) {
    const [origin, setOrigin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'renew' | 'rotate' | 'revoke' | null>(null);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const qrUrl = origin ? `${origin}/patient/${publicToken}` : `${SITE_URL}/patient/${publicToken}`;
    const isAdmin = userRole === 'Admin';

    // Calculate Token Status
    const getTokenStatus = (): TokenStatus => {
        if (publicTokenRevokedAt) return 'revoked';
        if (!publicTokenExpiresAt) return 'active';
        const exp = new Date(publicTokenExpiresAt);
        const now = new Date();
        if (exp < now) return 'expired';
        
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) return 'expiring';
        return 'active';
    };

    const status = getTokenStatus();

    // Get Status Badge Configuration
    const getStatusConfig = () => {
        switch (status) {
            case 'revoked':
                return {
                    label: 'ถูกยกเลิก',
                    style: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
                    icon: Ban
                };
            case 'expired':
                return {
                    label: 'หมดอายุ',
                    style: 'bg-red-950/40 text-red-400 border border-red-800',
                    icon: ShieldX
                };
            case 'expiring':
                const exp = new Date(publicTokenExpiresAt!);
                const now = new Date();
                const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    label: `ใกล้หมดอายุ (อีก ${days} วัน)`,
                    style: 'bg-amber-950/40 text-amber-400 border border-amber-800',
                    icon: Clock
                };
            case 'active':
            default:
                return {
                    label: 'ใช้งานได้',
                    style: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800',
                    icon: ShieldCheck
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    // Date formatting helper
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '';
        }
    };

    const handleAction = async () => {
        if (!confirmAction) return;
        setIsLoading(true);
        const actionType = confirmAction;
        setConfirmAction(null);

        try {
            const res = await fetch('/api/db', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'patient_public_token',
                    hn,
                    action: actionType
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update token');
            }

            if (actionType === 'renew') {
                toast.success('ต่ออายุ QR Code เรียบร้อยแล้ว (ลิงก์เดิมยังใช้ได้)');
            } else if (actionType === 'rotate') {
                toast.success('ออก QR Code ใหม่เรียบร้อยแล้ว (ลิงก์เดิมถูกยกเลิก)');
            } else if (actionType === 'revoke') {
                toast.success('ยกเลิก QR Code เรียบร้อยแล้ว');
            }

            await onRefresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่');
        } finally {
            setIsLoading(false);
        }
    };

    const getConfirmDialogContent = () => {
        switch (confirmAction) {
            case 'renew':
                return {
                    title: 'ยืนยันการต่ออายุ QR Code',
                    description: (
                        <div className="space-y-3">
                            <p className="text-zinc-600 dark:text-zinc-400">
                                ระบบจะต่ออายุการใช้งาน QR Code นี้ออกไปอีก <span className="font-bold text-emerald-600 dark:text-emerald-400">1 ปี</span> โดยนับจากวันนี้
                            </p>
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                                <p className="font-bold">💡 ข้อดีของการต่ออายุ (Renew):</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>ลิงก์เดิมและ QR Code เดิมยังคงใช้งานได้ต่อ</li>
                                    <li><span className="font-bold">ไม่ต้องพิมพ์บัตรประจำตัวผู้ป่วยใหม่</span></li>
                                </ul>
                            </div>
                        </div>
                    ),
                    confirmText: 'ยืนยันต่ออายุ',
                    confirmColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
                };
            case 'rotate':
                return {
                    title: 'ยืนยันการออก QR Code ใหม่ (Rotate)',
                    description: (
                        <div className="space-y-3">
                            <p className="text-zinc-600 dark:text-zinc-400">
                                ระบบจะสร้าง QR Code และลิงก์เข้าสู่ระบบใหม่ทันที
                            </p>
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                                <AlertTriangle className="shrink-0 text-amber-600" size={16} />
                                <div>
                                    <p className="font-bold text-red-600 dark:text-red-400">⚠️ ข้อควรระวัง:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>QR Code และลิงก์เดิมที่เคยพิมพ์จะใช้งานไม่ได้ทันที</li>
                                        <li><span className="font-bold">ต้องพิมพ์บัตรประจำตัวผู้ป่วยใหม่ให้ผู้ป่วยเท่านั้น</span></li>
                                        <li>เหมาะสำหรับกรณีที่ QR code สูญหาย หรือต้องการความปลอดภัยสูงสุด</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ),
                    confirmText: 'ยืนยันออก QR ใหม่',
                    confirmColor: 'bg-[#D97736] hover:bg-[#b05d28] text-white'
                };
            case 'revoke':
                return {
                    title: 'ยืนยันการยกเลิก QR Code (Revoke)',
                    description: (
                        <div className="space-y-3">
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                ยืนยันที่จะปิดการเข้าใช้งานลิงก์ QR Code นี้ทันทีหรือไม่?
                            </p>
                            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300 flex gap-2">
                                <AlertTriangle className="shrink-0 text-red-600" size={16} />
                                <div>
                                    <p className="font-bold">🛑 ผลกระทบ:</p>
                                    <p className="mt-1">
                                        ผู้ป่วยหรือผู้ถือลิงก์นี้จะไม่สามารถเข้าถึงข้อมูลการรักษาได้อีกเลยจนกว่าท่านจะสร้าง QR Code ใหม่
                                    </p>
                                </div>
                            </div>
                        </div>
                    ),
                    confirmText: 'ยืนยันยกเลิก QR',
                    confirmColor: 'bg-red-600 hover:bg-red-700 text-white'
                };
            default:
                return null;
        }
    };

    const confirmContent = getConfirmDialogContent();

    return (
        <div className="bg-[#2D2A26] dark:bg-zinc-800 p-6 text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[6px_6px_0px_0px_#888] dark:shadow-none text-center transition-colors">
            
            {/* Status Badge */}
            <div className="flex justify-center mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusConfig.style}`}>
                    <StatusIcon size={14} />
                    {statusConfig.label}
                </span>
            </div>

            {/* QR Code Area */}
            <div className="relative bg-white p-4 w-fit mx-auto mb-4 border-4 border-[#D97736] overflow-hidden group">
                {status === 'revoked' ? (
                    <div className="w-[150px] h-[150px] bg-zinc-200 flex flex-col items-center justify-center text-zinc-500 gap-2">
                        <Ban size={40} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-600">QR Code ถูกยกเลิกแล้ว</span>
                    </div>
                ) : (
                    <div className={`relative ${status === 'expired' ? 'opacity-30' : ''}`}>
                        <QRCodeSVG value={qrUrl} size={150} />
                        {status === 'expired' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rotate-[-12deg] tracking-wider border-2 border-white shadow-md">
                                    Expired / หมดอายุ
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <h3 className="font-bold text-lg flex items-center justify-center gap-2"><QrCode size={20} /> Patient QR Code</h3>
            
            {/* Expiry Details */}
            {status !== 'revoked' && publicTokenExpiresAt && (
                <p className="text-xs text-white/50 mt-1 mb-3">
                    หมดอายุ: {formatDate(publicTokenExpiresAt)}
                </p>
            )}
            {status === 'revoked' && (
                <p className="text-xs text-red-400/80 mt-1 mb-3 font-semibold">
                    ถูกยกเลิกเมื่อ: {formatDate(publicTokenRevokedAt)}
                </p>
            )}
            {!publicTokenExpiresAt && status !== 'revoked' && (
                <p className="text-xs text-emerald-400/80 mt-1 mb-3 font-semibold">
                    ไม่มีวันหมดอายุ (Legacy Token)
                </p>
            )}

            <div className="flex flex-col gap-2 mt-4">
                <a
                    href={status === 'revoked' ? undefined : qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => status === 'revoked' && e.preventDefault()}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors text-sm border-2 border-[#3D3834] ${
                        status === 'revoked' 
                            ? 'bg-zinc-700/40 text-white/30 border-zinc-700 cursor-not-allowed' 
                            : 'bg-[#D97736] hover:bg-[#b05d28] text-white cursor-pointer shadow-[3px_3px_0px_0px_#111]'
                    }`}
                >
                    <ExternalLink size={16} /> เปิดหน้าผู้ป่วย (Patient View)
                </a>

                {/* Admin Area controls */}
                {isAdmin && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                        <div className="text-[10px] uppercase tracking-wider text-white/40 font-black text-left mb-1.5">
                            ⚙️ Admin Controls
                        </div>
                        
                        {/* Renew button: Show if not revoked */}
                        {status !== 'revoked' && (
                            <button
                                onClick={() => setConfirmAction('renew')}
                                disabled={isLoading}
                                className={`w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#3D3834] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_#111] disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <CalendarPlus size={14} /> ต่ออายุ QR (Renew +1 ปี)
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            {/* Rotate button */}
                            <button
                                onClick={() => setConfirmAction('rotate')}
                                disabled={isLoading}
                                className={`py-2 bg-zinc-700 hover:bg-zinc-600 text-white border-2 border-[#3D3834] font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-[3px_3px_0px_0px_#111] disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="ออกคีย์ใหม่สำหรับกรณีทำหายหรือกังวลเรื่องความปลอดภัย"
                            >
                                <RefreshCw size={12} /> ออก QR ใหม่
                            </button>

                            {/* Revoke button */}
                            <button
                                onClick={() => setConfirmAction('revoke')}
                                disabled={isLoading || status === 'revoked'}
                                className={`py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-[#3D3834] font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-[3px_3px_0px_0px_#111] disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="ยกเลิกสิทธิ์เข้าถึงทันทีเมื่อมีข้อมูลรั่วไหล"
                            >
                                <ShieldOff size={12} /> ยกเลิก QR นี้
                            </button>
                        </div>

                        {status === 'expiring' && (
                            <p className="text-[10px] text-amber-400 font-medium text-left mt-2">
                                💡 QR ใกล้หมดอายุ แนะนำให้กด "ต่ออายุ QR" เพื่อใช้ลิงก์เดิมโดยไม่ต้องทำบัตรใหม่
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <Modal
                isOpen={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                title={confirmContent?.title || ''}
            >
                <div className="p-2 space-y-4">
                    {confirmContent?.description}
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() => setConfirmAction(null)}
                            className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleAction}
                            disabled={isLoading}
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${confirmContent?.confirmColor}`}
                        >
                            {isLoading ? 'กำลังดำเนินการ...' : confirmContent?.confirmText}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
