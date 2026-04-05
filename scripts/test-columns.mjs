import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    const testData = {
        hn: '0000000',
        date: '2023-01-01',
        step1: '1',
        step2: '1',
        score: 8,
        note: 'test'
    };
    
    console.log('Testing insert with step1 (no underscore)...');
    const { data, error } = await supabase.from('technique_checks').insert(testData);
    if (error) {
        console.log('Insert with step1 failed:', error.message);
        
        const testData2 = {
            hn: '0000000',
            date: '2023-01-01',
            step_1: '1',
            step_2: '1',
            score: 8,
            note: 'test'
        };
        console.log('Testing insert with step_1 (underscore)...');
        const { data: d2, error: e2 } = await supabase.from('technique_checks').insert(testData2);
        if (e2) {
            console.log('Insert with step_1 failed:', e2.message);
        } else {
            console.log('Insert with step_1 SUCCEEDED!');
        }
    } else {
        console.log('Insert with step1 SUCCEEDED!');
    }
}

testInsert();
