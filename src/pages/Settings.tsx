import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, Globe, Building2, User, Mail } from 'lucide-react';

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const [viewabilityGlobal, setViewabilityGlobal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('viewability_global, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setViewabilityGlobal(data.viewability_global);
        setUserProfile(data);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ viewability_global: viewabilityGlobal })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Settings saved', description: 'Your privacy preferences have been updated.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account Info */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>{profile?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{profile?.organization_domain}</span>
          </div>
          {userProfile?.full_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{userProfile.full_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Privacy & Viewability
          </CardTitle>
          <CardDescription>Control who can see your profile in the dating section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="viewability" className="flex items-center gap-2 text-sm font-medium">
                {viewabilityGlobal ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                Visible to Global Users
              </Label>
              <p className="text-xs text-muted-foreground">
                {viewabilityGlobal
                  ? 'Your profile is visible to users from all organizations in the dating section.'
                  : 'Your profile is only visible to users within your organization.'}
              </p>
            </div>
            <Switch
              id="viewability"
              checked={viewabilityGlobal}
              onCheckedChange={setViewabilityGlobal}
            />
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Eye className="h-3.5 w-3.5" /> How it works
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>ON:</strong> Users from any organization can discover you while swiping in Global mode.</li>
              <li>• <strong>OFF:</strong> Only users from <strong>{profile?.organization_domain}</strong> can see your profile.</li>
              <li>• This setting only affects the dating feature, not the social feed.</li>
            </ul>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-border/50">
        <CardContent className="py-4">
          <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
