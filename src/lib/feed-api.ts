import { supabase } from '@/integrations/supabase/client';

export interface PostWithAuthor {
  id: string;
  content: string;
  visibility: string;
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

export async function fetchPosts(mode: 'org' | 'global', userId: string): Promise<PostWithAuthor[]> {
  // Fetch posts - RLS handles visibility
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (mode === 'global') {
    query = query.eq('visibility', 'global');
  }
  // For org mode, RLS handles filtering - we get both org_only and global from same org

  const { data: posts, error } = await query;
  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  // Get unique user IDs
  const userIds = [...new Set(posts.map((p) => p.user_id))];

  // Fetch profiles and user_profiles for authors
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
    return {
      id: post.id,
      content: post.content,
      visibility: post.visibility,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      user_id: post.user_id,
      author_name: nameMap.get(post.user_id) || 'Unknown',
      author_org: profile?.organization_domain || '',
      author_verified: profile?.is_verified || false,
      liked_by_me: likedSet.has(post.id),
    };
  });
}

export async function createPost(userId: string, content: string, visibility: 'org_only' | 'global') {
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    content: content.trim(),
    visibility,
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

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data: comments, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!comments || comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', userIds);
  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));

  return comments.map((c) => ({
    ...c,
    author_name: nameMap.get(c.user_id) || 'Unknown',
  }));
}

export async function addComment(postId: string, userId: string, text: string) {
  const { error } = await supabase.from('post_comments').insert({
    post_id: postId,
    user_id: userId,
    comment_text: text.trim(),
  });
  if (error) throw error;
}
