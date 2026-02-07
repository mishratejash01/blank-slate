
-- Add username and searchable_global to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN username text;
ALTER TABLE public.user_profiles ADD COLUMN searchable_global boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX idx_user_profiles_username ON public.user_profiles (username) WHERE username IS NOT NULL;

-- Create user_ratings table
CREATE TABLE public.user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id uuid NOT NULL,
  rated_user_id uuid NOT NULL,
  rating integer NOT NULL,
  match_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rater_id, rated_user_id),
  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5)
);
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ratings" ON public.user_ratings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own ratings" ON public.user_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users can update own ratings" ON public.user_ratings FOR UPDATE USING (auth.uid() = rater_id);

-- Create user_activity table
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  minutes_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_date)
);
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view activity" ON public.user_activity FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity" ON public.user_activity FOR UPDATE USING (auth.uid() = user_id);
