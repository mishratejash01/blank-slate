import { supabase } from '@/integrations/supabase/client';

export interface ChatMatch {
  match_id: string;
  other_user_id: string;
  other_name: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchChatList(userId: string): Promise<ChatMatch[]> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('is_active', true)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  const otherIds = matches.map((m) => (m.user1_id === userId ? m.user2_id : m.user1_id));
  const matchIds = matches.map((m) => m.id);

  const [{ data: userProfiles }, { data: messages }, { data: unreadCounts }] = await Promise.all([
    supabase.from('user_profiles').select('user_id, full_name').in('user_id', otherIds),
    supabase
      .from('chat_messages')
      .select('match_id, message_text, created_at')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('chat_messages')
      .select('match_id')
      .in('match_id', matchIds)
      .eq('is_read', false)
      .neq('sender_id', userId),
  ]);

  const nameMap = new Map((userProfiles || []).map((p) => [p.user_id, p.full_name]));

  // Get last message per match
  const lastMsgMap = new Map<string, { text: string; at: string }>();
  (messages || []).forEach((m) => {
    if (!lastMsgMap.has(m.match_id)) {
      lastMsgMap.set(m.match_id, { text: m.message_text, at: m.created_at });
    }
  });

  // Count unreads per match
  const unreadMap = new Map<string, number>();
  (unreadCounts || []).forEach((u) => {
    unreadMap.set(u.match_id, (unreadMap.get(u.match_id) || 0) + 1);
  });

  return matches.map((m) => {
    const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
    const lastMsg = lastMsgMap.get(m.id);
    return {
      match_id: m.id,
      other_user_id: otherId,
      other_name: nameMap.get(otherId) || 'Unknown',
      last_message: lastMsg?.text,
      last_message_at: lastMsg?.at,
      unread_count: unreadMap.get(m.id) || 0,
    };
  }).sort((a, b) => {
    const aTime = a.last_message_at || '';
    const bTime = b.last_message_at || '';
    return bTime.localeCompare(aTime);
  });
}

export async function fetchMessages(matchId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data || []) as ChatMessage[];
}

export async function sendMessage(matchId: string, senderId: string, text: string) {
  const { error } = await supabase.from('chat_messages').insert({
    match_id: matchId,
    sender_id: senderId,
    message_text: text.trim(),
  });
  if (error) throw error;
}

export async function markMessagesRead(matchId: string, userId: string) {
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('match_id', matchId)
    .eq('is_read', false)
    .neq('sender_id', userId);
}

export async function hasAcknowledgedDisclaimer(userId: string, matchId: string): Promise<boolean> {
  const { data } = await supabase
    .from('chat_disclaimers')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle();
  return !!data;
}

export async function acknowledgeDisclaimer(userId: string, matchId: string) {
  const { error } = await supabase.from('chat_disclaimers').insert({
    user_id: userId,
    match_id: matchId,
  });
  if (error) throw error;
}

export async function submitReport(
  reporterId: string,
  reportedUserId: string,
  matchId: string,
  reason: string,
  details: string
) {
  const { error } = await supabase.from('chat_reports').insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    match_id: matchId,
    reason,
    details: details || null,
  });
  if (error) throw error;
}
