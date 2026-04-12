import '../../setupTests';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import WaitTimeBadge from '../../components/common/WaitTimeBadge';

describe('WaitTimeBadge', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the wait time in minutes for open queues', () => {
    render(<WaitTimeBadge minutes={8} isOpen />);

    expect(screen.getByText('8 min')).toBeInTheDocument();
  });

  it('should expose a descriptive aria label for the current wait time', () => {
    render(<WaitTimeBadge minutes={12} isOpen />);

    expect(screen.getByLabelText('12 minute wait time')).toBeInTheDocument();
  });

  it('should render closed status text when the queue is closed', () => {
    render(<WaitTimeBadge minutes={0} isOpen={false} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByLabelText('Queue closed')).toBeInTheDocument();
  });
});
