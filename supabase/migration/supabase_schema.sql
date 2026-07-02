-- Supabase SQL Schema for Routine Tracker Mobile App
-- Paste this script into the SQL Editor in your Supabase Dashboard to create the tables.

-- 1. Create Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY,
  "exerciseId" TEXT NOT NULL,
  "exerciseName" TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  "mealType" TEXT NOT NULL,
  protein NUMERIC NOT NULL,
  calories INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY,
  "habitName" TEXT NOT NULL,
  completed BOOLEAN NOT NULL,
  value NUMERIC,
  date TEXT NOT NULL, -- YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  weight NUMERIC,
  waist NUMERIC,
  "pushUps" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create bypass policies for personal use
-- (This enables public CRUD operations since it is a private personal app without login screens)
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
