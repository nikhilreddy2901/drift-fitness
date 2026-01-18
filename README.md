# 🏋️ Drift Fitness App

**The Adaptive Fitness App - Built for Adherence, Not Perfection**

## Project Status: MVP COMPLETE ✅

All core features have been implemented and are ready for testing!

---

## ✅ Completed Features

### Phase 1: Foundation (Engine Room)

#### Ticket #1: The DNA (Project Init & Schema) ✅
- ✅ Expo TypeScript project with Expo Router
- ✅ Complete type system ([src/types/index.ts](src/types/index.ts))
- ✅ SQLite database with 10 tables
- ✅ Repository pattern for data access
- ✅ Theme & layout constants

#### Ticket #2: Core Utilities ✅
- ✅ **Workout Generator** ([src/utils/workoutGenerator.ts](src/utils/workoutGenerator.ts))
  - Slot Theory implementation (50/30/20 volume distribution)
  - Mood-based volume adjustment
  - Drift redistribution logic
  - Sets/reps calculation
- ✅ **Drift Engine** ([src/utils/driftEngine.ts](src/utils/driftEngine.ts))
  - Capped proportional redistribution (20% max per session)
  - Forgiveness tolerance (±10%)
  - Overflow handling
- ✅ **Volume Math** ([src/utils/volumeMath.ts](src/utils/volumeMath.ts))
  - Bodyweight exercise calculations
  - Unilateral load handling
  - Volume tracking
- ✅ **Progressive Overload** ([src/utils/overloadLogic.ts](src/utils/overloadLogic.ts))
  - RPE-based progression
  - Deload week detection (every 4th week)
  - Safety caps (2× starting volume max)
- ✅ **Swap Logic** ([src/utils/swapLogic.ts](src/utils/swapLogic.ts))
  - Movement pattern matching
  - Equipment-based grouping
  - Valid alternative filtering

#### Ticket #3: Exercise Library ✅
- ✅ 56 exercises seeded in database
- ✅ Categorized by muscle group (Push/Pull/Legs)
- ✅ Slot assignments (Heavy/Moderate/Isolation)
- ✅ Equipment tags
- ✅ Movement patterns
- ✅ Exercise ratio fallbacks ([src/db/seeds/exerciseRatios.ts](src/db/seeds/exerciseRatios.ts))

#### Ticket #4: State Management (The Glue) ✅
- ✅ **useWorkoutStore** ([src/stores/useWorkoutStore.ts](src/stores/useWorkoutStore.ts))
  - Active workout management
  - Set logging
  - Drift calculation
  - Weekly progress tracking
- ✅ **useUserStore** ([src/stores/useUserStore.ts](src/stores/useUserStore.ts))
  - Profile management
  - Exercise library access
  - Working weights tracking
  - Week progression
- ✅ **useCheckInStore** ([src/stores/useCheckInStore.ts](src/stores/useCheckInStore.ts))
  - Mood/sleep/soreness state
  - Check-in data helpers

### Phase 2: User Interface

#### Ticket #5: Dashboard (Home Screen) ✅
- ✅ **Weekly Buckets View** ([app/index.tsx](app/index.tsx))
  - Push/Pull/Legs progress bars
  - Color-coded by muscle group (Red/Green/Orange)
  - % completion display
  - Remaining volume display
  - Pull-to-refresh
- ✅ **BucketCard Component** ([src/components/BucketCard.tsx](src/components/BucketCard.tsx))
  - Visual progress indicator
  - Completion badges
  - Start workout button
  - Disabled states

#### Ticket #6: Onboarding Flow ✅
- ✅ **Onboarding Screen** ([app/onboarding.tsx](app/onboarding.tsx))
  - Bodyweight input
  - Experience level selection (Beginner/Intermediate/Advanced)
  - Auto-redirect from home if no profile
  - First week initialization
  - Starter working weights seeding

#### Ticket #7: Active Workout UI ✅
- ✅ **Workout Screen** ([app/workout.tsx](app/workout.tsx))
  - Exercise list with live progress
  - Set-by-set logging
  - Volume tracking
  - Finish workout with RPE input
  - Cancel workout confirmation
- ✅ **WorkoutExerciseCard** ([src/components/WorkoutExerciseCard.tsx](src/components/WorkoutExerciseCard.tsx))
  - Exercise name & swap button
  - Set grid (Set # | Weight | Reps | Checkbox)
  - Visual feedback on completion
  - Logged set tracking
- ✅ **SwapModal** ([src/components/SwapModal.tsx](src/components/SwapModal.tsx))
  - Valid swap alternatives
  - Equipment grouping
  - Same-slot filtering
  - Movement pattern matching

#### Ticket #8: Check-In Modal ✅
- ✅ **Pre-Workout Check-In** ([src/components/CheckInModal.tsx](src/components/CheckInModal.tsx))
  - Mood selection (Great/Okay/Rough) with emojis
  - Sleep toggle (Good Sleep / Poor Sleep)
  - Soreness toggle (Fresh / Sore)
  - Muscle group badge
  - Adaptive workout generation based on check-in

---

## Complete User Journey

### First Launch
1. ✅ App opens → Database initializes → 56 exercises seeded
2. ✅ Auto-redirects to [onboarding screen](app/onboarding.tsx)
3. ✅ User enters:
   - Bodyweight: 180 lbs
   - Experience: Intermediate (30k lbs/week)
4. ✅ Profile created, working weights seeded, first week initialized
5. ✅ Redirects to [dashboard](app/index.tsx)

### Dashboard View
```
┌────────────────────────────────┐
│   Week of Dec 7  │  Week 1     │
├────────────────────────────────┤
│ PUSH            0%             │
│ ███░░░░░░░░░░░░░               │
│ 10,000 lbs left                │
│ [ Start PUSH ]                 │
├────────────────────────────────┤
│ PULL            0%             │
│ ███░░░░░░░░░░░░░               │
│ 10,000 lbs left                │
│ [ Start PULL ]                 │
├────────────────────────────────┤
│ LEGS            0%             │
│ ███░░░░░░░░░░░░░               │
│ 10,000 lbs left                │
│ [ Start LEGS ]                 │
└────────────────────────────────┘
```

### Starting a Workout
1. ✅ User taps "Start PUSH"
2. ✅ **Check-In Modal appears:**
   ```
   How are you feeling?

   😃 Great | 😐 Okay | 😵 Rough

   Good Sleep?  [Toggle ON]
   Not Sore?    [Toggle ON]

   [ Start Workout ]
   ```
3. ✅ User selects mood and confirms
4. ✅ Workout generates (uses Slot Theory + mood adjustment + drift)
5. ✅ Navigates to [workout screen](app/workout.tsx)

### Active Workout
```
PUSH Workout
85% Complete | 8,500 / 10,000 lbs

┌─────────────────────────────┐
│ 1. Barbell Bench Press  ⇄   │
│ ┌─────┬─────┬──────┬────┐   │
│ │ Set │ Lbs │ Reps │ ✓  │   │
│ ├─────┼─────┼──────┼────┤   │
│ │  1  │ 135 │  6   │ ✓  │   │
│ │  2  │ 135 │  6   │ ✓  │   │
│ │  3  │ 135 │  6   │ ✓  │   │
│ │  4  │ 135 │  6   │ □  │   │
│ └─────┴─────┴──────┴────┘   │
└─────────────────────────────┘

[ Finish Workout ]  [ Cancel ]
```

### Finishing Workout
1. ✅ User taps "Finish Workout"
2. ✅ RPE prompt appears: "Rate difficulty (1-10)"
3. ✅ User enters RPE: 7
4. ✅ Drift calculated (missed volume redistributed)
5. ✅ Workout saved to database
6. ✅ Weekly progress updated
7. ✅ Returns to dashboard with updated buckets

---

## Architecture

### Database Schema (SQLite)
- `exercises` - 56 pre-seeded exercises
- `user_profile` - User data, weekly targets, current week
- `working_weights` - Per-exercise working weights
- `workouts` - Workout sessions
- `workout_exercises` - Exercises within workouts
- `logged_sets` - Individual set logs
- `weekly_progress` - Bucket tracking
- `drift_items` - Missed volume redistribution
- `user_stats` - Key-value store
- `exercise_ratios` - Weight estimation fallbacks

### State Management (Zustand)
- **Workout Store** - Active session, weekly progress, drift
- **User Store** - Profile, exercises, working weights
- **Check-In Store** - Mood, sleep, soreness

### Core Algorithms

**Slot Theory (50/30/20)**
- Slot 1: Heavy compounds (5-8 reps, 50% volume)
- Slot 2: Moderate compounds (8-12 reps, 30% volume)
- Slot 3: Isolations (12-15 reps, 20% volume)

**Drift Redistribution**
- Cap: Max +20% per session
- Tolerance: ±10% forgiveness
- Overflow: Excess volume forgiven (not carried over)

**Progressive Overload (RPE-Based)**
- RPE ≤ 6: +5% (weeks 1-4) or +2.5% (weeks 5+)
- RPE 7-8: +2.5%
- RPE ≥ 9: 0% (maintain)
- Deload: Every 4th week (-40% volume)
- Hard cap: Never exceed 2× starting volume

---

## Project Structure

```
drift-fitness/
├── app/                        # Expo Router screens
│   ├── _layout.tsx            # Root layout with DB init
│   ├── index.tsx              # Dashboard (buckets)
│   ├── onboarding.tsx         # First-time setup
│   └── workout.tsx            # Active workout logger
├── src/
│   ├── components/            # UI components
│   │   ├── BucketCard.tsx     # Weekly bucket visualization
│   │   ├── CheckInModal.tsx   # Pre-workout check-in
│   │   ├── SwapModal.tsx      # Exercise swap selector
│   │   └── WorkoutExerciseCard.tsx  # Set logging card
│   ├── db/                    # Database layer
│   │   ├── schema.ts          # Table definitions
│   │   ├── client.ts          # SQLite client + repos
│   │   ├── init.ts            # Initialization
│   │   └── seeds/             # Exercise data
│   ├── stores/                # Zustand state
│   │   ├── useWorkoutStore.ts
│   │   ├── useUserStore.ts
│   │   └── useCheckInStore.ts
│   ├── utils/                 # Core algorithms
│   │   ├── workoutGenerator.ts
│   │   ├── driftEngine.ts
│   │   ├── volumeMath.ts
│   │   ├── overloadLogic.ts
│   │   └── swapLogic.ts
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   └── constants/
│       └── layout.ts          # Theme & design system
├── package.json
├── tsconfig.json
└── app.json
```

---

## Tech Stack

- **Framework:** Expo (React Native)
- **Language:** TypeScript (Strict mode)
- **Routing:** Expo Router (File-based)
- **Database:** SQLite (expo-sqlite)
- **State:** Zustand
- **Date Utilities:** date-fns
- **Styling:** React Native StyleSheet + theme constants
- **Target:** iOS & Android

---

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Type check
npx tsc --noEmit
```

---

## Design Philosophy

1. **Adherence > Perfection**
   - Forgives missed workouts (Sunday reset)
   - Redistributes drift intelligently (20% cap)
   - Adjusts to user's energy level (check-in)

2. **Weekly Accumulation**
   - Body adapts on 7-day cycles, not daily
   - Buckets fill throughout the week
   - No guilt for missing individual sessions

3. **Biomechanical Hierarchy**
   - Slot Theory respects fatigue management
   - Heavy → Moderate → Isolation progression
   - Movement pattern-based swaps

4. **User Sovereignty**
   - Can swap any exercise
   - Can adjust working weights
   - Can override suggestions

5. **Local-First Architecture**
   - Works completely offline
   - Zero server costs
   - Instant performance
   - Privacy-focused (data never leaves device)

---

## Key Features

### ✅ Adaptive Workout Generation
- Auto-generates workouts from weekly bucket targets
- Adjusts volume based on check-in (mood/sleep/soreness)
- Redistributes missed volume intelligently

### ✅ Smart Drift Algorithm
- Proportional redistribution across remaining sessions
- 20% safety cap per session
- ±10% forgiveness tolerance
- Overflow handling (excess forgiven)

### ✅ RPE-Based Progression
- Adjusts weekly targets based on effort
- Automatic deload weeks (every 4th week)
- Hard cap at 2× starting volume

### ✅ Exercise Variety
- 56 pre-loaded exercises
- Equipment-based grouping
- Movement pattern matching
- Smart swap alternatives

### ✅ Pre-Workout Check-In
- Mood assessment (Great/Okay/Rough)
- Sleep quality toggle
- Soreness status toggle
- Adapts workout accordingly

### ✅ Real-Time Progress Tracking
- Live bucket completion %
- Volume remaining display
- Set-by-set logging
- Weekly summary

---

## Known Limitations (MVP Scope)

- No unlog functionality (once a set is logged, it's permanent)
- No edit functionality for logged sets
- No workout history view
- No analytics/charts
- No cloud sync (local-only)
- No social features
- No exercise demos/videos
- No rest timer

---

## Next Steps (Post-MVP)

### Priority 1: Polish
- [ ] Add workout history screen
- [ ] Add analytics/progress charts
- [ ] Add rest timer between sets
- [ ] Add edit/delete logged sets
- [ ] Add toast notifications for errors

### Priority 2: Engagement
- [ ] Weekly streak tracking
- [ ] Progress photos timeline
- [ ] Achievement badges
- [ ] Shareable workout summaries

### Priority 3: Advanced Features
- [ ] Custom exercise creation
- [ ] Workout templates
- [ ] Exercise video demos
- [ ] Advanced analytics (volume load trends)
- [ ] Export data (CSV/JSON)

### Priority 4: Cloud & Social
- [ ] Cloud backup (optional)
- [ ] Multi-device sync
- [ ] Share workouts with friends
- [ ] Community challenges

---

## Development Notes

### TypeScript Compilation
✅ All code compiles without errors
✅ Strict mode enabled
✅ Full type safety across stores, utils, and components

### Code Quality
- ✅ Consistent naming conventions
- ✅ Comprehensive inline documentation
- ✅ Repository pattern for data access
- ✅ Separation of concerns (stores, utils, components)
- ✅ DRY principles followed

### Performance
- ✅ Local-first (zero network latency)
- ✅ Batch database operations
- ✅ Efficient Zustand stores (minimal re-renders)
- ✅ Lazy loading where possible

---

**Version:** 1.0.0-MVP
**Last Updated:** 2025-12-07
**Status:** Ready for Testing 🚀

---

## License

MIT

---

## Acknowledgments

Built with the "Slot Theory" and "Drift Algorithm" principles for sustainable, adherence-focused fitness training.
