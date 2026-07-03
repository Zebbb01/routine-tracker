-- Migration: Patch Existing Tables for Multi-User Profiles & Custom Schedules
-- Date: 2026-07-03

-- 1. Alter existing tables to add profileId and relation columns if they don't exist
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Update habits to reference the new profiles and custom_habits tables
ALTER TABLE habits ADD COLUMN IF NOT EXISTS "profileId" UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS "habitId" UUID REFERENCES custom_habits(id) ON DELETE CASCADE;

-- 3. Make old habitName column nullable to prevent constraint violations
ALTER TABLE habits ALTER COLUMN "habitName" DROP NOT NULL;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
