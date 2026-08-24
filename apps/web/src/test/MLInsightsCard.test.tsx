import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MLInsightsCard } from '../components/common/MLInsightsCard';
import { useMLStore } from '@saarathi/store';

describe('MLInsightsCard Component (Phase 9 Machine Learning Foundation)', () => {
  beforeEach(() => {
    useMLStore.setState({
      taskRiskMap: {},
      energyClusters: [
        {
          clusterId: 1,
          name: 'Peak Deep Work',
          hours: [9, 10, 11, 12],
          averageProductivityScore: 88,
          averageFocusMinutes: 45,
          recommendedEnergyType: 'High',
        },
      ],
      optimalSlots: [
        {
          dayOfWeek: 1,
          dayName: 'Monday',
          startHour: 9,
          endHour: 12,
          label: 'Morning Peak Deep Focus',
          energyFit: 'high',
          averageProductivityScore: 88,
        },
      ],
      burnoutReport: {
        userId: 'user_1',
        burnoutRiskScore: 24,
        anomalyDetected: false,
        riskLevel: 'low',
        contributingIndicators: ['Balanced focus workload within baseline range'],
        workloadTrend: 'stable',
        recommendations: ['Maintain regular 5-minute Pomodoro breaks'],
        isColdStart: false,
      },
      forecast: {
        userId: 'user_1',
        forecastDays: [
          {
            date: '2026-08-25',
            dayOfWeek: 2,
            dayName: 'Tuesday',
            predictedTasksCompleted: 6,
            predictedFocusMinutes: 160,
            confidenceLower: 0.8,
            confidenceUpper: 0.92,
          },
        ],
        expectedWeeklyCompleted: 32,
        expectedWeeklyFocusMinutes: 920,
        trendDirection: 'upward',
        isColdStart: false,
      },
      taskClusters: [
        {
          clusterId: 1,
          topicName: 'Backend Architecture',
          keywords: ['fastapi', 'database'],
          taskIds: ['task_1', 'task_2'],
          taskCount: 2,
        },
      ],
      loading: false,
      isColdStart: false,
      lastUpdated: '2026-08-24T12:00:00Z',
    });
  });

  it('should render the ML Predictive Intelligence header and scikit-learn models banner', () => {
    render(<MLInsightsCard userId="user_1" />);

    expect(screen.getByText('Phase 9 — Machine Learning Foundation')).toBeInTheDocument();
    expect(screen.getByText('Predictive Intelligence & Behavioral Optimization')).toBeInTheDocument();
    expect(screen.getByText('Active ML Models (Scikit-Learn)')).toBeInTheDocument();
  });

  it('should display K-Means energy clusters and optimal time slots', () => {
    render(<MLInsightsCard userId="user_1" />);

    expect(screen.getByText('K-Means Focus Clusters')).toBeInTheDocument();
    expect(screen.getByText('Peak Energy Windows')).toBeInTheDocument();
    expect(screen.getByText('Peak Deep Work')).toBeInTheDocument();
    expect(screen.getByText('Monday 9:00 - 12:00')).toBeInTheDocument();
  });

  it('should display Isolation Forest Burnout & Anomaly Guard metrics', () => {
    render(<MLInsightsCard userId="user_1" />);

    expect(screen.getByText('Isolation Forest Anomaly Guard')).toBeInTheDocument();
    expect(screen.getByText('Workload & Burnout Guard')).toBeInTheDocument();
    expect(screen.getByText('24 / 100')).toBeInTheDocument();
    expect(screen.getByText('LOW RISK')).toBeInTheDocument();
  });

  it('should display 7-Day Velocity Forecast projections', () => {
    render(<MLInsightsCard userId="user_1" />);

    expect(screen.getByText('7-Day Velocity Forecast')).toBeInTheDocument();
    expect(screen.getByText('Productivity Projection')).toBeInTheDocument();
    expect(screen.getByText('UPWARD')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
  });

  it('should render semantic topic clusters with keywords', () => {
    render(<MLInsightsCard userId="user_1" />);

    expect(screen.getByText('Semantic Topic Clusters (TF-IDF Cosine Similarity)')).toBeInTheDocument();
    expect(screen.getByText('Backend Architecture')).toBeInTheDocument();
    expect(screen.getByText('#fastapi')).toBeInTheDocument();
    expect(screen.getByText('#database')).toBeInTheDocument();
  });
});
