// app/api/backup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncTableToSheet } from '@/lib/sheets';

const AUTH_SECRET = process.env.BACKUP_CRON_SECRET;

export async function GET(request: Request) {
  // 1. Auth Check (for Cron job)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-auth');

  if (AUTH_SECRET && secret !== AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting DB Backup to Google Sheets...');

    const backupTasks = [
      {
        tab: 'patients',
        headers: ['hn', 'prefix', 'first_name', 'last_name', 'dob', 'best_pefr', 'height', 'status', 'public_token', 'phone'],
        query: supabaseAdmin.from('patients').select('hn, prefix, first_name, last_name, dob, best_pefr, height, status, public_token, phone').order('hn')
      },
      {
        tab: 'visits',
        headers: ['hn', 'visit_date', 'pefr', 'control_level', 'controller', 'reliever', 'adherence', 'drp', 'advice', 'technique_check', 'next_appt', 'note', 'is_new_case', 'inhaler_score'],
        query: supabaseAdmin.from('visits').select('hn, visit_date, pefr, control_level, controller, reliever, adherence, drp, advice, technique_check, next_appt, note, is_new_case, inhaler_score').order('visit_date', { ascending: false })
      },
      {
        tab: 'drps',
        headers: ['id', 'hn', 'created_date', 'visit_date', 'category', 'type', 'cause', 'intervention', 'outcome', 'note'],
        query: supabaseAdmin.from('drps').select('id, hn, created_date, visit_date, category, type, cause, intervention, outcome, note').order('created_date', { ascending: false })
      },
      {
        tab: 'medications',
        headers: ['hn', 'date', 'c1_name', 'c1_puffs', 'c1_freq', 'c2_name', 'c2_puffs', 'c2_freq', 'reliever_name', 'reliever_label', 'note'],
        query: supabaseAdmin.from('medications').select('hn, date, c1_name, c1_puffs, c1_freq, c2_name, c2_puffs, c2_freq, reliever_name, reliever_label, note').order('date', { ascending: false })
      },
      {
        tab: 'technique_checks',
        headers: ['hn', 'date', 'step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'score', 'note'],
        query: supabaseAdmin.from('technique_checks').select('hn, date, step1, step2, step3, step4, step5, step6, step7, step8, score, note').order('date', { ascending: false })
      },
      {
        tab: 'staff_advice',
        headers: ['hn', 'staff_username', 'staff_name', 'staff_position', 'advice', 'date'],
        query: supabaseAdmin.from('staff_advice').select('hn, staff_username, staff_name, staff_position, advice, date').order('date', { ascending: false })
      },
      {
        tab: 'users',
        headers: ['username', 'password_hash', 'role', 'name', 'email', 'position'],
        query: supabaseAdmin.from('users').select('username, password_hash, role, name, email, position')
      },
      {
        tab: 'medication_list',
        headers: ['type', 'name'],
        query: supabaseAdmin.from('medication_list').select('type, name')
      },
      {
        tab: 'logs',
        headers: ['timestamp', 'email', 'action', 'details'],
        query: supabaseAdmin.from('logs').select('timestamp, email, action, details').order('timestamp', { ascending: false }).limit(2000)
      }
    ];

    const results = [];

    for (const task of backupTasks) {
      console.log(`Backing up ${task.tab}...`);
      const { data, error } = await task.query;
      
      if (error) {
        console.error(`Error fetching ${task.tab}:`, error);
        results.push({ tab: task.tab, success: false, error });
        continue;
      }

      const rows = data.map((item: any) => task.headers.map(h => {
          const val = item[h];
          // Format dates to string for sheets
          if (val instanceof Date) return val.toISOString();
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return val ?? '';
      }));

      const syncResult = await syncTableToSheet(task.tab, task.headers, rows);
      results.push({ tab: task.tab, ...syncResult });
    }

    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({ 
      message: `Backup completed. ${successCount}/${backupTasks.length} successful.`,
      details: results 
    });

  } catch (err: any) {
    console.error('Backup API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
