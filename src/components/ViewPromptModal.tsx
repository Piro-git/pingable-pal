import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { FeedbackSection } from './FeedbackSection';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <DialogContent className="bg-background/95 backdrop-blur-md border-border/70 shadow-xl max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {prompt.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                View prompt details and feedback.
              </DialogDescription>
            </div>
            <span className="text-muted-foreground text-sm font-medium">v{prompt.version}</span>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">
              Created {new Date(prompt.created_at).toLocaleDateString()}
            </div>
            
            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div>
                <label className="text-foreground font-medium text-sm">Tags:</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {prompt.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="bg-background/60 backdrop-blur-sm text-foreground border-border/70 font-medium"
                      style={{ backgroundColor: tag.color ? `${tag.color}40` : undefined }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-foreground font-medium">Prompt Content:</label>
              <Textarea
                value={prompt.content}
                readOnly
                className="min-h-[300px] bg-background/50 backdrop-blur-sm text-foreground border-border/70 resize-none font-medium"
                placeholder="Prompt content..."
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-background/50 border-border/70 text-foreground hover:bg-background/80 font-medium"
              >
                Close
              </Button>
              <Button
                onClick={handleCopyPrompt}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Prompt
              </Button>
            </div>
            
            {/* Feedback Section */}
            {promptId && (
              <div className="border-t border-border/70 pt-6 mt-6">
                <FeedbackSection promptId={promptId} />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export { ViewPromptModal };