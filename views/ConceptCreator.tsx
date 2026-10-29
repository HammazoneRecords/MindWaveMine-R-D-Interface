
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { FabricationItem } from '../types';

interface ConceptCreatorProps {
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => void;
  onComplete: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export const ConceptCreator: React.FC<ConceptCreatorProps> = ({ addLog, onComplete, searchQuery, setSearchQuery, onSearch }) => {
  const [items, setItems] = useState<FabricationItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Manual Create State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', description: '' });
  const [previewOutput, setPreviewOutput] = useState<string | null>(null);

  useEffect(() => {
    refreshItems();
  }, []);

  const refreshItems = async () => {
    try {
      const list = await api.getFabrications();
      setItems(list);
    } catch (e) { console.error(e); }
  };

  // --- Modal Logic ---
  
  const openModal = async () => {
    try {
        const s = await api.getSuggestions();
        setFormData({ id: s.next_id, title: '', description: '' });
        setPreviewOutput(null);
        setShowModal(true);
    } catch(e) { console.error(e); }
  };

  const runSimulation = async () => {
    try {
      const args = ['--id', formData.id, '--title', formData.title, '--dry-run'];
      if (formData.description) args.push('--description', formData.description);
      const res = await api.runScript('scaffold_new_concept.py', args);
      if (res.return_code === 0) setPreviewOutput(res.stdout);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!showModal) return;
    const timer = setTimeout(() => {
        if (formData.title && formData.id) runSimulation();
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.title, formData.id, formData.description, showModal]);

  const handleCreate = async () => {
    setLoading(true);
    addLog('Initiating Manual Fabrication...', 'INFO');
    try {
      const args = ['--id', formData.id, '--title', formData.title];
      if (formData.description) args.push('--description', formData.description);

      const res = await api.runScript('scaffold_new_concept.py', args);
      if (res.return_code === 0) {
        addLog(`Unit ${formData.id} fabricated successfully`, 'SUCCESS', res.stdout);
        setShowModal(false);
        onComplete();
        refreshItems(); // Refresh board
      } else {
        addLog('Fabrication Failure', 'ERROR', res.stderr);
      }
    } catch (e) {
      addLog('Error', 'ERROR', String(e));
    } finally {
      setLoading(false);
    }
  };

  // --- Kanban Columns ---
  const COLUMNS = [
    { id: 'concept', label: 'CONCEPTS', color: 'border-purple-500' },
    { id: 'idea', label: 'IDEAS', color: 'border-cyan-500' },
    { id: 'biz', label: 'BIZ IDEAS', color: 'border-green-500' },
    { id: 'invariant', label: 'INVARIANTS', color: 'border-red-500' },
    { id: 'claim', label: 'CLAIMS', color: 'border-orange-500' },
  ];

  return (
    <div className="h-full flex flex-col max-w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-8">
            <div className="flex items-center">
                <div className="w-10 h-10 border-2 border-purple-500 bg-purple-900/10 flex items-center justify-center mr-4 text-purple-300 font-bold text-lg font-['Rajdhani'] shadow-[0_0_25px_rgba(168,85,247,0.3)] rotate-45">
                <span className="-rotate-45">02</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-['Rajdhani'] uppercase tracking-widest text-glow">
                Knowledge <span className="text-purple-500">Matrix</span>
                </h2>
            </div>
            
            {/* SEARCH BAR (Moved from Sidebar) */}
            <form onSubmit={onSearch} className="relative group w-96">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="MATRIX SEARCH..." 
                    className="w-full bg-black/40 border-b border-purple-500/50 focus:border-purple-400 text-xs px-3 py-2 text-purple-300 font-mono placeholder:text-purple-700/50 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
                />
                <button type="submit" className="absolute right-2 top-2 text-[10px] text-purple-500 hover:text-purple-300">
                    🔍
                </button>
            </form>
        </div>

        <button 
            onClick={openModal}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs font-['Rajdhani'] transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
            + Fabricate New Node
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-max px-2">
            {COLUMNS.map(col => (
                <div key={col.id} className="w-80 flex flex-col glass-panel rounded-sm border-t-2 border-white/5 relative bg-black/20">
                    {/* Col Header */}
                    <div className={`p-4 border-b border-white/5 bg-black/40 border-l-4 ${col.color}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold font-['JetBrains_Mono'] tracking-[0.2em] text-slate-300">{col.label}</span>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                                {items.filter(i => i.type === col.id).length}
                            </span>
                        </div>
                    </div>
                    
                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                        {items.filter(i => i.type === col.id).length === 0 && (
                            <div className="text-center text-[10px] text-slate-600 font-mono mt-10 italic">EMPTY BUFFER</div>
                        )}
                        {items.filter(i => i.type === col.id).map(item => (
                            <div key={item.id} className="bg-white/5 border border-white/10 p-4 hover:border-white/30 transition-all hover:bg-white/10 group relative">
                                <p className="text-xs text-slate-200 font-['Rajdhani'] font-medium mb-3 leading-relaxed">
                                    {item.content}
                                </p>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                    <span className="text-[9px] text-cyan-500 font-mono truncate max-w-[120px]" title={item.source}>
                                        🔗 {item.source}
                                    </span>
                                    <div className="flex gap-1">
                                        {item.tags?.map(t => (
                                            <span key={t} className="text-[8px] bg-slate-800 text-slate-400 px-1 border border-slate-700">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-slate-500 hover:text-white">⋮</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Manual Creation Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8">
            <div className="glass-panel w-full max-w-2xl border-t border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold font-['Rajdhani'] uppercase tracking-widest text-purple-300">Manual Node Fabrication</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">[ ESC ]</button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block mb-2">ID</label>
                            <input 
                                value={formData.id} 
                                onChange={e => setFormData({...formData, id: e.target.value})}
                                className="w-full bg-black/40 border-b border-slate-600 px-3 py-2 text-white font-mono text-center focus:border-purple-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block mb-2">Designation</label>
                            <input 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                autoFocus
                                placeholder="ENTER TITLE..."
                                className="w-full bg-black/40 border-b border-slate-600 px-3 py-2 text-white font-['Rajdhani'] text-lg focus:border-purple-500 outline-none placeholder:text-slate-700" 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block mb-2">Parameters</label>
                        <textarea 
                             value={formData.description}
                             onChange={e => setFormData({...formData, description: e.target.value})}
                             rows={3}
                             className="w-full bg-black/40 border border-slate-700 p-3 text-white font-['Rajdhani'] focus:border-purple-500 outline-none text-sm"
                        />
                    </div>

                    <div className="bg-black/30 p-4 border-l-2 border-purple-500/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Preview Output</div>
                        <div className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap h-20 overflow-y-auto scrollbar-thin">
                            {previewOutput || '... Awaiting Data ...'}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                    <button onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest">Cancel</button>
                    <button 
                        onClick={handleCreate}
                        disabled={loading || !formData.title}
                        className="px-8 py-3 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-500 hover:text-white text-purple-200 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {loading ? 'MATERIALIZING...' : 'CONFIRM FABRICATION'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
