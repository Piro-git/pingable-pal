import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface CreateCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckCreated?: () => void;
}

export function CreateCheckModal({ open, onOpenChange, onCheckCreated }: CreateCheckModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    intervalMinutes: 60,
  });

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

    if (!formData.name.trim()) {
      toast({
        title: "Error", 
        description: "Check name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('checks')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          interval_minutes: formData.intervalMinutes,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Check created successfully!",
      });

      // Reset form and close modal
      setFormData({ name: '', intervalMinutes: 60 });
      onOpenChange(false);
      onCheckCreated?.();
    } catch (error) {
      console.error('Error creating check:', error);
      toast({
        title: "Error",
        description: "Failed to create check. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border border-white/25 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Create New Check</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">Check Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="My API Service"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="glass border-white/25 text-white placeholder:text-white/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval" className="text-white/80">Interval (minutes)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="1440"
              value={formData.intervalMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) || 60 }))}
              className="glass border-white/25 text-white placeholder:text-white/50"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 glass-button border-white/25"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 glass-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Check'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}