import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface PromptCategory {
  id: string;
  name: string;
  color: string | null;
  user_id: string;
  created_at: string;
}

interface CreatePromptModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: PromptCategory[];
  selectedCategoryId: string | null;
}

export function CreatePromptModal({ 
  open, 
  onClose, 
  onSuccess, 
  categories, 
  selectedCategoryId 
}: CreatePromptModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(selectedCategoryId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || !categoryId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('prompts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prompt created successfully.",
      });

      setTitle('');
      setContent('');
      setCategoryId(selectedCategoryId || '');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create prompt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setCategoryId(selectedCategoryId || '');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Prompt</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="prompt-title" className="text-white/90">
              Prompt Title
            </Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Email Response Template"
              className="glass-input mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="category-select" className="text-white/90">
              Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="glass-input mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="glass border-white/20">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prompt-content" className="text-white/90">
              Prompt Content
            </Label>
            <Textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your AI prompt here..."
              className="glass-input mt-1 min-h-[200px]"
              required
            />
            <p className="text-white/60 text-sm mt-1">
              {content.length} characters
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="glass-button-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !categoryId}
              className="glass-button"
            >
              {loading ? 'Creating...' : 'Create Prompt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}