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
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-[calc(100vw-3rem)] sm:w-80 h-[60vh] sm:h-96 max-h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
          <div className="bg-emerald-600 text-white p-4 flex justify-between items-center shrink-0">
            <span className="font-bold">Vihari Assistant</span>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-900 self-end rounded-br-sm' : 'bg-gray-100 text-gray-800 self-start rounded-bl-sm'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2 shrink-0 bg-gray-50">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 p-3 border-transparent focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl bg-white text-sm outline-none transition-all" 
              placeholder="Ask Vihari..." 
            />
            <button onClick={handleSend} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors"><Send size={18} /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
