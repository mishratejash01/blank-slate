
-- Allow authenticated users to see basic info of verified profiles (needed for dating/matching)
CREATE POLICY "Authenticated users can view verified profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_verified = true
  AND has_completed_onboarding = true
);
