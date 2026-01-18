import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/src/constants/theme';
import { VolumeChart } from '@/src/components/progress/VolumeChart';
import { StrengthChart } from '@/src/components/progress/StrengthChart';
import { WorkoutHistory } from '@/src/components/progress/WorkoutHistory';
import { useUserStore } from '@/src/stores/useUserStore';
import { useWorkoutStore } from '@/src/stores/useWorkoutStore';

type View = 'overview' | 'history' | 'prs';

export default function ProgressScreen() {
  const [activeView, setActiveView] = useState<View>('overview');
  const { profile, loadProfile } = useUserStore();
  const { weeklyProgress, loadWeeklyProgress } = useWorkoutStore();

  useEffect(() => {
    loadProfile();
    loadWeeklyProgress();
  }, []);

  const getTotalVolume = () => {
    if (!weeklyProgress) return 0;
    const wp = weeklyProgress as any;
    return (wp.push_completed_volume || 0) + (wp.pull_completed_volume || 0) + (wp.legs_completed_volume || 0);
  };

  const getWorkoutCount = () => {
    if (!profile) return 0;
    return (profile.currentWeek - 1) * 3;
  };

  const personalRecords = [
    { exercise: 'Bench Press', weight: 225, reps: 5, date: '2 days ago' },
    { exercise: 'Squat', weight: 315, reps: 5, date: '1 week ago' },
    { exercise: 'Deadlift', weight: 405, reps: 3, date: '1 week ago' },
    { exercise: 'Overhead Press', weight: 135, reps: 8, date: '3 days ago' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>

        {/* Tab Selector */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeView === 'overview' && styles.tabActive]}
            onPress={() => setActiveView('overview')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeView === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeView === 'history' && styles.tabActive]}
            onPress={() => setActiveView('history')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeView === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeView === 'prs' && styles.tabActive]}
            onPress={() => setActiveView('prs')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeView === 'prs' && styles.tabTextActive]}>
              Records
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeView === 'overview' && (
          <View style={styles.overviewContent}>
            {/* Stats Summary */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile?.currentWeek || 0}</Text>
                <Text style={styles.statLabel}>Week Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getWorkoutCount()}</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(getTotalVolume() / 1000)}k</Text>
                <Text style={styles.statLabel}>Total Volume</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>28</Text>
                <Text style={styles.statLabel}>Personal Records</Text>
              </View>
            </View>

            {/* Volume Trend */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Weekly Volume Trend</Text>
              <VolumeChart />
            </View>

            {/* Strength Progression */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Strength Progression</Text>
              <StrengthChart />
            </View>

            {/* Body Measurements */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Body Measurements</Text>
                <TouchableOpacity>
                  <Text style={styles.addButton}>Add Entry</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.measurements}>
                <View style={styles.measurement}>
                  <Text style={styles.measurementLabel}>Weight</Text>
                  <Text style={styles.measurementValue}>{profile?.bodyweight || 0} lbs</Text>
                </View>
                <View style={styles.measurement}>
                  <Text style={styles.measurementLabel}>Body Fat</Text>
                  <Text style={styles.measurementValue}>14.2%</Text>
                </View>
                <View style={styles.measurement}>
                  <Text style={styles.measurementLabel}>Waist</Text>
                  <Text style={styles.measurementValue}>32 in</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeView === 'history' && <WorkoutHistory />}

        {activeView === 'prs' && (
          <View style={styles.prsContent}>
            {personalRecords.map((pr, idx) => (
              <View key={idx} style={styles.prCard}>
                <View style={styles.prContent}>
                  <View style={styles.prIconContainer}>
                    <Ionicons name="trophy" size={20} color={colors.amber[600]} />
                  </View>
                  <View style={styles.prInfo}>
                    <Text style={styles.prExercise}>{pr.exercise}</Text>
                    <Text style={styles.prStats}>
                      {pr.weight} lbs × {pr.reps} reps
                    </Text>
                  </View>
                </View>
                <Text style={styles.prDate}>{pr.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[4],
  },

  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  tab: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: colors.blue[600],
  },

  tabText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },

  tabTextActive: {
    color: colors.white,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },

  overviewContent: {
    gap: spacing[6],
    paddingBottom: spacing[6],
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },

  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
  },

  statValue: {
    fontSize: typography.sizes['2xl'],
    color: colors.gray[900],
    marginBottom: spacing[1],
  },

  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  cardTitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    marginBottom: spacing[4],
  },

  addButton: {
    fontSize: typography.sizes.sm,
    color: colors.blue[600],
  },

  measurements: {
    gap: spacing[3],
  },

  measurement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  measurementLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },

  measurementValue: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },

  prsContent: {
    gap: spacing[4],
    paddingBottom: spacing[6],
  },

  prCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  prContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  prIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.amber[100],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  prInfo: {
    gap: spacing[0.5],
  },

  prExercise: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },

  prStats: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  prDate: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
});
