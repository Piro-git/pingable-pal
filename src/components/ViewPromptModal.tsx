import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { FeedbackSection } from './FeedbackSection';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  version: number;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  tags?: Tag[];
}

interface ViewPromptModalProps {
  open: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  promptId?: string;
}

const ViewPromptModal: React.FC<ViewPromptModalProps> = ({ open, onClose, prompt, promptId }) => {
  const handleCopyPrompt = async () => {
    if (!prompt) return;
    
    try {
      await navigator.clipboard.writeText(prompt.content);
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

  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                {prompt.title}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                View prompt details and feedback.
              </DialogDescription>
            </div>
            <span className="text-white/60 text-sm">v{prompt.version}</span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-white/70 text-sm">
            Created {new Date(prompt.created_at).toLocaleDateString()}
          </div>
          
          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div>
              <label className="text-white font-medium text-sm">Tags:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {prompt.tags.map((tag) => (
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
          
          <div className="space-y-3">
            <label className="text-white font-medium">Prompt Content:</label>
            <Textarea
              value={prompt.content}
              readOnly
              className="min-h-[300px] glass text-white resize-none"
              placeholder="Prompt content..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="glass-button-secondary"
            >
              Close
            </Button>
            <Button
              onClick={handleCopyPrompt}
              className="glass-button"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </Button>
          </div>
        </div>
        
        {/* Feedback Section */}
        {promptId && (
          <div className="border-t border-white/20 pt-6 mt-6">
            <FeedbackSection promptId={promptId} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ViewPromptModal };