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
import { StatsRepo } from '@/src/db/client';
import { formatDistanceToNow } from 'date-fns';

type ViewType = 'overview' | 'history' | 'prs';

interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  date: string;
}

export default function ProgressScreen() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const { profile, loadProfile } = useUserStore();
  const { weeklyProgress, loadWeeklyProgress } = useWorkoutStore();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [prCount, setPRCount] = useState(0);

  useEffect(() => {
    loadProfile();
    loadWeeklyProgress();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load PRs
      const prs = await StatsRepo.getPersonalRecords(10);
      const formattedPRs = prs.map((pr: any) => ({
        exercise: pr.exercise,
        weight: pr.weight,
        reps: pr.reps,
        date: pr.date ? formatDistanceToNow(new Date(pr.date), { addSuffix: true }) : 'Recently',
      }));
      setPersonalRecords(formattedPRs);

      // Load counts
      const workoutCount = await StatsRepo.getTotalWorkoutCount();
      setTotalWorkouts(workoutCount);

      const prTotal = await StatsRepo.getPRCount();
      setPRCount(prTotal);
    } catch (error) {
      console.error('[Progress] Error loading stats:', error);
    }
  };

  const getTotalVolume = () => {
    if (!weeklyProgress) return 0;
    const wp = weeklyProgress as any;
    return (wp.push_completed_volume || 0) + (wp.pull_completed_volume || 0) + (wp.legs_completed_volume || 0);
  };

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
                <Text style={styles.statValue}>{totalWorkouts}</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(getTotalVolume() / 1000)}k</Text>
                <Text style={styles.statLabel}>Total Volume</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{prCount}</Text>
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
              </View>
              <View style={styles.measurements}>
                <View style={styles.measurement}>
                  <Text style={styles.measurementLabel}>Weight</Text>
                  <Text style={styles.measurementValue}>{profile?.bodyweight || '—'} lbs</Text>
                </View>
                <View style={styles.measurement}>
                  <Text style={styles.measurementLabel}>Experience</Text>
                  <Text style={styles.measurementValue}>{profile?.experienceLevel || '—'}</Text>
                </View>
                <View style={styles.measurement}>
                  <Text style={styles.measurementLabel}>Days/Week</Text>
                  <Text style={styles.measurementValue}>{profile?.trainingDaysPerWeek || '—'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeView === 'history' && <WorkoutHistory />}

        {activeView === 'prs' && (
          <View style={styles.prsContent}>
            {personalRecords.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.emptyStateTitle}>No Personal Records Yet</Text>
                <Text style={styles.emptyStateSubtitle}>Complete workouts to track your PRs</Text>
              </View>
            ) : (
              personalRecords.map((pr, idx) => (
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
              ))
            )}
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

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    gap: spacing[3],
  },

  emptyStateTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
  },

  emptyStateSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
});
