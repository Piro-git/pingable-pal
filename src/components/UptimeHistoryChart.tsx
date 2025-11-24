import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface UptimeHistoryChartProps {
  checkId: string;
  checkName: string;
  checkColor: string | null;
  dateRange: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyUptime {
  date: string;
  uptime: number;
  successful: number;
  failed: number;
  total: number;
}

export function UptimeHistoryChart({ 
  checkId, 
  checkName, 
  checkColor, 
  dateRange, 
  open, 
  onOpenChange 
}: UptimeHistoryChartProps) {
  const [data, setData] = useState<DailyUptime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && checkId) {
      fetchHistoricalData();
    }
  }, [open, checkId, dateRange]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), dateRange);
      const dailyData: DailyUptime[] = [];

      // Fetch all check runs for the period
      const { data: runsData, error } = await supabase
        .from('check_runs')
        .select('status, created_at')
        .eq('check_id', checkId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      for (let i = dateRange - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRuns = runsData?.filter(run => {
          const runDate = new Date(run.created_at);
          return runDate >= date && runDate < nextDate;
        }) || [];

        const successful = dayRuns.filter(r => r.status === 'success').length;
        const failed = dayRuns.length - successful;
        const uptime = dayRuns.length > 0 ? (successful / dayRuns.length) * 100 : 100;

        dailyData.push({
          date: format(date, 'MMM dd'),
          uptime: Math.round(uptime * 100) / 100,
          successful,
          failed,
          total: dayRuns.length
        });
      }

      setData(dailyData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.date}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-500 font-medium">
              Uptime: {data.uptime.toFixed(2)}%
            </p>
            <p className="text-muted-foreground">
              Total Runs: {data.total}
            </p>
            <p className="text-green-500">
              Successful: {data.successful}
            </p>
            <p className="text-red-500">
              Failed: {data.failed}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: checkColor || '#3B82F6' }}
            />
            {checkName} - Uptime History
          </DialogTitle>
          <DialogDescription>
            Daily uptime percentages over the last {dateRange} days
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No historical data available for this period
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ 
                      value: 'Uptime %', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={95} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: '95% SLA', 
                      position: 'right',
                      style: { fill: 'hsl(var(--destructive))' }
                    }}
                  />
                  <ReferenceLine 
                    y={99} 
                    stroke="hsl(var(--warning))" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: '99% SLA', 
                      position: 'right',
                      style: { fill: 'hsl(var(--warning))' }
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uptime" 
                    stroke={checkColor || '#3B82F6'}
                    strokeWidth={3}
                    dot={{ fill: checkColor || '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: checkColor || '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {(data.reduce((sum, d) => sum + d.uptime, 0) / data.length).toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Average Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {data.reduce((sum, d) => sum + d.successful, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Successful</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {data.reduce((sum, d) => sum + d.failed, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {data.reduce((sum, d) => sum + d.total, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Runs</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
