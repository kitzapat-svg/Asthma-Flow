"use client";

import { useState } from 'react';
import { X, Save, Eye, EyeOff, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface UserModalProps {
    user: any | null; // null = Add New
    onClose: () => void;
    onSaved: () => void;
    currentUserRole?: string;
}

export function UserModal({ user, onClose, onSaved, currentUserRole }: UserModalProps) {
    const isEditing = !!user;

    const [formData, setFormData] = useState({
        username: user?.username || '',
        password: '',
        name: user?.name || '',
        role: user?.role || 'Staff',
        email: user?.email || '',
        position: user?.position || '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!formData.username || !formData.name) {
                toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
                setSubmitting(false);
                return;
            }
            if (!isEditing && !formData.password) {
                toast.error("กรุณาตั้งรหัสผ่าน");
                setSubmitting(false);
                return;
            }

            const payload = {
                type: 'users',
                username: formData.username,
                data: [
                    formData.username,
                    formData.password,
                    formData.role,
                    formData.name,
                    formData.email,
                    formData.position // New field
                ]
            };

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch('/api/db', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(isEditing ? "แก้ไขข้อมูลเรียบร้อย" : "เพิ่มผู้ใช้เรียบร้อย");
                onSaved();
                onClose();
            } else {
                const err = await res.json();
                toast.error(err.error || "เกิดข้อผิดพลาด");
            }

        } catch (e) {
            console.error(e);
            toast.error("Error connecting to server");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#2D2A26] dark:text-white">
                    {isEditing ? <><Edit className="text-blue-500" /> {currentUserRole === 'Admin' ? 'แก้ไขผู้ใช้งาน' : 'แก้ไขข้อมูลส่วนตัว'}</> : <><Save className="text-green-500" /> เพิ่มผู้ใช้งานใหม่</>}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-[#2D2A26] dark:text-zinc-300">Username</label>
                        <input
                            type="text"
                            disabled={isEditing} // Username cannot be changed once set (it's the ID)
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white disabled:opacity-50 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-[#2D2A26] dark:text-zinc-300">
                            Password {isEditing && <span className="text-xs font-normal text-muted-foreground">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-bold"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-[#2D2A26] dark:text-zinc-300">ชื่อ - นามสกุล</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-[#2D2A26] dark:text-zinc-300">ตำแหน่ง (Position)</label>
                        <select
                            value={formData.position}
                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-bold"
                        >
                            <option value="">- เลือกตำแหน่ง -</option>
                            <option value="เภสัชกร">เภสัชกร (Pharmacist)</option>
                            <option value="พยาบาล">พยาบาล (Nurse)</option>
                            <option value="แพทย์">แพทย์ (Doctor)</option>
                            <option value="เจ้าหน้าที่ทั่วไป">เจ้าหน้าที่ทั่วไป (Staff)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-[#2D2A26] dark:text-zinc-300">Role (สิทธิ์การเข้าถึง)</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            // Disable Role editing if NOT Admin
                            disabled={currentUserRole !== 'Admin'}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-zinc-800/50"
                        >
                            <option value="Staff">Staff (ทั่วไป)</option>
                            <option value="Admin">Admin (ดูแลระบบ)</option>
                        </select>
                        {currentUserRole !== 'Admin' && <p className="text-xs text-muted-foreground mt-1">* คุณไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้</p>}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-colors">
                            ยกเลิก
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-[#D97736] text-white font-bold hover:bg-[#b05d28] disabled:opacity-50 transition-colors shadow-lg">
                            {submitting ? 'บันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
