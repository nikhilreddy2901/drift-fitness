import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseBlock } from '../workout/ExerciseBlock';
import { RestTimer } from '../workout/RestTimer';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface Set {
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
  isWarmup?: boolean;
}

interface Exercise {
  id: string;
  name: string;
  slot: string;
  sets: Set[];
  notes?: string;
  swapOptions?: string[];
}

interface ActiveWorkoutProps {
  muscleGroup: string;
  targetVolume: number;
  exercises: Exercise[];
  onFinish: (data: { volume: number; duration: number; exercises: number }) => void;
  onCancel: () => void;
}

export function ActiveWorkout({
  muscleGroup,
  targetVolume,
  exercises,
  onFinish,
  onCancel,
}: ActiveWorkoutProps) {
  const [sessionVolume, setSessionVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [isTimerExpanded, setIsTimerExpanded] = useState(true);

  // Timer for workout duration
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest timer countdown
  useEffect(() => {
    if (!showRestTimer) return;

    const interval = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          setShowRestTimer(false);
          return restDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showRestTimer, restDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (volume: number) => {
    setSessionVolume((prev) => prev + volume);
  };

  const handleRestStart = (duration: number) => {
    setRestDuration(duration);
    setRestRemaining(duration);
    setShowRestTimer(true);
    setIsTimerExpanded(true); // Always pop up expanded first
  };

  const handleFinish = () => {
    onFinish({
      volume: sessionVolume,
      duration,
      exercises: exercises.length,
    });
  };

  const progress = targetVolume > 0 ? (sessionVolume / targetVolume) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{muscleGroup} Session</Text>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
                <Text style={styles.headerStatText}>{formatTime(duration)}</Text>
              </View>
              <View style={styles.headerStat}>
                <Ionicons name="trending-up" size={16} color={colors.gray[600]} />
                <Text style={styles.headerStatText}>{sessionVolume.toLocaleString()} lbs</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Volume Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Volume Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar progress={progress} height={8} />
        </View>
      </View>

      {/* Exercises */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            onVolumeChange={handleVolumeChange}
            onRestStart={handleRestStart}
          />
        ))}
      </ScrollView>

      {/* Finish Button */}
      <View style={styles.footer}>
        <Button
          onPress={handleFinish}
          variant="success"
          style={styles.finishButton}
        >
          Finish Workout
        </Button>
      </View>

      {/* Enhanced Rest Timer */}
      <Modal
        visible={showRestTimer && isTimerExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimerExpanded(false)}
      >
        <RestTimer
          isActive={showRestTimer}
          duration={restDuration}
          remaining={restRemaining}
          onSkip={() => setShowRestTimer(false)}
          onAdjust={(delta) => setRestRemaining(prev => Math.max(0, prev + delta))}
          onExpand={() => setIsTimerExpanded(true)}
          onMinimize={() => setIsTimerExpanded(false)}
          isExpanded={true}
        />
      </Modal>

      {/* Floating Timer (when not expanded) */}
      {!isTimerExpanded && showRestTimer && (
        <RestTimer
          isActive={showRestTimer}
          duration={restDuration}
          remaining={restRemaining}
          onSkip={() => setShowRestTimer(false)}
          onAdjust={(delta) => setRestRemaining(prev => Math.max(0, prev + delta))}
          onExpand={() => setIsTimerExpanded(true)}
          isExpanded={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingBottom: spacing[4],
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },

  headerStats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[1],
  },

  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  headerStatText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },

  progressSection: {
    paddingHorizontal: spacing[6],
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  progressLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  progressPercentage: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: spacing[6],
    gap: spacing[4],
    paddingBottom: spacing[20],
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: spacing[6],
  },

  finishButton: {
    width: '100%',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },

  restTimerModal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '100%',
    maxWidth: 320,
  },

  closeRestTimer: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    zIndex: 1,
  },

  restTimerContent: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },

  restTimerLabel: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },

  restTimerTime: {
    fontSize: typography.sizes['5xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },

  restTimerTotal: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    marginTop: spacing[1],
  },

  skipRestButton: {
    width: '100%',
  },
});
