-- ============================================================================
-- DRIFT FITNESS - EXERCISE LIBRARY SEED DATA
-- Run this in Supabase SQL Editor to populate the exercises table
-- ============================================================================

INSERT INTO exercises (id, name, muscle_group, slot, type, equipment, load_type, rep_range_min, rep_range_max, movement_pattern, primary_muscle, bodyweight_multiplier) VALUES
-- PUSH - SLOT 1
('barbell_bench', 'Barbell Bench Press', 'push', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'horizontalPush', NULL, NULL),
('db_bench', 'Dumbbell Bench Press', 'push', 1, 'compound', 'dumbbell', 'unilateral', 5, 8, 'horizontalPush', NULL, NULL),
('machine_chest_press', 'Machine Chest Press', 'push', 1, 'compound', 'machine', 'bilateral', 5, 8, 'horizontalPush', NULL, NULL),
('barbell_ohp', 'Barbell Overhead Press', 'push', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'verticalPush', NULL, NULL),
('db_shoulder_press', 'Dumbbell Shoulder Press', 'push', 1, 'compound', 'dumbbell', 'unilateral', 5, 8, 'verticalPush', NULL, NULL),
('weighted_dips', 'Weighted Dips', 'push', 1, 'compound', 'bodyweight', 'bilateral', 5, 8, 'verticalPush', NULL, 1.0),
('smith_bench', 'Smith Machine Bench Press', 'push', 1, 'compound', 'smithMachine', 'bilateral', 5, 8, 'horizontalPush', NULL, NULL),

-- PUSH - SLOT 2
('incline_barbell_press', 'Incline Barbell Press', 'push', 2, 'compound', 'barbell', 'bilateral', 8, 12, 'horizontalPush', NULL, NULL),
('incline_db_press', 'Incline Dumbbell Press', 'push', 2, 'compound', 'dumbbell', 'unilateral', 8, 12, 'horizontalPush', NULL, NULL),
('decline_press', 'Decline Barbell Press', 'push', 2, 'compound', 'barbell', 'bilateral', 8, 12, 'horizontalPush', NULL, NULL),
('cable_press', 'Cable Chest Press', 'push', 2, 'compound', 'cable', 'unilateral', 8, 12, 'horizontalPush', NULL, NULL),
('machine_shoulder_press', 'Machine Shoulder Press', 'push', 2, 'compound', 'machine', 'bilateral', 8, 12, 'verticalPush', NULL, NULL),
('landmine_press', 'Landmine Press', 'push', 2, 'compound', 'barbell', 'bilateral', 8, 12, 'verticalPush', NULL, NULL),

-- PUSH - SLOT 3
('cable_fly', 'Cable Chest Fly', 'push', 3, 'isolation', 'cable', 'unilateral', 12, 15, NULL, 'chest', NULL),
('db_fly', 'Dumbbell Chest Fly', 'push', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'chest', NULL),
('pec_deck', 'Pec Deck Fly', 'push', 3, 'isolation', 'machine', 'bilateral', 12, 15, NULL, 'chest', NULL),
('lateral_raise', 'Dumbbell Lateral Raise', 'push', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'shoulders', NULL),
('cable_lateral_raise', 'Cable Lateral Raise', 'push', 3, 'isolation', 'cable', 'unilateral', 12, 15, NULL, 'shoulders', NULL),
('front_raise', 'Dumbbell Front Raise', 'push', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'shoulders', NULL),
('tricep_pushdown', 'Cable Tricep Pushdown', 'push', 3, 'isolation', 'cable', 'bilateral', 12, 15, NULL, 'triceps', NULL),
('overhead_tricep_ext', 'Overhead Tricep Extension', 'push', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'triceps', NULL),
('dips_bodyweight', 'Bodyweight Dips', 'push', 3, 'isolation', 'bodyweight', 'bilateral', 12, 15, NULL, 'triceps', 1.0),
('pushups', 'Push-ups', 'push', 3, 'isolation', 'bodyweight', 'bilateral', 12, 15, NULL, 'chest', 0.65),

-- PULL - SLOT 1
('barbell_deadlift', 'Barbell Deadlift', 'pull', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'hinge', NULL, NULL),
('barbell_row', 'Barbell Row', 'pull', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'horizontalPull', NULL, NULL),
('weighted_pullup', 'Weighted Pull-up', 'pull', 1, 'compound', 'bodyweight', 'bilateral', 5, 8, 'verticalPull', NULL, 1.0),
('weighted_chinup', 'Weighted Chin-up', 'pull', 1, 'compound', 'bodyweight', 'bilateral', 5, 8, 'verticalPull', NULL, 1.0),
('tbar_row', 'T-Bar Row', 'pull', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'horizontalPull', NULL, NULL),
('machine_row', 'Machine Row', 'pull', 1, 'compound', 'machine', 'bilateral', 5, 8, 'horizontalPull', NULL, NULL),
('lat_pulldown', 'Lat Pulldown', 'pull', 1, 'compound', 'cable', 'bilateral', 5, 8, 'verticalPull', NULL, NULL),

-- PULL - SLOT 2
('db_row', 'Dumbbell Row', 'pull', 2, 'compound', 'dumbbell', 'unilateral', 8, 12, 'horizontalPull', NULL, NULL),
('cable_row', 'Seated Cable Row', 'pull', 2, 'compound', 'cable', 'bilateral', 8, 12, 'horizontalPull', NULL, NULL),
('chest_supported_row', 'Chest Supported Row', 'pull', 2, 'compound', 'machine', 'bilateral', 8, 12, 'horizontalPull', NULL, NULL),
('face_pull', 'Face Pull', 'pull', 2, 'compound', 'cable', 'bilateral', 8, 12, 'horizontalPull', NULL, NULL),
('pendlay_row', 'Pendlay Row', 'pull', 2, 'compound', 'barbell', 'bilateral', 8, 12, 'horizontalPull', NULL, NULL),
('underhand_lat_pulldown', 'Underhand Lat Pulldown', 'pull', 2, 'compound', 'cable', 'bilateral', 8, 12, 'verticalPull', NULL, NULL),

-- PULL - SLOT 3
('barbell_curl', 'Barbell Curl', 'pull', 3, 'isolation', 'barbell', 'bilateral', 12, 15, NULL, 'biceps', NULL),
('db_curl', 'Dumbbell Curl', 'pull', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'biceps', NULL),
('hammer_curl', 'Hammer Curl', 'pull', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'biceps', NULL),
('cable_curl', 'Cable Curl', 'pull', 3, 'isolation', 'cable', 'bilateral', 12, 15, NULL, 'biceps', NULL),
('preacher_curl', 'Preacher Curl', 'pull', 3, 'isolation', 'barbell', 'bilateral', 12, 15, NULL, 'biceps', NULL),
('rear_delt_fly', 'Rear Delt Fly', 'pull', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'back', NULL),
('shrugs', 'Dumbbell Shrugs', 'pull', 3, 'isolation', 'dumbbell', 'unilateral', 12, 15, NULL, 'back', NULL),
('pullups_bodyweight', 'Bodyweight Pull-ups', 'pull', 3, 'isolation', 'bodyweight', 'bilateral', 12, 15, NULL, 'back', 1.0),

-- LEGS - SLOT 1
('back_squat', 'Barbell Back Squat', 'legs', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'squat', NULL, NULL),
('front_squat', 'Barbell Front Squat', 'legs', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'squat', NULL, NULL),
('leg_press', 'Leg Press', 'legs', 1, 'compound', 'machine', 'bilateral', 5, 8, 'squat', NULL, NULL),
('hack_squat', 'Hack Squat', 'legs', 1, 'compound', 'machine', 'bilateral', 5, 8, 'squat', NULL, NULL),
('smith_squat', 'Smith Machine Squat', 'legs', 1, 'compound', 'smithMachine', 'bilateral', 5, 8, 'squat', NULL, NULL),
('romanian_deadlift', 'Romanian Deadlift', 'legs', 1, 'compound', 'barbell', 'bilateral', 5, 8, 'hinge', NULL, NULL),
('bulgarian_split_squat', 'Bulgarian Split Squat', 'legs', 1, 'compound', 'dumbbell', 'unilateral', 5, 8, 'lunge', NULL, NULL),

-- LEGS - SLOT 2
('goblet_squat', 'Goblet Squat', 'legs', 2, 'compound', 'dumbbell', 'bilateral', 8, 12, 'squat', NULL, NULL),
('db_lunges', 'Dumbbell Lunges', 'legs', 2, 'compound', 'dumbbell', 'unilateral', 8, 12, 'lunge', NULL, NULL),
('walking_lunges', 'Walking Lunges', 'legs', 2, 'compound', 'dumbbell', 'unilateral', 8, 12, 'lunge', NULL, NULL),
('barbell_lunges', 'Barbell Lunges', 'legs', 2, 'compound', 'barbell', 'bilateral', 8, 12, 'lunge', NULL, NULL),
('step_ups', 'Dumbbell Step-ups', 'legs', 2, 'compound', 'dumbbell', 'unilateral', 8, 12, 'lunge', NULL, NULL),
('db_rdl', 'Dumbbell Romanian Deadlift', 'legs', 2, 'compound', 'dumbbell', 'unilateral', 8, 12, 'hinge', NULL, NULL),

-- LEGS - SLOT 3
('leg_extension', 'Leg Extension', 'legs', 3, 'isolation', 'machine', 'bilateral', 12, 15, NULL, 'quads', NULL),
('leg_curl', 'Leg Curl', 'legs', 3, 'isolation', 'machine', 'bilateral', 12, 15, NULL, 'hamstrings', NULL),
('seated_leg_curl', 'Seated Leg Curl', 'legs', 3, 'isolation', 'machine', 'bilateral', 12, 15, NULL, 'hamstrings', NULL),
('calf_raise', 'Standing Calf Raise', 'legs', 3, 'isolation', 'machine', 'bilateral', 12, 15, NULL, 'calves', NULL),
('seated_calf_raise', 'Seated Calf Raise', 'legs', 3, 'isolation', 'machine', 'bilateral', 12, 15, NULL, 'calves', NULL),
('hip_thrust', 'Barbell Hip Thrust', 'legs', 3, 'isolation', 'barbell', 'bilateral', 12, 15, NULL, 'hamstrings', NULL),
('glute_bridge', 'Glute Bridge', 'legs', 3, 'isolation', 'bodyweight', 'bilateral', 12, 15, NULL, 'hamstrings', 0.75),
('bodyweight_squat', 'Bodyweight Squat', 'legs', 3, 'isolation', 'bodyweight', 'bilateral', 12, 15, NULL, 'quads', 0.75)

ON CONFLICT (id) DO NOTHING;
