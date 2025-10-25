import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Copy, RefreshCw, Info, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreateCheckModal } from '@/components/CreateCheckModal';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { CheckInstructionsModal } from '@/components/CheckInstructionsModal';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface Check {
  id: string;
  name: string;
  status: string;
  interval_minutes: number;
  grace_period_minutes: number;
  heartbeat_uuid: string;
  last_pinged_at: string | null;
  created_at: string;
  group_id: string | null;
  type: 'simple_ping' | 'api_report';
  slack_webhook_url: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<Check[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Fetch checks
      const { data: checksData, error: checksError } = await supabase
        .from('checks')
        .select('*')
        .order('created_at', { ascending: false });

      if (checksError) throw checksError;
      setChecks(checksData as Check[] || []);
      setLastCheckedTimestamp(new Date());
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const copyPingUrl = async (heartbeatUuid: string) => {
    const pingUrl = `https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/ping-handler?uuid=${heartbeatUuid}`;
    
    try {
      await navigator.clipboard.writeText(pingUrl);
      toast({
        title: "URL Copied",
        description: "Ping URL has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const showInstructions = (check: Check) => {
    setSelectedCheck(check);
    setInstructionsModalOpen(true);
  };

  const filteredChecks = selectedGroup === 'all'
    ? checks
    : selectedGroup 
    ? checks.filter(check => check.group_id === selectedGroup)
    : checks.filter(check => !check.group_id);

  const totalChecks = checks.length;
  const checksUp = checks.filter(check => check.status === 'up').length;
  const checksDown = checks.filter(check => check.status === 'down').length;
  const uptimePercentage = totalChecks > 0 ? Math.round((checksUp / totalChecks) * 100) : 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
      {/* Header */}
      <Card className="bg-gradient-primary shadow-card hover:shadow-card-hover transition-all duration-300 border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-foreground">Monitoring Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">Manage your service health checks</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <Button 
                className="shadow-glow-primary"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Check
              </Button>
              
              <div className="flex items-center gap-2">
                {lastCheckedTimestamp && (
                  <p className="text-muted-foreground text-xs">
                    Last updated: {lastCheckedTimestamp.toLocaleTimeString()}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Checks', value: totalChecks.toString(), gradient: 'bg-gradient-accent', border: 'border-accent/20' },
          { label: 'Checks Up', value: checksUp.toString(), gradient: 'bg-gradient-primary', border: 'border-primary/20' },
          { label: 'Checks Down', value: checksDown.toString(), gradient: 'bg-gradient-secondary', border: 'border-secondary/20' },
          { label: 'Uptime %', value: `${uptimePercentage}%`, gradient: 'bg-gradient-card', border: 'border-border/50' },
        ].map((stat, index) => (
          <Card key={index} className={`${stat.gradient} ${stat.border} shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-background/5 to-transparent" />
            <CardContent className="p-6 relative">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-foreground text-3xl font-bold mt-3">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Groups Filter Bar */}
      <Card className="bg-gradient-secondary shadow-card hover:shadow-card-hover transition-all duration-300 border-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
        <CardHeader className="pb-4 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-foreground">Filter by Group</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              className="shadow-glow-secondary"
              onClick={() => setCreateGroupModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 relative">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                selectedGroup === 'all' 
                  ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                  : 'text-muted-foreground hover:text-foreground bg-background/30 hover:bg-background/50 border border-border'
              }`}
            >
              All Checks ({checks.length})
            </button>
            
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                selectedGroup === null 
                  ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                  : 'text-muted-foreground hover:text-foreground bg-background/30 hover:bg-background/50 border border-border'
              }`}
            >
              Ungrouped ({checks.filter(c => !c.group_id).length})
            </button>
            
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  selectedGroup === group.id 
                    ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                    : 'text-muted-foreground hover:text-foreground bg-background/30 hover:bg-background/50 border border-border'
                }`}
              >
                {group.name} ({checks.filter(c => c.group_id === group.id).length})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Checks List */}
      <Card className="bg-gradient-card shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/5 to-transparent" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl text-foreground">
            {selectedGroup === 'all'
              ? 'All Checks'
              : selectedGroup 
              ? `${groups.find(g => g.id === selectedGroup)?.name || 'Group'} Checks`
              : 'Ungrouped Checks'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading checks...</p>
              </div>
            ) : filteredChecks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No health checks in this group yet</p>
                <Button 
                  className="shadow-glow-primary"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Check
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChecks.map((check) => (
                  <div 
                    key={check.id} 
                    className="bg-background/30 backdrop-blur-sm border border-border rounded-xl p-5 hover:shadow-card hover:bg-background/50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          check.status === 'up' ? 'bg-success shadow-glow-primary' : 'bg-accent shadow-glow-accent'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-foreground font-semibold text-base">{check.name}</h4>
                            {check.slack_webhook_url && (
                              <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                <MessageSquare className="w-3 h-3" />
                                <span>Slack</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            Status: <span className="text-foreground/80">{check.status}</span> • Every {check.interval_minutes}min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-muted-foreground text-xs">
                            {check.last_pinged_at 
                              ? `Last seen ${new Date(check.last_pinged_at).toLocaleString()}`
                              : 'Never pinged'
                            }
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="shadow-glow-secondary"
                          onClick={() => copyPingUrl(check.heartbeat_uuid)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </Button>
                        <Button
                          size="sm"
                          className="shadow-glow-primary"
                          onClick={() => showInstructions(check)}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          Instructions
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <CreateCheckModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchData}
        groups={groups}
      />

      <CreateGroupModal
        open={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onSuccess={fetchData}
      />

      {selectedCheck && (
        <CheckInstructionsModal
          open={instructionsModalOpen}
          onClose={() => setInstructionsModalOpen(false)}
          checkName={selectedCheck.name}
          heartbeatUuid={selectedCheck.heartbeat_uuid}
          checkType={selectedCheck.type}
        />
      )}
      </div>
    </div>
  );
}