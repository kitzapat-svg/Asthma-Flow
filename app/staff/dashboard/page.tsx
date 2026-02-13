"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Users, Activity, FileText, Search, X, Filter } from 'lucide-react';
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';

import { Patient } from '@/lib/types';


export default function PatientListPage() {
  const router = useRouter();
  const { status } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchPatients();
    }
  }, [status, router]);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/db?type=patients');
      const data = await res.json();
      const sortedData = Array.isArray(data)
        ? data.sort((a: Patient, b: Patient) => b.hn.localeCompare(a.hn))

        : [];
      setPatients(sortedData);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const query = searchTerm.toLowerCase().trim();
    const matchSearch =
      patient.hn.toLowerCase().includes(query) ||
      patient.first_name.toLowerCase().includes(query) ||
      patient.last_name.toLowerCase().includes(query);
    const matchStatus = filterStatus === 'All' || patient.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <Activity className="animate-spin text-[#D97736] mb-4" size={48} />
        <p className="text-[#6B6560] dark:text-zinc-400 font-bold animate-pulse">กำลังโหลดรายชื่อ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <h2 className="text-3xl font-black text-[#2D2A26] dark:text-white hidden md:block">รายชื่อผู้ป่วย</h2>

        {/* ปุ่มลงทะเบียน */}
        <Link href="/staff/register">
          <Button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-lg" variant="default">
            <UserPlus size={24} /> ลงทะเบียนผู้ป่วยใหม่
          </Button>
        </Link>
      </div>

      {/* Search Bar & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ HN..."
            className="w-full pl-10 pr-4 py-2 border-2 border-border dark:border-zinc-700 rounded-lg focus:outline-none focus:border-primary dark:bg-zinc-800 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2 border-2 border-border dark:border-zinc-700 rounded-lg focus:outline-none focus:border-primary appearance-none bg-white dark:bg-zinc-800 cursor-pointer transition-colors"
          >
            <option value="All">สถานะ: ทั้งหมด</option>
            <option value="Active">Active</option>
            <option value="COPD">COPD</option>
            <option value="Discharge">Discharge</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D97736]" size={16} />
        </div>
      </div>

      {/* Patients List Grid */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-6 transition-colors">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <Users size={24} className="text-[#D97736]" />
          <h2 className="text-xl font-black">ผลการค้นหา ({filteredPatients.length} คน)</h2>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <Link key={patient.hn} href={`/staff/patient/${patient.hn}`}>
                <div className="group relative bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-700 p-4 hover:border-[#D97736] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm text-[#6B6560] dark:text-zinc-400 font-bold">HN: {patient.hn}</span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 border font-bold ${patient.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                      patient.status === 'COPD' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                      {patient.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black group-hover:text-[#D97736] transition-colors truncate">
                    {patient.prefix}{patient.first_name} {patient.last_name}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1">
                      <Activity size={14} /> View History
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 border-2 border-[#3D3834] dark:border-zinc-600 flex items-center justify-center group-hover:bg-[#D97736] group-hover:border-[#D97736] group-hover:text-white transition-all">
                      <FileText size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-800/50 border-2 border-dashed border-gray-200 dark:border-zinc-700">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">ไม่พบข้อมูลผู้ป่วยที่ค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
}
