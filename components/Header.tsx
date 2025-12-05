import React from 'react';
import { GitGraph, Zap, Settings, Globe } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  settings: AppSettings;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, settings }) => {
  return (
    <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-[#09090b]/60">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/10 border border-white/10 group-hover:scale-105 transition-transform duration-300">
              <GitGraph className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              FlowTube
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-zinc-800 text-zinc-400 tracking-normal border border-zinc-700">BETA</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">Transcript to Logic</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Provider Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group cursor-help">
            <div className={`p-1 rounded-full ${settings.provider === 'GEMINI' ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
               {settings.provider === 'GEMINI' ? (
                 <Zap className="w-3 h-3 text-indigo-400" />
               ) : (
                 <Globe className="w-3 h-3 text-emerald-400" />
               )}
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">
              {settings.provider === 'GEMINI' ? 'Gemini 3 Pro' : 'Nova 2 Lite'}
            </span>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 hidden md:block"></div>
          
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
          >
            <Settings className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
