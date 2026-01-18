/**
 * DRIFT FITNESS - ENHANCED ONBOARDING SCREEN
 * Multi-step wizard for first-time user setup
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "@/src/constants/theme";
import type { ExperienceLevel } from "@/src/types";
import { signInWithApple, signInWithGoogle, signInWithEmail } from "@/src/services/auth";
import { UserProfileRepo, WorkingWeightsRepo, WeeklyProgressRepo } from "@/src/db/client";
import { generateWeeklySchedule, serializeSchedule } from "@/src/utils/scheduleGenerator";

const { width } = Dimensions.get('window');

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPERIENCE_LEVELS: {
  level: ExperienceLevel;
  label: string;
  description: string;
  volumeMultiplier: number; // Multiplier for bodyweight-based volume calculation
  startingWeights: { bench: number; squat: number; deadlift: number };
}[] = [
  {
    level: "beginner",
    label: "Beginner",
    description: "New to lifting or returning after a long break",
    volumeMultiplier: 100, // 100 lbs per lb of bodyweight per week
    startingWeights: { bench: 45, squat: 45, deadlift: 95 },
  },
  {
    level: "intermediate",
    label: "Intermediate",
    description: "6+ months of consistent training",
    volumeMultiplier: 175, // 175 lbs per lb of bodyweight per week
    startingWeights: { bench: 135, squat: 185, deadlift: 225 },
  },
  {
    level: "advanced",
    label: "Advanced",
    description: "2+ years of consistent training",
    volumeMultiplier: 300, // 300 lbs per lb of bodyweight per week
    startingWeights: { bench: 225, squat: 315, deadlift: 405 },
  },
];

const GOALS = [
  { id: 'strength', label: 'Strength', icon: 'barbell', description: 'Maximize your lifting numbers', volumeMultiplier: 0.8 },
  { id: 'hypertrophy', label: 'Muscle Growth', icon: 'fitness', description: 'Build lean muscle mass', volumeMultiplier: 1.0 },
  { id: 'endurance', label: 'Endurance', icon: 'bicycle', description: 'Improve stamina and conditioning', volumeMultiplier: 0.7 },
  { id: 'general', label: 'General Fitness', icon: 'heart', description: 'Stay healthy and active', volumeMultiplier: 0.9 },
];

/**
 * Calculate weekly volume target based on bodyweight, experience, and goal
 * Rounds to nearest 1000 for clean numbers throughout the app
 */
function calculateWeeklyVolume(
  bodyweight: number,
  experienceLevel: ExperienceLevel,
  goal: string
): number {
  const experienceData = EXPERIENCE_LEVELS.find((e) => e.level === experienceLevel);
  const goalData = GOALS.find((g) => g.id === goal);

  if (!experienceData || !goalData) {
    // Fallback to beginner hypertrophy
    return Math.round((bodyweight * 100) / 1000) * 1000; // Round to nearest 1000
  }

  // Calculate base volume
  const baseVolume = bodyweight * experienceData.volumeMultiplier * goalData.volumeMultiplier;

  // Round to nearest 1000 for clean numbers (14,500 → 15,000)
  const roundedVolume = Math.round(baseVolume / 1000) * 1000;

  return roundedVolume;
}

type OnboardingStep = 'welcome' | 'personal' | 'experience' | 'goals' | 'schedule' | 'preview' | 'auth' | 'loading' | 'success';

// ============================================================================
// COMPONENT
// ============================================================================

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  // Check if user already has a profile - if so, redirect to home
  useEffect(() => {
    async function checkExistingProfile() {
      const profile = await UserProfileRepo.get();
      if (profile) {
        console.log("[Onboarding] Profile exists, redirecting to home");
        router.replace("/(tabs)");
      }
    }
    checkExistingProfile();
  }, []);

  // Form state
  const [name, setName] = useState("");
  const [bodyweight, setBodyweight] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('hypertrophy');
  const [trainingDays, setTrainingDays] = useState<number>(4);

  // Auth state
  const [email, setEmail] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const goToNextStep = () => {
    // Scroll to top before changing step
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    if (currentStep === 'welcome') setCurrentStep('personal');
    else if (currentStep === 'personal') setCurrentStep('experience');
    else if (currentStep === 'experience') setCurrentStep('goals');
    else if (currentStep === 'goals') setCurrentStep('schedule');
    else if (currentStep === 'schedule') setCurrentStep('preview');
    else if (currentStep === 'preview') setCurrentStep('auth');
    else if (currentStep === 'auth') handleSkipAuth();
  };

  const goToPrevStep = () => {
    // Scroll to top before changing step
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    if (currentStep === 'personal') setCurrentStep('welcome');
    else if (currentStep === 'experience') setCurrentStep('personal');
    else if (currentStep === 'goals') setCurrentStep('experience');
    else if (currentStep === 'schedule') setCurrentStep('goals');
    else if (currentStep === 'preview') setCurrentStep('schedule');
    else if (currentStep === 'auth') {
      // Check if user came directly from welcome or from preview
      // If they've filled out personal info, go back to preview, otherwise go to welcome
      if (name.trim() && bodyweight) {
        setCurrentStep('preview');
      } else {
        setCurrentStep('welcome');
      }
    }
  };

  const canProceed = () => {
    if (currentStep === 'welcome') return true;
    if (currentStep === 'personal') return name.trim() && bodyweight && parseFloat(bodyweight) > 0;
    if (currentStep === 'experience') return selectedLevel !== null;
    if (currentStep === 'goals') return true;
    if (currentStep === 'schedule') return true;
    if (currentStep === 'preview') return true;
    if (currentStep === 'auth') return true; // Will be gated by auth buttons
    return false;
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async () => {
    if (!selectedLevel || !bodyweight) return;

    setCurrentStep('loading');

    try {
      // If profile already exists, redirect to home - user shouldn't be here!
      const existingProfile = await UserProfileRepo.get();
      if (existingProfile) {
        console.log("[Onboarding] Profile already exists, redirecting to home");
        router.replace("/(tabs)");
        return;
      }

      const experienceData = EXPERIENCE_LEVELS.find((e) => e.level === selectedLevel)!;
      const bodyweightNum = parseFloat(bodyweight);

      console.log("[Onboarding] Creating user profile...");

      // Calculate weekly volume based on bodyweight, experience, and goal
      const totalWeeklyTarget = calculateWeeklyVolume(bodyweightNum, selectedLevel, selectedGoal);

      // Divide by 3 and round each to nearest 100 for clean numbers
      const perGroupTarget = Math.round((totalWeeklyTarget / 3) / 100) * 100;
      const weekStartDate = getMonday(new Date()).toISOString().split("T")[0];

      console.log(`[Onboarding] Calculated weekly volume: ~${totalWeeklyTarget} lbs (${bodyweightNum} lbs × ${experienceData.volumeMultiplier} × goal multiplier)`);
      console.log(`[Onboarding] Per group target: ${perGroupTarget} lbs (rounded to nearest 100)`);

      // Save to SQLite (local database)
      await UserProfileRepo.create({
        name: name.trim(),
        bodyweight: bodyweightNum,
        experienceLevel: selectedLevel,
        trainingDaysPerWeek: trainingDays,
        currentWeek: 1,
        weekStartDate,
        weeklyTargets: {
          push: perGroupTarget,
          pull: perGroupTarget,
          legs: perGroupTarget,
        },
        startingVolume: {
          push: perGroupTarget,
          pull: perGroupTarget,
          legs: perGroupTarget,
        },
      });

      console.log("[Onboarding] Profile created in SQLite");

      // Set initial working weights
      const { bench, squat, deadlift } = experienceData.startingWeights;

      await Promise.all([
        WorkingWeightsRepo.upsert("barbell_bench", bench),
        WorkingWeightsRepo.upsert("back_squat", squat),
        WorkingWeightsRepo.upsert("barbell_deadlift", deadlift),
        WorkingWeightsRepo.upsert("db_bench", Math.round(bench * 0.75)),
        WorkingWeightsRepo.upsert("incline_barbell_press", Math.round(bench * 0.85)),
        WorkingWeightsRepo.upsert("barbell_row", Math.round(deadlift * 0.7)),
        WorkingWeightsRepo.upsert("leg_press", Math.round(squat * 1.5)),
      ]);

      console.log("[Onboarding] Working weights set");

      // Create first week's progress (pass goal for smart scheduling)
      await createFirstWeekSQLite(
        { push: perGroupTarget, pull: perGroupTarget, legs: perGroupTarget },
        weekStartDate,
        trainingDays,
        selectedGoal
      );

      console.log("[Onboarding] Setup complete");

      setCurrentStep('success');
    } catch (error) {
      console.error("[Onboarding] Failed:", error);
      Alert.alert("Error", "Failed to create profile. Please try again.");
      setCurrentStep('auth');
    }
  };

  // ============================================================================
  // AUTH HANDLERS
  // ============================================================================

  const handleAppleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithApple();
      if (result.success) {
        // User authenticated, now save their data
        await handleSubmit();
      } else {
        Alert.alert("Authentication Failed", result.error || "Please try again");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // User authenticated, now save their data
        await handleSubmit();
      } else {
        Alert.alert("Authentication Failed", result.error || "Please try again");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address");
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await signInWithEmail(email);
      if (result.success) {
        Alert.alert(
          "Check Your Email",
          "We've sent you a magic link. Click it to complete sign in, then return to the app.",
          [{ text: "OK" }]
        );
        // Note: User will need to click the link and return to the app
        // We'll handle the completion in a deep link handler
      } else {
        Alert.alert("Authentication Failed", result.error || "Please try again");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSkipAuth = async () => {
    setIsAuthenticating(true);
    try {
      // Skip authentication - just save locally (no Supabase needed)
      console.log('[Onboarding] User skipped auth, saving data locally only');
      await handleSubmit();
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setIsAuthenticating(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get the Monday of the current week
   */
  function getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  /**
   * Generate a simple UUID-like string
   */
  function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create the first week's progress entry in SQLite
   */
  async function createFirstWeekSQLite(
    weeklyTargets: { push: number; pull: number; legs: number },
    weekStartDate: string,
    trainingDaysPerWeek: number,
    goal: string
  ): Promise<void> {
    // Generate smart weekly schedule based on user's goal
    const smartSchedule = generateWeeklySchedule(weekStartDate, trainingDaysPerWeek, goal);
    console.log(`[Onboarding] Generated smart schedule for ${goal} goal:`, smartSchedule);

    // Calculate sessions per muscle group from the generated schedule
    const sessionsPerGroup = {
      push: smartSchedule.push.length,
      pull: smartSchedule.pull.length,
      legs: smartSchedule.legs.length,
    };

    const weeklyProgress = {
      id: generateId(),
      weekStartDate,
      weekNumber: 1,
      isDeloadWeek: false,
      plannedSchedule: serializeSchedule(smartSchedule), // Save the smart schedule
      buckets: {
        push: {
          targetVolume: weeklyTargets.push,
          completedVolume: 0,
          completionPercentage: 0,
          sessionsPlanned: sessionsPerGroup.push,
          sessionsCompleted: 0,
          driftAmount: 0,
        },
        pull: {
          targetVolume: weeklyTargets.pull,
          completedVolume: 0,
          completionPercentage: 0,
          sessionsPlanned: sessionsPerGroup.pull,
          sessionsCompleted: 0,
          driftAmount: 0,
        },
        legs: {
          targetVolume: weeklyTargets.legs,
          completedVolume: 0,
          completionPercentage: 0,
          sessionsPlanned: sessionsPerGroup.legs,
          sessionsCompleted: 0,
          driftAmount: 0,
        },
      },
    };

    await WeeklyProgressRepo.insert(weeklyProgress);
  }

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeHeader}>
        <View style={styles.logoContainer}>
          {/* The Kinetic Stack Logo */}
          <View style={styles.kineticStack}>
            {/* Top plate - Dark Zinc */}
            <View style={[styles.weightPlate, styles.plateTop]} />
            {/* Middle plate - Dark Zinc */}
            <View style={[styles.weightPlate, styles.plateMiddle]} />
            {/* Bottom plate - Royal Blue, Drifting Forward */}
            <View style={[styles.weightPlate, styles.plateDrifting]} />
          </View>
        </View>
        <Text style={styles.welcomeTitle}>Welcome to Drift</Text>
        <Text style={styles.welcomeSubtitle}>The workout plan that adapts to your life</Text>
      </View>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="albums-outline" size={24} color={colors.blue[600]} />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTextBold}>Weekly Volume Buckets</Text>
            <Text style={styles.featureTextSub}>Track progress by muscle group</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="refresh-circle" size={24} color={colors.purple[600]} />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTextBold}>Auto-Adjusts for Missed Days</Text>
            <Text style={styles.featureTextSub}>Never fall behind on your goals</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="trending-up" size={24} color={colors.green[600]} />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTextBold}>Guaranteed Progression</Text>
            <Text style={styles.featureTextSub}>Consistent strength gains, week by week</Text>
          </View>
        </View>
      </View>

      {/* Account Action Buttons */}
      <View style={styles.welcomeActions}>
        <Pressable
          style={styles.welcomeButtonPrimary}
          onPress={() => setCurrentStep('personal')}
        >
          <Text style={styles.welcomeButtonPrimaryText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </Pressable>

        <Pressable
          style={styles.welcomeButtonSecondary}
          onPress={() => setCurrentStep('auth')}
        >
          <Text style={styles.welcomeButtonSecondaryText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderPersonal = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitleLarge}>Let's get to know you</Text>
      <Text style={styles.stepSubtitle}>This helps us personalize your experience</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.gray[400]}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bodyweight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 180"
          placeholderTextColor={colors.gray[400]}
          keyboardType="number-pad"
          value={bodyweight}
          onChangeText={setBodyweight}
        />
        <Text style={styles.helperText}>
          Used to calibrate relative strength and recommendations
        </Text>
      </View>
    </View>
  );

  const renderExperience = () => {
    // Calculate example volumes based on user's actual bodyweight
    const bodyweightNum = parseFloat(bodyweight) || 150; // Default to 150 if not entered yet

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Experience Level</Text>
        <Text style={styles.stepSubtitle}>This determines your starting weekly volume target</Text>

        <View style={styles.levelCards}>
          {EXPERIENCE_LEVELS.map((exp) => {
            // Calculate what their weekly volume would be (already rounded to nearest 1000 in calculateWeeklyVolume)
            const exampleVolume = calculateWeeklyVolume(bodyweightNum, exp.level, selectedGoal || 'hypertrophy');

            return (
              <Pressable
                key={exp.level}
                style={[
                  styles.levelCard,
                  selectedLevel === exp.level && styles.levelCardSelected,
                ]}
                onPress={() => setSelectedLevel(exp.level)}
              >
                <View style={styles.levelHeader}>
                  <Text
                    style={[
                      styles.levelLabel,
                      selectedLevel === exp.level && styles.levelLabelSelected,
                    ]}
                  >
                    {exp.label}
                  </Text>
                  {selectedLevel === exp.level && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.blue[600]} />
                  )}
                </View>
                <Text style={styles.levelDescription}>{exp.description}</Text>
                <View style={styles.levelStats}>
                  <Text style={styles.levelTarget}>
                    ~{exampleVolume / 1000}k lbs/week
                  </Text>
                  <Text style={styles.levelSubtext}>
                    Starting volume (at {bodyweightNum} lbs)
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderGoals = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your primary goal?</Text>
      <Text style={styles.stepSubtitle}>We'll optimize your programming accordingly</Text>

      <View style={styles.goalsGrid}>
        {GOALS.map((goal) => (
          <Pressable
            key={goal.id}
            style={[
              styles.goalCard,
              selectedGoal === goal.id && styles.goalCardSelected,
            ]}
            onPress={() => setSelectedGoal(goal.id)}
          >
            <View style={[
              styles.goalIcon,
              selectedGoal === goal.id && styles.goalIconSelected,
            ]}>
              <Ionicons
                name={goal.icon as any}
                size={32}
                color={selectedGoal === goal.id ? colors.white : colors.blue[600]}
              />
            </View>
            <Text style={[
              styles.goalLabel,
              selectedGoal === goal.id && styles.goalLabelSelected,
            ]}>
              {goal.label}
            </Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Training Schedule</Text>
      <Text style={styles.stepSubtitle}>How many days per week can you train?</Text>

      <View style={styles.daysSelector}>
        {[3, 4, 5, 6].map((days) => (
          <Pressable
            key={days}
            style={[
              styles.dayOption,
              trainingDays === days && styles.dayOptionSelected,
            ]}
            onPress={() => setTrainingDays(days)}
          >
            <Text style={[
              styles.dayNumber,
              trainingDays === days && styles.dayNumberSelected,
            ]}>
              {days}
            </Text>
            <Text style={[
              styles.dayLabel,
              trainingDays === days && styles.dayLabelSelected,
            ]}>
              days
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.scheduleInfo}>
        <Ionicons name="information-circle" size={20} color={colors.blue[600]} />
        <Text style={styles.scheduleInfoText}>
          We recommend 4-5 days per week for optimal results with the Push/Pull/Legs split
        </Text>
      </View>
    </View>
  );

  const renderPreview = () => {
    const experienceData = EXPERIENCE_LEVELS.find((e) => e.level === selectedLevel);

    // Calculate weekly volume based on user's inputs
    const bodyweightNum = parseFloat(bodyweight);
    const weeklyVolume = selectedLevel && bodyweightNum
      ? calculateWeeklyVolume(bodyweightNum, selectedLevel, selectedGoal)
      : 0;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.previewHeader}>
          <Ionicons name="checkmark-circle" size={60} color={colors.green[600]} />
          <Text style={styles.previewTitle}>Your Custom Plan is Ready!</Text>
          <Text style={styles.previewSubtitle}>
            Here's what we've created based on your experience and goals
          </Text>
        </View>

        <View style={styles.previewStats}>
          <View style={styles.previewStatCard}>
            <Text style={styles.previewStatLabel}>Weekly Volume Target</Text>
            <Text style={styles.previewStatValue}>
              {weeklyVolume > 0 ? `~${weeklyVolume / 1000}k lbs` : '-'}
            </Text>
            <Text style={styles.previewStatSub}>Total across all muscle groups</Text>
          </View>

          <View style={styles.previewStatRow}>
            <View style={styles.previewStatSmall}>
              <Text style={styles.previewStatSmallLabel}>Training Days</Text>
              <Text style={styles.previewStatSmallValue}>{trainingDays}/week</Text>
            </View>
            <View style={styles.previewStatSmall}>
              <Text style={styles.previewStatSmallLabel}>Experience</Text>
              <Text style={styles.previewStatSmallValue}>{experienceData?.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.previewInfo}>
          <Ionicons name="information-circle" size={20} color={colors.blue[600]} />
          <Text style={styles.previewInfoText}>
            Your plan will automatically adjust if you miss workouts. We'll help you stay on track!
          </Text>
        </View>
      </View>
    );
  };

  const renderAuth = () => {
    // Check if user came from welcome (existing user) or from preview (new user)
    const isExistingUser = !name.trim() && !bodyweight;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.authHeader}>
          <Text style={styles.authTitle}>
            {isExistingUser ? 'Sign In to Your Account' : 'Save Your Progress'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isExistingUser
              ? 'Welcome back! Sign in to access your workout data'
              : 'Create a secure account so your data syncs across devices and never gets lost'
            }
          </Text>
        </View>

      <View style={styles.authButtons}>
        <Pressable
          style={[styles.authButtonPrimary, isAuthenticating && styles.authButtonDisabled]}
          onPress={handleAppleSignIn}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={24} color={colors.white} />
              <Text style={styles.authButtonPrimaryText}>Continue with Apple</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.authButtonSecondary, isAuthenticating && styles.authButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color={colors.gray[700]} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={colors.gray[700]} />
              <Text style={styles.authButtonSecondaryText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <View style={styles.authDivider}>
          <View style={styles.authDividerLine} />
          <Text style={styles.authDividerText}>or</Text>
          <View style={styles.authDividerLine} />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.gray[400]}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Pressable
          style={[styles.authButtonSecondary, isAuthenticating && styles.authButtonDisabled]}
          onPress={handleEmailSignIn}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color={colors.gray[700]} />
          ) : (
            <>
              <Ionicons name="mail-outline" size={20} color={colors.gray[700]} />
              <Text style={styles.authButtonSecondaryText}>Continue with Email</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.authPrivacy}>
        By continuing, you agree to our Terms of Service and Privacy Policy. Your workout data is encrypted and secure.
      </Text>
    </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.blue[600]} />
      <Text style={styles.loadingText}>Setting up your profile...</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={colors.green[600]} />
      </View>
      <Text style={styles.successTitle}>You're all set!</Text>
      <Text style={styles.successSubtitle}>
        Your personalized training program is ready
      </Text>

      <View style={styles.successStats}>
        <View style={styles.successStat}>
          <Text style={styles.successStatLabel}>Weekly Target</Text>
          <Text style={styles.successStatValue}>
            {selectedLevel && bodyweight && `~${calculateWeeklyVolume(parseFloat(bodyweight), selectedLevel, selectedGoal) / 1000}k lbs`}
          </Text>
        </View>
        <View style={styles.successStat}>
          <Text style={styles.successStatLabel}>Training Days</Text>
          <Text style={styles.successStatValue}>{trainingDays}/week</Text>
        </View>
      </View>

      <Pressable
        style={styles.finishButton}
        onPress={async () => {
          // Small delay to ensure all DB writes are complete
          await new Promise(resolve => setTimeout(resolve, 300));
          router.replace("/(tabs)");
        }}
      >
        <Text style={styles.finishButtonText}>Start Training</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </Pressable>
    </View>
  );

  // ============================================================================
  // PROGRESS INDICATOR
  // ============================================================================

  const getStepNumber = () => {
    const steps = ['welcome', 'personal', 'experience', 'goals', 'schedule', 'preview', 'auth'];
    return steps.indexOf(currentStep) + 1;
  };

  const totalSteps = 7;
  const currentStepNumber = getStepNumber();

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (currentStep === 'loading') {
    return <SafeAreaView style={styles.container} edges={['top', 'bottom']}>{renderLoading()}</SafeAreaView>;
  }

  if (currentStep === 'success') {
    return <SafeAreaView style={styles.container} edges={['top', 'bottom']}>{renderSuccess()}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress Bar */}
      {currentStep !== 'welcome' && (
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index < currentStepNumber && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 'welcome' && renderWelcome()}
        {currentStep === 'personal' && renderPersonal()}
        {currentStep === 'experience' && renderExperience()}
        {currentStep === 'goals' && renderGoals()}
        {currentStep === 'schedule' && renderSchedule()}
        {currentStep === 'preview' && renderPreview()}
        {currentStep === 'auth' && renderAuth()}
      </ScrollView>

      {/* Navigation Buttons - Hidden on welcome screen since we have inline buttons */}
      {currentStep !== 'welcome' && (
        <View style={styles.navigationContainer}>
          <Pressable style={styles.backButton} onPress={goToPrevStep}>
            <Ionicons name="arrow-back" size={20} color={colors.gray[600]} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled,
            ]}
            onPress={goToNextStep}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 'auth' ? 'Skip for Now' : currentStep === 'preview' ? 'Save Progress' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  progressBar: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },

  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
  },

  progressSegmentActive: {
    backgroundColor: colors.blue[600],
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: spacing[6],
  },

  stepContainer: {
    flex: 1,
  },

  stepTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing[2],
  },

  stepTitleLarge: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },

  stepSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    marginBottom: spacing[8],
    lineHeight: typography.lineHeights.base,
  },

  // Welcome Step
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },

  kineticStack: {
    width: 120,
    height: 100,
    alignItems: 'flex-start',
    justifyContent: 'center',
    transform: [{ skewX: '-8deg' }], // Italic lean to the right
  },

  weightPlate: {
    height: 24,
    borderRadius: 8,
    marginVertical: 2,
  },

  plateTop: {
    width: 70,
    backgroundColor: '#18181b', // Dark Zinc
  },

  plateMiddle: {
    width: 70,
    backgroundColor: '#18181b', // Dark Zinc
    marginLeft: 3, // Slight forward shift
  },

  plateDrifting: {
    width: 95, // Significantly longer
    backgroundColor: '#2563eb', // Royal Blue
    marginLeft: 12, // Drifting forward, extending past the stack
  },

  welcomeTitle: {
    fontSize: typography.sizes['5xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing[2],
  },

  welcomeSubtitle: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
  },

  featuresList: {
    gap: spacing[4],
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
  },

  featureTextContainer: {
    flex: 1,
  },

  featureTextBold: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[0.5],
  },

  featureTextSub: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: typography.lineHeights.sm,
  },

  welcomeActions: {
    marginTop: spacing[8],
    gap: spacing[3],
  },

  welcomeButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.blue[600],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    minHeight: 56,
  },

  welcomeButtonPrimaryText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  welcomeButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray[300],
    minHeight: 56,
  },

  welcomeButtonSecondaryText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
  },

  // Personal Step
  inputGroup: {
    marginBottom: spacing[6],
  },

  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing[2],
  },

  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: spacing[2],
    lineHeight: typography.lineHeights.xs,
  },

  input: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    paddingHorizontal: spacing[5],
    fontSize: typography.sizes.lg,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },

  // Experience Step
  levelCards: {
    gap: spacing[4],
  },

  levelCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },

  levelCardSelected: {
    borderColor: colors.blue[600],
    backgroundColor: colors.blue[50],
  },

  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },

  levelLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },

  levelLabelSelected: {
    color: colors.blue[600],
  },

  levelDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing[4],
  },

  levelStats: {
    alignItems: "flex-start",
  },

  levelTarget: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.blue[600],
  },

  levelSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: spacing[0.5],
  },

  // Goals Step
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },

  goalCard: {
    width: (width - spacing[6] * 2 - spacing[3]) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },

  goalCardSelected: {
    borderColor: colors.blue[600],
    backgroundColor: colors.blue[50],
  },

  goalIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.blue[50],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },

  goalIconSelected: {
    backgroundColor: colors.blue[600],
  },

  goalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing[1],
  },

  goalLabelSelected: {
    color: colors.blue[600],
  },

  goalDescription: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    textAlign: 'center',
  },

  // Schedule Step
  daysSelector: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },

  dayOption: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },

  dayOptionSelected: {
    borderColor: colors.blue[600],
    backgroundColor: colors.blue[600],
  },

  dayNumber: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing[1],
  },

  dayNumberSelected: {
    color: colors.white,
  },

  dayLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
  },

  dayLabelSelected: {
    color: colors.white,
  },

  scheduleInfo: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.blue[50],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },

  scheduleInfoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.blue[900],
    lineHeight: typography.lineHeights.sm,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },

  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },

  successIcon: {
    marginBottom: spacing[6],
  },

  successTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing[2],
  },

  successSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing[8],
  },

  successStats: {
    flexDirection: 'row',
    gap: spacing[6],
    marginBottom: spacing[8],
  },

  successStat: {
    alignItems: 'center',
  },

  successStatLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing[1],
  },

  successStatValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.blue[600],
  },

  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.blue[600],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius.xl,
  },

  finishButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[6],
    paddingBottom: spacing[8],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },

  backButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
  },

  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.blue[600],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },

  nextButtonDisabled: {
    opacity: 0.5,
  },

  nextButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Preview Step
  previewHeader: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },

  previewTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },

  previewSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.lineHeights.base,
  },

  previewStats: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },

  previewStatCard: {
    backgroundColor: colors.blue[50],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blue[200],
  },

  previewStatLabel: {
    fontSize: typography.sizes.sm,
    color: colors.blue[700],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
  },

  previewStatValue: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.blue[600],
    marginBottom: spacing[1],
  },

  previewStatSub: {
    fontSize: typography.sizes.xs,
    color: colors.blue[600],
  },

  previewStatRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  previewStatSmall: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  previewStatSmallLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    marginBottom: spacing[1],
  },

  previewStatSmallValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },

  previewInfo: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.blue[50],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },

  previewInfoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.blue[900],
    lineHeight: typography.lineHeights.sm,
  },

  // Auth Step
  authHeader: {
    marginBottom: spacing[8],
  },

  authTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing[2],
  },

  authSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    lineHeight: typography.lineHeights.base,
  },

  authButtons: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },

  authButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    backgroundColor: colors.gray[900],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    minHeight: 56,
  },

  authButtonPrimaryText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  authButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray[300],
    minHeight: 56,
  },

  authButtonSecondaryText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
  },

  authButtonDisabled: {
    opacity: 0.5,
  },

  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[2],
  },

  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },

  authDividerText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    fontWeight: typography.weights.medium,
  },

  authPrivacy: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: typography.lineHeights.xs,
  },
});
