import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Archive, BarChart3, Users, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard',
      roles: ['admin', 'editor', 'viewer']
    },
    {
      name: 'Prompt Archive', 
      icon: Archive,
      path: '/prompts',
      roles: ['admin', 'editor', 'viewer']
    },
    {
      name: 'Team Management',
      icon: Users,
      path: '/team',
      roles: ['admin']
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['admin', 'editor', 'viewer']
    }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen">
      <div className="h-[calc(100vh)] flex">
        {/* Persistent Left Sidebar */}
        <div className="w-64 glass rounded-2xl p-6 m-4 mr-2 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">StatusPing</h1>
            <p className="text-white/70 text-sm mt-1">Monitoring Dashboard</p>
          </div>

          <nav className="space-y-3">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <div
                  key={item.name}
                  className={`px-4 py-2 cursor-pointer transition-all rounded-lg ${
                    isActive 
                      ? 'glass-button text-white' 
                      : 'text-white/70 hover:text-white hover:glass-button'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div className="glass rounded-lg p-3 mb-3">
              <p className="text-white/70 text-sm">Signed in as:</p>
              <p className="text-white text-sm font-medium truncate">{user?.email}</p>
              <p className="text-white/60 text-xs mt-1 capitalize">{profile?.role}</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full glass border-white/20 text-white hover:bg-white/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 pl-2">
          {children}
        </div>
      </div>
    </div>
  );
}