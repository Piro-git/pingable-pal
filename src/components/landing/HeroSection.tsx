import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 overflow-hidden">
      {/* Elegant Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100/30 via-white to-gray-100/30" />
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-gradient-to-br from-gray-200/40 to-transparent blur-3xl" />
      <div className="absolute bottom-40 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-gray-300/30 to-transparent blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-5xl relative z-10"
      >
        <h1 className="text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          Never Miss a Broken
          <br />
          <span className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] bg-clip-text text-transparent">
            Workflow Again
          </span>
        </h1>
        <p className="text-2xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
          Monitor your N8N, Make, and Zapier workflows with intelligent alerts—no alert fatigue.
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <Link to="/register">
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white h-14 px-10 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              Start Monitoring Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" className="h-14 px-10 text-base font-semibold rounded-xl border-2 border-gray-200 hover:border-[#14B8A6] hover:text-[#14B8A6] hover:bg-gray-50 transition-all">
            <Play className="mr-2 h-5 w-5" /> Watch Demo
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mb-24">
          Monitor 3 workflows forever · No credit card required
        </p>

        {/* Dashboard Preview with Premium 3D Effect */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="relative"
          style={{ perspective: "1500px" }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/50" 
               style={{ transform: "rotateX(4deg) rotateY(0deg)" }}>
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#14B8A6]/10 to-transparent pointer-events-none" />
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/40 to-transparent rounded-2xl pointer-events-none" />
            
            <img 
              src={dashboardPreview} 
              alt="FlowZen Dashboard" 
              className="w-full h-auto"
            />
            
            {/* Glass Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          </div>
          
          {/* Floating Glass Accent */}
          <div className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full bg-gradient-to-br from-gray-200/30 to-transparent backdrop-blur-3xl border border-white/20 -z-10" style={{ filter: 'blur(20px)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
};
