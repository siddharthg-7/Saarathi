import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsView } from '../views/AnalyticsView';
import { initialAnalytics } from '@saarathi/store';

describe('AnalyticsView Component Render & Interactions', () => {
  it('should render the Productivity Analytics header and key overview metric cards', () => {
    render(<AnalyticsView analytics={initialAnalytics} />);

    expect(screen.getByText('Productivity & Behavioral Matrix')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Productivity Score')).toBeInTheDocument();
    expect(screen.getByText('Deep Work Hours')).toBeInTheDocument();
    expect(screen.getByText('Habit Streak & Rhythm')).toBeInTheDocument();
  });

  it('should allow toggling between Today, 7 Days, and 30 Days time ranges', () => {
    const onSelectRange = vi.fn();
    render(<AnalyticsView analytics={initialAnalytics} onSelectTimeRange={onSelectRange} />);

    const todayBtn = screen.getByText('Today');
    fireEvent.click(todayBtn);
    expect(onSelectRange).toHaveBeenCalledWith('today');

    const monthBtn = screen.getByText('30 Days');
    fireEvent.click(monthBtn);
    expect(onSelectRange).toHaveBeenCalledWith('30d');
  });

  it('should render the 7x24 Day x Hour heatmap section', () => {
    render(<AnalyticsView analytics={initialAnalytics} />);

    expect(screen.getByText('Day × Hour Productivity Heatmap')).toBeInTheDocument();
    expect(screen.getAllByText('Mon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sun').length).toBeGreaterThan(0);
  });

  it('should render energy correlation and Kairo interaction insights', () => {
    render(<AnalyticsView analytics={initialAnalytics} />);

    expect(screen.getByText('Energy vs Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Rescheduling & Delay Patterns')).toBeInTheDocument();
    expect(screen.getByText('Kairo AI Interaction Matrix')).toBeInTheDocument();
    expect(screen.getByText('Daily Check-in: Log Energy & Mood')).toBeInTheDocument();
  });

  it('should allow user to select energy/mood chips and trigger check-in save', async () => {
    const onLog = vi.fn().mockResolvedValue(undefined);
    render(<AnalyticsView analytics={initialAnalytics} onLogMoodEnergy={onLog} />);

    const highBtn = screen.getByText('high');
    fireEvent.click(highBtn);

    const saveBtn = screen.getByText('Save Check-in');
    fireEvent.click(saveBtn);

    expect(onLog).toHaveBeenCalledWith('high', undefined, 'daily_checkin');
  });
});
