import React from 'react';
import { User, Activity, AlertTriangle, Calendar } from 'lucide-react';
import { Patient } from '@/lib/types';
import { getAge } from '@/app/staff/patient/[hn]/_components/utils';

export function PatientContextBar({
  patient,
  latestControlLevel
}: {
  patient: Patient | null,
  latestControlLevel?: string
}) {
  if (!patient) return null;

  const age = getAge(patient.dob);

  // Example of how we might display an allergy, even if hardcoded for now 
  // until the DB schema explicitly supports it.
  const hasAllergy = false; // Replace with actual logic when available

  return (
    <div className="sticky top-0 z-50 mb-6 bg-white dark:bg-zinc-900 border-b-4 border-primary shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
          <User className="text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-foreground dark:text-white flex items-center gap-2">
            {patient.prefix}{patient.first_name} {patient.last_name}
            {hasAllergy && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                <AlertTriangle size={12} /> แพ้ยา
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium mt-1">
            <span className="flex items-center gap-1"><span className="font-bold">HN:</span> {patient.hn}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> อายุ {age} ปี</span>
            <span className="flex items-center gap-1">สถานะ: {patient.status}</span>
          </div>
        </div>
      </div>

      {latestControlLevel && (
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 px-4 py-2 rounded-lg border border-border dark:border-zinc-700">
          <div className="text-xs text-muted-foreground font-bold">ล่าสุด:</div>
          <div className="font-bold text-sm flex items-center gap-1.5">
            {latestControlLevel === 'Well-controlled' && <span className="text-green-600">🟢 Well-controlled</span>}
            {latestControlLevel === 'Partly Controlled' && <span className="text-yellow-600">🟡 Partly Controlled</span>}
            {latestControlLevel === 'Uncontrolled' && <span className="text-red-600">🔴 Uncontrolled</span>}
            {!['Well-controlled', 'Partly Controlled', 'Uncontrolled'].includes(latestControlLevel) &&
              <span>{latestControlLevel}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
