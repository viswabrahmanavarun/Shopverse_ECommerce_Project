import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/support/chat', {
        message: userMessage,
        history: Array.isArray(history) ? history : []
      });
      if (data && Array.isArray(data.history)) {
        setHistory(data.history);
      } else if (data && data.reply) {
        // Fallback if history is missing but reply is there
        setHistory(prev => [
          ...prev,
          { role: 'user', parts: [userMessage] },
          { role: 'model', parts: [data.reply] }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[380px] h-[550px] bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden shadow-brand/20"
          >
            {/* Header */}
            <div className="p-6 bg-brand text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-lg">Shopverse AI</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Online & Ready</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {(!Array.isArray(history) || history.length === 0) && (
                <div className="text-center py-10 space-y-4">
                   <div className="w-16 h-16 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto text-brand">
                      <Bot size={32} />
                   </div>
                   <div>
                     <p className="font-black text-gray-900">Welcome to Shopverse!</p>
                     <p className="text-sm text-gray-500 font-medium">How can I assist you today?</p>
                   </div>
                   <div className="flex flex-wrap gap-2 justify-center">
                      {['Track Order', 'Latest Coupons', 'Compare Phones'].map(q => (
                        <button key={q} type="button" onClick={() => setMessage(q)} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:border-brand hover:text-brand transition-all shadow-sm">
                          {q}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {Array.isArray(history) && history.map((msg, i) => {
                if (!msg || !msg.parts) return null;
                return (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-brand text-white' : 'bg-white border border-gray-100 text-brand shadow-sm'}`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-brand text-white rounded-tr-none shadow-lg shadow-brand/10' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                      }`}>
                        {typeof msg.parts[0] === 'string' ? msg.parts[0] : (msg.parts[0]?.text || '...')}
                      </div>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                   <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 text-brand shadow-sm flex items-center justify-center">
                        <Loader2 size={14} className="animate-spin" />
                      </div>
                      <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none flex gap-1">
                         <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                         <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                         <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 bg-white border-t flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={!message.trim() || loading}
                className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand/20"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand text-white rounded-3xl shadow-2xl flex items-center justify-center hover:rotate-12 transition-all relative overflow-hidden group shadow-brand/40"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
}
