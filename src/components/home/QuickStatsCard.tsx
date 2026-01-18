import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface Stat {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

interface QuickStatsCardProps {
  totalVolume: number;
  sessionsCompleted: number;
  weekNumber: number;
}

export function QuickStatsCard({ totalVolume, sessionsCompleted, weekNumber }: QuickStatsCardProps) {
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k lbs`;
    }
    return `${volume} lbs`;
  };

  const stats: Stat[] = [
    {
      label: 'Total Volume',
      value: formatVolume(totalVolume),
      change: 'This week',
      icon: 'trending-up',
    },
    {
      label: 'Sessions',
      value: sessionsCompleted.toString(),
      change: 'Completed',
      icon: 'flash',
    },
    {
      label: 'Current Week',
      value: weekNumber.toString(),
      change: 'Training cycle',
      icon: 'calendar',
    },
  ];

  return (
    <Card padding={4}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={stat.icon} size={16} color={colors.gray[600]} />
            </View>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
            {stat.change && (
              <Text
                style={[
                  styles.change,
                  stat.positive && styles.changePositive,
                ]}
              >
                {stat.change}
              </Text>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statItem: {
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  value: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[0.5],
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
  },
  change: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: spacing[0.5],
  },
  changePositive: {
    color: colors.green[600],
  },
});
