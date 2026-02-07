import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: Props) => (
  <div className="text-center py-16 space-y-3">
    <Icon className="h-12 w-12 mx-auto text-muted-foreground/40" />
    <p className="text-lg font-medium text-muted-foreground">{title}</p>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
