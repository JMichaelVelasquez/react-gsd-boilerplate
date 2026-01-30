/** Get today as YYYY-MM-DD in local time */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Get the Monday of the week containing `date` as YYYY-MM-DD */
export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Day names for the week view */
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Get an array of YYYY-MM-DD strings for Mon–Sun of the week starting at `monday` */
export function weekDates(monday: string): string[] {
  const base = new Date(monday + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/** Generate a simple unique id */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
