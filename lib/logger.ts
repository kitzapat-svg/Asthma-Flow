// lib/logger.ts
import { supabaseAdmin } from './supabase';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Bangkok';

export type AuditLogPayload = {
    old_data?: any;
    new_data?: any;
    [key: string]: any;
};

export type AuditLogEntry = {
    action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'AUTH' | 'BATCH';
    module: 'PATIENT' | 'VISIT' | 'USER' | 'MEDICATION' | 'SYSTEM';
    actor_id: string; // email or user ID
    target_hn?: string;
    payload?: AuditLogPayload;
};

/**
 * Production-grade Audit Logger with strict UTC+7 (Bangkok) enforcement.
 * Bypasses environment locals to ensure "YYYY-MM-DD HH:mm:ss.SSS [UTC+7]" format.
 */
export async function logAudit(entry: AuditLogEntry) {
    // 1. Force strict UTC+7 timestamp generation
    // .tz() with Asia/Bangkok explicitly converts the current time to that zone.
    const nowBangkok = dayjs().tz(TIMEZONE);
    const formattedTime = `${nowBangkok.format('YYYY-MM-DD HH:mm:ss.SSS')} [UTC+7]`;

    try {
        // 2. Insert into Supabase using Admin client (bypasses RLS for system integrity)
        const { error } = await supabaseAdmin.from('audit_logs').insert({
            action_type: entry.action_type,
            module: entry.module,
            actor_id: entry.actor_id,
            target_hn: entry.target_hn || null,
            payload: entry.payload || null,
            formatted_time_th: formattedTime,
            created_at: nowBangkok.toISOString(), // Standard timestamp for DB
        });

        if (error) {
            console.error(`[AUDIT ERROR] Failed to write log: ${error.message}`);
        }

        // 3. Logger terminal output for real-time debugging (Vercel Log Streams)
        console.log(
            `\x1b[36m[AUDIT]\x1b[0m ${formattedTime} | \x1b[33m${entry.action_type}\x1b[0m | \x1b[34m${entry.module}\x1b[0m | Actor: ${entry.actor_id} | HN: ${entry.target_hn || 'N/A'}`
        );
    } catch (err) {
        console.error('[AUDIT CRITICAL ERROR]', err);
    }
}
