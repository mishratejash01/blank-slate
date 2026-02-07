import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Send, Eye, EyeOff, Heart, MessageSquareText, Sparkles } from 'lucide-react';
import { PostCategory } from '@/lib/feed-api';

interface Props {
  onPost: (content: string, visibility: 'org_only' | 'global', isAnonymous: boolean, category: PostCategory) => Promise<void>;
}

const CATEGORY_CONFIG: Record<PostCategory, { label: string; emoji: string; icon: typeof Heart }> = {
  general: { label: 'General', emoji: '💬', icon: MessageSquareText },
  confession: { label: 'Confession', emoji: '🤫', icon: EyeOff },
  crush: { label: 'Crush', emoji: '💘', icon: Heart },
  spotted: { label: 'Spotted', emoji: '👀', icon: Sparkles },
};

const CreatePost = ({ onPost }: Props) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'org_only' | 'global'>('global');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<PostCategory>('general');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onPost(content, visibility, isAnonymous, category);
      setContent('');
      setIsAnonymous(false);
      setCategory('general');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => { if (e.target.value.length <= 280) setContent(e.target.value); }}
          placeholder={
            category === 'confession' ? "Share your confession..." :
            category === 'crush' ? "Describe your crush..." :
            category === 'spotted' ? "Who did you spot?" :
            "What's happening at your campus?"
          }
          className="resize-none min-h-[80px]"
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_CONFIG) as PostCategory[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <Badge
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                className={`cursor-pointer text-xs transition-colors ${
                  category === cat
                    ? cat === 'crush' ? 'bg-pink-500/90 hover:bg-pink-500 border-pink-500' :
                      cat === 'spotted' ? 'bg-amber-500/90 hover:bg-amber-500 border-amber-500' :
                      cat === 'confession' ? 'bg-violet-500/90 hover:bg-violet-500 border-violet-500' : ''
                    : ''
                }`}
                onClick={() => {
                  setCategory(cat);
                  if (cat === 'confession' || cat === 'crush') setIsAnonymous(true);
                }}
              >
                {cfg.emoji} {cfg.label}
              </Badge>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'org_only' | 'global')}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">🌍 Global</SelectItem>
                <SelectItem value="org_only">🏫 Organization Only</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
              <Checkbox
                checked={isAnonymous}
                onCheckedChange={(c) => setIsAnonymous(!!c)}
              />
              {isAnonymous ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Anonymous
            </label>

            <span className="text-xs text-muted-foreground">{content.length}/280</span>
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || loading}>
            <Send className="h-4 w-4 mr-1" /> Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
