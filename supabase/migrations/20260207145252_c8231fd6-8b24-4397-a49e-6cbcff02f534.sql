-- Allow admins to delete bans (unban users)
CREATE POLICY "Admins can delete bans"
ON public.user_bans
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
