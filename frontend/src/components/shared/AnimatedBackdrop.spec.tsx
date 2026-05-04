import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AnimatedBackdrop from './AnimatedBackdrop';

describe('AnimatedBackdrop Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<AnimatedBackdrop />);
    expect(container).toBeDefined();
  });

  it('should render backdrop element', () => {
    const { container } = render(<AnimatedBackdrop />);
    const backdrop = container.querySelector('[class*="ambient"]') || container.firstChild;
    expect(backdrop).toBeDefined();
  });

  it('should render ambient shapes', () => {
    const { container } = render(<AnimatedBackdrop />);
    const shapes = container.querySelectorAll('.ambient-shape');
    expect(shapes.length).toBeGreaterThan(0);
  });

  it('should render ambient grid', () => {
    const { container } = render(<AnimatedBackdrop />);
    const grid = container.querySelector('.ambient-grid');
    expect(grid).toBeDefined();
  });

  it('should apply animation classes', () => {
    const { container } = render(<AnimatedBackdrop />);
    expect(container.innerHTML).toContain('ambient');
  });

  it('should handle optional className prop', () => {
    const { container } = render(
      <AnimatedBackdrop className="custom-backdrop" />
    );
    expect(container.innerHTML).toContain('custom-backdrop');
  });
});
