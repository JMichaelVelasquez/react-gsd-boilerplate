export interface Task {
  id: string;
  title: string;
  emoji: string;
  isBonus: boolean;
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
}

export interface AppState {
  tasks: Task[];
  currentWeek: WeekData;
  parentPin: string;
}

export type ViewMode = 'caleb' | 'parent';
