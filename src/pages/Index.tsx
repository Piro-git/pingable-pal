import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Shield, Zap, Clock, CheckCircle2, ArrowRight, Lock, Users, Code, Briefcase, Target } from 'lucide-react';
import flowzenLogo from '@/assets/flowzen-logo.png';

const Index = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 border-b border-border/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={flowzenLogo} alt="FlowZen" className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight animate-fade-in leading-[1.1]">
            The most reliable<br />
            uptime monitoring
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Get 10 monitors, 10 heartbeats and a status page<br className="hidden md:block" />
            with 3-minute checks totally free.
          </p>

          {/* CTA Section */}
          <div className="mb-16 animate-fade-in max-w-2xl mx-auto">
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Input
                type="email"
                placeholder="Your work e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input h-12 px-4 max-w-xs w-full text-base bg-white/[0.03] border-white/10 text-white placeholder:text-white/40"
                required
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                size="lg" 
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium whitespace-nowrap"
              >
                {isSubmitting ? 'Starting...' : 'Get started in 30 seconds'}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-4">
              Looking for an enterprise solution? <span className="text-white/90 hover:text-white cursor-pointer underline decoration-white/30 hover:decoration-white/60 transition-colors">Book a demo</span>
            </p>
          </div>

          {/* Product Preview */}
          <div className="max-w-5xl mx-auto">
            <div className="glass rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="glass-deep rounded-xl p-6 md:p-8 min-h-[400px] flex flex-col">
                {/* Mock Dashboard Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-white/80">Uptime</span>
                  </div>
                </div>

                {/* Mock Monitor Status */}
                <div className="space-y-4">
                  <div className="glass rounded-lg p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="text-white font-medium">time.com/status</span>
                      </div>
                      <span className="text-xs text-success">Up - Checked every 30 seconds</span>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>🚨 Send a test alert</span>
                      <span>📊 Incidents</span>
                      <span>⏸️ Pause this monitor</span>
                      <span>⚙️ Configure</span>
                    </div>
                  </div>

                  {/* Timeline Visualization */}
                  <div className="glass-deep rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">Monitor is up for</span>
                      <span className="text-xs text-muted-foreground">Last checked</span>
                    </div>
                    <div className="flex gap-1 h-8 items-center">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 h-full rounded-sm bg-success/30"
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">Incidents</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Best-in-class uptime monitoring.<br />
              No false positives.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get a screenshot of the error and a second-by-second<br className="hidden md:block" />
              timeline with our fastest 30-second checks.
            </p>
          </div>

          <div className="glass rounded-3xl p-8 md:p-12 border border-white/10 mb-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-4">Screenshots & error logs</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  We record your API's error message and take a screenshot of your website being down so that you know exactly what happened.
                </p>
              </div>
              <div className="glass-deep rounded-2xl p-8 min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  </div>
                  <p className="text-muted-foreground">Error visualization preview</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 border border-white/10">
              <Shield className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">99.99% uptime SLA</h3>
              <p className="text-muted-foreground leading-relaxed">
                Enterprise-grade reliability you can count on.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 border border-white/10">
              <Clock className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">30-second checks</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detect issues before your users do.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 border border-white/10">
              <Zap className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">Instant alerts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get notified via email, SMS, or Slack immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Feature */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              A lot more than uptime monitoring.<br />
              Batteries included.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get all the debug data you need and collaborate with your<br className="hidden md:block" />
              colleagues on fixing the root cause of the incident.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-semibold text-foreground mb-4">Flexible incident escalations</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Configure complex rules for escalating incidents based on time, team availability, and incident origin.
              </p>
              <div className="space-y-3">
                <div className="glass-deep rounded-lg p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">Technical support team</span>
                </div>
                <div className="glass-deep rounded-lg p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">Engineering leadership</span>
                </div>
                <div className="glass-deep rounded-lg p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">All hands on deck</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-semibold text-foreground mb-4">Status pages</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Keep your users informed with beautiful, customizable status pages that match your brand.
              </p>
              <div className="glass-deep rounded-xl p-6 min-h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="text-foreground font-medium">All systems operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is It For - Removed to match Better Stack minimalist design */}

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Start monitoring in 30 seconds
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of developers monitoring their services with FlowZen.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                Get started free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-12 px-8 glass-button-secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-8 mb-8">
            <a href="https://www.superlaun.ch/products/934" target="_blank" rel="noopener">
              <img src="https://www.superlaun.ch/badge.png" alt="Featured on Super Launch" width="200" height="200" className="opacity-80 hover:opacity-100 transition-opacity" />
            </a>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={flowzenLogo} alt="FlowZen" className="h-6 w-auto" />
              <span className="text-sm text-muted-foreground">© 2025 FlowZen. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
