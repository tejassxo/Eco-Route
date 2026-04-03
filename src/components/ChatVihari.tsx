import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';

export const ChatVihari = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Hi! I am Vihari, your EcoRoute assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: { systemInstruction: 'You are Vihari, a helpful assistant for the EcoRoute application. You help users with eco-friendly travel tips and information about the app.' }
      });
      setMessages(prev => [...prev, { role: 'assistant', text: response.text || 'Sorry, I could not understand that.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error connecting to Vihari.' }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700">
          <MessageCircle />
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
          <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
            <span className="font-bold">Vihari Assistant</span>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-emerald-100 self-end' : 'bg-gray-100 self-start'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-2 border rounded-lg" placeholder="Ask Vihari..." />
            <button onClick={handleSend} className="bg-emerald-600 text-white p-2 rounded-lg"><Send size={18} /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
