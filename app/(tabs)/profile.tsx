import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/src/constants/theme';
import { useUserStore } from '@/src/stores/useUserStore';
import { useWorkoutStore } from '@/src/stores/useWorkoutStore';
import { signOut } from '@/src/services/auth';
import { resetDatabase } from '@/src/db/init';

type IconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  icon: IconName;
  label: string;
  action: string;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loadProfile } = useUserStore();
  const { weeklyProgress, loadWeeklyProgress } = useWorkoutStore();

  useEffect(() => {
    loadProfile();
    loadWeeklyProgress();
  }, []);

  const menuItems: MenuSection[] = [
    {
      section: 'Account',
      items: [
        { icon: 'person', label: 'Profile Settings', action: 'profile' },
        { icon: 'settings', label: 'App Preferences', action: 'preferences' },
      ],
    },
    {
      section: 'Program',
      items: [
        { icon: 'document-text', label: 'Training Program', action: 'program' },
        { icon: 'settings', label: 'Volume Targets', action: 'targets' },
      ],
    },
    {
      section: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help & FAQ', action: 'help' },
        { icon: 'share', label: 'Share App', action: 'share' },
        { icon: 'document-text', label: 'Terms & Privacy', action: 'legal' },
      ],
    },
  ];

  const handleMenuPress = (action: string) => {
    Alert.alert('Coming Soon', `${action} feature will be available soon`);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will clear all your local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Profile] Signing out...');

              // Sign out from Supabase
              await signOut();
              console.log('[Profile] Signed out from Supabase');

              // Reset and reinitialize database (clears all user data, runs migrations, seeds exercises)
              await resetDatabase();
              console.log('[Profile] Database reset and reinitialized');

              // Navigate to index (which will check for profile and route appropriately)
              router.replace('/');
              console.log('[Profile] Navigated to index');
            } catch (error: any) {
              console.error('[Profile] Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const getTotalVolume = () => {
    if (!weeklyProgress) return 0;
    const wp = weeklyProgress as any;
    return (wp.push_completed_volume || 0) + (wp.pull_completed_volume || 0) + (wp.legs_completed_volume || 0);
  };

  const getWorkoutCount = () => {
    if (!profile) return 0;
    return (profile.currentWeek - 1) * 3;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>N</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>Nikhil</Text>
            <Text style={styles.userRole}>Premium Member</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.currentWeek || 0}</Text>
              <Text style={styles.statLabel}>Weeks Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getWorkoutCount()}</Text>
              <Text style={styles.statLabel}>Total Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(getTotalVolume() / 1000)}k</Text>
              <Text style={styles.statLabel}>Volume (lbs)</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, idx) => (
          <View key={idx} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.section.toUpperCase()}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.menuItem,
                    itemIdx !== section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleMenuPress(item.label)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <Ionicons name={item.icon} size={20} color={colors.gray[600]} />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Current Program */}
        <View style={styles.programCard}>
          <Text style={styles.programTitle}>Current Program</Text>
          <Text style={styles.programName}>Push/Pull/Legs Split</Text>
          <Text style={styles.programProgress}>Week {profile?.currentWeek || 1} of 12</Text>
          <TouchableOpacity onPress={() => handleMenuPress('Program Details')}>
            <Text style={styles.programLink}>View Program Details →</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out" size={20} color={colors.red[600]} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Drift v1.0.0</Text>
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
    paddingBottom: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[4],
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },

  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.blue[600],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: typography.sizes.xl,
    color: colors.white,
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: typography.sizes.lg,
    color: colors.gray[900],
  },

  userRole: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },

  statsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
    marginBottom: spacing[6],
  },

  statsTitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    marginBottom: spacing[4],
  },

  statsGrid: {
    flexDirection: 'row',
    gap: spacing[4],
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: typography.sizes['2xl'],
    color: colors.gray[900],
    marginBottom: spacing[1],
  },

  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    textAlign: 'center',
  },

  menuSection: {
    marginBottom: spacing[6],
  },

  sectionTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    letterSpacing: 0.5,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },

  menuCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },

  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  menuItemLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },

  programCard: {
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
  },

  programTitle: {
    fontSize: typography.sizes.base,
    color: colors.blue[900],
    marginBottom: spacing[2],
  },

  programName: {
    fontSize: typography.sizes.sm,
    color: colors.blue[700],
    marginBottom: spacing[1],
  },

  programProgress: {
    fontSize: typography.sizes.sm,
    color: colors.blue[700],
    marginBottom: spacing[3],
  },

  programLink: {
    fontSize: typography.sizes.sm,
    color: colors.blue[600],
  },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.red[200],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[6],
  },

  signOutText: {
    fontSize: typography.sizes.base,
    color: colors.red[600],
  },

  version: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
});
