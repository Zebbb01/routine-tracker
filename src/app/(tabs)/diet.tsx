import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAppStore } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

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

  const { meals, addMeal, deleteMeal } = useAppStore();

  // Custom meal input states
  const [foodName, setFoodName] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Today's YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);

  // Today's meals list
  const todayMeals = useMemo(() => {
    return meals.filter((m) => m.date.startsWith(todayStr));
  }, [meals, todayStr]);

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
    // Automatically determine meal type based on current time
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
    if (!foodName.trim()) {
      Alert.alert('Invalid Input', 'Please enter a food name.');
      return;
    }
    const protein = parseFloat(proteinInput);
    const calories = parseInt(caloriesInput);

    if (isNaN(protein) || protein < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid protein amount.');
      return;
    }

    addMeal({
      name: foodName.trim(),
      protein,
      calories: isNaN(calories) ? 0 : calories,
      mealType: selectedMealType,
      date: new Date().toISOString()
    });

    // Reset fields
    setFoodName('');
    setProteinInput('');
    setCaloriesInput('');
    setShowCustomForm(false);
  };

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView contentContainerStyle={tw`p-4 pb-12`}>
        {/* Diet Progress Summary */}
        <View style={tw`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Today's Nutrition Summary
          </Text>
          
          <View style={tw`flex-row justify-between mb-4`}>
            <View style={tw`flex-1 mr-4 bg-gray-950/20 p-3 rounded-xl`}>
              <Text style={tw`text-[11px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                PROTEIN INTAKE
              </Text>
              <Text style={tw`text-xl font-black text-blue-500 mt-1`}>
                {totalProtein} <Text style={tw`text-xs font-bold`}>/ 120-140 g</Text>
              </Text>
              <Text style={tw`text-[10px] mt-1 ${totalProtein >= 120 ? 'text-emerald-500 font-semibold' : 'text-gray-500'}`}>
                {totalProtein >= 120 ? 'Target met!' : `${Math.max(0, 120 - totalProtein)}g left`}
              </Text>
            </View>

            <View style={tw`flex-1 bg-gray-950/20 p-3 rounded-xl`}>
              <Text style={tw`text-[11px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                TOTAL CALORIES
              </Text>
              <Text style={tw`text-xl font-black text-amber-500 mt-1`}>
                {totalCalories} <Text style={tw`text-xs font-bold`}>kcal</Text>
              </Text>
              <Text style={tw`text-[10px] text-gray-500 mt-1`}>
                Clean Filipino diet focus
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`w-full h-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden`}>
            <View
              style={tw`h-full rounded-full ${
                totalProtein >= 140
                  ? 'bg-amber-500'
                  : totalProtein >= 120
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              } w-[${Math.min(100, Math.round((totalProtein / 120) * 100))}%]`}
            />
          </View>
        </View>

        {/* Filipino Diet Helpers */}
        <View style={tw`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Filipino Diet Quick Log
          </Text>
          <Text style={tw`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Tap items to log immediately based on your diet guide
          </Text>

          <View style={tw`flex-row flex-wrap gap-2`}>
            {FILIPINO_HELPERS.map((helper) => (
              <TouchableOpacity
                key={helper.name}
                onPress={() => handleQuickAdd(helper)}
                style={tw`w-[48%] flex-row items-center p-3 rounded-xl border ${
                  isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-100'
                }`}
              >
                <View style={tw`p-1.5 rounded-lg bg-blue-500/10 mr-2.5`}>
                  <MaterialIcons
                    name={helper.icon as any}
                    size={16}
                    color="#3B82F6"
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {helper.name}
                  </Text>
                  <Text style={tw`text-[10px] text-gray-500`}>
                    {helper.protein}g protein | {helper.calories}c
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Log Custom Meal Toggle & Form */}
        <View style={tw`mb-6`}>
          <TouchableOpacity
            onPress={() => setShowCustomForm(!showCustomForm)}
            style={tw`flex-row justify-between items-center p-4 rounded-2xl border ${
              isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
            }`}
          >
            <View style={tw`flex-row items-center`}>
              <MaterialIcons name="add-circle-outline" size={20} color="#3B82F6" style={tw`mr-2`} />
              <Text style={tw`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Log Custom Food / Meal
              </Text>
            </View>
            <MaterialIcons
              name={showCustomForm ? 'expand-less' : 'expand-more'}
              size={20}
              color={isDark ? '#9CA3AF' : '#4B5563'}
            />
          </TouchableOpacity>

          {showCustomForm && (
            <View style={tw`mt-2 p-4 rounded-2xl border ${
              isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
            }`}>
              <View style={tw`mb-3`}>
                <Text style={tw`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Food Name *
                </Text>
                <TextInput
                  placeholder="e.g. Grilled Salmon"
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
                  <Text style={tw`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                  <Text style={tw`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                <MaterialIcons name="add" size={18} color="#FFFFFF" style={tw`mr-1`} />
                <Text style={tw`text-white font-bold text-sm`}>
                  Log Custom Food
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Logged Foods List */}
        <View style={tw`p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Today's Logged Food
          </Text>

          {todayMeals.length > 0 ? (
            todayMeals.map((meal) => (
              <View
                key={meal.id}
                style={tw`flex-row justify-between items-center py-3 border-b ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                } last:border-b-0`}
              >
                <View style={tw`flex-1 pr-4`}>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {meal.name}
                    </Text>
                    <View style={tw`ml-2 px-1.5 py-0.5 rounded bg-blue-500/10`}>
                      <Text style={tw`text-[9px] font-bold text-blue-500 capitalize`}>
                        {meal.mealType}
                      </Text>
                    </View>
                  </View>
                  <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>
                    {meal.protein}g protein | {meal.calories} kcal
                  </Text>
                </View>
                
                <TouchableOpacity onPress={() => deleteMeal(meal.id)}>
                  <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={tw`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No food logged yet for today. Start logging to track your protein target!
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
