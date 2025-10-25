import { ArrowRight, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsage: number;
  limit: number;
}

export function UpgradeModal({ open, onOpenChange, currentUsage, limit }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-primary/20 max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">
            You've reached your limit
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            You're using {currentUsage} of {limit} checks on the Free plan.
            Upgrade to Pro for unlimited monitoring and advanced features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Unlimited Checks</p>
                <p className="text-xs text-muted-foreground">Monitor as many workflows as you need</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Slack Notifications</p>
                <p className="text-xs text-muted-foreground">Get instant alerts in your Slack channels</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Priority Support</p>
                <p className="text-xs text-muted-foreground">Get help when you need it most</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              className="w-full shadow-glow-primary"
              onClick={() => {
                onOpenChange(false);
                navigate('/pricing');
              }}
            >
              Upgrade to Pro
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
