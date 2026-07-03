import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAppStore } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { analyzeMealWithAI, AIAnalysisResult } from '@/lib/ai';

// Filipino helper quick-add list
const FILIPINO_HELPERS = [
  { name: '1 Egg', protein: 6, calories: 70, icon: 'egg' },
  { name: '1 Cup Rice', protein: 4, calories: 200, icon: 'restaurant-menu' },
  { name: '150g Chicken Breast', protein: 46, calories: 250, icon: 'kebab-dining' },
  { name: '150g Tuna Can', protein: 39, calories: 180, icon: 'sailing' },
  { name: 'Milk (Glass)', protein: 8, calories: 150, icon: 'local-cafe' },
  { name: 'Greek Yogurt', protein: 10, calories: 120, icon: 'icecream' },
  { name: 'Tuna Sandwich', protein: 15, calories: 280, icon: 'lunch-dining' },
  { name: 'Whey Protein', protein: 25, calories: 120, icon: 'bolt' }
];

export default function DietScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    profiles,
    activeProfileId,
    meals,
    addMeal,
    deleteMeal,
    showToast,
    showDialog
  } = useAppStore();

  // Custom meal input states
  const [foodName, setFoodName] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // AI assistant states
  const aiInputRef = useRef<TextInput>(null);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Active Profile details
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0];
  }, [profiles, activeProfileId]);

  // Today's YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  // Today's scoped meals list
  const todayMeals = useMemo(() => {
    if (!activeProfile) return [];
    return meals.filter((m) => m.profileId === activeProfile.id && m.date.startsWith(todayStr));
  }, [meals, todayStr, activeProfile]);

  // Today's total protein
  const totalProtein = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
  }, [todayMeals]);

  // Today's total calories
  const totalCalories = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  }, [todayMeals]);

  // Quick Log helper
  const handleQuickAdd = (helper: typeof FILIPINO_HELPERS[0]) => {
    if (!activeProfile) return;
    const currentHour = new Date().getHours();
    let autoMealType: typeof selectedMealType = 'snack';
    if (currentHour >= 6 && currentHour < 11) autoMealType = 'breakfast';
    else if (currentHour >= 11 && currentHour < 14) autoMealType = 'lunch';
    else if (currentHour >= 18 && currentHour < 21) autoMealType = 'dinner';

    addMeal({
      name: helper.name,
      protein: helper.protein,
      calories: helper.calories,
      mealType: autoMealType,
      date: new Date().toISOString()
    });
  };

  // Custom meal submit
  const handleAddCustomMeal = () => {
    if (!activeProfile) return;
    if (!foodName.trim()) {
      showDialog({ title: 'Invalid Input', message: 'Please enter a food name.' });
      return;
    }
    const protein = parseFloat(proteinInput);
    const calories = parseInt(caloriesInput);

    if (isNaN(protein) || protein < 0) {
      showDialog({ title: 'Invalid Input', message: 'Please enter a valid protein amount.' });
      return;
    }

    addMeal({
      name: foodName.trim(),
      protein,
      calories: isNaN(calories) ? 0 : calories,
      mealType: selectedMealType,
      date: new Date().toISOString()
    });

    setFoodName('');
    setProteinInput('');
    setCaloriesInput('');
    setShowCustomForm(false);
  };

  // AI Meal Analysis
  const handleAIAnalyze = async () => {
    if (!aiInput.trim()) {
      showDialog({ title: 'Required', message: 'Please describe your meal first.' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await analyzeMealWithAI(aiInput);
      if (result) {
        setAiResult(result);
      } else {
        showDialog({ title: 'AI Error', message: 'Could not analyze this meal. Please verify internet connection.' });
      }
    } catch (e) {
      showDialog({ title: 'AI Error', message: 'An error occurred during estimation.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Confirm and log AI results
  const handleConfirmAILog = () => {
    if (!aiResult || !activeProfile) return;
    
    addMeal({
      name: aiResult.foodName,
      protein: aiResult.protein,
      calories: aiResult.calories,
      mealType: aiResult.mealType,
      date: new Date().toISOString()
    });

    // Reset AI state
    setAiInput('');
    setAiResult(null);
    showToast('Meal details logged successfully.');
  };

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView contentContainerStyle={tw`p-5 pb-10`}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <View>
            <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Diet Tracker
            </Text>
            <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Track macros and hit your goals
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCustomForm(!showCustomForm)}
            style={tw`bg-blue-600/10 border border-blue-500/20 px-3.5 py-2.5 rounded-2xl flex-row items-center`}
          >
            <MaterialIcons name={showCustomForm ? 'close' : 'add'} size={16} color="#3B82F6" style={tw`mr-1`} />
            <Text style={tw`text-blue-500 font-bold text-xs`}>
              {showCustomForm ? 'Cancel' : 'Log Food'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Progress Card */}
        {activeProfile && (
          <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
            <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Today's Targets Summary
            </Text>
            
            {/* Protein bar */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between mb-1.5`}>
                <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Protein Intake
                </Text>
                <Text style={tw`text-sm font-bold text-blue-500`}>
                  {totalProtein}g / {activeProfile.proteinGoal}g
                </Text>
              </View>
              <View style={tw`w-full h-3 bg-gray-200 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                <View 
                  style={[
                    tw`h-full bg-blue-600 rounded-full`, 
                    { width: `${Math.min(100, (totalProtein / activeProfile.proteinGoal) * 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Calories bar */}
            <View>
              <View style={tw`flex-row justify-between mb-1.5`}>
                <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Energy Intake
                </Text>
                <Text style={tw`text-sm font-bold text-orange-500`}>
                  {totalCalories} kcal / {activeProfile.caloriesGoal} kcal
                </Text>
              </View>
              <View style={tw`w-full h-3 bg-gray-200 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                <View 
                  style={[
                    tw`h-full bg-orange-500 rounded-full`, 
                    { width: `${Math.min(100, (totalCalories / activeProfile.caloriesGoal) * 100)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* AI MEAL ASSISTANT CARD */}
        <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-blue-950/20 border border-blue-900/30' : 'bg-blue-50/50 border border-blue-100'} shadow-sm`}>
          <View style={tw`flex-row items-center mb-3.5`}>
            <MaterialIcons name="psychology" size={24} color="#3B82F6" style={tw`mr-2`} />
            <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AI Meal Assistant
            </Text>
          </View>
          
          <Text style={tw`text-xs text-gray-500 mb-3`}>
            Type what you ate in plain English. AI estimates the protein, calories, and checks if you need to log anything else.
          </Text>

          {!aiResult ? (
            <View>
              <TextInput
                ref={aiInputRef}
                multiline={true}
                numberOfLines={3}
                placeholder="e.g.&#10;Lunch: 155 pesos sisig&#10;1 cup of rice&#10;Nestle fresh milk"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={aiInput}
                onChangeText={setAiInput}
                textAlignVertical="top"
                style={tw`p-3 rounded-xl border text-sm bg-white ${
                  isDark ? 'bg-gray-950 border-gray-800 text-white' : 'border-gray-200 text-gray-900'
                } mb-3 min-h-18 text-left`}
              />
              <TouchableOpacity
                onPress={handleAIAnalyze}
                disabled={aiLoading}
                style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="auto-awesome" size={18} color="#FFFFFF" style={tw`mr-1.5`} />
                    <Text style={tw`text-white font-bold text-sm`}>Estimate & Log</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`bg-white ${isDark ? 'bg-gray-950 border border-gray-800' : 'border border-gray-200'} p-4 rounded-xl`}>
              <Text style={tw`text-xs font-bold text-blue-500 mb-2 uppercase`}>
                AI Estimation
              </Text>
              
              <Text style={tw`text-sm font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {aiResult.foodName}
              </Text>

              <View style={tw`flex-row gap-3 mb-4`}>
                <View style={tw`bg-blue-500/10 px-2.5 py-1 rounded-lg`}>
                  <Text style={tw`text-xs font-bold text-blue-500`}>
                    Protein: {aiResult.protein}g
                  </Text>
                </View>
                <View style={tw`bg-orange-500/10 px-2.5 py-1 rounded-lg`}>
                  <Text style={tw`text-xs font-bold text-orange-500`}>
                    Calories: {aiResult.calories} kcal
                  </Text>
                </View>
                <View style={tw`bg-purple-500/10 px-2.5 py-1 rounded-lg`}>
                  <Text style={tw`text-xs font-bold text-purple-500 capitalize`}>
                    {aiResult.mealType}
                  </Text>
                </View>
              </View>

              {/* Conversational follow up bubble */}
              <View style={tw`p-3 bg-blue-500/10 rounded-xl mb-4`}>
                <Text style={tw`text-xs font-bold text-blue-500 mb-1`}>
                  Meal Assistant:
                </Text>
                <Text style={tw`text-xs italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  "{aiResult.followUp}"
                </Text>
              </View>

              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={handleConfirmAILog}
                  style={tw`flex-1 bg-emerald-600 rounded-xl items-center flex-row justify-center h-11`}
                >
                  <MaterialIcons name="check" size={16} color="#FFFFFF" style={tw`mr-1`} />
                  <Text style={tw`text-white text-xs font-bold`}>Log This</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Append a newline for listing additional foods on a new line
                    setAiInput(prev => prev ? `${prev}\n` : '');
                    setAiResult(null);
                    setTimeout(() => {
                      aiInputRef.current?.focus();
                    }, 80);
                  }}
                  style={tw`flex-1 bg-blue-600 rounded-xl items-center flex-row justify-center h-11`}
                >
                  <MaterialIcons name="reply" size={16} color="#FFFFFF" style={tw`mr-1`} />
                  <Text style={tw`text-white text-xs font-bold`}>Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setAiResult(null);
                    setAiInput('');
                  }}
                  style={tw`bg-red-500/10 px-4 rounded-xl items-center justify-center h-11`}
                >
                  <MaterialIcons name="delete" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Custom Meal Form */}
        {showCustomForm && (
          <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
            <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Log Custom Food
            </Text>

            <View style={tw`mb-3`}>
              <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Food Name *
              </Text>
              <TextInput
                placeholder="e.g. Fried Chicken"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={foodName}
                onChangeText={setFoodName}
                style={tw`p-2.5 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View style={tw`flex-row gap-2 mb-3`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Protein (g) *
                </Text>
                <TextInput
                  placeholder="20"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  keyboardType="numeric"
                  value={proteinInput}
                  onChangeText={setProteinInput}
                  style={tw`p-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Calories (kcal)
                </Text>
                <TextInput
                  placeholder="150"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  keyboardType="numeric"
                  value={caloriesInput}
                  onChangeText={setCaloriesInput}
                  style={tw`p-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </View>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-xs font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Meal Type
              </Text>
              <View style={tw`flex-row gap-1`}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
                  const active = selectedMealType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedMealType(type)}
                      style={tw`flex-1 py-2 rounded-lg border items-center capitalize ${
                        active 
                          ? 'bg-blue-600 border-blue-600' 
                          : isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-100'
                      }`}
                    >
                      <Text style={tw`text-[11px] font-bold ${
                        active ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddCustomMeal}
              style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
            >
              <MaterialIcons name="done" size={18} color="#FFFFFF" style={tw`mr-1`} />
              <Text style={tw`text-white font-bold text-sm`}>
                Save Meal Entry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Log Panel */}
        <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
            Filipino Staples Quick-Log
          </Text>
          <Text style={tw`text-xs text-gray-500 mb-4`}>
            Tap to instantly log typical portions. Auto-detects breakfast, lunch, or dinner time.
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {FILIPINO_HELPERS.map((item) => (
              <TouchableOpacity
                key={item.name}
                onPress={() => handleQuickAdd(item)}
                style={tw`flex-row items-center p-2.5 rounded-xl border ${
                  isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
                } w-[48%]`}
              >
                <View style={tw`w-7 h-7 rounded-full bg-blue-500/10 items-center justify-center mr-2`}>
                  <MaterialIcons name={item.icon as any} size={16} color="#3B82F6" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[11px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={tw`text-[9px] text-gray-500 font-medium`}>
                    +{item.protein}g protein | {item.calories} kcal
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logged Foods List */}
        <View style={tw`p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Today's Logged Foods
          </Text>
          {todayMeals.length > 0 ? (
            todayMeals.map((meal) => (
              <View
                key={meal.id}
                style={tw`flex-row justify-between items-center py-3 border-b ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                } last:border-b-0`}
              >
                <View style={tw`flex-row items-center flex-1 pr-4`}>
                  <View style={tw`w-8 h-8 rounded-full bg-gray-200 ${isDark ? 'bg-gray-800' : 'bg-gray-150'} items-center justify-center mr-3`}>
                    <MaterialIcons 
                      name={
                        meal.mealType === 'breakfast' ? 'free-breakfast' :
                        meal.mealType === 'lunch' ? 'lunch-dining' :
                        meal.mealType === 'dinner' ? 'restaurant' : 'local-pizza'
                      } 
                      size={16} 
                      color={isDark ? '#9CA3AF' : '#4B5563'} 
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {meal.name}
                    </Text>
                    <Text style={tw`text-[10px] text-gray-500 capitalize`}>
                      {meal.mealType} | +{meal.protein}g protein | {meal.calories} kcal
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteMeal(meal.id)} style={tw`p-1`}>
                  <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={tw`text-xs italic text-gray-500 text-center py-4`}>
              No meals logged today yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
