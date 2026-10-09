-- ==============================================================================
-- SIWES Digital Logbook Management System
-- Migration: 20260922000001_siwes_core_schema.sql
-- Module 02: Supabase Database Architecture
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
-- User roles supported by the system
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'admin');
  END IF;
END $$;

-- Week status lifecycle: draft -> submitted -> approved OR returned -> submitted
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'week_status') THEN
    CREATE TYPE week_status AS ENUM ('draft', 'submitted', 'approved', 'returned');
  END IF;
END $$;

-- Day of week for strict 5-day SIWES cycle
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'siwes_day') THEN
    CREATE TYPE siwes_day AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
  END IF;
END $$;

-- 3. REUSABLE TRIGGER FUNCTIONS
-- Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES

-- ------------------------------------------------------------------------------
-- 4.1 PROFILES TABLE
-- 1:1 relationship with auth.users (id references auth.users.id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'student',
  matric_number TEXT UNIQUE,
  institution TEXT,
  department TEXT,
  organisation TEXT,
  siwes_start_date DATE,
  siwes_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: Matric number is required for students
  CONSTRAINT check_matric_if_student CHECK (
    role != 'student' OR (matric_number IS NOT NULL AND LENGTH(TRIM(matric_number)) > 0)
  ),
  -- Constraint: SIWES end date must be after start date if both provided
  CONSTRAINT check_siwes_dates CHECK (
    siwes_start_date IS NULL OR siwes_end_date IS NULL OR siwes_end_date >= siwes_start_date
  )
);

-- Trigger for profiles.updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.2 LOGBOOK WEEKS TABLE
-- Represents 1 student's weekly 5-day report
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logbook_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  status week_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_remark TEXT,
  admin_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: A student cannot have duplicate records for the same week
  CONSTRAINT uq_student_week UNIQUE (student_id, week_number),

  -- Integrity constraint: If reviewed, reviewed_at should be present
  CONSTRAINT check_review_metadata CHECK (
    (reviewed_at IS NULL AND reviewed_by IS NULL) OR (reviewed_at IS NOT NULL)
  ),

  -- Integrity constraint: If submitted, submitted_at must be present
  CONSTRAINT check_submitted_metadata CHECK (
    (status = 'draft' AND submitted_at IS NULL) OR
    (status IN ('submitted', 'approved', 'returned') AND submitted_at IS NOT NULL)
  )
);

-- Trigger for logbook_weeks.updated_at
DROP TRIGGER IF EXISTS set_logbook_weeks_updated_at ON public.logbook_weeks;
CREATE TRIGGER set_logbook_weeks_updated_at
  BEFORE UPDATE ON public.logbook_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.3 DAILY ACTIVITIES TABLE
-- Represents individual daily entries for Monday-Friday within a weekly report
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.logbook_weeks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  day siwes_day NOT NULL,
  activity_date DATE NOT NULL,
  title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
  activity TEXT NOT NULL CHECK (LENGTH(TRIM(activity)) > 0),
  equipment_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: Exactly one entry per day for a given weekly report
  CONSTRAINT uq_week_day UNIQUE (week_id, day),

  -- Constraint: A student cannot log duplicate dates across their activities
  CONSTRAINT uq_student_activity_date UNIQUE (student_id, activity_date)
);

-- Trigger for daily_activities.updated_at
DROP TRIGGER IF EXISTS set_daily_activities_updated_at ON public.daily_activities;
CREATE TRIGGER set_daily_activities_updated_at
  BEFORE UPDATE ON public.daily_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_matric_number ON public.profiles(matric_number);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_logbook_weeks_student_id ON public.logbook_weeks(student_id);
CREATE INDEX IF NOT EXISTS idx_logbook_weeks_status ON public.logbook_weeks(status);
CREATE INDEX IF NOT EXISTS idx_logbook_weeks_student_status ON public.logbook_weeks(student_id, status);
CREATE INDEX IF NOT EXISTS idx_logbook_weeks_reviewed_by ON public.logbook_weeks(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_daily_activities_week_id ON public.daily_activities(week_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_student_id ON public.daily_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_activity_date ON public.daily_activities(activity_date);

-- ------------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- SECURITY DEFINER functions prevent recursive policy evaluation and guarantee
-- that role checks cannot be spoofed by client requests.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_week_editable_by_student(check_week_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.logbook_weeks
    WHERE id = check_week_id
      AND student_id = auth.uid()
      AND status IN ('draft', 'returned')
  );
$$;

-- ------------------------------------------------------------------------------
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- 8.1 PROFILES POLICIES
-- ==============================================================================

-- Students can read their own profile; Admins can read all profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin()
  );

-- Profile creation: User can insert their own profile on registration or Admin can create
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Normal student self-insert must force role = 'student' and id = auth.uid()
    (id = auth.uid() AND role = 'student')
    OR
    -- Admins can insert profiles for any user/role
    public.is_admin()
  );

-- Profile updates:
-- Students can update their own personal info BUT CANNOT change their role or email
-- Admins can update any profile including roles
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    -- Admin can update anything
    public.is_admin()
    OR
    -- Student updating own profile cannot change role or id
    (
      id = auth.uid() 
      AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      AND id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Deletion: Only administrators can delete a profile
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- ==============================================================================
-- 8.2 LOGBOOK WEEKS POLICIES
-- ==============================================================================

-- Select: Student views their own weeks; Admin views all weeks
DROP POLICY IF EXISTS "logbook_weeks_select_policy" ON public.logbook_weeks;
CREATE POLICY "logbook_weeks_select_policy"
  ON public.logbook_weeks
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR public.is_admin()
  );

-- Insert: Student can only create weeks for themselves with initial status 'draft'
DROP POLICY IF EXISTS "logbook_weeks_insert_policy" ON public.logbook_weeks;
CREATE POLICY "logbook_weeks_insert_policy"
  ON public.logbook_weeks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND status = 'draft' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR
    public.is_admin()
  );

-- Update:
-- 1. Student can update their week when status is 'draft' or 'returned' (e.g. submitting report)
--    Students CANNOT alter admin_remark, admin_feedback, reviewed_at, or set status to 'approved'
-- 2. Admins can update any week (e.g. reviewing, approving, returning, giving remarks)
DROP POLICY IF EXISTS "logbook_weeks_update_policy" ON public.logbook_weeks;
CREATE POLICY "logbook_weeks_update_policy"
  ON public.logbook_weeks
  FOR UPDATE
  TO authenticated
  USING (
    -- Can target this row if owner or admin
    student_id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    -- Admin has full review authority
    public.is_admin()
    OR
    -- Student updating own week:
    (
      student_id = auth.uid()
      -- Must currently be in editable state
      AND (SELECT status FROM public.logbook_weeks WHERE id = logbook_weeks.id) IN ('draft', 'returned')
      -- Can transition to draft or submitted only (cannot self-approve)
      AND status IN ('draft', 'submitted')
      -- Cannot tamper with admin review columns
      AND reviewed_at IS NULL
      AND reviewed_by IS NULL
      AND admin_remark IS NULL
      AND admin_feedback IS NULL
    )
  );

-- Delete: Student can delete a week ONLY if it is still a 'draft'
-- Admin can delete any week if required for maintenance
DROP POLICY IF EXISTS "logbook_weeks_delete_policy" ON public.logbook_weeks;
CREATE POLICY "logbook_weeks_delete_policy"
  ON public.logbook_weeks
  FOR DELETE
  TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'draft')
    OR
    public.is_admin()
  );

-- ==============================================================================
-- 8.3 DAILY ACTIVITIES POLICIES
-- ==============================================================================

-- Select: Student views their own activities; Admin views all
DROP POLICY IF EXISTS "daily_activities_select_policy" ON public.daily_activities;
CREATE POLICY "daily_activities_select_policy"
  ON public.daily_activities
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR public.is_admin()
  );

-- Insert: Student can insert activity only if the parent week is in 'draft' or 'returned' status
DROP POLICY IF EXISTS "daily_activities_insert_policy" ON public.daily_activities;
CREATE POLICY "daily_activities_insert_policy"
  ON public.daily_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      student_id = auth.uid() 
      AND public.is_week_editable_by_student(week_id)
    )
    OR
    public.is_admin()
  );

-- Update: Student can update activity only while parent week is editable
DROP POLICY IF EXISTS "daily_activities_update_policy" ON public.daily_activities;
CREATE POLICY "daily_activities_update_policy"
  ON public.daily_activities
  FOR UPDATE
  TO authenticated
  USING (
    (
      student_id = auth.uid()
      AND public.is_week_editable_by_student(week_id)
    )
    OR
    public.is_admin()
  )
  WITH CHECK (
    (
      student_id = auth.uid()
      AND public.is_week_editable_by_student(week_id)
    )
    OR
    public.is_admin()
  );

-- Delete: Student can delete activity only while parent week is editable
DROP POLICY IF EXISTS "daily_activities_delete_policy" ON public.daily_activities;
CREATE POLICY "daily_activities_delete_policy"
  ON public.daily_activities
  FOR DELETE
  TO authenticated
  USING (
    (
      student_id = auth.uid()
      AND public.is_week_editable_by_student(week_id)
    )
    OR
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 9. USER REGISTRATION TRIGGER (OPTION B)
-- Automatically provisions a baseline profile when an auth.users record is created.
-- Default role is always 'student'.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    matric_number,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'SIWES Student'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role),
    NEW.raw_user_meta_data->>'matric_number',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
