import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface BatchHandoffProps {
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => void;
}

export const BatchHandoff: React.FC<BatchHandoffProps> = ({ addLog }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ batch: '', nextBatch: '', summary: '' });

  useEffect(() => {
    api.getSuggestions().then(s => {
        if (s.current_batch) setFormData(prev => ({...prev, batch: s.current_batch || ''}));
        if (s.next_batch) setFormData(prev => ({...prev, nextBatch: s.next_batch || ''}));
    }).catch(console.error);
  }, []);

  const executeEndCycleProtocol = async () => {
    if (!formData.summary) {
        addLog('Mission summary required to initiate protocol.', 'ERROR');
        return;
    }
    setLoading(true);
    addLog('Initiating End-Cycle Protocol...', 'INFO');

    try {
        // Step 1: Generate Handoff
        addLog('Phase 1: Generating Transmission Signal...', 'COMMAND');
        const argsHandoff = [];
        if (formData.batch) argsHandoff.push('--batch', formData.batch);
        const resHandoff = await api.runScript('generate_handoff_prompt.py', argsHandoff);
        
        if (resHandoff.return_code !== 0) {
            throw new Error(`Signal Gen Failed: ${resHandoff.stderr}`);
        }
        addLog('Signal Generated.', 'SUCCESS');

        // Step 2: Archive Minutes
        addLog('Phase 2: Committing to Eternal Log...', 'COMMAND');
        const argsMinutes = [
            '--batch', formData.batch,
            '--summary', formData.summary,
            '--next-batch', formData.nextBatch
        ];
        const resMinutes = await api.runScript('update_project_minutes_batch.py', argsMinutes);

        if (resMinutes.return_code !== 0) {
            throw new Error(`Archive Failed: ${resMinutes.stderr}`);
        }
        addLog('Archive Complete.', 'SUCCESS', resMinutes.stdout);
        
        addLog('PROTOCOL COMPLETE. SESSION TERMINATED.', 'SUCCESS');

    } catch (e: any) {
        addLog('Protocol Aborted.', 'ERROR', e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
      <div className="flex items-center mb-10">
        <div className="w-16 h-16 border-2 border-cyan-500 bg-cyan-900/10 flex items-center justify-center mr-6 text-cyan-300 font-bold text-2xl font-['Rajdhani'] shadow-[0_0_25px_rgba(6,182,212,0.3)] rotate-45">
          <span className="-rotate-45">03</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white font-['Rajdhani'] uppercase tracking-widest text-glow">
            Transmission <span className="text-cyan-500">Protocol</span>
          </h2>
          <p className="text-slate-400 font-mono text-xs tracking-[0.3em] mt-1">END CYCLE SEQUENCE</p>
        </div>
      </div>

      <div className="glass-panel p-10 rounded-sm shadow-2xl relative border-t border-b border-cyan-500/20">
        {/* Circuit lines */}
        <div className="absolute right-0 top-1/2 w-32 h-[1px] bg-cyan-500/30"></div>
        <div className="absolute right-0 top-1/4 w-16 h-[1px] bg-cyan-500/30"></div>
        <div className="absolute right-0 top-3/4 w-16 h-[1px] bg-cyan-500/30"></div>
        
        <div className="grid grid-cols-2 gap-10 mb-8">
           <div>
              <label className="block text-cyan-400 text-[10px] uppercase font-bold mb-2 font-['JetBrains_Mono'] tracking-[0.2em]">Active Sector ID (LOCKED)</label>
              <input 
                type="text" 
                value={formData.batch}
                readOnly
                className="w-full bg-black/20 border-b border-slate-700 px-4 py-3 text-slate-400 font-mono focus:outline-none cursor-not-allowed opacity-70"
                title="System detected value - cannot be modified manually"
              />
           </div>
           <div>
              <label className="block text-cyan-400 text-[10px] uppercase font-bold mb-2 font-['JetBrains_Mono'] tracking-[0.2em]">Next Sector ID</label>
              <input 
                type="text" 
                value={formData.nextBatch}
                onChange={e => setFormData({...formData, nextBatch: e.target.value})}
                className="w-full bg-black/40 border-b-2 border-slate-700 px-4 py-3 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors"
              />
           </div>
        </div>

        <div className="mb-10">
            <label className="block text-cyan-400 text-[10px] uppercase font-bold mb-2 font-['JetBrains_Mono'] tracking-[0.2em]">Sector Report Summary</label>
            <textarea 
              value={formData.summary}
              onChange={e => setFormData({...formData, summary: e.target.value})}
              rows={4}
              placeholder="ENTER MISSION LOG FOR ARCHIVAL..."
              className="w-full bg-black/40 border-b-2 border-slate-700 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-['Rajdhani'] transition-colors tracking-wide text-lg"
            />
        </div>

        <div className="pt-8 border-t border-cyan-500/10">
           <button 
             onClick={executeEndCycleProtocol}
             disabled={loading}
             className="w-full py-6 bg-cyan-900/30 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900/60 text-white transition-all uppercase tracking-[0.3em] font-bold text-lg font-['Rajdhani'] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] disabled:opacity-50"
           >
             {loading ? 'EXECUTING PROTOCOL...' : 'EXECUTE END-CYCLE PROTOCOL'}
           </button>
           <p className="text-center text-[10px] text-cyan-500/50 mt-2 font-mono uppercase">
               Auto-Generates Handoff • Commits to Archive
           </p>
        </div>
      </div>
    </div>
  );
};