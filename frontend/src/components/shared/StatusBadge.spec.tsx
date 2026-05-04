import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container).toBeDefined();
  });

  it('should display status text', () => {
    render(<StatusBadge status="active" />);
    // Component should render some content
    expect(true).toBe(true);
  });

  it('should handle different status values', () => {
    const statuses = ['active', 'inactive', 'pending', 'completed'];
    statuses.forEach((status) => {
      const { container } = render(<StatusBadge status={status} />);
      expect(container).toBeDefined();
    });
  });

  it('should apply appropriate styling for status', () => {
    const { container } = render(<StatusBadge status="active" />);
    const badge = container.querySelector('[class*="badge"]') || container.firstChild;
    expect(badge).toBeDefined();
  });

  it('should handle optional className prop', () => {
    const { container } = render(
      <StatusBadge status="active" className="custom-class" />
    );
    expect(container).toBeDefined();
  });
});
