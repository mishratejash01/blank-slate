import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onAccept: () => void;
}

const GUIDELINES = [
  { title: 'Respectful Communication', text: 'Treat everyone with respect and dignity.' },
  { title: 'Consent', text: 'Never share explicit content without mutual consent.' },
  { title: 'Privacy', text: "Don't share personal information (address, financial details) prematurely." },
  { title: 'Safety', text: 'Meet in public places for first meetings.' },
  { title: 'Prohibited', text: 'Harassment, hate speech, threats, and illegal activities are strictly forbidden.' },
  { title: 'Age Verification', text: 'All users must be 18+ for dating features.' },
  { title: 'Report Abuse', text: 'Use the report button if you experience inappropriate behavior.' },
  { title: 'Platform Rules', text: 'Violation may result in permanent ban.' },
];

const ChatDisclaimer = ({ open, onAccept }: Props) => (
  <Dialog open={open}>
    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Important Guidelines & Legal Notice
        </DialogTitle>
        <DialogDescription>
          Please read and acknowledge before chatting.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 my-2">
        {GUIDELINES.map((g, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="font-bold text-primary shrink-0">{i + 1}.</span>
            <div>
              <span className="font-semibold text-foreground">{g.title}:</span>{' '}
              <span className="text-muted-foreground">{g.text}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        By clicking "I Understand", you agree to follow these guidelines.
      </p>

      <Button onClick={onAccept} className="w-full mt-2">
        I Understand
      </Button>
    </DialogContent>
  </Dialog>
);

export default ChatDisclaimer;
