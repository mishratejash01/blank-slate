import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isWorkspaceEmail } from '@/lib/email-validation';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  organization_domain: string;
  is_verified: boolean;
  has_completed_onboarding: boolean;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkBanStatus = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('user_bans')
      .select('id, is_permanent, expires_at')
      .eq('user_id', userId)
      .order('banned_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return false;
    if (data.is_permanent) return true;
    if (data.expires_at && new Date(data.expires_at) > new Date()) return true;
    return false;
  };

  const fetchProfile = async (userId: string) => {
    // Check if user is banned
    const isBanned = await checkBanStatus(userId);
    if (isBanned) {
      await supabase.auth.signOut();
      toast({
        variant: 'destructive',
        title: 'Account Suspended',
        description: 'Your account has been suspended. Contact support if you believe this is an error.',
      });
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data as Profile | null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userEmail = session?.user?.email;
        if (session && userEmail && !isWorkspaceEmail(userEmail)) {
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'Only organization/university emails are allowed. Public emails (Gmail, Yahoo, etc.) cannot be used.',
          });
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
