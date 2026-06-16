import { DRP } from './types';

const RESOLVED_KEYWORD = 'Resolved';

/**
 * Check if a DRP outcome is considered resolved
 */
export function isResolved(outcome: string): boolean {
    if (!outcome) return false;
    return outcome.includes(RESOLVED_KEYWORD) || outcome.includes('สำเร็จ');
}

/**
 * Filter DRPs that are still unresolved (outcome ≠ Resolved)
 */
export function getUnresolvedDrps(drps: DRP[]): DRP[] {
    return drps.filter(d => !isResolved(d.outcome));
}

/**
 * Filter DRPs that have been resolved
 */
export function getResolvedDrps(drps: DRP[]): DRP[] {
    return drps.filter(d => isResolved(d.outcome));
}

/**
 * Check if a DRP status is closed (either resolved or failed)
 */
export function isClosed(drp: DRP): boolean {
    return drp.status === 'resolved' || drp.status === 'failed';
}

/**
 * Filter DRPs that are open
 */
export function getOpenDrps(drps: DRP[]): DRP[] {
    return drps.filter(d => d.status === 'open');
}

/**
 * Filter DRPs that are closed
 */
export function getClosedDrps(drps: DRP[]): DRP[] {
    return drps.filter(d => isClosed(d));
}

/**
 * Filter DRPs by Thai/Buddhist Fiscal Year (Oct - Sep)
 * Note: fiscalYear input is in Buddhist Era (e.g. 2569) or Christian Era (e.g. 2026).
 * Standardizes to Christian Era for Date comparisons.
 */
export function filterDrpsByFiscalYear(drps: DRP[], fiscalYearBE: number): DRP[] {
    // If year is BE (e.g. 2569), convert to AD (e.g. 2026)
    const fiscalYearAD = fiscalYearBE > 2400 ? fiscalYearBE - 543 : fiscalYearBE;
    
    // Fiscal Year starts Oct 1st of (fiscalYearAD - 1) and ends Sep 30th of fiscalYearAD
    const startDate = new Date(Date.UTC(fiscalYearAD - 1, 9, 1, 0, 0, 0)); // Oct 1 UTC
    const endDate = new Date(Date.UTC(fiscalYearAD, 8, 30, 23, 59, 59));   // Sep 30 UTC
    
    return drps.filter(d => {
        const dateStr = d.visit_date || d.created_date || d.created_at;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date >= startDate && date <= endDate;
    });
}

/**
 * Get current fiscal year in Buddhist Era (BE)
 */
export function getCurrentFiscalYear(): number {
    const now = new Date();
    // If month >= October (9), fiscal year = current AD year + 544
    // Otherwise, fiscal year = current AD year + 543
    return now.getMonth() >= 9 
        ? now.getFullYear() + 544 
        : now.getFullYear() + 543;
}

