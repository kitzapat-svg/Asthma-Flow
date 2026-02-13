"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Patient } from './types';

interface EditPatientModalProps {
    patient: Patient;
    onClose: () => void;
    onSaved: (updatedPatient: Patient) => void;
}

export function EditPatientModal({ patient, onClose, onSaved }: EditPatientModalProps) {
    const router = useRouter();
    const [editFormData, setEditFormData] = useState<Patient>({ ...patient });

    const [isDeleting, setIsDeleting] = useState(false);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const dataToUpdate = [
                patient.hn,
                editFormData.prefix,
                editFormData.first_name,
                editFormData.last_name,
                editFormData.dob,
                editFormData.best_pefr,
                editFormData.height,
                editFormData.status,
                patient.public_token,
                editFormData.phone || ""
            ];

            const res = await fetch('/api/db', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'patients',
                    hn: patient.hn,
                    data: dataToUpdate
                })
            });

            if (res.ok) {
                toast.success("บันทึกการแก้ไขเรียบร้อย");

                onSaved({ ...patient, ...editFormData });
                onClose();
            } else {
                toast.error("เกิดข้อผิดพลาดในการบันทึก");

            }
        } catch (e) {
            console.error(e);
            toast.error("เชื่อมต่อ Server ไม่ได้");

        }
    };

    const handleDelete = async () => {
        if (!confirm("⚠️ ยืนยันการลบข้อมูลผู้ป่วย?\nข้อมูลทั้งหมดจะหายไปและกู้คืนไม่ได้")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/db?type=patients&hn=${patient.hn}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("ลบข้อมูลเรียบร้อย");

                router.push('/staff/dashboard');
            } else {
                toast.error("เกิดข้อผิดพลาดในการลบ");

            }
        } catch (e) {
            toast.error("เชื่อมต่อ Server ไม่ได้");

        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg border-2 border-[#3D3834] dark:border-zinc-700 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-6 rounded-lg relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-[#2D2A26] dark:text-white">
                    <Edit className="text-[#D97736]" /> แก้ไขข้อมูลผู้ป่วย
                </h2>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">คำนำหน้า</label>
                            <select
                                value={editFormData.prefix}
                                onChange={e => setEditFormData({ ...editFormData, prefix: e.target.value })}
                                className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                            >
                                <option value="นาย">นาย</option>
                                <option value="นาง">นาง</option>
                                <option value="น.ส.">น.ส.</option>
                                <option value="ด.ช.">ด.ช.</option>
                                <option value="ด.ญ.">ด.ญ.</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">สถานะ</label>
                            <select
                                value={editFormData.status}
                                onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                            >
                                <option value="Active">Active</option>
                                <option value="COPD">COPD</option>
                                <option value="Discharge">Discharge</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">ชื่อ</label>
                            <input type="text" value={editFormData.first_name} onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">นามสกุล</label>
                            <input type="text" value={editFormData.last_name} onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">วันเกิด</label>
                            <input type="date" value={editFormData.dob} onChange={e => setEditFormData({ ...editFormData, dob: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">ส่วนสูง (cm)</label>
                            <input type="number" value={editFormData.height} onChange={e => setEditFormData({ ...editFormData, height: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Predicted PEFR</label>
                            <input type="number" value={editFormData.best_pefr} onChange={e => setEditFormData({ ...editFormData, best_pefr: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">เบอร์โทร</label>
                            <input type="tel" value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t dark:border-zinc-700">
                        <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200 flex items-center justify-center gap-2">
                            {isDeleting ? "กำลังลบ..." : <><Trash2 size={18} /> ลบผู้ป่วย</>}
                        </button>
                        <button type="submit" className="flex-[2] px-4 py-2 bg-[#D97736] text-white font-bold rounded hover:bg-[#c66a2e] flex items-center justify-center gap-2">
                            <Save size={18} /> บันทึกการแก้ไข
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
