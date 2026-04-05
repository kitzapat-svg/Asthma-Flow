import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyData() {
    const { data, error } = await supabase.from('technique_checks').select('*').limit(5);
    if (error) {
        console.error('Error fetching:', error);
    } else if (data.length === 0) {
        console.log('Table is empty!');
    } else {
        console.log(`Found ${data.length} rows.`);
        data.forEach((row, i) => {
            const steps = [row.step1, row.step2, row.step3, row.step4, row.step5, row.step6, row.step7, row.step8];
            console.log(`Row ${i + 1} (HN: ${row.hn}, Date: ${row.date}): Steps -> ${steps.join(',')}, Score -> ${row.score}`);
        });
    }
}

verifyData();
