import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Play } from 'lucide-react';
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
      <DialogContent className="glass border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                Use Template: {prompt.title}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Fill in the variables to use this prompt template.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">v{prompt.version}</span>
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex gap-1">
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
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Template Preview */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Original Template:</Label>
            <div className="glass rounded-lg p-3 text-white/80 text-sm max-h-32 overflow-y-auto">
              {prompt.content}
            </div>
          </div>

          {/* Variable Inputs */}
          {variables.length > 0 ? (
            <div className="space-y-4">
              <Label className="text-white font-medium">
                Fill in Variables ({variables.length} detected):
              </Label>
              <div className="grid gap-4 max-h-60 overflow-y-auto">
                {variables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label className="text-white/80 text-sm">
                      {variable}
                    </Label>
                    <Input
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter value for {{${variable}}}`}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleGeneratePreview}
                  className="glass-button"
                  disabled={variables.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Generate Preview
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/70">
                This prompt doesn't contain any variables.
              </p>
              <p className="text-white/50 text-sm mt-1">
                Add variables like {"{{variable_name}}"} to make it a template.
              </p>
            </div>
          )}

          {/* Generated Prompt Preview */}
          {showPreview && generatedPrompt && (
            <div className="space-y-4">
              <Label className="text-white font-medium">Generated Prompt:</Label>
              <Textarea
                value={generatedPrompt}
                readOnly
                className="min-h-[200px] glass text-white resize-none"
              />
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="glass border-white/20 text-white hover:bg-white/10"
                >
                  Edit Variables
                </Button>
                <Button
                  onClick={handleCopyToClipboard}
                  className="glass-button"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}

          {/* Close button when no variables */}
          {variables.length === 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                className="glass border-white/20 text-white hover:bg-white/10"
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