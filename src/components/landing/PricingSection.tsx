import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap } from "lucide-react";

const plans = [
  {
    name: "Free Forever",
    price: "$0",
    originalPrice: null,
    interval: "/month",
    saveBadge: null,
    features: [
      "3 workflows",
      "Daily checks",
      "Email alerts"
    ],
    cta: "Get Started",
    popular: false,
    highlight: false
  },
  {
    name: "Pro",
    price: "$19",
    originalPrice: null,
    interval: "/month",
    saveBadge: null,
    features: [
      "Unlimited workflows",
      "Real-time monitoring",
      "Slack + webhooks",
      "Priority support"
    ],
    cta: "Start Free Trial",
    popular: true,
    highlight: false
  },
  {
    name: "Lifetime",
    price: "$199",
    originalPrice: "$499",
    interval: "one-time",
    saveBadge: "SAVE 60%",
    badge: "🔥 BLACK FRIDAY",
    features: [
      "Everything in Pro",
      "Pay once, use forever",
      "All future updates",
      "Priority support"
    ],
    cta: "Get Lifetime Access",
    popular: false,
    highlight: true
  }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white" />
      <div className="absolute -top-20 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-gray-200/35 to-transparent blur-3xl" />
      <div className="absolute -bottom-20 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-gray-100/25 to-gray-200/15 blur-3xl" />
      
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
                  : plan.highlight
                  ? "border-2 border-amber-500/50 shadow-xl hover:shadow-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30"
                  : "border border-gray-200/50 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                  POPULAR
                </div>
              )}
              {plan.badge && (
                <div className="absolute -top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  BLACK FRIDAY
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  {plan.originalPrice && (
                    <span className="text-2xl font-normal text-gray-400 line-through">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className={`text-5xl font-black ${plan.highlight ? "text-amber-500" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className="text-lg font-normal text-gray-500">
                    {plan.interval === "one-time" ? "one-time" : plan.interval}
                  </span>
                </div>
                {plan.saveBadge && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      {plan.saveBadge}
                    </span>
                    <span className="text-sm text-gray-500">$300 off!</span>
                  </div>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-amber-500" : "text-[#14B8A6]"}`} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                {plan.popular ? (
                  <Button className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white shadow-lg hover:shadow-xl transition-all">
                    {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : plan.highlight ? (
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
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
