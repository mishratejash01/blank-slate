import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchPosts, createPost, toggleLike, PostWithAuthor } from '@/lib/feed-api';
import Dating from '@/pages/Dating';
import Chat from '@/pages/Chat';
import Settings from '@/pages/Settings';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// --- Icons (Using SVGs from design or Lucide) ---
const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px] fill-white" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] mr-5" fill="currentColor">
    {active ? (
      <path d="M22.46 7.57L12.357 2.115c-.223-.12-.49-.12-.713 0L1.543 7.57c-.364.197-.5.652-.303 1.017.135.25.394.393.66.393.12 0 .243-.03.356-.09l.815-.44L4.7 19.963c.214 1.215 1.308 2.06 2.658 1.977h9.282c1.35.083 2.444-.762 2.658-1.977L20.93 8.45l.815.44c.114.06.235.09.356.09.265 0 .524-.143.66-.393.197-.364.06-.82-.304-1.016zM12 3.92l8.2 4.43-8.2 4.43-8.2-4.43 8.2-4.43zm8.857 15.55c-.075.43-.455.736-.923.707H4.066c-.468.03-.848-.277-.923-.707L2.943 9.322l9.057 4.894 9.057-4.894-.2 10.15z"></path>
    ) : (
      <path d="M21.57 6.375L12.502 2.12c-.28-.14-.66-.14-.94 0L2.43 6.375c-.26.13-.43.39-.43.68v.117c0 .26.15.5.38.625l9.12 4.93c.15.08.31.12.48.12.16 0 .32-.04.47-.12l9.12-4.93c.23-.125.38-.365.38-.625v-.117c0-.29-.17-.55-.43-.68zm-9.56 4.39L4.47 6.88 12 3.35l7.53 3.53-7.52 3.885zm8.93 2.152l-8.94 4.83-8.94-4.83c-.23-.125-.51-.125-.74 0-.23.125-.38.365-.38.625v4.202c0 .28.22.5.5.5h18c.28 0 .5-.22.5-.5v-4.202c0-.26-.15-.5-.38-.625-.23-.125-.51-.125-.74 0zM4 14.542l8 4.32 8-4.32v3.458H4v-3.458z"></path>
    )}
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] mr-5" fill="currentColor">
     <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904l4.435 4.435 1.414-1.414-4.435-4.435c1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-4.5 6.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5-4.5-2.015-4.5-4.5z"></path>
  </svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] mr-5" fill="currentColor">
    {active ? (
       <path d="M1.998 5.5c0-1.38 1.12-2.5 2.5-2.5h15c1.38 0 2.5 1.12 2.5 2.5v13c0 1.38-1.12 2.5-2.5 2.5h-15c-1.38 0-2.5-1.12-2.5-2.5v-13zm2.5-.5c-.276 0-.5.22-.5.5v13c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-13c0-.28-.224-.5-.5-.5h-15z"></path>
    ) : (
       <path d="M1.998 5.5c0-1.38 1.12-2.5 2.5-2.5h15c1.38 0 2.5 1.12 2.5 2.5v13c0 1.38-1.12 2.5-2.5 2.5h-15c-1.38 0-2.5-1.12-2.5-2.5v-13zm2.5-.5c-.276 0-.5.22-.5.5v13c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-13c0-.28-.224-.5-.5-.5h-15z"></path>
    )}
    <path d="M12 11.5L2 5.68v1.85l10 5.4 10-5.4V5.68L12 11.5z"></path>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] mr-5" fill="currentColor">
    {active ? (
      <path d="M17.863 13.44c1.474.378 2.72 1.47 3.6 2.9.88 1.432 1.036 3.098.54 4.58l-1.636 4.88c-.68 2.023-2.6 3.42-4.72 3.42H8.354c-2.122 0-4.04-1.397-4.722-3.42l-1.635-4.88c-.497-1.482-.34-3.148.54-4.58.88-1.43 2.125-2.522 3.6-2.9l.484-.125V11.23c0-2.89 2.193-5.26 4.985-5.26 2.793 0 4.987 2.37 4.987 5.26v2.086l.484.125zM12 7.97c-1.69 0-3.045 1.507-3.045 3.26v1.94l-1.162.302c-.896.233-1.637.88-2.172 1.748-.535.87-.63 1.864-.328 2.766l1.635 4.88c.18.535.68.892 1.25.892h8.653c.57 0 1.07-.357 1.25-.892l1.637-4.88c.302-.902.207-1.896-.33-2.766-.534-.868-1.275-1.515-2.17-1.748l-1.163-.302V11.23c0-1.753-1.355-3.26-3.045-3.26z"></path>
    ) : (
      <path d="M5.651 19h12.698c-.337-1.8-1.596-3.26-3.13-3.75l-1.22-.39v-3.44c1.2-1.07 1.75-2.62 1.5-4.17-.3-1.86-1.74-3.25-3.6-3.25-1.86 0-3.3 1.39-3.6 3.25-.25 1.55.3 3.1 1.5 4.17v3.44l-1.22.39c-1.534.49-2.793 1.95-3.13 3.75z"></path>
    )}
  </svg>
);

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-[#1d9bf0] ml-1" fill="currentColor">
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96 1.41 1.41-6.37 6.37z"></path>
  </svg>
);

// --- Helper Functions ---
function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

const Index = () => {
  const { user, profile: authProfile, signOut } = useAuth();
  const [tab, setTab] = useState<'feed' | 'dating' | 'chat' | 'settings'>('feed');
  const [mode, setMode] = useState<'global' | 'org'>('global');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Fetch User Details
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

  // Fetch Posts
  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // In a real app, you'd handle pagination here
      const data = await fetchPosts(mode, user.id, 50, 0);
      setPosts(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading posts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [mode, user]);

  // Create Post
  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsPosting(true);
    try {
      // Visibility: if mode is org, post to org_only, else global. 
      // Defaulting to global for 'For you' tab, org_only for Org tab.
      const visibility = mode === 'org' ? 'org_only' : 'global';
      await createPost(user.id, content, visibility, false, 'general');
      setContent('');
      toast({ title: 'Post sent!' });
      loadPosts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to post' });
    } finally {
      setIsPosting(false);
    }
  };

  // Toggle Like
  const handleLike = async (post: PostWithAuthor) => {
    if (!user) return;
    // Optimistic update
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
      // Revert if failed
      loadPosts();
    }
  };

  const displayName = userProfile?.full_name || 'Student';
  const handle = `@${displayName.replace(/\s+/g, '').toLowerCase()}`;
  const orgDomain = authProfile?.organization_domain || 'Organization';

  return (
    <div className="flex justify-center min-h-screen bg-[#000000] text-[#e7e9ea] font-sans">
      <div className="flex w-full max-w-[1250px] h-screen">
        
        {/* LEFT SIDEBAR */}
        <nav className="w-[275px] px-3 flex flex-col border-r border-[#2f3336] h-full sticky top-0 overflow-y-auto hidden md:flex">
          <div className="p-3 w-fit hover:bg-[#1d9bf0]/10 rounded-full cursor-pointer transition-colors mb-2">
            <XLogo />
          </div>

          <div className="space-y-1 mb-4">
            <button onClick={() => setTab('feed')} className={`flex items-center p-3 text-xl rounded-full cursor-pointer transition-colors w-full hover:bg-[#eff3f4]/10 ${tab === 'feed' ? 'font-bold' : ''}`}>
              <HomeIcon active={tab === 'feed'} />
              <span>Home</span>
            </button>
            <button onClick={() => setTab('dating')} className={`flex items-center p-3 text-xl rounded-full cursor-pointer transition-colors w-full hover:bg-[#eff3f4]/10 ${tab === 'dating' ? 'font-bold' : ''}`}>
              <SearchIcon active={tab === 'dating'} />
              <span>Explore</span>
            </button>
            <button onClick={() => setTab('chat')} className={`flex items-center p-3 text-xl rounded-full cursor-pointer transition-colors w-full hover:bg-[#eff3f4]/10 ${tab === 'chat' ? 'font-bold' : ''}`}>
              <ChatIcon active={tab === 'chat'} />
              <span>Chat</span>
            </button>
            <button onClick={() => setTab('settings')} className={`flex items-center p-3 text-xl rounded-full cursor-pointer transition-colors w-full hover:bg-[#eff3f4]/10 ${tab === 'settings' ? 'font-bold' : ''}`}>
              <ProfileIcon active={tab === 'settings'} />
              <span>Profile</span>
            </button>
          </div>

          <button 
            className="bg-[#eff3f4] text-black border-none rounded-full py-[15px] px-8 text-[17px] font-bold mt-4 cursor-pointer w-[90%] hover:bg-[#d7dbdc] transition-colors"
            onClick={() => setTab('feed')} // Focuses feed to post
          >
            Post
          </button>

          <div className="mt-auto mb-3 flex items-center p-3 rounded-full cursor-pointer hover:bg-[#eff3f4]/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center font-bold text-lg mr-3">
              {getInitials(displayName)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-[15px] leading-5">{displayName}</div>
              <div className="text-[#71767b] text-[15px] leading-5">{handle}</div>
            </div>
            <div className="text-[#e7e9ea] ml-2">•••</div>
          </div>
        </nav>

        {/* MAIN FEED / CONTENT AREA */}
        <main className="flex-1 max-w-[600px] border-r border-[#2f3336] overflow-y-auto no-scrollbar">
          {tab === 'feed' ? (
            <>
              {/* Header */}
              <div className="flex border-b border-[#2f3336] sticky top-0 bg-black/80 backdrop-blur-md z-10">
                <div 
                  className={`flex-1 text-center py-4 font-bold cursor-pointer relative hover:bg-[#eff3f4]/10 transition-colors ${mode === 'global' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}
                  onClick={() => setMode('global')}
                >
                  For you
                  {mode === 'global' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                </div>
                <div 
                  className={`flex-1 text-center py-4 font-bold cursor-pointer relative hover:bg-[#eff3f4]/10 transition-colors ${mode === 'org' ? 'text-[#e7e9ea]' : 'text-[#71767b]'}`}
                  onClick={() => setMode('org')}
                >
                  {orgDomain}
                  {mode === 'org' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full"></div>}
                </div>
              </div>

              {/* Composer */}
              <div className="p-4 flex border-b border-[#2f3336]">
                <div className="w-10 h-10 rounded-full bg-[#444] mr-3 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                   {getInitials(displayName)}
                </div>
                <div className="flex-1 pt-2">
                  <textarea
                    className="bg-transparent border-none text-[#e7e9ea] text-xl w-full outline-none resize-none placeholder:text-[#71767b]"
                    placeholder="What's happening?"
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2f3336]">
                    <div className="flex gap-4 text-[#1d9bf0] text-sm font-bold">
                       {/* Mock Tools */}
                       <span className="cursor-pointer">🖼️</span>
                       <span className="cursor-pointer">GIF</span>
                       <span className="cursor-pointer">📊</span>
                       <span className="cursor-pointer">😀</span>
                    </div>
                    <button 
                      className="bg-[#eff3f4] text-black border-none rounded-full py-2 px-4 font-bold text-[15px] cursor-pointer hover:bg-[#d7dbdc] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handlePost}
                      disabled={!content.trim() || isPosting}
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tweets Feed */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1d9bf0]" />
                </div>
              ) : (
                <div>
                  {posts.map((post) => (
                    <div key={post.id} className="p-3 border-b border-[#2f3336] flex hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <div className="w-10 h-10 rounded-full bg-[#222] mr-3 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-300">
                        {getInitials(post.author_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5 truncate">
                          <span className="font-bold text-[#e7e9ea] truncate">{post.author_name}</span>
                          {post.author_verified && <VerifiedBadge />}
                          <span className="text-[#71767b] text-[15px] truncate">
                            @{post.author_name.replace(/\s+/g, '').toLowerCase()} · {timeAgo(post.created_at)}
                          </span>
                        </div>
                        <div className="text-[#e7e9ea] text-[15px] leading-5 whitespace-pre-wrap mb-3 break-words">
                          {post.content}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-between max-w-[425px] text-[#71767b] text-[13px]">
                          <div className="flex items-center gap-2 group cursor-pointer hover:text-[#1d9bf0]">
                            <span className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">💬</span>
                            <span>{post.comments_count}</span>
                          </div>
                          <div className="flex items-center gap-2 group cursor-pointer hover:text-[#00ba7c]">
                            <span className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">🔁</span>
                            <span>0</span>
                          </div>
                          <div 
                            className={`flex items-center gap-2 group cursor-pointer ${post.liked_by_me ? 'text-[#f91880]' : 'hover:text-[#f91880]'}`}
                            onClick={(e) => { e.stopPropagation(); handleLike(post); }}
                          >
                            <span className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                              {post.liked_by_me ? '❤️' : '🤍'}
                            </span>
                            <span>{post.likes_count}</span>
                          </div>
                           <div className="flex items-center gap-2 group cursor-pointer hover:text-[#1d9bf0]">
                            <span className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">📊</span>
                            <span>{(post.likes_count * 15) + (post.comments_count * 5)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-10 text-center text-[#71767b]">
                     You're all caught up!
                  </div>
                </div>
              )}
            </>
          ) : (
            // Render other tabs inside the layout
            <div className="min-h-screen bg-black">
              {tab === 'dating' && <Dating />}
              {tab === 'chat' && <Chat />}
              {tab === 'settings' && <Settings />}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[350px] pl-8 py-3 overflow-y-auto hidden lg:block">
          <div className="bg-[#202327] rounded-full py-3 px-5 mb-3 flex items-center gap-3 focus-within:bg-black focus-within:border focus-within:border-[#1d9bf0] group border border-transparent">
             <svg viewBox="0 0 24 24" className="w-5 fill-[#71767b] group-focus-within:fill-[#1d9bf0]"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904l4.435 4.435 1.414-1.414-4.435-4.435c1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-4.5 6.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5-4.5-2.015-4.5-4.5z"></path></svg>
             <input type="text" placeholder="Search" className="bg-transparent border-none text-white outline-none w-full placeholder:text-[#71767b]" />
          </div>

          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl mb-4 overflow-hidden">
             <div className="py-3 px-4 text-xl font-extrabold text-[#e7e9ea]">Live on X</div>
             <div className="py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors border-b border-[#2f3336]">
                <div className="flex items-center gap-1.5 text-[13px] text-[#71767b] mb-1">
                   <span className="text-red-500">🔴</span> {orgDomain} Admin is speaking
                </div>
                <div className="font-bold text-[15px]">Town Hall: Semester Updates</div>
             </div>
             <div className="py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors">
                <div className="flex items-center gap-1.5 text-[13px] text-[#71767b] mb-1">
                   <span className="text-red-500">🔴</span> Campus Radio
                </div>
                <div className="font-bold text-[15px]">Lo-fi beats to study to</div>
             </div>
          </div>

          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl mb-4 overflow-hidden">
             <div className="py-3 px-4 text-xl font-extrabold text-[#e7e9ea] flex justify-between">
               Today's News
             </div>
             
             {/* Mock News Items (Simulated Backend Data) */}
             <div className="py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors">
                <div className="text-[13px] text-[#71767b] mb-0.5">Campus · Trending</div>
                <div className="font-bold text-[15px] leading-5">Finals Week Schedule Released</div>
                <div className="text-[13px] text-[#71767b] mt-1">2.4K posts</div>
             </div>
             
             <div className="py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors">
                <div className="text-[13px] text-[#71767b] mb-0.5">Technology · Trending</div>
                <div className="font-bold text-[15px] leading-5">New AI Model Breaks Benchmarks</div>
                <div className="text-[13px] text-[#71767b] mt-1">15.2K posts</div>
             </div>

             <div className="py-3 px-4 hover:bg-[#eff3f4]/5 cursor-pointer transition-colors">
                <div className="text-[13px] text-[#71767b] mb-0.5">Sports · Live</div>
                <div className="font-bold text-[15px] leading-5">Inter-Hostel Cricket Tournament</div>
                <div className="text-[13px] text-[#71767b] mt-1">540 posts</div>
             </div>
          </div>
        </aside>

        {/* Mobile FAB */}
        <div className="fixed bottom-5 right-5 flex flex-col gap-3 md:hidden">
           <button onClick={() => setTab('feed')} className="w-[50px] h-[50px] bg-[#1d9bf0] rounded-full flex items-center justify-center text-white shadow-lg border border-white/10">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path></svg>
           </button>
        </div>

      </div>
    </div>
  );
};

export default Index;
