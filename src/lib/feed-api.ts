import { supabase } from '@/integrations/supabase/client';

export type PostCategory = 'general' | 'confession' | 'crush' | 'spotted';

export interface PostWithAuthor {
  id: string;
  content: string;
  visibility: string;
  is_anonymous: boolean;
  category: PostCategory;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  author_name: string;
  author_org: string;
  author_verified: boolean;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  author_name: string;
}

// --- Fetch User Specific Posts (For Profile) ---
export async function fetchUserPosts(userId: string): Promise<PostWithAuthor[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  // For the user's own profile, we know the author is the user
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_domain, is_verified')
    .eq('id', userId)
    .single();

  const { data: myLikes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId);

  const likedSet = new Set((myLikes || []).map((l) => l.post_id));
  const authorName = userProfile?.full_name || 'Unknown';

  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    visibility: post.visibility,
    is_anonymous: post.is_anonymous,
    category: (post.category || 'general') as PostCategory,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,
    user_id: post.user_id,
    // On your own profile, you see your name even if anonymous, but we can tag it
    author_name: post.is_anonymous ? `${authorName} (Anon)` : authorName,
    author_org: profile?.organization_domain || '',
    author_verified: profile?.is_verified || false,
    liked_by_me: likedSet.has(post.id),
  }));
}

export async function fetchPosts(mode: 'org' | 'global', userId: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (mode === 'global') {
    query = query.eq('visibility', 'global');
  }

  const { data: posts, error } = await query;
  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  const userIds = [...new Set(posts.map((p) => p.user_id))];

  const [{ data: profiles }, { data: userProfiles }, { data: myLikes }] = await Promise.all([
    supabase.from('profiles').select('id, organization_domain, is_verified').in('id', userIds),
    supabase.from('user_profiles').select('user_id, full_name').in('user_id', userIds),
    supabase.from('post_likes').select('post_id').eq('user_id', userId),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));
  const likedSet = new Set((myLikes || []).map((l) => l.post_id));

  return posts.map((post) => {
    const profile = profileMap.get(post.user_id);
    const isAnon = post.is_anonymous;
    return {
      id: post.id,
      content: post.content,
      visibility: post.visibility,
      is_anonymous: isAnon,
      category: (post.category || 'general') as PostCategory,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      user_id: post.user_id,
      author_name: isAnon ? 'Anonymous Student' : (nameMap.get(post.user_id) || 'Unknown'),
      author_org: isAnon ? '' : (profile?.organization_domain || ''),
      author_verified: isAnon ? false : (profile?.is_verified || false),
      liked_by_me: likedSet.has(post.id),
    };
  });
}

export async function createPost(
  userId: string,
  content: string,
  visibility: 'org_only' | 'global',
  is_anonymous = false,
  category: PostCategory = 'general'
) {
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    content: content.trim(),
    visibility,
    is_anonymous,
    category,
  });
  if (error) throw error;
}

export async function toggleLike(postId: string, userId: string, isLiked: boolean) {
  if (isLiked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}
