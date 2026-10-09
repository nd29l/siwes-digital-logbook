-- ==============================================================================
-- SIWES Digital Logbook Management System
-- Migration: 20260928000001_notifications.sql
-- Module 13: Notifications & Status Feedback
-- ==============================================================================

-- 1. NOTIFICATIONS TABLE
-- Stores private user notifications for workflow events (report submission,
-- supervisor approval, return for revisions, and remarks/feedback).
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'report_submitted',
    'report_approved',
    'report_returned',
    'feedback_added',
    'account_update'
  )),
  title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
  message TEXT NOT NULL CHECK (LENGTH(TRIM(message)) > 0),
  reference_id UUID,
  reference_type TEXT DEFAULT 'logbook_week',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_ref ON public.notifications(reference_id, reference_type);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. ROW LEVEL SECURITY POLICIES

-- 4.1 SELECT: Users can only read their own private notifications
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid()
  );

-- 4.2 UPDATE: Users can mark only their own notifications as read
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid()
  )
  WITH CHECK (
    recipient_id = auth.uid()
  );

-- 4.3 INSERT: Secure creation of notifications
-- Administrators can create notifications for any student/user.
-- Students can only dispatch system notifications to administrators (e.g. report submitted).
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = recipient_id AND role = 'admin'
      )
    )
  );

-- 4.4 DELETE: Users can delete or dismiss only their own notifications
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    recipient_id = auth.uid()
  );

-- 5. AUTOMATED NOTIFICATION TRIGGER FUNCTION
-- Automatically creates notifications on report lifecycle events when logbook_weeks is updated.
CREATE OR REPLACE FUNCTION public.handle_logbook_week_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_admin_id UUID;
  v_already_exists BOOLEAN;
BEGIN
  -- Event 1: Student submits a weekly report
  IF (OLD.status IN ('draft', 'returned') AND NEW.status = 'submitted') THEN
    -- Look up student name
    SELECT COALESCE(full_name, 'A student') INTO v_student_name
    FROM public.profiles
    WHERE id = NEW.student_id;

    -- Notify all active administrators
    FOR v_admin_id IN (SELECT id FROM public.profiles WHERE role = 'admin') LOOP
      -- Avoid duplicates within last 10 minutes
      SELECT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE recipient_id = v_admin_id
          AND type = 'report_submitted'
          AND reference_id = NEW.id
          AND created_at > NOW() - INTERVAL '10 minutes'
      ) INTO v_already_exists;

      IF NOT v_already_exists THEN
        INSERT INTO public.notifications (
          recipient_id,
          actor_id,
          type,
          title,
          message,
          reference_id,
          reference_type
        )
        VALUES (
          v_admin_id,
          NEW.student_id,
          'report_submitted',
          'New Report Submitted (Week ' || NEW.week_number || ')',
          v_student_name || ' submitted their Week ' || NEW.week_number || ' 5-day logbook report for review.',
          NEW.id,
          'logbook_week'
        );
      END IF;
    END LOOP;
  END IF;

  -- Event 2: Administrator approves a weekly report
  IF (OLD.status != 'approved' AND NEW.status = 'approved') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE recipient_id = NEW.student_id
        AND type = 'report_approved'
        AND reference_id = NEW.id
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) INTO v_already_exists;

    IF NOT v_already_exists THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        message,
        reference_id,
        reference_type
      )
      VALUES (
        NEW.student_id,
        NEW.reviewed_by,
        'report_approved',
        'Week ' || NEW.week_number || ' Report Approved',
        CASE
          WHEN NEW.admin_remark IS NOT NULL AND LENGTH(TRIM(NEW.admin_remark)) > 0 THEN
            'Your Week ' || NEW.week_number || ' report has been approved with remarks: "' || NEW.admin_remark || '"'
          ELSE
            'Your Week ' || NEW.week_number || ' 5-day logbook report has been endorsed and approved by your supervisor.'
        END,
        NEW.id,
        'logbook_week'
      );
    END IF;
  END IF;

  -- Event 3: Administrator returns a weekly report for revisions
  IF (OLD.status != 'returned' AND NEW.status = 'returned') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE recipient_id = NEW.student_id
        AND type = 'report_returned'
        AND reference_id = NEW.id
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) INTO v_already_exists;

    IF NOT v_already_exists THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        message,
        reference_id,
        reference_type
      )
      VALUES (
        NEW.student_id,
        NEW.reviewed_by,
        'report_returned',
        'Week ' || NEW.week_number || ' Returned for Revision',
        CASE
          WHEN NEW.admin_feedback IS NOT NULL AND LENGTH(TRIM(NEW.admin_feedback)) > 0 THEN
            'Action required: Your supervisor returned Week ' || NEW.week_number || ': "' || NEW.admin_feedback || '"'
          ELSE
            'Action required: Your Week ' || NEW.week_number || ' logbook report was returned for corrections.'
        END,
        NEW.id,
        'logbook_week'
      );
    END IF;
  END IF;

  -- Event 4: Administrator updates remarks or feedback on an already evaluated report
  IF (
    OLD.status = NEW.status AND
    (
      (NEW.admin_remark IS DISTINCT FROM OLD.admin_remark AND NEW.admin_remark IS NOT NULL) OR
      (NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback AND NEW.admin_feedback IS NOT NULL)
    )
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE recipient_id = NEW.student_id
        AND type = 'feedback_added'
        AND reference_id = NEW.id
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) INTO v_already_exists;

    IF NOT v_already_exists THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        message,
        reference_id,
        reference_type
      )
      VALUES (
        NEW.student_id,
        NEW.reviewed_by,
        'feedback_added',
        'Supervisor Remarks Updated (Week ' || NEW.week_number || ')',
        'New comments or feedback have been recorded on your Week ' || NEW.week_number || ' report.',
        NEW.id,
        'logbook_week'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ATTACH TRIGGER TO LOGBOOK_WEEKS
DROP TRIGGER IF EXISTS trg_handle_logbook_week_notification ON public.logbook_weeks;
CREATE TRIGGER trg_handle_logbook_week_notification
  AFTER UPDATE ON public.logbook_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_logbook_week_notification();
