import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskBadge } from '@/components/common/RiskBadge';

describe('RiskBadge Component', () => {
  it('renders low risk badge correctly', () => {
    render(<RiskBadge skipProbability={15} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('15% Skip Risk');
  });

  it('renders high risk badge correctly', () => {
    render(<RiskBadge skipProbability={85} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('85% Skip Risk');
  });
});
