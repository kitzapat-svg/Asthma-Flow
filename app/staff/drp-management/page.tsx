"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { 
  Search, Plus, Edit2, History, Trash2, RefreshCcw, Settings, 
  AlertTriangle, Check, X, Calendar, User, ExternalLink, 
  Clock, AlertCircle, Eye, ChevronRight 
} from "lucide-react";
import Link from "next/link";
import { DRP, DrpWithPatient, DrpHistoryEntry } from "@/lib/types";
import { DRP_DATA, INTERVENTION_OPTIONS, OUTCOME_OPTIONS } from "@/lib/drp-data";
import { filterDrpsByFiscalYear, getCurrentFiscalYear, isClosed } from "@/lib/drp-helpers";

export default function DrpManagementPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "Staff";
  const username = (session?.user as any)?.id || session?.user?.email || "System";
  const isAdminOrPharmacist = userRole === "Admin" || userRole === "Pharmacist";

  // Data states
  const [drps, setDrps] = useState<DrpWithPatient[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbConfig, setDbConfig] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'failed' | 'closed'>('open');
  const [categoryFilter, setCategoryFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [fiscalYear, setFiscalYear] = useState<number>(getCurrentFiscalYear());

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Active items for modals
  const [selectedDrp, setSelectedDrp] = useState<DrpWithPatient | null>(null);
  const [historyLogs, setHistoryLogs] = useState<DrpHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Create Standalone DRP Form state
  const [createForm, setCreateForm] = useState({
    hn: "",
    visit_date: new Date().toISOString().split('T')[0],
    category: "",
    type: "",
    cause: "",
    customCause: "",
    intervention: "",
    customIntervention: "",
    outcome: "อยู่ระหว่างติดตามผล (Monitoring / Follow-up required)",
    customOutcome: "",
    note: ""
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");

  // Edit DRP Form state
  const [editForm, setEditForm] = useState({
    category: "",
    type: "",
    cause: "",
    customCause: "",
    intervention: "",
    customIntervention: "",
    outcome: "",
    customOutcome: "",
    status: 'open' as 'open' | 'resolved' | 'failed',
    note: "",
    visit_date: ""
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch DRP list
      const drpRes = await fetch("/api/db?type=drps_all");
      const drpData = await drpRes.json();
      if (Array.isArray(drpData)) {
        setDrps(drpData);
      }

      // 2. Fetch Patients list for dropdown
      const patientRes = await fetch("/api/db?type=patients");
      const patientData = await patientRes.json();
      if (Array.isArray(patientData)) {
        setPatients(patientData);
      }

      // 3. Fetch DRP config dropdowns from DB
      const configRes = await fetch("/api/db?type=drp_config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setDbConfig(configData);
      }
    } catch (error) {
      console.error("Error fetching DRP data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get active config source (DB config fallback to file config)
  const configSource = useMemo(() => {
    if (dbConfig && dbConfig.categories && dbConfig.categories.length > 0) {
      return {
        categories: dbConfig.categories,
        interventions: dbConfig.interventions,
        outcomes: dbConfig.outcomes
      };
    }
    // Fallback static config
    return {
      categories: DRP_DATA.map(c => ({
        id: c.id,
        name: c.name,
        types: c.types.map(t => ({
          id: t.id,
          name: t.name,
          causes: t.causes
        }))
      })),
      interventions: INTERVENTION_OPTIONS,
      outcomes: OUTCOME_OPTIONS
    };
  }, [dbConfig]);

  // Filtered DRPs
  const filteredDrps = useMemo(() => {
    let result = [...drps];

    // 1. Fiscal Year filter
    result = filterDrpsByFiscalYear(result, fiscalYear);

    // 2. Status filter
    if (statusFilter === 'open') {
      result = result.filter(d => d.status === 'open');
    } else if (statusFilter === 'resolved') {
      result = result.filter(d => d.status === 'resolved');
    } else if (statusFilter === 'failed') {
      result = result.filter(d => d.status === 'failed');
    } else if (statusFilter === 'closed') {
      result = result.filter(d => d.status === 'resolved' || d.status === 'failed');
    }

    // 3. Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(d => {
        // category text starts with the number, e.g. "1. ปัญหาด้าน..."
        return d.category.startsWith(categoryFilter + ".") || d.category.startsWith(categoryFilter + " ");
      });
    }

    // 4. Search query (HN, Name)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => 
        d.hn.toLowerCase().includes(q) || 
        d.patient_name?.toLowerCase().includes(q) ||
        d.note.toLowerCase().includes(q)
      );
    }

    return result;
  }, [drps, fiscalYear, statusFilter, categoryFilter, searchQuery]);

  // Metrics computation for cards
  const metrics = useMemo(() => {
    // Computes based on fiscal year and category filter (ignores status)
    let yearFiltered = filterDrpsByFiscalYear(drps, fiscalYear);
    if (categoryFilter !== 'all') {
      yearFiltered = yearFiltered.filter(d => d.category.startsWith(categoryFilter + "."));
    }

    const total = yearFiltered.length;
    const open = yearFiltered.filter(d => d.status === 'open').length;
    const resolved = yearFiltered.filter(d => d.status === 'resolved').length;
    const failed = yearFiltered.filter(d => d.status === 'failed').length;

    return { total, open, resolved, failed };
  }, [drps, fiscalYear, categoryFilter]);

  // Handle DRP Creation Standalone
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.hn) {
      alert("กรุณาเลือกผู้ป่วย");
      return;
    }
    if (!createForm.category || !createForm.type || !createForm.cause || !createForm.intervention) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const finalCause = createForm.cause === "อื่นๆ (ระบุ)..." ? createForm.customCause : createForm.cause;
    const finalIntervention = createForm.intervention === "อื่นๆ (ระบุ)..." ? createForm.customIntervention : createForm.intervention;
    const finalOutcome = createForm.outcome === "อื่นๆ (ระบุ)..." ? createForm.customOutcome : createForm.outcome;

    const newDrp = {
      id: crypto.randomUUID(),
      hn: createForm.hn,
      created_date: new Date().toISOString(),
      visit_date: createForm.visit_date,
      category: createForm.category,
      type: createForm.type,
      cause: finalCause,
      intervention: finalIntervention,
      outcome: finalOutcome,
      note: createForm.note || "-",
      status: (finalOutcome.includes('Resolved') || finalOutcome.includes('สำเร็จ')) ? 'resolved' : 'open'
    };

    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_standalone",
          data: newDrp
        })
      });

      if (res.ok) {
        setIsCreateOpen(false);
        // Reset form
        setCreateForm({
          hn: "",
          visit_date: new Date().toISOString().split('T')[0],
          category: "",
          type: "",
          cause: "",
          customCause: "",
          intervention: "",
          customIntervention: "",
          outcome: "อยู่ระหว่างติดตามผล (Monitoring / Follow-up required)",
          customOutcome: "",
          note: ""
        });
        setSelectedPatientName("");
        setPatientSearch("");
        fetchData();
      } else {
        const err = await res.json();
        alert("เกิดข้อผิดพลาด: " + err.error);
      }
    } catch (error) {
      console.error(error);
      alert("บันทึก DRP ล้มเหลว");
    }
  };

  // Open Edit Modal
  const openEditModal = (drp: DrpWithPatient) => {
    setSelectedDrp(drp);
    
    // Check if cause matches standard options
    const categoryObj = configSource.categories.find((c: any) => c.name === drp.category);
    const typeObj = categoryObj?.types.find((t: any) => t.name === drp.type);
    const isStandardCause = typeObj?.causes.includes(drp.cause);

    const isStandardIntervention = configSource.interventions.includes(drp.intervention);
    const isStandardOutcome = configSource.outcomes.includes(drp.outcome);

    setEditForm({
      category: drp.category,
      type: drp.type,
      cause: isStandardCause ? drp.cause : (drp.cause ? "อื่นๆ (ระบุ)..." : ""),
      customCause: isStandardCause ? "" : drp.cause,
      intervention: isStandardIntervention ? drp.intervention : (drp.intervention ? "อื่นๆ (ระบุ)..." : ""),
      customIntervention: isStandardIntervention ? "" : drp.intervention,
      outcome: isStandardOutcome ? drp.outcome : (drp.outcome ? "อื่นๆ (ระบุ)..." : ""),
      customOutcome: isStandardOutcome ? "" : drp.outcome,
      status: drp.status,
      note: drp.note,
      visit_date: drp.visit_date
    });
    setIsEditOpen(true);
  };

  // Handle DRP Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrp) return;

    const finalCause = editForm.cause === "อื่นๆ (ระบุ)..." ? editForm.customCause : editForm.cause;
    const finalIntervention = editForm.intervention === "อื่นๆ (ระบุ)..." ? editForm.customIntervention : editForm.intervention;
    const finalOutcome = editForm.outcome === "อื่นๆ (ระบุ)..." ? editForm.customOutcome : editForm.outcome;

    // Automatically set status based on outcome
    let status = editForm.status;
    if (finalOutcome.includes('Resolved') || finalOutcome.includes('สำเร็จ')) {
      status = 'resolved';
    } else if (finalOutcome.includes('ไม่สำเร็จ')) {
      status = 'failed';
    }

    const payload = {
      category: editForm.category,
      type: editForm.type,
      cause: finalCause,
      intervention: finalIntervention,
      outcome: finalOutcome,
      note: editForm.note,
      status: status,
      visit_date: editForm.visit_date
    };

    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_update",
          id: selectedDrp.id,
          data: payload
        })
      });

      if (res.ok) {
        setIsEditOpen(false);
        fetchData();
      } else {
        alert("เกิดข้อผิดพลาดในการแก้ไข");
      }
    } catch (error) {
      console.error(error);
      alert("แก้ไข DRP ล้มเหลว");
    }
  };

  // Reopen closed DRP
  const handleReopen = async (drp: DrpWithPatient) => {
    if (!confirm("คุณต้องการเปิดเคส DRP นี้ขึ้นมาติดตามอีกครั้งใช่หรือไม่?")) return;
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drp_update",
          id: drp.id,
          data: { 
            status: 'open',
            outcome: "อยู่ระหว่างติดตามผล (Monitoring / Follow-up required)" 
          }
        })
      });

      if (res.ok) {
        fetchData();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete DRP
  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบรายการ DRP นี้อย่างถาวรใช่หรือไม่? (การดำเนินการนี้จะลบประวัติการเปลี่ยนแปลงทั้งหมดด้วย)")) return;
    try {
      const res = await fetch(`/api/db?type=drp&id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        fetchData();
      } else {
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch and show history
  const openHistoryModal = async (drp: DrpWithPatient) => {
    setSelectedDrp(drp);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/db?type=drp_history&id=${drp.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistoryLogs(data);
      } else {
        setHistoryLogs([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtered patient list for standalone creation dropdown
  const filteredPatients = useMemo(() => {
    if (patientSearch.trim() === "") return [];
    const q = patientSearch.toLowerCase().trim();
    return patients.filter(p => 
      p.hn.toLowerCase().includes(q) || 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
    ).slice(0, 5); // Limit 5 options
  }, [patients, patientSearch]);

  // Date Formatter helpers
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatThaiDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('th-TH', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d) + " น.";
    } catch {
      return dateStr;
    }
  };

  // Config categories options for dropdowns mapping
  const selectedCreateCategory = configSource.categories.find((c: any) => c.name === createForm.category);
  const selectedCreateType = selectedCreateCategory?.types.find((t: any) => t.name === createForm.type);

  const selectedEditCategory = configSource.categories.find((c: any) => c.name === editForm.category);
  const selectedEditType = selectedEditCategory?.types.find((t: any) => t.name === editForm.type);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 border-2 border-border retro-box-static">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 border-2 border-foreground text-foreground rounded shadow-sm">
            <AlertTriangle size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">ระบบบริหารจัดการ DRP</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Drug-Related Problems Tracking System</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isAdminOrPharmacist && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider retro-button-primary cursor-pointer"
            >
              <Plus size={16} /> บันทึก DRP ใหม่
            </button>
          )}
          {userRole === "Admin" && (
            <Link
              href="/staff/drp-management/config"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider retro-button bg-background hover:bg-secondary cursor-pointer"
            >
              <Settings size={16} /> ตั้งค่าข้อมูลดรอปดาวน์
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border-2 border-border p-4 retro-box-sm flex flex-col justify-between">
          <span className="text-xs font-black uppercase text-muted-foreground tracking-wider">DRP ทั้งหมด</span>
          <span className="text-3xl font-black text-foreground mt-2">{loading ? "..." : metrics.total} รายการ</span>
        </div>
        <div className="bg-card border-2 border-border border-l-amber-500 border-l-4 p-4 retro-box-sm flex flex-col justify-between">
          <span className="text-xs font-black uppercase text-amber-500 tracking-wider">🟠 กำลังติดตาม (Open)</span>
          <span className="text-3xl font-black text-foreground mt-2">{loading ? "..." : metrics.open} เคส</span>
        </div>
        <div className="bg-card border-2 border-border border-l-emerald-500 border-l-4 p-4 retro-box-sm flex flex-col justify-between">
          <span className="text-xs font-black uppercase text-emerald-500 tracking-wider">🟢 แก้ไขสำเร็จ (Resolved)</span>
          <span className="text-3xl font-black text-foreground mt-2">{loading ? "..." : metrics.resolved} เคส</span>
        </div>
        <div className="bg-card border-2 border-border border-l-rose-500 border-l-4 p-4 retro-box-sm flex flex-col justify-between">
          <span className="text-xs font-black uppercase text-rose-500 tracking-wider">🔴 จัดการไม่สำเร็จ (Failed)</span>
          <span className="text-3xl font-black text-foreground mt-2">{loading ? "..." : metrics.failed} เคส</span>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-card p-6 border-2 border-border retro-box-static space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="ค้นหาด้วยเลข HN, ชื่อผู้ป่วย หรือรายละเอียดการบันทึก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Fiscal year select */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">ปีงบประมาณ:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="px-3 py-2 text-sm border-2 border-border outline-none bg-background rounded font-bold"
            >
              {[2570, 2569, 2568, 2567, 2566].map(y => (
                <option key={y} value={y}>พ.ศ. {y} (ปีงบประมาณ)</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-border/60 my-2" />

        {/* Tab Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 bg-secondary/30 p-1 rounded border border-border/40">
            {[
              { id: 'open', label: '🟠 ต้องติดตาม (Active)' },
              { id: 'resolved', label: '🟢 แก้ไขสำเร็จ' },
              { id: 'failed', label: '🔴 จัดการไม่สำเร็จ' },
              { id: 'closed', label: '🔒 ปิดเคสแล้ว (Resolved/Failed)' },
              { id: 'all', label: '📋 DRP ทั้งหมด' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                  statusFilter === tab.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 bg-secondary/30 p-1 rounded border border-border/40">
            {[
              { id: 'all', label: 'หมวดหมู่ทั้งหมด' },
              { id: '1', label: '1. Indication' },
              { id: '2', label: '2. Effectiveness' },
              { id: '3', label: '3. Safety' },
              { id: '4', label: '4. Compliance' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                  categoryFilter === tab.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DRP Table / Cards */}
      <div className="bg-card border-2 border-border retro-box-static overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse border border-border rounded" />
            ))}
          </div>
        ) : filteredDrps.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="mx-auto text-muted-foreground" size={48} />
            <h3 className="text-lg font-black text-foreground">ไม่พบข้อมูล DRP</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              ไม่พบบันทึกปัญหาจากการใช้ยา (DRP) ตามตัวกรองปัจจุบันของคุณ หรือยังไม่มีการบันทึก DRP ในช่วงเวลาที่เลือก
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-secondary/40 border-b-2 border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4 w-32">HN / ผู้ป่วย</th>
                    <th className="p-4 w-28">วันที่ตรวจ</th>
                    <th className="p-4 w-1/3">ปัญหา DRP (หมวดหมู่ & สาเหตุ)</th>
                    <th className="p-4 w-1/3">การแก้ไข & ผลลัพธ์</th>
                    <th className="p-4 w-28">สถานะ</th>
                    <th className="p-4 w-32">ผู้บันทึก</th>
                    <th className="p-4 w-40 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDrps.map((drp) => {
                    const statusColors = 
                      drp.status === 'resolved' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                        : drp.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30';
                        
                    return (
                      <tr key={drp.id} className="hover:bg-secondary/10 transition-colors text-sm align-top">
                        <td className="p-4">
                          <Link href={`/staff/patient/${drp.hn}`} className="font-black text-primary hover:underline flex items-center gap-1">
                            {drp.hn} <ExternalLink size={12} />
                          </Link>
                          <div className="text-xs font-bold text-muted-foreground mt-0.5">
                            {drp.patient_prefix}{drp.patient_name}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          {formatThaiDate(drp.visit_date)}
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-foreground">{drp.category}</div>
                          <div className="text-xs font-bold text-muted-foreground">{drp.type}</div>
                          <div className="text-xs text-foreground bg-secondary/20 p-2 border border-border/40 rounded mt-1">
                            <strong>สาเหตุ:</strong> {drp.cause || "-"}
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="text-xs font-bold text-foreground">
                            <strong>Intervention:</strong> {drp.intervention}
                          </div>
                          <div className="text-xs font-bold text-foreground">
                            <strong>Outcome:</strong> {drp.outcome}
                          </div>
                          {drp.note && drp.note !== "-" && (
                            <div className="text-xs text-muted-foreground italic bg-secondary/10 p-1.5 rounded mt-1 border border-border/20">
                              Note: {drp.note}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-black rounded border ${statusColors} uppercase tracking-wider block text-center whitespace-nowrap`}>
                            {drp.status === 'open' ? '🟠 Open' : drp.status === 'resolved' ? '🟢 Resolved' : '🔴 Failed'}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold text-muted-foreground">
                          <div>สร้าง: {drp.created_by || "System"}</div>
                          {drp.updated_by && drp.updated_by !== drp.created_by && (
                            <div className="mt-0.5">แก้: {drp.updated_by}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {isAdminOrPharmacist && (
                              <button
                                onClick={() => openEditModal(drp)}
                                title="แก้ไขข้อมูล DRP"
                                className="p-1.5 hover:bg-secondary rounded text-primary border border-transparent hover:border-border transition-colors cursor-pointer"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => openHistoryModal(drp)}
                              title="ดูประวัติการเปลี่ยนแปลง"
                              className="p-1.5 hover:bg-secondary rounded text-muted-foreground border border-transparent hover:border-border transition-colors cursor-pointer"
                            >
                              <History size={16} />
                            </button>
                            {drp.status !== 'open' && isAdminOrPharmacist && (
                              <button
                                onClick={() => handleReopen(drp)}
                                title="เปิดเคสขึ้นมาใหม่"
                                className="p-1.5 hover:bg-secondary rounded text-amber-600 border border-transparent hover:border-border transition-colors cursor-pointer"
                              >
                                <RefreshCcw size={16} />
                              </button>
                            )}
                            {userRole === "Admin" && (
                              <button
                                onClick={() => handleDelete(drp.id)}
                                title="ลบถาวร"
                                className="p-1.5 hover:bg-rose-50 rounded text-rose-600 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden divide-y divide-border/60">
              {filteredDrps.map((drp) => {
                const statusColors = 
                  drp.status === 'resolved' 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : drp.status === 'failed'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30';

                return (
                  <div key={drp.id} className="p-4 space-y-3 hover:bg-secondary/5 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/staff/patient/${drp.hn}`} className="font-black text-primary hover:underline flex items-center gap-1 text-base">
                          {drp.hn} <ExternalLink size={12} />
                        </Link>
                        <div className="text-xs font-bold text-muted-foreground mt-0.5">
                          {drp.patient_prefix}{drp.patient_name}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${statusColors} uppercase tracking-wider block text-center whitespace-nowrap`}>
                          {drp.status === 'open' ? 'Open' : drp.status === 'resolved' ? 'Resolved' : 'Failed'}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">{formatThaiDate(drp.visit_date)}</span>
                      </div>
                    </div>

                    {/* DRP info */}
                    <div className="space-y-1 bg-secondary/10 p-3 border border-border/40 rounded text-xs">
                      <div className="font-black text-foreground">{drp.category}</div>
                      <div className="font-bold text-muted-foreground mb-1">{drp.type}</div>
                      <p className="text-foreground"><strong>สาเหตุ:</strong> {drp.cause || "-"}</p>
                    </div>

                    {/* Interventions & Outcomes */}
                    <div className="space-y-1 text-xs">
                      <div><strong>การจัดการ:</strong> {drp.intervention}</div>
                      <div><strong>ผลลัพธ์:</strong> {drp.outcome}</div>
                      {drp.note && drp.note !== "-" && (
                        <div className="text-muted-foreground italic mt-1 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded border border-border/20">Note: {drp.note}</div>
                      )}
                    </div>

                    {/* Audit log operator */}
                    <div className="text-[10px] font-bold text-muted-foreground flex justify-between border-t border-border/20 pt-2">
                      <span>ผู้บันทึก: {drp.created_by || "System"}</span>
                      {drp.updated_by && <span>ผู้แก้ไขล่าสุด: {drp.updated_by}</span>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-1.5 border-t border-border/20 pt-2.5">
                      <button
                        onClick={() => openHistoryModal(drp)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border rounded text-xs font-bold text-muted-foreground cursor-pointer"
                      >
                        <History size={12} /> ประวัติ
                      </button>
                      
                      {isAdminOrPharmacist && (
                        <button
                          onClick={() => openEditModal(drp)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border rounded text-xs font-bold text-primary cursor-pointer"
                        >
                          <Edit2 size={12} /> แก้ไข
                        </button>
                      )}

                      {drp.status !== 'open' && isAdminOrPharmacist && (
                        <button
                          onClick={() => handleReopen(drp)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-xs font-bold text-amber-700 cursor-pointer"
                        >
                          <RefreshCcw size={12} /> ติดตามใหม่
                        </button>
                      )}

                      {userRole === "Admin" && (
                        <button
                          onClick={() => handleDelete(drp.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-xs font-bold text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={12} /> ลบ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* --- 1. CREATE STANDALONE DRP MODAL --- */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="บันทึกข้อมูล Drug-Related Problem (DRP) เพิ่มเติม">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Patient */}
            <div className="relative">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">ค้นหาทะเบียนประวัติผู้ป่วย (HN)*</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="พิมพ์เลข HN หรือชื่อผู้ป่วย..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (createForm.hn) {
                      setCreateForm(prev => ({ ...prev, hn: "" }));
                      setSelectedPatientName("");
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                />
              </div>
              
              {/* Dynamic Dropdown for patient choices */}
              {patientSearch && !createForm.hn && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border-2 border-border rounded shadow-lg">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground italic text-center">ไม่พบรายชื่อผู้ป่วย</div>
                  ) : (
                    filteredPatients.map(p => (
                      <button
                        key={p.hn}
                        type="button"
                        onClick={() => {
                          setCreateForm(prev => ({ ...prev, hn: p.hn }));
                          setSelectedPatientName(`${p.prefix || ""}${p.first_name} ${p.last_name}`);
                          setPatientSearch(p.hn);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-secondary/50 text-xs font-bold border-b border-border/40 last:border-b-0 flex justify-between items-center"
                      >
                        <span>{p.prefix || ""}{p.first_name} {p.last_name}</span>
                        <span className="text-muted-foreground">HN: {p.hn}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              
              {createForm.hn && (
                <div className="mt-1.5 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 rounded">
                  <span>ผู้ป่วยที่เลือก: HN {createForm.hn} ({selectedPatientName})</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setCreateForm(prev => ({ ...prev, hn: "" }));
                      setSelectedPatientName("");
                      setPatientSearch("");
                    }} 
                    className="hover:text-rose-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">วันที่ต้องการบันทึก*</label>
              <input
                type="date"
                required
                value={createForm.visit_date}
                onChange={(e) => setCreateForm(prev => ({ ...prev, visit_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              />
            </div>
          </div>

          <div className="border-t border-border/40 my-2" />

          {/* DRP Dropdowns: Category -> Type -> Cause */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">หมวดหมู่ DRP (Category)*</label>
              <select
                required
                value={createForm.category}
                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value, type: "", cause: "", customCause: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {configSource.categories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">ชนิด DRP (Type)*</label>
              <select
                required
                disabled={!createForm.category}
                value={createForm.type}
                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value, cause: "", customCause: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
              >
                <option value="">-- เลือกชนิด DRP --</option>
                {selectedCreateCategory?.types.map((t: any) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">สาเหตุ DRP (Cause)*</label>
              <select
                required
                disabled={!createForm.type}
                value={createForm.cause}
                onChange={(e) => setCreateForm(prev => ({ ...prev, cause: e.target.value, customCause: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
              >
                <option value="">-- เลือกสาเหตุ DRP --</option>
                {selectedCreateType?.causes.map((c: any) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Custom Cause input */}
            {createForm.cause === "อื่นๆ (ระบุ)..." && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">โปรดระบุสาเหตุเพิ่มเติม*</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุสาเหตุ DRP..."
                  value={createForm.customCause}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, customCause: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                />
              </div>
            )}
          </div>

          <div className="border-t border-border/40 my-2" />

          {/* Intervention & Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">การแก้ไข (Intervention)*</label>
              <select
                required
                value={createForm.intervention}
                onChange={(e) => setCreateForm(prev => ({ ...prev, intervention: e.target.value, customIntervention: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              >
                <option value="">-- เลือกการจัดการ --</option>
                {configSource.interventions.map((i: any) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              {createForm.intervention === "อื่นๆ (ระบุ)..." && (
                <input
                  type="text"
                  required
                  placeholder="ระบุการจัดการอื่นๆ..."
                  value={createForm.customIntervention}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, customIntervention: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded animate-fadeIn"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">ผลลัพธ์การจัดการ (Outcome)*</label>
              <select
                required
                value={createForm.outcome}
                onChange={(e) => setCreateForm(prev => ({ ...prev, outcome: e.target.value, customOutcome: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              >
                <option value="">-- เลือกผลลัพธ์ --</option>
                {configSource.outcomes.map((o: any) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {createForm.outcome === "อื่นๆ (ระบุ)..." && (
                <input
                  type="text"
                  required
                  placeholder="ระบุผลลัพธ์อื่นๆ..."
                  value={createForm.customOutcome}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, customOutcome: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded animate-fadeIn"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">รายละเอียดเพิ่มเติม (Note)</label>
            <textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              rows={3}
              value={createForm.note}
              onChange={(e) => setCreateForm(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 border-t border-border/40 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background hover:bg-secondary rounded cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider retro-button-primary cursor-pointer"
            >
              บันทึก DRP
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 2. EDIT DRP MODAL --- */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="แก้ไขและจัดการผลการดูแลปัญหา DRP">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {selectedDrp && (
            <div className="bg-secondary/20 p-3 border border-border/60 rounded text-xs font-bold space-y-1">
              <div>HN: {selectedDrp.hn} | ชื่อผู้ป่วย: {selectedDrp.patient_prefix}{selectedDrp.patient_name}</div>
              <div>วันที่บันทึกเดิม: {formatThaiDate(selectedDrp.created_date || "")}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visit Date */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">วันที่รับบริการ (Visit Date)</label>
              <input
                type="date"
                required
                value={editForm.visit_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, visit_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded font-bold"
              />
            </div>

            {/* Direct Status override */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">สถานะเคส (Case Status)</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded font-bold"
              >
                <option value="open">🟠 กำลังติดตาม (Open)</option>
                <option value="resolved">🟢 แก้ไขสำเร็จ (Resolved)</option>
                <option value="failed">🔴 จัดการไม่สำเร็จ (Failed)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border/40 my-2" />

          {/* DRP Dropdowns: Category -> Type -> Cause */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">หมวดหมู่ DRP (Category)*</label>
              <select
                required
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value, type: "", cause: "", customCause: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {configSource.categories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">ชนิด DRP (Type)*</label>
              <select
                required
                disabled={!editForm.category}
                value={editForm.type}
                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value, cause: "", customCause: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
              >
                <option value="">-- เลือกชนิด DRP --</option>
                {selectedEditCategory?.types.map((t: any) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">สาเหตุ DRP (Cause)*</label>
              <select
                required
                disabled={!editForm.type}
                value={editForm.cause}
                onChange={(e) => setEditForm(prev => ({ ...prev, cause: e.target.value, customCause: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded disabled:opacity-50"
              >
                <option value="">-- เลือกสาเหตุ DRP --</option>
                {selectedEditType?.causes.map((c: any) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Custom Cause input */}
            {editForm.cause === "อื่นๆ (ระบุ)..." && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">โปรดระบุสาเหตุเพิ่มเติม*</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุสาเหตุ DRP..."
                  value={editForm.customCause}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customCause: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                />
              </div>
            )}
          </div>

          <div className="border-t border-border/40 my-2" />

          {/* Intervention & Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">การแก้ไข (Intervention)*</label>
              <select
                required
                value={editForm.intervention}
                onChange={(e) => setEditForm(prev => ({ ...prev, intervention: e.target.value, customIntervention: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              >
                <option value="">-- เลือกการจัดการ --</option>
                {configSource.interventions.map((i: any) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              {editForm.intervention === "อื่นๆ (ระบุ)..." && (
                <input
                  type="text"
                  required
                  placeholder="ระบุการจัดการอื่นๆ..."
                  value={editForm.customIntervention}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customIntervention: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">ผลลัพธ์การจัดการ (Outcome)*</label>
              <select
                required
                value={editForm.outcome}
                onChange={(e) => setEditForm(prev => ({ ...prev, outcome: e.target.value, customOutcome: "" }))}
                className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
              >
                <option value="">-- เลือกผลลัพธ์ --</option>
                {configSource.outcomes.map((o: any) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {editForm.outcome === "อื่นๆ (ระบุ)..." && (
                <input
                  type="text"
                  required
                  placeholder="ระบุผลลัพธ์อื่นๆ..."
                  value={editForm.customOutcome}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customOutcome: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">รายละเอียดเพิ่มเติม (Note)</label>
            <textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              rows={3}
              value={editForm.note}
              onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-2 text-sm border-2 border-border focus:border-primary outline-none bg-background rounded resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 border-t border-border/40 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background hover:bg-secondary rounded cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider retro-button-primary cursor-pointer"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </Modal>

      {/* --- 3. DRP CHANGE HISTORY TIMELINE MODAL --- */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="ประวัติการจัดการและบันทึกการเปลี่ยนแปลง DRP">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {selectedDrp && (
            <div className="bg-secondary/20 p-4 border-2 border-border rounded text-xs font-bold space-y-2">
              <div className="text-sm text-foreground">HN: {selectedDrp.hn} | ผู้ป่วย: {selectedDrp.patient_prefix}{selectedDrp.patient_name}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground font-bold mt-1">
                <div>วันที่เกิดปัญหา: {formatThaiDate(selectedDrp.visit_date)}</div>
                <div>หมวดหมู่: {selectedDrp.category}</div>
              </div>
              <div className="text-xs text-foreground bg-white dark:bg-zinc-800 p-2 border border-border/30 rounded mt-1">
                <strong>สาเหตุปัญหา:</strong> {selectedDrp.cause}
              </div>
            </div>
          )}

          <div className="border-t border-border/40 my-3" />

          {loadingHistory ? (
            <div className="p-8 text-center space-y-2">
              <Clock className="mx-auto animate-spin text-primary" size={32} />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">กำลังดึงข้อมูลประวัติการแก้ไข...</p>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="p-8 text-center bg-secondary/10 border border-border rounded text-xs text-muted-foreground italic">
              ไม่มีข้อมูลประวัติการแก้ไขเก็บไว้ (ข้อมูลถูกสร้างก่อนระบบอัปเดตเวอร์ชัน)
            </div>
          ) : (
            <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6 py-2">
              {historyLogs.map((log) => {
                const actionBadge = 
                  log.action_type === 'CREATE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : log.action_type === 'CLOSE'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : log.action_type === 'REOPEN'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300';

                return (
                  <div key={log.id} className="relative">
                    {/* Circle icon marker on timeline */}
                    <div className="absolute -left-[31px] top-1 bg-background border-2 border-border rounded-full h-4 w-4 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 bg-foreground rounded-full" />
                    </div>

                    <div className="bg-card border border-border/80 rounded p-4 shadow-sm space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${actionBadge} uppercase tracking-wider`}>
                            {log.action_type}
                          </span>
                          <span className="text-xs font-black text-foreground flex items-center gap-1">
                            <User size={12} /> {log.changed_by}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                          {formatThaiDateTime(log.changed_at)}
                        </span>
                      </div>

                      {/* Displaying details of what changed */}
                      {log.action_type === 'CREATE' && log.changes?.snapshot && (
                        <div className="text-xs space-y-1.5 text-muted-foreground font-bold">
                          <div className="text-foreground font-bold">บันทึกปัญหาเริ่มต้น:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-2 border-l border-border/60">
                            <div>• Intervention: {log.changes.snapshot.intervention}</div>
                            <div>• Outcome: {log.changes.snapshot.outcome}</div>
                            {log.changes.snapshot.note && <div>• รายละเอียด: {log.changes.snapshot.note}</div>}
                          </div>
                        </div>
                      )}

                      {log.action_type === 'UPDATE' && log.changes?.fields && (
                        <div className="text-xs space-y-1.5 font-bold">
                          <div className="text-muted-foreground font-bold">ฟิลด์ที่มีการแก้ไข:</div>
                          <div className="space-y-1 pl-2 border-l border-border/60">
                            {log.changes.fields.map((f: any, idx: number) => {
                              let fieldNameTH = f.field;
                              if (f.field === 'category') fieldNameTH = 'หมวดหมู่ DRP';
                              if (f.field === 'type') fieldNameTH = 'ชนิด DRP';
                              if (f.field === 'cause') fieldNameTH = 'สาเหตุ DRP';
                              if (f.field === 'intervention') fieldNameTH = 'Intervention';
                              if (f.field === 'outcome') fieldNameTH = 'Outcome';
                              if (f.field === 'note') fieldNameTH = 'รายละเอียด';
                              if (f.field === 'status') fieldNameTH = 'สถานะเคส';
                              if (f.field === 'visit_date') fieldNameTH = 'วันที่เข้าตรวจ';

                              return (
                                <div key={idx} className="text-muted-foreground">
                                  • <span className="text-foreground">{fieldNameTH}</span>:{" "}
                                  <span className="line-through text-rose-500/80 font-normal">{f.old || "(ว่าง)"}</span>{" "}
                                  <ChevronRight size={12} className="inline-block" />{" "}
                                  <span className="text-emerald-600 font-black">{f.new || "(ว่าง)"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {log.action_type === 'CLOSE' && (
                        <div className="text-xs text-muted-foreground font-bold">
                          • ทำการปิดเคส DRP โดยเปลี่ยนสถานะจาก <span className="line-through text-rose-500">open</span> เป็น{" "}
                          <span className="text-emerald-600 font-black">
                            {selectedDrp?.status === 'resolved' ? 'resolved (สำเร็จ)' : 'failed (ไม่สำเร็จ)'}
                          </span>
                        </div>
                      )}

                      {log.action_type === 'REOPEN' && (
                        <div className="text-xs text-muted-foreground font-bold">
                          • เปิดติดตามเคส DRP อีกครั้ง โดยเปลี่ยนสถานะจาก <span className="line-through text-rose-500">closed</span> เป็น{" "}
                          <span className="text-amber-600 font-black">open (กำลังติดตาม)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end border-t border-border/40 pt-4 mt-6">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-border bg-background hover:bg-secondary rounded cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
