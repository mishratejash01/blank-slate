import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, LogOut, CheckCircle, Clock, MessageSquare, Flame } from 'lucide-react';
import { useState } from 'react';
import Feed from '@/pages/Feed';
import Dating from '@/pages/Dating';

const Index = () => {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<'feed' | 'dating'>('feed');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">CampusConnect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {profile?.is_verified ? (
              <CheckCircle className="h-3.5 w-3.5 text-success" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{profile?.organization_domain}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 animate-fade-in">
        {!profile?.is_verified && (
          <Card className="mb-4 border-muted-foreground/20 bg-muted/50">
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">
                ⏳ Your account is pending verification. Some features may be limited.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg mb-4">
          <Button
            size="sm"
            variant={tab === 'feed' ? 'default' : 'ghost'}
            onClick={() => setTab('feed')}
            className="flex-1 gap-1.5"
          >
            <MessageSquare className="h-4 w-4" /> Feed
          </Button>
          <Button
            size="sm"
            variant={tab === 'dating' ? 'default' : 'ghost'}
            onClick={() => setTab('dating')}
            className="flex-1 gap-1.5"
          >
            <Flame className="h-4 w-4" /> Dating
          </Button>
        </div>

        {tab === 'feed' ? <Feed /> : <Dating />}
      </main>
    </div>
  );
};

export default Index;
