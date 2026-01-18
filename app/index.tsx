/**
 * APP ENTRY POINT
 * Determines whether to show onboarding or main app
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { UserProfileRepo } from '@/src/db/client';
import { fullSync } from '@/src/services/syncService';
import { checkAndAdvanceWeek } from '@/src/utils/weekManager';

export default function Index() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAndProfile();
  }, []);

  async function checkAuthAndProfile() {
    try {
      console.log('[Index] Starting profile check...');

      // Check if we need to advance to a new week (happens every Monday)
      await checkAndAdvanceWeek();

      // Attempt background sync (non-blocking)
      fullSync().catch(err => {
        console.log('[Index] Background sync failed (expected if offline):', err.message);
      });

      // Check if user has a profile in local SQLite database
      const profile = await UserProfileRepo.get();
      console.log('[Index] Profile check result:', profile ? 'Profile found' : 'No profile');

      if (profile) {
        console.log('[Index] Profile exists, will redirect to tabs');
        setHasProfile(true);
      } else {
        console.log('[Index] No profile, will redirect to onboarding');
        setHasProfile(false);
      }
    } catch (error) {
      console.error('[Index] Error checking profile:', error);
      // On error, show onboarding to be safe
      setHasProfile(false);
    }
  }

  // Still checking - show nothing
  if (hasProfile === null) {
    return null;
  }

  // Redirect based on profile existence
  if (hasProfile) {
    console.log('[Index] Redirecting to /(tabs)');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('[Index] Redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }
}
