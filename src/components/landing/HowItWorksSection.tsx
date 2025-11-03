import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: "1",
    title: "Sign up free",
    desc: "No credit card required"
  },
  {
    num: "2",
    title: "Paste webhook",
    desc: "From your N8N/Make workflow"
  },
  {
    num: "3",
    title: "Get alerts",
    desc: "Slack, email, or webhook"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="relative py-40 overflow-hidden">
      {/* Soft Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#14B8A6]/8 to-transparent blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-black text-gray-900 text-center mb-24 tracking-tight"
        >
          Get started in 5 minutes
        </motion.h2>

        <div className="flex items-center justify-center gap-12 mb-20 flex-wrap">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: index * 0.2, duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="w-32 h-32 rounded-full border-2 border-[#14B8A6] bg-white flex items-center justify-center mb-4 shadow-lg hover:shadow-xl transition-shadow">
                  <span className="text-4xl font-black text-[#14B8A6]">{step.num}</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">{step.title}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </motion.div>
              {index < steps.length - 1 && (
                <ArrowRight className="mx-8 text-gray-300 h-8 w-8 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white h-14 px-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              Start Your Free Trial <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
