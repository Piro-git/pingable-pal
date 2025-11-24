import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const FOLDER_COLORS = [
  '#FB923C', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4', '#84CC16',
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D4BAFF', '#FFB3D4'
];

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFolderModal({ open, onClose, onSuccess }: CreateFolderModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          name: name.trim(),
          color: selectedColor,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder created successfully!",
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedColor(FOLDER_COLORS[0]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(251,146,60,0.15)] max-w-lg overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Create New Folder
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  Organize your prompts with a custom folder
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 relative mt-4">
          {/* Folder Name */}
          <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <Label htmlFor="folder-name" className="text-foreground font-semibold mb-2 block flex items-center gap-2">
              <span className="text-primary">●</span> Folder Name
            </Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Templates"
              className="bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 font-medium"
              required
            />
          </div>
          
          {/* Color Picker */}
          <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <Label className="text-foreground font-semibold mb-3 block flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Choose Color
            </Label>
            <div className="grid grid-cols-8 gap-3">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`group w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                    selectedColor === color 
                      ? 'border-primary ring-4 ring-primary/30 scale-110' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: selectedColor === color ? `0 0 20px ${color}40` : 'none'
                  }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <div className="w-full h-full rounded-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-background/50 border-border/50 text-foreground hover:bg-background/80 hover:border-primary/30 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-glow-primary font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
