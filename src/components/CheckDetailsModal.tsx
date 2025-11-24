import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Copy, TrendingUp, TrendingDown, Clock, Activity, Settings, BarChart3, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Check {
  id: string;
  name: string;
  status: string;
  interval_minutes: number;
  grace_period_minutes: number;
  heartbeat_uuid: string;
  last_pinged_at: string | null;
  created_at: string;
  type: string;
  slack_webhook_url: string | null;
}

interface CheckDetailsModalProps {
  check: Check | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface CheckRun {
  id: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
  error_message: string | null;
}

export function CheckDetailsModal({ check, open, onOpenChange, onUpdate }: CheckDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(5);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [recentRuns, setRecentRuns] = useState<CheckRun[]>([]);
  const [uptimeData, setUptimeData] = useState<any[]>([]);
  const [stats, setStats] = useState({ uptime: 0, totalRuns: 0, successfulRuns: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (check && open) {
      setName(check.name);
      setIntervalMinutes(check.interval_minutes);
      setGracePeriodMinutes(check.grace_period_minutes);
      setSlackWebhook(check.slack_webhook_url || '');
      fetchCheckData();
    }
  }, [check, open]);

  const fetchCheckData = async () => {
    if (!check) return;
    
    setLoading(true);
    try {
      // Fetch recent check runs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: runsData, error: runsError } = await supabase
        .from('check_runs')
        .select('*')
        .eq('check_id', check.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (runsError) throw runsError;

      setRecentRuns(runsData || []);

      // Calculate stats
      const total = runsData?.length || 0;
      const successful = runsData?.filter(r => r.status === 'success').length || 0;
      const uptimePercentage = total > 0 ? (successful / total) * 100 : 100;

      setStats({
        uptime: Math.round(uptimePercentage * 100) / 100,
        totalRuns: total,
        successfulRuns: successful
      });

      // Generate uptime chart data (last 7 days)
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRuns = runsData?.filter(run => {
          const runDate = new Date(run.created_at);
          return runDate >= date && runDate < nextDate;
        }) || [];

        const daySuccessful = dayRuns.filter(r => r.status === 'success').length;
        const dayUptime = dayRuns.length > 0 ? (daySuccessful / dayRuns.length) * 100 : 100;

        chartData.push({
          date: format(date, 'MMM dd'),
          uptime: Math.round(dayUptime * 100) / 100
        });
      }

      setUptimeData(chartData);
    } catch (error) {
      console.error('Error fetching check data:', error);
      toast.error('Failed to load check data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!check) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('checks')
        .update({
          name,
          interval_minutes: intervalMinutes,
          grace_period_minutes: gracePeriodMinutes,
          slack_webhook_url: slackWebhook || null
        })
        .eq('id', check.id);

      if (error) throw error;

      toast.success('Check updated successfully');
      setEditMode(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating check:', error);
      toast.error('Failed to update check');
    } finally {
      setLoading(false);
    }
  };

  const copyPingUrl = () => {
    if (!check) return;
    const pingUrl = `https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/ping-handler?uuid=${check.heartbeat_uuid}`;
    navigator.clipboard.writeText(pingUrl);
    toast.success('Ping URL copied to clipboard');
  };

  if (!check) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                check.status === 'up' ? 'bg-success shadow-glow-primary' : 'bg-destructive shadow-glow-accent'
              }`} />
              <DialogTitle className="text-2xl">{check.name}</DialogTitle>
            </div>
            <Badge variant={check.status === 'up' ? 'default' : 'destructive'}>
              {check.status.toUpperCase()}
            </Badge>
          </div>
          <DialogDescription>
            Detailed statistics, history, and settings for this check
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history">
              <Activity className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {stats.uptime >= 95 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                    <span className="text-3xl font-bold">{stats.uptime}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalRuns}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.successfulRuns} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Last Ping</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div className="text-sm">
                      {check.last_pinged_at 
                        ? format(new Date(check.last_pinged_at), 'PPp')
                        : 'Never'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Uptime Chart */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Uptime Trend</CardTitle>
                <CardDescription>Daily uptime percentages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uptimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uptime" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Ping URL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ping URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    value={`https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/ping-handler?uuid=${check.heartbeat_uuid}`}
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button onClick={copyPingUrl} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check Runs</CardTitle>
                <CardDescription>Last 50 check runs (30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentRuns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No check runs yet</p>
                  ) : (
                    recentRuns.map((run) => (
                      <div 
                        key={run.id} 
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={run.status === 'success' ? 'default' : 'destructive'}>
                            {run.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(run.created_at), 'PPp')}
                          </span>
                        </div>
                        {run.duration_ms && (
                          <span className="text-sm text-muted-foreground">
                            {run.duration_ms}ms
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Check Configuration</CardTitle>
                <CardDescription>Update check settings and integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Check Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Check Interval (minutes)</Label>
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                      disabled={!editMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grace">Grace Period (minutes)</Label>
                    <Input
                      id="grace"
                      type="number"
                      min="0"
                      value={gracePeriodMinutes}
                      onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value))}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Slack Webhook URL (optional)
                    </div>
                  </Label>
                  <Input
                    id="slack"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    disabled={!editMode}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  {editMode ? (
                    <>
                      <Button onClick={handleSave} disabled={loading}>
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditMode(false);
                          setName(check.name);
                          setIntervalMinutes(check.interval_minutes);
                          setGracePeriodMinutes(check.grace_period_minutes);
                          setSlackWebhook(check.slack_webhook_url || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditMode(true)}>
                      Edit Settings
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
