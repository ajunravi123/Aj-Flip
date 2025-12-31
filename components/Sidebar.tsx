
import React, { useState, useRef, useEffect } from 'react';
import { LucideX, LucideSend, LucideBot, LucideUser, LucideSparkles, LucideLoader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookContext: string;
  currentPageText: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, bookContext, currentPageText }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Call our backend proxy API - only send essential data
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          bookContext: bookContext,
          currentPageText: currentPageText
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      
      const aiMsg: ChatMessage = { role: 'assistant', content: aiContent };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMsg = error.message?.includes('API key') 
        ? "API key not configured on server. Please contact administrator."
        : "Error connecting to AI. Please check your connection.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-stone-900 border-l border-stone-800 z-[120] transition-transform duration-500 flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/50 relative z-[121]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <LucideBot size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Assistant</h2>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Powered by AjunsTech</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors"
          >
            <LucideX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
               <LucideSparkles size={40} className="text-indigo-500 mb-4 animate-pulse" />
               <h3 className="text-white font-medium mb-2">Ask anything about the book</h3>
               <p className="text-xs text-stone-400">"Summarize this page", "Explain the theme", or "Who are the characters?"</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-stone-700' : 'bg-indigo-600'}`}>
                {m.role === 'user' ? <LucideUser size={16} /> : <LucideBot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-stone-800 text-stone-200 rounded-tr-none' : 'bg-stone-800/50 text-stone-300 rounded-tl-none border border-stone-700'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <LucideLoader2 size={16} className="animate-spin" />
              </div>
              <div className="p-3 bg-stone-800/50 text-stone-300 rounded-2xl rounded-tl-none border border-stone-700">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-stone-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-stone-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-stone-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-950/50">
           <div className="relative">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask assistant..."
               className="w-full bg-stone-800 border border-stone-700 rounded-xl py-3 pl-4 pr-12 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
             />
             <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <LucideSend size={18} />
             </button>
           </div>
           <p className="mt-3 text-[10px] text-stone-600 text-center">AI generated responses can be inaccurate. Always verify facts.</p>
        </div>
      </aside>
    </>
  );
};
