import { supabase } from '@/integrations/supabase/client';

export interface DatingProfile {
  user_id: string;
  full_name: string;
  age: number;
  gender: string;
  academic_year: string;
  department: string;
  bio: string;
  interests: string[];
  organization_domain: string;
  is_verified: boolean;
  hometown: string;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function fetchDatingProfiles(
  userId: string,
  mode: 'org' | 'global',
  userOrg: string
): Promise<DatingProfile[]> {
  // Get already swiped user IDs
  const { data: swipes } = await supabase
    .from('swipes')
    .select('swiped_id')
    .eq('swiper_id', userId);
  const swipedIds = new Set((swipes || []).map((s) => s.swiped_id));
  swipedIds.add(userId); // exclude self

  // Get matched user IDs
  const { data: matches } = await supabase
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
  (matches || []).forEach((m) => {
    swipedIds.add(m.user1_id === userId ? m.user2_id : m.user1_id);
  });

  // Get verified profiles with onboarding complete
  let profilesQuery = supabase
    .from('profiles')
    .select('id, organization_domain, is_verified')
    .eq('is_verified', true)
    .eq('has_completed_onboarding', true);

  if (mode === 'org') {
    profilesQuery = profilesQuery.eq('organization_domain', userOrg);
  }

  const { data: profiles } = await profilesQuery;
  if (!profiles || profiles.length === 0) return [];

  // Filter out already swiped
  const eligibleIds = profiles
    .filter((p) => !swipedIds.has(p.id))
    .map((p) => p.id);

  if (eligibleIds.length === 0) return [];

  // Get user_profiles for eligible users
  let userProfilesQuery = supabase
    .from('user_profiles')
    .select('user_id, full_name, date_of_birth, gender, academic_year, department, bio, interests, hometown, viewability_global')
    .in('user_id', eligibleIds);

  const { data: userProfiles } = await userProfilesQuery;
  if (!userProfiles) return [];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return userProfiles
    .filter((up) => {
      // In global mode, respect viewability setting
      if (mode === 'global' && !up.viewability_global) return false;
      return true;
    })
    .map((up) => {
      const prof = profileMap.get(up.user_id);
      return {
        user_id: up.user_id,
        full_name: up.full_name,
        age: calculateAge(up.date_of_birth),
        gender: up.gender,
        academic_year: up.academic_year,
        department: up.department,
        bio: up.bio,
        interests: up.interests as string[],
        organization_domain: prof?.organization_domain || '',
        is_verified: prof?.is_verified || false,
        hometown: up.hometown,
      };
    });
}

export async function swipeUser(swiperId: string, swipedId: string, action: 'like' | 'pass') {
  const { error } = await supabase.from('swipes').insert({
    swiper_id: swiperId,
    swiped_id: swipedId,
    action,
  });
  if (error) throw error;

  // Check if match was created
  if (action === 'like') {
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user1_id.eq.${swiperId},user2_id.eq.${swipedId}),and(user1_id.eq.${swipedId},user2_id.eq.${swiperId})`)
      .maybeSingle();
    return !!match;
  }
  return false;
}

export async function fetchMatches(userId: string) {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('is_active', true)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  const otherIds = matches.map((m) => m.user1_id === userId ? m.user2_id : m.user1_id);
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', otherIds);

  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));

  return matches.map((m) => {
    const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
    return {
      match_id: m.id,
      other_user_id: otherId,
      other_name: nameMap.get(otherId) || 'Unknown',
      created_at: m.created_at,
    };
  });
}
