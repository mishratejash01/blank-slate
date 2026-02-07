import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchChatList, ChatMatch } from '@/lib/chat-api';
import ChatWindow from '@/components/chat/ChatWindow';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const Chat = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<ChatMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<ChatMatch | null>(null);

  const loadMatches = async () => {
    if (!user) return;
    try {
      const data = await fetchChatList(user.id);
      setMatches(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [user]);

  if (activeChat) {
    return (
      <ChatWindow
        matchId={activeChat.match_id}
        otherUserId={activeChat.other_user_id}
        otherName={activeChat.other_name}
        onBack={() => { setActiveChat(null); loadMatches(); }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-lg font-medium text-muted-foreground">No matches yet</p>
        <p className="text-sm text-muted-foreground">Start swiping to find your matches!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">Messages</h2>
      {matches.map((m) => {
        const initials = m.other_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Card
            key={m.match_id}
            className="cursor-pointer border-border/50 hover:bg-secondary/50 transition-colors"
            onClick={() => setActiveChat(m)}
          >
            <CardContent className="py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{m.other_name}</span>
                  {m.unread_count > 0 && (
                    <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-accent text-accent-foreground">
                      {m.unread_count}
                    </Badge>
                  )}
                </div>
                {m.last_message ? (
                  <p className="text-xs text-muted-foreground truncate">{m.last_message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No messages yet</p>
                )}
              </div>
              {m.last_message_at && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(m.last_message_at), { addSuffix: true })}
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Chat;
