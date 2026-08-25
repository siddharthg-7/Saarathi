import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExplainabilityCard } from '../components/xai/ExplainabilityCard';
import { XAIExplanation } from '@saarathi/types';

describe('ExplainabilityCard Component', () => {
  const mockExplanation: XAIExplanation = {
    explanationId: 'exp_test_001',
    taskId: 'task_gym_101',
    summary: 'High skip risk driven by Monday evening timing.',
    predictionType: 'task_risk',
    probability: 82.0,
    quality: 'moderate_evidence',
    qualityReason: 'Historical pattern validated across 5 sessions.',
    contributors: [
      {
        feature: 'postpone_count',
        displayName: 'Reschedule Frequency',
        value: 2,
        rawContribution: 0.28,
        normalizedContribution: 0.85,
        direction: 'positive',
        strength: 'strong_positive',
        importanceRank: 1,
        description: 'Postponed 2 times.',
      },
      {
        feature: 'time_of_day',
        displayName: 'Scheduled Time Window',
        value: '21:00',
        rawContribution: 0.26,
        normalizedContribution: 0.78,
        direction: 'positive',
        strength: 'strong_positive',
        importanceRank: 2,
        description: 'Late evening placement increases delay risk.',
      },
    ],
    evidence: [
      {
        fact: 'Monday Fitness Sessions',
        metric: '1 of 5 completed (20%)',
        value: 20,
        sampleSize: 5,
        isStatisticallySignificant: true,
      },
    ],
    modelMetadata: {
      modelName: 'task_risk_rf',
      modelVersion: '1.0.0',
      featureVersion: '1.0.0',
      explanationMethod: 'TreeLocalAttribution',
    },
    isColdStart: false,
    isFallback: false,
  };

  it('renders Kairo Reasoning header and probability correctly', () => {
    render(<ExplainabilityCard explanation={mockExplanation} />);

    expect(screen.getByText("Kairo's Reasoning")).toBeDefined();
    expect(screen.getByText('82%')).toBeDefined();
    expect(screen.getByText('Verified History (5-14 Sessions)')).toBeDefined();
  });

  it('renders contributing factors with their strength badges', () => {
    render(<ExplainabilityCard explanation={mockExplanation} />);

    expect(screen.getByText('Reschedule Frequency')).toBeDefined();
    expect(screen.getByText('Scheduled Time Window')).toBeDefined();
    expect(screen.getAllByText('Strong Risk Signal').length).toBe(2);
  });

  it('renders verified behavioral evidence section', () => {
    render(<ExplainabilityCard explanation={mockExplanation} />);

    expect(screen.getByText('Monday Fitness Sessions')).toBeDefined();
    expect(screen.getByText('1 of 5 completed (20%)')).toBeDefined();
    expect(screen.getByText('Sample Size: 5')).toBeDefined();
  });

  it('handles Review Optimal Timing action trigger', () => {
    const handleRecommend = vi.fn();
    render(
      <ExplainabilityCard
        explanation={mockExplanation}
        onOpenScheduleRecommendation={handleRecommend}
      />
    );

    const btn = screen.getByText('Review Optimal Timing');
    fireEvent.click(btn);
    expect(handleRecommend).toHaveBeenCalledTimes(1);
  });
});
