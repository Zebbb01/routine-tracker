import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAppStore } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

// Preloaded workout splits
const SPLITS = [
  {
    id: 'mon',
    name: 'Monday (Push)',
    exercises: [
      { id: 'pushups', name: 'Push-ups', target: '4 sets of max reps (stop 1-2 reps before failure)' },
      { id: 'chair_dips', name: 'Chair Dips', target: '3 sets of 8-15 reps' },
      { id: 'pike_pushups', name: 'Pike Push-ups', target: '3 sets of 6-10 reps' },
      { id: 'plank_mon', name: 'Plank', target: '3 sets of 30-60 seconds' }
    ]
  },
  {
    id: 'wed',
    name: 'Wednesday (Legs + Core)',
    exercises: [
      { id: 'squats', name: 'Bodyweight Squats', target: '4 sets of 20 reps' },
      { id: 'bulgarian_split_squats', name: 'Bulgarian Split Squats', target: '3 sets of 10 reps each leg' },
      { id: 'glute_bridges', name: 'Glute Bridges', target: '3 sets of 20 reps' },
      { id: 'leg_raises', name: 'Leg Raises', target: '3 sets of 10-15 reps' },
      { id: 'plank_wed', name: 'Plank', target: '3 sets of 45 seconds' }
    ]
  },
  {
    id: 'fri',
    name: 'Friday (Pull + Full Body)',
    exercises: [
      { id: 'pullups', name: 'Assisted Pull-ups', target: '4 sets' },
      { id: 'backpack_rows', name: 'Backpack Rows', target: '4 sets of 12 reps (add weight inside backpack!)' },
      { id: 'pushups_fri', name: 'Push-ups', target: '3 sets of maximum reps' },
      { id: 'mountain_climbers', name: 'Mountain Climbers', target: '3 sets of 30 seconds' }
    ]
  }
];

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { workouts, addWorkout, deleteWorkout } = useAppStore();
  
  const [selectedSplitId, setSelectedSplitId] = useState('mon');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Set logging form states
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Rest Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMax, setTimerMax] = useState(60);

  // Today's YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  // Timer tick effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // Start timer helper
  const startTimer = (seconds: number) => {
    setTimerMax(seconds);
    setTimerSeconds(seconds);
    setTimerActive(true);
  };

  const selectedSplit = useMemo(() => {
    return SPLITS.find((s) => s.id === selectedSplitId) || SPLITS[0];
  }, [selectedSplitId]);

  // Filter logged sets for an exercise logged today
  const getLoggedSets = (exerciseName: string) => {
    return workouts
      .filter((w) => w.exerciseName === exerciseName && w.date.startsWith(todayStr))
      .sort((a, b) => a.sets - b.sets);
  };

  // Log a new set
  const handleLogSet = (exerciseId: string, exerciseName: string) => {
    const reps = parseInt(repsInput);
    if (isNaN(reps) || reps <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of reps.');
      return;
    }

    const weight = parseFloat(weightInput) || 0;
    const existingSets = getLoggedSets(exerciseName);
    const setNum = existingSets.length + 1;

    addWorkout({
      exerciseId,
      exerciseName,
      weight,
      reps,
      sets: setNum,
      date: new Date().toISOString(),
      notes: notesInput.trim() || undefined
    });

    // Reset inputs
    setRepsInput('');
    setNotesInput('');
    
    // Auto start rest timer (60 seconds)
    startTimer(60);
  };

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Timer Bar Overlay */}
      {timerSeconds > 0 && (
        <View style={tw`bg-blue-600 px-4 py-2.5 flex-row justify-between items-center shadow-lg`}>
          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="hourglass-empty" size={18} color="#FFFFFF" />
            <Text style={tw`text-white text-sm font-semibold ml-2`}>
              Rest Timer: {timerSeconds}s remaining
            </Text>
          </View>
          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity 
              onPress={() => setTimerActive(!timerActive)}
              style={tw`bg-white/20 px-2.5 py-1 rounded-md`}
            >
              <Text style={tw`text-white text-xs font-bold`}>
                {timerActive ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTimerSeconds(0)}
              style={tw`bg-white/20 px-2.5 py-1 rounded-md`}
            >
              <Text style={tw`text-white text-xs font-bold`}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Routine Selectors */}
      <View style={tw`flex-row p-4 border-b ${isDark ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        {SPLITS.map((s) => {
          const active = selectedSplitId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => {
                setSelectedSplitId(s.id);
                setExpandedExerciseId(null);
              }}
              style={tw`flex-1 py-2 px-1 rounded-lg items-center ${
                active ? 'bg-blue-600' : 'bg-transparent'
              }`}
            >
              <Text style={tw`text-xs font-bold text-center ${
                active ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {s.name.split(' ')[0]}
              </Text>
              <Text style={tw`text-[10px] text-center ${
                active ? 'text-blue-100' : isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {s.name.substring(s.name.indexOf('('))}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={tw`p-4 pb-12`}>
        <Text style={tw`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Track {selectedSplit.name} Exercises
        </Text>

        {selectedSplit.exercises.map((ex) => {
          const isExpanded = expandedExerciseId === ex.id;
          const loggedSets = getLoggedSets(ex.name);

          return (
            <View 
              key={ex.id} 
              style={tw`mb-4 rounded-2xl border overflow-hidden ${
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              } shadow-sm`}
            >
              {/* Exercise Header */}
              <TouchableOpacity
                onPress={() => {
                  setExpandedExerciseId(isExpanded ? null : ex.id);
                  setWeightInput('');
                  setRepsInput('');
                  setNotesInput('');
                }}
                style={tw`p-4 flex-row justify-between items-center ${
                  isExpanded ? (isDark ? 'bg-gray-800' : 'bg-gray-50') : 'bg-transparent'
                }`}
              >
                <View style={tw`flex-1 pr-4`}>
                  <Text style={tw`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {ex.name}
                  </Text>
                  <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {ex.target}
                  </Text>
                </View>
                
                <View style={tw`flex-row items-center`}>
                  {loggedSets.length > 0 && (
                    <View style={tw`bg-emerald-500/10 px-2 py-0.5 rounded-full mr-2`}>
                      <Text style={tw`text-emerald-500 text-xs font-semibold`}>
                        {loggedSets.length} sets logged
                      </Text>
                    </View>
                  )}
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={isDark ? '#9CA3AF' : '#4B5563'}
                  />
                </View>
              </TouchableOpacity>

              {/* Expandable Panel */}
              {isExpanded && (
                <View style={tw`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  {/* Logged Sets list */}
                  {loggedSets.length > 0 ? (
                    <View style={tw`mb-4 bg-gray-950/20 rounded-xl p-3`}>
                      <Text style={tw`text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        LOGGED TODAY:
                      </Text>
                      {loggedSets.map((set) => (
                        <View 
                          key={set.id} 
                          style={tw`flex-row justify-between items-center py-2 border-b border-gray-800 last:border-b-0`}
                        >
                          <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Set {set.sets}: {set.weight > 0 ? `${set.weight} kg x ` : ''}{set.reps} reps
                            {set.notes ? ` (${set.notes})` : ''}
                          </Text>
                          <TouchableOpacity onPress={() => deleteWorkout(set.id)}>
                            <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={tw`text-xs italic mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      No sets logged yet for today.
                    </Text>
                  )}

                  {/* Add Set Form */}
                  <View style={tw`flex-row gap-2 mb-3`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[10px] font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Weight (kg)
                      </Text>
                      <TextInput
                        placeholder="0"
                        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                        keyboardType="numeric"
                        value={weightInput}
                        onChangeText={setWeightInput}
                        style={tw`p-2.5 rounded-lg border text-sm ${
                          isDark 
                            ? 'bg-gray-950 border-gray-800 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </View>
                    
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[10px] font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Reps *
                      </Text>
                      <TextInput
                        placeholder="10"
                        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                        keyboardType="numeric"
                        value={repsInput}
                        onChangeText={setRepsInput}
                        style={tw`p-2.5 rounded-lg border text-sm ${
                          isDark 
                            ? 'bg-gray-950 border-gray-800 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </View>
                  </View>

                  <View style={tw`mb-3`}>
                    <Text style={tw`text-[10px] font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Notes / Equipment used (e.g. 5kg bands)
                    </Text>
                    <TextInput
                      placeholder="Optional notes"
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      value={notesInput}
                      onChangeText={setNotesInput}
                      style={tw`p-2.5 rounded-lg border text-sm ${
                        isDark 
                          ? 'bg-gray-950 border-gray-800 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleLogSet(ex.id, ex.name)}
                    style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
                  >
                    <MaterialIcons name="add" size={18} color="#FFFFFF" style={tw`mr-1`} />
                    <Text style={tw`text-white font-bold text-sm`}>
                      Log Set
                    </Text>
                  </TouchableOpacity>

                  {/* Rest Timer Presets inside card */}
                  <View style={tw`flex-row justify-between items-center mt-4 pt-3 border-t ${
                    isDark ? 'border-gray-800' : 'border-gray-100'
                  }`}>
                    <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Rest Timer presets:
                    </Text>
                    <View style={tw`flex-row gap-2`}>
                      {[30, 60, 90].map((sec) => (
                        <TouchableOpacity
                          key={sec}
                          onPress={() => startTimer(sec)}
                          style={tw`px-2.5 py-1 rounded-md ${
                            isDark ? 'bg-gray-800' : 'bg-gray-200'
                          }`}
                        >
                          <Text style={tw`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {sec}s
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
