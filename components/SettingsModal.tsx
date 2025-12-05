import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Save } from 'lucide-react';
import { AppSettings, AiProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Key className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">API Settings</h2>
              <p className="text-xs text-zinc-400">Configure your AI providers</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Active Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, provider: 'GEMINI' }))}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  formData.provider === 'GEMINI' 
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <span className="font-semibold text-sm">Gemini Pro</span>
                <span className="text-[10px] opacity-70">Google GenAI</span>
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, provider: 'OPENROUTER' }))}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  formData.provider === 'OPENROUTER' 
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <span className="font-semibold text-sm">Nova Lite</span>
                <span className="text-[10px] opacity-70">OpenRouter (Free)</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          {/* API Keys */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Gemini API Key</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
                  Get Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={formData.geminiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, geminiKey: e.target.value }))}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
                />
                <ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">OpenRouter API Key</label>
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
                  Get Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input 
                  type="password"
                  value={formData.openRouterKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, openRouterKey: e.target.value }))}
                  placeholder="sk-or-..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
                />
                <ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-xs text-blue-200/70 leading-relaxed">
            Your keys are stored locally in your browser and are never sent to our servers.
            They are only used to communicate directly with the AI providers.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button 
            onClick={handleSave}
            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
