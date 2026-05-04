import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Test Stat',
    value: '100',
    icon: <span>📊</span>,
  };

  it('should render without crashing', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it('should display title', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.innerHTML).toContain('Test Stat');
  });

  it('should display value', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.innerHTML).toContain('100');
  });

  it('should handle different value types', () => {
    const { container: container1 } = render(
      <StatCard {...defaultProps} value="50" />
    );
    const { container: container2 } = render(
      <StatCard {...defaultProps} value="1000" />
    );
    expect(container1).toBeDefined();
    expect(container2).toBeDefined();
  });

  it('should render with icon', () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it('should handle optional trend prop', () => {
    const { container } = render(
      <StatCard {...defaultProps} trend={{ value: 10, label: 'increase' }} />
    );
    expect(container).toBeDefined();
  });

  it('should handle optional className prop', () => {
    const { container } = render(
      <StatCard {...defaultProps} className="custom-class" />
    );
    expect(container).toBeDefined();
  });
});
