import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { UptimeHistoryChart } from '@/components/UptimeHistoryChart';

interface Check {
  id: string;
  name: string;
  status: string;
  color: string | null;
}

interface CheckUptime {
  check_id: string;
  check_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  uptime_percentage: number;
  color: string | null;
}

interface DowntimeIncident {
  id: string;
  check_id: string;
  check_name: string;
  created_at: string;
  duration_ms: number | null;
  error_message: string | null;
}

export default function UptimeReports() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<Check[]>([]);
  const [uptimeData, setUptimeData] = useState<CheckUptime[]>([]);
  const [incidents, setIncidents] = useState<DowntimeIncident[]>([]);
  const [dateRange, setDateRange] = useState(7); // days
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<CheckUptime | null>(null);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch checks
      const { data: checksData, error: checksError } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (checksError) throw checksError;
      setChecks(checksData || []);

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Fetch check runs for the date range
      const { data: runsData, error: runsError } = await supabase
        .from('check_runs')
        .select('*, checks!inner(name, color)')
        .gte('created_at', startDate.toISOString())
        .in('check_id', (checksData || []).map(c => c.id));

      if (runsError) throw runsError;

      // Calculate uptime per check
      const uptimeMap = new Map<string, CheckUptime>();
      
      checksData?.forEach(check => {
        const checkRuns = runsData?.filter(r => r.check_id === check.id) || [];
        const totalRuns = checkRuns.length;
        const successfulRuns = checkRuns.filter(r => r.status === 'success').length;
        const failedRuns = totalRuns - successfulRuns;
        const uptimePercentage = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

        uptimeMap.set(check.id, {
          check_id: check.id,
          check_name: check.name,
          total_runs: totalRuns,
          successful_runs: successfulRuns,
          failed_runs: failedRuns,
          uptime_percentage: Math.round(uptimePercentage * 100) / 100,
          color: check.color
        });
      });

      setUptimeData(Array.from(uptimeMap.values()));

      // Fetch downtime incidents (failed runs)
      const incidents: DowntimeIncident[] = runsData
        ?.filter(r => r.status !== 'success')
        .map(r => ({
          id: r.id,
          check_id: r.check_id,
          check_name: (r.checks as any)?.name || 'Unknown',
          created_at: r.created_at,
          duration_ms: r.duration_ms,
          error_message: r.error_message
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

      setIncidents(incidents);
    } catch (error) {
      console.error('Error fetching uptime data:', error);
      toast.error('Failed to load uptime reports');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['Check Name', 'Total Runs', 'Successful Runs', 'Failed Runs', 'Uptime %'];
    const rows = uptimeData.map(data => [
      data.check_name,
      data.total_runs.toString(),
      data.successful_runs.toString(),
      data.failed_runs.toString(),
      data.uptime_percentage.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `uptime-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV report exported successfully');
  };

  const getUptimeColor = (percentage: number) => {
    if (percentage >= 99) return 'text-green-500';
    if (percentage >= 95) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getUptimeIcon = (percentage: number) => {
    if (percentage >= 95) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const handleCheckClick = (check: CheckUptime) => {
    setSelectedCheck(check);
    setChartOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Uptime Reports</h1>
            <p className="text-muted-foreground mt-1">Loading uptime data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Uptime Reports</h1>
          <p className="text-muted-foreground mt-1">
            Detailed uptime statistics for the last {dateRange} days
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setDateRange(7)}
            className={dateRange === 7 ? 'bg-primary/10 border-primary' : ''}
          >
            7 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => setDateRange(30)}
            className={dateRange === 30 ? 'bg-primary/10 border-primary' : ''}
          >
            30 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => setDateRange(90)}
            className={dateRange === 90 ? 'bg-primary/10 border-primary' : ''}
          >
            90 Days
          </Button>
          <Button onClick={exportToCSV} className="shadow-glow">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Per-Check Uptime Table */}
      <Card>
        <CardHeader>
          <CardTitle>Check Uptime Statistics</CardTitle>
          <CardDescription>
            Uptime percentages calculated from actual check runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uptimeData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check Name</TableHead>
                  <TableHead className="text-right">Total Runs</TableHead>
                  <TableHead className="text-right">Successful</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Uptime %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uptimeData.map((data) => (
                  <TableRow 
                    key={data.check_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCheckClick(data)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: data.color || '#3B82F6' }}
                        />
                        {data.check_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{data.total_runs}</TableCell>
                    <TableCell className="text-right text-green-500">
                      {data.successful_runs}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {data.failed_runs}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-2 font-semibold ${getUptimeColor(data.uptime_percentage)}`}>
                        {getUptimeIcon(data.uptime_percentage)}
                        {data.uptime_percentage.toFixed(2)}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Downtime Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Downtime Incidents
          </CardTitle>
          <CardDescription>
            Failed check runs during the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No downtime incidents in the selected period 🎉
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Failed</Badge>
                        <span className="font-semibold text-foreground">
                          {incident.check_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(incident.created_at), 'PPpp')}
                      </p>
                      {incident.error_message && (
                        <p className="text-sm text-red-500 mt-2 font-mono">
                          {incident.error_message}
                        </p>
                      )}
                    </div>
                    {incident.duration_ms && (
                      <span className="text-sm text-muted-foreground">
                        {incident.duration_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uptime History Chart Modal */}
      {selectedCheck && (
        <UptimeHistoryChart
          checkId={selectedCheck.check_id}
          checkName={selectedCheck.check_name}
          checkColor={selectedCheck.color}
          dateRange={dateRange}
          open={chartOpen}
          onOpenChange={setChartOpen}
        />
      )}
    </div>
  );
}
