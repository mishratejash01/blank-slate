
-- Allow users to check their own ban status
CREATE POLICY "Users can view own bans"
ON public.user_bans
FOR SELECT
USING (auth.uid() = user_id);
