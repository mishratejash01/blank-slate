import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPosts, createPost, PostWithAuthor } from '@/lib/feed-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import CreatePostComponent from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import EmptyState from '@/components/EmptyState';
import { Globe, Building2, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

const Feed = () => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<'org' | 'global'>('global');
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

  const handlePost = async (content: string, visibility: 'org_only' | 'global') => {
    if (!user) return;
    try {
      await createPost(user.id, content, visibility);
      setLoading(true);
      await loadPosts();
      toast({ title: 'Posted!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

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
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts yet"
          description="Be the first to share something!"
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onRefresh={() => loadPosts()} />
          ))}
          {hasMore && (
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
