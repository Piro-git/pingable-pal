import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="relative py-40 overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-br from-gray-200/30 via-gray-100/20 to-gray-300/20 blur-3xl" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-7xl font-black text-gray-900 mb-16 tracking-tight leading-tight">
            Ready for workflow
            <br />
            <span className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] bg-clip-text text-transparent">
              peace of mind?
            </span>
          </h2>
          <Link to="/register">
            <Button className="bg-[#14B8A6] hover:bg-[#0D9488] text-white h-16 px-12 text-xl font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all mb-6">
              Start Monitoring Free <ArrowRight className="ml-2" />
            </Button>
          </Link>
          <p className="text-base text-gray-500">
            Monitor 3 workflows forever · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
};
