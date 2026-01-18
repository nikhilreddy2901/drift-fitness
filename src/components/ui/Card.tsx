import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  backgroundColor?: string;
}

export function Card({ children, style, padding = 4, backgroundColor = colors.white }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding: spacing[padding], backgroundColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
});
