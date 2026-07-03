-- Supabase SQL Schema for Routine Tracker Mobile App
-- Paste this script into the SQL Editor in your Supabase Dashboard to create the tables.

-- 1. Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  "targetGoal" TEXT NOT NULL,
  "weightGoal" NUMERIC NOT NULL,
  "proteinGoal" NUMERIC NOT NULL,
  "caloriesGoal" NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Custom Habits table
CREATE TABLE IF NOT EXISTS custom_habits (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  frequency TEXT NOT NULL,
  "customDays" INTEGER[] DEFAULT '{}',
  "weeklyCount" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Workout Splits table
CREATE TABLE IF NOT EXISTS workout_splits (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days INTEGER[] DEFAULT '{}',
  exercises JSONB NOT NULL, -- list of {id, name, target}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Workouts table (Updated with profileId)
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  "exerciseId" TEXT NOT NULL,
  "exerciseName" TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Meals table (Updated with profileId)
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "mealType" TEXT NOT NULL,
  protein NUMERIC NOT NULL,
  calories INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Habits table (Updated with profileId, habitId)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  "habitId" UUID REFERENCES custom_habits(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL,
  value NUMERIC,
  date TEXT NOT NULL, -- YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Metrics table (Updated with profileId)
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  weight NUMERIC,
  waist NUMERIC,
  "pushUps" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create bypass policies for personal use
-- (This enables public CRUD operations since it is a private personal app without login screens)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on profiles" ON profiles;
CREATE POLICY "Allow public read/write on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE custom_habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on custom_habits" ON custom_habits;
CREATE POLICY "Allow public read/write on custom_habits" ON custom_habits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workout_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on workout_splits" ON workout_splits;
CREATE POLICY "Allow public read/write on workout_splits" ON workout_splits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on workouts" ON workouts;
CREATE POLICY "Allow public read/write on workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on meals" ON meals;
CREATE POLICY "Allow public read/write on meals" ON meals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on habits" ON habits;
CREATE POLICY "Allow public read/write on habits" ON habits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on metrics" ON metrics;
CREATE POLICY "Allow public read/write on metrics" ON metrics FOR ALL USING (true) WITH CHECK (true);
