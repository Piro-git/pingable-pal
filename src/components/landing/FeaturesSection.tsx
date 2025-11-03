import { motion } from "framer-motion";

const features = [
  {
    title: "Workflow Intelligence",
    description: "We understand N8N nodes, Make modules, and Zapier steps—not just generic HTTP pings.",
    tagline: "Datadog monitors servers. FlowZen monitors workflows.",
    imagePosition: "left"
  },
  {
    title: "Smart Alerts",
    description: "Know which step failed and why. No cryptic error codes. No alert fatigue.",
    tagline: "Clear, actionable insights every time.",
    imagePosition: "right"
  },
  {
    title: "5-Minute Setup",
    description: "Paste a webhook URL. Done. No agents, no config files, no complexity.",
    tagline: "From zero to monitored in minutes.",
    imagePosition: "left"
  },
  {
    title: "Zero Alert Fatigue",
    description: "Only alert when action is needed. No noise. No false positives. Sleep soundly.",
    tagline: "Peace of mind, guaranteed.",
    imagePosition: "right"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="relative py-40 overflow-hidden">
      {/* Elegant Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white" />
      <div className="absolute top-40 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-gray-200/40 to-transparent blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-gray-100/30 to-gray-200/20 blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 space-y-32 relative z-10">
        {features.map((feature, index) => (
          <div key={index} className={`grid md:grid-cols-2 gap-16 items-center ${feature.imagePosition === "right" ? "md:flex-row-reverse" : ""}`}>
            <motion.div
              initial={{ opacity: 0, x: feature.imagePosition === "left" ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className={`${feature.imagePosition === "right" ? "order-2 md:order-1" : ""}`}
            >
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl h-96 flex items-center justify-center border border-gray-200/50 shadow-lg">
                <p className="text-gray-400 font-medium">{feature.title} Visual</p>
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
        ))}
      </div>
    </section>
  );
};
