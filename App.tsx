
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadZone } from './components/UploadZone';
import { FlipBook, FlipBookHandle } from './components/FlipBook';
import { Sidebar } from './components/Sidebar';
import { LoadingScreen } from './components/LoadingScreen';
import { ReaderState, PageData, BookMetadata } from './types';
import { renderPdfPages } from './services/pdfService';
import { 
  LucideBookOpen, 
  LucideChevronLeft, 
  LucideAlertCircle, 
  LucidePlus, 
  LucideMinus, 
  LucideType,
  LucideHand,
  LucideRefreshCcw,
  LucideChevronRight,
  LucideMaximize,
  LucideMinimize
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<ReaderState>(ReaderState.IDLE);
  const [pages, setPages] = useState<PageData[]>([]);
  const [metadata, setMetadata] = useState<BookMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const bookRef = useRef<FlipBookHandle>(null);
  const [showUI, setShowUI] = useState(true);
  const uiTimer = useRef<number | null>(null);

  const resetUITimer = useCallback(() => {
    setShowUI(true);
    if (uiTimer.current) window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => {
      if (!isSidebarOpen) setShowUI(false);
    }, 4000);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (state === ReaderState.READING) {
      window.addEventListener('mousemove', resetUITimer);
      resetUITimer();
    }
    return () => window.removeEventListener('mousemove', resetUITimer);
  }, [state, resetUITimer]);

  // Keyboard navigation controls
  useEffect(() => {
    if (state !== ReaderState.READING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard events if user is typing in an input or sidebar is open
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isSidebarOpen) {
        return;
      }

      // Calculate boundaries inside the handler to ensure they're current
      const atStart = currentPage === 0;
      const atEnd = currentPage === (metadata?.totalPages || 0) - 1;

      // Prevent default scrolling behavior
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' && !atStart) {
        bookRef.current?.prevPage();
        resetUITimer();
      } else if (e.key === 'ArrowRight' && !atEnd) {
        bookRef.current?.nextPage();
        resetUITimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, currentPage, metadata, isSidebarOpen, resetUITimer]);

  const handleFileUpload = useCallback(async (file: File) => {
    setState(ReaderState.LOADING);
    setErrorMessage("");
    try {
      const result = await renderPdfPages(file);
      setPages(result.pages);
      setMetadata({
        title: file.name.replace('.pdf', ''),
        author: 'Unknown Author',
        totalPages: result.totalPages
      });
      setState(ReaderState.READING);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process PDF.");
      setState(ReaderState.ERROR);
    }
  }, []);

  const handleBack = () => {
    setState(ReaderState.IDLE);
    setPages([]);
    setMetadata(null);
    setCurrentPage(0);
    setZoom(1);
  };

  const handleResetView = () => {
    setZoom(1);
    resetUITimer();
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
      resetUITimer();
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [resetUITimer]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePageSeek = (val: number) => {
    bookRef.current?.flipToPage(val);
    setCurrentPage(val);
  };

  const isAtStart = currentPage === 0;
  const isAtEnd = currentPage === (metadata?.totalPages || 0) - 1;

  return (
    <div className={`min-h-screen w-full flex flex-col bg-[#050505] text-stone-200 relative transition-colors duration-1000 ${
      state === ReaderState.READING ? 'overflow-hidden' : 'overflow-y-auto'
    }`}>
      
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a1a1a_0,transparent_70%)] opacity-30"></div>
      </div>

      {state === ReaderState.IDLE && (
        <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-start px-6 md:px-10 z-[100] border-b border-white/5 backdrop-blur-xl bg-[#050505]/80">
          <h1 className="text-xl md:text-2xl font-bold font-serif bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Aj-Flip
          </h1>
        </header>
      )}

      {state === ReaderState.READING && (
        <header className={`fixed top-0 inset-x-0 h-20 flex items-center justify-between px-6 md:px-10 z-[100] transition-all duration-500 ease-in-out ${!showUI ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <button onClick={handleBack} className="p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 backdrop-blur-xl group">
              <LucideChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90 truncate max-w-[120px] lg:max-w-xs">{metadata?.title}</h1>
              <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase mt-0.5">Physical Render Engine</span>
            </div>
          </div>

          <div className="flex-1 max-w-sm lg:max-w-md mx-4 md:mx-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 md:px-6 py-2 shadow-2xl flex items-center gap-3 md:gap-4 transition-all">
               <span className="text-[9px] font-black font-mono text-stone-500 min-w-[45px]">{currentPage + 1} / {metadata?.totalPages}</span>
               <div className="flex-1 relative h-6 flex items-center">
                 <input 
                   type="range" 
                   min="0" max={(metadata?.totalPages || 1) - 1} 
                   value={currentPage}
                   onChange={(e) => handlePageSeek(parseInt(e.target.value))}
                   className="w-full relative z-10 accent-indigo-500 appearance-none bg-transparent cursor-pointer h-1 rounded-full"
                 />
                 <div className="absolute inset-x-0 h-[2px] bg-white/10 rounded-full pointer-events-none overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${(currentPage / ((metadata?.totalPages || 1) - 1)) * 100}%` }}></div>
                 </div>
               </div>
               <div className="flex gap-0.5 md:gap-1 items-center">
                 <button 
                  disabled={isAtStart}
                  onClick={() => bookRef.current?.prevPage()} 
                  className={`p-1 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed`}
                 >
                    <LucideChevronLeft size={14}/>
                 </button>
                 <button 
                  disabled={isAtEnd}
                  onClick={() => bookRef.current?.nextPage()} 
                  className={`p-1 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed`}
                 >
                    <LucideChevronRight size={14}/>
                 </button>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             <div className="hidden md:flex bg-white/5 rounded-2xl p-1 border border-white/5 backdrop-blur-xl">
                <button onClick={() => setIsSelectMode(false)} className={`p-2 px-3 rounded-xl flex items-center gap-2 transition-all ${!isSelectMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-stone-500 hover:text-white'}`}>
                  <LucideHand size={14} />
                  <span className="hidden lg:inline text-[9px] font-bold uppercase tracking-wider">Interact</span>
                </button>
                <button onClick={() => setIsSelectMode(true)} className={`p-2 px-3 rounded-xl flex items-center gap-2 transition-all ${isSelectMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-stone-500 hover:text-white'}`}>
                  <LucideType size={14} />
                  <span className="hidden lg:inline text-[9px] font-bold uppercase tracking-wider">Select</span>
                </button>
             </div>

             {/* Separate Hand/Drag Mode Button - Only show when zoomed */}
             {zoom > 1 && (
               <button 
                 onClick={() => setIsDragMode(!isDragMode)}
                 className={`p-2.5 md:p-3 rounded-2xl transition-all border backdrop-blur-xl ${
                   isDragMode 
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-500/50' 
                     : 'bg-white/5 text-stone-400 hover:text-white border-white/5 hover:bg-white/10'
                 }`}
                 title={isDragMode ? "Disable drag mode" : "Enable drag mode"}
               >
                 <LucideHand size={18} />
               </button>
             )}
             
             <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5 backdrop-blur-xl">
                <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))} className="p-2 text-stone-400 hover:text-white transition-colors"><LucideMinus size={14}/></button>
                <span className="px-2 text-[10px] font-bold font-mono min-w-[35px] text-center text-white/60">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(prev => Math.min(3, prev + 0.2))} className="p-2 text-stone-400 hover:text-white transition-colors"><LucidePlus size={14}/></button>
                {zoom !== 1 && (
                  <button onClick={handleResetView} className="p-2 ml-1 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 transition-all active:scale-90" title="Reset View">
                    <LucideRefreshCcw size={14} />
                  </button>
                )}
             </div>

             <button 
               onClick={toggleFullscreen}
               className="p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 backdrop-blur-xl text-stone-400 hover:text-white"
               title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
             >
               {isFullscreen ? <LucideMinimize size={18} /> : <LucideMaximize size={18} />}
             </button>

             <button onClick={() => setIsSidebarOpen(true)} className="p-3 md:px-5 md:py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/20">
               <LucideBookOpen size={16} />
               <span className="hidden sm:inline">Ask AI</span>
             </button>
          </div>
        </header>
      )}

      <main className={`flex-1 relative z-10 ${
        state === ReaderState.IDLE 
          ? 'flex flex-col items-center justify-start pt-20 pb-16 md:pt-20 md:pb-16' 
          : 'flex items-center justify-center'
      }`}>
        {state === ReaderState.IDLE && <UploadZone onUpload={handleFileUpload} />}
        {state === ReaderState.LOADING && <LoadingScreen />}
        {state === ReaderState.READING && (
          <FlipBook 
            ref={bookRef}
            pages={pages} 
            onPageChange={(index) => setCurrentPage(index)} 
            currentPage={currentPage}
            zoom={zoom}
            isSelectMode={isSelectMode}
            isDragMode={isDragMode}
            showUI={showUI}
          />
        )}

        {state === ReaderState.ERROR && (
          <div className="max-w-md w-full text-center p-12 bg-stone-900 border border-white/10 rounded-[3rem] shadow-2xl">
            <LucideAlertCircle size={48} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Reading Error</h2>
            <p className="text-stone-500 mb-8">{errorMessage}</p>
            <button onClick={handleBack} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold uppercase tracking-widest text-white">Retry</button>
          </div>
        )}
      </main>

      {state === ReaderState.IDLE && (
        <footer className="fixed bottom-0 inset-x-0 h-12 flex items-center justify-center px-6 md:px-10 z-[100] border-t border-white/5 backdrop-blur-xl bg-[#050505]/80">
          <p className="text-xs text-stone-500">
            by{' '}
            <a 
              href="https://www.linkedin.com/in/ajun-ravi-520760166/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-stone-400 font-semibold hover:text-indigo-400 transition-colors"
            >
              Ajun Ravi
            </a>
          </p>
        </footer>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => { setIsSidebarOpen(false); resetUITimer(); }} 
        bookContext={metadata?.title || ""}
        currentPageText={pages[currentPage]?.textContent || ""}
      />
    </div>
  );
};

export default App;
