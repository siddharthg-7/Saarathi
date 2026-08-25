import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleRecommendationCard } from '../components/xai/ScheduleRecommendationCard';
import { ScheduleRecommendation } from '@saarathi/types';

describe('ScheduleRecommendationCard Component', () => {
  const mockRecommendation: ScheduleRecommendation = {
    recommendationId: 'rec_test_101',
    taskId: 'task_study_202',
    currentSchedule: {
      date: '2026-08-25',
      time: '21:00',
      startHour: 21,
      endHour: 22,
      predictedCompletion: 34.0,
    },
    recommendedSchedule: {
      date: '2026-08-26',
      time: '09:00',
      startHour: 9,
      endHour: 10,
      predictedCompletion: 78.0,
    },
    predictedImprovement: 44.0,
    reason: 'Moving this task to tomorrow morning aligns with your measured Peak Deep Focus window.',
    explanationQuality: 'moderate_evidence',
    contributors: [],
    evidence: [],
    modelMetadata: {
      modelName: 'schedule_optimizer_kmeans_rf',
      modelVersion: '1.0.0',
      featureVersion: '1.0.0',
      explanationMethod: 'CircadianLocalAttribution',
    },
    generatedAt: '2026-08-25T10:00:00Z',
  };

  it('renders before and after schedule comparison and improvement estimate', () => {
    render(
      <ScheduleRecommendationCard
        recommendation={mockRecommendation}
        onApplySchedule={vi.fn()}
      />
    );

    expect(screen.getByText('+44% Predicted Success')).toBeDefined();
    expect(screen.getByText('2026-08-25 at 21:00')).toBeDefined();
    expect(screen.getByText('34%')).toBeDefined();
    expect(screen.getByText('2026-08-26 at 09:00')).toBeDefined();
    expect(screen.getByText('78%')).toBeDefined();
  });

  it('triggers onApplySchedule with recommended date and time when Move Task is clicked', () => {
    const applyFn = vi.fn();
    render(
      <ScheduleRecommendationCard
        recommendation={mockRecommendation}
        onApplySchedule={applyFn}
      />
    );

    const moveBtn = screen.getByText('Move Task');
    fireEvent.click(moveBtn);
    expect(applyFn).toHaveBeenCalledWith('2026-08-26', '09:00');
  });

  it('triggers onDismiss when Keep Current Time is clicked', () => {
    const dismissFn = vi.fn();
    render(
      <ScheduleRecommendationCard
        recommendation={mockRecommendation}
        onApplySchedule={vi.fn()}
        onDismiss={dismissFn}
      />
    );

    const keepBtn = screen.getByText('Keep Current Time');
    fireEvent.click(keepBtn);
    expect(dismissFn).toHaveBeenCalledTimes(1);
  });
});
