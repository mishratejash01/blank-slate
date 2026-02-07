import { useState, useEffect } from 'react';
import { fetchAllReports, updateReportStatus, banUser, unbanUser } from '@/lib/admin-api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Shield, ShieldOff } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-accent/10 text-accent',
  reviewed: 'bg-primary/10 text-primary',
  action_taken: 'bg-success/10 text-success',
};

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialog, setBanDialog] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('');
  const [banPermanent, setBanPermanent] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const data = await fetchAllReports();
      setReports(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      await updateReportStatus(reportId, status, adminNotes);
      toast({ title: 'Report updated' });
      setAdminNotes('');
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleBan = async () => {
    if (!user || !banDialog || !banReason) return;
    try {
      await banUser(
        banDialog.reported_user_id,
        user.id,
        banReason,
        banPermanent ? undefined : parseInt(banDays) || 7,
        banPermanent
      );
      await updateReportStatus(banDialog.id, 'action_taken', `Banned: ${banReason}`);
      toast({ title: 'User banned' });
      setBanDialog(null);
      setBanReason('');
      setBanDays('');
      setBanPermanent(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-4">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Reports</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
          <SelectItem value="action_taken">Action Taken</SelectItem>
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No reports found</p>
      ) : filtered.map((r) => (
        <Card key={r.id} className="border-border/50">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <span className="font-semibold text-sm">{r.reason}</span>
                <Badge className={`text-[10px] ${statusColors[r.status] || ''}`}>{r.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Reporter: <span className="text-foreground">{r.reporter_name}</span></p>
              <p>Reported: <span className="text-foreground">{r.reported_name}</span></p>
              {r.details && <p className="mt-1">{r.details}</p>}
              {r.admin_notes && <p className="mt-1 text-primary">Admin: {r.admin_notes}</p>}
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdateStatus(r.id, 'reviewed')}>
                  Mark Reviewed
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdateStatus(r.id, 'action_taken')}>
                  Dismiss
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setBanDialog(r)}>
                  <Shield className="h-3 w-3 mr-1" /> Ban User
                </Button>
              </div>
            )}
            {r.status === 'action_taken' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={async () => {
                  try {
                    await unbanUser(r.reported_user_id);
                    toast({ title: 'User unbanned' });
                    load();
                  } catch (e: any) {
                    toast({ variant: 'destructive', title: 'Error', description: e.message });
                  }
                }}>
                  <ShieldOff className="h-3 w-3" /> Unban User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User: {banDialog?.reported_name}</DialogTitle>
            <DialogDescription>This will restrict the user's access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason for ban" />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label>Duration (days)</Label>
                <Select value={banPermanent ? 'permanent' : banDays} onValueChange={(v) => {
                  if (v === 'permanent') { setBanPermanent(true); setBanDays(''); }
                  else { setBanPermanent(false); setBanDays(v); }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleBan} disabled={!banReason} className="w-full" variant="destructive">
              Confirm Ban
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
