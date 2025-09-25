import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Archive, Edit, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { CreatePromptModal } from '@/components/CreatePromptModal';
import { ViewPromptModal } from '@/components/ViewPromptModal';
import { useNavigate } from 'react-router-dom';
import Split from 'split.js';

interface PromptCategory {
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
  category_id: string;
  user_id: string;
  created_at: string;
}

export default function PromptArchive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createPromptModalOpen, setCreatePromptModalOpen] = useState(false);
  const [viewPromptModalOpen, setViewPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
      
      // Auto-select first category if none selected
      if (data && data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch categories.",
        variant: "destructive",
      });
    }
  };

  const fetchPrompts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
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
      await Promise.all([fetchCategories(), fetchPrompts()]);
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

  const filteredPrompts = selectedCategoryId 
    ? prompts.filter(prompt => prompt.category_id === selectedCategoryId)
    : [];

  // Apply search filtering
  const searchFilteredPrompts = searchTerm
    ? filteredPrompts.filter(prompt => {
        const category = categories.find(cat => cat.id === prompt.category_id);
        const searchLower = searchTerm.toLowerCase();
        
        return (
          prompt.title.toLowerCase().includes(searchLower) ||
          prompt.content.toLowerCase().includes(searchLower) ||
          (category && category.name.toLowerCase().includes(searchLower))
        );
      })
    : filteredPrompts;

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const getBubbleStyle = (color: string | null) => {
    if (color) {
      return {
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        borderColor: `${color}60`,
      };
    }
    return {};
  };

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setViewPromptModalOpen(true);
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

        {/* Categories Column */}
        <div id="categories-pane" className="glass rounded-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Categories</h3>
            <Button
              size="sm"
              className="glass-button px-1.5 py-0.5 text-xs"
              onClick={() => setCreateCategoryModalOpen(true)}
            >
              <Plus className="w-3 h-3 mr-0.5" />
              New
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-white/70">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70 mb-4">No categories yet</p>
              <Button 
                className="glass-button"
                onClick={() => setCreateCategoryModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`glass rounded-xl p-3 cursor-pointer transition-all duration-200 max-w-[220px] min-h-[60px] flex flex-col justify-center ${
                    selectedCategoryId === category.id 
                      ? 'glass-button transform scale-105' 
                      : 'hover:glass-button hover:brightness-110 hover:shadow-lg'
                  }`}
                  style={getBubbleStyle(category.color)}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <p className="text-white font-medium text-sm leading-tight break-words">{category.name}</p>
                  <p className="text-white/70 text-xs mt-1">
                    {prompts.filter(p => p.category_id === category.id).length} prompts
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
              {selectedCategory ? `${selectedCategory.name} Prompts` : 'Select a Category'}
            </h3>
            {selectedCategory && (
              <Button
                className="glass-button"
                onClick={() => setCreatePromptModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Prompt
              </Button>
            )}
          </div>

          {!selectedCategory ? (
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg">Select a category to view prompts</p>
            </div>
          ) : loading ? (
            <div className="text-center py-16">
              <p className="text-white/70">Loading prompts...</p>
            </div>
          ) : searchFilteredPrompts.length === 0 && searchTerm ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-2">No prompts found</p>
              <p className="text-white/50 text-sm">Try adjusting your search terms</p>
            </div>
          ) : searchFilteredPrompts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/70 mb-4">No prompts in this category yet</p>
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
              {searchFilteredPrompts.map((prompt) => (
                <div 
                  key={prompt.id} 
                  className="glass rounded-xl p-4 cursor-pointer hover:glass-button transition-all"
                  onClick={() => handleViewPrompt(prompt)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold text-lg">{prompt.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">v{prompt.version}</span>
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

      <CreateCategoryModal
        open={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        onSuccess={fetchCategories}
      />

      <CreatePromptModal
        open={createPromptModalOpen}
        onClose={() => setCreatePromptModalOpen(false)}
        onSuccess={fetchPrompts}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
      />

      <ViewPromptModal
        open={viewPromptModalOpen}
        onClose={() => setViewPromptModalOpen(false)}
        prompt={selectedPrompt}
      />
    </div>
  );
}