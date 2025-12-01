import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
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
      // Create the main prompt record first
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          folder_id: folderId === 'none' ? null : folderId
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Create the first version
      const { data: versionData, error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptData.id,
          title: title.trim(),
          content: content.trim(),
          version: 1,
          variables: detectedVariables,
          user_id: user.id
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update the prompt with the current version ID
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ current_version_id: versionData.id })
        .eq('id', promptData.id);

      if (updateError) throw updateError;

      // Handle tags - first remove existing ones
      const { error: deleteTagsError } = await supabase
        .from('prompt_tags')
        .delete()
        .eq('prompt_id', promptData.id);

      if (deleteTagsError) throw deleteTagsError;
      // Add new tags if any are selected
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
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new AI prompt template to organize your workflow.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="prompt-title">
              Prompt Title
            </Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Email Response Template"
              className="bg-background border-border"
              required
            />
          </div>

          <div>
            <Label htmlFor="folder">
              Folder (Optional)
            </Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none">
                  No folder
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
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
              <Label>
                Detected Variables ({detectedVariables.length})
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                {detectedVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="bg-primary/20 text-primary border-primary/30"
                  >
                    {"{{" + variable + "}}"}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                These variables can be filled in when using this template.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="prompt-content">
              Prompt Content
            </Label>
            <Textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your AI prompt here..."
              className="bg-background border-border min-h-[200px]"
              required
            />
            <p className="text-muted-foreground text-sm mt-1">
              {content.length} characters
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Prompt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}