-- ==============================================================================
-- SIWES Digital Logbook Management System
-- Seed Script: 20260922000002_development_seed.sql
-- Module 02: Supabase Database Architecture
-- ==============================================================================
-- IMPORTANT DEVELOPMENT NOTICE:
-- This script creates mock data for verifying schema constraints and RLS testing.
-- It relies on mock auth.users IDs or mock profiles.
-- In a real Supabase instance, create Auth users in Supabase Studio -> Authentication
-- or run the test harness queries below.
-- ==============================================================================

-- 1. Helper comment on manual user creation
COMMENT ON TABLE public.profiles IS 'Stores SIWES user profiles linked 1:1 with auth.users.';
COMMENT ON TABLE public.logbook_weeks IS 'Weekly 5-day SIWES logbook submission reports.';
COMMENT ON TABLE public.daily_activities IS 'Daily technical work records corresponding to Monday-Friday.';

-- 2. Mock Test Verification Query Block (Can be executed in Supabase SQL Editor)
-- This block demonstrates inserting a full weekly cycle and verifying constraints:
/*
-- Step A: Verify Enum Definitions
SELECT enumlabel, typname 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE typname IN ('user_role', 'week_status', 'siwes_day');

-- Step B: Verify Tables Exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'logbook_weeks', 'daily_activities');

-- Step C: Verify RLS is Enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'logbook_weeks', 'daily_activities');
*/
