import { motion } from "framer-motion";

const testimonials = [
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
];

export const TestimonialsSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50/50" />
      <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-gray-100/40 to-gray-200/20 blur-3xl" />
      <div className="absolute bottom-40 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-gray-200/30 to-gray-100/30 blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h2 className="text-5xl font-black text-gray-900 text-center mb-20 tracking-tight">
          Don't take our word for it
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.8 }}
              className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500"
            >
              <p className="text-xl italic text-gray-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <p className="text-base font-bold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-gray-500">{testimonial.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
