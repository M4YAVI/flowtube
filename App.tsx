import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import StatusBadge from './components/StatusBadge';
import StreamdownRenderer from './components/StreamdownRenderer';
import SettingsModal from './components/SettingsModal';
import { generateFlowchartStream } from './services/gemini';
import { AppStatus, AppSettings } from './types';
import { Play, RotateCcw, Copy, GitGraph, Image as ImageIcon, Code2, Sparkles, Eraser } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'GEMINI',
  geminiKey: '',
  openRouterKey: ''
};

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load settings from local storage
  useEffect(() => {
    const saved = localStorage.getItem('flowtube-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('flowtube-settings', JSON.stringify(newSettings));
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) return;

    if (settings.provider === 'OPENROUTER' && !settings.openRouterKey) {
      setIsSettingsOpen(true);
      alert("Please enter your OpenRouter API Key in settings.");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setStreamedContent(''); 
    setStreamedContent("Analyzing transcript logic...\n");

    try {
      await generateFlowchartStream(
        transcript, 
        (chunk) => {
          setStreamedContent((prev) => prev + chunk);
        },
        {
          provider: settings.provider,
          apiKey: settings.provider === 'GEMINI' ? settings.geminiKey : settings.openRouterKey
        }
      );
      setStatus(AppStatus.COMPLETE);
    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setStreamedContent((prev) => prev + `\n\n**Error generating diagram:** ${error.message || 'Unknown error'}`);
    }
  };

  const handleReset = () => {
    setTranscript('');
    setStreamedContent('');
    setStatus(AppStatus.IDLE);
  };

  const copyToClipboard = () => {
    const mermaidMatch = streamedContent.match(/```mermaid([\s\S]*?)```/);
    const textToCopy = mermaidMatch ? mermaidMatch[1].trim() : streamedContent;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleDownload = async (format: 'png' | 'svg' | 'mmd') => {
    if (format === 'mmd') {
      const mermaidMatch = streamedContent.match(/```mermaid([\s\S]*?)```/);
      const textToDownload = mermaidMatch ? mermaidMatch[1].trim() : streamedContent;
      const blob = new Blob([textToDownload], { type: 'text/vnd.mermaid' });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, 'flowchart.mmd');
      return;
    }

    const svgElement = document.querySelector('.mermaid svg') as SVGSVGElement;
    if (!svgElement) {
      alert("Diagram is not fully rendered yet.");
      return;
    }

    const bbox = svgElement.getBoundingClientRect();
    const width = bbox.width;
    const height = bbox.height;

    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('width', width.toString());
    clonedSvg.setAttribute('height', height.toString());
    clonedSvg.style.backgroundColor = '#09090b'; 

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (format === 'svg') {
      triggerDownload(url, 'flowchart.svg');
    } else if (format === 'png') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 3; // High res
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.fillStyle = '#09090b'; 
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          triggerDownload(pngUrl, 'flowchart.png');
        }
      };
      img.src = url;
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (status === AppStatus.GENERATING) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamedContent, status]);

  return (
    <div className="h-screen bg-[#09090b] flex flex-col font-sans text-zinc-100 overflow-hidden">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        settings={settings}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Panel: Input Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 bg-[#09090b] relative z-20 shadow-2xl shadow-black/50">
          <div className="p-5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-2 text-zinc-400">
               <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
               <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Source Material</h2>
            </div>
            {transcript && (
              <button 
                onClick={handleReset}
                className="group flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-zinc-500 hover:text-rose-400 transition-colors bg-white/5 hover:bg-rose-500/10 rounded"
              >
                <Eraser className="w-3 h-3 transition-transform group-hover:-rotate-12" />
                CLEAR
              </button>
            )}
          </div>
          
          <div className="flex-1 relative">
            <textarea
              className="w-full h-full bg-transparent p-6 resize-none focus:outline-none text-sm leading-7 text-zinc-300 placeholder:text-zinc-700 font-mono scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent selection:bg-indigo-500/20"
              placeholder="// Paste your YouTube video transcript here...&#10;// We will extract the logic and visualize it."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <button
              onClick={handleGenerate}
              disabled={status === AppStatus.GENERATING || !transcript.trim()}
              className={`w-full h-12 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.98]
                ${status === AppStatus.GENERATING || !transcript.trim()
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 ring-1 ring-white/10'
                }`}
            >
              {status === AppStatus.GENERATING ? (
                <>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
                  </div>
                  <span className="ml-1">PROCESSING</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white/20" />
                  GENERATE DIAGRAM
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="flex-1 relative bg-black/40 overflow-hidden">
          
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          {/* Floating Status Indicator */}
          <div className="absolute top-6 left-6 z-30">
             <StatusBadge status={status} />
          </div>

          {/* Content Area */}
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
             <div className="min-h-full w-full flex flex-col items-center justify-center p-8 lg:p-16">
                
                {/* Empty State */}
                {!streamedContent && status === AppStatus.IDLE && (
                   <div className="text-center opacity-0 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4 fill-mode-forwards">
                     <div className="relative inline-block mb-8 group cursor-default">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                        <div className="relative w-28 h-28 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl rotate-6 group-hover:rotate-0 transition-transform duration-500">
                           <GitGraph className="w-12 h-12 text-indigo-400" />
                        </div>
                        {/* Decorative floating elements */}
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-zinc-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 -rotate-12 animate-pulse">
                           <Code2 className="w-5 h-5 text-zinc-500" />
                        </div>
                     </div>
                     <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Visualize Your Logic</h1>
                     <p className="text-zinc-400 max-w-md mx-auto text-lg font-light leading-relaxed">
                       Transform complex transcripts into clear, structured flowcharts instantly.
                     </p>
                   </div>
                )}

                {/* Streamed Content */}
                {(streamedContent || status !== AppStatus.IDLE) && (
                   <div className="w-full max-w-5xl animate-in fade-in duration-500">
                      <StreamdownRenderer content={streamedContent} />
                      <div ref={bottomRef} className="h-32" /> 
                   </div>
                )}
             </div>
          </div>

          {/* Floating Toolbar (Bottom Center) */}
          {streamedContent && status === AppStatus.COMPLETE && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
                <button 
                  onClick={copyToClipboard}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all tooltip-trigger relative group"
                  title="Copy Mermaid Code"
                >
                   <Copy className="w-5 h-5" />
                   <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Copy Code</span>
                </button>
                
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                
                <button 
                  onClick={() => handleDownload('png')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                >
                   <ImageIcon className="w-4 h-4" />
                   Download PNG
                </button>

                <button 
                  onClick={() => handleDownload('svg')}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all group relative"
                  title="Download SVG"
                >
                   <Code2 className="w-5 h-5" />
                   <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">SVG</span>
                </button>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}