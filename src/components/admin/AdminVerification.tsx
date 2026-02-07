import { useState, useEffect } from 'react';
import { fetchAllProfiles, verifyUser, rejectUser } from '@/lib/admin-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Search, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminVerification = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await fetchAllProfiles();
      setUsers(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id: string) => {
    try {
      await verifyUser(id);
      toast({ title: 'User verified' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectUser(id);
      toast({ title: 'User rejected' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.organization_domain.toLowerCase().includes(q) ||
      (u.user_profile?.full_name || '').toLowerCase().includes(q)
    );
  });

  const pending = filtered.filter((u) => !u.is_verified);
  const verified = filtered.filter((u) => u.is_verified);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  const UserCard = ({ u, showActions }: { u: any; showActions: boolean }) => (
    <Card key={u.id} className="border-border/50">
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{u.user_profile?.full_name || 'No profile'}</span>
              {u.is_verified && <CheckCircle className="h-3.5 w-3.5 text-success" />}
              <Badge variant="outline" className="text-[10px]">{u.organization_domain}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
            {u.user_profile && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>ID: {u.user_profile.college_id}</span>
                <span>Gender: {u.user_profile.gender}</span>
                <span>Year: {u.user_profile.academic_year}</span>
                <span>Dept: {u.user_profile.department}</span>
                <span>Phone: {u.user_profile.phone_number}</span>
                <span>Hometown: {u.user_profile.hometown}</span>
              </div>
            )}
            {u.user_profile?.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Bio: {u.user_profile.bio}</p>
            )}
          </div>
          {showActions && (
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" variant="outline" className="h-8 text-success border-success/30 hover:bg-success hover:text-success-foreground" onClick={() => handleVerify(u.id)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verify
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleReject(u.id)}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, or org..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="verified" className="flex-1">Verified ({verified.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-2 mt-3">
          {pending.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No pending users</p>
          ) : pending.map((u) => <UserCard key={u.id} u={u} showActions />)}
        </TabsContent>
        <TabsContent value="verified" className="space-y-2 mt-3">
          {verified.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No verified users</p>
          ) : verified.map((u) => <UserCard key={u.id} u={u} showActions={false} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVerification;
