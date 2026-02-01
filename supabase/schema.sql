-- Caleb's Quest: Supabase schema
-- Run this in the SQL Editor at:
-- https://supabase.com/dashboard/project/gftjvrjaqdauqqossrje/sql

-- ══════════════════════════════════════════════════════════════
-- 1. TABLES
-- ══════════════════════════════════════════════════════════════

-- Households (one per family, identified by PIN)
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Default Household',
  pin TEXT NOT NULL DEFAULT '1234',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks master list
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL DEFAULT 'default' REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📝',
  is_bonus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly schedule: which tasks on which days
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id TEXT NOT NULL DEFAULT 'default' REFERENCES households(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL, -- 'mon','tue',...,'sun'
  task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(household_id, day_of_week)
);

-- Daily progress tracking
CREATE TABLE IF NOT EXISTS day_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id TEXT NOT NULL DEFAULT 'default' REFERENCES households(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  completed_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  skipped_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(household_id, date)
);

-- Week history archive
CREATE TABLE IF NOT EXISTS week_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id TEXT NOT NULL DEFAULT 'default' REFERENCES households(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL, -- 'YYYY-MM-DD' (Monday)
  completion_pct INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  bonus_stars_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(household_id, week_start)
);

-- App-level state (bonus stars, templates, current week info)
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  household_id TEXT NOT NULL DEFAULT 'default' REFERENCES households(id) ON DELETE CASCADE,
  bonus_stars INTEGER NOT NULL DEFAULT 0,
  templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_week_start TEXT, -- 'YYYY-MM-DD' (Monday)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id)
);

-- ══════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Public access policies (PIN auth is handled in-app, not via Supabase auth)
CREATE POLICY "Public read households" ON households FOR SELECT USING (true);
CREATE POLICY "Public write households" ON households FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update households" ON households FOR UPDATE USING (true);
CREATE POLICY "Public delete households" ON households FOR DELETE USING (true);

CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public write tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Public delete tasks" ON tasks FOR DELETE USING (true);

CREATE POLICY "Public read weekly_schedules" ON weekly_schedules FOR SELECT USING (true);
CREATE POLICY "Public write weekly_schedules" ON weekly_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update weekly_schedules" ON weekly_schedules FOR UPDATE USING (true);
CREATE POLICY "Public delete weekly_schedules" ON weekly_schedules FOR DELETE USING (true);

CREATE POLICY "Public read day_progress" ON day_progress FOR SELECT USING (true);
CREATE POLICY "Public write day_progress" ON day_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update day_progress" ON day_progress FOR UPDATE USING (true);
CREATE POLICY "Public delete day_progress" ON day_progress FOR DELETE USING (true);

CREATE POLICY "Public read week_history" ON week_history FOR SELECT USING (true);
CREATE POLICY "Public write week_history" ON week_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update week_history" ON week_history FOR UPDATE USING (true);
CREATE POLICY "Public delete week_history" ON week_history FOR DELETE USING (true);

CREATE POLICY "Public read app_state" ON app_state FOR SELECT USING (true);
CREATE POLICY "Public write app_state" ON app_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update app_state" ON app_state FOR UPDATE USING (true);
CREATE POLICY "Public delete app_state" ON app_state FOR DELETE USING (true);

-- ══════════════════════════════════════════════════════════════
-- 3. ENABLE REALTIME
-- ══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE households;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE day_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE week_history;
ALTER PUBLICATION supabase_realtime ADD TABLE app_state;

-- ══════════════════════════════════════════════════════════════
-- 4. SEED DEFAULT HOUSEHOLD
-- ══════════════════════════════════════════════════════════════

INSERT INTO households (id, name, pin) VALUES ('default', 'Default Household', '1234')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_state (id, household_id, bonus_stars, templates) VALUES ('default', 'default', 0, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
