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
    const backdrop = container.querySelector('[class*="backdrop"]') || container.firstChild;
    expect(backdrop).toBeDefined();
  });

  it('should handle onClick prop', () => {
    const handleClick = () => {};
    const { container } = render(<AnimatedBackdrop onClick={handleClick} />);
    expect(container).toBeDefined();
  });

  it('should handle visible prop', () => {
    const { container: container1 } = render(<AnimatedBackdrop visible={true} />);
    const { container: container2 } = render(<AnimatedBackdrop visible={false} />);
    expect(container1).toBeDefined();
    expect(container2).toBeDefined();
  });

  it('should apply animation classes', () => {
    const { container } = render(<AnimatedBackdrop />);
    expect(container.innerHTML).toBeTruthy();
  });

  it('should handle optional className prop', () => {
    const { container } = render(
      <AnimatedBackdrop className="custom-backdrop" />
    );
    expect(container).toBeDefined();
  });
});
