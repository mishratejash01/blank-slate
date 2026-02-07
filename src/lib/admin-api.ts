import { supabase } from '@/integrations/supabase/client';

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
}

export async function fetchAllProfiles() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const ids = (profiles || []).map((p) => p.id);
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('*')
    .in('user_id', ids);

  const upMap = new Map((userProfiles || []).map((up) => [up.user_id, up]));

  return (profiles || []).map((p) => ({
    ...p,
    user_profile: upMap.get(p.id) || null,
  }));
}

export async function verifyUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: true })
    .eq('id', userId);
  if (error) throw error;
}

export async function rejectUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: false })
    .eq('id', userId);
  if (error) throw error;
}

export async function fetchAllReports() {
  const { data, error } = await supabase
    .from('chat_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const userIds = new Set<string>();
  (data || []).forEach((r) => {
    userIds.add(r.reporter_id);
    userIds.add(r.reported_user_id);
  });

  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', Array.from(userIds));

  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));

  return (data || []).map((r) => ({
    ...r,
    reporter_name: nameMap.get(r.reporter_id) || 'Unknown',
    reported_name: nameMap.get(r.reported_user_id) || 'Unknown',
  }));
}

export async function updateReportStatus(reportId: string, status: string, adminNotes?: string) {
  const { error } = await supabase
    .from('chat_reports')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq('id', reportId);
  if (error) throw error;
}

export async function banUser(
  userId: string,
  adminId: string,
  reason: string,
  days?: number,
  isPermanent?: boolean
) {
  const { error } = await supabase.from('user_bans').insert({
    user_id: userId,
    banned_by_admin_id: adminId,
    reason,
    ban_duration_days: days || null,
    expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
    is_permanent: isPermanent || false,
  });
  if (error) throw error;
}

export async function unbanUser(userId: string) {
  const { error } = await supabase
    .from('user_bans')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchActiveBans() {
  const { data, error } = await supabase
    .from('user_bans')
    .select('*')
    .order('banned_at', { ascending: false });
  if (error) throw error;

  const userIds = [...new Set((data || []).map((b) => b.user_id))];
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', userIds);

  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));

  return (data || []).map((b) => ({
    ...b,
    user_name: nameMap.get(b.user_id) || 'Unknown',
  }));
}

export async function fetchAllPosts() {
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const userIds = [...new Set((posts || []).map((p) => p.user_id))];
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', userIds);

  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));

  return (posts || []).map((p) => ({
    ...p,
    author_name: nameMap.get(p.user_id) || 'Unknown',
  }));
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function fetchAnalytics() {
  const [{ count: totalUsers }, { count: verifiedUsers }, { count: totalPosts }, { count: totalMatches }, { count: pendingReports }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('chat_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

  // Get org breakdown
  const { data: profiles } = await supabase.from('profiles').select('organization_domain');
  const orgCounts: Record<string, number> = {};
  (profiles || []).forEach((p) => {
    orgCounts[p.organization_domain] = (orgCounts[p.organization_domain] || 0) + 1;
  });

  return {
    totalUsers: totalUsers || 0,
    verifiedUsers: verifiedUsers || 0,
    unverifiedUsers: (totalUsers || 0) - (verifiedUsers || 0),
    totalPosts: totalPosts || 0,
    totalMatches: totalMatches || 0,
    pendingReports: pendingReports || 0,
    orgBreakdown: Object.entries(orgCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count),
  };
}
