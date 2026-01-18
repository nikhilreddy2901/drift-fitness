import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/src/constants/theme';

export function VolumeChart() {
  const weekData = [
    { week: 'W1', volume: 28000 },
    { week: 'W2', volume: 31000 },
    { week: 'W3', volume: 32500 },
    { week: 'W4', volume: 19500 },
    { week: 'W5', volume: 33000 },
    { week: 'W6', volume: 35000 },
  ];

  const maxVolume = Math.max(...weekData.map((d) => d.volume));

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {weekData.map((data, idx) => {
          const height = (data.volume / maxVolume) * 120;
          return (
            <View key={idx} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height }]} />
              </View>
              <Text style={styles.label}>{data.week}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Weekly Volume Trend (lbs)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[2],
  },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    marginBottom: spacing[2],
  },

  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },

  barWrapper: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },

  bar: {
    width: '100%',
    backgroundColor: colors.blue[600],
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },

  label: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
  },

  legend: {
    alignItems: 'center',
    marginTop: spacing[2],
  },

  legendText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
});
