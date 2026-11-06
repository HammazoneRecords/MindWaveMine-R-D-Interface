import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WorkflowCheckItem, InvariantRecord, LogType } from '../types';

interface WorkflowProtocolProps {
  addLog: (msg: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'COMMAND', detail?: string) => void;
  refreshWorkspace: () => void;
}

export const WorkflowProtocol: React.FC<WorkflowProtocolProps> = ({ addLog, refreshWorkspace }) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'invariants' | 'e_checker'>('checklist');
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'phase_a' | 'phase_b' | 'phase_c' | 'enhancement'>('all');
  const [checks, setChecks] = useState<WorkflowCheckItem[]>([]);
  const [invariants, setInvariants] = useState<InvariantRecord[]>([]);
  const [currentBatch, setCurrentBatch] = useState('mw_115');
  const [nextBatch, setNextBatch] = useState('mw_116');
  const [overallStatus, setOverallStatus] = useState<'STABLE' | 'DRIFT' | 'IN_PROGRESS'>('STABLE');
  const [runningChecks, setRunningChecks] = useState(false);

  // E-Check Interactive Sandbox
  const [testQuote, setTestQuote] = useState('The quantum lattice propagates excitation vectors across nearest-neighbor nodes within one Planck interval.');
  const [testDoc, setTestDoc] = useState(
    '# mw_115 Quantum Substrate Lattice\n\n' +
    '## Description\n' +
    'The quantum lattice propagates excitation vectors across nearest-neighbor nodes within one Planck interval.\n' +
    'This architecture stabilizes the local frame while preserving receipt chains.\n\n' +
    '## Canonical invariant quotes (Source Code, for traceability)\n' +
    '- "The quantum lattice propagates excitation vectors across nearest-neighbor nodes within one Planck interval."'
  );
  const [eCheckResult, setECheckResult] = useState<{ valid: boolean; details: string } | null>(null);

  useEffect(() => {
    loadWorkflowState();
  }, []);

  const loadWorkflowState = async () => {
    try {
      const state = await api.getWorkflowStatus();
      setChecks(state.checks);
      setInvariants(state.invariants);
      setCurrentBatch(state.currentBatch);
      setNextBatch(state.nextBatch);
      setOverallStatus(state.overallStatus);
    } catch (e) {
      console.error('Failed to load workflow protocol', e);
    }
  };

  const handleToggleCheck = async (id: string) => {
    try {
      const res = await api.toggleWorkflowCheck(id);
      if (res.success) {
        setChecks(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed, verified: !c.completed } : c));
        addLog(`Protocol Check [${id}] toggled`, 'INFO');
      }
    } catch (e) {
      addLog('Failed to toggle check', 'ERROR', String(e));
    }
  };

  const handleRunCoherenceChecks = async () => {
    setRunningChecks(true);
    addLog('Executing MindWave Coherence & E-Check Validator...', 'COMMAND');
    try {
      const res = await api.runScript('run_mindwave_checks.py');
      if (res.return_code === 0) {
        addLog('MindWave Coherence: 100% PASS', 'SUCCESS', res.stdout);
        // Mark Phase C as verified
        setChecks(prev => prev.map(c => c.phase === 'phase_c' ? { ...c, completed: true, verified: true } : c));
        setOverallStatus('STABLE');
      } else {
        addLog('MindWave Checks Failed', 'ERROR', res.stderr);
        setOverallStatus('DRIFT');
      }
      refreshWorkspace();
    } catch (e) {
      addLog('Validation Failure', 'ERROR', String(e));
    } finally {
      setRunningChecks(false);
    }
  };

  const handleRunECheckTest = async () => {
    try {
      const res = await api.verifyECheck('INV_TEST', testQuote, testDoc);
      setECheckResult({ valid: res.valid, details: res.details });
      addLog(res.valid ? 'E-Check Verification Succeeded' : 'E-Check Verification Failed', res.valid ? 'SUCCESS' : 'ERROR', res.details);
    } catch (e) {
      addLog('E-Check Execution Error', 'ERROR', String(e));
    }
  };

  const filteredChecks = selectedPhase === 'all'
    ? checks
    : checks.filter(c => c.phase === selectedPhase);

  const completedCount = checks.filter(c => c.completed).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up pb-16">
      
      {/* Top Protocol Header */}
      <div className="glass-panel p-6 rounded-sm border-t border-purple-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-purple-900/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold text-sm font-mono">
              §9
            </div>
            <h1 className="text-2xl font-bold tracking-widest text-white uppercase text-glow font-['Rajdhani']">
              MindWave <span className="text-purple-400">Workflow Protocol</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wider mt-1 pl-11">
            GOVERNANCE: RECEIPT CHAIN (mw_92) · CANONICAL GATE E-CHECK (mw_99) · TRI-LENS (mw_102)
          </p>
        </div>

        {/* Telemetry Status Strip */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">Active Frame</span>
            <span className="font-mono text-sm font-bold text-cyan-400">{currentBatch}</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">Next Target</span>
            <span className="font-mono text-sm font-bold text-purple-400">{nextBatch}</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">Protocol Health</span>
            <span className={`font-mono text-sm font-bold ${overallStatus === 'STABLE' ? 'text-green-400' : 'text-amber-400'}`}>
              {overallStatus}
            </span>
          </div>
          <button
            onClick={handleRunCoherenceChecks}
            disabled={runningChecks}
            className="px-5 py-2.5 bg-cyan-950/40 border border-cyan-500/50 hover:bg-cyan-500 hover:text-white text-cyan-300 text-xs font-bold uppercase tracking-widest font-['Rajdhani'] transition-all disabled:opacity-50"
          >
            {runningChecks ? 'VERIFYING...' : 'RUN COHERENCE CHECK'}
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-widest font-['Rajdhani'] transition-all ${
            activeTab === 'checklist'
              ? 'bg-purple-900/30 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Checklist Matrix [{completedCount}/{checks.length}]
        </button>
        <button
          onClick={() => setActiveTab('invariants')}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-widest font-['Rajdhani'] transition-all ${
            activeTab === 'invariants'
              ? 'bg-purple-900/30 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Canonical Invariants [{invariants.length}]
        </button>
        <button
          onClick={() => setActiveTab('e_checker')}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-widest font-['Rajdhani'] transition-all ${
            activeTab === 'e_checker'
              ? 'bg-purple-900/30 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          E-Check Sandbox (mw_99)
        </button>
      </div>

      {/* TAB 1: CHECKLIST MATRIX */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          
          {/* Phase Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/30 p-1 rounded-sm border border-white/5">
              {[
                { id: 'all', label: 'All Protocols' },
                { id: 'phase_a', label: 'Phase A: Doc & Register' },
                { id: 'phase_b', label: 'Phase B: Extract Invariants' },
                { id: 'phase_c', label: 'Phase C: Validate & Record' },
                { id: 'enhancement', label: 'Enhancement (E1–E8)' }
              ].map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id as any)}
                  className={`px-3 py-1.5 text-[10px] uppercase font-bold font-['JetBrains_Mono'] tracking-wider rounded-sm transition-colors ${
                    selectedPhase === phase.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {phase.label}
                </button>
              ))}
            </div>
            
            <div className="text-[11px] font-mono text-slate-400">
              Rule: <span className="text-cyan-400">One concept = one doc.</span> No duplicate numbers.
            </div>
          </div>

          {/* Checks Grid */}
          <div className="grid grid-cols-1 gap-3">
            {filteredChecks.map(item => (
              <div
                key={item.id}
                onClick={() => handleToggleCheck(item.id)}
                className={`p-4 glass-panel border transition-all cursor-pointer group flex items-start gap-4 ${
                  item.completed
                    ? 'border-purple-500/40 bg-purple-950/10'
                    : 'border-white/5 hover:border-white/20 bg-black/20'
                }`}
              >
                {/* Custom Square Checkbox */}
                <div
                  className={`w-5 h-5 rounded-sm shrink-0 border flex items-center justify-center mt-0.5 transition-colors ${
                    item.completed
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'border-slate-600 group-hover:border-purple-400'
                  }`}
                >
                  {item.completed && <span className="text-xs">✓</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-purple-300 font-mono text-[10px] font-bold rounded-sm">
                        {item.code}
                      </span>
                      <h3 className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-wide">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {item.phase.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                    {item.rule}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-slate-500">
                    <span>Principle: {item.governingPrinciple}</span>
                    {item.evidence && (
                      <>
                        <span>·</span>
                        <span className="text-cyan-400">Evidence: {item.evidence}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: CANONICAL INVARIANTS */}
      {activeTab === 'invariants' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-sm border-l-2 border-purple-500/50 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-widest">
                Canonical Invariants Registry (03_INVARIANTS.md)
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                TRI-LENS STRUCTURE: SOURCE CODE (VERBATIM ENGLISH) + SOLOBIC LOGIC + IMPLEMENTATION
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              Verified Coverage: {invariants.filter(i => i.canonicalDocQuoteVerified).length}/{invariants.length}
            </span>
          </div>

          <div className="space-y-4">
            {invariants.map(inv => (
              <div key={inv.id} className="glass-panel p-5 rounded-sm border border-white/5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-purple-900/40 border border-purple-500/50 text-purple-200 font-mono text-xs font-bold">
                      {inv.id}
                    </span>
                    <span className="text-white font-bold font-['Rajdhani'] text-sm tracking-wide">
                      {inv.conceptTitle} ({inv.conceptId})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-slate-500">Anchor: #{inv.anchor}</span>
                    {inv.lineReference && (
                      <span className="text-cyan-400">Line: L{inv.lineReference}</span>
                    )}
                    <span className={inv.canonicalDocQuoteVerified ? 'text-green-400' : 'text-red-400'}>
                      {inv.canonicalDocQuoteVerified ? '● CANONICAL QUOTE VERIFIED' : '▲ PENDING VERIFICATION'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Lens 1: Source Code Quote */}
                  <div className="bg-black/40 p-3 border border-white/5 rounded-sm">
                    <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold block mb-1">
                      Lens 1: Source Code (Verbatim)
                    </span>
                    <p className="text-slate-200 italic leading-relaxed">
                      "{inv.sourceCodeQuote}"
                    </p>
                  </div>

                  {/* Lens 2: Solobic Logic */}
                  <div className="bg-black/40 p-3 border border-white/5 rounded-sm">
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block mb-1">
                      Lens 2: Solobic Logic
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {inv.solobicLogic}
                    </p>
                  </div>

                  {/* Lens 3: Implementation */}
                  <div className="bg-black/40 p-3 border border-white/5 rounded-sm">
                    <span className="text-[9px] uppercase tracking-wider text-orange-400 font-bold block mb-1">
                      Lens 3: Implementation Code
                    </span>
                    <code className="text-orange-200 text-[11px] block overflow-x-auto">
                      {inv.implementation}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: E-CHECK SANDBOX */}
      {activeTab === 'e_checker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4 rounded-sm border-t border-cyan-500/40">
            <div>
              <h3 className="text-base font-bold text-white font-['Rajdhani'] uppercase tracking-widest">
                E-Check Canonical Gate Validator (mw_99)
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                "No invariant is canonical until it survives E—every Source Code quote must be traceable to the concept doc."
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                Target Source Code Quote (Single-line, no ellipsis)
              </label>
              <textarea
                value={testQuote}
                onChange={e => setTestQuote(e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-slate-700 p-3 text-xs font-mono text-cyan-100 focus:border-cyan-400 outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-purple-400 font-bold mb-1">
                Target Concept Document (Canonical Quotes Section)
              </label>
              <textarea
                value={testDoc}
                onChange={e => setTestDoc(e.target.value)}
                rows={7}
                className="w-full bg-black/50 border border-slate-700 p-3 text-xs font-mono text-slate-200 focus:border-purple-400 outline-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleRunECheckTest}
              className="w-full py-3 bg-cyan-900/30 border border-cyan-500/50 hover:bg-cyan-500 hover:text-white text-cyan-200 font-bold uppercase tracking-widest text-xs font-['Rajdhani'] transition-all"
            >
              Verify Canonical Gate (E-Check)
            </button>
          </div>

          <div className="glass-panel p-6 space-y-4 rounded-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 font-['Rajdhani'] uppercase tracking-widest border-b border-white/5 pb-2">
                Verification Verdict
              </h3>
              
              {eCheckResult ? (
                <div className={`p-6 mt-4 border rounded-sm ${
                  eCheckResult.valid
                    ? 'bg-green-950/20 border-green-500/40 text-green-300'
                    : 'bg-red-950/20 border-red-500/40 text-red-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2 font-bold font-mono text-sm">
                    <span>{eCheckResult.valid ? '● GATE PASSED' : '▲ GATE REJECTED'}</span>
                  </div>
                  <p className="text-xs font-mono leading-relaxed">
                    {eCheckResult.details}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-600 font-mono text-xs italic mt-6">
                  Awaiting input evaluation... Run verification to test quote against concept document text.
                </div>
              )}
            </div>

            <div className="p-4 bg-black/30 border border-white/5 text-[11px] font-mono text-slate-400 space-y-2">
              <span className="text-cyan-400 font-bold block uppercase tracking-wider text-[10px]">
                Receipt Chain Rules (mw_92):
              </span>
              <p>• Concept Doc → Canonical Quotes Section → 03_INVARIANTS.md → Coherence Checker.</p>
              <p>• Single-line quote ending with period or semicolon. No ellipsis (mw_65: witnessing not summary).</p>
              <p>• Whitespace normalization is applied before substring search.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
