import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Copy, RefreshCw, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreateCheckModal } from '@/components/CreateCheckModal';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { CheckInstructionsModal } from '@/components/CheckInstructionsModal';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';


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

  const filteredChecks = selectedGroup 
    ? checks.filter(check => check.group_id === selectedGroup)
    : checks.filter(check => !check.group_id);

  const totalChecks = checks.length;
  const checksUp = checks.filter(check => check.status === 'up').length;
  const checksDown = checks.filter(check => check.status === 'down').length;
  const uptimePercentage = totalChecks > 0 ? Math.round((checksUp / totalChecks) * 100) : 100;

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="bg-gradient-card rounded-2xl p-6 flex-shrink-0 shadow-card border border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Monitoring Dashboard</h2>
            <p className="text-sm text-white/60 mt-1">Manage your service health checks</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Button 
              className="h-10 bg-primary hover:bg-primary-hover text-white shadow-glow-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Check
            </Button>
            
            <div className="flex items-center gap-2">
              {lastCheckedTimestamp && (
                <p className="text-white/40 text-xs">
                  Last updated: {lastCheckedTimestamp.toLocaleTimeString()}
                </p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="p-1.5 h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {/* Top Section */}
        <div className="flex-shrink-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Total Checks', value: totalChecks.toString(), gradient: 'bg-gradient-accent' },
              { label: 'Checks Up', value: checksUp.toString(), gradient: 'bg-gradient-primary' },
              { label: 'Checks Down', value: checksDown.toString(), gradient: 'bg-gradient-secondary' },
              { label: 'Uptime %', value: `${uptimePercentage}%`, gradient: 'bg-gradient-card' },
            ].map((stat, index) => (
              <div key={index} className={`${stat.gradient} rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 border border-white/10`}>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
                <p className="text-white text-3xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Groups Filter Bar */}
          <div className="bg-gradient-card rounded-2xl p-5 shadow-card border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filter by Group</h3>
              <Button
                size="sm"
                className="h-9 bg-secondary hover:bg-secondary/90 text-white shadow-glow-secondary"
                onClick={() => setCreateGroupModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  selectedGroup === null 
                    ? 'bg-primary text-white shadow-glow-primary' 
                    : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
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
                      ? 'bg-primary text-white shadow-glow-primary' 
                      : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {group.name} ({checks.filter(c => c.group_id === group.id).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Checks List */}
          <div className="bg-gradient-card rounded-2xl p-6 h-full flex flex-col shadow-card border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4 flex-shrink-0">
              {selectedGroup 
                ? `${groups.find(g => g.id === selectedGroup)?.name || 'Group'} Checks`
                : 'Ungrouped Checks'
              }
            </h3>
            
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-white/60 font-medium">Loading checks...</p>
                </div>
              ) : filteredChecks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 mb-4 font-medium">No health checks in this group yet</p>
                  <Button 
                    className="bg-primary hover:bg-primary-hover text-white shadow-glow-primary"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Check
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filteredChecks.map((check) => (
                    <div key={check.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:shadow-card-hover hover:bg-white/8 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full ${
                            check.status === 'up' ? 'bg-success shadow-glow-primary' : 'bg-accent shadow-glow-accent'
                          }`} />
                          <div>
                            <h4 className="text-white font-semibold text-lg">{check.name}</h4>
                            <p className="text-white/60 text-sm font-medium mt-0.5">
                              Status: {check.status} • Every {check.interval_minutes}min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-white/50 text-sm">
                              {check.last_pinged_at 
                                ? `Last seen ${new Date(check.last_pinged_at).toLocaleString()}`
                                : 'Never pinged'
                              }
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                            onClick={() => copyPingUrl(check.heartbeat_uuid)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </Button>
                          <Button
                            size="sm"
                            className="bg-secondary hover:bg-secondary/90 text-white shadow-glow-secondary"
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
          </div>
        </div>
      </div>

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
  );
}