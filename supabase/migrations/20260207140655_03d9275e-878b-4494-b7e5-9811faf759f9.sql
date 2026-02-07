
-- Fix search_path on handle_like_change
CREATE OR REPLACE FUNCTION public.handle_like_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix search_path on handle_comment_change
CREATE OR REPLACE FUNCTION public.handle_comment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix search_path on handle_new_swipe
CREATE OR REPLACE FUNCTION public.handle_new_swipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.action = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id AND swiped_id = NEW.swiper_id AND action = 'like'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.matches
        WHERE (user1_id = NEW.swiper_id AND user2_id = NEW.swiped_id)
        OR (user1_id = NEW.swiped_id AND user2_id = NEW.swiper_id)
      ) THEN
        INSERT INTO public.matches (user1_id, user2_id) VALUES (NEW.swiper_id, NEW.swiped_id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
