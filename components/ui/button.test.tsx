import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
    it('renders correctly', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeDefined();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click Me Action</Button>);
        fireEvent.click(screen.getByText('Click Me Action'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant classes correctly', () => {
        render(<Button variant="destructive">Destructive</Button>);
        const button = screen.getByText('Destructive');
        // Check if classList contains relevant classes
        // Note: exact class match is brittle due to tailwind-merge, checking for key indicators
        expect(button.className).toContain('bg-destructive');
    });

    it('can be disabled', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByText('Disabled');
        expect(button.hasAttribute('disabled')).toBe(true);
    });
});
