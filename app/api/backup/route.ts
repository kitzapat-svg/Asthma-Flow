// app/api/backup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncTableToSheet } from '@/lib/sheets';

const AUTH_SECRET = process.env.BACKUP_CRON_SECRET;

export async function GET(request: Request) {
  // 1. Auth Check (for Cron job)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-auth');
  const authHeader = request.headers.get('authorization');

  // Check Vercel Cron Secret (Standard)
  const vercelCronSecret = process.env.CRON_SECRET;
  const isVercelCronAuthorized = vercelCronSecret && authHeader === `Bearer ${vercelCronSecret}`;
  
  // Check Custom Secret (Legacy/Manual)
  const isCustomAuthorized = AUTH_SECRET && secret === AUTH_SECRET;

  // Require authentication if any secret is configured
  if (vercelCronSecret || AUTH_SECRET) {
    if (!isVercelCronAuthorized && !isCustomAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('Starting DB Backup and Cleanup...');

    // 1.5. Clean up Audit Logs (> 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const isoDate = ninetyDaysAgo.toISOString();

    console.log(`Cleaning up logs older than: ${isoDate}`);
    
    await supabaseAdmin
      .from('logs')
      .delete()
      .lt('created_at', isoDate);

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
        headers: ['id', 'action_type', 'module', 'actor_id', 'target_hn', 'payload', 'created_at', 'formatted_time_th'],
        query: supabaseAdmin.from('logs').select('id, action_type, module, actor_id, target_hn, payload, created_at, formatted_time_th').order('created_at', { ascending: false }).limit(2000)
      }
    ];

    // Helper function to fetch all rows (handle pagination)
    async function fetchAllRows(query: any) {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await query.range(from, from + step - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += step;
          if (data.length < step) hasMore = false;
        } else {
          hasMore = false;
        }
      }
      return allData;
    }

    const results = [];

    for (const task of backupTasks) {
      console.log(`Backing up ${task.tab}...`);
      try {
        const data = await fetchAllRows(task.query);
        
        const rows = data.map((item: any) => task.headers.map(h => {
            const val = item[h];
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val ?? '';
        }));

        const syncResult = await syncTableToSheet(task.tab, task.headers, rows);
        results.push({ tab: task.tab, rows: rows.length, ...syncResult });
      } catch (error: any) {
        console.error(`Error fetching/syncing ${task.tab}:`, error);
        results.push({ tab: task.tab, success: false, error: error.message });
      }
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
