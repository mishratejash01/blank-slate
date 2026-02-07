
-- Add anonymous flag and category to posts
ALTER TABLE public.posts ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN category text NOT NULL DEFAULT 'general';

-- Add index for category filtering
CREATE INDEX idx_posts_category ON public.posts (category);
