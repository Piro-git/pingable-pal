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
      <DialogContent className="bg-card/98 backdrop-blur-lg border border-border shadow-2xl max-w-4xl h-[80vh] flex flex-col p-0">
        <div className="p-6 border-b border-border bg-card/50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-card-foreground">
                  {prompt.title}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  View prompt details and feedback.
                </DialogDescription>
              </div>
              <span className="text-muted-foreground text-sm font-medium">v{prompt.version}</span>
            </div>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            <div className="text-muted-foreground text-sm font-medium">
              Created {new Date(prompt.created_at).toLocaleDateString()}
            </div>
            
            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div>
                <label className="text-card-foreground font-semibold text-sm">Tags:</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {prompt.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground border border-border font-medium shadow-sm"
                      style={{ backgroundColor: tag.color ? `${tag.color}60` : undefined }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-card-foreground font-semibold">Prompt Content:</label>
              <Textarea
                value={prompt.content}
                readOnly
                className="min-h-[300px] bg-secondary/50 text-card-foreground border border-border resize-none font-medium focus:ring-2 focus:ring-primary"
                placeholder="Prompt content..."
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4 pb-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium shadow-sm"
              >
                Close
              </Button>
              <Button
                onClick={handleCopyPrompt}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Prompt
              </Button>
            </div>
            
            {/* Feedback Section */}
            {promptId && (
              <div className="border-t border-border pt-6 mt-6 pb-4">
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