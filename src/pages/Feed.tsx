import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPosts, createPost, PostWithAuthor } from '@/lib/feed-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import CreatePostComponent from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import { Globe, Building2 } from 'lucide-react';

const Feed = () => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<'org' | 'global'>('global');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchPosts(mode, user.id);
      setPosts(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error loading feed', description: e.message });
    } finally {
      setLoading(false);
    }
  }, [user, mode]);

  useEffect(() => {
    setLoading(true);
    loadPosts();
  }, [loadPosts]);

  const handlePost = async (content: string, visibility: 'org_only' | 'global') => {
    if (!user) return;
    try {
      await createPost(user.id, content, visibility);
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
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onRefresh={loadPosts} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
