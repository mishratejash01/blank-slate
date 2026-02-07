import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Users, AlertTriangle, FileText, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminVerification from '@/components/admin/AdminVerification';
import AdminReports from '@/components/admin/AdminReports';
import AdminContent from '@/components/admin/AdminContent';
import AdminAnalytics from '@/components/admin/AdminAnalytics';

type Section = 'overview' | 'verification' | 'reports' | 'content' | 'analytics';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('overview');

  useEffect(() => {
    if (!user) return;
    checkIsAdmin(user.id)
      .then((val) => {
        setIsAdmin(val);
        setLoading(false);
      });
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="h-32 w-64" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="py-8 text-center space-y-3">
          <Shield className="h-12 w-12 mx-auto text-destructive/50" />
          <p className="text-lg font-semibold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">You do not have admin privileges.</p>
          <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
        </CardContent>
      </Card>
    </div>
  );

  const navItems = [
    { id: 'overview' as Section, label: 'Overview', icon: BarChart3 },
    { id: 'verification' as Section, label: 'Verification', icon: Users },
    { id: 'reports' as Section, label: 'Reports', icon: AlertTriangle },
    { id: 'content' as Section, label: 'Content', icon: FileText },
    { id: 'analytics' as Section, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">Admin Dashboard</span>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        {/* Nav */}
        <div className="flex gap-1 overflow-x-auto pb-3 mb-4">
          {navItems.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={section === item.id ? 'default' : 'ghost'}
              onClick={() => setSection(item.id)}
              className="gap-1.5 text-xs shrink-0"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        {section === 'overview' && <AdminAnalytics />}
        {section === 'verification' && <AdminVerification />}
        {section === 'reports' && <AdminReports />}
        {section === 'content' && <AdminContent />}
        {section === 'analytics' && <AdminAnalytics />}
      </div>
    </div>
  );
};

export default Admin;
