/**
 * DRIFT FITNESS - HOME SCREEN (Dashboard)
 * The Weekly Buckets view - Redesigned UI
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router as Router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO, differenceInDays, endOfWeek } from "date-fns";
import { CheckInModal } from "@/src/components/CheckInModal";
import { AIInsightCard } from "@/src/components/home/AIInsightCard";
import { VolumeBucketCard } from "@/src/components/home/VolumeBucketCard";
import { QuickStatsCard } from "@/src/components/home/QuickStatsCard";
import { useWorkoutStore } from "@/src/stores/useWorkoutStore";
import { useUserStore } from "@/src/stores/useUserStore";
import { useCheckInStore } from "@/src/stores/useCheckInStore";
import { WorkoutsRepo } from "@/src/db/client";
import { colors, spacing, typography, borderRadius } from "@/src/constants/theme";
import type { MuscleGroup, CheckInData } from "@/src/types";
import { checkAndAdvanceWeek, getDaysLeftInWeek } from "@/src/utils/weekManager";
import { deserializeSchedule } from "@/src/utils/scheduleGenerator";
import { generateInsights, type Insight } from "@/src/utils/insightsGenerator";

export default function HomeScreen() {

  // Stores
  const { weeklyProgress, loadWeeklyProgress, startWorkout, isLoading } =
    useWorkoutStore();
  const { profile, loadProfile, loadExercises, loadWorkingWeights, isLoading: isLoadingProfile } =
    useUserStore();
  const { getCheckInData, setCheckIn, resetCheckIn } = useCheckInStore();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  // ============================================================================
  // INITIALIZE DATA
  // ============================================================================

  // Load workouts for current week
  const loadWeekWorkouts = async () => {
    if (!weeklyProgress) return;

    try {
      const weekStart = (weeklyProgress as any).week_start_date;
      const weekStartDate = parseISO(weekStart);
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

      const workouts = await WorkoutsRepo.getByDateRange(
        format(weekStartDate, 'yyyy-MM-dd'),
        format(weekEndDate, 'yyyy-MM-dd')
      );

      setWeekWorkouts(workouts as any[]);
      console.log(`[HomeScreen] Loaded ${workouts.length} workouts for current week`);
    } catch (error) {
      console.error('[HomeScreen] Failed to load week workouts:', error);
    }
  };

  useEffect(() => {
    async function init() {
      console.log("[HomeScreen] Initializing...");

      // Check if we need to advance to a new week (happens every Monday)
      const weekAdvanced = await checkAndAdvanceWeek();
      if (weekAdvanced) {
        console.log("[HomeScreen] Week was advanced, reloading data...");
      }

      await Promise.all([
        loadProfile(),
        loadExercises(),
        loadWorkingWeights(),
        loadWeeklyProgress(),
      ]);
      console.log("[HomeScreen] Initialization complete");
    }

    init();
  }, []);

  // Load workouts and insights when weekly progress is available
  useEffect(() => {
    if (weeklyProgress && profile) {
      loadWeekWorkouts();
      loadInsights();
    }
  }, [weeklyProgress, profile]);

  // Load insights
  const loadInsights = async () => {
    if (!weeklyProgress || !profile) return;

    try {
      const generatedInsights = await generateInsights(weeklyProgress, profile);
      setInsights(generatedInsights);
      console.log(`[HomeScreen] Generated ${generatedInsights.length} insights`);
    } catch (error) {
      console.error('[HomeScreen] Failed to generate insights:', error);
    }
  };

  // ============================================================================
  // REFRESH
  // ============================================================================

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadWeeklyProgress();
    await loadWeekWorkouts();
    await loadInsights();
    setRefreshing(false);
  }, [weeklyProgress, profile]);

  // ============================================================================
  // CHECK-IN MODAL
  // ============================================================================

  const handleOpenCheckIn = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroup(muscleGroup);
    setCheckInModalVisible(true);
  };

  const handleCheckInChange = (data: Partial<CheckInData>) => {
    setCheckIn(data);
  };

  const handleCheckInConfirm = async () => {
    if (!selectedMuscleGroup) return;

    try {
      console.log(`[HomeScreen] Starting ${selectedMuscleGroup} workout...`);

      // Get check-in data
      const checkIn = getCheckInData();

      console.log("[HomeScreen] Starting workout...");

      // Start workout first
      await startWorkout(selectedMuscleGroup, checkIn);

      console.log("[HomeScreen] Workout started, navigating...");

      // Close modal
      setCheckInModalVisible(false);

      // Reset check-in for next time
      resetCheckIn();

      // Navigate to workout tab
      console.log('[HomeScreen] About to navigate to workout tab');
      Router.push("/(tabs)/workout");
      console.log('[HomeScreen] Navigation call completed');
    } catch (error) {
      console.error("[HomeScreen] Failed to start workout:", error);
      // TODO: Show error toast
    } finally {
      setSelectedMuscleGroup(null);
    }
  };

  const handleCheckInCancel = () => {
    setCheckInModalVisible(false);
    setSelectedMuscleGroup(null);
    resetCheckIn();
  };

  // ============================================================================
  // LOADING & REDIRECT
  // ============================================================================

  // Redirect to onboarding if no profile exists (only after loading is complete)
  if (!isLoadingProfile && !profile) {
    return <Redirect href="/onboarding" />;
  }

  // Show loading while data loads
  if (isLoading || isLoadingProfile || !profile || !weeklyProgress) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.blue[600]} />
        <Text style={styles.loadingText}>Loading your week...</Text>
      </View>
    );
  }

  // ============================================================================
  // EXTRACT BUCKET DATA
  // ============================================================================

  const pushBucket = {
    targetVolume: (weeklyProgress as any).push_target_volume || 0,
    completedVolume: (weeklyProgress as any).push_completed_volume || 0,
    completionPercentage: (weeklyProgress as any).push_completion_percentage || 0,
  };

  const pullBucket = {
    targetVolume: (weeklyProgress as any).pull_target_volume || 0,
    completedVolume: (weeklyProgress as any).pull_completed_volume || 0,
    completionPercentage: (weeklyProgress as any).pull_completion_percentage || 0,
  };

  const legsBucket = {
    targetVolume: (weeklyProgress as any).legs_target_volume || 0,
    completedVolume: (weeklyProgress as any).legs_completed_volume || 0,
    completionPercentage: (weeklyProgress as any).legs_completion_percentage || 0,
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDaysRemaining = () => {
    if (!profile) return 7;
    return getDaysLeftInWeek((profile as any).week_start_date || (weeklyProgress as any)?.week_start_date);
  };

  const getTotalProgress = () => {
    const totalTarget = pushBucket.targetVolume + pullBucket.targetVolume + legsBucket.targetVolume;
    const totalCompleted = pushBucket.completedVolume + pullBucket.completedVolume + legsBucket.completedVolume;
    return totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  };

  const getSessionsForMuscleGroup = (muscleGroup: string) => {
    // Get completed sessions for this muscle group
    const completedSessions = weekWorkouts
      .filter((w: any) => w.muscle_group === muscleGroup && w.status === 'completed')
      .map((w: any) => ({
        completed: true,
        volume: w.actual_volume || 0,
        date: format(parseISO(w.date), 'EEE'), // Mon, Tue, etc
      }));

    // Get planned session count from the stored schedule
    let plannedSessionCount = 0;
    if (weeklyProgress && (weeklyProgress as any).planned_schedule) {
      try {
        const schedule = deserializeSchedule((weeklyProgress as any).planned_schedule);
        plannedSessionCount = schedule[muscleGroup as MuscleGroup]?.length || 0;
      } catch (error) {
        console.error('[HomeScreen] Failed to parse planned schedule:', error);
        // Fallback to simple calculation
        plannedSessionCount = muscleGroup === 'legs'
          ? Math.max(1, Math.floor(profile.trainingDaysPerWeek / 3))
          : Math.ceil(profile.trainingDaysPerWeek / 2.5);
      }
    } else {
      // Fallback if no schedule stored
      plannedSessionCount = muscleGroup === 'legs'
        ? Math.max(1, Math.floor(profile.trainingDaysPerWeek / 3))
        : Math.ceil(profile.trainingDaysPerWeek / 2.5);
    }

    // Fill remaining slots with pending sessions
    const pendingSessions = Array.from({
      length: Math.max(0, plannedSessionCount - completedSessions.length)
    }).map(() => ({
      completed: false,
      volume: 0,
      date: '', // No date for pending sessions
    }));

    return [...completedSessions, ...pendingSessions];
  };

  const getNextSession = () => {
    // Count COMPLETED sessions per muscle group (not total planned)
    const pushSessions = weekWorkouts.filter((w: any) =>
      w.muscle_group === 'push' && w.status === 'completed'
    ).length;
    const pullSessions = weekWorkouts.filter((w: any) =>
      w.muscle_group === 'pull' && w.status === 'completed'
    ).length;
    const legsSessions = weekWorkouts.filter((w: any) =>
      w.muscle_group === 'legs' && w.status === 'completed'
    ).length;

    // Determine which muscle group needs work (lowest completion)
    const pushCompletion = pushBucket.targetVolume > 0
      ? pushBucket.completedVolume / pushBucket.targetVolume
      : 0;
    const pullCompletion = pullBucket.targetVolume > 0
      ? pullBucket.completedVolume / pullBucket.targetVolume
      : 0;
    const legsCompletion = legsBucket.targetVolume > 0
      ? legsBucket.completedVolume / legsBucket.targetVolume
      : 0;

    // Find the muscle group with lowest completion
    if (pushCompletion <= pullCompletion && pushCompletion <= legsCompletion) {
      return {
        muscleGroup: 'push' as MuscleGroup,
        displayName: 'Push Day',
        targetVolume: pushBucket.targetVolume,
        sessionsCompleted: pushSessions,
      };
    } else if (pullCompletion <= legsCompletion) {
      return {
        muscleGroup: 'pull' as MuscleGroup,
        displayName: 'Pull Day',
        targetVolume: pullBucket.targetVolume,
        sessionsCompleted: pullSessions,
      };
    } else {
      return {
        muscleGroup: 'legs' as MuscleGroup,
        displayName: 'Leg Day',
        targetVolume: legsBucket.targetVolume,
        sessionsCompleted: legsSessions,
      };
    }
  };

  const nextSession = getNextSession();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue[600]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{(profile as any).name || 'Athlete'}</Text>
            </View>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color={colors.orange[600]} />
              <Text style={styles.streakText}>Week {profile.currentWeek}</Text>
            </View>
          </View>

          {/* Week Overview */}
          <View style={styles.weekOverview}>
            <View style={styles.weekOverviewContent}>
              <View style={styles.weekIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={colors.blue[600]} />
              </View>
              <View style={styles.weekInfo}>
                <Text style={styles.weekLabel}>Week {profile.currentWeek}</Text>
                <Text style={styles.weekProgress}>{getTotalProgress()}% Complete</Text>
              </View>
            </View>
            <View>
              <Text style={styles.daysRemaining}>{getDaysRemaining()} days left</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={colors.purple[600]} />
              <Text style={styles.sectionTitle}>Insights</Text>
            </View>
            <View style={styles.insightsContainer}>
              {insights.map((insight, index) => (
                <AIInsightCard key={index} insight={insight} />
              ))}
            </View>
          </View>
        )}

        {/* Next Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Session</Text>
          <TouchableOpacity
            style={styles.nextSessionCard}
            onPress={() => handleOpenCheckIn(nextSession.muscleGroup)}
            activeOpacity={0.7}
          >
            <View style={styles.nextSessionHeader}>
              <View style={styles.nextSessionTitleRow}>
                <Ionicons name="barbell" size={20} color={colors.white} />
                <Text style={styles.nextSessionTitle}>{nextSession.displayName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </View>
            <View style={styles.nextSessionStats}>
              <View style={styles.nextSessionStat}>
                <Text style={styles.nextSessionStatLabel}>Target Volume</Text>
                <Text style={styles.nextSessionStatValue}>
                  {nextSession.targetVolume.toLocaleString()} lbs
                </Text>
              </View>
              <View style={styles.nextSessionStat}>
                <Text style={styles.nextSessionStatLabel}>Sessions Done</Text>
                <Text style={styles.nextSessionStatValue}>
                  {nextSession.sessionsCompleted} this week
                </Text>
              </View>
              <View style={styles.nextSessionStat}>
                <Text style={styles.nextSessionStatLabel}>Est. Time</Text>
                <Text style={styles.nextSessionStatValue}>45-60 min</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Volume Buckets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Volume</Text>
          <View style={styles.bucketsContainer}>
            <VolumeBucketCard
              bucket={{
                name: 'Push',
                target: pushBucket.targetVolume,
                current: pushBucket.completedVolume,
                sessions: getSessionsForMuscleGroup('push'),
              }}
            />
            <VolumeBucketCard
              bucket={{
                name: 'Pull',
                target: pullBucket.targetVolume,
                current: pullBucket.completedVolume,
                sessions: getSessionsForMuscleGroup('pull'),
              }}
            />
            <VolumeBucketCard
              bucket={{
                name: 'Legs',
                target: legsBucket.targetVolume,
                current: legsBucket.completedVolume,
                sessions: getSessionsForMuscleGroup('legs'),
              }}
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <QuickStatsCard
            totalVolume={pushBucket.completedVolume + pullBucket.completedVolume + legsBucket.completedVolume}
            sessionsCompleted={weekWorkouts.filter((w: any) => w.status === 'completed').length}
            weekNumber={profile.currentWeek}
          />
        </View>
      </ScrollView>

      {/* Check-In Modal */}
      <CheckInModal
        visible={checkInModalVisible}
        checkInData={getCheckInData()}
        onCheckInChange={handleCheckInChange}
        onConfirm={handleCheckInConfirm}
        onCancel={handleCheckInCancel}
        muscleGroup={selectedMuscleGroup || undefined}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  centerContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.sizes.base,
    color: colors.gray[600],
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingBottom: spacing[6],
  },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  greeting: {
    fontSize: typography.sizes['2xl'],
    color: colors.gray[900],
  },

  userName: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    marginTop: spacing[0.5],
  },

  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  streakText: {
    fontSize: typography.sizes.sm,
    color: colors.orange[600],
  },

  weekOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },

  weekOverviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  weekIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.blue[100],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekInfo: {
    gap: spacing[0.5],
  },

  weekLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  weekProgress: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },

  daysRemaining: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  section: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },

  sectionTitle: {
    fontSize: typography.sizes.lg,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
    marginBottom: spacing[3],
  },

  insightsContainer: {
    gap: spacing[3],
  },

  nextSessionCard: {
    backgroundColor: colors.blue[600],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },

  nextSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  nextSessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  nextSessionTitle: {
    fontSize: typography.sizes.lg,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },

  nextSessionStats: {
    flexDirection: 'row',
    gap: spacing[4],
  },

  nextSessionStat: {
    flex: 1,
  },

  nextSessionStatLabel: {
    fontSize: typography.sizes.sm,
    color: colors.blue[200],
    marginBottom: spacing[0.5],
  },

  nextSessionStatValue: {
    fontSize: typography.sizes.base,
    color: colors.white,
  },

  bucketsContainer: {
    gap: spacing[3],
  },
});
