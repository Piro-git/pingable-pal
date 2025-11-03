import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free Forever",
    price: "$0",
    features: [
      "3 workflows",
      "Daily checks",
      "Email alerts"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Zen Flow",
    price: "$29",
    features: [
      "25 workflows",
      "Real-time monitoring",
      "Slack + webhooks",
      "ZenScore"
    ],
    cta: "Try Free",
    popular: true
  },
  {
    name: "Zen Master",
    price: "$99",
    features: [
      "100 workflows",
      "API access",
      "Priority support",
      "White-label"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="relative py-40 overflow-hidden">
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
      <div className="absolute -top-20 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#14B8A6]/8 to-transparent blur-3xl" />
      <div className="absolute -bottom-20 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-white/30 to-[#0D9488]/5 blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h2 className="text-6xl font-black text-gray-900 text-center mb-24 tracking-tight">
          Simple, honest pricing
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className={`relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 transition-all duration-500 ${
                plan.popular 
                  ? "border-2 border-[#14B8A6] shadow-xl hover:shadow-2xl scale-105" 
                  : "border border-gray-200/50 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                  POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-5xl font-black text-gray-900 mb-8">
                {plan.price}
                <span className="text-lg font-normal text-gray-500">/month</span>
              </p>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                {plan.popular ? (
                  <Button className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-lg hover:shadow-xl transition-all">
                    {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-2 border-gray-200 hover:border-[#14B8A6] hover:bg-gray-50 transition-all">
                    {plan.cta}
                  </Button>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center">
          All plans include: 14-day trial · No credit card required
        </p>
      </div>
    </section>
  );
};
