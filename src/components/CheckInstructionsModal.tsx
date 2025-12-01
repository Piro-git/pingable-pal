import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CheckInstructionsModalProps {
  open: boolean;
  onClose: () => void;
  checkName: string;
  heartbeatUuid: string;
  checkType: 'simple_ping' | 'api_report';
}

export const CheckInstructionsModal: React.FC<CheckInstructionsModalProps> = ({
  open,
  onClose,
  checkName,
  heartbeatUuid,
  checkType,
}) => {
  const pingUrl = `https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/ping-handler?uuid=${heartbeatUuid}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const simplePingExample = `# Simple GET request to confirm service is online
curl "${pingUrl}"`;

  const apiReportExampleSuccess = `# POST request with success report
curl -X POST "${pingUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "success",
    "payload": {
      "items_processed": 123,
      "execution_time": 500
    },
    "duration_ms": 500
  }'`;

  const apiReportExampleFailed = `# POST request with failure report
curl -X POST "${pingUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "failed",
    "error_message": "API key invalid",
    "payload": {
      "attempted_retries": 3
    },
    "duration_ms": 1200
  }'`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border rounded-2xl max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              How to Use: {checkName}
            </DialogTitle>
          </DialogHeader>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Endpoint URL */}
          <div>
            <h3 className="font-medium mb-2">Endpoint URL</h3>
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between gap-3 border border-border">
              <code className="text-sm break-all flex-1">{pingUrl}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(pingUrl, "URL")}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {checkType === 'simple_ping' ? (
            <>
              {/* Simple Ping Instructions */}
              <div>
                <h3 className="font-medium mb-2">Instructions</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border">
                  <p className="text-muted-foreground text-sm">
                    Make a <span className="font-mono text-primary">GET</span> request to the endpoint URL above to confirm your service is online.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    This is a basic heartbeat check. Just ping the URL and the check will be marked as "up".
                  </p>
                </div>
              </div>

              {/* Example */}
              <div>
                <h3 className="font-medium mb-2 flex items-center justify-between">
                  Example (cURL)
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(simplePingExample, "Example")}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {simplePingExample}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* API Report Instructions */}
              <div>
                <h3 className="font-medium mb-2">Instructions</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border">
                  <p className="text-muted-foreground text-sm">
                    Make a <span className="font-mono text-primary">POST</span> request with a JSON payload to report detailed automation status.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Include status, custom KPIs in the payload, error messages, and execution duration.
                  </p>
                </div>
              </div>

              {/* JSON Payload Format */}
              <div>
                <h3 className="font-medium mb-2">JSON Payload Format</h3>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <pre className="text-xs font-mono">
{`{
  "status": "success" | "failed",
  "payload": {
    "items_processed": 123,
    // ... any custom KPIs
  },
  "error_message": "Optional error description",
  "duration_ms": 500
}`}
                  </pre>
                </div>
              </div>

              {/* Success Example */}
              <div>
                <h3 className="font-medium mb-2 flex items-center justify-between">
                  Example: Success Report
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(apiReportExampleSuccess, "Success example")}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {apiReportExampleSuccess}
                  </pre>
                </div>
              </div>

              {/* Failure Example */}
              <div>
                <h3 className="font-medium mb-2 flex items-center justify-between">
                  Example: Failure Report
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(apiReportExampleFailed, "Failure example")}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {apiReportExampleFailed}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};