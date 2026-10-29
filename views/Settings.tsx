import React, { useState } from 'react';
import { api } from '../services/api';
import { WorkspaceStatus } from '../types';

interface SettingsProps {
  workspace: WorkspaceStatus;
  refreshWorkspace: () => void;
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR') => void;
}

export const Settings: React.FC<SettingsProps> = ({ workspace, refreshWorkspace, addLog }) => {
  const [pathInput, setPathInput] = useState(workspace.path);

  const handleSave = async () => {
    try {
      addLog('Calibrating coordinates...', 'INFO');
      const res = await api.setWorkspacePath(pathInput);
      if (res.isValid) {
        addLog('Link Established', 'SUCCESS');
        refreshWorkspace();
      } else {
        addLog('Invalid Coordinates', 'ERROR');
      }
    } catch (e) {
      addLog('Calibration Failed', 'ERROR');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-10">
        <div className="w-16 h-16 border-2 border-slate-500 bg-slate-900/10 flex items-center justify-center mr-6 text-slate-400 font-bold text-2xl font-['Rajdhani'] rotate-45">
          <span className="-rotate-45">05</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white font-['Rajdhani'] uppercase tracking-widest text-glow">
            System <span className="text-slate-500">Calibration</span>
          </h2>
          <p className="text-slate-500 font-mono text-xs tracking-[0.3em] mt-1">CONFIGURE NAVIGATION</p>
        </div>
      </div>
      
      <div className="glass-panel p-12 relative rounded-sm">
        <div className="absolute top-0 right-0 p-4 opacity-50">
           <svg className="w-8 h-8 text-slate-700 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>

        <label className="block text-slate-400 text-xs uppercase font-bold mb-4 font-['JetBrains_Mono'] tracking-[0.2em]">Target Sector Coordinates (Root Path)</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            className="flex-1 bg-black/40 border border-slate-700 px-6 py-4 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
          />
          <button 
            onClick={handleSave}
            className="px-8 py-4 bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-white uppercase font-bold text-xs tracking-wider font-['Rajdhani'] transition-all"
          >
            Establish Link
          </button>
        </div>
        <div className="mt-6 flex items-start space-x-3 bg-slate-900/50 p-4 border-l-2 border-cyan-500/50">
            <span className="text-cyan-500 font-bold">ⓘ</span>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Target sector must contain a valid <code className="text-cyan-300">00_INDEX.md</code> beacon and executable python scripts to interface with this console.
            </p>
        </div>
      </div>
    </div>
  );
};