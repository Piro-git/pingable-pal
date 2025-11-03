import { motion } from "framer-motion";

const problems = [
  {
    icon: "😰",
    title: "Silent Failures",
    desc: "Workflows break without you knowing"
  },
  {
    icon: "⏰",
    title: "Manual Checking",
    desc: "5-10 hours per week manually checking"
  },
  {
    icon: "💸",
    title: "Revenue at Risk",
    desc: "One broken automation = lost customers"
  }
];

export const ProblemSection = () => {
  return (
    <section className="relative py-40 overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="relative max-w-5xl mx-auto mb-32">
          {/* Ambient Glass Bubbles */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#14B8A6]/15 to-[#0D9488]/5 backdrop-blur-3xl border border-white/20 -z-10"
            style={{ filter: 'blur(25px)' }}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#14B8A6]/10 to-transparent backdrop-blur-3xl border border-white/10 -z-10"
            style={{ filter: 'blur(30px)' }}
          />
          
          {/* Premium Heading Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative bg-white/50 backdrop-blur-xl rounded-3xl p-16 border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]"
          >
            <h2 className="text-6xl font-black text-center leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                You built automations
                <br />
                to save time.
              </span>
              <br />
              <br />
              <span className="bg-gradient-to-r from-[#14B8A6] via-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent">
                Now you waste 10 hours
                <br />
                a week checking if
                <br />
                they still work.
              </span>
            </h2>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-10 hover:shadow-[0_8px_32px_0_rgba(20,184,166,0.12)] hover:-translate-y-1 transition-all duration-500 shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]"
            >
              <div className="text-5xl mb-6">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
