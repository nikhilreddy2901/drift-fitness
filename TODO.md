# DRIFT FITNESS - TODO LIST

## Emails from supabase are coming as an app by supabase blah blah, change it to a proper domain.
## Supabase auth for apple and google has personal email configured, change that to llc or domain specific.

## 🔥 PHASE 1: CRITICAL (Before Launch)

### Authentication & Cloud Sync
- [ ] **Set up Supabase project**
  - Create Supabase account and project
  - Configure authentication providers (Apple, Google, Email)
  - Set up database tables in PostgreSQL

- [ ] **Implement "Lazy Registration" Flow**
  - Add auth prompt after onboarding completion (Success screen)
  - Design "Save Your Plan" screen with social auth buttons
  - Implement Apple Sign-In integration
  - Implement Google Sign-In integration
  - Implement Email/Magic Link fallback
  - Add "Skip for now" option (with warning about data loss)

- [ ] **Database Migration**
  - Migrate SQLite schema to Supabase PostgreSQL
  - Create migration scripts for local → cloud sync
  - Implement data sync logic (bidirectional)
  - Add conflict resolution for offline changes
  - Test data persistence across devices

- [ ] **Local Data Migration on First Signup**
  - When user creates account, migrate existing local data to cloud
  - Merge local workouts, progress, and settings
  - Delete local data after successful migration
  - Handle edge cases (network failures, partial migrations)

---

## 🎯 PHASE 2: CORE FEATURES (Complete the App)

### Active Workout Screen
- [ ] **Implement ActiveWorkout component**
  - Exercise cards with set logging
  - Real-time volume tracking
  - Rest timer between sets
  - RPE input per set
  - Exercise swap functionality
  - Auto-progression logic (weight/reps)

- [ ] **Implement WorkoutSummary component**
  - Post-workout stats display
  - Volume completed vs target
  - Personal records achieved
  - Weekly bucket progress update
  - Share workout functionality

### Progress Tab
- [ ] **Build Progress screen**
  - Weekly volume charts (line/bar graphs)
  - Personal records list
  - Strength progression graphs
  - Body weight tracking over time
  - Volume distribution by muscle group

### Library Tab
- [ ] **Build Exercise Library**
  - Search and filter exercises
  - Exercise details (form tips, muscles worked)
  - Video demonstrations (optional)
  - Custom exercise creation
  - Exercise history and stats

### Profile Tab
- [ ] **Complete Profile screen**
  - Edit user settings (bodyweight, experience level)
  - Adjust volume targets manually
  - Training schedule preferences
  - Account management (change email, password)
  - App preferences (units, notifications)

---

## 📊 PHASE 3: MONETIZATION

### Subscription System
- [ ] **Integrate RevenueCat or similar**
  - Set up product IDs in App Store Connect
  - Implement subscription purchase flow
  - Create paywall screen (after free trial)
  - Add restore purchases functionality
  - Handle subscription status checks

- [ ] **Free Trial Logic**
  - Define trial period (7 days or 5 workouts)
  - Track trial usage
  - Show trial status in UI
  - Prompt for subscription when trial ends
  - Lock features after trial (with upgrade prompts)

- [ ] **Paywall Design**
  - Create premium paywall screen
  - Highlight premium features
  - Show pricing ($15/month)
  - Add testimonials/social proof
  - A/B test messaging

---

## ✨ PHASE 4: POLISH & ENHANCEMENTS

### UI/UX Improvements
- [ ] **Animations & Transitions**
  - Smooth transitions between screens
  - Loading states with skeletons
  - Success animations (confetti on PR, etc.)
  - Gesture-based interactions

- [ ] **Notifications**
  - Workout reminders
  - Rest day reminders
  - Weekly summary notifications
  - Streak notifications

- [ ] **Onboarding Improvements**
  - Add app icon (using "Kinetic Stack" logo)
  - Create App Store assets (screenshots, preview video)
  - App Store listing copy

### Data & Analytics
- [ ] **Analytics Integration**
  - Track user behavior (Mixpanel, Amplitude, or PostHog)
  - Monitor conversion funnel
  - Track feature usage
  - A/B testing framework

- [ ] **Crash Reporting**
  - Set up Sentry or similar
  - Monitor error rates
  - Track performance metrics

### Advanced Features
- [ ] **AI Workout Adjustments**
  - Implement check-in data processing (sleep, soreness, alcohol)
  - Volume reduction algorithm based on recovery
  - Exercise substitution logic for soreness/injury
  - Deload week detection and implementation

- [ ] **Progressive Overload Logic**
  - Auto-increment weights based on RPE
  - Track 1RM estimates
  - Linear vs. wave loading options
  - Plateau detection and adjustment

- [ ] **Social Features (Optional)**
  - Share workouts to social media
  - Leaderboards (optional)
  - Community challenges (optional)

---

## 🐛 PHASE 5: BUG FIXES & KNOWN ISSUES

### Current Issues to Address
- [ ] None currently - app is in early development

### Testing Checklist
- [ ] Test onboarding flow end-to-end
- [ ] Test workout logging flow
- [ ] Test volume bucket calculations
- [ ] Test data persistence across app restarts
- [ ] Test offline functionality
- [ ] Test multi-device sync (after Supabase)
- [ ] Test edge cases (missed workouts, week rollovers)

---

## 📱 PHASE 6: LAUNCH PREPARATION

### App Store Submission
- [ ] Create App Store Connect account
- [ ] Generate app icon (all required sizes)
- [ ] Create App Store screenshots (all device sizes)
- [ ] Write App Store description
- [ ] Record app preview video
- [ ] Set up privacy policy URL
- [ ] Set up terms of service URL
- [ ] Configure App Store metadata (keywords, categories)

### Marketing
- [ ] Create landing page (web)
- [ ] Set up social media accounts
- [ ] Create launch announcement content
- [ ] Email list for beta testers
- [ ] Product Hunt launch plan (optional)

---

## 🔧 TECHNICAL DEBT & REFACTORING

### Code Quality
- [ ] Add TypeScript strict mode (if not already)
- [ ] Add unit tests for critical logic (workout calculations, volume tracking)
- [ ] Add E2E tests (Detox or similar)
- [ ] Document API/database schema
- [ ] Add code comments for complex logic

### Performance
- [ ] Optimize workout logging performance
- [ ] Implement lazy loading for large lists
- [ ] Optimize images and assets
- [ ] Reduce app bundle size

---

## 📝 NOTES & DECISIONS

### Architecture Decisions
- **Database**: SQLite (local) → Supabase PostgreSQL (cloud)
- **Auth**: Supabase Auth with Apple, Google, Email
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Monetization**: RevenueCat (TBD) or native StoreKit

### Design System
- **Logo**: "Kinetic Stack" (3 weight plates, italic lean, bottom blue)
- **Colors**: Blue (#2563eb), Purple, Orange, Dark Zinc (#18181b)
- **Font**: System fonts (SF Pro on iOS)
- **Copy Strategy**: Value-focused, not feature-focused

### Product Strategy
- **Pricing**: $15/month subscription
- **Free Trial**: 7 days or 5 workouts
- **Unique Selling Proposition**: Auto-adjusts for missed workouts (volume redistribution)
- **Target Audience**: Busy lifters who want guaranteed progression despite inconsistent schedules

---

## 🎯 IMMEDIATE NEXT STEPS

1. ✅ Complete onboarding flow (DONE)
2. ✅ Create custom "Kinetic Stack" logo (DONE)
3. ✅ Polish onboarding copy (DONE)
4. ⏳ Finish remaining placeholder screens (Workout, Progress, Library, Profile)
5. ⏳ Set up Supabase and implement authentication
6. ⏳ Implement active workout flow
7. ⏳ Add subscription/monetization

---

**Last Updated**: December 2024
**Status**: Early Development (Pre-Alpha)
