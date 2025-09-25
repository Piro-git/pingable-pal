import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { History, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

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

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  promptId: string;
  currentVersionId: string;
  onVersionRestored: () => void;
}

export function VersionHistoryModal({ 
  open, 
  onClose, 
  promptId, 
  currentVersionId,
  onVersionRestored 
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (open && promptId) {
      fetchVersions();
    }
  }, [open, promptId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data: versionsData, error } = await supabase
        .from('prompt_versions')
        .select(`
          id,
          title,
          content,
          version,
          created_at,
          variables
        `)
        .eq('prompt_id', promptId)
        .order('version', { ascending: false });

      if (error) throw error;

      // For each version, get its tags
      const versionsWithTags = [];
      for (const version of versionsData || []) {
        const { data: tagsData } = await supabase
          .from('prompt_tags')
          .select(`
            tags!inner(
              id,
              name,
              color
            )
          `)
          .eq('prompt_id', promptId);

        versionsWithTags.push({
          ...version,
          variables: version.variables as string[] || [],
          tags: tagsData?.map((t: any) => t.tags) || []
        });
      }

      const processedVersions = versionsWithTags;

      setVersions(processedVersions);
      
      // Select current version by default
      const currentVersion = processedVersions.find(v => v.id === currentVersionId);
      if (currentVersion) {
        setSelectedVersion(currentVersion);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load version history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (version: PromptVersion) => {
    setRestoring(true);
    try {
      // Get the highest version number
      const maxVersion = Math.max(...versions.map(v => v.version));
      const newVersion = maxVersion + 1;

      // Create a new version with the restored content
      const { data: newVersionData, error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          title: version.title,
          content: version.content,
          version: newVersion,
          variables: version.variables,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update the prompt's current_version_id
      const { error: promptError } = await supabase
        .from('prompts')
        .update({ current_version_id: newVersionData.id })
        .eq('id', promptId);

      if (promptError) throw promptError;

      // Copy tags if any exist
      if (version.tags && version.tags.length > 0) {
        const tagInserts = version.tags.map(tag => ({
          prompt_id: promptId,
          tag_id: tag.id
        }));

        const { error: tagsError } = await supabase
          .from('prompt_tags')
          .delete()
          .eq('prompt_id', promptId);

        if (tagsError) throw tagsError;

        const { error: insertTagsError } = await supabase
          .from('prompt_tags')
          .insert(tagInserts);

        if (insertTagsError) throw insertTagsError;
      }

      toast({
        title: "Success",
        description: `Restored to version ${version.version} as version ${newVersion}.`,
      });

      onVersionRestored();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore version.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/20 max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6 h-[70vh]">
          {/* Version List */}
          <div className="w-1/3 space-y-2 overflow-y-auto">
            <h3 className="text-white font-medium mb-3">Versions</h3>
            {loading ? (
              <div className="text-white/60">Loading versions...</div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => setSelectedVersion(version)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id
                      ? 'bg-white/20 border border-white/30'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      Version {version.version}
                    </span>
                    {version.id === currentVersionId && (
                      <Badge variant="secondary" className="text-xs glass">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-white/60 text-sm">
                    {new Date(version.created_at).toLocaleDateString()} at{' '}
                    {new Date(version.created_at).toLocaleTimeString()}
                  </div>
                  <div className="text-white/80 text-sm mt-1 truncate">
                    {version.title}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Version Details */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">
                    Version {selectedVersion.version} Details
                  </h3>
                  {selectedVersion.id !== currentVersionId && (
                    <Button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      disabled={restoring}
                      className="glass-button"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {restoring ? 'Restoring...' : 'Restore This Version'}
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-white font-medium text-sm">Title:</label>
                    <div className="text-white/80 mt-1">{selectedVersion.title}</div>
                  </div>

                  <div>
                    <label className="text-white font-medium text-sm">Created:</label>
                    <div className="text-white/80 mt-1">
                      {new Date(selectedVersion.created_at).toLocaleDateString()} at{' '}
                      {new Date(selectedVersion.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Variables */}
                  {selectedVersion.variables && selectedVersion.variables.length > 0 && (
                    <div>
                      <label className="text-white font-medium text-sm">
                        Variables ({selectedVersion.variables.length}):
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedVersion.variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="secondary"
                            className="glass-button text-white border-white/30 bg-blue-500/20"
                          >
                            {"{{" + variable + "}}"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                    <div>
                      <label className="text-white font-medium text-sm">Tags:</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedVersion.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="glass text-white border-white/20"
                            style={{ backgroundColor: tag.color ? `${tag.color}40` : undefined }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-white font-medium text-sm">Content:</label>
                    <Textarea
                      value={selectedVersion.content}
                      readOnly
                      className="min-h-[300px] glass text-white resize-none mt-2"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white/60 text-center py-8">
                Select a version to view details
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="glass border-white/20 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}