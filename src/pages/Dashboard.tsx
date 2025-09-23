import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

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
            <Button className="glass-button">
              <Plus className="w-4 h-4 mr-2" />
              Create New Check
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Checks', value: '0' },
            { label: 'Checks Up', value: '0' },
            { label: 'Checks Down', value: '0' },
            { label: 'Uptime %', value: '100%' },
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
          <div className="text-center py-12">
            <p className="text-white/70 mb-4">No health checks configured yet</p>
            <Button className="glass-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Check
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}