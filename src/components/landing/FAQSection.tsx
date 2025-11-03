import { motion } from "framer-motion";

const faqs = [
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
];

export const FAQSection = () => {
  return (
    <section id="faq" className="relative py-40 overflow-hidden">
      {/* Calm Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50/50" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-gray-200/35 to-gray-100/20 blur-3xl" />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-gray-100/30 to-gray-200/25 blur-3xl" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <h2 className="text-5xl font-black text-gray-900 text-center mb-20 tracking-tight">
          Questions?
        </h2>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.6 }}
              className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h3>
              <p className="text-gray-600 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
