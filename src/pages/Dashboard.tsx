import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Activity, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type Check = Database['public']['Tables']['checks']['Row'];

interface ActivityEvent {
  id: string;
  type: 'check_down' | 'check_up' | 'prompt_created' | 'check_created';
  message: string;
  timestamp: string;
}

interface UptimeData {
  date: string;
  uptime: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [uptimeData, setUptimeData] = useState<UptimeData[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch checks
      const { data: checksData, error: checksError } = await supabase
        .from('checks')
        .select('*')
        .order('created_at', { ascending: false });

      if (checksError) throw checksError;
      setChecks(checksData || []);

      // Fetch real uptime data for last 7 days
      const realUptimeData = await fetchRealUptimeData(checksData || []);
      setUptimeData(realUptimeData);

      // Generate mock activities
      const mockActivities = generateMockActivities(checksData || []);
      setActivities(mockActivities);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealUptimeData = async (checks: Check[]): Promise<UptimeData[]> => {
    if (checks.length === 0) {
      return [];
    }

    const data: UptimeData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dateStr = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
      
      // Fetch check runs for this day
      const { data: runsData, error } = await supabase
        .from('check_runs')
        .select('status, check_id')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())
        .in('check_id', checks.map(c => c.id));

      if (error) {
        console.error('Error fetching check runs:', error);
        // Fallback to current status if no historical data
        const totalChecks = checks.length;
        const upChecks = checks.filter(c => c.status === 'up').length;
        const uptime = (upChecks / totalChecks) * 100;
        data.push({ date: dateStr, uptime: Math.round(uptime * 10) / 10 });
        continue;
      }

      // Calculate uptime percentage for the day
      if (runsData && runsData.length > 0) {
        const successfulRuns = runsData.filter(r => r.status === 'success').length;
        const uptime = (successfulRuns / runsData.length) * 100;
        data.push({ date: dateStr, uptime: Math.round(uptime * 10) / 10 });
      } else {
        // No runs for this day, use current check status as fallback
        const totalChecks = checks.length;
        const upChecks = checks.filter(c => c.status === 'up').length;
        const uptime = (upChecks / totalChecks) * 100;
        data.push({ date: dateStr, uptime: Math.round(uptime * 10) / 10 });
      }
    }
    
    return data;
  };

  const generateMockActivities = (checks: Check[]): ActivityEvent[] => {
    const activities: ActivityEvent[] = [];
    const now = new Date();
    
    checks.slice(0, 5).forEach((check, index) => {
      const timestamp = new Date(now.getTime() - (index + 1) * 3600000);
      
      if (check.status === 'down') {
        activities.push({
          id: `${check.id}-down`,
          type: 'check_down',
          message: `Check '${check.name}' went down`,
          timestamp: timestamp.toISOString()
        });
      } else {
        activities.push({
          id: `${check.id}-up`,
          type: 'check_up',
          message: `Check '${check.name}' is back up`,
          timestamp: timestamp.toISOString()
        });
      }
    });
    
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const downChecks = checks.filter(c => c.status === 'down');
  const upChecks = checks.filter(c => c.status === 'up');
  const currentUptime = checks.length > 0 ? ((upChecks.length / checks.length) * 100).toFixed(1) : '0';

  const getDowntimeDuration = (lastPinged: string | null, intervalMinutes: number, gracePeriodMinutes: number) => {
    if (!lastPinged) return 'Never pinged';
    
    const lastPing = new Date(lastPinged);
    const now = new Date();
    const minutesSinceLastPing = Math.floor((now.getTime() - lastPing.getTime()) / (1000 * 60));
    const expectedInterval = intervalMinutes + gracePeriodMinutes;
    
    if (minutesSinceLastPing <= expectedInterval) return 'Just now';
    
    const downMinutes = minutesSinceLastPing - expectedInterval;
    
    if (downMinutes < 60) return `Down for ${downMinutes}m`;
    if (downMinutes < 1440) return `Down for ${Math.floor(downMinutes / 60)}h`;
    return `Down for ${Math.floor(downMinutes / 1440)}d`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check_down':
        return <AlertTriangle className="w-4 h-4 text-accent" />;
      case 'check_up':
        return <Activity className="w-4 h-4 text-success" />;
      case 'prompt_created':
      case 'check_created':
        return <Plus className="w-4 h-4 text-secondary" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const minutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-8 h-full flex items-center justify-center shadow-card">
        <div className="text-muted-foreground font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Complete overview of your monitoring and prompts</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critical Status Card */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 bg-gradient-accent border-accent/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Critical Alerts</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${downChecks.length > 0 ? 'text-accent' : 'text-success'}`}>
                    {downChecks.length}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {downChecks.length === 1 ? 'down' : 'down'}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${downChecks.length > 0 ? 'bg-accent/20' : 'bg-success/20'}`}>
                <AlertTriangle className={`w-6 h-6 ${downChecks.length > 0 ? 'text-accent' : 'text-success'}`} />
              </div>
            </div>
          </CardHeader>
          {downChecks.length > 0 && (
            <CardContent className="relative">
              <div className="space-y-2">
                {downChecks.slice(0, 2).map(check => (
                  <div key={check.id} className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-sm font-medium truncate">{check.name}</span>
                      <span className="text-accent text-xs font-medium ml-2">
                        {getDowntimeDuration(check.last_pinged_at, check.interval_minutes, check.grace_period_minutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Total Checks Card */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 bg-gradient-primary border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Total Checks</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{checks.length}</span>
                  <span className="text-muted-foreground text-sm">active</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${currentUptime}%` }}
                />
              </div>
              <span className="text-primary text-sm font-semibold">{currentUptime}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Uptime Card */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 bg-gradient-secondary border-secondary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Current Uptime</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-success">{currentUptime}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/20">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-muted-foreground text-sm">
              {upChecks.length} of {checks.length} checks operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uptime History - Takes 2 columns */}
        <Card className="lg:col-span-2 shadow-card hover:shadow-card-hover transition-all duration-300 bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">7-Day Uptime</h2>
                  <p className="text-muted-foreground text-sm">Performance over the last week</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                uptime: {
                  label: "Uptime %",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-64 w-full"
            >
              <LineChart data={uptimeData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone"
                  dataKey="uptime" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ 
                    fill: "hsl(var(--primary))", 
                    strokeWidth: 2,
                    r: 4 
                  }}
                  activeDot={{ 
                    r: 6,
                    fill: "hsl(var(--primary))",
                    strokeWidth: 2,
                    stroke: "hsl(var(--background))"
                  }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Plus className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
                <p className="text-muted-foreground text-sm">Create new resources</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/monitoring')}
                className="w-full h-12 font-semibold hover:-translate-y-0.5 transition-all shadow-md hover:shadow-glow-primary"
              >
                <Activity className="w-4 h-4 mr-2" />
                New Check
              </Button>

              <Button
                onClick={() => navigate('/prompts')}
                variant="secondary"
                className="w-full h-12 font-semibold hover:-translate-y-0.5 transition-all shadow-md hover:shadow-glow-accent text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Prompt
              </Button>

              <Button
                onClick={() => navigate('/team')}
                variant="outline"
                className="w-full h-12 font-semibold hover:-translate-y-0.5 transition-all border-border/70 hover:border-primary/50 text-foreground hover:text-foreground"
              >
                Manage Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
              <p className="text-muted-foreground text-sm">Latest events across your monitors</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="bg-background/30 backdrop-blur-sm border border-border rounded-xl p-4 hover:bg-background/50 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'check_down' ? 'bg-accent/20' :
                      activity.type === 'check_up' ? 'bg-success/20' :
                      'bg-secondary/20'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{activity.message}</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {getRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-background/30 backdrop-blur-sm border border-border rounded-xl p-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No recent activity</p>
                <p className="text-muted-foreground text-sm mt-1">Activity will appear here once your checks start reporting</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
