import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { XAIReasoningModal } from '../components/xai/XAIReasoningModal';
import { useXAIStore } from '@saarathi/store';
import { XAIExplanation } from '@saarathi/types';

describe('XAIReasoningModal Component', () => {
  beforeEach(() => {
    useXAIStore.setState({ activeModalExplanation: null });
  });

  const mockExplanation: XAIExplanation = {
    explanationId: 'exp_modal_detail_1',
    taskId: 'task_deep_work_1',
    summary: 'Deep reasoning overview',
    predictionType: 'task_risk',
    probability: 65.0,
    quality: 'strong_evidence',
    qualityReason: 'Validated pattern across 20 sessions.',
    contributors: [
      {
        feature: 'task_duration',
        displayName: 'Estimated Duration',
        value: 120,
        rawContribution: 0.24,
        normalizedContribution: 0.75,
        direction: 'positive',
        strength: 'strong_positive',
        importanceRank: 1,
        description: 'Duration exceeds 90 minutes without subtasks.',
      },
    ],
    evidence: [
      {
        fact: 'Long Session History',
        metric: '3 of 8 completed without delay',
        value: 38,
        sampleSize: 8,
        isStatisticallySignificant: true,
      },
    ],
    modelMetadata: {
      modelName: 'task_risk_rf',
      modelVersion: '1.0.0',
      featureVersion: '1.0.0',
      explanationMethod: 'TreeLocalAttribution',
      generatedAt: '2026-08-25T12:00:00Z',
    },
    isColdStart: false,
    isFallback: false,
  };

  it('renders nothing when activeModalExplanation is null', () => {
    const { container } = render(<XAIReasoningModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders deep reasoning modal with feature attribution waterfall and evidence when active', () => {
    useXAIStore.setState({ activeModalExplanation: mockExplanation });
    render(<XAIReasoningModal />);

    expect(screen.getByText('Why am I seeing this prediction?')).toBeDefined();
    expect(screen.getByText('65%')).toBeDefined();
    expect(screen.getByText('Estimated Duration')).toBeDefined();
    expect(screen.getByText('Long Session History')).toBeDefined();
    expect(screen.getByText('Explanation ID: exp_modal_detail_1')).toBeDefined();
    expect(screen.getByText('Feature Set: v1.0.0')).toBeDefined();
  });

  it('closes modal when close button is clicked', () => {
    useXAIStore.setState({ activeModalExplanation: mockExplanation });
    render(<XAIReasoningModal />);

    const closeBtn = screen.getByLabelText('Close reasoning modal');
    fireEvent.click(closeBtn);
    expect(useXAIStore.getState().activeModalExplanation).toBeNull();
  });
});
