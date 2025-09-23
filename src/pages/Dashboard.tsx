import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { CreateCheckModal } from '@/components/CreateCheckModal';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [checks, setChecks] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChecks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setChecks(data || []);
    } catch (error) {
      console.error('Error fetching checks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch checks.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const handleCreateCheck = () => {
    setIsCreateModalOpen(true);
  };

  const handleCheckCreated = () => {
    fetchChecks(); // Refresh the checks list
  };

  // Calculate stats
  const totalChecks = checks.length;
  const checksUp = checks.filter(check => check.status === 'up').length;
  const checksDown = checks.filter(check => check.status === 'down').length;
  const uptimePercent = totalChecks > 0 ? Math.round((checksUp / totalChecks) * 100) : 100;

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed left-4 top-4 bottom-4 w-64 glass rounded-2xl p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">StatusPing</h1>
          <p className="text-white/70 text-sm mt-1">Monitoring Dashboard</p>
        </div>

        <nav className="space-y-3">
          <div className="glass-button rounded-lg px-4 py-2 text-white">
            Dashboard
          </div>
          <div className="text-white/70 px-4 py-2 hover:text-white cursor-pointer transition-colors">
            Settings
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="glass rounded-lg p-3 mb-3">
            <p className="text-white/70 text-sm">Signed in as:</p>
            <p className="text-white text-sm font-medium truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full glass-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72 p-4">
        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Monitoring Dashboard</h2>
              <p className="text-white/70">Manage your service health checks</p>
            </div>
            <Button onClick={handleCreateCheck} className="glass-button">
              <Plus className="w-4 h-4 mr-2" />
              Create New Check
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Checks', value: totalChecks.toString() },
            { label: 'Checks Up', value: checksUp.toString() },
            { label: 'Checks Down', value: checksDown.toString() },
            { label: 'Uptime %', value: `${uptimePercent}%` },
          ].map((stat, index) => (
            <div key={index} className="glass rounded-xl p-4">
              <p className="text-white/70 text-sm">{stat.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Checks List */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Health Checks</h3>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-white/70">Loading checks...</p>
            </div>
          ) : checks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 mb-4">No health checks configured yet</p>
              <Button onClick={handleCreateCheck} className="glass-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Check
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {checks.map((check) => (
                <div key={check.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${check.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <h4 className="text-white font-medium">{check.name}</h4>
                        <p className="text-white/70 text-sm capitalize">Status: {check.status}</p>
                      </div>
                    </div>
                    <div className="text-right text-white/70 text-sm">
                      <p>Every {check.interval_minutes} min</p>
                      {check.last_pinged_at && (
                        <p>Last seen: {new Date(check.last_pinged_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Check Modal */}
      <CreateCheckModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onCheckCreated={handleCheckCreated}
      />
    </div>
  );
}