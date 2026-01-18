import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../constants/theme';

type InsightType = 'warning' | 'success' | 'info';

interface Insight {
  type: InsightType;
  title: string;
  message: string;
  action?: string;
}

interface AIInsightCardProps {
  insight: Insight;
  onActionPress?: () => void;
}

export function AIInsightCard({ insight, onActionPress }: AIInsightCardProps) {
  const getStyles = () => {
    switch (insight.type) {
      case 'warning':
        return {
          bg: colors.amber[50],
          border: colors.amber[200],
          icon: 'alert-circle' as const,
          iconColor: colors.amber[600],
          textColor: colors.amber[900],
        };
      case 'success':
        return {
          bg: colors.green[50],
          border: colors.green[200],
          icon: 'checkmark-circle' as const,
          iconColor: colors.green[600],
          textColor: colors.green[900],
        };
      case 'info':
        return {
          bg: colors.blue[50],
          border: colors.blue[200],
          icon: 'information-circle' as const,
          iconColor: colors.blue[600],
          textColor: colors.blue[900],
        };
    }
  };

  const insightStyles = getStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: insightStyles.bg, borderColor: insightStyles.border },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={insightStyles.icon}
          size={20}
          color={insightStyles.iconColor}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: insightStyles.textColor }]}>
            {insight.title}
          </Text>
          <Text style={styles.message}>{insight.message}</Text>
          {insight.action && (
            <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
              <Text style={styles.actionText}>{insight.action}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.blue[600]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing[4],
  },
  content: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  icon: {
    marginTop: spacing[0.5],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1],
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionText: {
    fontSize: typography.sizes.sm,
    color: colors.blue[600],
    fontWeight: typography.weights.medium,
  },
});
