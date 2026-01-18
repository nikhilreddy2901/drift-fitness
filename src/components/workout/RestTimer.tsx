/**
 * REST TIMER COMPONENT
 * A polished, feature-rich rest timer for between sets
 * 
 * Features:
 * - Floating mini timer (non-intrusive)
 * - Full-screen modal view
 * - Haptic feedback when timer ends
 * - Adjustable duration (+/- 30s)
 * - Visual progress ring
 * - Auto-starts on set completion
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface RestTimerProps {
    isActive: boolean;
    duration: number; // Total duration in seconds
    remaining: number; // Remaining seconds
    onSkip: () => void;
    onAdjust: (delta: number) => void;
    onExpand?: () => void;
    onMinimize?: () => void;
    isExpanded?: boolean;
}

export function RestTimer({
    isActive,
    duration,
    remaining,
    onSkip,
    onAdjust,
    onExpand,
    onMinimize,
    isExpanded = false,
}: RestTimerProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [hasVibrated, setHasVibrated] = useState(false);

    // Progress animation
    useEffect(() => {
        if (isActive && duration > 0) {
            const progress = 1 - (remaining / duration);
            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [remaining, duration, isActive]);

    // Pulse animation when timer is low
    useEffect(() => {
        if (remaining <= 10 && remaining > 0 && isActive) {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [remaining, isActive]);


    // Haptic feedback when timer ends
    useEffect(() => {
        if (remaining === 0 && isActive && !hasVibrated) {
            triggerEndHaptics();
            setHasVibrated(true);
        }
        if (remaining > 0) {
            setHasVibrated(false);
        }
    }, [remaining, isActive, hasVibrated]);

    const triggerEndHaptics = () => {
        // Triple vibration burst to signal timer end
        // Pattern: wait 0ms, vibrate 400ms, wait 100ms, vibrate 400ms...
        Vibration.vibrate([0, 400, 200, 400, 200, 400]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (1 - remaining / duration) : 0;

    // Determine color based on remaining time
    const getTimerColor = () => {
        if (remaining <= 10) return colors.red[500];
        if (remaining <= 30) return colors.amber[600];
        return colors.blue[600];
    };

    if (!isActive) return null;

    // Expanded full view (for modal)
    if (isExpanded) {
        return (
            <View style={styles.expandedContainer}>
                <View style={styles.expandedContent}>
                    {/* Close button - minimizes to floating */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onMinimize ? onMinimize : onSkip}
                    >
                        <Ionicons name="chevron-down" size={28} color={colors.gray[600]} />
                    </TouchableOpacity>

                    {/* Timer icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="timer-outline" size={48} color={getTimerColor()} />
                    </View>

                    {/* Rest label */}
                    <Text style={styles.expandedLabel}>Rest Time</Text>

                    {/* Main timer display */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Text style={[styles.expandedTime, { color: getTimerColor() }]}>
                            {formatTime(remaining)}
                        </Text>
                    </Animated.View>

                    {/* Progress bar */}
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    backgroundColor: getTimerColor(),
                                }
                            ]}
                        />
                    </View>

                    {/* Duration indicator */}
                    <Text style={styles.durationText}>
                        {formatTime(duration)} total
                    </Text>

                    {/* Adjustment buttons */}
                    <View style={styles.adjustmentRow}>
                        <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={() => {
                                Vibration.vibrate(10); // Light haptic replacement
                                onAdjust(-30);
                            }}
                        >
                            <Ionicons name="remove" size={20} color={colors.gray[700]} />
                            <Text style={styles.adjustButtonText}>30s</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={() => {
                                Vibration.vibrate(10); // Light haptic replacement
                                onAdjust(30);
                            }}
                        >
                            <Ionicons name="add" size={20} color={colors.gray[700]} />
                            <Text style={styles.adjustButtonText}>30s</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Skip button */}
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => {
                            Vibration.vibrate(20); // Medium haptic replacement
                            onSkip();
                        }}
                    >
                        <Text style={styles.skipButtonText}>Skip Rest</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Compact floating view (non-modal)
    return (
        <TouchableOpacity
            style={styles.floatingContainer}
            onPress={onExpand}
            activeOpacity={0.9}
        >
            <View style={styles.floatingContent}>
                {/* Mini progress ring */}
                <View style={styles.miniProgressRing}>
                    <View
                        style={[
                            styles.miniProgressFill,
                            {
                                borderColor: getTimerColor(),
                                borderTopColor: 'transparent',
                                transform: [{ rotate: `${progress * 360}deg` }],
                            },
                        ]}
                    />
                    <Ionicons
                        name="timer-outline"
                        size={16}
                        color={getTimerColor()}
                        style={styles.miniIcon}
                    />
                </View>

                {/* Timer text */}
                <Animated.Text
                    style={[
                        styles.floatingTime,
                        { color: getTimerColor(), transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    {formatTime(remaining)}
                </Animated.Text>

                {/* Quick actions */}
                <View style={styles.floatingActions}>
                    <TouchableOpacity
                        style={styles.floatingActionButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            Vibration.vibrate(10);
                            onAdjust(30);
                        }}
                    >
                        <Ionicons name="add" size={18} color={colors.gray[600]} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.floatingSkipButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            Vibration.vibrate(20);
                            onSkip();
                        }}
                    >
                        <Text style={styles.floatingSkipText}>Skip</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    // Floating (compact) styles
    floatingContainer: {
        position: 'absolute',
        bottom: 100,
        left: spacing[6],
        right: spacing[6],
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.gray[200],
    },

    floatingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
        gap: spacing[3],
    },

    miniProgressRing: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },

    miniProgressFill: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: colors.blue[600],
    },

    miniIcon: {
        zIndex: 1,
    },

    floatingTime: {
        flex: 1,
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
    },

    floatingActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },

    floatingActionButton: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.full,
        backgroundColor: colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },

    floatingSkipButton: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.lg,
    },

    floatingSkipText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: colors.gray[700],
    },

    // Expanded (modal) styles
    expandedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },

    expandedContent: {
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        padding: spacing[6],
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },

    closeButton: {
        position: 'absolute',
        top: spacing[4],
        right: spacing[4],
        zIndex: 1,
        padding: spacing[1],
    },

    iconContainer: {
        marginBottom: spacing[3],
        marginTop: spacing[4],
    },

    expandedLabel: {
        fontSize: typography.sizes.lg,
        color: colors.gray[600],
        marginBottom: spacing[2],
    },

    expandedTime: {
        fontSize: 72,
        fontWeight: typography.weights.bold,
        letterSpacing: -2,
    },

    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: colors.gray[200],
        borderRadius: borderRadius.full,
        marginTop: spacing[4],
        overflow: 'hidden',
    },

    progressBarFill: {
        height: '100%',
        borderRadius: borderRadius.full,
    },

    durationText: {
        fontSize: typography.sizes.sm,
        color: colors.gray[500],
        marginTop: spacing[2],
    },

    adjustmentRow: {
        flexDirection: 'row',
        gap: spacing[4],
        marginTop: spacing[6],
        marginBottom: spacing[4],
    },

    adjustButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.xl,
    },

    adjustButtonText: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: colors.gray[700],
    },

    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.blue[600],
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        borderRadius: borderRadius.xl,
        width: '100%',
        marginTop: spacing[2],
    },

    skipButtonText: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
        color: colors.white,
    },
});
