import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Shield, Zap, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="glass rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already on the list!",
            description: "This email is already registered for early access.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome to the waitlist!",
          description: "We'll notify you when we launch.",
        });
        setEmail('');
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">StatusPing</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Simple, Reliable, Powerful</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 tracking-tight animate-fade-in">
            Monitor Everything.<br />
            <span className="text-primary">Worry About Nothing.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Enterprise-grade uptime monitoring with heartbeat URLs. Know instantly when your services go down.
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto mb-8 animate-fade-in">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass text-base h-12"
                required
              />
              <Button type="submit" disabled={isSubmitting} className="h-12 px-8 whitespace-nowrap">
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground animate-fade-in">
            Join 10,000+ developers monitoring their services
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Lightning Fast</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant notifications the moment your service goes down. No delays, no missed alerts.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Rock Solid</h3>
              <p className="text-muted-foreground leading-relaxed">
                99.99% uptime guarantee. We monitor the monitors so you don't have to worry.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Set & Forget</h3>
              <p className="text-muted-foreground leading-relaxed">
                Simple heartbeat URLs. Ping once, we handle the rest. No complex configuration needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
            How It Works
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-lg">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Create a Check</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Get a unique heartbeat URL in seconds. No credit card required.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-lg">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Ping Regularly</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Add a simple HTTP request to your cron job, script, or service.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-lg">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Relax</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  We'll alert you via email if we don't hear from your service on time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
            Why Developers Love Us
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Zero configuration required',
              'Custom check intervals',
              'Grace period support',
              'Instant email alerts',
              'Beautiful dashboard',
              'Team collaboration',
              'Detailed check history',
              'Color-coded organization'
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <span className="text-lg text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center border border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers monitoring their services with StatusPing
          </p>
          
          <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto mb-6">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass text-base h-12"
                required
              />
              <Button type="submit" disabled={isSubmitting} className="h-12 px-8 whitespace-nowrap">
                Get Early Access <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
          
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">© 2025 StatusPing. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
