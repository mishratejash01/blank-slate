import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDatingProfiles, swipeUser, DatingProfile } from '@/lib/dating-api';
import SwipeCard from '@/components/dating/SwipeCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { X, Heart, Globe, Building2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Dating = () => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<'org' | 'global'>('global');
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchDialog, setMatchDialog] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const data = await fetchDatingProfiles(user.id, mode, profile.organization_domain);
      setProfiles(data);
      setCurrentIndex(0);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setLoading(false);
    }
  }, [user, profile, mode]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!user || swiping || currentIndex >= profiles.length) return;
    setSwiping(true);
    setSwipeDirection(action === 'like' ? 'right' : 'left');

    try {
      const target = profiles[currentIndex];
      const isMatch = await swipeUser(user.id, target.user_id, action);
      
      // Wait for animation
      await new Promise((r) => setTimeout(r, 300));
      setSwipeDirection(null);
      setCurrentIndex((i) => i + 1);

      if (isMatch) {
        setMatchDialog(target.full_name);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
      setSwipeDirection(null);
    } finally {
      setSwiping(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg w-fit">
        <Button
          size="sm"
          variant={mode === 'global' ? 'default' : 'ghost'}
          onClick={() => setMode('global')}
          className="gap-1.5 text-xs"
        >
          <Globe className="h-3.5 w-3.5" /> Global
        </Button>
        <Button
          size="sm"
          variant={mode === 'org' ? 'default' : 'ghost'}
          onClick={() => setMode('org')}
          className="gap-1.5 text-xs"
        >
          <Building2 className="h-3.5 w-3.5" /> {profile?.organization_domain || 'Org'}
        </Button>
      </div>

      {/* Card Area */}
      <div className="flex flex-col items-center">
        {loading ? (
          <Skeleton className="h-[420px] w-full max-w-sm rounded-xl" />
        ) : !currentProfile ? (
          <div className="text-center py-16 space-y-3">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No more profiles</p>
            <p className="text-sm text-muted-foreground">Check back later or switch modes</p>
            <Button variant="outline" size="sm" onClick={loadProfiles}>Refresh</Button>
          </div>
        ) : (
          <>
            <div
              className={`w-full max-w-sm transition-all duration-300 ${
                swipeDirection === 'left' ? '-translate-x-full opacity-0 rotate-[-10deg]' :
                swipeDirection === 'right' ? 'translate-x-full opacity-0 rotate-[10deg]' : ''
              }`}
            >
              <SwipeCard profile={currentProfile} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={() => handleSwipe('pass')}
                disabled={swiping}
                className="h-16 w-16 rounded-full border-2 border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all hover:scale-110 active:scale-95"
              >
                <X className="h-7 w-7" />
              </button>
              <button
                onClick={() => handleSwipe('like')}
                disabled={swiping}
                className="h-16 w-16 rounded-full border-2 border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-all hover:scale-110 active:scale-95"
              >
                <Heart className="h-7 w-7" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {profiles.length - currentIndex - 1} more profiles
            </p>
          </>
        )}
      </div>

      {/* Match Dialog */}
      <Dialog open={!!matchDialog} onOpenChange={() => setMatchDialog(null)}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-accent" />
              It's a Match!
            </DialogTitle>
            <DialogDescription>
              You and <span className="font-semibold text-foreground">{matchDialog}</span> liked each other!
              You can now chat with them.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setMatchDialog(null)} className="mt-2">
            Keep Swiping
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dating;
