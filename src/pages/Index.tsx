import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  Check, 
  ArrowRight, 
  Play,
  AlertCircle,
  Clock,
  DollarSign,
  Zap,
  Bell,
  Shield
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Index = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navBackground, setNavBackground] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/dashboard";
    }
  }, [user, loading]);

  useEffect(() => {
    const handleScroll = () => {
      setNavBackground(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert([{ email }]);
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "You've been added to the waitlist.",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#14B8A6] z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          navBackground
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-[#14B8A6] tracking-tight">
            FlowZen
          </div>
          <div className="flex items-center gap-8">
            <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#14B8A6] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-[#14B8A6] transition-colors">
              Docs
            </a>
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-[#14B8A6] transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-lg px-6">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-5xl"
        >
          <h1 className="text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
            Never Miss a Broken
            <br />
            Workflow Again
          </h1>
          <p className="text-2xl text-gray-700 opacity-60 mb-16 max-w-3xl mx-auto">
            Monitor your N8N, Make, and Zapier workflows with intelligent alerts—no alert fatigue.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link to="/register">
              <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white h-12 px-8 text-base font-semibold rounded-lg hover:scale-105 transition-transform">
                Start Monitoring Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" className="h-12 px-8 text-base font-semibold rounded-lg border-2 border-gray-300 hover:border-[#14B8A6] hover:text-[#14B8A6] transition-all">
              <Play className="mr-2 h-4 w-4" /> Watch 2-Min Demo
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mb-24">
            Monitor 3 workflows forever · No credit card required
          </p>

          {/* Real Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
            style={{ perspective: "1500px" }}
          >
            <div
              className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/50"
              style={{ 
                transform: "rotateX(4deg) rotateY(0deg)",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Subtle gradient overlay for premium effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none z-10" />
              
              {/* Dashboard Screenshot */}
              <img 
                src={dashboardPreview} 
                alt="FlowZen Dashboard - Real-time workflow monitoring interface"
                className="w-full h-auto"
              />
              
              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] pointer-events-none" />
            </div>
            
            {/* Ambient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#14B8A6]/10 via-transparent to-transparent blur-3xl -z-10 scale-110" />
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[2px] text-gray-400 mb-8">
            Join 500+ automation users who sleep better
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold text-gray-900 text-center leading-tight mb-24"
          >
            You built automations
            <br />
            to save time.
            <br />
            <br />
            Now you waste 10 hours
            <br />
            a week checking if
            <br />
            they still work.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "😰", title: "Silent Failures", desc: "Workflows break without you knowing" },
              { icon: "⏰", title: "Manual Checking", desc: "5-10 hours per week manually checking" },
              { icon: "💸", title: "Revenue at Risk", desc: "One broken automation = lost customers" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-gray-300 rounded-2xl p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="text-5xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Features */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center"
            >
              <p className="text-gray-500">Workflow Intelligence Animation</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Workflow Intelligence</h3>
              <p className="text-lg text-gray-600 opacity-70 mb-6 leading-relaxed">
                We understand N8N nodes, Make modules, and Zapier steps—not just generic HTTP pings.
              </p>
              <p className="text-base italic text-[#14B8A6]">
                Datadog monitors servers. FlowZen monitors workflows.
              </p>
            </motion.div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Smart Alerts</h3>
              <p className="text-lg text-gray-600 opacity-70 leading-relaxed">
                Know which step failed and why. No cryptic error codes. No alert fatigue.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center order-1 md:order-2"
            >
              <p className="text-gray-500">Smart Alerts Screenshot</p>
            </motion.div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center"
            >
              <p className="text-gray-500">5-Minute Setup Flow</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">5-Minute Setup</h3>
              <p className="text-lg text-gray-600 opacity-70 leading-relaxed">
                Paste a webhook URL. Done. No agents, no config files, no complexity.
              </p>
            </motion.div>
          </div>

          {/* Feature 4 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Zero Alert Fatigue</h3>
              <p className="text-lg text-gray-600 opacity-70 leading-relaxed">
                Only alert when action is needed. No noise. No false positives. Sleep soundly.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center order-1 md:order-2"
            >
              <p className="text-gray-500">Zero Alert Fatigue Comparison</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-gray-900 text-center mb-24"
          >
            Get started in 5 minutes
          </motion.h2>

          <div className="flex items-center justify-center gap-8 mb-20">
            {[
              { num: "1", title: "Sign up free", desc: "No credit card required" },
              { num: "2", title: "Paste webhook", desc: "From your N8N/Make workflow" },
              { num: "3", title: "Get alerts", desc: "Slack, email, or webhook" }
            ].map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: index * 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-32 h-32 rounded-full border-2 border-[#14B8A6] bg-white flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-[#14B8A6]">{step.num}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">{step.title}</p>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </motion.div>
                {index < 2 && (
                  <ArrowRight className="mx-8 text-gray-300 h-8 w-8" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/register">
              <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white h-14 px-12 text-lg font-semibold rounded-lg hover:scale-105 transition-transform">
                Start Your Free Trial <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-20">
            Don't take our word for it
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "FlowZen gave me back my evenings. I was checking workflows before bed every night. Now I just sleep.",
                name: "Sarah K.",
                role: "Automation Consultant, 50+ client workflows"
              },
              {
                quote: "The plain English alerts are a game changer. No more decoding cryptic error messages at 2am.",
                name: "Marcus T.",
                role: "Operations Manager, E-commerce"
              },
              {
                quote: "We switched from Datadog. FlowZen costs 1/20th the price and actually understands our workflows.",
                name: "Jennifer L.",
                role: "SaaS Founder, 100+ automations"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8"
              >
                <p className="text-xl italic text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-base font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-gray-900 text-center mb-24">
            Simple, honest pricing
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-300 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h3>
              <p className="text-5xl font-bold text-gray-900 mb-8">$0<span className="text-lg font-normal text-gray-500">/month</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">3 workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Daily checks</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Email alerts</span>
                </li>
              </ul>
              <Link to="/register">
                <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-[#14B8A6]">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            {/* Zen Flow - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white border-2 border-[#14B8A6] rounded-2xl p-8 relative shadow-xl hover:scale-105 transition-transform"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#14B8A6] text-white px-6 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Zen Flow</h3>
              <p className="text-5xl font-bold text-gray-900 mb-8">$29<span className="text-lg font-normal text-gray-500">/month</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">25 workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Real-time monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Slack + webhooks</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">ZenScore</span>
                </li>
              </ul>
              <Link to="/register">
                <Button className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white">
                  Try Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Zen Master */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-300 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Zen Master</h3>
              <p className="text-5xl font-bold text-gray-900 mb-8">$99<span className="text-lg font-normal text-gray-500">/month</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">100 workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">White-label</span>
                </li>
              </ul>
              <Link to="/register">
                <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-[#14B8A6]">
                  Contact Sales
                </Button>
              </Link>
            </motion.div>
          </div>

          <p className="text-sm text-gray-500 text-center">
            All plans include: 14-day trial · No credit card required
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-20">
            Questions?
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "How is FlowZen different from Datadog?",
                a: "Datadog monitors infrastructure (servers, APIs, databases). FlowZen monitors workflows (N8N nodes, Make modules, Zapier steps). We tell you WHICH step in WHICH workflow failed, not just 'HTTP 500 error'. Plus, we're $29/month vs Datadog's $500+/month."
              },
              {
                q: "Can I monitor Make/Zapier, not just N8N?",
                a: "Yes! FlowZen monitors N8N, Make.com, and Zapier workflows. Any platform that can send HTTP requests works with FlowZen."
              },
              {
                q: "What happens when my free trial ends?",
                a: "Your account automatically downgrades to our Free tier (3 workflows monitored forever). No surprise charges. Upgrade anytime."
              },
              {
                q: "How quickly will I know if a workflow breaks?",
                a: "Real-time monitoring checks every 60 seconds on paid plans. You'll get alerts within 1-2 minutes of a failure."
              },
              {
                q: "Can I white-label FlowZen for my clients?",
                a: "Yes, on the Zen Master plan ($99/month). Send alerts from your domain, customize branding, manage multiple client accounts."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, full refund within 30 days if FlowZen doesn't bring you workflow peace of mind."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-bold text-gray-900 mb-16">
              Ready for workflow peace of mind?
            </h2>
            <Link to="/register">
              <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white h-16 px-12 text-xl font-semibold rounded-lg hover:scale-105 transition-transform mb-6">
                Start Monitoring Free <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <p className="text-base text-gray-500">
              Monitor 3 workflows forever · No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-2xl font-bold text-[#14B8A6] mb-4">FlowZen</div>
              <p className="text-sm text-gray-500">hello@getflowzen.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#pricing" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Docs</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Changelog</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Status Page</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-[#14B8A6] transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 text-center">© 2025 FlowZen</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
