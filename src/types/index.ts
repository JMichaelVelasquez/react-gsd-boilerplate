export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export interface Task {
  id: string;
  title: string;
  emoji: string;
  isBonus: boolean;
  createdAt: string;
}

/** Which task IDs are assigned to each day of the week */
export type WeeklySchedule = Record<DayOfWeek, string[]>;

/** Saved template for quick week setup */
export interface WeeklyTemplate {
  id: string;
  name: string;
  schedule: Record<DayOfWeek, Array<{ title: string; emoji: string }>>;
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
  weeklySchedule: WeeklySchedule;
  currentWeek: WeekData;
  parentPin: string;
  /** Past weeks history */
  weekHistory: WeekHistory[];
  /** Total bonus stars ever earned */
  bonusStars: number;
  /** Saved weekly templates */
  templates: WeeklyTemplate[];
}

export type ViewMode = 'caleb' | 'parent';

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  pin: string;
  createdAt: string;
}

export interface Child {
  id: string;
  name: string;
  avatarEmoji: string;
  createdAt: string;
}
