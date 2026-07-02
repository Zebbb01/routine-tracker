import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, SafeAreaView, Dimensions } from 'react-native';
import tw from 'twrnc';
import { useAppStore } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { runSync } from '@/lib/sync';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    goal,
    setGoal,
    workouts,
    meals,
    habits,
    syncQueue,
    toggleHabit
  } = useAppStore();

  const todayStr = useMemo(() => {
    // Get YYYY-MM-DD in local time
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Today's logged protein
  const todayProtein = useMemo(() => {
    return meals
      .filter((m) => m.date.startsWith(todayStr))
      .reduce((sum, m) => sum + (m.protein || 0), 0);
  }, [meals, todayStr]);

  // Today's logged calories
  const todayCalories = useMemo(() => {
    return meals
      .filter((m) => m.date.startsWith(todayStr))
      .reduce((sum, m) => sum + (m.calories || 0), 0);
  }, [meals, todayStr]);

  // Today's habit logs
  const todayHabits = useMemo(() => {
    return habits.filter((h) => h.date === todayStr);
  }, [habits, todayStr]);

  const isHabitCompleted = (name: string) => {
    return todayHabits.find((h) => h.habitName === name)?.completed || false;
  };

  // Determine today's target workout program
  const targetWorkout = useMemo(() => {
    switch (todayDayName) {
      case 'Monday':
        return {
          title: 'Push Day',
          exercises: ['Push-ups (4 sets)', 'Chair Dips (3 sets)', 'Pike Push-ups (3 sets)', 'Plank (3 sets)'],
        };
      case 'Wednesday':
        return {
          title: 'Legs + Core Day',
          exercises: ['Bodyweight Squats (4x20)', 'Bulgarian Split Squats (3x10)', 'Glute Bridges (3x20)', 'Leg Raises (3x10)', 'Plank (3x45s)'],
        };
      case 'Friday':
        return {
          title: 'Pull + Full Body Day',
          exercises: ['Assisted Pull-ups (4 sets)', 'Backpack Rows (4x12)', 'Push-ups (3xMax)', 'Mountain Climbers (3x30s)'],
        };
      default:
        return {
          title: 'Rest & Walking Day',
          exercises: ['Walk 10-15 mins after every meal', ' hourly stand-up breaks', 'Prepare meals & hit protein goals'],
        };
    }
  }, [todayDayName]);

  // Goal mapping
  const goals = [
    { id: 'aesthetic', label: 'Aesthetic Body', icon: 'star' },
    { id: 'muscle', label: 'Muscle Building', icon: 'fitness-center' },
    { id: 'lean', label: 'Lean & Toned', icon: 'flash-on' }
  ];

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView contentContainerStyle={tw`p-5 pb-10`}>
        {/* Sync Status Header */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <View>
            <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Hello Geral
            </Text>
            <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Let's build consistency today
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => runSync()}
            style={tw`flex-row items-center px-3 py-1.5 rounded-full ${
              syncQueue.length > 0 
                ? 'bg-amber-500/25 border border-amber-500/50' 
                : 'bg-emerald-500/25 border border-emerald-500/50'
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

        {/* Goal Selector */}
        <View style={tw`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            My Primary Fitness Goal
          </Text>
          <View style={tw`flex-row gap-2`}>
            {goals.map((g) => {
              const active = goal === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGoal(g.id)}
                  style={tw`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${
                    active
                      ? 'bg-blue-600 border-blue-600'
                      : isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-100'
                  }`}
                >
                  <MaterialIcons
                    name={g.icon as any}
                    size={16}
                    color={active ? '#FFFFFF' : isDark ? '#9CA3AF' : '#4B5563'}
                  />
                  <Text style={tw`ml-1 text-xs font-bold ${
                    active ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {g.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Protein Tracker Card */}
        <View style={tw`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <View>
              <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Protein Intake
              </Text>
              <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Target: 120-140 g per day
              </Text>
            </View>
            <View style={tw`items-end`}>
              <Text style={tw`text-xl font-black ${
                todayProtein >= 120 ? 'text-emerald-500' : 'text-blue-500'
              }`}>
                {todayProtein} g
              </Text>
              <Text style={tw`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {todayCalories} kcal
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`w-full h-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden mb-2`}>
            <View
              style={tw`h-full rounded-full ${
                todayProtein >= 140
                  ? 'bg-amber-500'
                  : todayProtein >= 120
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              } w-[${Math.min(100, Math.round((todayProtein / 120) * 100))}%]`}
            />
          </View>
          
          <Text style={tw`text-[11px] ${
            todayProtein >= 120 ? 'text-emerald-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {todayProtein >= 120 
              ? 'Ideal protein target reached! Keep it up.' 
              : `Need ${Math.max(0, 120 - todayProtein)}g more to hit your daily minimum.`}
          </Text>
        </View>

        {/* Today's Workout Target */}
        <View style={tw`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <View>
              <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Today's Workout
              </Text>
              <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {todayDayName} split
              </Text>
            </View>
            <View style={tw`px-3 py-1 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
              <Text style={tw`text-xs font-semibold text-blue-500`}>
                {targetWorkout.title}
              </Text>
            </View>
          </View>

          <View style={tw`border-t border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} py-2 mb-3`}>
            {targetWorkout.exercises.map((ex, idx) => (
              <View key={idx} style={tw`flex-row items-center py-1.5`}>
                <MaterialIcons
                  name="play-arrow"
                  size={14}
                  color="#3B82F6"
                  style={tw`mr-2`}
                />
                <Text style={tw`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {ex}
                </Text>
              </View>
            ))}
          </View>

          <Text style={tw`text-[11px] italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Tip: Log your workout progress in the Workouts tab to keep tracking your strength levels.
          </Text>
        </View>

        {/* Daily Habits Checklist */}
        <View style={tw`p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Daily Habits
          </Text>
          <Text style={tw`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Track small behaviors that lead to visceral fat loss
          </Text>

          {/* Habit Toggles */}
          {[
            { id: 'walk_breakfast', label: '10-15 min walk after Breakfast', icon: 'directions-walk' },
            { id: 'walk_lunch', label: '10-15 min walk after Lunch', icon: 'directions-walk' },
            { id: 'walk_dinner', label: '10-15 min walk after Dinner', icon: 'directions-walk' },
            { id: 'hourly_standup', label: 'hourly stand-up break (8 AM - 5 PM)', icon: 'alarm' },
            { id: 'sleep_hours', label: '7-8 hours sleep minimum', icon: 'king-bed' },
            { id: 'no_zero', label: 'Rule 1: No Zero Days (5 pushups/1 plank minimum)', icon: 'check-circle' }
          ].map((h) => {
            const completed = isHabitCompleted(h.id);
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => toggleHabit(h.id as any, todayStr, !completed)}
                style={tw`flex-row items-center justify-between py-3 border-b ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                }`}
              >
                <View style={tw`flex-row items-center flex-1 pr-4`}>
                  <View style={tw`w-8 h-8 rounded-full items-center justify-center ${
                    completed 
                      ? 'bg-emerald-500/20' 
                      : isDark ? 'bg-gray-850' : 'bg-gray-100'
                  } mr-3`}>
                    <MaterialIcons
                      name={h.icon as any}
                      size={18}
                      color={completed ? '#10B981' : isDark ? '#9CA3AF' : '#4B5563'}
                    />
                  </View>
                  <Text style={tw`text-sm font-medium flex-wrap ${
                    completed 
                      ? 'line-through text-gray-500' 
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {h.label}
                  </Text>
                </View>
                
                <View style={tw`w-6 h-6 rounded-md border-2 items-center justify-center ${
                  completed
                    ? 'bg-emerald-500 border-emerald-500'
                    : isDark ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-white'
                }`}>
                  {completed && (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
