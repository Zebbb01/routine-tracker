import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, Dimensions, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAppStore } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { runSync } from '@/lib/sync';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    profiles,
    activeProfileId,
    customHabits,
    workoutSplits,
    workouts,
    meals,
    habits,
    syncQueue,
    createProfile,
    switchProfile,
    toggleHabit,
    deleteProfile
  } = useAppStore();

  // Modals state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [newProfileModalVisible, setNewProfileModalVisible] = useState(false);

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileGoal, setNewProfileGoal] = useState<'aesthetic' | 'muscle' | 'lean' | 'strength'>('aesthetic');
  const [newProfileWeight, setNewProfileWeight] = useState('68');
  const [newProfileProtein, setNewProfileProtein] = useState('140');
  const [newProfileCalories, setNewProfileCalories] = useState('2200');

  // Active Profile details
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0];
  }, [profiles, activeProfileId]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  const todayDayIndex = useMemo(() => {
    return new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  }, []);

  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Today's scoped logged protein
  const todayProtein = useMemo(() => {
    if (!activeProfile) return 0;
    return meals
      .filter((m) => m.profileId === activeProfile.id && m.date.startsWith(todayStr))
      .reduce((sum, m) => sum + (m.protein || 0), 0);
  }, [meals, todayStr, activeProfile]);

  // Today's scoped logged calories
  const todayCalories = useMemo(() => {
    if (!activeProfile) return 0;
    return meals
      .filter((m) => m.profileId === activeProfile.id && m.date.startsWith(todayStr))
      .reduce((sum, m) => sum + (m.calories || 0), 0);
  }, [meals, todayStr, activeProfile]);

  // Scoped habits for active profile
  const profileHabits = useMemo(() => {
    if (!activeProfile) return [];
    return customHabits.filter(ch => ch.profileId === activeProfile.id);
  }, [customHabits, activeProfile]);

  // Determine which habits are active for today
  const activeHabitsForToday = useMemo(() => {
    return profileHabits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'custom') {
        return h.customDays.includes(todayDayIndex);
      }
      // Weekly count: Show always so the user can log it to count toward weekly goal
      return true;
    });
  }, [profileHabits, todayDayIndex]);

  // Count completions for weekly frequency habits
  const getWeeklyCompletionCount = (habitId: string, targetCount: number) => {
    if (!activeProfile) return { done: 0, target: targetCount };
    // Get start of the current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekLogs = habits.filter(hl => {
      if (hl.profileId !== activeProfile.id || hl.habitId !== habitId || !hl.completed) return false;
      const logDate = new Date(hl.date);
      return logDate >= startOfWeek;
    });

    return {
      done: weekLogs.length,
      target: targetCount
    };
  };

  const isHabitCompletedToday = (habitId: string) => {
    if (!activeProfile) return false;
    return habits.find((h) => h.profileId === activeProfile.id && h.habitId === habitId && h.date === todayStr)?.completed || false;
  };

  // Scheduled Workout Split for Today
  const todayWorkoutSplit = useMemo(() => {
    if (!activeProfile) return null;
    const splits = workoutSplits.filter(ws => ws.profileId === activeProfile.id);
    return splits.find(s => s.days.includes(todayDayIndex)) || null;
  }, [workoutSplits, todayDayIndex, activeProfile]);

  // Goal target labels mapping
  const goalLabels = {
    aesthetic: 'Aesthetic Body Plan',
    muscle: 'Muscle Building Plan',
    lean: 'Lean & Toned Plan',
    strength: 'Strength & Power Plan'
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newId = createProfile({
      name: newProfileName,
      targetGoal: newProfileGoal,
      weightGoal: parseFloat(newProfileWeight) || 68,
      proteinGoal: parseFloat(newProfileProtein) || 140,
      caloriesGoal: parseFloat(newProfileCalories) || 2000
    });
    setNewProfileName('');
    setNewProfileModalVisible(false);
    switchProfile(newId);
  };

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView contentContainerStyle={tw`p-5 pb-10`}>
        {/* Profile Switcher & Sync Bar */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <TouchableOpacity 
            onPress={() => setProfileModalVisible(true)}
            style={tw`flex-row items-center bg-blue-500/10 px-4 py-2.5 rounded-2xl border border-blue-500/20`}
          >
            <View style={tw`w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-2.5`}>
              <Text style={tw`text-white font-bold text-sm`}>
                {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : 'G'}
              </Text>
            </View>
            <View style={tw`pr-1`}>
              <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-bold`}>
                ACTIVE PROFILE
              </Text>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-sm font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mr-1`}>
                  {activeProfile ? activeProfile.name : 'Geral'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => runSync()}
            style={tw`flex-row items-center px-3.5 py-2.5 rounded-2xl ${
              syncQueue.length > 0 
                ? 'bg-amber-500/10 border border-amber-500/20' 
                : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <MaterialIcons
              name={syncQueue.length > 0 ? 'sync' : 'cloud-done'}
              size={16}
              color={syncQueue.length > 0 ? '#F59E0B' : '#10B981'}
            />
            <Text style={tw`ml-1.5 text-xs font-semibold ${
              syncQueue.length > 0 ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {syncQueue.length > 0 ? `${syncQueue.length} pending` : 'Synced'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan Header Card */}
        {activeProfile && (
          <View style={tw`mb-6 p-4 rounded-2xl bg-gradient-to-r ${isDark ? 'from-slate-900 to-slate-950 border border-gray-800' : 'from-blue-600 to-indigo-700'} shadow-md`}>
            <Text style={tw`text-xs font-bold tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-100'} uppercase mb-1`}>
              Current Split Program
            </Text>
            <Text style={tw`text-lg font-black text-white`}>
              {goalLabels[activeProfile.targetGoal]}
            </Text>
            <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-blue-100'} mt-1.5`}>
              Target: {activeProfile.weightGoal} kg | Protein: {activeProfile.proteinGoal}g | Calories: {activeProfile.caloriesGoal} kcal
            </Text>
          </View>
        )}

        {/* Today's Workout Program */}
        <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <View>
              <Text style={tw`text-xs font-bold text-gray-500`}>
                TODAY IS {todayDayName.toUpperCase()}
              </Text>
              <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {todayWorkoutSplit ? todayWorkoutSplit.name : 'Rest & Active Recovery'}
              </Text>
            </View>
            <MaterialIcons
              name={todayWorkoutSplit ? 'fitness-center' : 'weekend'}
              size={24}
              color={todayWorkoutSplit ? '#3B82F6' : '#10B981'}
            />
          </View>

          {todayWorkoutSplit ? (
            <View>
              <Text style={tw`text-xs font-bold text-blue-500 mb-2.5`}>
                SCHEDULED EXERCISES:
              </Text>
              {todayWorkoutSplit.exercises.map((ex, index) => (
                <View key={ex.id} style={tw`flex-row items-center py-1.5`}>
                  <View style={tw`w-5 h-5 rounded-full bg-blue-500/10 items-center justify-center mr-2.5`}>
                    <Text style={tw`text-blue-500 text-[10px] font-bold`}>{index + 1}</Text>
                  </View>
                  <Text style={tw`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {ex.name} <Text style={tw`text-xs text-gray-500`}>({ex.target})</Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View>
              <Text style={tw`text-xs text-gray-500 mb-3`}>
                No workout split scheduled for today. Focus on active recovery, nutrition, and daily steps.
              </Text>
              <View style={tw`flex-row items-center py-1.5`}>
                <MaterialIcons name="done" size={16} color="#10B981" style={tw`mr-2`} />
                <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Walk 10-15 mins after meals</Text>
              </View>
              <View style={tw`flex-row items-center py-1.5`}>
                <MaterialIcons name="done" size={16} color="#10B981" style={tw`mr-2`} />
                <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Stand up every hour</Text>
              </View>
            </View>
          )}
        </View>

        {/* Scoped Progress Bars for active profile */}
        {activeProfile && (
          <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
            <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Nutrition Target Tracker
            </Text>
            
            {/* Protein */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between mb-1.5`}>
                <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Protein</Text>
                <Text style={tw`text-sm font-bold text-blue-500`}>
                  {todayProtein}g / {activeProfile.proteinGoal}g
                </Text>
              </View>
              <View style={tw`w-full h-3 bg-gray-200 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                <View 
                  style={[
                    tw`h-full bg-blue-600 rounded-full`, 
                    { width: `${Math.min(100, (todayProtein / activeProfile.proteinGoal) * 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Calories */}
            <View>
              <View style={tw`flex-row justify-between mb-1.5`}>
                <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Calories</Text>
                <Text style={tw`text-sm font-bold text-orange-500`}>
                  {todayCalories} kcal / {activeProfile.caloriesGoal} kcal
                </Text>
              </View>
              <View style={tw`w-full h-3 bg-gray-200 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                <View 
                  style={[
                    tw`h-full bg-orange-500 rounded-full`, 
                    { width: `${Math.min(100, (todayCalories / activeProfile.caloriesGoal) * 100)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Dynamic Habits Checklist */}
        <View style={tw`p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Today's Checklist
          </Text>

          {activeHabitsForToday.length > 0 ? (
            activeHabitsForToday.map((h) => {
              const completed = isHabitCompletedToday(h.id);
              const isWeekly = h.frequency === 'weekly';
              const weeklyProgress = isWeekly ? getWeeklyCompletionCount(h.id, h.weeklyCount || 1) : null;
              
              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => toggleHabit(h.id, todayStr, !completed)}
                  style={tw`flex-row items-center justify-between py-3 border-b ${
                    isDark ? 'border-gray-800' : 'border-gray-100'
                  }`}
                >
                  <View style={tw`flex-row items-center flex-1 pr-4`}>
                    <View style={tw`w-8 h-8 rounded-full items-center justify-center ${
                      completed 
                        ? 'bg-emerald-500/20' 
                        : isDark ? 'bg-gray-800' : 'bg-gray-100'
                    } mr-3`}>
                      <MaterialIcons
                        name={h.icon as any}
                        size={18}
                        color={completed ? '#10B981' : isDark ? '#9CA3AF' : '#4B5563'}
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-medium flex-wrap ${
                        completed 
                          ? 'line-through text-gray-500' 
                          : isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {h.name}
                      </Text>
                      {isWeekly && weeklyProgress && (
                        <Text style={tw`text-[10px] font-bold text-blue-500 mt-0.5`}>
                          Weekly: {weeklyProgress.done} / {weeklyProgress.target} times completed
                        </Text>
                      )}
                      {h.frequency === 'custom' && (
                        <Text style={tw`text-[10px] font-medium text-purple-500 mt-0.5`}>
                          Scheduled Days
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={tw`w-6 h-6 rounded-md border-2 items-center justify-center ${
                    completed 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : isDark ? 'border-gray-750 bg-gray-950' : 'border-gray-300 bg-white'
                  }`}>
                    {completed && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={tw`text-xs italic text-gray-500`}>
              No habits scheduled for today. Add habits in settings.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Profiles Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`p-5 rounded-t-3xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Switch Profile
              </Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`max-h-60 mb-4`}>
              {profiles.map((p) => {
                const isActive = p.id === activeProfileId;
                return (
                  <View 
                    key={p.id}
                    style={tw`flex-row justify-between items-center p-3 rounded-xl mb-2 ${
                      isActive 
                        ? 'bg-blue-600/10 border border-blue-600/40' 
                        : isDark ? 'bg-gray-950' : 'bg-gray-100'
                    }`}
                  >
                    <TouchableOpacity 
                      onPress={() => {
                        switchProfile(p.id);
                        setProfileModalVisible(false);
                      }}
                      style={tw`flex-1 flex-row items-center`}
                    >
                      <View style={tw`w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-3`}>
                        <Text style={tw`text-white font-bold text-sm`}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={tw`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {p.name}
                        </Text>
                        <Text style={tw`text-[10px] text-gray-500 capitalize`}>
                          Plan: {p.targetGoal}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {profiles.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => deleteProfile(p.id)}
                        style={tw`p-1`}
                      >
                        <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setProfileModalVisible(false);
                setNewProfileModalVisible(true);
              }}
              style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
            >
              <MaterialIcons name="add" size={18} color="#FFFFFF" style={tw`mr-1`} />
              <Text style={tw`text-white font-bold text-sm`}>
                Create New Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create New Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={newProfileModalVisible}
        onRequestClose={() => setNewProfileModalVisible(false)}
      >
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`p-5 rounded-t-3xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Create Profile
              </Text>
              <TouchableOpacity onPress={() => setNewProfileModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`mb-4`}>
              <View style={tw`mb-3.5`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Profile Name
                </Text>
                <TextInput
                  placeholder="e.g. Geral"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={newProfileName}
                  onChangeText={setNewProfileName}
                  style={tw`p-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </View>

              <View style={tw`mb-3.5`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Body Goal
                </Text>
                <View style={tw`flex-row gap-1`}>
                  {(['aesthetic', 'muscle', 'lean', 'strength'] as const).map((goalOption) => {
                    const active = newProfileGoal === goalOption;
                    return (
                      <TouchableOpacity
                        key={goalOption}
                        onPress={() => setNewProfileGoal(goalOption)}
                        style={tw`flex-1 py-2 rounded-lg border items-center capitalize ${
                          active 
                            ? 'bg-blue-600 border-blue-600' 
                            : isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-100'
                        }`}
                      >
                        <Text style={tw`text-[10px] font-bold ${
                          active ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {goalOption}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={tw`flex-row gap-2 mb-4`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Weight Goal (kg)
                  </Text>
                  <TextInput
                    placeholder="68"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    keyboardType="numeric"
                    value={newProfileWeight}
                    onChangeText={setNewProfileWeight}
                    style={tw`p-2.5 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Protein Goal (g)
                  </Text>
                  <TextInput
                    placeholder="140"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    keyboardType="numeric"
                    value={newProfileProtein}
                    onChangeText={setNewProfileProtein}
                    style={tw`p-2.5 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </View>
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Calories Goal (kcal)
                </Text>
                <TextInput
                  placeholder="2200"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  keyboardType="numeric"
                  value={newProfileCalories}
                  onChangeText={setNewProfileCalories}
                  style={tw`p-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleCreateProfile}
              style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
            >
              <MaterialIcons name="done" size={18} color="#FFFFFF" style={tw`mr-1`} />
              <Text style={tw`text-white font-bold text-sm`}>
                Save Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
