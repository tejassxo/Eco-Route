import React from 'react';
import { motion } from 'motion/react';

export const ContactUsPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-4xl mx-auto">
    <h1 className="text-4xl font-black mb-6">Contact Us</h1>
    <p className="text-lg text-gray-700">Reach out to the team at Batch 9.</p>
  </motion.div>
);
