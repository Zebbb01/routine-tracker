import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAppStore, generateUUID } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    activeProfileId,
    workoutSplits,
    workouts,
    addWorkout,
    deleteWorkout,
    addWorkoutSplit,
    deleteWorkoutSplit,
    updateWorkoutSplit,
    showDialog
  } = useAppStore();
  
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Set logging form states
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Rest Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMax, setTimerMax] = useState(60);

  // Split management modal states
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [splitNameInput, setSplitNameInput] = useState('');
  const [splitDaysInput, setSplitDaysInput] = useState<number[]>([]);
  const [exercisesTextInput, setExercisesTextInput] = useState('');

  // Scoped splits
  const profileSplits = useMemo(() => {
    if (!activeProfileId) return [];
    return workoutSplits.filter(ws => ws.profileId === activeProfileId);
  }, [workoutSplits, activeProfileId]);

  // Set default selected split
  useEffect(() => {
    if (profileSplits.length > 0 && !selectedSplitId) {
      // Pick today's day if available, otherwise first
      const todayIndex = new Date().getDay();
      const todaySplit = profileSplits.find(s => s.days.includes(todayIndex));
      setSelectedSplitId(todaySplit ? todaySplit.id : profileSplits[0].id);
    }
  }, [profileSplits, selectedSplitId]);

  const selectedSplit = useMemo(() => {
    return profileSplits.find((s) => s.id === selectedSplitId) || profileSplits[0] || null;
  }, [profileSplits, selectedSplitId]);

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

  // Filter logged sets for an exercise logged today for active profile
  const getLoggedSets = (exerciseName: string) => {
    if (!activeProfileId) return [];
    return workouts
      .filter((w) => w.profileId === activeProfileId && w.exerciseName === exerciseName && w.date.startsWith(todayStr))
      .sort((a, b) => a.sets - b.sets);
  };

  // Log a new set
  const handleLogSet = (exerciseId: string, exerciseName: string) => {
    if (!activeProfileId) return;
    const reps = parseInt(repsInput);
    if (isNaN(reps) || reps <= 0) {
      showDialog({ title: 'Invalid Input', message: 'Please enter a valid number of reps.' });
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

  const handleSaveSplit = () => {
    if (!splitNameInput.trim()) {
      showDialog({ title: 'Required', message: 'Please enter a split name.' });
      return;
    }
    if (splitDaysInput.length === 0) {
      showDialog({ title: 'Required', message: 'Please select at least one schedule day.' });
      return;
    }

    // Parse exercises from text input (one per line)
    const exerciseLines = exercisesTextInput.split('\n');
    const exercises = exerciseLines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split('-');
        const name = parts[0].trim();
        const target = parts[1] ? parts[1].trim() : '3 sets of max reps';
        return {
          id: generateUUID(),
          name,
          target
        };
      });

    if (exercises.length === 0) {
      showDialog({ title: 'Required', message: 'Please enter at least one exercise.' });
      return;
    }

    addWorkoutSplit({
      name: splitNameInput.trim(),
      days: splitDaysInput,
      exercises
    });

    // Clear inputs and close
    setSplitNameInput('');
    setSplitDaysInput([]);
    setExercisesTextInput('');
    setManageModalVisible(false);
  };

  const toggleDaySelection = (dayIndex: number) => {
    if (splitDaysInput.includes(dayIndex)) {
      setSplitDaysInput(splitDaysInput.filter(d => d !== dayIndex));
    } else {
      setSplitDaysInput([...splitDaysInput, dayIndex]);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Floating Rest Timer Status */}
      {timerSeconds > 0 && (
        <View style={tw`absolute top-12 left-4 right-4 z-50 bg-blue-600 p-3.5 rounded-2xl flex-row items-center justify-between shadow-lg`}>
          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="timer" size={20} color="#FFFFFF" style={tw`mr-2`} />
            <Text style={tw`text-white font-extrabold text-sm`}>
              Rest Timer: {timerSeconds}s
            </Text>
          </View>
          <View style={tw`w-24 h-2 bg-blue-800 rounded-full overflow-hidden mr-3`}>
            <View style={[tw`h-full bg-emerald-400`, { width: `${(timerSeconds / timerMax) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setTimerSeconds(0)} style={tw`bg-blue-800 px-3 py-1 rounded-lg`}>
            <Text style={tw`text-white text-xs font-bold`}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={tw`p-5 pb-10`}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <View>
            <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Workout Tracker
            </Text>
            <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Select or build splits, log your sets
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setManageModalVisible(true)}
            style={tw`bg-blue-600/10 border border-blue-500/20 px-3.5 py-2.5 rounded-2xl flex-row items-center`}
          >
            <MaterialIcons name="add" size={16} color="#3B82F6" style={tw`mr-1`} />
            <Text style={tw`text-blue-500 font-bold text-xs`}>Add Split</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Splits ScrollBar */}
        {profileSplits.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-6`}>
            <View style={tw`flex-row gap-2`}>
              {profileSplits.map((s) => {
                const active = selectedSplitId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      setSelectedSplitId(s.id);
                      setExpandedExerciseId(null);
                    }}
                    style={tw`px-4 py-2.5 rounded-2xl border ${
                      active 
                        ? 'bg-blue-600 border-blue-600' 
                        : isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text style={tw`text-xs font-bold ${
                      active ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {s.name}
                    </Text>
                    <Text style={tw`text-[9px] mt-0.5 ${
                      active ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {s.days.map(d => DAY_NAMES[d].substring(0, 3)).join(', ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={tw`mb-6 p-4 bg-gray-900/50 rounded-2xl items-center`}>
            <Text style={tw`text-xs text-gray-400 italic text-center`}>
              No splits created yet. Click Add Split to set up your routine.
            </Text>
          </View>
        )}

        {/* Split Details Card */}
        {selectedSplit ? (
          <View>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Exercises ({selectedSplit.exercises.length})
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  showDialog({
                    title: 'Delete Split',
                    message: `Are you sure you want to delete "${selectedSplit.name}"?`,
                    confirmText: 'Delete',
                    onConfirm: () => {
                      deleteWorkoutSplit(selectedSplit.id);
                      setSelectedSplitId(null);
                    }
                  });
                }}
                style={tw`flex-row items-center`}
              >
                <MaterialIcons name="delete" size={16} color="#EF4444" style={tw`mr-1`} />
                <Text style={tw`text-red-500 text-xs font-bold`}>Delete Split</Text>
              </TouchableOpacity>
            </View>

            {selectedSplit.exercises.map((ex) => {
              const isExpanded = expandedExerciseId === ex.id;
              const loggedSets = getLoggedSets(ex.name);

              return (
                <View 
                  key={ex.id} 
                  style={tw`mb-3 rounded-2xl overflow-hidden border ${
                    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150'
                  }`}
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
                        <View style={tw`bg-emerald-500/10 px-2.5 py-0.5 rounded-full mr-2`}>
                          <Text style={tw`text-emerald-500 text-[10px] font-bold`}>
                            {loggedSets.length} sets
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
                          <Text style={tw`text-[10px] font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                                isDark ? 'bg-gray-800' : 'bg-gray-100'
                              }`}
                            >
                              <Text style={tw`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
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
          </View>
        ) : null}
      </ScrollView>

      {/* Add Split Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={manageModalVisible}
        onRequestClose={() => setManageModalVisible(false)}
      >
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`p-5 rounded-t-3xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Create Custom Split
              </Text>
              <TouchableOpacity onPress={() => setManageModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`mb-4`}>
              <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Split Name
                </Text>
                <TextInput
                  placeholder="e.g. Upper Body Day"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={splitNameInput}
                  onChangeText={setSplitNameInput}
                  style={tw`p-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Schedule Days (Weekly)
                </Text>
                <View style={tw`flex-row flex-wrap gap-1.5`}>
                  {DAY_NAMES.map((dayName, index) => {
                    const selected = splitDaysInput.includes(index);
                    return (
                      <TouchableOpacity
                        key={dayName}
                        onPress={() => toggleDaySelection(index)}
                        style={tw`px-3 py-2 rounded-lg border ${
                          selected 
                            ? 'bg-blue-600 border-blue-600' 
                            : isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-100'
                        }`}
                      >
                        <Text style={tw`text-[11px] font-bold ${
                          selected ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {dayName.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Exercises (One exercise per line, format: Name - Target sets/reps)
                </Text>
                <TextInput
                  placeholder="e.g.&#10;Pullups - 4 sets of 8 reps&#10;Dips - 3 sets of 12 reps&#10;Pushups - 3 sets of fail"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  multiline={true}
                  numberOfLines={5}
                  value={exercisesTextInput}
                  onChangeText={setExercisesTextInput}
                  style={tw`p-2.5 rounded-lg border text-sm text-left h-36 ${
                    isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveSplit}
              style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
            >
              <MaterialIcons name="done" size={18} color="#FFFFFF" style={tw`mr-1`} />
              <Text style={tw`text-white font-bold text-sm`}>
                Save Workout Split
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
