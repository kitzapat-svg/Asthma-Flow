"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, UserPlus, Edit, Trash2, Shield, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserModal } from '@/components/user-modal';
import { toast } from 'sonner';

interface User {
    username: string;
    role: string;
    name: string;
    email: string;
    position?: string;
}

export default function UserManagementPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated') {
            // Check if Admin (In future we can check session.user.role)
            // For now, allow all staff to access or restrict? 
            // Requirement: Admin Only. 
            // Since we don't have role in session properly yet (next-auth type issue), 
            // we will assume if they can login via admin password they are admin.
            fetchUsers();
        }
    }, [status, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/db?type=users'); // We need to add 'users' type to GET in api/db
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("ดึงข้อมูลผู้ใช้ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (username: string) => {
        if (!confirm(`ยืนยันการลบผู้ใช้ "${username}"?`)) return;

        try {
            const res = await fetch(`/api/db?type=users&id=${username}`, { method: 'DELETE' }); // id maps to hn/username
            if (res.ok) {
                toast.success("ลบผู้ใช้เรียบร้อย");
                fetchUsers();
            } else {
                toast.error("ลบไม่สำเร็จ");
            }
        } catch (error) {
            toast.error("Error deleting user");
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setShowModal(true);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentUserRole = (session?.user as any)?.role;

    // Define columns based on Role
    // If Admin: show all. If Staff: show only their row (api returns only theirs anyway), hide Delete button.

    // Actually, per requirement: "Staff cannot see other users but can edit their own password/name/email".
    // API already filters the list for Staff to only show themselves.
    // So we just need to hide "Add User" and "Delete" button for Staff.
    // And maybe change "User Management" title to "My Profile" for Staff?

    if (loading) return <div className="p-10 text-center animate-pulse font-bold text-muted-foreground">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-[#2D2A26] dark:text-white" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-[#2D2A26] dark:text-white flex items-center gap-3">
                                {currentUserRole === 'Admin' ? <Users className="text-[#D97736]" size={32} /> : <Shield className="text-[#D97736]" size={32} />}
                                {currentUserRole === 'Admin' ? 'User Management' : 'My Profile'}
                            </h1>
                            <p className="text-muted-foreground">
                                {currentUserRole === 'Admin' ? 'จัดการสิทธิ์การเข้าใช้งานระบบ' : 'จัดการข้อมูลส่วนตัว'}
                            </p>
                        </div>
                    </div>

                    {currentUserRole === 'Admin' && (
                        <Button onClick={handleAddNew} className="bg-[#D97736] hover:bg-[#b05d28] text-white font-bold gap-2 shadow-lg hover:shadow-xl transition-all">
                            <UserPlus size={18} /> เพิ่มผู้ใช้งาน
                        </Button>
                    )}
                </div>

                {/* Search - Only for Admin? Or Staff too if they have many? (Staff has 1) */}
                {currentUserRole === 'Admin' && (
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ หรือ Username..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-transparent focus:border-[#D97736] rounded-xl shadow-sm focus:outline-none font-bold transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {/* User List */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#F7F3ED] dark:bg-zinc-800 text-[#2D2A26] dark:text-zinc-300">
                            <tr>
                                <th className="p-4 font-bold">ชื่อ</th>
                                <th className="p-4 font-bold">ตำแหน่ง</th>
                                <th className="p-4 font-bold">Username</th>
                                <th className="p-4 font-bold">Role</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredUsers.map((user) => (
                                <tr key={user.username} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-[#2D2A26] dark:text-white">{user.name}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{user.position || '-'}</td>
                                    <td className="p-4 font-mono text-sm text-gray-500 dark:text-gray-400">{user.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {currentUserRole === 'Admin' && (
                                            <button
                                                onClick={() => handleDelete(user.username)}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground font-bold">ไม่พบข้อมูล</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => setShowModal(false)}
                    onSaved={fetchUsers}
                    currentUserRole={currentUserRole}
                />
            )}
        </div>
    );
}
