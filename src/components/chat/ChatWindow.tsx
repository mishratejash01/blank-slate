import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMessages,
  sendMessage,
  markMessagesRead,
  hasAcknowledgedDisclaimer,
  acknowledgeDisclaimer,
  ChatMessage,
} from '@/lib/chat-api';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Flag, Send, ShieldOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import ChatDisclaimer from '@/components/chat/ChatDisclaimer';
import ReportDialog from '@/components/chat/ReportDialog';
import RatingStars from '@/components/chat/RatingStars';
import { getMyRating, upsertRating } from '@/lib/profile-api';

interface Props {
  matchId: string;
  otherUserId: string;
  otherName: string;
  otherBanned?: boolean;
  onBack: () => void;
}

const ChatWindow = ({ matchId, otherUserId, otherName, otherBanned, onBack }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [myRating, setMyRating] = useState<number | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check disclaimer + load rating
  useEffect(() => {
    if (!user) return;
    hasAcknowledgedDisclaimer(user.id, matchId).then((ack) => {
      if (!ack) setShowDisclaimer(true);
    });
    getMyRating(user.id, otherUserId).then(setMyRating);
  }, [user, matchId, otherUserId]);

  // Load messages
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const msgs = await fetchMessages(matchId);
        setMessages(msgs);
        await markMessagesRead(matchId, user.id);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId, user]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          if (user && newMsg.sender_id !== user.id) {
            markMessagesRead(matchId, user.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!user || !input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(matchId, user.id, input);
      setInput('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSending(false);
    }
  };

  const handleAcceptDisclaimer = async () => {
    if (!user) return;
    try {
      await acknowledgeDisclaimer(user.id, matchId);
      setShowDisclaimer(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const initials = otherName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <ChatDisclaimer open={showDisclaimer} onAccept={handleAcceptDisclaimer} />
      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        reporterId={user?.id || ''}
        reportedUserId={otherUserId}
        matchId={matchId}
      />

      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
          {initials}
        </div>
        <span className="font-semibold text-sm text-foreground flex-1">{otherName}</span>
        {/* Rating */}
        <RatingStars
          rating={myRating}
          size={14}
          onRate={async (rating) => {
            if (!user) return;
            try {
              await upsertRating(user.id, otherUserId, rating, matchId);
              setMyRating(rating);
              toast({ title: 'Rating saved!' });
            } catch (e: any) {
              toast({ variant: 'destructive', title: 'Error', description: e.message });
            }
          }}
        />
        {otherBanned && (
          <span className="text-[10px] text-destructive font-medium flex items-center gap-1">
            <ShieldOff className="h-3 w-3" /> Banned
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setShowReport(true)}>
          <Flag className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Say hello to {otherName}! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}
                >
                  <p className="break-words">{msg.message_text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {otherBanned ? (
        <div className="pt-3 border-t border-border text-center">
          <p className="text-xs text-destructive">This user has been banned. You can no longer send messages.</p>
        </div>
      ) : (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Input
            value={input}
            onChange={(e) => { if (e.target.value.length <= 1000) setInput(e.target.value); }}
            placeholder="Type a message..."
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={showDisclaimer}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending || showDisclaimer}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
