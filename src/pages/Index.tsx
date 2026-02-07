import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchPosts, createPost, toggleLike, PostWithAuthor, PostCategory } from '@/lib/feed-api';
import Dating from '@/pages/Dating';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile'; // New import
import { toast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Heart, Ghost, Globe, Building2, Flame, Search, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// --- Icons & UI Components ---

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px] fill-white" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

const NavIcon = ({ active, children }: { active: boolean, children: React.ReactNode }) => (
  <div className={`w-[26px] h-[26px] mr-5 ${active ? 'font-bold' : ''}`}>
    {children}
  </div>
);

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-[#1d9bf0] ml-1" fill="currentColor">
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96 1.41 1.41-6.37 6.37z"></path>
  </svg>
);

function getInitials(name: string) {
  return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
}

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

// --- Constants ---
const CATEGORIES: { value: PostCategory; label: string; emoji: string }[] = [
  { value: 'general', label: 'General', emoji: '📢' },
  { value: 'confession', label: 'Confession', emoji: '😶' },
  { value: 'crush', label: 'Crush', emoji: '😍' },
  { value: 'spotted', label: 'Spotted', emoji: '👀' },
];

const Index = () => {
  const { user, profile: authProfile } = useAuth();
  
  // Navigation State
  const [tab, setTab] = useState<'feed' | 'dating' | 'chat' | 'profile'>('feed');
  
  // Feed State
  const [mode, setMode] = useState<'global' | 'org'>('global');
  const [filterCategory, setFilterCategory] = useState<PostCategory | 'all'>('all');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Composer State
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postCategory, setPostCategory] = useState<PostCategory>('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // User Profile
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserProfile(data);
        });
    }
  }, [user]);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchPosts(mode, user.id, 50, 0);
      setPosts(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading posts' });
    } finally {
      setLoading(false);
    }
  }, [user, mode]);

  useEffect(() => {
    if (tab === 'feed') loadPosts();
  }, [loadPosts, tab]);

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsPosting(true);
    try {
      const visibility = mode === 'org' ? 'org_only' : 'global';
      await createPost(user.id, content, visibility, isAnonymous, postCategory);
      setContent('');
      setPostCategory('general');
      setIsAnonymous(false);
      toast({ title: 'Posted successfully!' });
      loadPosts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to post' });
    } finally {
      setIsPosting(false);
    }
  };

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
    } catch (error) {
      loadPosts();
    }
  };

  const displayName = userProfile?.full_name || 'Student';
  const handle = `@${displayName.replace(/\s+/g, '').toLowerCase()}`;
  const orgDomain = authProfile?.organization_domain || 'Organization';

  const displayedPosts = filterCategory === 'all' 
    ? posts 
    : posts.filter(p => p.category === filterCategory);

  return (
    <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea] font-sans selection:bg-[#1d9bf0] selection:text-white">
      <div className="flex w-full max-w-[1250px] min-h-screen">
        
        {/* --- LEFT SIDEBAR --- */}
        <nav className="w-[80px] xl:w-[275px] px-2 flex flex-col border-r border-[#2f3336] h-screen sticky top-0 hidden md:flex">
          <div className="p-3 w-fit hover:bg-[#181818] rounded-full cursor-pointer transition-colors mb-2 xl:ml-0 mx-auto">
            <XLogo />
          </div>

          <div className="space-y-1 mb-4 w-full">
            {[
              { id: 'feed', icon: <Globe />, label: 'Home' },
              { id: 'dating', icon: <Flame />, label: 'Explore' },
              { id: 'chat', icon: <MessageCircle />, label: 'Chat' },
              { id: 'profile', icon: <User />, label: 'Profile' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setTab(item.id as any)} 
                className={`flex items-center p-3 text-xl rounded-full cursor-pointer transition-colors w-full hover:bg-[#181818] ${tab === item.id ? 'font-bold' : ''} xl:justify-start justify-center`}
              >
                <NavIcon active={tab === item.id}>{item.icon}</NavIcon>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </div>

          <button 
            className="bg-[#eff3f4] text-black border-none rounded-full py-3 xl:py-[15px] px-4 xl:px-8 text-[17px] font-bold mt-4 cursor-pointer w-fit xl:w-[90%] hover:bg-[#d7dbdc] transition-colors xl:ml-0 mx-auto flex justify-center items-center"
            onClick={() => setTab('feed')}
          >
            <span className="hidden xl:inline">Post</span>
            <span className="xl:hidden">🖋️</span>
          </button>

          <div 
            onClick={() => setTab('profile')}
            className="mt-auto mb-6 flex items-center p-3 rounded-full cursor-pointer hover:bg-[#181818] transition-colors xl:ml-0 mx-auto w-fit xl:w-full"
          >
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center font-bold text-lg xl:mr-3 overflow-hidden">
               {authProfile?.is_verified ? <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="avatar" /> : getInitials(displayName)}
            </div>
            <div className="hidden xl:block flex-1 min-w-0">
              <div className="font-bold text-[15px] leading-5 truncate">{displayName}</div>
              <div className="text-[#71767b] text-[15px] leading-5 truncate">{handle}</div>
            </div>
          </div>
        </nav>

        {/* --- MAIN FEED AREA --- */}
        <main className="flex-1 max-w-[600px] border-r border-[#2f3336] w-full">
          {tab === 'feed' ? (
            <>
              {/* Sticky Header */}
              <div className="flex border-b border-[#2f3336] sticky top-0 bg-black/80 backdrop-blur-md z-10">
                <div 
                  className={`flex-1 text-center py-4 font-bold cursor-pointer relative hover:bg-[#181818] transition-colors ${mode === 'global' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}
                  onClick={() => setMode('global')}
                >
                  For you
                  {mode === 'global' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                </div>
                <div 
                  className={`flex-1 text-center py-4 font-bold cursor-pointer relative hover:bg-[#181818] transition-colors ${mode === 'org' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}
                  onClick={() => setMode('org')}
                >
                  {orgDomain}
                  {mode === 'org' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                </div>
              </div>

              {/* Composer */}
              <div className="p-4 flex border-b border-[#2f3336]">
                <div className="w-10 h-10 rounded-full bg-[#444] mr-3 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                   {isAnonymous ? <Ghost className="w-6 h-6" /> : getInitials(displayName)}
                </div>
                <div className="flex-1 pt-2">
                  <textarea
                    className="bg-transparent border-none text-[#e7e9ea] text-xl w-full outline-none resize-none placeholder:text-[#71767b]"
                    placeholder={isAnonymous ? "Share a secret..." : "What's happening?"}
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2f3336]">
                    <div className="flex items-center gap-4">
                       {/* Category Selector */}
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-[#1d9bf0] hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] font-normal px-2">
                            {CATEGORIES.find(c => c.value === postCategory)?.emoji} {CATEGORIES.find(c => c.value === postCategory)?.label}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black border-[#2f3336] text-white">
                          {CATEGORIES.map(cat => (
                            <DropdownMenuItem key={cat.value} onClick={() => setPostCategory(cat.value)} className="hover:bg-[#181818] cursor-pointer">
                              {cat.emoji} {cat.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                       </DropdownMenu>

                       {/* Anonymous Toggle */}
                       <div className="flex items-center gap-2">
                         <Switch 
                            id="anon-mode" 
                            checked={isAnonymous}
                            onCheckedChange={setIsAnonymous}
                            className="data-[state=checked]:bg-[#1d9bf0]"
                         />
                         <Label htmlFor="anon-mode" className="text-[#1d9bf0] text-sm cursor-pointer">Anonymous</Label>
                       </div>
                    </div>

                    <Button 
                      className="bg-[#eff3f4] hover:bg-[#d7dbdc] text-black rounded-full font-bold px-5"
                      onClick={handlePost}
                      disabled={!content.trim() || isPosting}
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Feed Content */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1d9bf0]" />
                </div>
              ) : (
                <div className="pb-20 md:pb-0">
                  {displayedPosts.length === 0 ? (
                     <div className="p-8 text-center text-[#71767b]">
                        No posts yet. Be the first to post!
                     </div>
                  ) : (
                    displayedPosts.map((post) => (
                      <div key={post.id} className="p-4 border-b border-[#2f3336] flex hover:bg-white/[0.03] cursor-pointer transition-colors gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#222] flex-shrink-0 flex items-center justify-center font-bold text-sm text-gray-300">
                          {post.is_anonymous ? <Ghost className="w-5 h-5" /> : getInitials(post.author_name)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-1 text-[15px] leading-5">
                            <span className="font-bold text-[#e7e9ea] truncate max-w-[150px]">
                              {post.author_name}
                            </span>
                            {post.author_verified && <VerifiedBadge />}
                            <span className="text-[#71767b] truncate">
                              @{post.is_anonymous ? 'anonymous' : post.author_name.replace(/\s+/g, '').toLowerCase()}
                            </span>
                            <span className="text-[#71767b]">·</span>
                            <span className="text-[#71767b]">{timeAgo(post.created_at)}</span>
                            
                            {post.category !== 'general' && (
                              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#2f3336] text-[#71767b]">
                                {CATEGORIES.find(c => c.value === post.category)?.emoji} {post.category}
                              </span>
                            )}
                          </div>

                          <div className="text-[#e7e9ea] text-[15px] whitespace-pre-wrap mt-1 mb-3 break-words">
                            {post.content}
                          </div>
                          
                          <div className="flex justify-between max-w-[200px] text-[#71767b] text-[13px]">
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
              )}
            </>
          ) : (
            <div className="min-h-screen">
              {tab === 'dating' && <Dating />}
              {tab === 'chat' && <Chat />}
              {tab === 'profile' && <Profile onBack={() => setTab('feed')} />}
            </div>
          )}
        </main>

        {/* --- RIGHT SIDEBAR --- */}
        <aside className="hidden lg:block w-[350px] pl-8 py-3 h-screen sticky top-0 overflow-y-auto">
          <div className="bg-[#202327] rounded-full py-2.5 px-4 mb-5 flex items-center gap-3 focus-within:bg-black focus-within:border focus-within:border-[#1d9bf0] group border border-transparent">
             <Search className="w-5 h-5 text-[#71767b] group-focus-within:text-[#1d9bf0]" />
             <input type="text" placeholder="Search" className="bg-transparent border-none text-white outline-none w-full placeholder:text-[#71767b]" />
          </div>

          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl mb-4 overflow-hidden">
             <div className="py-3 px-4 text-xl font-extrabold text-[#e7e9ea] mb-2">Explore Topics</div>
             <div 
                className={`py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors ${filterCategory === 'all' ? 'bg-[#eff3f4]/5 border-l-2 border-[#1d9bf0]' : ''}`}
                onClick={() => setFilterCategory('all')}
             >
                <div className="text-[13px] text-[#71767b]">Everywhere</div>
                <div className="font-bold text-[15px]">All Posts</div>
             </div>
             {CATEGORIES.map((cat) => (
               <div 
                  key={cat.value}
                  className={`py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors ${filterCategory === cat.value ? 'bg-[#eff3f4]/5 border-l-2 border-[#1d9bf0]' : ''}`}
                  onClick={() => setFilterCategory(cat.value)}
               >
                  <div className="text-[13px] text-[#71767b]">Trending in {orgDomain}</div>
                  <div className="font-bold text-[15px] flex items-center gap-2">
                    {cat.emoji} {cat.label}s
                  </div>
               </div>
             ))}
          </div>
        </aside>

        {/* Mobile Navigation Bar (Bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-black border-t border-[#2f3336] flex justify-around py-3 z-50">
          <button onClick={() => setTab('feed')} className={`${tab === 'feed' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}><Globe /></button>
          <button onClick={() => setTab('dating')} className={`${tab === 'dating' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}><Flame /></button>
          <button onClick={() => setTab('chat')} className={`${tab === 'chat' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}><MessageCircle /></button>
          <button onClick={() => setTab('profile')} className={`${tab === 'profile' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}><User /></button>
        </div>

      </div>
    </div>
  );
};

export default Index;
