import { supabase } from '@/integrations/supabase/client';

export interface UserProfileData {
  user_id: string;
  username: string | null;
  full_name: string;
  bio: string;
  department: string;
  interests: string[];
  organization_domain: string;
  is_verified: boolean;
  searchable_global: boolean;
  avg_rating: number | null;
  post_count: number;
}

export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  const [{ data: userProfile }, { data: profile }, { data: ratings }, { data: posts }] = await Promise.all([
    supabase.from('user_profiles').select('user_id, username, full_name, bio, department, interests, searchable_global').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('id, organization_domain, is_verified').eq('id', userId).maybeSingle(),
    supabase.from('user_ratings').select('rating').eq('rated_user_id', userId),
    supabase.from('posts').select('id').eq('user_id', userId),
  ]);

  if (!userProfile || !profile) return null;

  const avgRating = ratings && ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null;

  return {
    user_id: userId,
    username: userProfile.username,
    full_name: userProfile.full_name,
    bio: userProfile.bio,
    department: userProfile.department,
    interests: userProfile.interests,
    organization_domain: profile.organization_domain,
    is_verified: profile.is_verified,
    searchable_global: userProfile.searchable_global,
    avg_rating: avgRating,
    post_count: posts?.length || 0,
  };
}

export async function fetchUserPosts(userId: string, viewerOrgDomain: string) {
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!posts) return [];

  // Filter org-only posts: only show if viewer is from same org
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('organization_domain')
    .eq('id', userId)
    .maybeSingle();

  const sameOrg = authorProfile?.organization_domain === viewerOrgDomain;

  return posts.filter(p => {
    if (p.visibility === 'org_only' && !sameOrg) return false;
    return true;
  });
}

export async function fetchUserRating(userId: string): Promise<number | null> {
  const { data } = await supabase.from('user_ratings').select('rating').eq('rated_user_id', userId);
  if (!data || data.length === 0) return null;
  return data.reduce((sum, r) => sum + r.rating, 0) / data.length;
}

export async function searchUsers(query: string, viewerUserId: string, viewerOrgDomain: string) {
  if (!query.trim()) return [];

  const searchTerm = `%${query.trim()}%`;
  
  const { data: results } = await supabase
    .from('user_profiles')
    .select('user_id, username, full_name, department, searchable_global')
    .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
    .neq('user_id', viewerUserId)
    .limit(10);

  if (!results) return [];

  // Get org domains for filtering
  const userIds = results.map(r => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, organization_domain')
    .in('id', userIds);

  const orgMap = new Map((profiles || []).map(p => [p.id, p.organization_domain]));

  return results.filter(r => {
    if (r.searchable_global) return true;
    // Only show if same org
    return orgMap.get(r.user_id) === viewerOrgDomain;
  }).map(r => ({
    ...r,
    organization_domain: orgMap.get(r.user_id) || '',
  }));
}

export async function checkUsernameAvailability(username: string, currentUserId: string): Promise<boolean> {
  if (!username.trim()) return true;
  const { data } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('username', username.trim().toLowerCase())
    .neq('user_id', currentUserId)
    .maybeSingle();
  return !data;
}

export async function upsertRating(raterId: string, ratedUserId: string, rating: number, matchId: string) {
  const { error } = await supabase
    .from('user_ratings')
    .upsert(
      { rater_id: raterId, rated_user_id: ratedUserId, rating, match_id: matchId },
      { onConflict: 'rater_id,rated_user_id' }
    );
  if (error) throw error;
}

export async function getMyRating(raterId: string, ratedUserId: string): Promise<number | null> {
  const { data } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('rater_id', raterId)
    .eq('rated_user_id', ratedUserId)
    .maybeSingle();
  return data?.rating || null;
}

export async function fetchLeaderboard() {
  // Get all ratings grouped by user
  const { data: ratings } = await supabase.from('user_ratings').select('rated_user_id, rating');
  // Get all activity
  const { data: activity } = await supabase.from('user_activity').select('user_id, minutes_spent');

  if (!ratings && !activity) return [];

  // Calculate avg rating per user
  const ratingMap = new Map<string, number[]>();
  (ratings || []).forEach(r => {
    const arr = ratingMap.get(r.rated_user_id) || [];
    arr.push(r.rating);
    ratingMap.set(r.rated_user_id, arr);
  });

  // Calculate total minutes per user
  const minutesMap = new Map<string, number>();
  (activity || []).forEach(a => {
    minutesMap.set(a.user_id, (minutesMap.get(a.user_id) || 0) + a.minutes_spent);
  });

  // Combine all user IDs
  const allUserIds = new Set([...ratingMap.keys(), ...minutesMap.keys()]);
  
  const scores = Array.from(allUserIds).map(userId => {
    const userRatings = ratingMap.get(userId) || [];
    const avgRating = userRatings.length > 0 ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : 0;
    const totalMinutes = minutesMap.get(userId) || 0;
    // Weighted score: rating matters more (60%), time matters less (40%) to prevent gaming
    const score = (avgRating * 12) + (Math.min(totalMinutes, 1000) * 0.04);
    return { userId, avgRating, totalMinutes, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const top5 = scores.slice(0, 5);

  if (top5.length === 0) return [];

  // Fetch names
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, username')
    .in('user_id', top5.map(s => s.userId));

  const nameMap = new Map((userProfiles || []).map(p => [p.user_id, { name: p.full_name, username: p.username }]));

  return top5.map((s, i) => ({
    rank: i + 1,
    userId: s.userId,
    name: nameMap.get(s.userId)?.name || 'Unknown',
    username: nameMap.get(s.userId)?.username || null,
    avgRating: s.avgRating,
    totalMinutes: s.totalMinutes,
    score: Math.round(s.score * 10) / 10,
  }));
}
