import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function TagInput({ selectedTags, onTagsChange }: TagInputProps) {
  const { user } = useAuth();
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [user]);

  const fetchTags = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error: any) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const createTag = async (name: string) => {
    if (!user) return null;

    try {
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: name.trim(),
          color: randomColor,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setAvailableTags(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleAddTag = async (tag: Tag | string) => {
    let tagToAdd: Tag;

    if (typeof tag === 'string') {
      // Create new tag
      const newTag = await createTag(tag);
      if (!newTag) return;
      tagToAdd = newTag;
    } else {
      tagToAdd = tag;
    }

    if (!selectedTags.some(t => t.id === tagToAdd.id)) {
      onTagsChange([...selectedTags, tagToAdd]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
    }
  };

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="glass text-white border-white/20"
            style={{ backgroundColor: tag.color ? `${tag.color}40` : undefined }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:text-red-300"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or create tags..."
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
        />
        
        {showSuggestions && inputValue && (
          <div className="absolute z-10 w-full mt-1 glass rounded-lg border border-white/20 max-h-40 overflow-y-auto">
            {filteredTags.length > 0 && (
              <div className="p-2">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-white text-sm flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#666' }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            
            {inputValue.trim() && !availableTags.some(tag => 
              tag.name.toLowerCase() === inputValue.toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => handleAddTag(inputValue.trim())}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-white text-sm flex items-center gap-2 border-t border-white/20"
              >
                <Plus className="w-3 h-3" />
                Create "{inputValue.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}