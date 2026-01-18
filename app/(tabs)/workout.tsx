import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CheckInModal } from '@/src/components/CheckInModal';
import { ActiveWorkout } from '@/src/components/screens/ActiveWorkout';
import { useWorkoutStore } from '@/src/stores/useWorkoutStore';
import { useCheckInStore } from '@/src/stores/useCheckInStore';
import { useUserStore } from '@/src/stores/useUserStore';
import { colors, spacing, typography, borderRadius } from '@/src/constants/theme';
import type { MuscleGroup, CheckInData, Exercise } from '@/src/types';
import { getValidSwaps } from '@/src/utils/swapLogic';

export default function WorkoutTab() {
  const router = useRouter();
  const { weeklyProgress, loadWeeklyProgress, activeWorkout, startWorkout, finishWorkout, cancelWorkout, logSet } = useWorkoutStore();
  const { getCheckInData, setCheckIn, resetCheckIn } = useCheckInStore();
  const { exercises: allExercises } = useUserStore();

  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);

  useEffect(() => {
    loadWeeklyProgress();
  }, []);

  // If there's an active workout, show the workout screen instead
  if (activeWorkout) {

    // Transform exercises for ActiveWorkout component
    const transformedExercises = activeWorkout.exercises.map((ex, idx) => {
      const prescribedCount = ex.prescribedSets;
      const sets = Array.from({ length: prescribedCount }, (_, i) => {
        const loggedSet = ex.loggedSets[i];
        return {
          weight: loggedSet?.weight || ex.prescribedWeight,
          reps: loggedSet?.reps || ex.prescribedReps,
          rpe: loggedSet?.rpe || 0,
          completed: !!loggedSet && !loggedSet.isWarmup,
          isWarmup: loggedSet?.isWarmup || false,
        };
      });

      let slotLabel = 'Moderate Compound';
      if (idx === 0) slotLabel = 'Heavy Compound';
      if (idx >= activeWorkout.exercises.length - 1) slotLabel = 'Isolation';

      // Get swap options for this exercise
      let swapOptions: string[] = [];
      if (allExercises && allExercises.length > 0) {
        // Find the original exercise in the full exercise list
        const originalEx = (allExercises as any[]).find(e => e.id === ex.exerciseId);
        if (originalEx) {
          const validSwaps = getValidSwaps(originalEx as Exercise, allExercises as Exercise[]);
          swapOptions = validSwaps.slice(0, 3).map(swap => swap.name); // Top 3 alternatives
        }
      }

      return {
        id: ex.id,
        name: ex.exerciseName,
        slot: slotLabel,
        sets,
        notes: undefined,
        swapOptions,
      };
    });

    const handleFinish = (data: { volume: number; duration: number; exercises: number }) => {
      Alert.prompt(
        "Rate Your Session",
        "How hard was this workout? (RPE 1-10)",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Finish",
            onPress: async (rpeInput?: string) => {
              const rpe = parseInt(rpeInput || "7", 10);
              const validRpe = Math.max(1, Math.min(10, rpe));
              await finishWorkout(validRpe);
            },
          },
        ],
        "plain-text",
        "7"
      );
    };

    const handleCancel = () => {
      Alert.alert(
        "Cancel Workout?",
        "Your progress will not be saved.",
        [
          { text: "Continue Workout", style: "cancel" },
          {
            text: "Cancel Workout",
            style: "destructive",
            onPress: () => cancelWorkout(),
          },
        ]
      );
    };

    return (
      <ActiveWorkout
        muscleGroup={activeWorkout.muscleGroup.toUpperCase()}
        targetVolume={activeWorkout.targetVolume}
        exercises={transformedExercises as any}
        onFinish={handleFinish}
        onCancel={handleCancel}
      />
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getRecommendedWorkout = (): MuscleGroup => {
    if (!weeklyProgress) return 'push';

    const progress = weeklyProgress as any;
    const buckets = [
      { type: 'push' as MuscleGroup, completion: progress.push_completion_percentage || 0 },
      { type: 'pull' as MuscleGroup, completion: progress.pull_completion_percentage || 0 },
      { type: 'legs' as MuscleGroup, completion: progress.legs_completion_percentage || 0 },
    ];

    // Return muscle group with lowest completion
    return buckets.sort((a, b) => a.completion - b.completion)[0].type;
  };

  const getMuscleGroupIcon = (muscleGroup: MuscleGroup) => {
    switch (muscleGroup) {
      case 'push': return 'arrow-up-circle';
      case 'pull': return 'arrow-down-circle';
      case 'legs': return 'fitness';
      default: return 'barbell';
    }
  };

  const getMuscleGroupColor = (muscleGroup: MuscleGroup) => {
    switch (muscleGroup) {
      case 'push': return colors.blue[600];
      case 'pull': return colors.purple[600];
      case 'legs': return colors.orange[600];
      default: return colors.gray[600];
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartWorkout = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroup(muscleGroup);
    setCheckInModalVisible(true);
  };

  const handleCheckInChange = (data: Partial<CheckInData>) => {
    setCheckIn(data);
  };

  const handleCheckInConfirm = async () => {
    if (!selectedMuscleGroup) return;

    try {
      const checkIn = getCheckInData();
      await startWorkout(selectedMuscleGroup, checkIn);
      setCheckInModalVisible(false);
      resetCheckIn();
      router.push('/workout' as any);
    } catch (error) {
      console.error('[WorkoutTab] Failed to start workout:', error);
    } finally {
      setSelectedMuscleGroup(null);
    }
  };

  const handleCheckInCancel = () => {
    setCheckInModalVisible(false);
    setSelectedMuscleGroup(null);
    resetCheckIn();
  };

  const handleResumeWorkout = () => {
    console.log('[WorkoutTab] Attempting to navigate to /workout');
    console.log('[WorkoutTab] Active workout exists:', !!activeWorkout);
    router.push('/workout' as any);
  };

  const recommendedWorkout = getRecommendedWorkout();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
        <Text style={styles.headerSubtitle}>Ready to train?</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recommended Workout */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color={colors.purple[600]} />
            <Text style={styles.sectionTitle}>Recommended Today</Text>
          </View>
          <Pressable
            style={styles.recommendedCard}
            onPress={() => handleStartWorkout(recommendedWorkout)}
          >
            <View style={styles.recommendedContent}>
              <View style={[styles.recommendedIcon, { backgroundColor: `${getMuscleGroupColor(recommendedWorkout)}15` }]}>
                <Ionicons
                  name={getMuscleGroupIcon(recommendedWorkout)}
                  size={32}
                  color={getMuscleGroupColor(recommendedWorkout)}
                />
              </View>
              <View style={styles.recommendedInfo}>
                <Text style={styles.recommendedTitle}>
                  {recommendedWorkout.charAt(0).toUpperCase() + recommendedWorkout.slice(1)} Day
                </Text>
                <Text style={styles.recommendedSubtitle}>
                  Lowest volume this week - optimal for training
                </Text>
              </View>
            </View>
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>Start</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </View>
          </Pressable>
        </View>

        {/* Quick Start */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={18} color={colors.blue[600]} />
            <Text style={styles.sectionTitle}>Quick Start</Text>
          </View>
          <View style={styles.quickStartGrid}>
            {(['push', 'pull', 'legs'] as MuscleGroup[]).map((muscleGroup) => (
              <TouchableOpacity
                key={muscleGroup}
                style={styles.quickStartCard}
                onPress={() => handleStartWorkout(muscleGroup)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickStartIcon, { backgroundColor: `${getMuscleGroupColor(muscleGroup)}15` }]}>
                  <Ionicons
                    name={getMuscleGroupIcon(muscleGroup)}
                    size={28}
                    color={getMuscleGroupColor(muscleGroup)}
                  />
                </View>
                <Text style={styles.quickStartTitle}>
                  {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
                </Text>
                {weeklyProgress && (
                  <Text style={styles.quickStartProgress}>
                    {Math.round((weeklyProgress as any)[`${muscleGroup}_completion_percentage`] || 0)}% complete
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={colors.gray[600]} />
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
          </View>
          <View style={styles.recentSessions}>
            <Text style={styles.emptyText}>No recent sessions yet. Start your first workout!</Text>
          </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },

  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing[0.5],
  },

  content: {
    flex: 1,
  },

  // Resume Banner
  resumeBanner: {
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[200],
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  resumeIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  resumeText: {
    flex: 1,
  },

  resumeTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.blue[900],
    marginBottom: spacing[0.5],
  },

  resumeSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.blue[700],
  },

  // Section
  section: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },

  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },

  // Recommended Card
  recommendedCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recommendedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  recommendedIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  recommendedInfo: {
    flex: 1,
  },

  recommendedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing[0.5],
  },

  recommendedSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: typography.lineHeights.sm,
  },

  startButton: {
    backgroundColor: colors.blue[600],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
  },

  startButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Quick Start Grid
  quickStartGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  quickStartCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },

  quickStartIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },

  quickStartTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing[1],
  },

  quickStartProgress: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
  },

  // Recent Sessions
  recentSessions: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },

  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
