// actions/updateVisit.ts
'use server'

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

/**
 * Example Server Action: Updating a patient visit with full audit logging.
 */
export async function updateVisit(hn: string, visitDate: string, updatedData: any) {
    const session = await getServerSession(authOptions);
    
    // 1. Mandatory check for authorized actor
    if (!session?.user?.email) {
        throw new Error('Unauthorized: No staff session found');
    }

    const actorId = session.user.email;

    try {
        // 2. Fetch OLD data before modification (essential for audit trails)
        const { data: oldData, error: fetchError } = await supabase
            .from('visits')
            .select('*')
            .match({ hn, visit_date: visitDate })
            .single();

        if (fetchError || !oldData) {
            console.error('Visit not found for auditing:', fetchError);
            return { success: false, message: 'Visit not found' };
        }

        // 3. Perform the UPDATE
        const { error: updateError } = await supabase
            .from('visits')
            .update(updatedData)
            .match({ hn, visit_date: visitDate });

        if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`);
        }

        // 4. LOG the activity with OLD vs NEW data comparison
        // This runs asynchronously; we don't necessarily need to await it 
        // if we want fast response times, but awaiting ensures log consistency.
        await logAudit({
            action_type: 'UPDATE',
            module: 'VISIT',
            actor_id: actorId,
            target_hn: hn,
            payload: {
                old_data: oldData,
                new_data: updatedData,
                context: {
                    visit_date: visitDate,
                    reason: 'Staff manual edit'
                }
            }
        });

        // 5. Revalidate the cache to reflect changes in UI
        revalidatePath(`/staff/patient/${hn}`);
        
        return { success: true };

    } catch (err: any) {
        console.error('[Action Error] updateVisit:', err);
        
        // Optionally log the failure as well
        await logAudit({
            action_type: 'UPDATE',
            module: 'VISIT',
            actor_id: actorId,
            target_hn: hn,
            payload: { 
                error: err.message,
                attempted_data: updatedData 
            }
        });

        return { success: false, message: err.message };
    }
}
