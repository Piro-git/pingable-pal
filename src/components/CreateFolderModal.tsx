import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
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
      <DialogContent className="glass border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Folder</DialogTitle>
          <DialogDescription className="text-white/70">
            Create a new folder to organize your prompts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="folder-name" className="text-white">
              Folder Name
            </Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
              required
            />
          </div>
          
          <div>
            <Label className="text-white mb-3 block">Choose Color</Label>
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-white scale-110' 
                      : 'border-white/30 hover:border-white/60'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="glass border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="glass-button"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}