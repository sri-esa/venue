import '../../setupTests';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import DensityBadge from '../../components/common/DensityBadge';

describe('DensityBadge', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render LOW text with green classes', () => {
    render(<DensityBadge level="LOW" />);

    const badge = screen.getByLabelText('LOW density level');
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(badge.className).toContain('text-green-400');
  });

  it('should render CRITICAL text with red classes and animate pulse styling', () => {
    render(<DensityBadge level="CRITICAL" />);

    const badge = screen.getByLabelText('CRITICAL density level');
    expect(badge.className).toContain('text-red-400');
    expect(badge.className).toContain('animate-pulse');
  });

  it('should expose the correct aria label for assistive technology', () => {
    render(<DensityBadge level="HIGH" />);

    expect(screen.getByLabelText('HIGH density level')).toBeInTheDocument();
  });

  it('should never render without a visible text label', () => {
    render(<DensityBadge level="MEDIUM" />);

    expect(screen.getByText('MEDIUM')).toBeVisible();
  });
});
