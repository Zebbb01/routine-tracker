import NetInfo from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from './store';
import { SyncQueueItem } from './types';

let isSyncing = false;

// Perform the sync process for a single queue item
async function syncQueueItem(item: SyncQueueItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { table, action, recordId, data } = item;

  // Map local table names to Supabase tables
  // We use lowercase table names in Supabase (workouts, meals, habits, metrics)
  try {
    if (action === 'create') {
      // Upsert the data. Since we generate UUIDs locally, we can insert directly.
      // Remove syncStatus before saving to Supabase
      const { syncStatus, ...supabaseData } = data;
      
      // Map properties if needed (e.g. for habits table, or standard fields)
      const { error } = await supabase
        .from(table)
        .upsert({ ...supabaseData, id: recordId });

      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase
        .from(table)
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
        
        // Update local item status to 'synced' if it was a create action and still exists
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
    const [workoutsResponse, mealsResponse, habitsResponse, metricsResponse] = await Promise.all([
      supabase.from('workouts').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('meals').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('habits').select('*').order('date', { ascending: false }).limit(200),
      supabase.from('metrics').select('*').order('date', { ascending: false }).limit(100),
    ]);

    // Check errors and merge if successful
    const pulledData: Parameters<typeof store.mergeServerData>[0] = {};

    if (!workoutsResponse.error && workoutsResponse.data) {
      pulledData.workouts = workoutsResponse.data;
    }
    if (!mealsResponse.error && mealsResponse.data) {
      pulledData.meals = mealsResponse.data;
    }
    if (!habitsResponse.error && habitsResponse.data) {
      pulledData.habits = habitsResponse.data;
    }
    if (!metricsResponse.error && metricsResponse.data) {
      pulledData.metrics = metricsResponse.data;
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
