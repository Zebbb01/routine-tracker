-- Row Level Security (RLS) & Security Policies
-- Date: 2026-07-03

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist to ensure idempotency
DROP POLICY IF EXISTS "Allow public read/write on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read/write on custom_habits" ON custom_habits;
DROP POLICY IF EXISTS "Allow public read/write on workout_splits" ON workout_splits;
DROP POLICY IF EXISTS "Allow public read/write on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow public read/write on meals" ON meals;
DROP POLICY IF EXISTS "Allow public read/write on habits" ON habits;
DROP POLICY IF EXISTS "Allow public read/write on metrics" ON metrics;

-- Create Public Access Policies (Personal Offline-First Sync Bypass)
CREATE POLICY "Allow public read/write on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on custom_habits" ON custom_habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on workout_splits" ON workout_splits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on meals" ON meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on metrics" ON metrics FOR ALL USING (true) WITH CHECK (true);
