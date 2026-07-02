export interface WorkoutSet {
  id: string; // UUID
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
  habitName: 'walk_breakfast' | 'walk_lunch' | 'walk_dinner' | 'hourly_standup' | 'sleep_hours' | 'no_zero';
  completed: boolean;
  value?: number; // e.g. actual sleep hours, or walk minutes
  date: string; // YYYY-MM-DD for grouping by day
  syncStatus: 'synced' | 'pending_create' | 'pending_delete';
}

export interface Metric {
  id: string; // UUID
  date: string; // ISO String or YYYY-MM-DD
  weight?: number; // daily weight (kg)
  waist?: number; // weekly waist measurement (inches or cm)
  pushUps?: number; // weekly push-ups max count
  syncStatus: 'synced' | 'pending_create' | 'pending_delete';
}

export interface SyncQueueItem {
  id: string; // UUID of the sync item itself
  table: 'workouts' | 'meals' | 'habits' | 'metrics';
  action: 'create' | 'delete';
  recordId: string; // The ID of the record being synced
  data: any; // The record content
}
