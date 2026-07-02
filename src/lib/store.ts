import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSet, Meal, HabitLog, Metric, SyncQueueItem } from './types';

// Safe UUID generator
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface AppState {
  workouts: WorkoutSet[];
  meals: Meal[];
  habits: HabitLog[];
  metrics: Metric[];
  syncQueue: SyncQueueItem[];
  goal: string;

  // Actions
  setGoal: (goal: string) => void;
  
  addWorkout: (workout: Omit<WorkoutSet, 'id' | 'syncStatus'>) => void;
  deleteWorkout: (id: string) => void;
  
  addMeal: (meal: Omit<Meal, 'id' | 'syncStatus'>) => void;
  deleteMeal: (id: string) => void;
  
  toggleHabit: (
    habitName: HabitLog['habitName'],
    date: string,
    completed: boolean,
    value?: number
  ) => void;
  
  addMetric: (metric: Omit<Metric, 'id' | 'syncStatus'>) => void;
  deleteMetric: (id: string) => void;

  // Sync actions
  clearSyncQueueItem: (id: string) => void;
  addToSyncQueue: (table: SyncQueueItem['table'], action: SyncQueueItem['action'], recordId: string, data: any) => void;
  mergeServerData: (data: {
    workouts?: WorkoutSet[];
    meals?: Meal[];
    habits?: HabitLog[];
    metrics?: Metric[];
  }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      workouts: [],
      meals: [],
      habits: [],
      metrics: [],
      syncQueue: [],
      goal: 'aesthetic',

      setGoal: (goal) => set({ goal }),

      addWorkout: (workoutData) => {
        const id = generateUUID();
        const newWorkout: WorkoutSet = {
          ...workoutData,
          id,
          syncStatus: 'pending_create',
        };

        set((state) => ({
          workouts: [newWorkout, ...state.workouts],
          syncQueue: [
            ...state.syncQueue,
            {
              id: generateUUID(),
              table: 'workouts',
              action: 'create',
              recordId: id,
              data: newWorkout,
            },
          ],
        }));
      },

      deleteWorkout: (id) => {
        const workout = get().workouts.find((w) => w.id === id);
        if (!workout) return;

        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
          // If it was already pending create, we can just remove it from sync queue and not push to server
          syncQueue: workout.syncStatus === 'pending_create'
            ? state.syncQueue.filter((q) => q.recordId !== id)
            : [
                ...state.syncQueue,
                {
                  id: generateUUID(),
                  table: 'workouts',
                  action: 'delete',
                  recordId: id,
                  data: workout,
                },
              ],
        }));
      },

      addMeal: (mealData) => {
        const id = generateUUID();
        const newMeal: Meal = {
          ...mealData,
          id,
          syncStatus: 'pending_create',
        };

        set((state) => ({
          meals: [newMeal, ...state.meals],
          syncQueue: [
            ...state.syncQueue,
            {
              id: generateUUID(),
              table: 'meals',
              action: 'create',
              recordId: id,
              data: newMeal,
            },
          ],
        }));
      },

      deleteMeal: (id) => {
        const meal = get().meals.find((m) => m.id === id);
        if (!meal) return;

        set((state) => ({
          meals: state.meals.filter((m) => m.id !== id),
          syncQueue: meal.syncStatus === 'pending_create'
            ? state.syncQueue.filter((q) => q.recordId !== id)
            : [
                ...state.syncQueue,
                {
                  id: generateUUID(),
                  table: 'meals',
                  action: 'delete',
                  recordId: id,
                  data: meal,
                },
              ],
        }));
      },

      toggleHabit: (habitName, date, completed, value) => {
        const habits = get().habits;
        const existingIndex = habits.findIndex(
          (h) => h.habitName === habitName && h.date === date
        );

        if (existingIndex > -1) {
          const existing = habits[existingIndex];
          const updatedHabit: HabitLog = {
            ...existing,
            completed,
            value,
            syncStatus: 'pending_create', // Mark as pending sync
          };

          const newHabits = [...habits];
          newHabits[existingIndex] = updatedHabit;

          set((state) => ({
            habits: newHabits,
            // Remove previous queue items for this specific record to avoid duplicates
            syncQueue: [
              ...state.syncQueue.filter((q) => q.recordId !== existing.id),
              {
                id: generateUUID(),
                table: 'habits',
                action: 'create',
                recordId: existing.id,
                data: updatedHabit,
              },
            ],
          }));
        } else {
          const id = generateUUID();
          const newHabit: HabitLog = {
            id,
            habitName,
            completed,
            value,
            date,
            syncStatus: 'pending_create',
          };

          set((state) => ({
            habits: [newHabit, ...state.habits],
            syncQueue: [
              ...state.syncQueue,
              {
                id: generateUUID(),
                table: 'habits',
                action: 'create',
                recordId: id,
                data: newHabit,
              },
            ],
          }));
        }
      },

      addMetric: (metricData) => {
        const id = generateUUID();
        const newMetric: Metric = {
          ...metricData,
          id,
          syncStatus: 'pending_create',
        };

        set((state) => ({
          metrics: [newMetric, ...state.metrics],
          syncQueue: [
            ...state.syncQueue,
            {
              id: generateUUID(),
              table: 'metrics',
              action: 'create',
              recordId: id,
              data: newMetric,
            },
          ],
        }));
      },

      deleteMetric: (id) => {
        const metric = get().metrics.find((m) => m.id === id);
        if (!metric) return;

        set((state) => ({
          metrics: state.metrics.filter((m) => m.id !== id),
          syncQueue: metric.syncStatus === 'pending_create'
            ? state.syncQueue.filter((q) => q.recordId !== id)
            : [
                ...state.syncQueue,
                {
                  id: generateUUID(),
                  table: 'metrics',
                  action: 'delete',
                  recordId: id,
                  data: metric,
                },
              ],
        }));
      },

      clearSyncQueueItem: (queueId) => {
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => item.id !== queueId),
        }));
      },

      addToSyncQueue: (table, action, recordId, data) => {
        set((state) => ({
          syncQueue: [
            ...state.syncQueue,
            {
              id: generateUUID(),
              table,
              action,
              recordId,
              data,
            },
          ],
        }));
      },

      mergeServerData: ({ workouts, meals, habits, metrics }) => {
        set((state) => {
          // Merge strategy: Overwrite synced items with server items.
          // Keep local pending items.
          
          const mergedWorkouts = workouts
            ? [
                ...state.workouts.filter((w) => w.syncStatus !== 'synced'),
                ...workouts.map((w) => ({ ...w, syncStatus: 'synced' as const })),
              ]
            : state.workouts;

          const mergedMeals = meals
            ? [
                ...state.meals.filter((m) => m.syncStatus !== 'synced'),
                ...meals.map((m) => ({ ...m, syncStatus: 'synced' as const })),
              ]
            : state.meals;

          const mergedHabits = habits
            ? [
                ...state.habits.filter((h) => h.syncStatus !== 'synced'),
                ...habits.map((h) => ({ ...h, syncStatus: 'synced' as const })),
              ]
            : state.habits;

          const mergedMetrics = metrics
            ? [
                ...state.metrics.filter((m) => m.syncStatus !== 'synced'),
                ...metrics.map((m) => ({ ...m, syncStatus: 'synced' as const })),
              ]
            : state.metrics;

          // De-duplicate lists by ID, prioritizing local-pending changes
          const uniqueById = <T extends { id: string }>(arr: T[]): T[] => {
            const seen = new Set();
            return arr.filter((item) => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
          };

          return {
            workouts: uniqueById(mergedWorkouts),
            meals: uniqueById(mergedMeals),
            habits: uniqueById(mergedHabits),
            metrics: uniqueById(mergedMetrics),
          };
        });
      },
    }),
    {
      name: 'routine-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workouts: state.workouts,
        meals: state.meals,
        habits: state.habits,
        metrics: state.metrics,
        syncQueue: state.syncQueue,
        goal: state.goal,
      }),
    }
  )
);
