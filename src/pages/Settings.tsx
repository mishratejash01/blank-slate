import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkIsAdmin } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Shield, Globe, Building2, User, Mail, Search, AtSign, Check, X as XIcon } from 'lucide-react';
import { checkUsernameAvailability } from '@/lib/profile-api';

const AdminLink = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (user) checkIsAdmin(user.id).then(setIsAdmin);
  }, [user]);
  if (!isAdmin) return null;
  return (
    <Card className="border-border/50">
      <CardContent className="py-4">
        <Link to="/admin">
          <Button variant="outline" className="w-full gap-2">
            <Shield className="h-4 w-4" /> Admin Dashboard
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const [viewabilityGlobal, setViewabilityGlobal] = useState(true);
  const [searchableGlobal, setSearchableGlobal] = useState(true);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('viewability_global, searchable_global, username, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setViewabilityGlobal(data.viewability_global);
        setSearchableGlobal(data.searchable_global ?? true);
        setUsername(data.username || '');
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
        .update({ 
          viewability_global: viewabilityGlobal,
          searchable_global: searchableGlobal,
          username: username.trim().toLowerCase() || null,
        })
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
        <CardContent className="space-y-3 text-sm">
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
          
          {/* Username */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <AtSign className="h-3.5 w-3.5" /> Username
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={username}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
                  setUsername(val);
                  setUsernameAvailable(null);
                  if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
                  if (val.trim() && user) {
                    setCheckingUsername(true);
                    usernameDebounceRef.current = setTimeout(async () => {
                      const available = await checkUsernameAvailability(val.toLowerCase(), user.id);
                      setUsernameAvailable(available);
                      setCheckingUsername(false);
                    }, 500);
                  }
                }}
                placeholder="choose_a_username"
                className="h-8 text-sm"
              />
              {username && !checkingUsername && usernameAvailable !== null && (
                usernameAvailable ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <XIcon className="h-4 w-4 text-destructive shrink-0" />
                )
              )}
            </div>
            {username && !checkingUsername && usernameAvailable === false && (
              <p className="text-xs text-destructive">Username is already taken</p>
            )}
          </div>
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

          {/* Searchable Global Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="searchable" className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4 text-primary" />
                Searchable by Global Users
              </Label>
              <p className="text-xs text-muted-foreground">
                {searchableGlobal
                  ? 'Anyone can find you via username search.'
                  : 'Only users from your organization can find you.'}
              </p>
            </div>
            <Switch
              id="searchable"
              checked={searchableGlobal}
              onCheckedChange={setSearchableGlobal}
            />
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Eye className="h-3.5 w-3.5" /> How it works
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>Visible to Global:</strong> Controls who sees you in the dating section.</li>
              <li>• <strong>Searchable by Global:</strong> Controls who can find you via username search.</li>
              <li>• <strong>OFF:</strong> Only users from <strong>{profile?.organization_domain}</strong> can find/see you.</li>
            </ul>
          </div>

          <Button onClick={handleSave} disabled={saving || (username.trim() !== '' && usernameAvailable === false)} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Link */}
      <AdminLink />

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
