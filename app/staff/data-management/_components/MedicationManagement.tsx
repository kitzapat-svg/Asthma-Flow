"use client";

import { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Loader2, Save, X, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MedicationManagement() {
  const [meds, setMeds] = useState<{ controllers: string[], relievers: string[] }>({
    controllers: [],
    relievers: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', type: 'Controller' as 'Controller' | 'Reliever' });

  const fetchMeds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/medication-list');
      if (res.ok) {
        const data = await res.json();
        setMeds(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถดึงข้อมูลยาได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleAddMed = async () => {
    if (!newItem.name.trim()) {
      toast.error("กรุณาระบุชื่อยา");
      return;
    }

    setActionLoading('add');
    try {
      const res = await fetch('/api/medication-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (res.ok) {
        toast.success(`เพิ่ม ${newItem.name} สำเร็จ`);
        setNewItem({ ...newItem, name: '' });
        fetchMeds();
      } else {
        toast.error("เกิดข้อผิดพลาดในการเพิ่มยา");
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMed = async (name: string) => {
    if (!confirm(`คุณต้องการลบ "${name}" ออกจากรายการใช่หรือไม่?`)) return;

    setActionLoading(name);
    try {
      const res = await fetch('/api/medication-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        toast.success(`ลบ ${name} เรียบร้อยแล้ว`);
        fetchMeds();
      } else {
        toast.error("เกิดข้อผิดพลาดในการลบยา");
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <p className="font-bold text-muted-foreground">กำลังโหลดรายการยา...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controllers Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-[#D97736] p-4 flex items-center justify-between">
            <h3 className="text-white font-black flex items-center gap-2">
              <Activity size={20} /> Controller Medications
            </h3>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {meds.controllers.length} Items
            </span>
          </div>
          <div className="p-6 flex-1 space-y-4">
            <div className="space-y-2">
              {meds.controllers.map((name) => (
                <div key={name} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/10 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                      <Pill size={16} />
                    </div>
                    <span className="font-bold">{name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteMed(name)}
                    disabled={actionLoading === name}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {actionLoading === name ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              ))}
              {meds.controllers.length === 0 && (
                <p className="text-center py-10 text-sm text-muted-foreground italic">ไม่มีรายการยา</p>
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex gap-2">
              <input 
                placeholder="ชื่อยา Controller ใหม่..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={newItem.type === 'Controller' ? newItem.name : ''}
                onChange={(e) => setNewItem({ name: e.target.value, type: 'Controller' })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed()}
              />
              <Button 
                onClick={handleAddMed}
                disabled={actionLoading === 'add' || newItem.type !== 'Controller' || !newItem.name}
                className="rounded-xl font-bold bg-[#D97736] hover:bg-[#c2652a]"
              >
                {actionLoading === 'add' && newItem.type === 'Controller' ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Relievers Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-[#2D2A26] dark:bg-zinc-800 p-4 flex items-center justify-between">
            <h3 className="text-white font-black flex items-center gap-2">
              <RefreshCw size={20} /> Reliever Medications
            </h3>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {meds.relievers.length} Items
            </span>
          </div>
          <div className="p-6 flex-1 space-y-4">
            <div className="space-y-2">
              {meds.relievers.map((name) => (
                <div key={name} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                      <Pill size={16} />
                    </div>
                    <span className="font-bold">{name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteMed(name)}
                    disabled={actionLoading === name}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {actionLoading === name ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              ))}
              {meds.relievers.length === 0 && (
                <p className="text-center py-10 text-sm text-muted-foreground italic">ไม่มีรายการยา</p>
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex gap-2">
              <input 
                placeholder="ชื่อยา Reliever ใหม่..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={newItem.type === 'Reliever' ? newItem.name : ''}
                onChange={(e) => setNewItem({ name: e.target.value, type: 'Reliever' })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed()}
              />
              <Button 
                onClick={handleAddMed}
                disabled={actionLoading === 'add' || newItem.type !== 'Reliever' || !newItem.name}
                className="rounded-xl font-bold bg-[#2D2A26] dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                {actionLoading === 'add' && newItem.type === 'Reliever' ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
