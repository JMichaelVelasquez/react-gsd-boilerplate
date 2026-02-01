-- Step 1: Parent Auth + Child Onboarding
-- Profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '👦',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link parents to children (many-to-many for future step-family support)
CREATE TABLE IF NOT EXISTS parent_children (
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, child_id)
);

-- Add child_id to existing tables (nullable for backward compat)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS child_id TEXT REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE weekly_schedules ADD COLUMN IF NOT EXISTS child_id TEXT REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE day_progress ADD COLUMN IF NOT EXISTS child_id TEXT REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE week_history ADD COLUMN IF NOT EXISTS child_id TEXT REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS child_id TEXT REFERENCES children(id) ON DELETE CASCADE;

-- RLS for new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Children: parents can access their linked children
CREATE POLICY "Parents read own children" ON children FOR SELECT USING (
  id IN (SELECT child_id FROM parent_children WHERE parent_id = auth.uid())
);
CREATE POLICY "Parents insert children" ON children FOR INSERT WITH CHECK (true);
CREATE POLICY "Parents update own children" ON children FOR UPDATE USING (
  id IN (SELECT child_id FROM parent_children WHERE parent_id = auth.uid())
);

-- Parent-children links
CREATE POLICY "Parents read own links" ON parent_children FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents insert own links" ON parent_children FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Enable realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE children;
ALTER PUBLICATION supabase_realtime ADD TABLE parent_children;

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
