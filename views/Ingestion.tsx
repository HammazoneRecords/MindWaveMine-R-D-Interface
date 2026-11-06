
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { IngestedFile, ExtractionResult } from '../types';

interface IngestionProps {
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => void;
}

type TabType = 'concepts' | 'ideas' | 'claims' | 'tags';

export const Ingestion: React.FC<IngestionProps> = ({ addLog }) => {
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<IngestedFile | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('concepts');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const list = await api.listIngestedFiles();
      setFiles(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      const fileList: File[] = Array.from(e.target.files);
      addLog(`Initiating Batch Ingestion: ${fileList.length} artifacts...`, 'INFO');
      
      for (const file of fileList) {
        try {
          await api.uploadFile(file);
          addLog(`Artifact secured: ${file.name}`, 'SUCCESS');
        } catch (error) {
          addLog(`Failed to ingest ${file.name}`, 'ERROR');
        }
      }
      
      await loadFiles();
      setUploading(false);
    }
  };

  const handleAnalyze = async (file: IngestedFile) => {
    setAnalyzing(true);
    setExtraction(null);
    addLog(`Initiating Neural Scan on ${file.name}...`, 'COMMAND');
    try {
      const result = await api.extractConcepts(file.name);
      setExtraction(result);
      addLog('Scan Complete. Patterns identified.', 'SUCCESS');
    } catch (e) {
      addLog('Scan Malfunction', 'ERROR', String(e));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      
      {/* Left Panel: Ingestion Deck */}
      <div className="md:w-1/3 flex flex-col gap-6">
        
        {/* Header */}
        <div className="glass-panel p-6 rounded-sm border-t border-orange-500/30">
          <h2 className="text-2xl font-bold text-white font-['Rajdhani'] uppercase tracking-widest text-glow mb-1">
            Data <span className="text-orange-500">Stream</span>
          </h2>
          <p className="text-slate-400 font-mono tracking-widest text-[10px]">EXTERNAL ARTIFACT PROCESSING</p>
        </div>

        {/* Upload Zone */}
        <div className="relative group">
          <input 
            type="file" 
            multiple
            onChange={handleFileSelect} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
            disabled={uploading}
          />
          <div className={`glass-panel p-8 border-2 border-dashed ${uploading ? 'border-orange-500 bg-orange-900/10' : 'border-slate-700 hover:border-orange-400 hover:bg-white/5'} transition-all rounded-sm flex flex-col items-center justify-center text-center`}>
             <div className="text-4xl mb-2 text-slate-500 group-hover:text-orange-400 transition-colors">⍗</div>
             <p className="text-xs font-bold uppercase tracking-widest text-slate-300 font-['Rajdhani']">
               {uploading ? 'BUFFERING...' : 'DROP FABRICATIONS HERE'}
             </p>
             <p className="text-[8px] text-slate-500 font-mono mt-2">SUPPORT: TXT, MD, PNG, JPG, JSON</p>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 glass-panel p-0 overflow-hidden rounded-sm relative min-h-[300px]">
           <div className="p-4 border-b border-white/5 bg-black/20">
             <h3 className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.2em] font-['JetBrains_Mono']">Buffered Artifacts</h3>
           </div>
           <div className="overflow-auto h-full pb-16 scrollbar-thin">
             {files.length === 0 && (
               <div className="p-8 text-center text-slate-600 text-xs font-mono">NO ARTIFACTS DETECTED</div>
             )}
             {files.map(file => (
               <button
                 key={file.name}
                 onClick={() => { setSelectedFile(file); setExtraction(null); }}
                 className={`w-full text-left p-4 border-b border-white/5 flex items-center justify-between group transition-all ${selectedFile?.name === file.name ? 'bg-orange-900/20 border-l-2 border-l-orange-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
               >
                 <div className="truncate pr-2">
                   <div className={`font-bold font-['Rajdhani'] text-sm truncate ${selectedFile?.name === file.name ? 'text-white' : 'text-slate-400 group-hover:text-orange-200'}`}>{file.name}</div>
                   <div className="text-[8px] text-slate-600 font-mono uppercase">{file.type} • {(file.size / 1024).toFixed(1)} KB</div>
                 </div>
                 <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">►</div>
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Right Panel: Analysis Matrix */}
      <div className="md:w-2/3 glass-panel p-0 rounded-sm relative flex flex-col overflow-hidden border border-white/5">
         
         {selectedFile ? (
           <>
             {/* Toolbar */}
             <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center z-20 relative">
                <div className="flex items-center space-x-3">
                   <span className="text-orange-400 text-xs font-bold uppercase font-['JetBrains_Mono'] tracking-widest">Artifact Viewer</span>
                   <span className="text-slate-600">|</span>
                   <span className="text-slate-300 font-['Rajdhani'] tracking-wide">{selectedFile.name}</span>
                </div>
                <div className="flex space-x-2">
                   <button 
                     onClick={() => handleAnalyze(selectedFile)}
                     disabled={analyzing}
                     className={`px-4 py-1 border text-[10px] font-bold uppercase tracking-wider transition-all ${analyzing ? 'border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-orange-900/20 border-orange-500/50 hover:bg-orange-500 hover:text-white text-orange-300'}`}
                   >
                     {analyzing ? 'SCANNING...' : 'INITIATE SCAN'}
                   </button>

                   <a 
                     href={selectedFile.url} 
                     target="_blank" 
                     rel="noreferrer"
                     className="px-3 py-1 border border-slate-700 hover:border-white text-[10px] text-slate-400 hover:text-white font-mono uppercase transition-colors"
                   >
                     Raw View ↗
                   </a>
                </div>
             </div>

             {/* Interactive Viewer Content */}
             <div className="flex-1 overflow-auto bg-black/50 relative flex flex-col">
                <div className="flex-1 p-6 flex justify-center bg-dots-pattern relative">
                  
                  {/* Visual Content */}
                  {selectedFile.type === 'image' ? (
                    <img src={selectedFile.url} alt="Artifact" className={`max-h-[500px] object-contain border border-slate-800 shadow-2xl transition-all duration-500 ${extraction ? 'opacity-40 blur-sm' : 'opacity-100'}`} />
                  ) : selectedFile.rawText ? (
                    <div className={`w-full h-full min-h-[400px] bg-black/60 border border-slate-800 p-6 text-slate-300 font-mono text-xs overflow-auto whitespace-pre-wrap leading-relaxed transition-all duration-500 ${extraction ? 'opacity-40 blur-sm' : 'opacity-100'}`}>
                      <div className="text-[10px] text-orange-400/70 border-b border-white/5 pb-2 mb-4 uppercase tracking-widest flex justify-between">
                        <span>Terminal Buffer // {selectedFile.name}</span>
                        <span>Size: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      {selectedFile.rawText}
                    </div>
                  ) : (
                    <iframe 
                        src={selectedFile.url} 
                        className={`w-full h-full min-h-[400px] bg-white/5 border border-slate-700 text-slate-300 font-mono p-4 transition-all duration-500 ${extraction ? 'opacity-40 blur-sm' : 'opacity-100'}`} 
                        title="Text Viewer" 
                        sandbox="allow-scripts allow-same-origin"
                    />
                  )}

                  {/* Loading State */}
                  {analyzing && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30 pointer-events-none">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                            <div className="text-orange-400 font-mono text-xs animate-pulse">CHUNKING DATA STREAM...</div>
                        </div>
                     </div>
                  )}
                </div>

                {/* Extraction Results Drawer */}
                {extraction && (
                  <div className="bg-slate-900/95 border-t border-orange-500/30 flex flex-col h-[50%] absolute bottom-0 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40 animate-slide-up">
                     
                     {/* Drawer Tabs */}
                     <div className="flex border-b border-white/5">
                        {[
                          { id: 'concepts', label: 'Concepts', count: extraction.concepts_found.length + extraction.potential_concepts.length },
                          { id: 'ideas', label: 'Ideas', count: extraction.ideas.length },
                          { id: 'claims', label: 'Claims', count: extraction.patent_claims.length },
                          { id: 'tags', label: 'Jhanos Tags', count: extraction.jhanos_tags.length }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id as TabType); }}
                            className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest font-['JetBrains_Mono'] transition-colors ${activeTab === tab.id ? 'bg-orange-900/20 text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            {tab.label} <span className="opacity-50 ml-1">[{tab.count}]</span>
                          </button>
                        ))}
                        <button onClick={(e) => { e.stopPropagation(); setExtraction(null); }} className="px-4 text-slate-500 hover:text-white">✕</button>
                     </div>

                     {/* Drawer Content */}
                     <div className="flex-1 overflow-auto p-6 scrollbar-thin bg-black/40">
                        
                        {activeTab === 'concepts' && (
                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <h4 className="text-[9px] text-green-500/70 uppercase mb-3">Known Patterns</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {extraction.concepts_found.length > 0 ? extraction.concepts_found.map((c, i) => (
                                       <span key={i} className="px-2 py-1 bg-green-900/20 border border-green-500/30 text-green-300 text-[10px] font-mono rounded-sm">{c}</span>
                                    )) : <span className="text-slate-600 text-[10px] italic">No Matches</span>}
                                 </div>
                              </div>
                              <div>
                                 <h4 className="text-[9px] text-orange-500/70 uppercase mb-3">Potential Entities</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {extraction.potential_concepts.length > 0 ? extraction.potential_concepts.slice(0,20).map((c, i) => (
                                       <span key={i} className="px-2 py-1 bg-orange-900/20 border border-orange-500/30 text-orange-300 text-[10px] font-mono rounded-sm">{c}</span>
                                    )) : <span className="text-slate-600 text-[10px] italic">No Matches</span>}
                                 </div>
                              </div>
                           </div>
                        )}

                        {activeTab === 'ideas' && (
                           <div className="space-y-2">
                              {extraction.ideas.length > 0 ? extraction.ideas.map((idea, i) => (
                                <div key={i} className="p-3 bg-white/5 border-l-2 border-purple-500 text-slate-300 text-xs font-mono">
                                  {idea}
                                </div>
                              )) : <div className="text-center text-slate-600 text-xs italic mt-4">No abstract concepts detected.</div>}
                           </div>
                        )}

                        {activeTab === 'claims' && (
                           <div className="space-y-2">
                              {extraction.patent_claims.length > 0 ? extraction.patent_claims.map((claim, i) => (
                                <div key={i} className="p-3 bg-blue-900/10 border border-blue-500/20 text-blue-200 text-xs font-['Rajdhani']">
                                  <span className="text-blue-500 font-bold mr-2">CLAIM {i+1}:</span> {claim}
                                </div>
                              )) : <div className="text-center text-slate-600 text-xs italic mt-4">No IP claims detected.</div>}
                           </div>
                        )}

                        {activeTab === 'tags' && (
                           <div className="flex flex-wrap gap-3">
                              {extraction.jhanos_tags.map((tag, i) => (
                                 <div key={i} className="px-3 py-1 bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-mono uppercase tracking-wider">
                                    #{tag}
                                 </div>
                              ))}
                           </div>
                        )}

                     </div>
                  </div>
                )}
             </div>

           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
             <div className="text-6xl mb-4 opacity-20">◈</div>
             <p className="text-xs uppercase tracking-[0.2em] font-['Rajdhani']">Select Artifact to Initialize Viewer</p>
           </div>
         )}

      </div>

    </div>
  );
};
