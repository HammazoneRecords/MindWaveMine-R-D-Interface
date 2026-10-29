
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IngestedFile, ExtractionResult } from '../types';

interface NeuralBridgeProps {
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => void;
}

type TabType = 'concepts' | 'ideas' | 'claims' | 'tags';

export const NeuralBridge: React.FC<NeuralBridgeProps> = ({ addLog }) => {
  // Ingestion States
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<IngestedFile | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('concepts');

  // Transmission States
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffData, setHandoffData] = useState({ batch: '', nextBatch: '', summary: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const fileList = await api.listIngestedFiles();
      setFiles(fileList);
      
      const suggestions = await api.getSuggestions();
      setHandoffData(prev => ({
        ...prev,
        batch: suggestions.current_batch || '',
        nextBatch: suggestions.next_batch || ''
      }));
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      const fileList: File[] = Array.from(e.target.files);
      addLog(`Ingesting ${fileList.length} artifacts...`, 'INFO');
      for (const file of fileList) {
        try {
          await api.uploadFile(file);
          addLog(`Secured: ${file.name}`, 'SUCCESS');
        } catch (error) { addLog(`Ingest Failed: ${file.name}`, 'ERROR'); }
      }
      await loadInitialData();
      setUploading(false);
    }
  };

  const handleAnalyze = async (file: IngestedFile) => {
    setAnalyzing(true);
    setExtraction(null);
    addLog(`Scanning Artifact: ${file.name}`, 'COMMAND');
    try {
      const result = await api.extractConcepts(file.name);
      setExtraction(result);
      addLog('Neural Scan Complete.', 'SUCCESS');
    } catch (e) { addLog('Scan Malfunction', 'ERROR', String(e)); }
    finally { setAnalyzing(false); }
  };

  const linkToReport = (content: string) => {
    setHandoffData(prev => ({
      ...prev,
      summary: prev.summary ? `${prev.summary}\n• ${content}` : `• ${content}`
    }));
    addLog('Insight linked to Transmission summary.', 'SUCCESS');
  };

  const executeHandoff = async () => {
    if (!handoffData.summary) {
        addLog('Mission summary required for transmission.', 'ERROR');
        return;
    }
    setHandoffLoading(true);
    addLog('Executing Transmission Protocol...', 'COMMAND');
    try {
        await api.runScript('generate_handoff_prompt.py', ['--batch', handoffData.batch]);
        const res = await api.runScript('update_project_minutes_batch.py', [
            '--batch', handoffData.batch,
            '--summary', handoffData.summary,
            '--next-batch', handoffData.nextBatch
        ]);
        if (res.return_code === 0) {
            addLog('PROTOCOL COMPLETE. SESSION ARCHIVED.', 'SUCCESS');
            setHandoffData(prev => ({ ...prev, summary: '' }));
            await loadInitialData();
        } else {
            addLog('Archive Failed', 'ERROR', res.stderr);
        }
    } catch (e: any) {
        addLog('Critical Handshake Failure', 'ERROR', e.message);
    } finally {
        setHandoffLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 animate-slide-up">
      
      {/* Workflow Header Status */}
      <div className="glass-panel p-3 border-l-4 border-cyan-500 rounded-sm flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${files.length > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'}`}></span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Buffer: {files.length}</span>
          </div>
          <div className="text-slate-600">»</div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${extraction ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`}></span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Analysis: {extraction ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="text-slate-600">»</div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${handoffData.summary ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`}></span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Egress: {handoffData.batch}</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-cyan-500/50 uppercase">Neural Bridge v2.0 // Synced</div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* Left: INGRESS (Data Stream) */}
        <div className="w-80 flex flex-col gap-4 shrink-0">
          <div className="glass-panel p-4 flex flex-col items-center justify-center border-dashed border-2 border-slate-700 hover:border-orange-500 transition-all relative group h-32">
            <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <span className="text-2xl mb-1 text-slate-600 group-hover:text-orange-400">⍗</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingest Artifacts</span>
          </div>
          
          <div className="flex-1 glass-panel overflow-hidden flex flex-col">
            <div className="p-3 bg-black/20 border-b border-white/5 text-[9px] font-bold text-orange-400 uppercase tracking-widest">Artifact Buffer</div>
            <div className="flex-1 overflow-auto scrollbar-thin">
              {files.map(f => (
                <button 
                  key={f.name}
                  onClick={() => { setSelectedFile(f); setExtraction(null); }}
                  className={`w-full text-left p-3 border-b border-white/5 transition-all flex items-center justify-between group ${selectedFile?.name === f.name ? 'bg-orange-900/20 border-l-2 border-orange-500' : 'hover:bg-white/5 border-l-2 border-transparent'}`}
                >
                  <div className="truncate">
                    <div className={`text-xs font-bold truncate ${selectedFile?.name === f.name ? 'text-white' : 'text-slate-400'}`}>{f.name}</div>
                    <div className="text-[8px] text-slate-600 uppercase font-mono">{f.type} • {(f.size/1024).toFixed(0)}kb</div>
                  </div>
                  {selectedFile?.name === f.name && <span className="text-orange-500 text-[10px]">▶</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: SYNTHESIS (Processor) */}
        <div className="flex-1 glass-panel flex flex-col overflow-hidden relative border-white/5 bg-black/30">
          {selectedFile ? (
            <>
              <div className="p-3 border-b border-white/5 bg-black/40 flex justify-between items-center z-10">
                <span className="text-[10px] font-bold text-white uppercase font-['Rajdhani'] tracking-widest truncate max-w-[200px]">{selectedFile.name}</span>
                <button 
                  onClick={() => handleAnalyze(selectedFile)} 
                  disabled={analyzing}
                  className="px-4 py-1 bg-orange-900/20 border border-orange-500/50 text-[10px] text-orange-300 hover:bg-orange-500 hover:text-white transition-all uppercase font-bold shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                >
                  {analyzing ? 'SCANNING...' : 'NEURAL SCAN'}
                </button>
              </div>
              
              <div className="flex-1 relative bg-dots-pattern flex flex-col overflow-hidden">
                {/* Visualizer Content */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                    {selectedFile.type === 'image' ? (
                        <img 
                            src={selectedFile.url} 
                            alt="Artifact" 
                            className={`max-w-full max-h-full object-contain border border-white/10 shadow-2xl transition-all duration-700 ${extraction ? 'opacity-30 blur-[2px]' : 'opacity-100'}`} 
                        />
                    ) : (
                        <iframe 
                            src={selectedFile.url} 
                            className={`w-full h-full border-none bg-black/40 text-slate-300 p-8 font-mono transition-all duration-700 ${extraction ? 'opacity-30 blur-[2px]' : 'opacity-100'}`} 
                            title="viewer" 
                            sandbox="allow-scripts allow-same-origin" 
                        />
                    )}

                    {/* Analyzing Hologram */}
                    {analyzing && (
                        <div className="absolute inset-0 bg-orange-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-30">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/10 to-transparent animate-pulse"></div>
                            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4 shadow-[0_0_30px_rgba(249,115,22,0.3)]"></div>
                            <div className="text-orange-400 font-mono text-[11px] font-bold tracking-[0.3em] animate-pulse">SYNTHESIZING VECTORS</div>
                            <div className="mt-2 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 animate-[slide_2s_infinite_linear]" style={{width: '30%'}}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Extraction Results Bottom Drawer */}
                {extraction && (
                  <div className="h-1/2 bg-slate-900/95 border-t border-orange-500/40 flex flex-col animate-slide-up z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
                    <div className="flex border-b border-white/10 bg-black/60 backdrop-blur-md">
                      {(['concepts', 'ideas', 'claims', 'tags'] as TabType[]).map(t => (
                        <button 
                            key={t} 
                            onClick={() => setActiveTab(t)} 
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-900/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                          {t} <span className="text-[8px] opacity-40 ml-1">
                            {t === 'concepts' ? extraction.concepts_found.length + extraction.potential_concepts.length : (extraction as any)[t]?.length || 0}
                          </span>
                        </button>
                      ))}
                      <button onClick={() => setExtraction(null)} className="px-6 text-slate-500 hover:text-white transition-colors border-l border-white/5">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-5 scrollbar-thin bg-black/20">
                      {activeTab === 'concepts' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[9px] text-green-500/50 uppercase font-bold tracking-widest mb-2">Identified Patterns</h4>
                                <div className="flex flex-wrap gap-2">
                                    {extraction.concepts_found.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-green-900/20 border border-green-500/30 text-green-300 text-[10px] font-mono rounded-sm">{c}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[9px] text-orange-500/50 uppercase font-bold tracking-widest mb-2">Potential Concepts</h4>
                                <div className="flex flex-wrap gap-2">
                                    {extraction.potential_concepts.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-orange-900/20 border border-orange-500/30 text-orange-200 text-[10px] font-mono rounded-sm">{c}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                      )}
                      {activeTab === 'ideas' && (
                        <div className="space-y-3">
                          {extraction.ideas.map((id, i) => (
                            <div key={i} className="flex gap-2 group items-center">
                              <div className="flex-1 p-3 bg-purple-900/10 border-l-2 border-purple-500/50 text-slate-200 text-[11px] font-['Rajdhani'] leading-relaxed">{id}</div>
                              <button 
                                onClick={() => linkToReport(id)} 
                                className="opacity-0 group-hover:opacity-100 px-3 py-2 text-[9px] text-cyan-400 hover:text-white border border-cyan-500/30 transition-all font-bold uppercase tracking-widest bg-cyan-900/10"
                              >
                                LINK +
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'claims' && (
                        <div className="space-y-3">
                          {extraction.patent_claims.map((cl, i) => (
                            <div key={i} className="flex gap-2 group items-center">
                              <div className="flex-1 p-3 bg-blue-900/10 border-l-2 border-blue-500/50 text-blue-100 text-[11px] font-['Rajdhani'] leading-relaxed italic">
                                <span className="text-blue-500 font-bold mr-2">CLAIM:</span>{cl}
                              </div>
                              <button 
                                onClick={() => linkToReport(cl)} 
                                className="opacity-0 group-hover:opacity-100 px-3 py-2 text-[9px] text-cyan-400 hover:text-white border border-cyan-500/30 transition-all font-bold uppercase tracking-widest bg-cyan-900/10"
                              >
                                LINK +
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'tags' && (
                        <div className="flex flex-wrap gap-2">
                          {extraction.jhanos_tags.map((tg, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700 tracking-wider">#{tg}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <div className="text-6xl mb-4 animate-pulse">≋</div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Neural Loop Idle</span>
              <p className="text-[8px] mt-2 font-mono">SELECT ARTIFACT FROM BUFFER</p>
            </div>
          )}
        </div>

        {/* Right: EGRESS (Transmission) */}
        <div className="w-96 glass-panel flex flex-col border-l-4 border-purple-500/50 bg-purple-900/5 relative">
          <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
            <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em]">Transmission Matrix</h3>
            <span className="text-[8px] font-mono text-purple-700">READY</span>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-6 scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 font-mono">Current Sector</label>
                <input readOnly value={handoffData.batch} className="w-full bg-black/20 border border-slate-800 px-2 py-2 text-slate-400 text-[11px] font-mono outline-none" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-cyan-500 uppercase mb-1 font-mono">Next Vector</label>
                <input value={handoffData.nextBatch} onChange={e => setHandoffData({...handoffData, nextBatch: e.target.value})} className="w-full bg-black/40 border border-cyan-500/20 px-2 py-2 text-white text-[11px] font-mono focus:border-cyan-500 outline-none transition-all" />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[350px]">
              <label className="block text-[8px] font-bold text-slate-400 uppercase mb-2 tracking-widest">End-Cycle Mission Log</label>
              <textarea 
                value={handoffData.summary}
                onChange={e => setHandoffData({...handoffData, summary: e.target.value})}
                placeholder="Extract insights from processing or enter manually..."
                className="flex-1 w-full bg-black/40 border border-white/5 p-4 text-xs text-white font-['Rajdhani'] focus:border-purple-500 outline-none resize-none leading-relaxed shadow-inner placeholder:opacity-30"
              />
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <button 
              onClick={executeHandoff}
              disabled={handoffLoading || !handoffData.summary}
              className="w-full py-4 bg-purple-900/30 border border-purple-500/40 hover:bg-purple-600 hover:text-white text-purple-200 transition-all uppercase font-bold text-xs tracking-[0.2em] font-['Rajdhani'] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="relative z-10">{handoffLoading ? 'TRANSMITTING SIGNAL...' : 'EXECUTE HANDOFF'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
