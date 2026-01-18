/**
 * DRIFT FITNESS - AUTHENTICATION SERVICE
 * Handles Apple, Google, and Email authentication
 */

import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Required for OAuth flow
WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// TYPES
// ============================================================================

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

// ============================================================================
// APPLE SIGN IN
// ============================================================================

/**
 * Sign in with Apple using Supabase Auth
 *
 * Setup required in Supabase Dashboard:
 * 1. Go to Authentication > Providers > Apple
 * 2. Enable Apple provider
 * 3. Add your iOS Bundle ID and Services ID
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    const redirectUrl = 'drift://auth/callback'; // Your app's deep link

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) {
      console.error('[Auth] Apple sign in error:', error);
      return { success: false, error: error.message };
    }

    // For native apps, open the auth URL in browser
    if (data?.url && Platform.OS !== 'web') {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === 'success') {
        // Extract the session from URL params
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return { success: false, error: 'Failed to get session' };
        }

        return { success: true, user: session.user };
      }

      return { success: false, error: 'Authentication cancelled' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Apple sign in exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// GOOGLE SIGN IN
// ============================================================================

/**
 * Sign in with Google using Supabase Auth
 *
 * Setup required in Supabase Dashboard:
 * 1. Go to Authentication > Providers > Google
 * 2. Enable Google provider
 * 3. Add your OAuth client IDs (web, iOS, Android)
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectUrl = 'drift://auth/callback'; // Your app's deep link

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) {
      console.error('[Auth] Google sign in error:', error);
      return { success: false, error: error.message };
    }

    // For native apps, open the auth URL in browser
    if (data?.url && Platform.OS !== 'web') {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === 'success') {
        // Extract the session from URL params
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return { success: false, error: 'Failed to get session' };
        }

        return { success: true, user: session.user };
      }

      return { success: false, error: 'Authentication cancelled' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Google sign in exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EMAIL MAGIC LINK
// ============================================================================

/**
 * Send a magic link to the user's email for passwordless authentication
 */
export async function signInWithEmail(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'drift://auth/callback',
      },
    });

    if (error) {
      console.error('[Auth] Email sign in error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      error: 'Check your email for the magic link!' // This is actually a success message
    };
  } catch (error: any) {
    console.error('[Auth] Email sign in exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign in anonymously (for testing/guest mode)
 */
export async function signInAnonymously(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('[Auth] Anonymous sign in error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('[Auth] Anonymous sign in exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign up with email and password (traditional method)
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'drift://auth/callback',
      },
    });

    if (error) {
      console.error('[Auth] Email signup error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('[Auth] Email signup exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Password sign in error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('[Auth] Password sign in exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// AUTH STATE HELPERS
// ============================================================================

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated (not anonymous)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && !user.is_anonymous;
}

/**
 * Check if current user is anonymous
 */
export async function isAnonymousUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && user.is_anonymous === true;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Auth] Sign out error:', error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
