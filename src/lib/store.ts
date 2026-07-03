import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSet, Meal, HabitLog, Metric, SyncQueueItem, Profile, CustomHabit, WorkoutSplit } from './types';

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
  profiles: Profile[];
  activeProfileId: string;
  customHabits: CustomHabit[];
  workoutSplits: WorkoutSplit[];
  
  workouts: WorkoutSet[];
  meals: Meal[];
  habits: HabitLog[];
  metrics: Metric[];
  syncQueue: SyncQueueItem[];

  // Profile Actions
  createProfile: (profile: Omit<Profile, 'id'>) => string;
  switchProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
  updateProfileGoal: (profileId: string, updates: Partial<Omit<Profile, 'id'>>) => void;

  // Custom Habit Actions
  addCustomHabit: (habit: Omit<CustomHabit, 'id' | 'profileId'>) => void;
  deleteCustomHabit: (habitId: string) => void;

  // Workout Split Actions
  addWorkoutSplit: (split: Omit<WorkoutSplit, 'id' | 'profileId'>) => void;
  deleteWorkoutSplit: (splitId: string) => void;
  updateWorkoutSplit: (splitId: string, updates: Partial<Omit<WorkoutSplit, 'id' | 'profileId'>>) => void;

  // Logging Actions
  addWorkout: (workout: Omit<WorkoutSet, 'id' | 'profileId' | 'syncStatus'>) => void;
  deleteWorkout: (id: string) => void;
  
  addMeal: (meal: Omit<Meal, 'id' | 'profileId' | 'syncStatus'>) => void;
  deleteMeal: (id: string) => void;
  
  toggleHabit: (
    habitId: string,
    date: string,
    completed: boolean,
    value?: number
  ) => void;
  
  addMetric: (metric: Omit<Metric, 'id' | 'profileId' | 'syncStatus'>) => void;
  deleteMetric: (id: string) => void;

  // Sync actions
  clearSyncQueueItem: (id: string) => void;
  addToSyncQueue: (table: SyncQueueItem['table'], action: SyncQueueItem['action'], recordId: string, data: any) => void;
  mergeServerData: (data: {
    profiles?: Profile[];
    custom_habits?: CustomHabit[];
    workout_splits?: WorkoutSplit[];
    workouts?: WorkoutSet[];
    meals?: Meal[];
    habits?: HabitLog[];
    metrics?: Metric[];
  }) => void;

  // Toast actions
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;

  // Dialog actions
  dialog: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null;
  showDialog: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  hideDialog: () => void;
}

// Helpers for default seeding
const seedDefaultHabits = (profileId: string): CustomHabit[] => [
  { id: generateUUID(), profileId, name: 'Walk after breakfast (10 min)', icon: 'directions-walk', frequency: 'daily', customDays: [] },
  { id: generateUUID(), profileId, name: 'Walk after lunch (10 min)', icon: 'directions-walk', frequency: 'daily', customDays: [] },
  { id: generateUUID(), profileId, name: 'Walk after dinner (10 min)', icon: 'directions-walk', frequency: 'daily', customDays: [] },
  { id: generateUUID(), profileId, name: 'Stand up every hour', icon: 'accessibility', frequency: 'daily', customDays: [] },
  { id: generateUUID(), profileId, name: 'Sleep 7-8 hours', icon: 'hotel', frequency: 'daily', customDays: [] },
  { id: generateUUID(), profileId, name: 'No zero days (Do push-ups)', icon: 'done-all', frequency: 'daily', customDays: [] }
];

const seedDefaultSplits = (profileId: string): WorkoutSplit[] => [
  {
    id: generateUUID(),
    profileId,
    name: 'Push Split',
    days: [1, 4], // Mon, Thu
    exercises: [
      { id: generateUUID(), name: 'Push-ups', target: '4 sets of max reps' },
      { id: generateUUID(), name: 'Chair Dips', target: '3 sets of 8-15 reps' },
      { id: generateUUID(), name: 'Pike Push-ups', target: '3 sets of 6-10 reps' }
    ]
  },
  {
    id: generateUUID(),
    profileId,
    name: 'Pull Split',
    days: [2, 5], // Tue, Fri
    exercises: [
      { id: generateUUID(), name: 'Pull-ups / Inverted Rows', target: '4 sets of 8-12 reps' },
      { id: generateUUID(), name: 'Dumbbell / Resistance Band Rows', target: '3 sets of 10-15 reps' },
      { id: generateUUID(), name: 'Bicep Curls', target: '3 sets of 12-15 reps' }
    ]
  },
  {
    id: generateUUID(),
    profileId,
    name: 'Legs Split',
    days: [3, 6], // Wed, Sat
    exercises: [
      { id: generateUUID(), name: 'Squats (Bodyweight or Weighted)', target: '4 sets of 15-20 reps' },
      { id: generateUUID(), name: 'Bulgarian Split Squats', target: '3 sets of 10-12 reps each' },
      { id: generateUUID(), name: 'Calf Raises', target: '3 sets of 20 reps' }
    ]
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: '',
      customHabits: [],
      workoutSplits: [],
      workouts: [],
      meals: [],
      habits: [],
      metrics: [],
      syncQueue: [],
      toast: null,
      dialog: null,

      createProfile: (profileData) => {
        const id = generateUUID();
        const newProfile: Profile = { ...profileData, id };
        
        // Seed default habits and workout splits for this new profile
        const newHabits = seedDefaultHabits(id);
        const newSplits = seedDefaultSplits(id);

        set((state) => ({
          profiles: [...state.profiles, newProfile],
          customHabits: [...state.customHabits, ...newHabits],
          workoutSplits: [...state.workoutSplits, ...newSplits],
          // Sync changes
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table: 'profiles', action: 'create', recordId: id, data: newProfile },
            ...newHabits.map(h => ({ id: generateUUID(), table: 'custom_habits' as const, action: 'create' as const, recordId: h.id, data: h })),
            ...newSplits.map(s => ({ id: generateUUID(), table: 'workout_splits' as const, action: 'create' as const, recordId: s.id, data: s }))
          ]
        }));

        if (!get().activeProfileId) {
          set({ activeProfileId: id });
        }

        return id;
      },

      switchProfile: (profileId) => {
        set({ activeProfileId: profileId });
      },

      deleteProfile: (profileId) => {
        set((state) => {
          const remainingProfiles = state.profiles.filter((p) => p.id !== profileId);
          let nextActive = state.activeProfileId;
          
          if (state.activeProfileId === profileId) {
            nextActive = remainingProfiles.length > 0 ? remainingProfiles[0].id : '';
          }

          return {
            profiles: remainingProfiles,
            activeProfileId: nextActive,
            // Keep cleanup local. For sync, we could record deletion.
            syncQueue: [
              ...state.syncQueue,
              { id: generateUUID(), table: 'profiles', action: 'delete', recordId: profileId, data: null }
            ]
          };
        });
      },

      updateProfileGoal: (profileId, updates) => {
        set((state) => {
          const updated = state.profiles.map((p) => 
            p.id === profileId ? { ...p, ...updates } : p
          );
          const matched = updated.find(p => p.id === profileId);
          return {
            profiles: updated,
            syncQueue: matched ? [
              ...state.syncQueue.filter(q => q.table === 'profiles' && q.recordId === profileId && q.action === 'create'),
              { id: generateUUID(), table: 'profiles', action: 'create', recordId: profileId, data: matched }
            ] : state.syncQueue
          };
        });
      },

      addCustomHabit: (habitData) => {
        const id = generateUUID();
        const profileId = get().activeProfileId;
        if (!profileId) return;

        const newHabit: CustomHabit = { ...habitData, id, profileId };

        set((state) => ({
          customHabits: [...state.customHabits, newHabit],
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table: 'custom_habits', action: 'create', recordId: id, data: newHabit }
          ]
        }));
      },

      deleteCustomHabit: (habitId) => {
        const habit = get().customHabits.find(h => h.id === habitId);
        if (!habit) return;

        set((state) => ({
          customHabits: state.customHabits.filter(h => h.id !== habitId),
          // Also delete logs associated with this habit
          habits: state.habits.filter(hl => hl.habitId !== habitId),
          syncQueue: [
            ...state.syncQueue.filter(q => q.recordId !== habitId),
            { id: generateUUID(), table: 'custom_habits', action: 'delete', recordId: habitId, data: habit }
          ]
        }));
      },

      addWorkoutSplit: (splitData) => {
        const id = generateUUID();
        const profileId = get().activeProfileId;
        if (!profileId) return;

        const newSplit: WorkoutSplit = { ...splitData, id, profileId };

        set((state) => ({
          workoutSplits: [...state.workoutSplits, newSplit],
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table: 'workout_splits', action: 'create', recordId: id, data: newSplit }
          ]
        }));
      },

      deleteWorkoutSplit: (splitId) => {
        const split = get().workoutSplits.find(s => s.id === splitId);
        if (!split) return;

        set((state) => ({
          workoutSplits: state.workoutSplits.filter(s => s.id !== splitId),
          syncQueue: [
            ...state.syncQueue.filter(q => q.recordId !== splitId),
            { id: generateUUID(), table: 'workout_splits', action: 'delete', recordId: splitId, data: split }
          ]
        }));
      },

      updateWorkoutSplit: (splitId, updates) => {
        set((state) => {
          const updated = state.workoutSplits.map((s) => 
            s.id === splitId ? { ...s, ...updates } : s
          );
          const matched = updated.find(s => s.id === splitId);
          return {
            workoutSplits: updated,
            syncQueue: matched ? [
              ...state.syncQueue.filter(q => q.table === 'workout_splits' && q.recordId === splitId),
              { id: generateUUID(), table: 'workout_splits', action: 'create', recordId: splitId, data: matched }
            ] : state.syncQueue
          };
        });
      },

      addWorkout: (workoutData) => {
        const id = generateUUID();
        const profileId = get().activeProfileId;
        if (!profileId) return;

        const newWorkout: WorkoutSet = {
          ...workoutData,
          id,
          profileId,
          syncStatus: 'pending_create',
        };

        set((state) => ({
          workouts: [newWorkout, ...state.workouts],
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table: 'workouts', action: 'create', recordId: id, data: newWorkout },
          ],
        }));
      },

      deleteWorkout: (id) => {
        const workout = get().workouts.find((w) => w.id === id);
        if (!workout) return;

        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
          syncQueue: workout.syncStatus === 'pending_create'
            ? state.syncQueue.filter((q) => q.recordId !== id)
            : [
                ...state.syncQueue,
                { id: generateUUID(), table: 'workouts', action: 'delete', recordId: id, data: workout },
              ],
        }));
      },

      addMeal: (mealData) => {
        const id = generateUUID();
        const profileId = get().activeProfileId;
        if (!profileId) return;

        const newMeal: Meal = {
          ...mealData,
          id,
          profileId,
          syncStatus: 'pending_create',
        };

        set((state) => ({
          meals: [newMeal, ...state.meals],
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table: 'meals', action: 'create', recordId: id, data: newMeal },
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
                { id: generateUUID(), table: 'meals', action: 'delete', recordId: id, data: meal },
              ],
        }));
      },

      toggleHabit: (habitId, date, completed, value) => {
        const profileId = get().activeProfileId;
        if (!profileId) return;

        const habits = get().habits;
        const existingIndex = habits.findIndex(
          (h) => h.habitId === habitId && h.date === date && h.profileId === profileId
        );

        if (existingIndex > -1) {
          const existing = habits[existingIndex];
          const updatedHabit: HabitLog = {
            ...existing,
            completed,
            value,
            syncStatus: 'pending_create',
          };

          const newHabits = [...habits];
          newHabits[existingIndex] = updatedHabit;

          set((state) => ({
            habits: newHabits,
            syncQueue: [
              ...state.syncQueue.filter((q) => q.recordId !== existing.id),
              { id: generateUUID(), table: 'habits', action: 'create', recordId: existing.id, data: updatedHabit },
            ],
          }));
        } else {
          const id = generateUUID();
          const newHabit: HabitLog = {
            id,
            profileId,
            habitId,
            completed,
            value,
            date,
            syncStatus: 'pending_create',
          };

          set((state) => ({
            habits: [newHabit, ...state.habits],
            syncQueue: [
              ...state.syncQueue,
              { id: generateUUID(), table: 'habits', action: 'create', recordId: id, data: newHabit },
            ],
          }));
        }
      },

      addMetric: (metricData) => {
        const id = generateUUID();
        const profileId = get().activeProfileId;
        if (!profileId) return;

        const newMetric: Metric = {
          ...metricData,
          id,
          profileId,
          syncStatus: 'pending_create',
        };

        set((state) => ({
          metrics: [newMetric, ...state.metrics],
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table: 'metrics', action: 'create', recordId: id, data: newMetric },
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
                { id: generateUUID(), table: 'metrics', action: 'delete', recordId: id, data: metric },
              ],
        }));
      },

      clearSyncQueueItem: (queueId) => {
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => item.id !== queueId),
        }));
      },

      showToast: (message, type = 'success') => {
        set({ toast: { message, type } });
      },

      hideToast: () => {
        set({ toast: null });
      },

      showDialog: (config) => {
        set({ dialog: config });
      },

      hideDialog: () => {
        set({ dialog: null });
      },

      addToSyncQueue: (table, action, recordId, data) => {
        set((state) => ({
          syncQueue: [
            ...state.syncQueue,
            { id: generateUUID(), table, action, recordId, data },
          ],
        }));
      },

      mergeServerData: ({ profiles, custom_habits, workout_splits, workouts, meals, habits, metrics }) => {
        set((state) => {
          const mergedProfiles = profiles
            ? [
                ...state.profiles.filter(p => !profiles.some(sp => sp.id === p.id)),
                ...profiles
              ]
            : state.profiles;

          const mergedCustomHabits = custom_habits
            ? [
                ...state.customHabits.filter(ch => !custom_habits.some(sch => sch.id === ch.id)),
                ...custom_habits
              ]
            : state.customHabits;

          const mergedSplits = workout_splits
            ? [
                ...state.workoutSplits.filter(ws => !workout_splits.some(sws => sws.id === ws.id)),
                ...workout_splits
              ]
            : state.workoutSplits;

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

          const uniqueById = <T extends { id: string }>(arr: T[]): T[] => {
            const seen = new Set();
            return arr.filter((item) => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
          };

          return {
            profiles: uniqueById(mergedProfiles),
            customHabits: uniqueById(mergedCustomHabits),
            workoutSplits: uniqueById(mergedSplits),
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
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        customHabits: state.customHabits,
        workoutSplits: state.workoutSplits,
        workouts: state.workouts,
        meals: state.meals,
        habits: state.habits,
        metrics: state.metrics,
        syncQueue: state.syncQueue,
      }),
    }
  )
);
