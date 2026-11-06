import {
  ScriptResult,
  SuggestionResponse,
  WorkspaceStatus,
  IngestedFile,
  ExtractionResult,
  FabricationItem,
  SearchResult,
  WorkflowCheckItem,
  InvariantRecord
} from '../types';

const API_BASE = '/api';

export const api = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  getWorkspaceStatus: async (): Promise<WorkspaceStatus> => {
    const res = await fetch(`${API_BASE}/workspace/status`);
    if (!res.ok) throw new Error('Failed to fetch workspace telemetry');
    return res.json();
  },

  setWorkspacePath: async (path: string): Promise<WorkspaceStatus> => {
    const res = await fetch(`${API_BASE}/workspace/path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error('Failed to set workspace path');
    return res.json();
  },

  getSuggestions: async (): Promise<SuggestionResponse> => {
    const res = await fetch(`${API_BASE}/workspace/suggest`);
    if (!res.ok) throw new Error('Failed to get suggestions');
    return res.json();
  },

  runScript: async (scriptName: string, args: string[] = []): Promise<ScriptResult> => {
    const res = await fetch(`${API_BASE}/runner/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: scriptName, args }),
    });
    if (!res.ok) throw new Error(`Execution error running ${scriptName}`);
    return res.json();
  },

  backupDb: async (): Promise<ScriptResult> => {
    const res = await fetch(`${API_BASE}/runner/backup-db`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to backup core memory');
    return res.json();
  },

  uploadFile: async (file: File): Promise<IngestedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/ingest/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('File buffering failed');
    return res.json();
  },

  listIngestedFiles: async (): Promise<IngestedFile[]> => {
    const res = await fetch(`${API_BASE}/ingest/list`);
    if (!res.ok) return [];
    return res.json();
  },

  extractConcepts: async (filename: string): Promise<ExtractionResult> => {
    const res = await fetch(`${API_BASE}/ingest/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) throw new Error('Neural extraction failed');
    return res.json();
  },

  getFabrications: async (): Promise<FabricationItem[]> => {
    const res = await fetch(`${API_BASE}/fabrications`);
    if (!res.ok) return [];
    return res.json();
  },

  addFabrication: async (item: Partial<FabricationItem>): Promise<FabricationItem> => {
    const res = await fetch(`${API_BASE}/fabrications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to fabricate node');
    return res.json();
  },

  deleteFabrication: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/fabrications/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  search: async (query: string): Promise<SearchResult[]> => {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  },

  getWorkflowStatus: async (): Promise<{
    currentBatch: string;
    nextBatch: string;
    activeConceptId: string;
    lastRunDate: string;
    overallStatus: 'STABLE' | 'DRIFT' | 'IN_PROGRESS';
    invariantsCount: number;
    checks: WorkflowCheckItem[];
    invariants: InvariantRecord[];
  }> => {
    const res = await fetch(`${API_BASE}/workflow/status`);
    if (!res.ok) throw new Error('Failed to load workflow state');
    return res.json();
  },

  toggleWorkflowCheck: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/workflow/check-toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error('Failed to toggle check');
    return res.json();
  },

  verifyECheck: async (invariantId: string, quote: string, conceptDocText: string): Promise<{
    success: boolean;
    valid: boolean;
    details: string;
  }> => {
    const res = await fetch(`${API_BASE}/workflow/verify-e-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invariantId, quote, conceptDocText })
    });
    if (!res.ok) throw new Error('E-Check verification failed');
    return res.json();
  },

  chatWithCore: async (message: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || 'Neural link failed');
    }
    const data = await res.json();
    return data.reply;
  }
};
