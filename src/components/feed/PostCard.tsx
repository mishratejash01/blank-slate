import { useState } from 'react';
import { PostWithAuthor, toggleLike, fetchComments, addComment, Comment } from '@/lib/feed-api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, CheckCircle, Globe, Building2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  post: PostWithAuthor;
  onRefresh: () => void;
}

const PostCard = ({ post, onRefresh }: Props) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [liking, setLiking] = useState(false);

  const initials = post.author_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      await toggleLike(post.id, user.id, post.liked_by_me);
      onRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setLiking(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const data = await fetchComments(post.id);
        setComments(data);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;
    try {
      await addComment(post.id, user.id, commentText);
      setCommentText('');
      const data = await fetchComments(post.id);
      setComments(data);
      onRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) return;
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      onRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4">
        {/* Author */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{post.author_name}</span>
              {post.author_verified && <CheckCircle className="h-3.5 w-3.5 text-success" />}
              <span className="text-xs text-muted-foreground">@{post.author_org}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {post.visibility === 'org_only' ? (
                <Building2 className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Globe className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm mt-1 text-foreground whitespace-pre-wrap break-words">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  post.liked_by_me ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                }`}
              >
                <Heart className={`h-4 w-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
                {post.likes_count > 0 && post.likes_count}
              </button>
              <button
                onClick={handleToggleComments}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                {post.comments_count > 0 && post.comments_count}
              </button>
              {user?.id === post.user_id && (
                <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {loadingComments ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                  <>
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2 text-xs">
                        <span className="font-semibold text-foreground">{c.author_name}</span>
                        <span className="text-foreground">{c.comment_text}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet</p>}
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={commentText}
                        onChange={(e) => { if (e.target.value.length <= 280) setCommentText(e.target.value); }}
                        placeholder="Write a comment..."
                        className="h-8 text-xs"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                      />
                      <Button size="sm" variant="outline" onClick={handleAddComment} disabled={!commentText.trim()} className="h-8 text-xs">
                        Reply
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
