"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, Plus, Edit2, Trash2, Check, X, Settings, 
  ChevronDown, ChevronRight, AlertTriangle, Activity 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DrpConfigPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role || "Staff";
  const isAdmin = userRole === "Admin";

  const [activeTab, setActiveTab] = useState<'categories' | 'interventions' | 'outcomes'>('categories');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Expanded tree state
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);
  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);

  // Form input states
  const [newItemName, setNewItemName] = useState("");
  const [newItemCode, setNewItemCode] = useState(""); // For category & type codes

  // Edit inline states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Check authorization - Admin only
  useEffect(() => {
    if (!loading && !isAdmin) {
      alert("สำหรับผู้ดูแลระบบ (Admin) เท่านั้น");
      router.push("/staff/drp-management");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db?type=drp_config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">กำลังโหลดการตั้งค่า DRP...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="mx-auto text-rose-500" size={48} />
        <h2 className="text-lg font-black text-foreground">ปฏิเสธการเข้าถึง</h2>
        <p className="text-sm text-muted-foreground">ขออภัย เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถจัดการตัวเลือกการตั้งค่า DRP ได้</p>
        <Link href="/staff/drp-management" className="inline-block retro-button px-4 py-2 text-xs font-bold uppercase">กลับหน้ารายการ DRP</Link>
      </div>
    );
  }

  // --- Category Actions ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCode) return;
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_category",
          data: { code: newItemCode, name: newItemName, sort_order: (config?.raw?.categories?.length || 0) + 1 }
        })
      });
      if (res.ok) {
        setNewItemName("");
        setNewItemCode("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editingName) return;
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_category",
          id,
          name: editingName
        })
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? (ตัวเลือกประเภทย่อยทั้งหมดในหมวดหมู่นี้จะถูกปิดใช้งานด้วย)")) return;
    try {
      const res = await fetch(`/api/db?type=drp_config_category&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchConfig();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Type Actions ---
  const handleAddType = async (categoryId: number) => {
    if (!newItemName || !newItemCode) return;
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_type",
          data: { category_id: categoryId, code: newItemCode, name: newItemName, sort_order: 1 }
        })
      });
      if (res.ok) {
        setNewItemName("");
        setNewItemCode("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateType = async (id: number) => {
    if (!editingName) return;
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_type",
          id,
          name: editingName
        })
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("คุณต้องการลบตัวเลือกชนิด DRP นี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/db?type=drp_config_type&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchConfig();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Cause Actions ---
  const handleAddCause = async (typeId: number) => {
    if (!newItemName) return;
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_cause",
          data: { type_id: typeId, name: newItemName, sort_order: 1 }
        })
      });
      if (res.ok) {
        setNewItemName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateCause = async (id: number) => {
    if (!editingName) return;
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_cause",
          id,
          name: editingName
        })
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCause = async (id: number) => {
    if (!confirm("คุณต้องการลบตัวเลือกสาเหตุ DRP นี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/db?type=drp_config_cause&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchConfig();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Intervention Actions ---
  const handleAddIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_intervention",
          data: { name: newItemName, sort_order: (config?.raw?.interventions?.length || 0) + 1 }
        })
      });
      if (res.ok) {
        setNewItemName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateIntervention = async (id: number) => {
    if (!editingName) return;
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_intervention",
          id,
          name: editingName
        })
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteIntervention = async (id: number) => {
    if (!confirm("คุณต้องการลบตัวเลือกการจัดการนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/db?type=drp_config_intervention&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchConfig();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Outcome Actions ---
  const handleAddOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_outcome",
          data: { name: newItemName, sort_order: (config?.raw?.outcomes?.length || 0) + 1 }
        })
      });
      if (res.ok) {
        setNewItemName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateOutcome = async (id: number) => {
    if (!editingName) return;
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_config_outcome",
          id,
          name: editingName
        })
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        fetchConfig();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteOutcome = async (id: number) => {
    if (!confirm("คุณต้องการลบตัวเลือกผลลัพธ์นี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/db?type=drp_config_outcome&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchConfig();
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Back button and page title */}
      <div className="flex items-center gap-3">
        <Link 
          href="/staff/drp-management" 
          className="p-2 border-2 border-border bg-card hover:bg-secondary rounded shadow-sm hover:translate-y-[-1px] transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-foreground">ตั้งค่าตัวเลือกดรอปดาวน์ DRP</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">DRP Configurator Portal</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-border gap-1">
        {[
          { id: 'categories', label: '1. หมวดหมู่ / ชนิด / สาเหตุ (Hierarchy)' },
          { id: 'interventions', label: '2. วิธีการจัดการ (Interventions)' },
          { id: 'outcomes', label: '3. ผลลัพธ์ (Outcomes)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              cancelEdit();
              setNewItemName("");
              setNewItemCode("");
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t transition-all cursor-pointer ${
              activeTab === tab.id 
                ? "bg-card border-border border-b-background translate-y-[2px]" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border-2 border-border p-6 retro-box-static space-y-6">

        {/* ================= CATEGORIES PANEL ================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">จัดหมวดหมู่ DRP (Categories, Types & Causes)</h3>
            
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-secondary/20 p-4 border border-border/60 rounded">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">รหัสหมวดหมู่ (Code)เช่น C1</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น C1"
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-border focus:border-primary bg-background rounded outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 font-bold">ชื่อหมวดหมู่ (Category Name)*</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่อหมวดหมู่ DRP..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border-2 border-border focus:border-primary bg-background rounded outline-none"
                  />
                  <button type="submit" className="retro-button-primary px-4 py-1.5 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer">
                    <Plus size={14} /> เพิ่ม
                  </button>
                </div>
              </div>
            </form>

            {/* Hierarchy Tree */}
            <div className="space-y-3">
              {config?.raw?.categories?.filter((c: any) => c.is_active).map((cat: any) => {
                const isCatExpanded = expandedCatId === cat.id;
                
                return (
                  <div key={cat.id} className="border border-border/80 rounded bg-secondary/10 overflow-hidden">
                    {/* Category Header Row */}
                    <div className="flex items-center justify-between p-3 bg-secondary/20 border-b border-border/40">
                      <button 
                        onClick={() => {
                          setExpandedCatId(isCatExpanded ? null : cat.id);
                          setExpandedTypeId(null);
                          cancelEdit();
                          setNewItemName("");
                          setNewItemCode("");
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer text-left flex-1"
                      >
                        {isCatExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span>[{cat.code}] {cat.name}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {editingId === cat.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2 py-0.5 text-xs border border-border outline-none bg-background rounded"
                            />
                            <button onClick={() => handleUpdateCategory(cat.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => startEdit(cat.id, cat.name)} className="p-1 hover:bg-secondary rounded text-primary border border-transparent hover:border-border"><Edit2 size={12} /></button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 hover:bg-rose-50 rounded text-rose-600 border border-transparent hover:border-rose-100"><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Category Expanded View (Shows Types) */}
                    {isCatExpanded && (
                      <div className="p-4 space-y-4 bg-background">
                        <div className="border-l-2 border-border/40 pl-4 space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">ชนิดย่อย DRP (Types):</h4>
                          
                          {/* Add Type Form */}
                          <div className="flex flex-col sm:flex-row gap-2 bg-secondary/10 p-3 border border-border/20 rounded">
                            <input
                              type="text"
                              placeholder="รหัสชนิด เช่น 1.1"
                              value={newItemCode}
                              onChange={(e) => setNewItemCode(e.target.value)}
                              className="px-3 py-1 text-xs border border-border focus:border-primary outline-none bg-background rounded sm:w-32"
                            />
                            <input
                              type="text"
                              placeholder="ชื่อชนิด DRP ย่อย..."
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="flex-1 px-3 py-1 text-xs border border-border focus:border-primary outline-none bg-background rounded"
                            />
                            <button 
                              type="button"
                              onClick={() => handleAddType(cat.id)}
                              className="retro-button-primary px-3 py-1 text-xs font-bold uppercase cursor-pointer"
                            >
                              เพิ่มชนิด
                            </button>
                          </div>

                          {/* Types list */}
                          <div className="space-y-2">
                            {config?.raw?.types?.filter((t: any) => t.category_id === cat.id && t.is_active).map((type: any) => {
                              const isTypeExpanded = expandedTypeId === type.id;

                              return (
                                <div key={type.id} className="border border-border/40 rounded bg-secondary/5 overflow-hidden">
                                  {/* Type header */}
                                  <div className="flex items-center justify-between p-2 bg-secondary/15">
                                    <button
                                      onClick={() => {
                                        setExpandedTypeId(isTypeExpanded ? null : type.id);
                                        cancelEdit();
                                        setNewItemName("");
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer text-left flex-1"
                                    >
                                      {isTypeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                      <span>[{type.code}] {type.name}</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                      {editingId === type.id ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="px-2 py-0.5 text-[11px] border border-border outline-none bg-background rounded"
                                          />
                                          <button onClick={() => handleUpdateType(type.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={12} /></button>
                                          <button onClick={cancelEdit} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><X size={12} /></button>
                                        </div>
                                      ) : (
                                        <>
                                          <button onClick={() => startEdit(type.id, type.name)} className="p-1 hover:bg-secondary rounded text-primary"><Edit2 size={11} /></button>
                                          <button onClick={() => handleDeleteType(type.id)} className="p-1 hover:bg-rose-50 rounded text-rose-600"><Trash2 size={11} /></button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Type Expanded (Shows Causes) */}
                                  {isTypeExpanded && (
                                    <div className="p-3 bg-background border-t border-border/20">
                                      <div className="border-l-2 border-border/30 pl-4 space-y-2">
                                        <h5 className="text-[11px] font-bold text-muted-foreground uppercase">สาเหตุเกิดปัญหา (Causes):</h5>

                                        {/* Add Cause Form */}
                                        <div className="flex gap-2 bg-secondary/5 p-2 border border-border/10 rounded">
                                          <input
                                            type="text"
                                            placeholder="เพิ่มสาเหตุเกิดปัญหา..."
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="w-full px-3 py-1 text-xs border border-border focus:border-primary outline-none bg-background rounded"
                                          />
                                          <button 
                                            type="button" 
                                            onClick={() => handleAddCause(type.id)}
                                            className="retro-button-primary px-3 py-1 text-xs font-bold uppercase cursor-pointer"
                                          >
                                            เพิ่มสาเหตุ
                                          </button>
                                        </div>

                                        {/* Causes list */}
                                        <div className="space-y-1">
                                          {config?.raw?.causes?.filter((c: any) => c.type_id === type.id && c.is_active).map((cause: any) => (
                                            <div key={cause.id} className="flex items-center justify-between p-1.5 border border-border/20 rounded bg-background/50 text-[11px] font-bold">
                                              {editingId === cause.id ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                  <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="w-full px-2 py-0.5 border border-border outline-none bg-background rounded"
                                                  />
                                                  <button onClick={() => handleUpdateCause(cause.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={10} /></button>
                                                  <button onClick={cancelEdit} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><X size={10} /></button>
                                                </div>
                                              ) : (
                                                <>
                                                  <span className="text-foreground">{cause.name}</span>
                                                  <div className="flex items-center gap-1.5">
                                                    <button onClick={() => startEdit(cause.id, cause.name)} className="p-0.5 text-primary hover:bg-secondary rounded"><Edit2 size={10} /></button>
                                                    <button onClick={() => handleDeleteCause(cause.id)} className="p-0.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={10} /></button>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= INTERVENTIONS PANEL ================= */}
        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">วิธีการจัดการปัญหาจากยา (Interventions list)</h3>

            <form onSubmit={handleAddIntervention} className="flex gap-2 bg-secondary/20 p-4 border border-border/60 rounded">
              <input
                type="text"
                required
                placeholder="เพิ่มตัวเลือกการจัดการใหม่..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary bg-background rounded outline-none"
              />
              <button type="submit" className="retro-button-primary px-5 py-2 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer">
                <Plus size={16} /> เพิ่ม
              </button>
            </form>

            <div className="border border-border rounded divide-y divide-border">
              {config?.raw?.interventions?.filter((i: any) => i.is_active).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 bg-background hover:bg-secondary/10 transition-colors text-sm font-bold">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-1 border-2 border-border outline-none bg-background rounded"
                      />
                      <button onClick={() => handleUpdateIntervention(item.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-border/20"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-border/20"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(item.id, item.name)} className="p-1.5 hover:bg-secondary rounded text-primary border border-transparent hover:border-border"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteIntervention(item.id)} className="p-1.5 hover:bg-rose-50 rounded text-rose-600 border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= OUTCOMES PANEL ================= */}
        {activeTab === 'outcomes' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">ผลลัพธ์การจัดการปัญหา DRP (Outcomes list)</h3>

            <form onSubmit={handleAddOutcome} className="flex gap-2 bg-secondary/20 p-4 border border-border/60 rounded">
              <input
                type="text"
                required
                placeholder="เพิ่มตัวเลือกผลลัพธ์ใหม่..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary bg-background rounded outline-none"
              />
              <button type="submit" className="retro-button-primary px-5 py-2 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer">
                <Plus size={16} /> เพิ่ม
              </button>
            </form>

            <div className="border border-border rounded divide-y divide-border">
              {config?.raw?.outcomes?.filter((o: any) => o.is_active).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3.5 bg-background hover:bg-secondary/10 transition-colors text-sm font-bold">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-1 border-2 border-border outline-none bg-background rounded"
                      />
                      <button onClick={() => handleUpdateOutcome(item.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-border/20"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-border/20"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(item.id, item.name)} className="p-1.5 hover:bg-secondary rounded text-primary border border-transparent hover:border-border"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteOutcome(item.id)} className="p-1.5 hover:bg-rose-50 rounded text-rose-600 border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
