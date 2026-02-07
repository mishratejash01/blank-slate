import { useState, ReactNode } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { fetchUserProfile, UserProfileData } from '@/lib/profile-api';
import { useAuth } from '@/contexts/AuthContext';
import { Star, MapPin, BookOpen, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  userId: string;
  children: ReactNode;
}

const UserProfileCard = ({ userId, children }: Props) => {
  const { profile: viewerProfile } = useAuth();
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleOpen = async () => {
    if (loaded) return;
    try {
      const result = await fetchUserProfile(userId);
      if (result) {
        // Privacy check: if not searchable globally and different org, don't show
        if (!result.searchable_global && result.organization_domain !== viewerProfile?.organization_domain) {
          setData(null);
        } else {
          setData(result);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoaded(true);
    }
  };

  return (
    <HoverCard openDelay={300} closeDelay={100} onOpenChange={(open) => { if (open) handleOpen(); }}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-black border-[#2f3336] text-[#e7e9ea] p-0" side="bottom" align="start">
        {!loaded ? (
          <div className="p-4 text-center text-[#71767b] text-sm">Loading...</div>
        ) : !data ? (
          <div className="p-4 text-center text-[#71767b] text-sm">Profile not available</div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-[#333] flex items-center justify-center text-lg font-bold shrink-0">
                {data.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[17px] truncate flex items-center gap-1">
                  {data.full_name}
                  {data.is_verified && (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#1d9bf0]" fill="currentColor">
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96 1.41 1.41-6.37 6.37z" />
                    </svg>
                  )}
                </div>
                {data.username && (
                  <div className="text-[#71767b] text-[15px]">@{data.username}</div>
                )}
              </div>
            </div>

            {/* Bio */}
            {data.bio && (
              <p className="text-[15px] text-[#e7e9ea] leading-snug">{data.bio.slice(0, 160)}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#71767b]">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {data.department}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {data.organization_domain}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-[13px]">
              <span><strong className="text-[#e7e9ea]">{data.post_count}</strong> <span className="text-[#71767b]">Posts</span></span>
              {data.avg_rating !== null && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <strong className="text-[#e7e9ea]">{data.avg_rating.toFixed(1)}</strong>
                  <span className="text-[#71767b]">Rating</span>
                </span>
              )}
            </div>

            {/* Interests */}
            {data.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.interests.slice(0, 5).map(interest => (
                  <Badge key={interest} variant="secondary" className="bg-[#2f3336] text-[#e7e9ea] border-0 text-[11px]">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default UserProfileCard;
