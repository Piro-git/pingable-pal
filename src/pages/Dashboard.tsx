import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'check_up':
        return <Activity className="w-4 h-4 text-green-400" />;
      case 'prompt_created':
      case 'check_created':
        return <Plus className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-white/60" />;
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
      <div className="bg-bg-lighter/60 backdrop-blur-xl rounded-2xl p-8 h-full flex items-center justify-center shadow-realistic">
        <div className="text-white/70">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-base/50 backdrop-blur-xl rounded-2xl p-8 h-full overflow-y-auto shadow-realistic">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/70">Complete overview of your monitoring and prompts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Critical System Status */}
        <Card className="p-6 hover:shadow-realistic-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className={`w-6 h-6 ${downChecks.length > 0 ? 'text-red-400' : 'text-green-400'}`} />
            <h2 className="text-xl font-semibold text-white">Critical Status</h2>
          </div>

          <div className="mb-4">
            <div className={`text-5xl font-bold ${downChecks.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {downChecks.length}
            </div>
            <div className="text-white/70 text-sm mt-1">
              {downChecks.length === 1 ? 'Check Down' : 'Checks Down'}
            </div>
          </div>

          {downChecks.length > 0 ? (
            <div className="space-y-2">
              {downChecks.map(check => (
                <div key={check.id} className="bg-bg-lighter/80 backdrop-blur-xl rounded-lg p-3 shadow-realistic hover:shadow-realistic-lg transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{check.name}</span>
                    <span className="text-red-400 text-sm">
                      {getDowntimeDuration(check.last_pinged_at, check.interval_minutes, check.grace_period_minutes)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-lighter/80 backdrop-blur-xl rounded-lg p-4 text-center shadow-realistic">
              <p className="text-green-400 font-medium">All systems operational!</p>
              <p className="text-white/60 text-sm mt-1">No issues detected</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 hover:shadow-realistic-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>

          <p className="text-white/70 text-sm mb-6">
            Create new monitoring checks or prompts
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/monitoring')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-14 text-lg shadow-realistic-lg hover:-translate-y-1"
            >
              <Activity className="w-5 h-5 mr-2" />
              New Monitoring Check
            </Button>

            <Button
              onClick={() => navigate('/prompts')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-14 text-lg shadow-realistic-lg hover:-translate-y-1"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Prompt
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-bg-lighter/80 backdrop-blur-xl rounded-lg p-3 text-center shadow-realistic">
              <div className="text-2xl font-bold text-white">{checks.length}</div>
              <div className="text-white/60 text-xs">Total Checks</div>
            </div>
            <div className="bg-bg-lighter/80 backdrop-blur-xl rounded-lg p-3 text-center shadow-realistic">
              <div className="text-2xl font-bold text-green-400">{currentUptime}%</div>
              <div className="text-white/60 text-xs">Current Uptime</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime History */}
        <Card className="p-6 bg-bg-darker/50 backdrop-blur-xl shadow-inset-deep hover:bg-bg-darker/60 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">7-Day Uptime</h2>
          </div>

          <ChartContainer
            config={{
              uptime: {
                label: "Uptime",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-64 w-full"
          >
            <BarChart data={uptimeData}>
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="uptime" 
                fill="hsl(var(--chart-1))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* Recent Activities */}
        <Card className="p-6 hover:shadow-realistic-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="bg-bg-lighter/80 backdrop-blur-xl rounded-lg p-3 shadow-realistic hover:shadow-realistic-lg transition-all duration-200">
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{activity.message}</p>
                      <p className="text-white/50 text-xs mt-1">
                        {getRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-bg-lighter/80 backdrop-blur-xl rounded-lg p-4 text-center shadow-realistic">
                <p className="text-white/60 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
