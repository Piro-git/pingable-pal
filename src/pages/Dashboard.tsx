import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreateCheckModal } from '@/components/CreateCheckModal';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';


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
}

export default function Dashboard() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<Check[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
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
      setChecks(checksData || []);
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

  const filteredChecks = selectedGroup 
    ? checks.filter(check => check.group_id === selectedGroup)
    : checks.filter(check => !check.group_id);

  const totalChecks = checks.length;
  const checksUp = checks.filter(check => check.status === 'up').length;
  const checksDown = checks.filter(check => check.status === 'down').length;
  const uptimePercentage = totalChecks > 0 ? Math.round((checksUp / totalChecks) * 100) : 100;

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="glass rounded-2xl p-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Monitoring Dashboard</h2>
            <p className="text-sm text-white/70">Manage your service health checks</p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Button 
              className="glass-button h-9"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Check
            </Button>
            
            <div className="flex items-center gap-2">
              {lastCheckedTimestamp && (
                <p className="text-white/60 text-xs">
                  Last updated: {lastCheckedTimestamp.toLocaleTimeString()}
                </p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="glass-button p-1.5 h-7 w-7"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resizable Panels */}
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Total Checks', value: totalChecks.toString() },
              { label: 'Checks Up', value: checksUp.toString() },
              { label: 'Checks Down', value: checksDown.toString() },
              { label: 'Uptime %', value: `${uptimePercentage}%` },
            ].map((stat, index) => (
              <div key={index} className="glass rounded-xl p-3">
                <p className="text-white/70 text-xs">{stat.label}</p>
                <p className="text-white text-xl font-bold mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Groups Filter Bar */}
          <div className="glass rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Filter by Group</h3>
              <Button
                size="sm"
                className="glass-button h-8"
                onClick={() => setCreateGroupModalOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Group
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  selectedGroup === null 
                    ? 'glass-button text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                Ungrouped ({checks.filter(c => !c.group_id).length})
              </button>
              
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    selectedGroup === group.id 
                      ? 'glass-button text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                  }`}
                >
                  {group.name} ({checks.filter(c => c.group_id === group.id).length})
                </button>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75} minSize={60}>
          {/* Checks List */}
          <div className="glass rounded-2xl p-6 h-full flex flex-col mt-3">
            <h3 className="text-xl font-semibold text-white mb-4 flex-shrink-0">
              {selectedGroup 
                ? `${groups.find(g => g.id === selectedGroup)?.name || 'Group'} Checks`
                : 'Ungrouped Checks'
              }
            </h3>
            
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-white/70">Loading checks...</p>
                </div>
              ) : filteredChecks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/70 mb-4">No health checks in this group yet</p>
                  <Button 
                    className="glass-button"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Check
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filteredChecks.map((check) => (
                    <div key={check.id} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            check.status === 'up' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <h4 className="text-white font-medium">{check.name}</h4>
                            <p className="text-white/70 text-sm">
                              Status: {check.status} • Every {check.interval_minutes}min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-white/70 text-sm">
                              {check.last_pinged_at 
                                ? `Last seen ${new Date(check.last_pinged_at).toLocaleString()}`
                                : 'Never pinged'
                              }
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button"
                            onClick={() => copyPingUrl(check.heartbeat_uuid)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

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
    </div>
  );
}