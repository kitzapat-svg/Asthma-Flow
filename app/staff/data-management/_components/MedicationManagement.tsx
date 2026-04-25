"use client";

import { useState, useEffect } from 'react';
import { 
  Pill, Plus, Trash2, Loader2, Save, X, Activity, RefreshCw, 
  Pencil, Check, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MedItem {
  name: string;
  generic_name: string;
  type: 'Controller' | 'Reliever';
}

export function MedicationManagement() {
  const [controllerItems, setControllerItems] = useState<MedItem[]>([]);
  const [relieverItems, setRelieverItems] = useState<MedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add new item state
  const [newController, setNewController] = useState({ name: '', generic_name: '' });
  const [newReliever, setNewReliever] = useState({ name: '', generic_name: '' });

  // Edit state
  const [editingItem, setEditingItem] = useState<string | null>(null); // key = name
  const [editForm, setEditForm] = useState({ name: '', generic_name: '' });

  const fetchMeds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/medication-list');
      if (res.ok) {
        const data = await res.json();
        setControllerItems(data.controllerItems || []);
        setRelieverItems(data.relieverItems || []);
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

  const handleAddMed = async (type: 'Controller' | 'Reliever') => {
    const item = type === 'Controller' ? newController : newReliever;
    if (!item.name.trim()) {
      toast.error("กรุณาระบุชื่อยา");
      return;
    }

    setActionLoading(`add-${type}`);
    try {
      const res = await fetch('/api/medication-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: item.name.trim(), generic_name: item.generic_name.trim() })
      });

      if (res.ok) {
        toast.success(`เพิ่ม ${item.name} สำเร็จ`);
        if (type === 'Controller') setNewController({ name: '', generic_name: '' });
        else setNewReliever({ name: '', generic_name: '' });
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

  const handleEditMed = async (oldName: string) => {
    if (!editForm.name.trim()) {
      toast.error("ชื่อยาไม่สามารถว่างได้");
      return;
    }

    setActionLoading(`edit-${oldName}`);
    try {
      const res = await fetch('/api/medication-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldName, 
          newName: editForm.name.trim(), 
          generic_name: editForm.generic_name.trim() 
        })
      });

      if (res.ok) {
        toast.success(`อัพเดต ${editForm.name} สำเร็จ`);
        setEditingItem(null);
        fetchMeds();
      } else {
        toast.error("เกิดข้อผิดพลาดในการแก้ไขยา");
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

    setActionLoading(`del-${name}`);
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

  const startEditing = (item: MedItem) => {
    setEditingItem(item.name);
    setEditForm({ name: item.name, generic_name: item.generic_name });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({ name: '', generic_name: '' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <p className="font-bold text-muted-foreground">กำลังโหลดรายการยา...</p>
      </div>
    );
  }

  const renderMedCard = (
    item: MedItem,
    accentColor: string,
    iconBgClass: string,
    iconTextClass: string,
    hoverBgClass: string,
    hoverBorderClass: string,
  ) => {
    const isEditing = editingItem === item.name;
    const isLoading = actionLoading === `edit-${item.name}` || actionLoading === `del-${item.name}`;

    if (isEditing) {
      return (
        <div 
          key={item.name} 
          className="p-4 bg-white dark:bg-zinc-800 rounded-xl border-2 border-[#D97736] ring-2 ring-[#D97736]/20 space-y-3 animate-in fade-in"
        >
          {/* Trade Name */}
          <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
              ชื่อการค้า (Trade Name)
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-zinc-900 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
              autoFocus
            />
          </div>

          {/* Generic Name */}
          <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
              ชื่อสามัญ (Generic Name)
            </label>
            <input
              type="text"
              value={editForm.generic_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, generic_name: e.target.value }))}
              placeholder="เช่น Salmeterol/Fluticasone"
              className="w-full bg-gray-50 dark:bg-zinc-900 border-none rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={cancelEditing}
              className="px-3 py-1.5 text-xs font-bold text-muted-foreground bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1"
            >
              <X size={12} /> ยกเลิก
            </button>
            <button
              onClick={() => handleEditMed(item.name)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#D97736] hover:bg-[#c2652a] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={12} /> : <Check size={12} />}
              บันทึก
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={item.name} 
        className={`group flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl ${hoverBgClass} border border-transparent ${hoverBorderClass} transition-all`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-lg ${iconBgClass} flex items-center justify-center ${iconTextClass} shrink-0`}>
            <Pill size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{item.name}</div>
            {item.generic_name ? (
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <FileText size={10} className="shrink-0" />
                {item.generic_name}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground/40 italic">ยังไม่ได้ระบุชื่อสามัญ</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => startEditing(item)}
            className="p-2 text-muted-foreground hover:text-[#D97736] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
            title="แก้ไข"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={() => handleDeleteMed(item.name)}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all disabled:opacity-50"
            title="ลบ"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    );
  };

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
              {controllerItems.length} Items
            </span>
          </div>
          <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[500px]">
            {controllerItems.map((item) => 
              renderMedCard(
                item,
                '#D97736',
                'bg-orange-100 dark:bg-orange-900/30',
                'text-orange-600 dark:text-orange-400',
                'hover:bg-orange-50 dark:hover:bg-orange-900/10',
                'hover:border-orange-200 dark:hover:border-orange-800'
              )
            )}
            {controllerItems.length === 0 && (
              <p className="text-center py-10 text-sm text-muted-foreground italic">ไม่มีรายการยา</p>
            )}
          </div>

          {/* Add New Controller */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-zinc-800 p-4 space-y-2">
            <div className="flex gap-2">
              <input 
                placeholder="ชื่อการค้า (Trade Name)..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={newController.name}
                onChange={(e) => setNewController(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed('Controller')}
              />
            </div>
            <div className="flex gap-2">
              <input 
                placeholder="ชื่อสามัญ (Generic Name)..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736] text-muted-foreground"
                value={newController.generic_name}
                onChange={(e) => setNewController(prev => ({ ...prev, generic_name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed('Controller')}
              />
              <Button 
                onClick={() => handleAddMed('Controller')}
                disabled={actionLoading === 'add-Controller' || !newController.name.trim()}
                className="rounded-xl font-bold bg-[#D97736] hover:bg-[#c2652a] shrink-0"
              >
                {actionLoading === 'add-Controller' ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
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
              {relieverItems.length} Items
            </span>
          </div>
          <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[500px]">
            {relieverItems.map((item) => 
              renderMedCard(
                item,
                '#2D2A26',
                'bg-zinc-200 dark:bg-zinc-700',
                'text-zinc-600 dark:text-zinc-400',
                'hover:bg-zinc-100 dark:hover:bg-zinc-700',
                'hover:border-zinc-200 dark:hover:border-zinc-600'
              )
            )}
            {relieverItems.length === 0 && (
              <p className="text-center py-10 text-sm text-muted-foreground italic">ไม่มีรายการยา</p>
            )}
          </div>

          {/* Add New Reliever */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-zinc-800 p-4 space-y-2">
            <div className="flex gap-2">
              <input 
                placeholder="ชื่อการค้า (Trade Name)..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736]"
                value={newReliever.name}
                onChange={(e) => setNewReliever(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed('Reliever')}
              />
            </div>
            <div className="flex gap-2">
              <input 
                placeholder="ชื่อสามัญ (Generic Name)..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm outline-none ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-[#D97736] text-muted-foreground"
                value={newReliever.generic_name}
                onChange={(e) => setNewReliever(prev => ({ ...prev, generic_name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed('Reliever')}
              />
              <Button 
                onClick={() => handleAddMed('Reliever')}
                disabled={actionLoading === 'add-Reliever' || !newReliever.name.trim()}
                className="rounded-xl font-bold bg-[#2D2A26] dark:bg-zinc-700 dark:hover:bg-zinc-600 shrink-0"
              >
                {actionLoading === 'add-Reliever' ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
