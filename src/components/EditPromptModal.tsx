import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { TagInput } from './TagInput';
import { VersionHistoryModal } from './VersionHistoryModal';
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

interface PromptVersion {
  id: string;
  title: string;
  content: string;
  version: number;
  folder_id: string | null;
  variables: string[];
  created_at: string;
  tags?: Tag[];
}

interface EditPromptModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: Folder[];
  promptId: string;
  currentVersionId: string;
}

export function EditPromptModal({ 
  open, 
  onClose, 
  onSuccess, 
  folders, 
  promptId,
  currentVersionId
}: EditPromptModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('none');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<PromptVersion | null>(null);

  // Real-time variable detection
  useEffect(() => {
    const variables = extractVariables(content);
    setDetectedVariables(variables);
  }, [content]);

  // Load current version data when modal opens
  useEffect(() => {
    if (open && currentVersionId) {
      loadCurrentVersion();
    }
  }, [open, currentVersionId]);

  const loadCurrentVersion = async () => {
    try {
      const { data: versionData, error: versionError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', currentVersionId)
        .single();

      if (versionError) throw versionError;

      // Get tags separately
      const { data: tagsData, error: tagsError } = await supabase
        .from('prompt_tags')
        .select(`
          tags!inner(
            id,
            name,
            color
          )
        `)
        .eq('prompt_id', promptId);

      if (tagsError) throw tagsError;

      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('folder_id')
        .eq('id', promptId)
        .single();

      if (promptError) throw promptError;

      const processedVersion = {
        ...versionData,
        folder_id: promptData.folder_id,
        variables: versionData.variables as string[] || [],
        tags: tagsData?.map((t: any) => t.tags) || []
      };

      setCurrentVersion(processedVersion);
      setTitle(processedVersion.title);
      setContent(processedVersion.content);
      setFolderId(processedVersion.folder_id || 'none');
      setSelectedTags(processedVersion.tags || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load prompt data.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || !currentVersion) return;

    setLoading(true);
    try {
      // Create new version
      const newVersion = currentVersion.version + 1;
      
      const { data: newVersionData, error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          title: title.trim(),
          content: content.trim(),
          version: newVersion,
          variables: detectedVariables,
          user_id: user.id
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update prompt folder and current version
      const { error: promptError } = await supabase
        .from('prompts')
        .update({
          folder_id: folderId === 'none' ? null : folderId,
          current_version_id: newVersionData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId);

      if (promptError) throw promptError;

      // Handle tags - first remove existing ones
      const { error: deleteTagsError } = await supabase
        .from('prompt_tags')
        .delete()
        .eq('prompt_id', promptId);

      if (deleteTagsError) throw deleteTagsError;

      // Add new tags if any
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          prompt_id: promptId,
          tag_id: tag.id
        }));

        const { error: tagsError } = await supabase
          .from('prompt_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({
        title: "Success",
        description: `Prompt updated to version ${newVersion}!`,
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update prompt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setFolderId('none');
    setSelectedTags([]);
    setDetectedVariables([]);
    setCurrentVersion(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass border-white/20 max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white">Edit Prompt</DialogTitle>
                <DialogDescription className="text-white/70">
                  Make changes to your prompt template.
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(true)}
                className="glass border-white/20 text-white hover:bg-white/10"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
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
                {loading ? 'Saving...' : 'Save New Version'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <VersionHistoryModal
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        promptId={promptId}
        currentVersionId={currentVersionId}
        onVersionRestored={() => {
          setShowVersionHistory(false);
          onSuccess();
        }}
      />
    </>
  );
}