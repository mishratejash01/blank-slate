import { DatingProfile } from '@/lib/dating-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, GraduationCap, Building2 } from 'lucide-react';

interface Props {
  profile: DatingProfile;
}

const SwipeCard = ({ profile }: Props) => {
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-border/50 shadow-xl overflow-hidden">
      <CardContent className="p-0">
        {/* Avatar area */}
        <div className="h-64 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center relative">
          <div className="h-28 w-28 rounded-full bg-primary/15 border-4 border-card flex items-center justify-center text-4xl font-bold text-primary shadow-lg">
            {initials}
          </div>
          {profile.is_verified && (
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
              <span className="text-lg text-muted-foreground">{profile.age}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {profile.organization_domain}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {profile.hometown}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>{profile.academic_year} · {profile.department}</span>
          </div>

          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>

          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 6).map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeCard;
