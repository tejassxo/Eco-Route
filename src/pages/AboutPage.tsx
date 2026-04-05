import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Map, History, Bot } from 'lucide-react';
import { motion } from 'motion/react';

export const AboutPage = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 md:p-8 max-w-4xl mx-auto text-gray-900"
  >
    <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-8">
      <ArrowLeft size={20} /> Back to Home
    </Link>
    
    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">About EcoRoute</h1>
    
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Leaf className="text-emerald-500" /> Vision
      </h2>
      <p className="text-lg text-gray-700 leading-relaxed">
        EcoRoute is a real-time research project developed by Batch 9. Our mission is to minimize the global carbon footprint by empowering users to make environmentally conscious travel decisions. We believe that every journey, when optimized for efficiency, contributes to a greener, more sustainable planet.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Core Features</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Bot, title: "AI Routing", desc: "Gemini-powered path optimization." },
          { icon: Map, title: "Interactive Maps", desc: "Real-time route visualization." },
          { icon: History, title: "Journey History", desc: "Track your eco-impact over time." }
        ].map((feature, i) => (
          <div key={i} className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
            <feature.icon className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-6">Tech Stack</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 font-bold text-gray-700">Technology</th>
              <th className="py-3 px-4 font-bold text-gray-700">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tech: "React 19", purpose: "Frontend UI" },
              { tech: "Node.js / Express", purpose: "Backend API" },
              { tech: "Firebase", purpose: "Auth & Database" },
              { tech: "Gemini API", purpose: "AI Intelligence" }
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-emerald-700 font-medium">{row.tech}</td>
                <td className="py-3 px-4 text-gray-600">{row.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </motion.div>
);
