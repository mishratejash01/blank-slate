import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPosts, createPost, PostWithAuthor, PostCategory } from '@/lib/feed-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import CreatePostComponent from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/EmptyState';
import { Globe, Building2, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

const CATEGORY_FILTERS: { value: PostCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📋' },
  { value: 'general', label: 'General', emoji: '💬' },
  { value: 'confession', label: 'Confessions', emoji: '🤫' },
  { value: 'crush', label: 'Crush', emoji: '💘' },
  { value: 'spotted', label: 'Spotted', emoji: '👀' },
];

const Feed = () => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<'org' | 'global'>('global');
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | 'all'>('all');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async (append = false) => {
    if (!user) return;
    try {
      setError(null);
      const offset = append ? posts.length : 0;
      const data = await fetchPosts(mode, user.id, PAGE_SIZE, offset);
      if (append) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length >= PAGE_SIZE);
    } catch (e: any) {
      setError(e.message);
      toast({ variant: 'destructive', title: 'Error loading feed', description: e.message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, mode, posts.length]);

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    setPosts([]);
    loadPosts();
  }, [mode, user]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    loadPosts(true);
  };

  const handlePost = async (content: string, visibility: 'org_only' | 'global', isAnonymous: boolean, category: PostCategory) => {
    if (!user) return;
    try {
      await createPost(user.id, content, visibility, isAnonymous, category);
      setLoading(true);
      await loadPosts();
      toast({ title: 'Posted!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const filteredPosts = categoryFilter === 'all'
    ? posts
    : posts.filter((p) => p.category === categoryFilter);

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
          <Building2 className="h-3.5 w-3.5" /> {profile?.organization_domain || 'Organization'}
        </Button>
      </div>

      <CreatePostComponent onPost={handlePost} />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_FILTERS.map((cat) => (
          <Badge
            key={cat.value}
            variant={categoryFilter === cat.value ? 'default' : 'outline'}
            className={`cursor-pointer text-xs transition-colors ${
              categoryFilter === cat.value
                ? cat.value === 'crush' ? 'bg-pink-500/90 hover:bg-pink-500' :
                  cat.value === 'spotted' ? 'bg-amber-500/90 hover:bg-amber-500' :
                  cat.value === 'confession' ? 'bg-violet-500/90 hover:bg-violet-500' : ''
                : 'hover:bg-secondary'
            }`}
            onClick={() => setCategoryFilter(cat.value)}
          >
            {cat.emoji} {cat.label}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadPosts(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={categoryFilter !== 'all' ? `No ${categoryFilter} posts yet` : 'No posts yet'}
          description="Be the first to share something!"
        />
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onRefresh={() => loadPosts()} />
          ))}
          {hasMore && categoryFilter === 'all' && (
            <div className="text-center pt-2 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading...</>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
