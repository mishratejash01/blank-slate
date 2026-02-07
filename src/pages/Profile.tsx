import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserPosts, PostWithAuthor, toggleLike, PostCategory, updateUserProfile } from '@/lib/feed-api';
import { ArrowLeft, Calendar, MapPin, MessageCircle, Heart, Shield, GraduationCap, X } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from '@/hooks/use-toast';

const CATEGORIES: { value: PostCategory; emoji: string }[] = [
  { value: 'general', emoji: '📢' },
  { value: 'confession', emoji: '😶' },
  { value: 'crush', emoji: '😍' },
  { value: 'spotted', emoji: '👀' },
];

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface ProfileProps {
  onBack?: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  const { user, profile: authProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', hometown: '', department: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch Profile Details
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileData) {
      setUserProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        hometown: profileData.hometown || '',
        department: profileData.department || ''
      });
    }

    // Fetch User Posts
    try {
      const userPosts = await fetchUserPosts(user.id);
      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching posts", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleLike = async (post: PostWithAuthor) => {
    if (!user) return;
    setPosts(current => 
      current.map(p => 
        p.id === post.id 
          ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
          : p
      )
    );
    try {
      await toggleLike(post.id, user.id, post.liked_by_me);
    } catch (e) {
      // revert silently
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, editForm);
      toast({ title: "Profile updated!" });
      setIsEditing(false);
      loadData(); // Refresh data
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1d9bf0]" /></div>;
  }

  const displayName = userProfile?.full_name || 'Student';
  const handle = `@${displayName.replace(/\s+/g, '').toLowerCase()}`;
  const joinDate = new Date(authProfile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-black min-h-screen text-[#e7e9ea]">
      {/* Header */}
      <div className="flex items-center px-4 py-1 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#2f3336]">
        {onBack && (
          <div onClick={onBack} className="p-2 rounded-full hover:bg-[#eff3f4]/10 cursor-pointer mr-5">
            <ArrowLeft className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold leading-6">{displayName} {authProfile?.is_verified && <span className="text-[#1d9bf0] inline-block align-middle ml-1">✅</span>}</h2>
          <span className="text-[#71767b] text-[13px]">{posts.length} posts</span>
        </div>
      </div>

      {/* Banner */}
      <div className="h-[200px] bg-gradient-to-r from-[#2b303b] to-[#aeb6bf] relative flex items-center justify-end overflow-hidden">
         <svg width="200" height="200" viewBox="0 0 100 100" className="mr-12 opacity-50">
            <ellipse cx="50" cy="45" rx="35" ry="40" fill="#d1d1d1" />
            <ellipse cx="35" cy="50" rx="10" ry="15" fill="black" transform="rotate(-20 35 50)" />
            <ellipse cx="65" cy="50" rx="10" ry="15" fill="black" transform="rotate(20 65 50)" />
        </svg>
      </div>

      {/* Profile Info Section */}
      <div className="px-4 relative mb-4">
        {/* Avatar */}
        <div className="w-[140px] h-[140px] rounded-full border-4 border-black bg-[#333] absolute -top-[70px] overflow-hidden flex items-center justify-center text-4xl font-bold">
           {authProfile?.is_verified ? (
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover" alt="avatar" />
           ) : (
             displayName.substring(0, 2).toUpperCase()
           )}
        </div>

        {/* Edit Button with Dialog */}
        <div className="flex justify-end pt-3 mb-10">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <button className="border border-[#536471] text-white px-4 py-1.5 rounded-full font-bold hover:bg-[#eff3f4]/10 transition-colors">
                Edit profile
              </button>
            </DialogTrigger>
            <DialogContent className="bg-black border-[#2f3336] text-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-[#71767b]">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="col-span-3 bg-transparent border-[#2f3336] text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bio" className="text-right text-[#71767b]">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    className="col-span-3 bg-transparent border-[#2f3336] text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right text-[#71767b]">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={editForm.hometown}
                    onChange={(e) => setEditForm({...editForm, hometown: e.target.value})}
                    className="col-span-3 bg-transparent border-[#2f3336] text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dept" className="text-right text-[#71767b]">
                    Dept
                  </Label>
                  <Input
                    id="dept"
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="col-span-3 bg-transparent border-[#2f3336] text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                   onClick={handleSaveProfile} 
                   disabled={saving}
                   className="bg-[#eff3f4] text-black hover:bg-[#d7dbdc] rounded-full font-bold"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bio & Details */}
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-1">
            {displayName}
            {authProfile?.is_verified && (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-[#1d9bf0] fill-current">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96 1.41 1.41-6.37 6.37z"></path>
              </svg>
            )}
          </h2>
          <span className="text-[#71767b] text-[15px]">{handle}</span>
          
          <div className="mt-3 text-[15px] whitespace-pre-wrap">
            {userProfile?.bio || "No bio yet."}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[#71767b] text-[15px]">
            {userProfile?.hometown && (
              <div className="flex items-center gap-1">
                <MapPin className="w-[18px] h-[18px]" />
                <span>{userProfile.hometown}</span>
              </div>
            )}
            {userProfile?.department && (
              <div className="flex items-center gap-1">
                <GraduationCap className="w-[18px] h-[18px]" />
                <span>{userProfile.department}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-[18px] h-[18px]" />
              <span>Joined {joinDate}</span>
            </div>
            {authProfile?.organization_domain && (
               <div className="flex items-center gap-1">
                 <Shield className="w-[18px] h-[18px]" />
                 <span>{authProfile.organization_domain}</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2f3336] mt-3 overflow-x-auto no-scrollbar">
        {['Posts', 'Replies', 'Likes'].map((tab, i) => (
          <div 
            key={tab}
            className={`flex-1 min-w-fit px-4 py-4 text-center font-bold text-[15px] cursor-pointer hover:bg-[#eff3f4]/10 transition-colors relative ${i === 0 ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}
          >
            {tab}
            {i === 0 && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
          </div>
        ))}
      </div>

      {/* User Posts Feed */}
      <div>
        {posts.length === 0 ? (
          <div className="p-8 text-center text-[#71767b]">
             No posts yet.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-3 border-b border-[#2f3336] flex hover:bg-white/[0.03] cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#333] mr-3 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                {post.is_anonymous ? '👻' : displayName.substring(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5 text-[15px]">
                  <span className="font-bold text-[#e7e9ea] truncate">{displayName}</span>
                  {authProfile?.is_verified && <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-[#1d9bf0] fill-current"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96 1.41 1.41-6.37 6.37z"></path></svg>}
                  <span className="text-[#71767b] truncate">{handle} · {timeAgo(post.created_at)}</span>
                  {post.category !== 'general' && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#2f3336] text-[#71767b]">
                      {CATEGORIES.find(c => c.value === post.category)?.emoji} {post.category}
                    </span>
                  )}
                </div>
                
                <div className="text-[#e7e9ea] text-[15px] whitespace-pre-wrap mb-3 break-words">
                  {post.content}
                </div>
                
                {/* Actions: Likes Only as per request */}
                <div className="flex justify-start gap-8 text-[#71767b] text-[13px]">
                  <div className="flex items-center gap-2 group cursor-pointer hover:text-[#1d9bf0]">
                    <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                      <MessageCircle className="w-[18px] h-[18px]" />
                    </div>
                    <span>{post.comments_count > 0 && post.comments_count}</span>
                  </div>

                  <div 
                    className={`flex items-center gap-2 group cursor-pointer ${post.liked_by_me ? 'text-[#f91880]' : 'hover:text-[#f91880]'}`}
                    onClick={(e) => { e.stopPropagation(); handleLike(post); }}
                  >
                    <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                      <Heart className={`w-[18px] h-[18px] ${post.liked_by_me ? 'fill-current' : ''}`} />
                    </div>
                    <span>{post.likes_count > 0 && post.likes_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
