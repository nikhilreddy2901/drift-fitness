import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/src/constants/theme';
import { useUserStore } from '@/src/stores/useUserStore';
import type { Exercise, MuscleGroup } from '@/src/types';

type Category = 'all' | MuscleGroup;

export default function LibraryScreen() {
  const { exercises, loadExercises } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  useEffect(() => {
    loadExercises();
  }, []);

  const categories: { id: Category; name: string }[] = [
    { id: 'all', name: 'All' },
    { id: 'push', name: 'Push' },
    { id: 'pull', name: 'Pull' },
    { id: 'legs', name: 'Legs' },
  ];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.muscleGroup === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getEquipmentLabel = (exercise: Exercise): string => {
    if (exercise.name.toLowerCase().includes('barbell')) return 'Barbell';
    if (exercise.name.toLowerCase().includes('dumbbell') || exercise.name.toLowerCase().includes('db')) return 'Dumbbell';
    if (exercise.name.toLowerCase().includes('cable')) return 'Cable';
    if (exercise.name.toLowerCase().includes('machine')) return 'Machine';
    if (exercise.name.toLowerCase().includes('bodyweight')) return 'Bodyweight';
    return 'Barbell';
  };

  const getMuscleLabel = (exercise: Exercise): string => {
    const muscleMap: Record<string, string> = {
      'bench': 'Chest, Triceps',
      'press': 'Shoulders, Triceps',
      'fly': 'Chest',
      'row': 'Back, Biceps',
      'pulldown': 'Lats, Biceps',
      'curl': 'Biceps',
      'squat': 'Quads, Glutes',
      'deadlift': 'Back, Hamstrings',
      'lunge': 'Quads, Glutes',
      'leg press': 'Quads, Glutes',
      'hamstring': 'Hamstrings',
    };

    const nameLower = exercise.name.toLowerCase();
    for (const [key, value] of Object.entries(muscleMap)) {
      if (nameLower.includes(key)) return value;
    }

    return exercise.muscleGroup.charAt(0).toUpperCase() + exercise.muscleGroup.slice(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercise Library</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categories}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === cat.id && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.exerciseCount}>
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </Text>

        <View style={styles.exerciseList}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseCardContent}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaText}>{getMuscleLabel(exercise)}</Text>
                    <Text style={styles.exerciseMetaDot}>•</Text>
                    <Text style={styles.exerciseMetaText}>{getEquipmentLabel(exercise)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[4],
  },

  searchContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },

  searchIcon: {
    position: 'absolute',
    left: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },

  searchInput: {
    paddingLeft: spacing[10],
    paddingRight: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },

  categoriesScroll: {
    marginHorizontal: -spacing[6],
    paddingHorizontal: spacing[6],
  },

  categories: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  categoryButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
  },

  categoryButtonActive: {
    backgroundColor: colors.blue[600],
  },

  categoryButtonText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },

  categoryButtonTextActive: {
    color: colors.white,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },

  exerciseCount: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing[4],
  },

  exerciseList: {
    gap: spacing[3],
    paddingBottom: spacing[6],
  },

  exerciseCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
  },

  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    marginBottom: spacing[1],
  },

  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  exerciseMetaText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  exerciseMetaDot: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
  },
});
