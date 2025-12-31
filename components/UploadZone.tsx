
import React, { useRef, useState } from 'react';
import { LucideUpload, LucideFileText, LucideZap, LucideMousePointer2, LucideSparkles, LucideBookOpen, LucideVolume2, LucideBrain, LucideArrowRight } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      {/* Hero Section */}
      <div className="text-center mb-10 md:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <LucideSparkles size={12} className="animate-pulse" />
          <span>Next-Gen Reading Experience</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 text-white tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Turn PDFs into
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Living Books
          </span>
        </h1>
        
        <p className="text-base md:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Experience the future of digital reading with realistic 3D page flips, 
          immersive audio, and AI-powered insights. Your documents, reimagined.
        </p>

        {/* Upload Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative max-w-xl mx-auto mb-10 group cursor-pointer transition-all duration-500 ${
            isDragging ? 'scale-[1.02]' : ''
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf" 
            onChange={handleFileChange}
          />

          {/* Animated Background Gradient */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500 ${
            isDragging 
              ? 'from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl' 
              : 'from-indigo-500/5 via-purple-500/5 to-pink-500/5 blur-2xl group-hover:blur-3xl'
          }`} />

          {/* Main Upload Container */}
          <div className={`relative border-2 border-dashed rounded-2xl p-8 md:p-10 transition-all duration-500 ${
            isDragging 
              ? 'border-indigo-400 bg-indigo-500/10 backdrop-blur-xl' 
              : 'border-stone-700/50 bg-stone-900/30 backdrop-blur-sm group-hover:border-indigo-500/50 group-hover:bg-stone-900/50'
          }`}>
            {/* Badge */}
            <div className="absolute top-4 right-4">
              <div className="px-2.5 py-1 rounded-md bg-stone-900/80 border border-stone-800/50 backdrop-blur-sm text-[9px] text-stone-400 font-mono font-semibold">
                PDF ONLY
              </div>
            </div>

            {/* Upload Icon */}
            <div className={`relative mb-6 transition-all duration-500 ${
              isDragging 
                ? 'scale-110 rotate-6' 
                : 'group-hover:scale-105 group-hover:-rotate-3'
            }`}>
              <div className={`p-6 rounded-2xl transition-all duration-500 ${
                isDragging 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-2xl shadow-indigo-500/50' 
                  : 'bg-gradient-to-br from-stone-800/50 to-stone-900/50 text-stone-400 group-hover:text-indigo-400 group-hover:shadow-xl group-hover:shadow-indigo-500/20'
              }`}>
                <LucideUpload size={48} strokeWidth={1.5} className="mx-auto" />
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-3">
              <h3 className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${
                isDragging ? 'text-white' : 'text-stone-200 group-hover:text-white'
              }`}>
                {isDragging ? 'Drop it here!' : 'Drop your PDF here'}
              </h3>
              <p className={`text-sm md:text-base transition-colors duration-500 ${
                isDragging ? 'text-indigo-200' : 'text-stone-500 group-hover:text-stone-400'
              }`}>
                or click to browse • Up to 50MB
              </p>
            </div>

            {/* Features Pills */}
            <div className={`mt-8 flex flex-wrap items-center justify-center gap-3 transition-opacity duration-500 ${
              isDragging ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
            }`}>
              <FeaturePill icon={<LucideZap size={12} />} text="Realistic Physics" />
              <FeaturePill icon={<LucideVolume2 size={12} />} text="Tactile Audio" />
              <FeaturePill icon={<LucideFileText size={12} />} text="Instant Processing" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <FeatureCard 
          title="3D Page Physics" 
          description="Advanced rendering engine simulates real-world paper physics with natural flipping animations and realistic shadows." 
          icon={<LucideBookOpen className="text-indigo-400" size={20} />}
          gradient="from-indigo-500/10 to-indigo-500/5"
        />
        <FeatureCard 
          title="Immersive Audio" 
          description="Spatial sound effects respond to your interaction speed and intensity, creating a truly tactile reading experience." 
          icon={<LucideVolume2 className="text-purple-400" size={20} />}
          gradient="from-purple-500/10 to-purple-500/5"
        />
        <FeatureCard 
          title="AI-Powered Insights" 
          description="AI-powered assistant helps you understand, summarize, and explore complex content with intelligent context awareness." 
          icon={<LucideBrain className="text-pink-400" size={20} />}
          gradient="from-pink-500/10 to-pink-500/5"
        />
      </div>

      {/* CTA Section */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-stone-400 text-xs">
          <span>Ready to transform your reading experience?</span>
          <LucideArrowRight size={14} className="text-indigo-400" />
        </div>
      </div>
    </div>
  );
};

const FeaturePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/50 border border-stone-800/50 backdrop-blur-sm text-[10px] font-medium text-stone-400">
    {icon}
    <span>{text}</span>
  </div>
);

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}> = ({ title, description, icon, gradient }) => (
  <div className={`group relative p-6 rounded-xl bg-gradient-to-br ${gradient} border border-stone-800/50 backdrop-blur-sm hover:border-stone-700/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10`}>
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/0 transition-all duration-500" />
    
    <div className="relative">
      <div className="mb-4 inline-flex p-3 rounded-lg bg-stone-900/50 border border-stone-800/50 group-hover:border-stone-700/50 transition-colors">
        {icon}
      </div>
      
      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">
        {title}
      </h4>
      
      <p className="text-stone-400 text-xs leading-relaxed group-hover:text-stone-300 transition-colors">
        {description}
      </p>
    </div>
  </div>
);
