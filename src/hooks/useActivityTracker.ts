import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useActivityTracker(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!userId) return;

    const trackMinute = async () => {
      const today = new Date().toISOString().split('T')[0];
      // Try to increment, if row doesn't exist, insert
      const { data } = await supabase
        .from('user_activity')
        .select('id, minutes_spent')
        .eq('user_id', userId)
        .eq('session_date', today)
        .maybeSingle();

      if (data) {
        await supabase
          .from('user_activity')
          .update({ minutes_spent: data.minutes_spent + 1 })
          .eq('id', data.id);
      } else {
        await supabase
          .from('user_activity')
          .insert({ user_id: userId, session_date: today, minutes_spent: 1 });
      }
    };

    // Track every 60 seconds
    intervalRef.current = setInterval(trackMinute, 60000);
    // Also track immediately on mount
    trackMinute();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);
}
