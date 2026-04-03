import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AboutPage = () => (
  <div className="p-4 md:p-8 max-w-4xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-6">
      <ArrowLeft size={20} /> Back to Home
    </Link>
    <h1 className="text-3xl md:text-4xl font-black mb-6">About EcoRoute</h1>
    <p className="text-base md:text-lg text-gray-700 mb-4">
      EcoRoute is a real-time research project by Batch 9: Pranav, Asmitha, Imthiaz, and Mahesh.
      We aim to provide the most eco-friendly routes to reduce carbon emissions.
    </p>
  </div>
);
