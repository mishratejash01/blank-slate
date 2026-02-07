import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Props {
  onPost: (content: string, visibility: 'org_only' | 'global') => Promise<void>;
}

const CreatePost = ({ onPost }: Props) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'org_only' | 'global'>('global');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onPost(content, visibility);
      setContent('');
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
          placeholder="What's happening at your campus?"
          className="resize-none min-h-[80px]"
        />
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
