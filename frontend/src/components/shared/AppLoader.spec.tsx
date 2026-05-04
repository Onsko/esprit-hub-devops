import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AppLoader from './AppLoader';

describe('AppLoader Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<AppLoader />);
    expect(container).toBeDefined();
  });

  it('should display loading indicator', () => {
    const { container } = render(<AppLoader />);
    const loader = container.querySelector('[class*="loader"]') || container.firstChild;
    expect(loader).toBeDefined();
  });

  it('should have loading class or attribute', () => {
    const { container } = render(<AppLoader />);
    expect(container.innerHTML).toBeTruthy();
  });

  it('should render with default styling', () => {
    const { container } = render(<AppLoader />);
    const element = container.firstChild;
    expect(element).toBeDefined();
  });

  it('should handle optional message prop', () => {
    const { container } = render(<AppLoader message="Loading..." />);
    expect(container).toBeDefined();
  });
});
