-- Migration: Create Tables
-- Date: 2026-07-03

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
  exercises JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Workouts table
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

-- 5. Create Meals table
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

-- 6. Create Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  "habitId" UUID REFERENCES custom_habits(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL,
  value NUMERIC,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY,
  "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  weight NUMERIC,
  waist NUMERIC,
  "pushUps" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
