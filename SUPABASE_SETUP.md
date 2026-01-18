# Drift Fitness - Supabase Setup Guide

Complete authentication and cloud database setup for your fitness app.

---

## ✅ What's Already Done

- ✅ Supabase client configured
- ✅ SQL migration file created
- ✅ Onboarding flow with "lazy registration" UI
- ✅ Auth service (Apple, Google, Email)
- ✅ Supabase repository layer for data persistence
- ✅ Deep linking configured (`drift://` scheme)

---

## 🚀 What You Need to Do

### Step 1: Run the SQL Migration in Supabase

This creates all the database tables with proper Row Level Security (RLS) policies.

1. Go to your Supabase Dashboard: https://app.supabase.com/project/yxjxgcemkqbpyqvmlkpe
2. Click **SQL Editor** in the left sidebar
3. Click **+ New Query**
4. Open the file `supabase-migration.sql` from your project root
5. Copy the entire SQL script and paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success: You should see "Success. No rows returned"

**Important:** The migration includes:
- All database tables (user_profile, workouts, exercises, etc.)
- Row Level Security policies (users can only access their own data)
- Indexes for performance
- Triggers for automatic timestamps

---

### Step 2: Configure Authentication Providers

#### 2.1 Enable Email Authentication (Magic Link)

**This is the easiest to test and requires no external setup.**

1. Go to **Authentication** → **Providers** in Supabase
2. Find **Email** and make sure it's **enabled**
3. Scroll down to **Email Templates** → **Magic Link**
4. Confirm the template looks good (default is fine)
5. **Done!** Email auth is ready to test

**How it works:**
- User enters their email
- They receive a magic link via email
- Clicking the link signs them in (no password needed)

---

#### 2.2 Enable Apple Sign In (iOS Only)

**Setup required in Apple Developer Console + Supabase.**

1. **Apple Developer Console:**
   - Go to https://developer.apple.com/account/resources/identifiers/list
   - Create a **Services ID** for Sign in with Apple
   - Note your **Services ID** (e.g., `com.drift.app.signin`)
   - Configure **Return URLs**: `https://yxjxgcemkqbpyqvmlkpe.supabase.co/auth/v1/callback`

2. **Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Find **Apple** and toggle it **ON**
   - Enter your **Services ID** (from step 1)
   - Save

3. **Test on iOS:**
   - Apple Sign In only works on real iOS devices or TestFlight
   - It will NOT work in Expo Go or iOS Simulator (Apple restriction)

**Production Requirements:**
- You'll need a paid Apple Developer account ($99/year)
- Configure your iOS Bundle ID in Supabase

---

#### 2.3 Enable Google Sign In

**Setup required in Google Cloud Console + Supabase.**

1. **Google Cloud Console:**
   - Go to https://console.cloud.google.com/
   - Create a new project (or use existing)
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Create credentials for:
     - **Web application** (for Supabase callback)
     - **iOS** (if testing on iOS)
     - **Android** (if testing on Android)

   **Redirect URIs for Web:**
   ```
   https://yxjxgcemkqbpyqvmlkpe.supabase.co/auth/v1/callback
   ```

2. **Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Find **Google** and toggle it **ON**
   - Enter your **Client ID** (from Google Cloud Console)
   - Enter your **Client Secret** (from Google Cloud Console)
   - Save

3. **Add to app.json:**
   ```json
   "ios": {
     "googleServicesFile": "./GoogleService-Info.plist"
   },
   "android": {
     "googleServicesFile": "./google-services.json"
   }
   ```

**Note:** Google Sign In setup is the most complex. Start with Email auth for testing.

---

### Step 3: Seed the Exercises Table

The exercises table needs to be pre-populated with the exercise library.

**Option A: Seed from the app (Recommended)**

1. The app already has exercise seed data in `src/db/seeds/exercises.ts`
2. You need to insert this data into Supabase
3. Create a one-time seed script or manually insert via SQL Editor

**Option B: Keep exercises in SQLite locally**

- Exercises are read-only and don't need to sync
- Keep them in local SQLite for offline access
- Only sync user-specific data (profile, workouts, weights) to Supabase

**Recommended:** Use Option B for now (keep exercises local), sync user data only.

---

### Step 4: Test the Authentication Flow

#### Test Email Magic Link (Easiest)

1. Start your app: `npm run ios` or `npm run android`
2. Complete the onboarding (name, bodyweight, experience, etc.)
3. On the "Save Your Progress" screen:
   - Enter your email address
   - Tap "Continue with Email"
4. Check your email inbox for the magic link
5. Click the magic link
6. You should be redirected back to the app (via `drift://` deep link)
7. Your data should now be saved to Supabase

**Troubleshooting:**
- If the deep link doesn't work, make sure `"scheme": "drift"` is in `app.json`
- Check Supabase logs: **Authentication** → **Logs**
- Check app logs: Look for `[Auth]` and `[Supabase]` console logs

#### Test Apple Sign In (iOS Only)

1. Build for TestFlight or real device (won't work in Expo Go)
2. Complete onboarding
3. Tap "Continue with Apple"
4. Follow Apple's authentication flow
5. Verify data is saved to Supabase

#### Test Google Sign In

1. Complete onboarding
2. Tap "Continue with Google"
3. Follow Google's authentication flow
4. Verify data is saved to Supabase

---

### Step 5: Verify Data in Supabase

After completing authentication:

1. Go to **Table Editor** in Supabase
2. Check these tables:
   - **user_profile** → Should have 1 row with your data
   - **working_weights** → Should have ~7 rows (initial weights)
   - **weekly_progress** → Should have 1 row (week 1)

3. Click on **Authentication** → **Users**
   - You should see your user account listed

---

## 🔧 Current Implementation Details

### Lazy Registration Flow

```
Step 1-5: Onboarding (name, bodyweight, experience, goals, schedule)
  ↓
Step 6: Preview Plan (show them what they're getting)
  ↓
Step 7: Auth Screen (Apple, Google, or Email)
  ↓
Authentication → Create Supabase Profile → Save All Data
  ↓
Success Screen → Redirect to App
```

### Data Flow

**When user authenticates:**
1. Supabase creates user account (`auth.users` table)
2. App creates user profile in `user_profile` table
3. App sets initial working weights in `working_weights` table
4. App creates first week in `weekly_progress` table
5. User is redirected to the main app with their data synced

**Row Level Security (RLS):**
- Users can only read/write their own data
- Enforced at the database level (can't be bypassed)
- Auth token is automatically included in all Supabase requests

---

## 🐛 Troubleshooting

### "User not authenticated" error

**Cause:** Auth token not present in Supabase requests

**Solution:**
1. Check if `supabase.auth.getUser()` returns a user
2. Verify auth state with: `supabase.auth.getSession()`
3. Check console logs for `[Auth]` errors

### Deep link not working (OAuth redirect fails)

**Cause:** App not registered to handle `drift://` URLs

**Solution:**
1. Verify `"scheme": "drift"` is in `app.json`
2. Rebuild the app: `expo prebuild --clean`
3. Test deep link manually: `xcrun simctl openurl booted drift://auth/callback`

### Magic link email not arriving

**Cause:** Supabase email service may be rate-limited or blocked

**Solutions:**
1. Check your email spam folder
2. Verify email in Supabase Dashboard: **Authentication** → **Users**
3. Check Supabase logs: **Authentication** → **Logs**
4. For production: Configure custom SMTP in Supabase

### Apple Sign In not working

**Cause:** Apple Sign In only works on real devices/TestFlight

**Solutions:**
1. Cannot test in Expo Go or iOS Simulator
2. Build for TestFlight: `eas build --platform ios`
3. Or use a real device with dev build

---

## 📝 Next Steps (Optional Enhancements)

### 1. Add "Skip for Now" Functionality

Currently, the "Skip for Now" button proceeds to the next step but doesn't save data.

**To implement:**
- Add anonymous user creation
- Store data locally in SQLite
- Prompt to create account later when data needs to sync

### 2. Add Loading States

Show a better loading indicator during authentication:
- "Signing in with Apple..."
- "Creating your account..."
- "Syncing your data..."

### 3. Add Error Handling

Improve error messages:
- Network errors: "Check your internet connection"
- Auth errors: "Authentication failed. Please try again."
- Data save errors: "Failed to save. Retrying..."

### 4. Add Offline Support

Implement a hybrid SQLite + Supabase approach:
- Always write to SQLite first (offline-first)
- Sync to Supabase when online
- Handle conflict resolution

### 5. Add Social Proof

On the auth screen, add:
- "Join 10,000+ lifters tracking their progress"
- "⭐⭐⭐⭐⭐ 4.9 rating on App Store"
- Testimonials from beta users

---

## 🎯 Testing Checklist

Before launching:

- [ ] SQL migration runs without errors
- [ ] Email magic link auth works end-to-end
- [ ] Apple Sign In works on TestFlight/real device
- [ ] Google Sign In works (if configured)
- [ ] User data appears in Supabase tables
- [ ] RLS policies prevent cross-user data access
- [ ] Deep linking redirects work correctly
- [ ] Error states are handled gracefully
- [ ] Loading states show during auth
- [ ] "Skip for Now" button has expected behavior

---

## 📞 Support

**Supabase Documentation:**
- Auth providers: https://supabase.com/docs/guides/auth
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

**Expo Documentation:**
- Deep linking: https://docs.expo.dev/guides/linking/
- OAuth: https://docs.expo.dev/guides/authentication/

**Common Issues:**
- Check `#supabase` tag on Stack Overflow
- Supabase Discord: https://discord.supabase.com

---

## ✨ Summary

You've successfully integrated:
- ✅ Cloud authentication (Apple, Google, Email)
- ✅ Cloud database with Supabase (Postgres)
- ✅ Row Level Security for data privacy
- ✅ Lazy registration UX (value first, auth second)
- ✅ Deep linking for OAuth redirects

**To go live:**
1. Run the SQL migration (Step 1)
2. Enable Email auth (Step 2.1) - Test immediately!
3. Configure Apple/Google (Step 2.2-2.3) - Optional for launch
4. Test the full flow (Step 4)
5. Verify data in Supabase (Step 5)

**Your app now has:**
- 🔐 Secure authentication
- ☁️ Cross-device data sync
- 💾 No data loss if phone is destroyed
- 📧 Passwordless login (magic links)
- 🍎 One-tap sign in (Apple/Google)

You're ready to ship! 🚀
