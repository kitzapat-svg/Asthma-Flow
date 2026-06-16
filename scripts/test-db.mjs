import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase.from('drp_categories').select('*').limit(1);
    if (error) {
        console.log('drp_categories table does not exist or error:', error.message);
    } else {
        console.log('drp_categories table exists, data:', data);
    }
}
check();
