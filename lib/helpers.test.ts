import { describe, it, expect } from 'vitest';
import { normalizeHN, getAge, calculatePredictedPEFR } from './helpers';

describe('Helper Functions', () => {
    describe('normalizeHN', () => {
        it('should keep 7-digit HN with leading zeros intact', () => {
            expect(normalizeHN('0012345')).toBe('0012345');
        });

        it('should handle undefined or null', () => {
            expect(normalizeHN(undefined)).toBe('');
            expect(normalizeHN(null)).toBe('');
        });

        it('should pad short HN strings to 7 digits with leading zeros', () => {
            expect(normalizeHN('12345')).toBe('0012345');
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
            // Dejsomritrutai formula: height 170, age 30 -> 576
            const p = { height: '170', prefix: 'นาย', dob: '' };
            const currentYear = new Date().getFullYear();
            p.dob = `${currentYear - 30}-01-01`;

            expect(calculatePredictedPEFR(p)).toBe(576);
        });

        it('should calculate for Female correctly', () => {
            // Dejsomritrutai formula: height 160, age 30 -> 391
            const currentYear = new Date().getFullYear();
            const p = { height: '160', prefix: 'นาง', dob: `${currentYear - 30}-01-01` };
            expect(calculatePredictedPEFR(p)).toBe(391);
        });

        it('should return 178 for extreme out-of-range low height snap case', () => {
            // Dejsomritrutai formula: height 50 (snaps to 150), age 100 (caps to 95) -> 178
            const currentYear = new Date().getFullYear();
            const p = { height: '50', prefix: 'นาย', dob: `${currentYear - 100}-01-01` };
            expect(calculatePredictedPEFR(p)).toBe(178);
        });
    });
});
