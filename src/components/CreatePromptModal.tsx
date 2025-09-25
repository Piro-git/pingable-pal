import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { TagInput } from './TagInput';
import { extractVariables } from '@/utils/templateUtils';

interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface CreatePromptModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: Folder[];
  selectedFolderId: string | null;
}

export function CreatePromptModal({ 
  open, 
  onClose, 
  onSuccess, 
  folders, 
  selectedFolderId 
}: CreatePromptModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState(selectedFolderId || 'none');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  // Real-time variable detection
  useEffect(() => {
    const variables = extractVariables(content);
    setDetectedVariables(variables);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      // Create the prompt
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          folder_id: folderId === 'none' ? null : folderId,
          category_id: null, // For backward compatibility during transition
          user_id: user.id,
          version: 1,
          variables: detectedVariables
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Add tags if any are selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          prompt_id: promptData.id,
          tag_id: tag.id
        }));

        const { error: tagsError } = await supabase
          .from('prompt_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({
        title: "Success",
        description: "Prompt created successfully!",
      });

      handleClose();
      onSuccess();
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
    setFolderId(selectedFolderId || 'none');
    setSelectedTags([]);
    setDetectedVariables([]);
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
            <Label htmlFor="prompt-title" className="text-white">
              Prompt Title
            </Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Email Response Template"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
              required
            />
          </div>

          <div>
            <Label htmlFor="folder" className="text-white">
              Folder (Optional)
            </Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-white/30">
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent className="glass border-white/20">
                <SelectItem 
                  value="none"
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  No folder
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem 
                    key={folder.id} 
                    value={folder.id}
                    className="text-white hover:bg-white/10 focus:bg-white/10"
                  >
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">
              Tags (Optional)
            </Label>
            <TagInput 
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>

          {/* Detected Variables Section */}
          {detectedVariables.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white">
                Detected Variables ({detectedVariables.length})
              </Label>
              <div className="flex flex-wrap gap-2 p-3 glass rounded-lg">
                {detectedVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="glass-button text-white border-white/30 bg-blue-500/20"
                  >
                    {"{{" + variable + "}}"}
                  </Badge>
                ))}
              </div>
              <p className="text-white/60 text-xs">
                These variables can be filled in when using this template.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="prompt-content" className="text-white">
              Prompt Content
            </Label>
            <Textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your AI prompt here..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30 min-h-[200px]"
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
              className="glass border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || loading}
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