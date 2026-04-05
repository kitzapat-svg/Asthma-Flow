import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const { data, error } = await supabase.from('technique_checks').select('*').limit(1);
    if (error) {
        console.error('Error fetching:', error);
    } else {
        console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'No data');
        
        // Try to get schema info via RPC or just a detailed error
        const { data: cols, error: err2 } = await supabase.rpc('get_table_columns', { table_name: 'technique_checks' });
        if (err2) {
            console.log('RPC failed (expected if not defined)');
        } else {
            console.log('Columns from RPC:', cols);
        }
    }
}

checkSchema();
