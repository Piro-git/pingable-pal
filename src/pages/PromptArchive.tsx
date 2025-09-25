import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Archive, Edit, Search, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { CreatePromptModal } from '@/components/CreatePromptModal';
import { ViewPromptModal } from '@/components/ViewPromptModal';
import { UseTemplateModal } from '@/components/UseTemplateModal';
import { useNavigate } from 'react-router-dom';
import Split from 'split.js';
import { Badge } from '@/components/ui/badge';

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
  user_id: string;
  created_at: string;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  version: number;
  folder_id: string | null;
  category_id?: string | null; // For backward compatibility
  user_id: string;
  created_at: string;
  variables?: string[];
  tags?: Tag[];
}

export default function PromptArchive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createPromptModalOpen, setCreatePromptModalOpen] = useState(false);
  const [viewPromptModalOpen, setViewPromptModalOpen] = useState(false);
  const [useTemplateModalOpen, setUseTemplateModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
      
      // Auto-select first folder if none selected
      if (data && data.length > 0 && !selectedFolderId) {
        setSelectedFolderId(data[0].id);
      }
    } catch (error: any) {
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
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
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
      // First fetch prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (promptsError) throw promptsError;

      // Initialize prompts with empty tags array and proper variables type
      const promptsWithTags = (promptsData || []).map(prompt => ({
        ...prompt,
        tags: [] as Tag[],
        variables: Array.isArray(prompt.variables) ? prompt.variables as string[] : []
      }));

      setPrompts(promptsWithTags);
    } catch (error: any) {
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

  useEffect(() => {
    // Initialize Split.js after component mounts
    const split = Split(['#sidebar', '#categories-pane', '#prompts-pane'], {
      sizes: [20, 30, 50],
      minSize: 200,
      gutterSize: 8,
      cursor: 'col-resize'
    });

    return () => {
      // Cleanup Split.js instance on unmount
      split.destroy();
    };
  }, []);

  // Apply filtering based on search, folder, and tags
  const filteredPrompts = prompts.filter(prompt => {
    // Search filter
    if (searchTerm) {
      const folder = folders.find(f => f.id === prompt.folder_id);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = (
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.content.toLowerCase().includes(searchLower) ||
        (folder && folder.name.toLowerCase().includes(searchLower)) ||
        (prompt.tags && prompt.tags.some(tag => tag.name.toLowerCase().includes(searchLower)))
      );
      
      if (!matchesSearch) return false;
    }
    
    // Folder filter
    if (!searchTerm && selectedFolderId && prompt.folder_id !== selectedFolderId) {
      return false;
    }
    
    // Tag filter
    if (selectedTagIds.length > 0) {
      const promptTagIds = prompt.tags?.map(tag => tag.id) || [];
      const hasSelectedTag = selectedTagIds.some(tagId => promptTagIds.includes(tagId));
      if (!hasSelectedTag) return false;
    }
    
    return true;
  });

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleTagFilter = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setViewPromptModalOpen(true);
  };

  const handleUseTemplate = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setUseTemplateModalOpen(true);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-6">
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

      {/* Resizable Three Column Layout */}
      <div className="h-[calc(100vh-200px)] flex">
        {/* Sidebar */}
        <div id="sidebar" className="glass rounded-2xl p-6 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">StatusPing</h1>
            <p className="text-white/70 text-sm mt-1">Monitoring Dashboard</p>
          </div>

          <nav className="space-y-3">
            <div 
              className="text-white/70 px-4 py-2 hover:text-white cursor-pointer transition-colors"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </div>
            <div className="glass-button rounded-lg px-4 py-2 text-white">
              Prompt Archive
            </div>
            <div className="text-white/70 px-4 py-2 hover:text-white cursor-pointer transition-colors">
              Settings
            </div>
          </nav>

          <div className="mt-auto pt-6">
            <div className="glass rounded-lg p-3 mb-3">
              <p className="text-white/70 text-sm">Signed in as:</p>
              <p className="text-white text-sm font-medium truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Folders Column */}
        <div id="categories-pane" className="glass rounded-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Folders</h3>
            <Button
              size="sm"
              className="glass-button px-1.5 py-0.5 text-xs"
              onClick={() => setCreateFolderModalOpen(true)}
            >
              <Plus className="w-3 h-3 mr-0.5" />
              New
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-white/70">Loading folders...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70 mb-4">No folders yet</p>
              <Button 
                className="glass-button"
                onClick={() => setCreateFolderModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Folder
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={`glass rounded-xl p-3 cursor-pointer transition-all duration-200 max-w-[220px] min-h-[60px] flex flex-col justify-center ${
                  !selectedFolderId 
                    ? 'glass-button transform scale-105' 
                    : 'hover:glass-button hover:brightness-110 hover:shadow-lg'
                }`}
                onClick={() => setSelectedFolderId(null)}
              >
                <p className="text-white font-medium text-sm leading-tight break-words">All Prompts</p>
                <p className="text-white/70 text-xs mt-1">
                  {prompts.length} prompts
                </p>
              </div>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`glass rounded-xl p-3 cursor-pointer transition-all duration-200 max-w-[220px] min-h-[60px] flex flex-col justify-center ${
                    selectedFolderId === folder.id 
                      ? 'glass-button transform scale-105' 
                      : 'hover:glass-button hover:brightness-110 hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <p className="text-white font-medium text-sm leading-tight break-words">{folder.name}</p>
                  <p className="text-white/70 text-xs mt-1">
                    {prompts.filter(p => p.folder_id === folder.id).length} prompts
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prompts Column */}
        <div id="prompts-pane" className="glass rounded-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {selectedFolder ? `${selectedFolder.name}` : searchTerm ? 'Search Results' : 'All Prompts'}
            </h3>
            <Button
              className="glass-button"
              onClick={() => setCreatePromptModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </div>

          {/* Tag Filter Bar */}
          {tags.length > 0 && (
            <div className="mb-4">
              <p className="text-white/70 text-sm mb-2">Filter by tags:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? "default" : "secondary"}
                    className={`cursor-pointer transition-all ${
                      selectedTagIds.includes(tag.id)
                        ? 'glass-button text-white border-white/30'
                        : 'glass text-white/70 border-white/20 hover:glass-button hover:text-white'
                    }`}
                    style={{ 
                      backgroundColor: selectedTagIds.includes(tag.id) 
                        ? `${tag.color}60` 
                        : tag.color 
                          ? `${tag.color}20` 
                          : undefined 
                    }}
                    onClick={() => handleTagFilter(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <p className="text-white/70">Loading prompts...</p>
            </div>
          ) : filteredPrompts.length === 0 && searchTerm ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-2">No prompts found</p>
              <p className="text-white/50 text-sm">Try adjusting your search terms or filters</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/70 mb-4">No prompts yet</p>
              <Button 
                className="glass-button"
                onClick={() => setCreatePromptModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Prompt
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map((prompt) => (
                <div 
                  key={prompt.id} 
                  className="glass rounded-xl p-4 cursor-pointer hover:glass-button transition-all"
                  onClick={() => handleViewPrompt(prompt)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold text-lg">{prompt.title}</h4>
                    <div className="flex items-center gap-2">
                      {prompt.variables && prompt.variables.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="glass text-white border-white/20 text-xs bg-blue-500/20"
                        >
                          {prompt.variables.length} var{prompt.variables.length === 1 ? '' : 's'}
                        </Badge>
                      )}
                      <span className="text-white/60 text-sm">v{prompt.version}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="glass-button-secondary p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(prompt);
                        }}
                        title="Use Template"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="glass-button-secondary p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit functionality can be added later
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {prompt.tags.map((tag) => (
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
                    {prompt.content.length > 200 
                      ? `${prompt.content.substring(0, 200)}...` 
                      : prompt.content
                    }
                  </div>
                  <div className="text-white/50 text-xs">
                    Created {new Date(prompt.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
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
        prompt={selectedPrompt}
      />

      <UseTemplateModal
        open={useTemplateModalOpen}
        onClose={() => setUseTemplateModalOpen(false)}
        prompt={selectedPrompt}
      />
    </div>
  );
}