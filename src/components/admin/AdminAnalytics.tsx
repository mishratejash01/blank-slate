import { useState, useEffect } from 'react';
import { fetchAnalytics } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Users, CheckCircle, MessageSquare, Heart, AlertTriangle, Building2 } from 'lucide-react';

const AdminAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch((e) => toast({ variant: 'destructive', title: 'Error', description: e.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>;
  if (!data) return null;

  const stats = [
    { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Verified', value: data.verifiedUsers, icon: CheckCircle, color: 'text-success' },
    { label: 'Unverified', value: data.unverifiedUsers, icon: Users, color: 'text-muted-foreground' },
    { label: 'Total Posts', value: data.totalPosts, icon: MessageSquare, color: 'text-primary' },
    { label: 'Matches', value: data.totalMatches, icon: Heart, color: 'text-accent' },
    { label: 'Pending Reports', value: data.pendingReports, icon: AlertTriangle, color: 'text-accent' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-3 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Org Breakdown */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Users by Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.orgBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : data.orgBreakdown.map((org: any) => (
            <div key={org.domain} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{org.domain}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min((org.count / data.totalUsers) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{org.count}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
