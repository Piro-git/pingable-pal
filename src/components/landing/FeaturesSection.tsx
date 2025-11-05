import { motion } from "framer-motion";
import { Network, Bell, Zap, Shield, Activity, CheckCircle2 } from "lucide-react";

const features = [
  {
    title: "Workflow Intelligence",
    description: "We understand N8N nodes, Make modules, and Zapier steps—not just generic HTTP pings.",
    tagline: "Datadog monitors servers. FlowZen monitors workflows.",
    imagePosition: "left",
    icon: Network,
    visual: "workflow"
  },
  {
    title: "Smart Alerts",
    description: "Know which step failed and why. No cryptic error codes. No alert fatigue.",
    tagline: "Clear, actionable insights every time.",
    imagePosition: "right",
    icon: Bell,
    visual: "alerts"
  },
  {
    title: "5-Minute Setup",
    description: "Paste a webhook URL. Done. No agents, no config files, no complexity.",
    tagline: "From zero to monitored in minutes.",
    imagePosition: "left",
    icon: Zap,
    visual: "setup"
  },
  {
    title: "Zero Alert Fatigue",
    description: "Only alert when action is needed. No noise. No false positives. Sleep soundly.",
    tagline: "Peace of mind, guaranteed.",
    imagePosition: "right",
    icon: Shield,
    visual: "peace"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Elegant Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white" />
      <div className="absolute top-40 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-gray-200/40 to-transparent blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-gray-100/30 to-gray-200/20 blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 space-y-24 relative z-10">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className={`grid md:grid-cols-2 gap-16 items-center ${feature.imagePosition === "right" ? "md:flex-row-reverse" : ""}`}>
              <motion.div
                initial={{ opacity: 0, x: feature.imagePosition === "left" ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`${feature.imagePosition === "right" ? "order-2 md:order-1" : ""}`}
              >
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl h-96 overflow-hidden border border-gray-700/50 shadow-2xl">
                  {/* Ambient glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#14B8A6]/20 via-transparent to-transparent" />
                  
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(#14B8A6 1px, transparent 1px), linear-gradient(90deg, #14B8A6 1px, transparent 1px)',
                      backgroundSize: '40px 40px'
                    }} />
                  </div>

                  {/* Content based on visual type */}
                  <div className="relative h-full flex items-center justify-center p-8">
                    {feature.visual === "workflow" && (
                      <div className="space-y-6 w-full">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center backdrop-blur-sm">
                            <Network className="w-8 h-8 text-[#14B8A6]" />
                          </div>
                          <div className="flex-1 h-1 bg-gradient-to-r from-[#14B8A6] to-transparent" />
                          <div className="w-12 h-12 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center backdrop-blur-sm">
                            <Activity className="w-6 h-6 text-[#14B8A6]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-12">
                          <div className="w-12 h-12 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center backdrop-blur-sm">
                            <Activity className="w-6 h-6 text-[#14B8A6]" />
                          </div>
                          <div className="flex-1 h-1 bg-gradient-to-r from-[#14B8A6] to-transparent" />
                          <div className="w-16 h-16 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center backdrop-blur-sm">
                            <CheckCircle2 className="w-8 h-8 text-[#14B8A6]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {feature.visual === "alerts" && (
                      <div className="space-y-4 w-full">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2, repeat: Infinity, repeatDelay: 2 }}
                            className="bg-gray-800/50 border border-[#14B8A6]/40 rounded-lg p-4 backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-3">
                              <Bell className="w-5 h-5 text-[#14B8A6]" />
                              <div className="flex-1 space-y-1">
                                <div className="h-2 bg-[#14B8A6]/30 rounded w-3/4" />
                                <div className="h-2 bg-[#14B8A6]/20 rounded w-1/2" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {feature.visual === "setup" && (
                      <div className="w-full space-y-6">
                        <div className="bg-gray-800/50 border border-[#14B8A6]/40 rounded-lg p-6 backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-6 h-6 text-[#14B8A6]" />
                            <div className="h-3 bg-[#14B8A6]/30 rounded w-32" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-[#14B8A6]/20 rounded w-full" />
                            <div className="h-2 bg-[#14B8A6]/20 rounded w-4/5" />
                          </div>
                        </div>
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
                          className="flex justify-center"
                        >
                          <div className="w-20 h-20 rounded-full bg-[#14B8A6]/20 border-2 border-[#14B8A6] flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-[#14B8A6]" />
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {feature.visual === "peace" && (
                      <div className="w-full flex flex-col items-center justify-center space-y-8">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="w-32 h-32 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center"
                        >
                          <div className="w-20 h-20 rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-[#14B8A6]" />
                          </div>
                        </motion.div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                              className="w-2 h-2 rounded-full bg-[#14B8A6]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: feature.imagePosition === "left" ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`${feature.imagePosition === "right" ? "order-1 md:order-2" : ""}`}
              >
                <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">{feature.title}</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <p className="text-base italic text-[#14B8A6] font-medium">
                  {feature.tagline}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
