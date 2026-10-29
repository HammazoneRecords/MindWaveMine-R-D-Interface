
import React, { useState, useEffect } from 'react';
import { WorkspaceStatus, PipelineStep, FabricationItem } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  workspace: WorkspaceStatus;
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => void;
  refreshWorkspace: () => void;
  onNavigate: (tab: string) => void;
}

const DIAGNOSTICS: PipelineStep[] = [
  { name: 'Related Audit', script: 'generate_related_audit.py', description: 'CHECK NODE LINKS' },
  { name: 'Coverage Scan', script: 'generate_coverage_report.py', description: 'COMPLETION METRICS' },
  { name: 'Canonical Diff', script: 'generate_canonical_diff.py', description: 'TRUTH DEVIATION' },
  { name: 'Next Vector', script: 'suggest_next_batch.py', description: 'CALC TRAJECTORY' },
];

export const Dashboard: React.FC<DashboardProps> = ({ workspace, addLog, refreshWorkspace, onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupDb, setBackupDb] = useState(true);
  const [fileCount, setFileCount] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<FabricationItem[]>([]);
  
  // Rapid Fabricate State
  const [rapidTitle, setRapidTitle] = useState('');
  const [rapidLoading, setRapidLoading] = useState(false);

  // Auto-check sync and fetch vitals on mount
  useEffect(() => {
    // Check files count
    api.listIngestedFiles().then(files => setFileCount(files.length)).catch(console.error);
    
    // Fetch Recent Activity (Fabrications)
    api.getFabrications().then(fabs => setRecentActivity(fabs.slice(0, 5))).catch(console.error);

    if (workspace.isValid && workspace.hasDb) {
      addLog('Auto-Scan: Verifying Neural Synchronization...', 'INFO');
      api.runScript('check_mindwave_db_sync.py').then(res => {
        if (res.return_code === 0) addLog('Neural Sync: STABLE', 'SUCCESS');
        else addLog('Neural Sync: DRIFT DETECTED', 'ERROR', res.stdout);
      });
    }
  }, [workspace.isValid, workspace.hasDb]);

  const handleValidateAndBuild = async () => {
    setIsProcessing(true);
    addLog('Initiating Maintenance Protocol...', 'INFO');

    try {
      addLog('Step 1: Diagnostics Sweep...', 'COMMAND');
      const checkRes = await api.runScript('run_mindwave_checks.py');
      if (checkRes.return_code !== 0) {
        addLog('INTEGRITY FAILURE', 'ERROR', checkRes.stdout + checkRes.stderr);
        setIsProcessing(false);
        return; 
      }

      if (backupDb && workspace.hasDb) {
        addLog('Step 2: Core Memory Archival...', 'COMMAND');
        await api.backupDb();
      }

      addLog('Step 3: Knowledge Base Synthesis...', 'COMMAND');
      const buildRes = await api.runScript('build_mindwave_db.py');
      if (buildRes.return_code !== 0) {
        addLog('Synthesis Failed', 'ERROR', buildRes.stdout);
        setIsProcessing(false);
        return;
      }

      addLog('Step 4: Final Synchronization Verify...', 'COMMAND');
      const verifyRes = await api.runScript('check_mindwave_db_sync.py');
      
      if (verifyRes.return_code === 0) {
        addLog('Protocol Complete. Systems Nominal.', 'SUCCESS');
      } else {
        addLog('Sync Deviation Remains.', 'ERROR');
      }
      refreshWorkspace();
      
      // Update activity after sequence
      const fabs = await api.getFabrications();
      setRecentActivity(fabs.slice(0, 5));

    } catch (e) {
      addLog('Critical Failure', 'ERROR', String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRapidCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapidTitle) return;
    setRapidLoading(true);
    
    try {
      // Fetch ID
      const s = await api.getSuggestions();
      const id = s.next_id;
      
      addLog(`Rapid Fabricate: ${id} - ${rapidTitle}`, 'INFO');
      const res = await api.runScript('scaffold_new_concept.py', ['--id', id, '--title', rapidTitle]);
      
      if (res.return_code === 0) {
        addLog(`Node ${id} Materialized`, 'SUCCESS');
        setRapidTitle('');
        refreshWorkspace();
        // Update activity
        const fabs = await api.getFabrications();
        setRecentActivity(fabs.slice(0, 5));
      } else {
        addLog('Fabrication Failed', 'ERROR', res.stderr);
      }
    } catch (e) {
      addLog('Error', 'ERROR', String(e));
    } finally {
      setRapidLoading(false);
    }
  }

  const runDiagnostic = async (script: string, name: string) => {
    addLog(`Running Module: ${name}...`, 'INFO');
    try {
      const res = await api.runScript(script);
      addLog(name, res.return_code === 0 ? 'SUCCESS' : 'ERROR', res.stdout + res.stderr);
    } catch (e) {
      addLog('Exec Error', 'ERROR', String(e));
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
      
      {/* Top Row: Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Root Sector */}
        <div className="glass-panel p-5 rounded-sm border-t border-cyan-500/30 relative overflow-hidden group">
          <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Root Sector</h3>
          <p className="text-white font-['Rajdhani'] font-bold text-lg truncate" title={workspace.path}>
            {workspace.path ? workspace.path.split('/').pop() : 'OFFLINE'}
          </p>
          <div className={`absolute top-0 right-0 p-2 ${workspace.isValid ? 'text-green-500' : 'text-red-500'}`}>●</div>
          <div className="absolute inset-0 border border-cyan-500/0 group-hover:border-cyan-500/20 transition-all pointer-events-none"></div>
        </div>

        {/* 2. Active Nodes */}
        <div 
            onClick={() => onNavigate('matrix')}
            className="glass-panel p-5 rounded-sm border-t border-purple-500/30 cursor-pointer hover:bg-purple-900/10 transition-all group relative"
        >
          <div className="flex justify-between items-end">
             <div>
                <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Active Nodes</h3>
                <p className="text-4xl font-bold text-white font-['Rajdhani'] text-glow group-hover:scale-105 transition-transform origin-left">{workspace.conceptCount}</p>
             </div>
             <div className="text-right">
                <span className="px-2 py-1 bg-purple-900/30 text-[9px] text-purple-300 border border-purple-500/30 rounded-sm uppercase tracking-wider group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    Access Matrix &gt;
                </span>
             </div>
          </div>
        </div>

        {/* 3. Construct Integrity */}
        <div className="glass-panel p-5 rounded-sm border-t border-blue-500/30 flex items-center justify-between">
           <div>
              <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Construct Integrity</h3>
              <p className={`text-xl font-['Rajdhani'] font-bold ${workspace.hasDb ? 'text-blue-100' : 'text-slate-500'}`}>
                {workspace.hasDb ? 'OPERATIONAL' : 'OFFLINE'}
              </p>
           </div>
           <button 
             onClick={(e) => { e.stopPropagation(); runDiagnostic('check_mindwave_db_sync.py', 'Sync Check'); }}
             className="px-3 py-1 bg-blue-900/30 border border-blue-500/50 text-[10px] text-blue-300 hover:bg-blue-500 hover:text-white transition-all uppercase"
           >
             Verify
           </button>
        </div>

        {/* 4. Data Stream */}
        <div 
            onClick={() => onNavigate('bridge')}
            className="glass-panel p-5 rounded-sm border-t border-orange-500/30 cursor-pointer hover:bg-orange-900/10 transition-all group"
        >
          <div className="flex justify-between items-end">
             <div>
                <h3 className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Buffered Artifacts</h3>
                <p className="text-4xl font-bold text-white font-['Rajdhani'] text-glow group-hover:scale-105 transition-transform origin-left">{fileCount}</p>
             </div>
             <div className="text-right">
                <span className="px-2 py-1 bg-orange-900/30 text-[9px] text-orange-300 border border-orange-500/30 rounded-sm uppercase tracking-wider group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    View Stream &gt;
                </span>
             </div>
          </div>
        </div>

      </div>

      {/* Main Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Actions */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Maintenance Protocol */}
            <div className="glass-panel p-8 rounded-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white font-['Rajdhani'] uppercase tracking-widest text-glow">
                            Maintenance <span className="text-cyan-400">Protocol</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-1 tracking-wider">DIAGNOSE • ARCHIVE • SYNTHESIZE</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input type="checkbox" checked={backupDb} onChange={e => setBackupDb(e.target.checked)} className="hidden" />
                            <div className={`w-3 h-3 border ${backupDb ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'border-slate-500'}`}></div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Backup Core</span>
                        </label>
                         <button 
                            onClick={() => onNavigate('matrix')} 
                            className="text-[9px] text-cyan-600 hover:text-cyan-300 uppercase tracking-widest font-mono border-b border-transparent hover:border-cyan-500 transition-colors"
                        >
                            [ INVOKE GLOBAL AGENT ]
                        </button>
                    </div>
                </div>
                
                <button
                    onClick={handleValidateAndBuild}
                    disabled={!workspace.isValid || isProcessing}
                    className="w-full py-4 bg-cyan-950/30 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-900/50 text-cyan-300 hover:text-white transition-all uppercase tracking-[0.25em] font-bold text-lg font-['Rajdhani'] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'EXECUTING SEQUENCE...' : 'INITIATE SEQUENCE'}
                </button>
            </div>

            {/* Recent Activity Feed */}
            <div className="glass-panel p-6 rounded-sm border-l-2 border-orange-500/50">
                <h3 className="text-orange-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Neural Activity Feed</h3>
                <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                        <div className="text-slate-600 text-xs font-mono italic p-4 text-center">Awaiting data synthesis...</div>
                    ) : (
                        recentActivity.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-black/20 hover:bg-white/5 border border-white/5 transition-all group">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    item.type === 'concept' ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' :
                                    item.type === 'idea' ? 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]' :
                                    item.type === 'claim' ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : 'bg-slate-500'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type}</span>
                                        <span className="text-[9px] text-slate-600 font-mono">{new Date(item.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-white font-['Rajdhani'] truncate">{item.content}</p>
                                </div>
                                <span className="text-[9px] text-slate-500 font-mono truncate max-w-[80px] group-hover:text-cyan-400 transition-colors">🔗 {item.source}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Rapid Fabricate */}
            <div className="glass-panel p-6 rounded-sm border-l-2 border-purple-500/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-purple-400 text-xs font-bold uppercase tracking-[0.2em]">Rapid Fabrication</h3>
                    <button onClick={() => onNavigate('matrix')} className="text-[10px] text-purple-500 hover:text-purple-300 uppercase tracking-wider hover:underline">
                        Full Matrix Interface &gt;
                    </button>
                </div>
                <form onSubmit={handleRapidCreate} className="flex gap-4">
                    <input 
                        type="text" 
                        value={rapidTitle}
                        onChange={e => setRapidTitle(e.target.value)}
                        placeholder="ENTER DESIGNATION FOR IMMEDIATE MATERIALIZATION..."
                        className="flex-1 bg-black/40 border-b border-slate-700 px-4 py-2 text-white focus:outline-none focus:border-purple-500 font-['Rajdhani'] text-lg placeholder:text-sm placeholder:text-slate-600 transition-colors"
                    />
                    <button 
                        type="submit"
                        disabled={rapidLoading || !rapidTitle}
                        className="px-6 py-2 bg-purple-900/20 border border-purple-500/30 hover:bg-purple-500 hover:text-white text-purple-300 transition-all uppercase font-bold text-xs tracking-wider"
                    >
                        {rapidLoading ? '...' : 'CREATE'}
                    </button>
                </form>
            </div>

        </div>

        {/* Right Col: Diagnostics Matrix */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-sm relative flex flex-col h-full">
            <h3 className="text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-teal-500/20 pb-2">Diagnostics Matrix</h3>
            <div className="grid grid-cols-1 gap-3 flex-1">
                {DIAGNOSTICS.map(diag => (
                    <button
                        key={diag.name}
                        onClick={() => runDiagnostic(diag.script, diag.name)}
                        className="w-full text-left px-4 py-3 bg-teal-950/10 hover:bg-teal-900/30 border border-teal-900/50 hover:border-teal-500/50 transition-all flex justify-between items-center group"
                    >
                        <div>
                            <span className="block font-bold text-slate-300 font-['Rajdhani'] group-hover:text-teal-200">{diag.name}</span>
                            <span className="block text-[8px] text-teal-700/70 font-mono tracking-widest">{diag.description}</span>
                        </div>
                        <span className="text-teal-800 group-hover:text-teal-400">▶</span>
                    </button>
                ))}
            </div>
            
            {/* System Status Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 text-[9px] font-mono text-slate-600 text-center">
                SYSTEM STATUS: <span className="text-green-500">ONLINE</span> • PROTOCOL: v2.4.9
            </div>
        </div>

      </div>
    </div>
  );
};
