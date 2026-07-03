import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useAppStore } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

// Demo data for preview (target curves)
const DEMO_WEIGHT = [70.0, 69.2, 68.5, 67.8, 67.2, 66.8];
const DEMO_PUSHUPS = [15, 18, 22, 26, 32, 38];
const DEMO_WAIST = [34, 33.5, 32.8, 32.0, 31.2, 30.5];
const DEMO_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];

export default function MetricsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    profiles,
    activeProfileId,
    metrics,
    addMetric,
    deleteMetric,
    showToast
  } = useAppStore();

  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [pushupsInput, setPushupsInput] = useState('');
  
  // Track which chart is selected
  const [selectedChartType, setSelectedChartType] = useState<'weight' | 'pushups' | 'waist'>('weight');
  const [useDemoData, setUseDemoData] = useState(true);

  // Active Profile details
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0];
  }, [profiles, activeProfileId]);

  // Scoped metrics chronologically
  const sortedMetrics = useMemo(() => {
    if (!activeProfile) return [];
    return [...metrics]
      .filter(m => m.profileId === activeProfile.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [metrics, activeProfile]);

  // Determine if user has actual data for the selected chart
  const userChartData = useMemo(() => {
    const labels: string[] = [];
    const dataPoints: number[] = [];

    sortedMetrics.forEach((m) => {
      const dateLabel = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (selectedChartType === 'weight' && m.weight !== undefined) {
        labels.push(dateLabel);
        dataPoints.push(m.weight);
      } else if (selectedChartType === 'pushups' && m.pushUps !== undefined) {
        labels.push(dateLabel);
        dataPoints.push(m.pushUps);
      } else if (selectedChartType === 'waist' && m.waist !== undefined) {
        labels.push(dateLabel);
        dataPoints.push(m.waist);
      }
    });

    // Only return data if we have at least 2 data points for visualization
    if (dataPoints.length >= 2) {
      const limit = 6;
      return {
        labels: labels.slice(-limit),
        data: dataPoints.slice(-limit)
      };
    }
    return null;
  }, [sortedMetrics, selectedChartType]);

  // Decide if we should render demo data or user data
  const chartData = useMemo(() => {
    if (userChartData && !useDemoData) {
      return {
        labels: userChartData.labels,
        datasets: [{ data: userChartData.data }]
      };
    }
    
    // Fallback to demo data
    let demoSet = DEMO_WEIGHT;
    if (selectedChartType === 'pushups') demoSet = DEMO_PUSHUPS;
    if (selectedChartType === 'waist') demoSet = DEMO_WAIST;

    return {
      labels: DEMO_LABELS,
      datasets: [{ data: demoSet }]
    };
  }, [userChartData, useDemoData, selectedChartType]);

  const handleLogMetric = () => {
    if (!activeProfile) return;
    const weight = parseFloat(weightInput);
    const waist = parseFloat(waistInput);
    const pushups = parseInt(pushupsInput);

    if (isNaN(weight) && isNaN(waist) && isNaN(pushups)) {
      Alert.alert('Empty Inputs', 'Please log at least one metric (Weight, Waist, or Push-ups).');
      return;
    }

    addMetric({
      date: new Date().toISOString(),
      weight: isNaN(weight) ? undefined : weight,
      waist: isNaN(waist) ? undefined : waist,
      pushUps: isNaN(pushups) ? undefined : pushups
    });

    setWeightInput('');
    setWaistInput('');
    setPushupsInput('');
    
    // Auto switch to actual user data when they log something
    setUseDemoData(false);
    showToast('Metrics logged successfully.');
  };

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView contentContainerStyle={tw`p-5 pb-10`}>
        {/* Header */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Body Metrics
          </Text>
          <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Track weight, waist sizes, and maximum push-up counts
          </Text>
        </View>

        {/* Log Metric Form Card */}
        <View style={tw`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
            Log Body Specs
          </Text>
          
          <View style={tw`flex-row gap-2 mb-4`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Weight (kg)
              </Text>
              <TextInput
                placeholder="68.5"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numeric"
                value={weightInput}
                onChangeText={setWeightInput}
                style={tw`p-2.5 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Waist (inches)
              </Text>
              <TextInput
                placeholder="32.5"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numeric"
                value={waistInput}
                onChangeText={setWaistInput}
                style={tw`p-2.5 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Pushups Max
              </Text>
              <TextInput
                placeholder="20"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numeric"
                value={pushupsInput}
                onChangeText={setPushupsInput}
                style={tw`p-2.5 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogMetric}
            style={tw`bg-blue-600 p-3 rounded-xl items-center flex-row justify-center`}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" style={tw`mr-1`} />
            <Text style={tw`text-white font-bold text-sm`}>
              Save Metrics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Charts Card */}
        <View style={tw`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <View>
              <Text style={tw`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Progress Visualization
              </Text>
              <Text style={tw`text-xs text-gray-500`}>
                {useDemoData ? 'Showing 6-week target preview' : 'Showing your progress data'}
              </Text>
            </View>
            
            {userChartData && (
              <TouchableOpacity
                onPress={() => setUseDemoData(!useDemoData)}
                style={tw`bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20`}
              >
                <Text style={tw`text-xs font-semibold text-blue-500`}>
                  {useDemoData ? 'View My Data' : 'View Target'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Chart Type Toggles */}
          <View style={tw`flex-row gap-1 mb-4`}>
            {[
              { id: 'weight', label: 'Weight (kg)', icon: 'monitor-weight' },
              { id: 'waist', label: 'Waist (in)', icon: 'straighten' },
              { id: 'pushups', label: 'Pushups Max', icon: 'fitness-center' }
            ].map((chart) => {
              const active = selectedChartType === chart.id;
              return (
                <TouchableOpacity
                  key={chart.id}
                  onPress={() => setSelectedChartType(chart.id as any)}
                  style={tw`flex-1 py-2 rounded-lg border items-center flex-row justify-center ${
                    active 
                      ? 'bg-blue-600 border-blue-600' 
                      : isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-100'
                  }`}
                >
                  <Text style={tw`text-[11px] font-bold ${
                    active ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {chart.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Line Chart */}
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 56}
            height={200}
            chartConfig={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#111827' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1F2937' : '#FFFFFF',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => isDark ? `rgba(156, 163, 175, ${opacity})` : `rgba(75, 85, 99, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#3B82F6'
              }
            }}
            bezier
            style={tw`my-2 rounded-xl`}
          />
        </View>

        {/* Scoped Logged History List */}
        <View style={tw`p-5 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <Text style={tw`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Logged Specifications History
          </Text>
          
          {sortedMetrics.length > 0 ? (
            [...sortedMetrics].reverse().map((m) => (
              <View 
                key={m.id} 
                style={tw`flex-row justify-between items-center py-3.5 border-b ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                } last:border-b-0`}
              >
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <View style={tw`flex-row flex-wrap gap-2.5 mt-1`}>
                    {m.weight !== undefined && (
                      <View style={tw`bg-blue-500/10 px-2 py-0.5 rounded-md`}>
                        <Text style={tw`text-[10px] font-bold text-blue-500`}>Weight: {m.weight} kg</Text>
                      </View>
                    )}
                    {m.waist !== undefined && (
                      <View style={tw`bg-purple-500/10 px-2 py-0.5 rounded-md`}>
                        <Text style={tw`text-[10px] font-bold text-purple-500`}>Waist: {m.waist} in</Text>
                      </View>
                    )}
                    {m.pushUps !== undefined && (
                      <View style={tw`bg-emerald-500/10 px-2 py-0.5 rounded-md`}>
                        <Text style={tw`text-[10px] font-bold text-emerald-500`}>Pushups Max: {m.pushUps}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteMetric(m.id)} style={tw`p-1`}>
                  <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={tw`text-xs italic text-gray-500 text-center py-4`}>
              No history entries found.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
