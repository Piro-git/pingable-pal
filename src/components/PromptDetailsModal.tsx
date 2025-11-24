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
import { Copy, History as HistoryIcon, Settings, Eye, Star, Sparkles } from 'lucide-react';
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
    if (open && promptId && currentVersionId) {
      loadPromptData();
      loadVersionHistory();
    }
  }, [open, promptId, currentVersionId]);

  useEffect(() => {
    const variables = extractVariables(content);
    setDetectedVariables(variables);
  }, [content]);

  const loadPromptData = async () => {
    if (!currentVersionId) {
      toast({
        title: "Error",
        description: "Invalid prompt version.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: versionData, error: versionError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', currentVersionId)
        .maybeSingle();

      if (versionError) throw versionError;
      if (!versionData) {
        throw new Error("Prompt version not found");
      }

      const { data: tagsData, error: tagsError } = await supabase
        .from('prompt_tags')
        .select(`tags!inner(id, name, color)`)
        .eq('prompt_id', promptId);

      if (tagsError) throw tagsError;

      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('folder_id')
        .eq('id', promptId)
        .maybeSingle();

      if (promptError) throw promptError;

      const processedVersion = {
        ...versionData,
        variables: (versionData.variables as string[]) || [],
        tags: tagsData?.map((t: any) => t.tags) || []
      };

      setCurrentVersion(processedVersion);
      setTitle(processedVersion.title);
      setContent(processedVersion.content);
      setFolderId(promptData?.folder_id || 'none');
      setSelectedTags(processedVersion.tags || []);
    } catch (error: any) {
      console.error('Load prompt data error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load prompt data.",
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
      <DialogContent className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(251,146,60,0.15)] max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-6 border-b border-primary/20 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  {currentVersion.title}
                </DialogTitle>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary/20 rounded-full text-xs font-medium">
                    Version {currentVersion.version}
                  </span>
                  <span className="text-xs">
                    {format(new Date(currentVersion.created_at), 'PPp')}
                  </span>
                </p>
              </div>
              <Button
                onClick={handleCopyPrompt}
                size="sm"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-glow-primary"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 border-b border-border/50 bg-background/30">
            <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50 p-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <HistoryIcon className="w-4 h-4 mr-2" />
                History ({versions.length})
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger 
                value="feedback"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Star className="w-4 h-4 mr-2" />
                Feedback
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="overview" className="space-y-6 py-6 mt-0">
              {currentVersion.tags && currentVersion.tags.length > 0 && (
                <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                  <Label className="text-foreground font-semibold mb-3 block flex items-center gap-2">
                    <span className="text-primary">●</span> Tags
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentVersion.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-background/80 text-foreground border border-primary/30 shadow-sm hover:shadow-glow-primary transition-all px-3 py-1"
                        style={{ backgroundColor: tag.color ? `${tag.color}30` : undefined }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentVersion.variables.length > 0 && (
                <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm border border-accent/30 rounded-xl p-4">
                  <Label className="text-foreground font-semibold mb-3 block flex items-center gap-2">
                    <span className="text-accent">◆</span> Variables ({currentVersion.variables.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentVersion.variables.map((variable) => (
                      <Badge
                        key={variable}
                        className="bg-gradient-to-r from-accent/30 to-accent/20 text-foreground border border-accent/40 font-mono px-3 py-1"
                      >
                        {"{{" + variable + "}}"}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs mt-3">
                    Fill these variables when using this prompt as a template
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                <Label className="text-foreground font-semibold mb-3 block flex items-center gap-2">
                  <span className="text-primary">▸</span> Prompt Content
                </Label>
                <Textarea
                  value={currentVersion.content}
                  readOnly
                  className="min-h-[400px] bg-background/80 text-foreground border border-border/50 resize-none font-mono text-sm leading-relaxed focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-muted-foreground text-xs mt-2">
                  {currentVersion.content.length} characters
                </p>
              </div>
            </TabsContent>

            <TabsContent value="history" className="py-6 mt-0">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-primary" />
                    Version History
                  </Label>
                  <ScrollArea className="h-[600px] border border-border/50 rounded-xl bg-background/30 backdrop-blur-sm">
                    <div className="p-2 space-y-1">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => setSelectedVersion(version)}
                          className={`w-full text-left p-4 rounded-lg transition-all ${
                            selectedVersion?.id === version.id
                              ? 'bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 shadow-sm'
                              : 'hover:bg-background/50 border border-transparent hover:border-border/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-foreground flex items-center gap-2">
                              <span className="text-primary text-xs">v</span>
                              {version.version}
                            </span>
                            {version.id === currentVersionId && (
                              <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(version.created_at), 'PP')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="col-span-2 space-y-4">
                  {selectedVersion && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                        <Label className="text-foreground font-semibold mb-2 block">Title</Label>
                        <Input
                          value={selectedVersion.title}
                          readOnly
                          className="bg-background/80 text-foreground border-border/50 font-semibold"
                        />
                      </div>

                      <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                        <Label className="text-foreground font-semibold mb-2 block">
                          Created: {format(new Date(selectedVersion.created_at), 'PPpp')}
                        </Label>
                      </div>

                      {selectedVersion.variables.length > 0 && (
                        <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm border border-accent/30 rounded-xl p-4">
                          <Label className="text-foreground font-semibold mb-2 block flex items-center gap-2">
                            <span className="text-accent">◆</span> Variables ({selectedVersion.variables.length})
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedVersion.variables.map((variable) => (
                              <Badge key={variable} className="bg-accent/20 font-mono">
                                {"{{" + variable + "}}"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                        <Label className="text-foreground font-semibold mb-2 block">Content</Label>
                        <Textarea
                          value={selectedVersion.content}
                          readOnly
                          className="min-h-[300px] bg-background/80 text-foreground border-border/50 resize-none font-mono text-sm"
                        />
                      </div>

                      {selectedVersion.id !== currentVersionId && (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleRestoreVersion(selectedVersion)}
                            disabled={loading}
                            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-glow-primary"
                          >
                            {loading ? 'Restoring...' : `Restore to v${selectedVersion.version}`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 py-6 mt-0">
              <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <Label className="text-foreground font-semibold mb-2 block">Prompt Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/80 text-foreground border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter prompt title..."
                />
              </div>

              <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <Label className="text-foreground font-semibold mb-2 block">Folder (Optional)</Label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger className="bg-background/80 text-foreground border-border/50 hover:border-primary/50">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 backdrop-blur-xl">
                    <SelectItem value="none" className="text-foreground hover:bg-primary/10">
                      No folder
                    </SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id} className="text-foreground hover:bg-primary/10">
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <Label className="text-foreground font-semibold mb-2 block">Tags (Optional)</Label>
                <TagInput selectedTags={selectedTags} onTagsChange={setSelectedTags} />
              </div>

              {detectedVariables.length > 0 && (
                <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm border border-accent/30 rounded-xl p-5">
                  <Label className="text-foreground font-semibold mb-3 block flex items-center gap-2">
                    <span className="text-accent">◆</span> Detected Variables ({detectedVariables.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {detectedVariables.map((variable) => (
                      <Badge key={variable} className="bg-accent/20 font-mono px-3 py-1">
                        {"{{" + variable + "}}"}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs mt-3">
                    Auto-detected from your prompt content
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <Label className="text-foreground font-semibold mb-2 block">Prompt Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] bg-background/80 text-foreground border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your prompt content..."
                />
                <p className="text-muted-foreground text-xs mt-2">
                  {content.length} characters
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="bg-background/50 border-border/50 text-foreground hover:bg-background/80 hover:border-primary/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={!title.trim() || !content.trim() || loading}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-glow-primary"
                >
                  {loading ? 'Saving...' : 'Save New Version'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="py-6 mt-0">
              <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <FeedbackSection promptId={promptId} />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
