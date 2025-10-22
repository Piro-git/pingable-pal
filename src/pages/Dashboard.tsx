import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Activity, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
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

      // Generate mock uptime data for last 7 days
      const mockUptimeData = generateMockUptimeData(checksData || []);
      setUptimeData(mockUptimeData);

      // Generate mock activities
      const mockActivities = generateMockActivities(checksData || []);
      setActivities(mockActivities);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockUptimeData = (checks: Check[]): UptimeData[] => {
    const data: UptimeData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
      
      // Calculate uptime based on current checks status
      const totalChecks = checks.length || 1;
      const upChecks = checks.filter(c => c.status === 'up').length;
      const baseUptime = (upChecks / totalChecks) * 100;
      
      // Add some variation for older days
      const variation = Math.random() * 5 - 2.5;
      const uptime = Math.min(100, Math.max(85, baseUptime + variation));
      
      data.push({
        date: dateStr,
        uptime: Math.round(uptime * 10) / 10
      });
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
    <div className="h-full overflow-y-auto space-y-6">
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground font-medium">Complete overview of your monitoring and prompts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical System Status */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${downChecks.length > 0 ? 'text-accent' : 'text-success'}`} />
              <h2 className="text-xl font-semibold text-foreground">Critical Status</h2>
            </div>
          </CardHeader>
          <CardContent>

            <div className="mb-6">
              <div className={`text-5xl font-bold ${downChecks.length > 0 ? 'text-accent' : 'text-success'}`}>
                {downChecks.length}
              </div>
              <div className="text-muted-foreground text-sm mt-1 font-medium">
                {downChecks.length === 1 ? 'Check Down' : 'Checks Down'}
              </div>
            </div>

            {downChecks.length > 0 ? (
              <div className="space-y-2">
                {downChecks.map(check => (
                  <div key={check.id} className="bg-muted/50 border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-semibold">{check.name}</span>
                      <span className="text-accent text-sm font-medium">
                        {getDowntimeDuration(check.last_pinged_at, check.interval_minutes, check.grace_period_minutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center shadow-sm">
                <p className="text-success font-semibold">All systems operational!</p>
                <p className="text-muted-foreground text-sm mt-1 font-medium">No issues detected</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Create new monitoring checks or prompts
            </p>
          </CardHeader>
          <CardContent>

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/monitoring')}
                className="w-full h-14 text-lg font-semibold hover:-translate-y-0.5 transition-transform shadow-md hover:shadow-lg"
              >
                <Activity className="w-5 h-5 mr-2" />
                New Monitoring Check
              </Button>

              <Button
                onClick={() => navigate('/prompts')}
                variant="secondary"
                className="w-full h-14 text-lg font-semibold hover:-translate-y-0.5 transition-transform shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Prompt
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-muted/50 border border-border rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-foreground">{checks.length}</div>
                <div className="text-muted-foreground text-xs font-medium mt-1">Total Checks</div>
              </div>
              <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-success">{currentUptime}%</div>
                <div className="text-muted-foreground text-xs font-medium mt-1">Current Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime History */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">7-Day Uptime</h2>
            </div>
          </CardHeader>
          <CardContent>

            <ChartContainer
              config={{
                uptime: {
                  label: "Uptime",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-64 w-full"
            >
              <BarChart data={uptimeData}>
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
                <Bar 
                  dataKey="uptime" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-secondary" />
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.length > 0 ? (
                activities.map(activity => (
                  <div key={activity.id} className="bg-muted/50 border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium">{activity.message}</p>
                        <p className="text-muted-foreground text-xs mt-1 font-medium">
                          {getRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm font-medium">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
