
import React, { useRef, useEffect, useState, forwardRef, useCallback, useMemo, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { PageData } from '../types';

interface FlipBookProps {
  pages: PageData[];
  onPageChange: (index: number) => void;
  currentPage: number;
  zoom?: number;
  isSelectMode?: boolean;
  isDragMode?: boolean;
  showUI: boolean;
}

export interface FlipBookHandle {
  flipToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

// Procedural Paper Sound Generator using Web Audio API
const generatePaperSound = (audioContext: AudioContext, volume: number = 0.2): void => {
  // Create multiple noise sources for realistic paper texture
  const duration = 0.15; // Short, crisp paper rustle
  const sampleRate = audioContext.sampleRate;
  const bufferLength = duration * sampleRate;
  
  // Create buffer for white noise
  const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate pink noise (more natural than white noise for paper)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // Normalize
    b6 = white * 0.115926;
  }
  
  // Create source and apply envelope
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create gain node for volume control and envelope
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01); // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.05); // Decay
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration); // Fade out
  
  // Apply bandpass filter to make it sound more like paper rustle
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000 + Math.random() * 1000; // Vary frequency slightly
  filter.Q.value = 2;
  
  // Apply high-frequency emphasis for crisp paper texture
  const highPass = audioContext.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 800;
  highPass.Q.value = 1;
  
  // Connect: source -> highpass -> filter -> gain -> destination
  source.connect(highPass);
  highPass.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Play the sound
  source.start(audioContext.currentTime);
  source.stop(audioContext.currentTime + duration);
};

export const FlipBook = forwardRef<FlipBookHandle, FlipBookProps>(({ pages, onPageChange, currentPage, zoom = 1, isSelectMode = false, isDragMode = false, showUI }, ref) => {
  const bookRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 520, height: 720 });
  const [isMobile, setIsMobile] = useState(false);
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const lastSoundTimeRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    flipToPage: (page: number) => {
      bookRef.current?.pageFlip()?.flip(page);
    },
    nextPage: () => {
      if (currentPage < pages.length - 1) {
        bookRef.current?.pageFlip()?.flipNext();
      }
    },
    prevPage: () => {
      if (currentPage > 0) {
        bookRef.current?.pageFlip()?.flipPrev();
      }
    }
  }));

  useEffect(() => {
    if (zoom === 1 || !isDragMode) setOffset({ x: 0, y: 0 });
  }, [zoom, isDragMode]);

  // Initialize AudioContext
  useEffect(() => {
    // Initialize Web Audio API context (lazy initialization)
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return audioContextRef.current;
    };

    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      const w = mobile ? Math.min(window.innerWidth * 0.75, 380) : Math.min(window.innerWidth * 0.35, 460);
      setDimensions({ width: w, height: w * 1.414 });
    };
    update();
    window.addEventListener('resize', update);
    
    // Initialize audio context on first user interaction (required by browsers)
    const initOnInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
    };
    document.addEventListener('click', initOnInteraction, { once: true });
    document.addEventListener('touchstart', initOnInteraction, { once: true });
    
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
    };
  }, []);

  const playPaperSound = useCallback((volume: number = 0.18) => {
    if (!audioContextRef.current) {
      // Try to initialize if not already done
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not available');
        return;
      }
    }
    
    // Resume audio context if suspended (required by browsers)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    try {
      generatePaperSound(audioContextRef.current, volume);
    } catch (e) {
      console.warn('Failed to generate paper sound:', e);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragMode || isSelectMode) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };


  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const onFlip = useCallback((e: any) => {
    if (e && typeof e.data === 'number' && !isSelectMode) {
      const targetPage = e.data;
      const now = Date.now();
      
      // Play paper sound synchronized with flip start (debounce to prevent double play)
      // The onFlip callback fires when flip animation starts, not when it ends
      if (now - lastSoundTimeRef.current > 200) { // Prevent playing within 200ms
        playPaperSound(0.22);
        lastSoundTimeRef.current = now;
      }
      
      onPageChange(targetPage);
    }
  }, [onPageChange, isSelectMode, playPaperSound]);

  const totalPages = pages.length;
  const isAtStart = currentPage === 0;
  const isAtEnd = currentPage === totalPages - 1;

  const renderedPages = useMemo(() => {
    return pages.map((page, index) => (
      <Page 
        key={`pg-item-${index}`} 
        page={page} 
        isCover={index === 0}
        isBack={index === totalPages - 1}
        isSelectMode={isSelectMode}
      />
    ));
  }, [pages, isSelectMode, totalPages]);

  const leftStackCount = isAtStart ? 0 : (isAtEnd ? totalPages : currentPage);
  const rightStackCount = isAtStart ? totalPages : (isAtEnd ? 0 : totalPages - currentPage);
  const stackWidth = (count: number) => Math.min(count * 0.45, 20);

  if (!pages || pages.length === 0) return null;

  const spreadWidth = isMobile ? dimensions.width : dimensions.width * 2;

  return (
    <div 
      className={`relative w-full h-full flex flex-col items-center justify-center p-20 select-none overflow-visible
        ${isDragMode && !isSelectMode ? 'cursor-grab' : ''}
        ${isDragging ? 'cursor-grabbing' : ''}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative transition-transform duration-700 ease-out flex flex-col items-center justify-center"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <div 
          className="relative flex items-center justify-center transition-all duration-700"
          style={{ 
            width: spreadWidth, 
            height: dimensions.height,
            transform: !isMobile && isAtStart ? 'translateX(-25%)' : (!isMobile && isAtEnd ? 'translateX(25%)' : 'none')
          }}
        >
          
          {/* Static Hardcover Housing - Anchored to visible half when closed */}
          <div className={`absolute bg-[#000] rounded-lg border border-white/5 transition-all duration-700 z-0
            ${isAtStart && !isMobile ? 'left-[50%] right-[-14px]' : (isAtEnd && !isMobile ? 'right-[50%] left-[-14px]' : 'inset-[-14px]')}
            shadow-[0_40px_100px_rgba(0,0,0,0.9)]
          `}></div>
          
          {/* Page Edge Stacks */}
          {!isMobile && !isSelectMode && (
            <>
              <div 
                className="absolute left-0 h-[98.5%] bg-[#e8e4db] transition-all duration-700 rounded-l-[2px]"
                style={{ 
                  width: `${stackWidth(leftStackCount)}px`, 
                  transform: `translateX(-100%)`,
                  boxShadow: '-8px 0 20px rgba(0,0,0,0.6)',
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.08) 1px, rgba(0,0,0,0.08) 2px)',
                  top: '0.75%',
                  opacity: leftStackCount > 0 ? 1 : 0,
                  visibility: isAtStart ? 'hidden' : 'visible'
                }}
              ></div>

              <div 
                className="absolute right-0 h-[98.5%] bg-[#e8e4db] transition-all duration-700 rounded-r-[2px]"
                style={{ 
                  width: `${stackWidth(rightStackCount)}px`, 
                  transform: `translateX(100%)`,
                  boxShadow: '8px 0 20px rgba(0,0,0,0.6)',
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.08) 1px, rgba(0,0,0,0.08) 2px)',
                  top: '0.75%',
                  opacity: rightStackCount > 0 ? 1 : 0,
                  visibility: isAtEnd ? 'hidden' : 'visible'
                }}
              ></div>
            </>
          )}

          <div className="relative z-10 w-full h-full rounded-[2px] overflow-hidden">
            {/* @ts-ignore */}
            <HTMLFlipBook
              key={`flip-${isSelectMode}-${dimensions.width}`}
              width={dimensions.width}
              height={dimensions.height}
              size="fixed"
              showCover={true}
              onFlip={onFlip}
              className="book-engine"
              ref={bookRef}
              startPage={currentPage}
              drawShadow={!isSelectMode}
              flippingTime={isSelectMode ? 1 : 1200}
              usePortrait={isMobile}
              useMouseEvents={!isSelectMode}
              clickEventForward={!isSelectMode}
              swipeDistance={isSelectMode ? 0 : 30}
              style={{ backgroundColor: 'transparent' }}
            >
              {renderedPages}
            </HTMLFlipBook>
          </div>
        </div>
      </div>

      {!isSelectMode && zoom === 1 && (
        <div className={`fixed inset-y-0 inset-x-6 md:inset-x-12 flex items-center justify-between pointer-events-none z-[60] transition-opacity duration-500 ${!showUI ? 'opacity-0' : 'opacity-100'}`}>
          <button 
            onClick={() => {
              if (currentPage > 0) {
                bookRef.current?.pageFlip()?.flipPrev();
              }
            }} 
            className={`p-8 md:p-12 text-white/5 hover:text-white/40 rounded-full pointer-events-auto transition-all group active:scale-90 ${isAtStart ? 'opacity-0 invisible' : 'opacity-100'}`}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="group-hover:-translate-x-2 transition-transform scale-75 md:scale-100"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={() => {
              if (currentPage < pages.length - 1) {
                bookRef.current?.pageFlip()?.flipNext();
              }
            }} 
            className={`p-8 md:p-12 text-white/5 hover:text-white/40 rounded-full pointer-events-auto transition-all group active:scale-90 ${isAtEnd ? 'opacity-0 invisible' : 'opacity-100'}`}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="group-hover:translate-x-2 transition-transform scale-75 md:scale-100"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
});

interface PageProps {
  page: PageData;
  isCover?: boolean;
  isBack?: boolean;
  isSelectMode: boolean;
}

const Page = forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  const { page, isCover, isBack, isSelectMode } = props;
  const isLeft = page.pageNumber % 2 === 0;
  const pageBgColor = '#fdfbf7';

  return (
    <div 
      className={`page relative h-full w-full flex flex-col overflow-hidden opacity-100 ${isSelectMode ? 'pointer-events-auto' : ''}`} 
      ref={ref}
      style={{ 
        backgroundColor: pageBgColor,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div className="absolute inset-0 z-0" style={{ backgroundColor: pageBgColor }}></div>

      <div className="absolute inset-0 z-40 pointer-events-none">
        <div className="absolute inset-0 paper-grain opacity-20" style={{ backgroundColor: 'transparent' }}></div>
        
        {!isCover && !isBack && (
          <>
            <div className={`absolute top-0 bottom-0 w-32 ${
              isLeft 
                ? 'right-0 bg-gradient-to-l from-black/[0.12] via-black/[0.02] to-transparent' 
                : 'left-0 bg-gradient-to-r from-black/[0.12] via-black/[0.02] to-transparent'
            }`}></div>
            <div className={`absolute top-0 bottom-0 w-[1px] bg-black/10 ${isLeft ? 'right-0' : 'left-0'}`}></div>
          </>
        )}

        {(isCover || isBack) && (
          <div className={`absolute top-0 bottom-0 w-8 z-50 ${isCover ? 'left-0 border-r border-black/5' : 'right-0 border-l border-black/5'}`}
               style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent, rgba(0,0,0,0.1))' }}>
          </div>
        )}

        <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/[0.03] to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/[0.03] to-transparent"></div>
      </div>

      <div className={`flex-1 relative flex items-center justify-center overflow-hidden z-20 
        ${isCover || isBack ? 'p-8 md:p-12' : 'p-3'}
      `}>
        <img 
          src={page.imageUrl} 
          className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-700
            ${isCover || isBack ? 'shadow-[0_10px_40px_rgba(0,0,0,0.2)]' : 'bg-white shadow-sm'}
          `} 
          loading="eager" 
        />
        
        {!isCover && !isBack && (
          <div className={`absolute inset-0 z-50 ${isSelectMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <div className="relative w-full h-full">
                {page.textItems.map((item, idx) => {
                  const s = 2.0;
                  const x = (item.transform[4] * s / page.width) * 100;
                  const y = (1 - (item.transform[5] * s / page.height)) * 100;
                  return (
                    <span key={idx} className="absolute text-transparent selection:bg-indigo-500/30 whitespace-pre leading-none"
                      style={{ 
                        left: `${x}%`, 
                        top: `${y}%`, 
                        fontSize: `${(item.transform[0] * s / page.height) * 100}cqh`, 
                        transform: 'translateY(-90%)', 
                        userSelect: isSelectMode ? 'text' : 'none', 
                        pointerEvents: isSelectMode ? 'auto' : 'none',
                        fontFamily: 'serif'
                      }}>
                      {item.str}
                    </span>
                  );
                })}
             </div>
          </div>
        )}
      </div>

      {!isCover && !isBack && (
        <div 
          className={`h-12 flex-shrink-0 flex items-center px-10 z-20 relative ${isLeft ? 'justify-start' : 'justify-end'}`}
          style={{ 
            backgroundColor: pageBgColor, 
            boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.01)'
          }}
        >
          <span className="text-[10px] font-black text-black/30 font-mono tracking-tighter">{page.pageNumber}</span>
        </div>
      )}
    </div>
  );
});

Page.displayName = 'Page';
