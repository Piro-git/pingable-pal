import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface CreateCheckModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCheckModal({ open, onClose, onSuccess }: CreateCheckModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [interval, setInterval] = useState('5');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a check.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a check name.",
        variant: "destructive",
      });
      return;
    }

    const intervalNum = parseInt(interval);
    if (isNaN(intervalNum) || intervalNum < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid interval in minutes.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('checks')
        .insert({
          user_id: user.id,
          name: name.trim(),
          interval_minutes: intervalNum,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Check created successfully!",
      });

      // Reset form
      setName('');
      setInterval('5');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create check.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setInterval('5');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass rounded-2xl border border-white/25 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Create New Check
            </DialogTitle>
          </DialogHeader>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check-name" className="text-white/90 text-sm font-medium">
              Check Name
            </Label>
            <Input
              id="check-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Website"
              className="glass-input"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval" className="text-white/90 text-sm font-medium">
              Interval (minutes)
            </Label>
            <Input
              id="interval"
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              placeholder="5"
              className="glass-input"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 glass-button-secondary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 glass-button"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Check"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}