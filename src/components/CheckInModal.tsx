/**
 * DRIFT FITNESS - CHECK-IN MODAL (Redesigned with Sliders)
 * Pre-workout sleep, soreness, and alcohol assessment
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { colors, typography, spacing, borderRadius } from "../constants/theme";
import type { CheckInData } from "../types";

interface CheckInModalProps {
  visible: boolean;
  checkInData: CheckInData;
  onCheckInChange: (data: Partial<CheckInData>) => void;
  onConfirm: () => void;
  onCancel: () => void;
  muscleGroup?: "push" | "pull" | "legs";
}

export function CheckInModal({
  visible,
  checkInData,
  onCheckInChange,
  onConfirm,
  onCancel,
  muscleGroup,
}: CheckInModalProps) {
  // Convert check-in data to slider values
  const [sleep, setSleep] = useState(checkInData.goodSleep ? 8 : 5);
  const [soreness, setSoreness] = useState(checkInData.notSore ? 3 : 7);
  const [alcohol, setAlcohol] = useState(false);

  const getAdjustments = () => {
    const adjustments: string[] = [];
    let volumeReduction = 0;

    if (sleep < 6) {
      volumeReduction += 15;
      adjustments.push('Low sleep detected');
    }
    if (soreness > 7) {
      adjustments.push('High soreness - adjusting intensity');
    }
    if (alcohol) {
      volumeReduction += 10;
      adjustments.push('Recovery protocol active');
    }

    return { adjustments, volumeReduction };
  };

  const handleConfirm = () => {
    // Convert slider values back to check-in data format
    onCheckInChange({
      goodSleep: sleep >= 7,
      notSore: soreness <= 5,
      mood: sleep >= 7 && soreness <= 5 ? 'great' : sleep >= 6 ? 'okay' : 'rough',
    });
    onConfirm();
  };

  const { adjustments, volumeReduction } = getAdjustments();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Check-In</Text>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={true}
          >
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color={colors.blue[600]} style={{ marginRight: spacing[3] }} />
              <Text style={styles.infoText}>
                Your responses help us optimize today's workout for safety and effectiveness
              </Text>
            </View>

            {/* Sleep */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.blue[100] }]}>
                  <Ionicons name="moon" size={20} color={colors.blue[600]} />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>Sleep Quality</Text>
                  <Text style={styles.sectionSubtitle}>Hours last night</Text>
                </View>
                <Text style={styles.valueText}>{sleep}h</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={12}
                step={0.5}
                value={sleep}
                onValueChange={setSleep}
                minimumTrackTintColor={colors.blue[600]}
                maximumTrackTintColor={colors.gray[200]}
                thumbTintColor={colors.blue[600]}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Poor</Text>
                <Text style={styles.sliderLabel}>Great</Text>
              </View>
            </View>

            {/* Soreness */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.orange[100] }]}>
                  <Ionicons name="flame" size={20} color={colors.orange[600]} />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>Muscle Soreness</Text>
                  <Text style={styles.sectionSubtitle}>Overall body feeling</Text>
                </View>
                <Text style={styles.valueText}>{soreness}/10</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={soreness}
                onValueChange={setSoreness}
                minimumTrackTintColor={colors.orange[600]}
                maximumTrackTintColor={colors.gray[200]}
                thumbTintColor={colors.orange[600]}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Fresh</Text>
                <Text style={styles.sliderLabel}>Very Sore</Text>
              </View>
            </View>

            {/* Alcohol */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.purple[100] }]}>
                  <Ionicons name="beer" size={20} color={colors.purple[600]} />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>Alcohol Consumption</Text>
                  <Text style={styles.sectionSubtitle}>In the last 24 hours</Text>
                </View>
                <Switch
                  value={alcohol}
                  onValueChange={setAlcohol}
                  trackColor={{ false: colors.gray[300], true: colors.purple[600] }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

            {/* Adjustment Preview */}
            <View
              style={[
                styles.adjustmentPreview,
                adjustments.length > 0
                  ? { backgroundColor: colors.amber[50], borderColor: colors.amber[200] }
                  : { backgroundColor: colors.green[50], borderColor: colors.green[200] },
              ]}
            >
              <Text
                style={[
                  styles.adjustmentTitle,
                  adjustments.length > 0 ? { color: colors.amber[900] } : { color: colors.green[900] },
                ]}
              >
                {adjustments.length > 0 ? 'Workout Will Be Adjusted' : 'Workout Ready'}
              </Text>
              {adjustments.length > 0 ? (
                <>
                  {volumeReduction > 0 && (
                    <Text style={styles.adjustmentText}>
                      Volume reduced by {volumeReduction}% for optimal recovery
                    </Text>
                  )}
                  {adjustments.map((adj, idx) => (
                    <Text key={idx} style={styles.adjustmentText}>
                      • {adj}
                    </Text>
                  ))}
                </>
              ) : (
                <Text style={[styles.adjustmentText, { color: colors.green[700] }]}>
                  You're in great condition! Workout will proceed as planned.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
              ]}
            >
              <Text style={styles.submitButtonText}>Generate Workout →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '85%',
    minHeight: '60%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    fontSize: typography.sizes.lg,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },

  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },

  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
  },

  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.blue[900],
    lineHeight: typography.lineHeights.sm,
  },

  section: {
    marginBottom: spacing[6],
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  sectionInfo: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },

  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  valueText: {
    fontSize: typography.sizes.xl,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },

  slider: {
    width: '100%',
    height: 40,
  },

  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },

  sliderLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },

  adjustmentPreview: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing[4],
  },

  adjustmentTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[2],
  },

  adjustmentText: {
    fontSize: typography.sizes.sm,
    color: colors.amber[700],
    lineHeight: typography.lineHeights.sm,
    marginTop: spacing[1],
  },

  footer: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  submitButton: {
    backgroundColor: colors.blue[600],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },

  submitButtonPressed: {
    opacity: 0.8,
  },

  submitButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
});
