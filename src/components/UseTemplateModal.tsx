import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Play, Sparkles, Zap, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { replaceVariables, validateVariables } from '@/utils/templateUtils';

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
  category_id?: string | null;
  user_id: string;
  created_at: string;
  variables?: string[];
  tags?: Tag[];
}

interface UseTemplateModalProps {
  open: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

export function UseTemplateModal({ open, onClose, prompt }: UseTemplateModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleGeneratePreview = () => {
    if (!prompt) return;

    const validation = validateVariables(prompt.content, variableValues);
    
    if (!validation.isValid) {
      toast({
        title: "Missing Variables",
        description: `Please fill in: ${validation.missingVariables.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const generated = replaceVariables(prompt.content, variableValues);
    setGeneratedPrompt(generated);
    setShowPreview(true);
  };

  const handleCopyToClipboard = async () => {
    if (!generatedPrompt) return;

    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast({
        title: "Copied!",
        description: "Generated prompt copied to clipboard.",
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setVariableValues({});
    setGeneratedPrompt('');
    setShowPreview(false);
    onClose();
  };

  if (!prompt) return null;

  const variables = prompt.variables || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl border border-primary/30 shadow-[0_0_50px_rgba(251,146,60,0.15)] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex-shrink-0">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex-shrink-0">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                    {prompt.title}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1">
                    Fill in the variables to generate your custom prompt
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  v{prompt.version}
                </Badge>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex gap-1">
                    {prompt.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-background/50 text-foreground border-border/50 text-xs"
                        style={{ backgroundColor: tag.color ? `${tag.color}30` : undefined }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 mt-6 relative pr-2">
          {/* Original Template Preview */}
          <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
            <Label className="text-foreground font-semibold mb-2 block flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Original Template
            </Label>
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-foreground/80 text-sm max-h-40 overflow-y-auto border border-border/30 font-mono leading-relaxed">
              {prompt.content}
            </div>
          </div>

          {/* Variable Inputs */}
          {variables.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm border border-accent/30 rounded-xl p-4">
                <Label className="text-foreground font-semibold mb-4 block flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Fill in Variables ({variables.length} detected)
                </Label>
                <div className="grid gap-4 max-h-80 overflow-y-auto pr-2">
                  {variables.map((variable) => (
                    <div key={variable} className="bg-background/30 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                      <Label className="text-foreground/90 text-sm mb-2 block font-mono">
                        {"{{" + variable + "}}"}
                      </Label>
                      <Input
                        value={variableValues[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={`Enter value for ${variable}`}
                        className="bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleGeneratePreview}
                  className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white shadow-glow-accent font-medium"
                  disabled={variables.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Generate Preview
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border border-border/50 rounded-xl p-8 text-center">
              <div className="inline-flex p-4 bg-muted/30 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground/70 font-medium mb-2">
                No variables in this prompt
              </p>
              <p className="text-muted-foreground text-sm">
                This prompt is ready to use as-is, or add {"{{variables}}"} to make it dynamic
              </p>
            </div>
          )}

          {/* Generated Prompt Preview */}
          {showPreview && generatedPrompt && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/30 rounded-xl p-4">
                <Label className="text-foreground font-semibold mb-2 block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generated Prompt
                </Label>
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="min-h-[250px] bg-background/80 text-foreground border-border/50 resize-none font-mono text-sm leading-relaxed"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="bg-background/50 border-border/50 text-foreground hover:bg-background/80 hover:border-primary/30"
                >
                  Edit Variables
                </Button>
                <Button
                  onClick={handleCopyToClipboard}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-glow-primary"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}

          {/* Close button when no variables */}
          {variables.length === 0 && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="bg-background/50 border-border/50 text-foreground hover:bg-background/80 hover:border-primary/30"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
