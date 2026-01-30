export interface Task {
  id: string;
  title: string;
  emoji: string;
  isBonus: boolean;
  /** 'daily' resets each day; 'weekly' needs completing once per week */
  frequency: 'daily' | 'weekly';
  createdAt: string;
}

export interface DayProgress {
  /** ISO date string YYYY-MM-DD */
  date: string;
  completedTaskIds: string[];
  skippedTaskIds: string[];
}

export interface WeekData {
  /** ISO date of the Monday that starts this week */
  weekStart: string;
  days: DayProgress[];
  /** Task IDs completed for the week (weekly tasks) */
  weeklyCompletedTaskIds: string[];
}

export interface WeekHistory {
  weekStart: string;
  /** 0-100 percentage */
  completionPct: number;
  totalTasks: number;
  completedTasks: number;
  bonusStarsEarned: number;
}

export interface AppState {
  tasks: Task[];
  currentWeek: WeekData;
  parentPin: string;
  /** Past weeks history */
  weekHistory: WeekHistory[];
  /** Total bonus stars ever earned */
  bonusStars: number;
}

export type ViewMode = 'caleb' | 'parent';
