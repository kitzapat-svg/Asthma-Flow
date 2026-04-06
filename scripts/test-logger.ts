import { logAudit } from '../lib/logger';
import { supabaseAdmin } from '../lib/supabase';

async function testLogger() {
    console.log("Testing logger directly...");
    try {
        await logAudit({
            action_type: 'SYSTEM',
            module: 'SYSTEM',
            actor_id: 'TestScript',
            payload: { message: "This is a test log" }
        } as any);
        
        console.log("Log sent. Now verifying if it exists in Supabase...");
        
        const { data, error } = await supabaseAdmin
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (error) {
            console.error("Failed to read from logs table:", error.message);
        } else {
            console.log("Latest log in DB:", data);
        }
    } catch (e) {
        console.error("Test script error:", e);
    }
}

testLogger();
