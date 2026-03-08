
-- ============================================
-- 1. JOB QUEUE TABLE (PostgreSQL-based async queue)
-- ============================================
CREATE TABLE public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  priority integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  scheduled_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for worker polling: find pending jobs efficiently
CREATE INDEX idx_job_queue_polling ON public.job_queue (status, priority DESC, scheduled_at ASC) WHERE status IN ('pending', 'retry');
CREATE INDEX idx_job_queue_type ON public.job_queue (job_type, status);

-- Enable RLS
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/manage queue
CREATE POLICY "Super admins can manage job queue"
  ON public.job_queue FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- System (service role) can insert jobs  
CREATE POLICY "System can insert jobs"
  ON public.job_queue FOR INSERT
  WITH CHECK (true);

-- System can update jobs (worker processing)
CREATE POLICY "System can update jobs"
  ON public.job_queue FOR UPDATE
  USING (true);

-- ============================================
-- 2. RATE LIMITS TABLE
-- ============================================
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  max_requests integer NOT NULL DEFAULT 10,
  window_seconds integer NOT NULL DEFAULT 60,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_rate_limits_unique ON public.rate_limits (identifier, action_type);
CREATE INDEX idx_rate_limits_cleanup ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. FUNCTION: Check rate limit (SECURITY DEFINER)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action_type text,
  _max_requests integer DEFAULT 10,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count integer;
  _window_start timestamptz;
BEGIN
  _window_start := now() - (_window_seconds || ' seconds')::interval;
  
  -- Clean expired and upsert
  DELETE FROM public.rate_limits 
  WHERE identifier = _identifier 
    AND action_type = _action_type 
    AND window_start < _window_start;
  
  INSERT INTO public.rate_limits (identifier, action_type, window_start, request_count, max_requests, window_seconds)
  VALUES (_identifier, _action_type, now(), 1, _max_requests, _window_seconds)
  ON CONFLICT (identifier, action_type) 
  DO UPDATE SET 
    request_count = CASE 
      WHEN rate_limits.window_start < _window_start THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < _window_start THEN now()
      ELSE rate_limits.window_start
    END;
  
  SELECT request_count INTO _current_count
  FROM public.rate_limits
  WHERE identifier = _identifier AND action_type = _action_type;
  
  RETURN _current_count <= _max_requests;
END;
$$;

-- ============================================
-- 4. FUNCTION: Claim next job from queue (atomic)
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_next_job(_job_types text[] DEFAULT NULL)
RETURNS SETOF public.job_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.job_queue
  SET status = 'processing',
      started_at = now(),
      attempts = attempts + 1,
      updated_at = now()
  WHERE id = (
    SELECT id FROM public.job_queue
    WHERE status IN ('pending', 'retry')
      AND scheduled_at <= now()
      AND (_job_types IS NULL OR job_type = ANY(_job_types))
    ORDER BY priority DESC, scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;
