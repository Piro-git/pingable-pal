import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Shield, Zap, Clock, CheckCircle2, ArrowRight, Lock, Users, Code, Briefcase, Target } from 'lucide-react';

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
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 tracking-tight animate-fade-in">
            Monitor Everything.<br />
            <span className="text-primary">Worry About Nothing.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Stop worrying about silent failures and messy prompts. Get instant alerts and a single source of truth for your entire automation stack.
          </p>

          {/* CTA Button */}
          <div className="mb-8 animate-fade-in">
            <Link to="/register">
              <Button size="lg" className="h-14 px-10 text-base">
                Start Your Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="animate-fade-in">
            <p className="text-sm text-muted-foreground mb-4">Works with:</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="glass rounded-lg px-6 py-3 text-foreground font-semibold text-sm border border-border/40">n8n</div>
              <div className="glass rounded-lg px-6 py-3 text-foreground font-semibold text-sm border border-border/40">Make</div>
              <div className="glass rounded-lg px-6 py-3 text-foreground font-semibold text-sm border border-border/40">Zapier</div>
              <div className="glass rounded-lg px-6 py-3 text-foreground font-semibold text-sm border border-border/40">Voiceflow</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
            Your Complete Automation Safety Net
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Bulletproof Reliability</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant alerts the moment a critical workflow or cron job goes silent. We're your 24/7 digital watchdog, so you never have to worry about costly, silent failures again.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Secure Prompt & Asset Vault</h3>
              <p className="text-muted-foreground leading-relaxed">
                Centralize, version, and control every prompt your team uses. Eliminate the chaos and reduce the risk of outdated or incorrect AI instructions. Your single source of truth for AI quality and consistency.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Centralized Control for Teams</h3>
              <p className="text-muted-foreground leading-relaxed">
                Manage all client monitors and prompt libraries from one secure dashboard. Granular permissions (Admin, Editor, Viewer) ensure the right people have the right access, reducing errors and stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
            Get Peace of Mind in 3 Simple Steps
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-lg">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">Create a Check</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Get a unique heartbeat URL in seconds. No complex configuration required.
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
                  Add a simple HTTP request to the end of your cron job, script, or service.
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
                  We'll alert you via email the moment we don't hear from your service on time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
            Built for the Modern Automation Workflow
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">For Automation Agencies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Manage all your clients' monitors and prompt libraries in one secure place. Offer your clients true peace of mind with added reliability and transparency.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">For Marketing & Ops Teams</h3>
              <p className="text-muted-foreground leading-relaxed">
                Focus on your campaigns, not your code. We'll ensure your internal lead-gen and reporting automations never fail, so you don't have to.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 border border-border/40">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">For Solo Developers & Freelancers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ship your projects with confidence. Stay in control of your cronjobs and personal projects without the late-night stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center border border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Automate with Confidence?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers monitoring their services with StatusPing.
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
                {isSubmitting ? 'Joining...' : 'Sign Up for Free'} <ArrowRight className="w-4 h-4 ml-2" />
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
