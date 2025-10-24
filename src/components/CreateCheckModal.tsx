import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Radio, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const CHECK_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D4BAFF', '#FFB3D4'
];

interface CreateCheckModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  groups?: Array<{ id: string; name: string; created_at: string }>;
}

const CreateCheckModal: React.FC<CreateCheckModalProps> = ({ open, onClose, onSuccess, groups = [] }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [interval, setInterval] = useState('5');
  const [groupId, setGroupId] = useState<string>('none');
  const [selectedColor, setSelectedColor] = useState(CHECK_COLORS[0]);
  const [type, setType] = useState<'simple_ping' | 'api_report'>('simple_ping');
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
          group_id: groupId === 'none' ? null : groupId,
          color: selectedColor,
          type: type,
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
      setGroupId('none');
      setSelectedColor(CHECK_COLORS[0]);
      setType('simple_ping');
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
    setGroupId('none');
    setSelectedColor(CHECK_COLORS[0]);
    setType('simple_ping');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Create New Check
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Set up a new service monitoring check to track your workflows
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Check Name */}
          <div className="space-y-2">
            <Label htmlFor="check-name" className="text-foreground font-semibold">
              Check Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="check-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production API, Customer Portal"
              className="bg-background border-border text-foreground"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Give your check a descriptive name
            </p>
          </div>

          {/* Check Type */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold">
              Check Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('simple_ping')}
                disabled={loading}
                className={`group relative overflow-hidden rounded-xl p-5 text-left transition-all border-2 ${
                  type === 'simple_ping'
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${
                    type === 'simple_ping' ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Radio className={`w-6 h-6 ${
                      type === 'simple_ping' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold mb-1.5 ${
                      type === 'simple_ping' ? 'text-foreground' : 'text-foreground'
                    }`}>
                      Simple Ping (GET)
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      Basic heartbeat monitoring to confirm service availability
                    </div>
                  </div>
                </div>
                {type === 'simple_ping' && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setType('api_report')}
                disabled={loading}
                className={`group relative overflow-hidden rounded-xl p-5 text-left transition-all border-2 ${
                  type === 'api_report'
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${
                    type === 'api_report' ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Send className={`w-6 h-6 ${
                      type === 'api_report' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold mb-1.5 ${
                      type === 'api_report' ? 'text-foreground' : 'text-foreground'
                    }`}>
                      API Report (POST)
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      Advanced reporting with KPIs, metrics, and error details
                    </div>
                  </div>
                </div>
                {type === 'api_report' && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Interval & Group Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Interval */}
            <div className="space-y-2">
              <Label htmlFor="interval" className="text-foreground font-semibold">
                Check Interval <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  placeholder="5"
                  className="bg-background border-border text-foreground pr-20"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  minutes
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                How often to check (minimum 1 minute)
              </p>
            </div>

            {/* Group */}
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="group" className="text-foreground font-semibold">
                  Group
                </Label>
                <Select value={groupId} onValueChange={setGroupId} disabled={loading}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select group..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optional: organize your checks
                </p>
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold">
              Visual Indicator Color
            </Label>
            <div className="flex flex-wrap gap-2.5">
              {CHECK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`relative w-11 h-11 rounded-lg transition-all hover:scale-110 ${
                    selectedColor === color 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' 
                      : 'hover:ring-2 hover:ring-muted-foreground/30'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color}`}
                >
                  {selectedColor === color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white shadow-lg"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color to identify this check at a glance
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Check"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { CreateCheckModal };