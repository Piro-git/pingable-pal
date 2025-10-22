import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Archive, BarChart3, Users, Settings, LogOut, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, role, signOut } = useAuth();
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
      name: 'Monitoring Checks',
      icon: Activity,
      path: '/monitoring',
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
    role && item.roles.includes(role)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[calc(100vh)] flex">
        {/* Persistent Left Sidebar */}
        <div className="w-64 bg-card border-r border-border p-6 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary tracking-tight">FlowZen</h1>
            <p className="text-muted-foreground text-sm mt-1">Workflow Peace of Mind</p>
          </div>

          <nav className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <div
                  key={item.name}
                  className={`px-4 py-3 cursor-pointer transition-all duration-200 rounded-xl ${
                    isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div className="bg-muted rounded-xl p-4 mb-3">
              <p className="text-muted-foreground text-xs">Signed in as:</p>
              <p className="text-foreground text-sm font-medium truncate mt-1">{user?.email}</p>
              <p className="text-muted-foreground text-xs mt-1 capitalize">{role}</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}