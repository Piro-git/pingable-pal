import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';
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
      <DialogContent className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(251,146,60,0.15)] max-w-3xl overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Create New Prompt
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  Build a powerful AI prompt template for your workflow
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 relative mt-4">
          {/* Title Input */}
          <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <Label htmlFor="prompt-title" className="text-foreground font-semibold mb-2 block flex items-center gap-2">
              <span className="text-primary">●</span> Prompt Title
            </Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Customer Support Email Template"
              className="bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 font-medium"
              required
            />
          </div>

          {/* Folder Select */}
          <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <Label htmlFor="folder" className="text-foreground font-semibold mb-2 block flex items-center gap-2">
              <span className="text-primary">◆</span> Folder (Optional)
            </Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="bg-background/80 border-border/50 text-foreground hover:border-primary/50 font-medium">
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 backdrop-blur-xl">
                <SelectItem 
                  value="none"
                  className="text-foreground hover:bg-primary/10 focus:bg-primary/10 font-medium"
                >
                  No folder
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem 
                    key={folder.id} 
                    value={folder.id}
                    className="text-foreground hover:bg-primary/10 focus:bg-primary/10 font-medium"
                  >
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Input */}
          <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <Label className="text-foreground font-semibold mb-2 block flex items-center gap-2">
              <span className="text-primary">◇</span> Tags (Optional)
            </Label>
            <TagInput 
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>

          {/* Detected Variables Section */}
          {detectedVariables.length > 0 && (
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm border border-accent/30 rounded-xl p-4 animate-fade-in">
              <Label className="text-foreground font-semibold mb-3 block flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Detected Variables ({detectedVariables.length})
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-background/30 backdrop-blur-sm rounded-lg border border-accent/20">
                {detectedVariables.map((variable) => (
                  <Badge
                    key={variable}
                    className="bg-gradient-to-r from-accent/30 to-accent/20 text-foreground border border-accent/40 font-mono px-3 py-1 hover:scale-105 transition-transform"
                  >
                    {"{{" + variable + "}}"}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground text-xs mt-2 flex items-center gap-1">
                <span className="text-accent">▸</span>
                These variables can be filled in when using this template
              </p>
            </div>
          )}

          {/* Prompt Content */}
          <div className="bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <Label htmlFor="prompt-content" className="text-foreground font-semibold mb-2 block flex items-center gap-2">
              <span className="text-primary">▸</span> Prompt Content
            </Label>
            <Textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your AI prompt here... Use {{variable_name}} to create dynamic placeholders."
              className="bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 min-h-[250px] font-mono text-sm leading-relaxed resize-none"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-muted-foreground text-xs">
                {content.length} characters
              </p>
              {content.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {content.split(/\s+/).filter(w => w).length} words
                </p>
              )}
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
              disabled={!title.trim() || !content.trim() || loading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-glow-primary font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Prompt
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
