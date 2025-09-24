import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Prompt {
  id: string;
  title: string;
  content: string;
  version: number;
  category_id: string;
  user_id: string;
  created_at: string;
}

interface ViewPromptModalProps {
  open: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

const ViewPromptModal: React.FC<ViewPromptModalProps> = ({ open, onClose, prompt }) => {
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
            <DialogTitle className="text-xl font-semibold text-white">
              {prompt.title}
            </DialogTitle>
            <span className="text-white/60 text-sm">v{prompt.version}</span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-white/70 text-sm">
            Created {new Date(prompt.created_at).toLocaleDateString()}
          </div>
          
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
      </DialogContent>
    </Dialog>
  );
};

export { ViewPromptModal };