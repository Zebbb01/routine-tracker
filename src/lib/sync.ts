import NetInfo from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from './store';
import { SyncQueueItem } from './types';

let isSyncing = false;

// Perform the sync process for a single queue item
async function syncQueueItem(item: SyncQueueItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { table, action, recordId, data } = item;

  try {
    // Map table names if they differ, but we kept them lowercase and matching
    // local fields in our SQL migration.
    const tableName = table === 'custom_habits' ? 'custom_habits' :
                    table === 'workout_splits' ? 'workout_splits' : table;

    if (action === 'create') {
      // Remove syncStatus before saving to Supabase if it exists
      const { syncStatus, ...supabaseData } = data;
      
      const { error } = await supabase
        .from(tableName)
        .upsert({ ...supabaseData, id: recordId });

      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    }
    return true; // Success
  } catch (error) {
    console.error(`Error syncing item ${item.id} on table ${table}:`, error);
    return false; // Failed
  }
}

// Main sync function
export async function runSync() {
  if (isSyncing) return;
  if (!isSupabaseConfigured || !supabase) {
    console.log('Sync skipped: Supabase not configured.');
    return;
  }

  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? true; // Fallback to true if unknown

  if (!isOnline) {
    console.log('Sync skipped: Device is offline.');
    return;
  }

  isSyncing = true;
  console.log('Sync started...');

  try {
    const store = useAppStore.getState();
    const queue = [...store.syncQueue];

    // 1. Process pending offline changes
    for (const item of queue) {
      const success = await syncQueueItem(item);
      if (success) {
        // Clear from queue
        store.clearSyncQueueItem(item.id);
        
        // Update local item status to 'synced' if it has a syncStatus property
        if (item.action === 'create') {
          if (item.table === 'workouts') {
            useAppStore.setState((s) => ({
              workouts: s.workouts.map((w) =>
                w.id === item.recordId ? { ...w, syncStatus: 'synced' } : w
              ),
            }));
          } else if (item.table === 'meals') {
            useAppStore.setState((s) => ({
              meals: s.meals.map((m) =>
                m.id === item.recordId ? { ...m, syncStatus: 'synced' } : m
              ),
            }));
          } else if (item.table === 'habits') {
            useAppStore.setState((s) => ({
              habits: s.habits.map((h) =>
                h.id === item.recordId ? { ...h, syncStatus: 'synced' } : h
              ),
            }));
          } else if (item.table === 'metrics') {
            useAppStore.setState((s) => ({
              metrics: s.metrics.map((m) =>
                m.id === item.recordId ? { ...m, syncStatus: 'synced' } : m
              ),
            }));
          }
        }
      }
    }

    // 2. Pull fresh data from server
    const [
      profilesRes,
      customHabitsRes,
      splitsRes,
      workoutsRes,
      mealsRes,
      habitsRes,
      metricsRes
    ] = await Promise.all([
      supabase.from('profiles').select('*').limit(20),
      supabase.from('custom_habits').select('*').limit(100),
      supabase.from('workout_splits').select('*').limit(50),
      supabase.from('workouts').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('meals').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('habits').select('*').order('date', { ascending: false }).limit(200),
      supabase.from('metrics').select('*').order('date', { ascending: false }).limit(100),
    ]);

    // Check errors and merge if successful
    const pulledData: Parameters<typeof store.mergeServerData>[0] = {};

    if (!profilesRes.error && profilesRes.data) {
      pulledData.profiles = profilesRes.data;
    }
    if (!customHabitsRes.error && customHabitsRes.data) {
      pulledData.custom_habits = customHabitsRes.data;
    }
    if (!splitsRes.error && splitsRes.data) {
      pulledData.workout_splits = splitsRes.data;
    }
    if (!workoutsRes.error && workoutsRes.data) {
      pulledData.workouts = workoutsRes.data;
    }
    if (!mealsRes.error && mealsRes.data) {
      pulledData.meals = mealsRes.data;
    }
    if (!habitsRes.error && habitsRes.data) {
      pulledData.habits = habitsRes.data;
    }
    if (!metricsRes.error && metricsRes.data) {
      pulledData.metrics = metricsRes.data;
    }

    store.mergeServerData(pulledData);
    console.log('Sync completed successfully.');
  } catch (error) {
    console.error('Error during runSync:', error);
  } finally {
    isSyncing = false;
  }
}

// Initialize sync listener
export function initSyncListener() {
  // Listen for connectivity changes
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log('Network connected. Triggering sync...');
      runSync();
    }
  });

  // Run initial sync on startup
  runSync();
}
