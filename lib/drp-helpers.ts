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
