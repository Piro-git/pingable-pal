import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Archive, Edit, Search, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { CreatePromptModal } from '@/components/CreatePromptModal';
import { ViewPromptModal } from '@/components/ViewPromptModal';
import { UseTemplateModal } from '@/components/UseTemplateModal';
import { EditPromptModal } from '@/components/EditPromptModal';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface PromptVersion {
  id: string;
  title: string;
  content: string;
  version: number;
  variables: string[];
  created_at: string;
  tags: Tag[];
}

interface Prompt {
  id: string;
  user_id: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
  current_version: PromptVersion | null;
}

export default function PromptArchive() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Modal states
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createPromptModalOpen, setCreatePromptModalOpen] = useState(false);
  const [viewPromptModalOpen, setViewPromptModalOpen] = useState(false);
  const [useTemplateModalOpen, setUseTemplateModalOpen] = useState(false);
  const [editPromptModalOpen, setEditPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const fetchFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      console.error('Fetch folders error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch folders.",
        variant: "destructive",
      });
    }
  };

  const fetchTags = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Fetch tags error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tags.",
        variant: "destructive",
      });
    }
  };

  const fetchPrompts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          id,
          user_id,
          folder_id,
          current_version_id,
          created_at,
          updated_at,
          prompt_versions!current_version_id(
            id,
            title,
            content,
            version,
            variables,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedPrompts = data?.map(prompt => ({
        ...prompt,
        current_version: prompt.prompt_versions ? {
          ...prompt.prompt_versions,
          variables: (prompt.prompt_versions.variables as string[]) || [],
          tags: []
        } : null
      })).filter(prompt => prompt.current_version) || [];

      setPrompts(processedPrompts);
    } catch (error: any) {
      console.error('Fetch prompts error:', error);
      toast({
        title: "Error", 
        description: "Failed to fetch prompts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFolders(), fetchPrompts(), fetchTags()]);
    };
    loadData();
  }, [user]);

  // Apply filtering based on search, folder, and tags
  const filteredPrompts = prompts.filter(prompt => {
    const currentVersion = prompt.current_version;
    if (!currentVersion) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        currentVersion.title.toLowerCase().includes(searchLower) ||
        currentVersion.content.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Folder filter
    if (selectedFolderId !== null) {
      if (prompt.folder_id !== selectedFolderId) return false;
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const promptTags = currentVersion.tags || [];
      const hasSelectedTag = selectedTags.some(tagId => 
        promptTags.some(tag => tag.id === tagId)
      );
      if (!hasSelectedTag) return false;
    }

    return true;
  });

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setViewPromptModalOpen(true);
  };

  const handleUseTemplate = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setUseTemplateModalOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditPromptModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="glass rounded-2xl p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Prompt Archive</h2>
              <p className="text-white/70">Organize and manage your AI prompts</p>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Search prompts, categories, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
              />
            </div>
          </div>
        </div>

        {/* Top Section - Filters */}
        <div className="flex-shrink-0">
          {/* Folder Filter Bar */}
          <div className="glass rounded-2xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Filter by Folder</h3>
              {(role === 'admin' || role === 'editor') && (
                <Button
                  size="sm"
                  className="glass-button h-8"
                  onClick={() => setCreateFolderModalOpen(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Folder
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* All Prompts Pill */}
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  !selectedFolderId 
                    ? 'glass-button text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                All Prompts ({prompts.length})
              </button>

              {/* Folder Pills */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    selectedFolderId === folder.id 
                      ? 'glass-button text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                  }`}
                >
                  {folder.name} ({prompts.filter(p => p.folder_id === folder.id).length})
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter Bar */}
          {tags.length > 0 && (
            <div className="glass rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Filter by Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag.id) 
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      selectedTags.includes(tag.id)
                        ? 'glass-button text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                    }`}
                    style={{ 
                      backgroundColor: selectedTags.includes(tag.id) && tag.color 
                        ? `${tag.color}40` 
                        : undefined 
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1.5 rounded-lg transition-colors text-sm text-white/50 hover:text-white hover:bg-white/10 border border-white/20"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section - Prompts List */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Prompts List */}
          <div className="glass rounded-2xl p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-xl font-semibold text-white">
              {selectedFolderId 
                ? folders.find(f => f.id === selectedFolderId)?.name || 'Folder' 
                : 'All Prompts'
              } ({filteredPrompts.length})
            </h3>
            {(role === 'admin' || role === 'editor') && (
              <Button
                className="glass-button"
                onClick={() => setCreatePromptModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Prompt
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="pr-2">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-white/70">Loading prompts...</p>
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/70 mb-4">
                    {searchTerm || selectedTags.length > 0 
                      ? 'No prompts match your search criteria' 
                      : 'No prompts in this folder yet'
                    }
                  </p>
                  {(!searchTerm && selectedTags.length === 0) && (role === 'admin' || role === 'editor') && (
                    <Button 
                      className="glass-button"
                      onClick={() => setCreatePromptModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Prompt
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPrompts.map((prompt) => {
                    const currentVersion = prompt.current_version;
                    if (!currentVersion) return null;

                    return (
                      <div
                        key={prompt.id}
                        className="glass rounded-xl p-4 cursor-pointer transition-all duration-200 hover:glass-button hover:brightness-110 hover:shadow-lg"
                        onClick={() => handleViewPrompt(prompt)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold text-lg leading-tight break-words flex-1 mr-4">
                            {currentVersion.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="glass-button-secondary p-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseTemplate(prompt);
                              }}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            {(role === 'admin' || role === 'editor') && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="glass-button-secondary p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPrompt(prompt);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {currentVersion.tags && currentVersion.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {currentVersion.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="glass text-white border-white/20 text-xs"
                                style={{ backgroundColor: tag.color ? `${tag.color}40` : undefined }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-white/80 text-sm mb-3">
                          {currentVersion.content.length > 200 
                            ? `${currentVersion.content.substring(0, 200)}...` 
                            : currentVersion.content
                          }
                        </div>

                        <div className="text-white/50 text-xs">
                          Created {new Date(currentVersion.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      </div>

      <CreateFolderModal
        open={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onSuccess={fetchFolders}
      />

      <CreatePromptModal
        open={createPromptModalOpen}
        onClose={() => setCreatePromptModalOpen(false)}
        onSuccess={fetchPrompts}
        folders={folders}
        selectedFolderId={selectedFolderId}
      />

      <ViewPromptModal
        open={viewPromptModalOpen}
        onClose={() => setViewPromptModalOpen(false)}
        prompt={selectedPrompt?.current_version ? {
          ...selectedPrompt.current_version,
          folder_id: selectedPrompt.folder_id,
          user_id: selectedPrompt.user_id,
          tags: []
        } : null}
        promptId={selectedPrompt?.id}
      />

      <UseTemplateModal
        open={useTemplateModalOpen}
        onClose={() => setUseTemplateModalOpen(false)}
        prompt={selectedPrompt?.current_version ? {
          ...selectedPrompt.current_version,
          folder_id: selectedPrompt.folder_id,
          user_id: selectedPrompt.user_id,
          tags: []
        } : null}
      />

      <EditPromptModal
        open={editPromptModalOpen}
        onClose={() => setEditPromptModalOpen(false)}
        onSuccess={fetchPrompts}
        folders={folders}
        promptId={selectedPrompt?.id || ''}
        currentVersionId={selectedPrompt?.current_version?.id || ''}
      />
    </>
  );
}
