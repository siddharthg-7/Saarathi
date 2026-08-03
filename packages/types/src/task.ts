export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';
export type ContextType = 'Home' | 'College' | 'Office' | 'Travel';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  estimatedDuration: number; // in minutes
  energyRequired: EnergyLevel;
  category: string;
  difficulty: number; // 1 to 5
  urgency: UrgencyLevel;
  status: TaskStatus;
  aiSummary: string;
  skipProbability: number; // 0 to 100%
  delayProbability: number; // 0 to 100%
  postponeCount: number;
  deadline?: string;
  scheduledTime?: string;
  tags: string[];
  context: ContextType;
  subtasks: Subtask[];
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  streakCount: number;
  completionPercentage: number;
  bestDay: string;
  activeDays: boolean[];
  targetDaysPerWeek: number;
  color: string;
}

export interface Milestone {
  id: string;
  title: string;
  targetWeeks: string;
  progress: number;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'in_progress' | 'completed';
  targetDate: string;
  milestones: Milestone[];
  dailyTasksCount: number;
}
