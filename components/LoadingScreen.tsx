
import React from 'react';
import { LucideLoader2, LucideFileText } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
        <div className="relative w-24 h-24 bg-stone-800 rounded-3xl flex items-center justify-center shadow-2xl border border-stone-700">
          <LucideFileText size={40} className="text-indigo-400" />
          <div className="absolute -bottom-1 -right-1 bg-indigo-500 p-1.5 rounded-lg text-white">
            <LucideLoader2 size={16} className="animate-spin" />
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Preparing your book</h2>
      <p className="text-stone-400 max-w-xs leading-relaxed">
        We're currently rendering each page and optimizing paper textures for a realistic experience.
      </p>
      
      <div className="mt-8 w-48 h-1 bg-stone-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
