
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Pill, Activity, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function MedicationManagementPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [controllers, setControllers] = useState<string[]>([]);
    const [relievers, setRelievers] = useState<string[]>([]);

    const [newController, setNewController] = useState('');
    const [newReliever, setNewReliever] = useState('');

    const fetchList = async () => {
        try {
            const res = await fetch('/api/medication-list');
            const data = await res.json();
            if (data.controllers) setControllers(data.controllers);
            if (data.relievers) setRelievers(data.relievers);
        } catch {
            toast.error('Failed to load medication list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            if (session.user.role === 'Admin') {
                fetchList();
            } else {
                setLoading(false);
            }
        }
    }, [status, session?.user.role]);

    const addMedication = async (type: 'Controller' | 'Reliever', name: string, setInput: (s: string) => void) => {
        if (!name.trim()) return;
        try {
            const res = await fetch('/api/medication-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, name }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Added ${name}`);
                setInput('');
                fetchList();
            } else {
                toast.error('Failed to add');
            }
        } catch {
            toast.error('Error adding medication');
        }
    };

    const deleteMedication = async (name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            const res = await fetch('/api/medication-list', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Deleted ${name}`);
                fetchList();
            } else {
                toast.error('Failed to delete');
            }
        } catch {
            toast.error('Error deleting medication');
        }
    };

    const inputClass = "w-full px-4 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary";
    const isAdmin = session?.user.role === 'Admin';

    if (status === 'loading' || loading) {
        return <div className="p-10 text-center animate-pulse font-bold text-muted-foreground">Loading...</div>;
    }

    if (status !== 'authenticated' || !isAdmin) {
        return (
            <div className="min-h-screen bg-background dark:bg-black p-6 font-sans text-foreground dark:text-white">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Button variant="ghost" onClick={() => router.push('/staff/patients')} className="flex gap-2 font-bold hover:text-primary">
                        <ArrowLeft size={20} /> Back
                    </Button>
                    <div className="border border-border bg-card p-6 rounded-lg space-y-3">
                        <ShieldAlert className="text-destructive" size={32} />
                        <h1 className="text-2xl font-black">Access denied</h1>
                        <p className="text-muted-foreground">This medication administration page is available to Admin users only.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark:bg-black p-6 pb-20 font-sans text-foreground dark:text-white transition-colors duration-300">
            <nav className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
                <Button variant="ghost" onClick={() => router.back()} className="flex gap-2 font-bold hover:text-primary">
                    <ArrowLeft size={20} /> Back
                </Button>
            </nav>

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex gap-3 mb-6 items-center border-b pb-4">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center text-white rounded-lg shadow-md"><Pill size={24} /></div>
                    <div>
                        <h1 className="text-2xl font-black">Medication Management</h1>
                        <p className="text-muted-foreground">Add, Edit, or Remove medications from the system.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Controllers */}
                    <div className="bg-white dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold flex gap-2 items-center mb-4 text-blue-600 dark:text-blue-400">
                            <Activity size={18} /> Controllers (ยาควบคุม)
                        </h2>

                        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                            {loading ? <p className="text-sm text-gray-400 animate-pulse">Loading...</p> :
                                controllers.length === 0 ? <p className="text-sm text-gray-400 italic">No medications found.</p> :
                                    controllers.map((med, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg group hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                                            <span className="font-medium">{med}</span>
                                            <button onClick={() => deleteMedication(med)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            <input
                                type="text"
                                value={newController}
                                onChange={(e) => setNewController(e.target.value)}
                                placeholder="Add new controller..."
                                className={inputClass}
                                onKeyDown={(e) => e.key === 'Enter' && addMedication('Controller', newController, setNewController)}
                            />
                            <Button onClick={() => addMedication('Controller', newController, setNewController)} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                                <Plus size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* Relievers */}
                    <div className="bg-white dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold flex gap-2 items-center mb-4 text-green-600 dark:text-green-400">
                            <Activity size={18} /> Relievers (ยาบรรเทาอาการ)
                        </h2>

                        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                            {loading ? <p className="text-sm text-gray-400 animate-pulse">Loading...</p> :
                                relievers.length === 0 ? <p className="text-sm text-gray-400 italic">No medications found.</p> :
                                    relievers.map((med, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg group hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                                            <span className="font-medium">{med}</span>
                                            <button onClick={() => deleteMedication(med)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            <input
                                type="text"
                                value={newReliever}
                                onChange={(e) => setNewReliever(e.target.value)}
                                placeholder="Add new reliever..."
                                className={inputClass}
                                onKeyDown={(e) => e.key === 'Enter' && addMedication('Reliever', newReliever, setNewReliever)}
                            />
                            <Button onClick={() => addMedication('Reliever', newReliever, setNewReliever)} size="icon" className="shrink-0 bg-green-600 hover:bg-green-700">
                                <Plus size={20} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
