
import React, { useState, useEffect } from 'react';
import { LogViewer } from './components/LogViewer';
import { MatrixRain } from './components/MatrixRain';
import { Dashboard } from './views/Dashboard';
import { ConceptCreator } from './views/ConceptCreator';
import { NeuralBridge } from './views/NeuralBridge';
import { Settings } from './views/Settings';
import { LogEntry, LogType, WorkspaceStatus, SearchResult } from './types';
import { api } from './services/api';

const TABS = [
  { id: 'dashboard', label: 'COMMAND DECK', icon: '◈' },
  { id: 'matrix', label: 'MATRIX', icon: '✛' },
  { id: 'bridge', label: 'NEURAL BRIDGE', icon: '⟿' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceStatus>({
    path: '',
    isValid: false,
    conceptCount: 0,
    hasDb: false
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const addLog = (message: string, type: LogType | 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: type as LogType,
      message,
      detail
    }]);
    if (type === LogType.ERROR) {
      setIsLogOpen(true);
    }
  };

  const refreshWorkspace = async () => {
    try {
      setConnectionError(false);
      const status = await api.getWorkspaceStatus();
      setWorkspace(status);
    } catch (e) {
      console.error("Failed to load workspace", e);
      setConnectionError(true);
    }
  };

  useEffect(() => {
    refreshWorkspace();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);
    addLog(`Initiating Global Search Matrix: "${searchQuery}"`, LogType.COMMAND);

    try {
        const results = await api.search(searchQuery);
        setTimeout(() => {
            setSearchResults(results);
            setIsSearching(false);
            addLog(`Matrix Search Complete. ${results.length} vectors found.`, LogType.SUCCESS);
        }, 2000); 
    } catch (e) {
        addLog('Matrix Search Failed', LogType.ERROR, String(e));
        setIsSearching(false);
    }
  };

  if (connectionError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f0c29] text-white relative overflow-hidden font-['Rajdhani']">
        <div className="absolute inset-0 bg-red-900/10 animate-pulse"></div>
        <div className="glass-panel p-12 border border-red-500/30 text-center max-w-md relative z-10 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
           <div className="text-6xl text-red-500 mb-4 animate-bounce">⚠️</div>
           <h1 className="text-3xl font-bold uppercase tracking-widest text-red-500 text-glow mb-2">Neural Link Severed</h1>
           <p className="text-slate-400 font-mono text-xs mb-8">
             Unable to establish connection with Mainframe (Backend).<br/>
             Ensure Protocol 8000 is active.
           </p>
           <button 
             onClick={refreshWorkspace}
             className="px-8 py-3 bg-red-900/20 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-300 uppercase font-bold tracking-widest transition-all text-sm"
           >
             Retry Handshake
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative overflow-hidden">
      <MatrixRain isActive={isSearching} />
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>

      <div className="w-72 h-full flex flex-col shrink-0 z-10 glass-panel border-r border-white/5 relative">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.6)]"></div>
             <h1 className="text-2xl font-bold tracking-[0.2em] text-white text-glow">
              MINDWAVE
            </h1>
          </div>
          <p className="text-[10px] text-cyan-300/60 font-mono tracking-widest pl-1">
            :: ANDROMEDAN AI ::
          </p>
        </div>
        
        <nav className="flex-1 px-4 space-y-3 mt-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-6 py-4 rounded-sm transition-all duration-300 border-l-2 relative overflow-hidden group ${
                activeTab === tab.id 
                  ? 'border-purple-500 bg-white/5 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="relative z-10 flex items-center justify-between">
                <span className="font-bold tracking-widest text-sm font-['Rajdhani']">
                  {tab.label}
                </span>
                <span className="text-xs opacity-50 font-mono group-hover:text-cyan-400 transition-colors">{tab.icon}</span>
              </div>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5 bg-black/20">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-between p-2 text-xs text-purple-400 hover:text-white transition-colors group"
          >
            <span className="font-['JetBrains_Mono'] uppercase tracking-widest">Sys. Calibration</span>
            <span className="group-hover:rotate-90 transition-transform duration-500">⚙</span>
          </button>
          <div className="mt-2 text-[10px] text-cyan-300/50 font-['JetBrains_Mono'] truncate text-center">
            {workspace.path ? workspace.path.split('/').pop() : 'NO_LINK'}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative h-full z-10">
        <main className="flex-1 overflow-auto pb-12 px-8 py-6 scrollbar-thin">
           {activeTab === 'dashboard' && (
             <Dashboard 
                workspace={workspace} 
                addLog={addLog} 
                refreshWorkspace={refreshWorkspace} 
                onNavigate={setActiveTab}
             />
           )}
           {activeTab === 'matrix' && (
             <ConceptCreator 
               addLog={addLog} 
               onComplete={refreshWorkspace} 
               searchQuery={searchQuery}
               setSearchQuery={setSearchQuery}
               onSearch={handleSearch}
             />
           )}
           {activeTab === 'bridge' && (
             <NeuralBridge addLog={addLog} />
           )}
        </main>

        <LogViewer 
          logs={logs} 
          isOpen={isLogOpen} 
          onToggle={() => setIsLogOpen(!isLogOpen)} 
          onClear={() => setLogs([])}
        />
      </div>

      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-10">
          <div className="max-w-3xl w-full relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white font-mono text-xl"
            >
              [ CLOSE ]
            </button>
            <Settings workspace={workspace} refreshWorkspace={refreshWorkspace} addLog={addLog} />
          </div>
        </div>
      )}

      {searchResults && (
         <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-10">
            <div className="max-w-4xl w-full h-[80vh] flex flex-col glass-panel border border-green-500/30">
                <div className="flex justify-between items-center p-6 border-b border-green-500/20 bg-green-900/10">
                    <h2 className="text-xl font-bold font-['Rajdhani'] uppercase tracking-widest text-green-400">Search: {searchQuery}</h2>
                    <button onClick={() => setSearchResults(null)} className="text-green-500">[ ESC ]</button>
                </div>
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    {searchResults.map((result, idx) => (
                        <div key={idx} className="p-4 bg-black/40 border-l-2 border-green-500/50 hover:bg-green-900/20 transition-all cursor-pointer">
                            <h4 className="text-green-300 font-bold">{result.title}</h4>
                            <p className="text-slate-400 text-xs font-mono mt-2">{result.snippet}</p>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
