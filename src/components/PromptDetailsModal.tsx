import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, History as HistoryIcon, Settings, Eye, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { TagInput } from './TagInput';
import { FeedbackSection } from './FeedbackSection';
import { extractVariables } from '@/utils/templateUtils';
import { format } from 'date-fns';

interface Folder {
  id: string;
  name: string;
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
  created_at: string;
  variables: string[];
  tags?: Tag[];
}

interface PromptDetailsModalProps {
  open: boolean;
  onClose: () => void;
  promptId: string;
  currentVersionId: string;
  folders: Folder[];
  onSuccess: () => void;
}

export function PromptDetailsModal({
  open,
  onClose,
  promptId,
  currentVersionId,
  folders,
  onSuccess
}: PromptDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<PromptVersion | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  
  // Edit state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('none');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  useEffect(() => {
    if (open && promptId) {
      loadPromptData();
      loadVersionHistory();
    }
  }, [open, promptId, currentVersionId]);

  useEffect(() => {
    const variables = extractVariables(content);
    setDetectedVariables(variables);
  }, [content]);

  const loadPromptData = async () => {
    try {
      const { data: versionData, error: versionError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', currentVersionId)
        .single();

      if (versionError) throw versionError;

      const { data: tagsData, error: tagsError } = await supabase
        .from('prompt_tags')
        .select(`tags!inner(id, name, color)`)
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
        variables: (versionData.variables as string[]) || [],
        tags: tagsData?.map((t: any) => t.tags) || []
      };

      setCurrentVersion(processedVersion);
      setTitle(processedVersion.title);
      setContent(processedVersion.content);
      setFolderId(promptData.folder_id || 'none');
      setSelectedTags(processedVersion.tags || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load prompt data.",
        variant: "destructive",
      });
    }
  };

  const loadVersionHistory = async () => {
    try {
      const { data: versionsData, error: versionsError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version', { ascending: false });

      if (versionsError) throw versionsError;

      const processedVersions = versionsData.map(v => ({
        ...v,
        variables: (v.variables as string[]) || []
      }));

      setVersions(processedVersions);
      const current = processedVersions.find(v => v.id === currentVersionId);
      setSelectedVersion(current || processedVersions[0]);
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  };

  const handleCopyPrompt = async () => {
    if (!currentVersion) return;
    
    try {
      await navigator.clipboard.writeText(currentVersion.content);
      toast({
        title: "Copied!",
        description: "Prompt content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !title.trim() || !content.trim() || !currentVersion) return;

    setLoading(true);
    try {
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

      const { error: promptError } = await supabase
        .from('prompts')
        .update({
          folder_id: folderId === 'none' ? null : folderId,
          current_version_id: newVersionData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId);

      if (promptError) throw promptError;

      const { error: deleteTagsError } = await supabase
        .from('prompt_tags')
        .delete()
        .eq('prompt_id', promptId);

      if (deleteTagsError) throw deleteTagsError;

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

      onSuccess();
      onClose();
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

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const maxVersion = Math.max(...versions.map(v => v.version));
      const newVersion = maxVersion + 1;

      const { data: tagsData } = await supabase
        .from('prompt_tags')
        .select(`tags!inner(id, name, color)`)
        .eq('prompt_id', promptId);

      const { data: newVersionData, error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          title: version.title,
          content: version.content,
          version: newVersion,
          variables: version.variables,
          user_id: user.id
        })
        .select()
        .single();

      if (versionError) throw versionError;

      const { error: promptError } = await supabase
        .from('prompts')
        .update({
          current_version_id: newVersionData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId);

      if (promptError) throw promptError;

      if (tagsData && tagsData.length > 0) {
        const tagInserts = tagsData.map((t: any) => ({
          prompt_id: promptId,
          tag_id: t.tags.id
        }));

        await supabase.from('prompt_tags').insert(tagInserts);
      }

      toast({
        title: "Success",
        description: `Restored version ${version.version} as version ${newVersion}`,
      });

      loadPromptData();
      loadVersionHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore version.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentVersion) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card backdrop-blur-lg border border-accent/20 shadow-2xl max-w-5xl h-[85vh] flex flex-col p-0">
        <div className="p-6 border-b border-border">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {currentVersion.title}
                </DialogTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Version {currentVersion.version}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 border-b border-border">
            <TabsList className="bg-background/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-accent/20">
                <Eye className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-accent/20">
                <HistoryIcon className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-accent/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-accent/20">
                <Star className="w-4 h-4 mr-2" />
                Feedback
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="overview" className="space-y-6 py-6">
              <div className="text-muted-foreground text-sm">
                Created {format(new Date(currentVersion.created_at), 'PPP')}
              </div>

              {currentVersion.tags && currentVersion.tags.length > 0 && (
                <div>
                  <Label className="text-foreground font-semibold mb-2 block">Tags:</Label>
                  <div className="flex flex-wrap gap-2">
                    {currentVersion.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-background/50 text-foreground border border-border"
                        style={{ backgroundColor: tag.color ? `${tag.color}30` : undefined }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentVersion.variables.length > 0 && (
                <div>
                  <Label className="text-foreground font-semibold mb-2 block">
                    Variables ({currentVersion.variables.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-background/50 border border-border rounded-lg">
                    {currentVersion.variables.map((variable) => (
                      <Badge
                        key={variable}
                        variant="secondary"
                        className="bg-accent/20 text-foreground border border-accent/30"
                      >
                        {"{{" + variable + "}}"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-foreground font-semibold mb-2 block">Prompt Content:</Label>
                <Textarea
                  value={currentVersion.content}
                  readOnly
                  className="min-h-[300px] bg-background/50 text-foreground border border-border resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={handleCopyPrompt} className="bg-accent text-white hover:bg-accent/90">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="py-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Versions</Label>
                  <ScrollArea className="h-[500px] border border-border rounded-lg">
                    <div className="p-2 space-y-1">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => setSelectedVersion(version)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedVersion?.id === version.id
                              ? 'bg-accent/20 border border-accent/50'
                              : 'hover:bg-background/50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">
                              Version {version.version}
                            </span>
                            {version.id === currentVersionId && (
                              <Badge variant="secondary" className="bg-accent/30 text-foreground">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(version.created_at), 'PP')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="col-span-2 space-y-4">
                  {selectedVersion && (
                    <>
                      <div>
                        <Label className="text-foreground font-semibold mb-2 block">Title</Label>
                        <Input
                          value={selectedVersion.title}
                          readOnly
                          className="bg-background/50 text-foreground border-border"
                        />
                      </div>

                      <div>
                        <Label className="text-foreground font-semibold mb-2 block">
                          Created: {format(new Date(selectedVersion.created_at), 'PPpp')}
                        </Label>
                      </div>

                      {selectedVersion.variables.length > 0 && (
                        <div>
                          <Label className="text-foreground font-semibold mb-2 block">
                            Variables ({selectedVersion.variables.length})
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedVersion.variables.map((variable) => (
                              <Badge key={variable} variant="secondary" className="bg-accent/20">
                                {"{{" + variable + "}}"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-foreground font-semibold mb-2 block">Content</Label>
                        <Textarea
                          value={selectedVersion.content}
                          readOnly
                          className="min-h-[300px] bg-background/50 text-foreground border border-border resize-none"
                        />
                      </div>

                      {selectedVersion.id !== currentVersionId && (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleRestoreVersion(selectedVersion)}
                            disabled={loading}
                            className="bg-accent text-white hover:bg-accent/90"
                          >
                            {loading ? 'Restoring...' : 'Restore This Version'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 py-6">
              <div>
                <Label className="text-foreground font-semibold mb-2 block">Prompt Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50 text-foreground border-border"
                />
              </div>

              <div>
                <Label className="text-foreground font-semibold mb-2 block">Folder (Optional)</Label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger className="bg-background/50 text-foreground border-border">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" className="text-foreground">
                      No folder
                    </SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id} className="text-foreground">
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground font-semibold mb-2 block">Tags (Optional)</Label>
                <TagInput selectedTags={selectedTags} onTagsChange={setSelectedTags} />
              </div>

              {detectedVariables.length > 0 && (
                <div>
                  <Label className="text-foreground font-semibold mb-2 block">
                    Detected Variables ({detectedVariables.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-background/50 border border-border rounded-lg">
                    {detectedVariables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="bg-accent/20">
                        {"{{" + variable + "}}"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-foreground font-semibold mb-2 block">Prompt Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] bg-background/50 text-foreground border-border"
                />
                <p className="text-muted-foreground text-sm mt-1">
                  {content.length} characters
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="bg-background/50 border-border text-foreground hover:bg-background/80"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={!title.trim() || !content.trim() || loading}
                  className="bg-accent text-white hover:bg-accent/90"
                >
                  {loading ? 'Saving...' : 'Save New Version'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="py-6">
              <FeedbackSection promptId={promptId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
