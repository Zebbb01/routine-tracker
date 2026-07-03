export interface Profile {
  id: string; // UUID
  name: string;
  targetGoal: 'aesthetic' | 'muscle' | 'lean' | 'strength';
  weightGoal: number;
  proteinGoal: number;
  caloriesGoal: number;
}

export interface CustomHabit {
  id: string; // UUID
  profileId: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weeklyCount?: number; // e.g. 3 times per week
}

export interface WorkoutSplit {
  id: string; // UUID
  profileId: string;
  name: string;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  exercises: { id: string; name: string; target: string }[];
}

export interface WorkoutSet {
  id: string; // UUID
  profileId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number; // in kg (or lbs)
  reps: number;
  sets: number;
  date: string; // ISO String (e.g., 2026-07-02T14:00:00.000Z)
  notes?: string;
  syncStatus: 'synced' | 'pending_create' | 'pending_delete';
}

export interface Meal {
  id: string; // UUID
  profileId: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  protein: number; // grams
  calories: number; // kcal
  date: string; // ISO String
  notes?: string;
  syncStatus: 'synced' | 'pending_create' | 'pending_delete';
}

export interface HabitLog {
  id: string; // UUID
  profileId: string;
  habitId: string; // ID of the CustomHabit
  completed: boolean;
  value?: number; // actual value if applicable
  date: string; // YYYY-MM-DD
  syncStatus: 'synced' | 'pending_create' | 'pending_delete';
}

export interface Metric {
  id: string; // UUID
  profileId: string;
  date: string; // ISO String
  weight?: number; // daily weight (kg)
  waist?: number; // weekly waist measurement (inches)
  pushUps?: number; // weekly push-ups max count
  syncStatus: 'synced' | 'pending_create' | 'pending_delete';
}

export interface SyncQueueItem {
  id: string; // UUID of the sync item itself
  table: 'workouts' | 'meals' | 'habits' | 'metrics' | 'profiles' | 'custom_habits' | 'workout_splits';
  action: 'create' | 'delete';
  recordId: string;
  data: any;
}
