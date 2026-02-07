
-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL CHECK (char_length(message_text) <= 1000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Only matched users can view messages
CREATE POLICY "Matched users can view messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = chat_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Matched users can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
      AND matches.is_active = true
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Allow users to update is_read on messages sent TO them
CREATE POLICY "Users can mark messages as read"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = chat_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Chat reports table
CREATE TABLE public.chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('Harassment', 'Inappropriate Content', 'Spam', 'Other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.chat_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.chat_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Disclaimer acknowledgment tracking
CREATE TABLE public.chat_disclaimers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE public.chat_disclaimers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disclaimers"
  ON public.chat_disclaimers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disclaimers"
  ON public.chat_disclaimers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Indexes
CREATE INDEX idx_chat_messages_match ON public.chat_messages(match_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX idx_chat_reports_status ON public.chat_reports(status);
CREATE INDEX idx_chat_disclaimers_user_match ON public.chat_disclaimers(user_id, match_id);
