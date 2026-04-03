import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const ContactUsPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-8 max-w-4xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-6">
      <ArrowLeft size={20} /> Back to Home
    </Link>
    <h1 className="text-3xl md:text-4xl font-black mb-6">Contact Us</h1>
    <p className="text-base md:text-lg text-gray-700">Reach out to the team at Batch 9.</p>
  </motion.div>
);
