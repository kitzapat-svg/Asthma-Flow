import { describe, it, expect } from 'vitest';
import { normalizeHN, getAge, calculatePredictedPEFR } from './helpers';

describe('Helper Functions', () => {
    describe('normalizeHN', () => {
        it('should remove leading zeros', () => {
            expect(normalizeHN('0012345')).toBe('12345');
        });

        it('should handle undefined or null', () => {
            expect(normalizeHN(undefined)).toBe('');
            expect(normalizeHN(null)).toBe('');
        });

        it('should handle strings without leading zeros', () => {
            expect(normalizeHN('12345')).toBe('12345');
        });
    });

    describe('getAge', () => {
        it('should calculate age correctly', () => {
            // Assuming today is 2026 (mocking Date would be better but simple logic test is fine)
            const currentYear = new Date().getFullYear();
            const dob = `${currentYear - 20}-01-01`;
            expect(getAge(dob)).toBe(20);
        });

        it('should return 0 for invalid date', () => {
            expect(getAge('')).toBe(0);
        });
    });

    describe('calculatePredictedPEFR', () => {
        it('should calculate for Male correctly', () => {
            // Formula: (5.48 * H) - (1.51 * A) - 279.7
            // 607
            const p = { height: '170', prefix: 'นาย', dob: '' };
            // Mock getAge to return 30, or simpler: just test logic if we trust getAge.
            // But getAge depends on dob.
            // Let's rely on getAge working, so we need a DOB that gives 30.
            const currentYear = new Date().getFullYear();
            p.dob = `${currentYear - 30}-01-01`;

            expect(calculatePredictedPEFR(p)).toBe(607);
        });

        it('should calculate for Female correctly', () => {
            // Formula: (3.72 * H) - (2.24 * A) - 96.6
            // 431
            const currentYear = new Date().getFullYear();
            const p = { height: '160', prefix: 'นาง', dob: `${currentYear - 30}-01-01` };
            expect(calculatePredictedPEFR(p)).toBe(431);
        });

        it('should return 0 if result is negative', () => {
            const currentYear = new Date().getFullYear();
            const p = { height: '50', prefix: 'นาย', dob: `${currentYear - 100}-01-01` };
            expect(calculatePredictedPEFR(p)).toBe(0); // Extreme case
        });
    });
});
