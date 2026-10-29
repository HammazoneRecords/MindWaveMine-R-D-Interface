
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogType, FabricationItem } from '../types';
import { api } from '../services/api';
import { GoogleGenAI } from "@google/genai";

interface LogViewerProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

type ViewerTab = 'logs' | 'chat';

export const LogViewer: React.FC<LogViewerProps> = ({ logs, isOpen, onToggle, onClear }) => {
  const [activeTab, setActiveTab] = useState<ViewerTab>('logs');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'logs') endRef.current?.scrollIntoView({ behavior: 'smooth' });
      else chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, chatHistory, isOpen, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      // RAG: Fetch all concepts and fabrications for context
      const fabrications = await api.getFabrications();
      const contextText = fabrications
        .map(f => `[${f.type.toUpperCase()}] Source: ${f.source} | Content: ${f.content}`)
        .join('\n');
      
      // Initialize Gemini API client correctly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Call generateContent with text prompt and systemInstruction in config
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `SYSTEM CONTEXT: You are the MindWave Neural Interface. You have access to the research database below. Use it to answer the user query accurately and with the persona of an advanced research AI.
              
RESEARCH DATABASE:
${contextText}

USER QUERY: ${userMessage}`,
        config: {
          systemInstruction: "Respond in a sleek, technical, yet helpful tone. Refer to concepts by their source and type if relevant. If information is not in the database, indicate that you are accessing general galactic knowledge. Maintain the Andromedan tech agency persona.",
          temperature: 0.2,
        }
      });

      // Directly access .text property from response
      const aiText = response.text || "Neural connection timeout. Re-linking...";
      setChatHistory(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "CRITICAL: Neural handshake failure. Check API key status." }]);
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`fixed bottom-0 left-[288px] right-0 border-t border-purple-500/50 transition-all duration-300 flex flex-col z-50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl bg-[#0f0c29]/95 ${isOpen ? 'h-96' : 'h-10'}`}>
      
      {/* Header Bar */}
      <div 
        className="flex items-center justify-between px-6 h-10 bg-purple-900/10 cursor-pointer hover:bg-purple-900/20 select-none border-b border-white/5"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-6 h-full font-['JetBrains_Mono']">
          {/* Status + Log Tab */}
          <div className="flex items-center space-x-3 h-full">
            <div className={`w-2 h-2 bg-green-400 rounded-full ${logs.length > 0 ? 'animate-pulse' : ''} shadow-[0_0_8px_#4ade80]`}></div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(!isOpen) onToggle(); setActiveTab('logs'); }}
              className={`text-[11px] font-bold tracking-widest uppercase transition-all flex items-center h-full px-1 ${activeTab === 'logs' ? 'text-purple-100' : 'text-purple-500 hover:text-purple-300'}`}
            >
              NEURAL LINK STREAM
              <span className="mx-2 text-purple-900 opacity-50">::</span>
              <span className="text-[10px] opacity-70">PACKETS: {logs.length}</span>
            </button>
          </div>

          {/* New Chat Tab (Indicated by blue circle in screenshot) */}
          <button 
            onClick={(e) => { e.stopPropagation(); if(!isOpen) onToggle(); setActiveTab('chat'); }}
            className={`text-[11px] font-bold tracking-widest uppercase transition-all flex items-center h-full px-4 border-l border-r border-white/5 ${activeTab === 'chat' ? 'text-cyan-300 bg-cyan-900/10 shadow-[inset_0_-2px_0_#22d3ee]' : 'text-purple-500 hover:text-cyan-400'}`}
          >
            NEURAL CHAT AI
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-6">
           <button 
             onClick={(e) => { e.stopPropagation(); onToggle(); }}
             className="text-[10px] text-purple-400/60 hover:text-white uppercase tracking-[0.2em]"
           >
             [ {isOpen ? 'MINIMIZE' : 'EXPAND'} ]
           </button>
           
           {activeTab === 'logs' ? (
             <button 
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="text-[10px] text-red-500 font-bold border border-red-500/30 px-3 py-1 bg-red-950/20 hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
             >
               PURGE BUFFER
             </button>
           ) : (
             <button 
                onClick={(e) => { e.stopPropagation(); setChatHistory([]); }}
                className="text-[10px] text-cyan-500 font-bold border border-cyan-500/30 px-3 py-1 bg-cyan-950/20 hover:bg-cyan-500 hover:text-white transition-all uppercase tracking-wider"
             >
               CLEAR LINK
             </button>
           )}
        </div>
      </div>

      {/* Panel Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Scanlines Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>
        
        {activeTab === 'logs' ? (
          <div className="h-full overflow-auto p-4 font-['JetBrains_Mono'] text-[11px] scrollbar-thin relative z-10">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-purple-900/30 italic tracking-[0.3em] font-mono">
                AWAITING DATA PACKETS...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="mb-1 pb-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 py-1 transition-colors group">
                  <div className="flex items-start">
                    <span className="text-slate-600 mr-4 shrink-0 select-none opacity-40">[{log.timestamp}]</span>
                    <span className={`font-bold mr-4 shrink-0 uppercase tracking-widest w-24 text-right ${
                      log.type === LogType.ERROR ? 'text-red-500' :
                      log.type === LogType.SUCCESS ? 'text-green-400' :
                      log.type === LogType.COMMAND ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-slate-300 whitespace-pre-wrap group-hover:text-white transition-colors">{log.message}</span>
                  </div>
                  {log.detail && (
                    <div className="ml-[144px] mt-1 text-cyan-200/50 whitespace-pre-wrap bg-cyan-900/5 p-3 rounded-sm border-l border-cyan-500/20 text-[10px] italic">
                      {log.detail}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col z-10 relative">
            {/* RAG Chat History */}
            <div className="flex-1 overflow-auto p-6 space-y-4 scrollbar-thin">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-cyan-500/20 space-y-3">
                  <div className="text-5xl animate-pulse">≋</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.5em]">Neural Interface Online</div>
                  <div className="text-[9px] font-mono opacity-60">I have indexed {logs.length} telemetry packets and your research database.</div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Fix: use double quotes for the ternary result strings to avoid breaking syntax when class name contains single quotes (Tailwind arbitrary values) */}
                  <div className={`max-w-[75%] p-4 rounded-sm border ${
                    msg.role === 'user' 
                      ? "bg-purple-900/10 border-purple-500/20 text-purple-100 font-['Rajdhani']" 
                      : "bg-cyan-900/10 border-cyan-500/20 text-cyan-100 font-mono text-[11px] leading-relaxed italic"
                  }`}>
                    <div className="text-[9px] uppercase tracking-[0.2em] opacity-30 mb-2 font-bold">
                      {msg.role === 'user' ? 'Scientist' : 'Andromedan Core'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-sm flex items-center space-x-2">
                      <div className="text-[9px] font-mono text-cyan-500 uppercase animate-pulse">Processing...</div>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                      </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* AI Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-cyan-500/20 flex gap-4 backdrop-blur-md">
              <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="PROMPT THE CORE (e.g. 'Summarize Dyson Swarm concept')"
                className="flex-1 bg-black/50 border border-cyan-900/50 focus:border-cyan-500 px-4 py-3 text-cyan-100 font-['Rajdhani'] text-sm outline-none transition-all placeholder:text-cyan-900/30"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="px-8 py-3 bg-cyan-900/20 border border-cyan-500/40 hover:bg-cyan-500 hover:text-white text-cyan-300 transition-all uppercase font-bold text-xs tracking-widest disabled:opacity-20"
              >
                Invoke
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
