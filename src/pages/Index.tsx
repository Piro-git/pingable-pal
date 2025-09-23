import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-12 text-center max-w-lg">
        <h1 className="text-4xl font-bold text-white mb-4">StatusPing</h1>
        <p className="text-white/70 text-lg mb-8">
          Monitor your services with simple heartbeat URLs
        </p>
        
        <div className="space-y-4">
          <Link to="/register">
            <Button className="w-full glass-button text-lg py-3">
              Get Started
            </Button>
          </Link>
          
          <Link to="/login">
            <Button variant="outline" className="w-full glass-button">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
