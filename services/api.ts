
import { ScriptResult, SuggestionResponse, WorkspaceStatus, IngestedFile, ExtractionResult, FabricationItem, SearchResult } from '../types';

// TOGGLE THIS TO FALSE WHEN YOUR PYTHON BACKEND IS RUNNING
const USE_MOCK = true; 
const API_BASE = 'http://127.0.0.1:8000/api';

// --- Mock Data & Helpers (Fallback) ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_FILES: IngestedFile[] = [
  { name: 'intercepted_signal_alpha.txt', size: 1024, type: 'text', url: 'https://raw.githubusercontent.com/gist/404/dummy.txt', lastModified: Date.now() },
  { name: 'sector_map_v4.png', size: 2048576, type: 'image', url: 'https://images.unsplash.com/photo-1614730341194-75c60740a2d3?q=80&w=1000&auto=format&fit=crop', lastModified: Date.now() - 100000 },
  { name: 'xenolith_scan.json', size: 512, type: 'text', url: '', lastModified: Date.now() - 500000 },
];

const MOCK_FABRICATIONS: FabricationItem[] = [
  { id: 'fab_1', type: 'concept', content: 'Zero Point Energy', source: 'mission_brief.txt', created_at: Date.now(), tags: ['PHYSICS'] },
  { id: 'fab_2', type: 'idea', content: 'Use bio-luminescent interfaces for organic data visualization.', source: 'sector_map_v4.png', created_at: Date.now() - 10000, tags: ['UX'] },
  { id: 'fab_3', type: 'claim', content: 'A method for extracting consciousness into a digital substrate.', source: 'xenolith_scan.json', created_at: Date.now() - 50000, tags: ['IP'] },
  { id: 'fab_4', type: 'biz', content: 'Sell spare compute cycles to the Grid.', source: 'intercepted_signal_alpha.txt', created_at: Date.now() - 20000, tags: ['REVENUE'] },
  { id: 'fab_5', type: 'invariant', content: 'The user must always confirm destruction.', source: 'Manual Entry', created_at: Date.now() - 90000, tags: ['RULE'] },
];

const mockApi = {
  checkHealth: async (): Promise<boolean> => {
    await delay(500);
    return true;
  },

  getWorkspaceStatus: async (): Promise<WorkspaceStatus> => {
    await delay(800);
    return {
      path: '/usr/local/mindwave/sector_7',
      isValid: true,
      conceptCount: 142,
      hasDb: true,
      lastRun: new Date().toISOString()
    };
  },

  setWorkspacePath: async (path: string): Promise<WorkspaceStatus> => {
    await delay(600);
    return {
      path,
      isValid: true,
      conceptCount: 142,
      hasDb: true
    };
  },

  getSuggestions: async (): Promise<SuggestionResponse> => {
    await delay(400);
    return {
      next_id: '042',
      current_batch: 'mw_009',
      next_batch: 'mw_010'
    };
  },

  runScript: async (scriptName: string, args: string[] = []): Promise<ScriptResult> => {
    await delay(1500);
    return {
      success: true,
      stdout: `[MOCK EXECUTION] ${scriptName} completed successfully.\nArgs: ${args.join(' ')}\n\nDone.`,
      stderr: '',
      return_code: 0
    };
  },
  
  backupDb: async (): Promise<ScriptResult> => {
    await delay(1000);
    return { success: true, stdout: "Database backed up to mindwave.db.bak", stderr: "", return_code: 0 };
  },

  uploadFile: async (file: File): Promise<IngestedFile> => {
    await delay(1200);
    return {
      name: file.name,
      size: file.size,
      type: file.type.startsWith('image') ? 'image' : 'text',
      url: URL.createObjectURL(file), // Create local blob URL for preview
      lastModified: Date.now()
    };
  },

  listIngestedFiles: async (): Promise<IngestedFile[]> => {
    await delay(600);
    return MOCK_FILES;
  },

  extractConcepts: async (filename: string): Promise<ExtractionResult> => {
    await delay(2000); // Simulate processing time
    // Also simulate adding to MOCK_FABRICATIONS for the session
    MOCK_FABRICATIONS.unshift({
        id: `fab_${Math.random()}`,
        type: 'idea',
        content: `New idea extracted from ${filename}`,
        source: filename,
        created_at: Date.now(),
        tags: ['NEW']
    });
    return {
      concepts_found: ['Neural Lattice', 'Zero Point Energy', 'Dyson Swarm'],
      potential_concepts: ['Hyper-Voxel', 'Chrono-Synclastic Infundibulum'],
      ideas: [
        'Propagate signals through quantum tunneling to reduce latency.',
        'Use bio-luminescent interfaces for organic data visualization.'
      ],
      patent_claims: [
        'A method for extracting consciousness into a digital substrate comprising...',
        'The system wherein the neural link is bidirectional...'
      ],
      jhanos_tags: ['SECTOR:ALPHA', 'SECURITY:LEVEL_5', 'ORIGIN:UNKNOWN']
    };
  },

  getFabrications: async (): Promise<FabricationItem[]> => {
    await delay(400);
    return MOCK_FABRICATIONS;
  },

  search: async (query: string): Promise<SearchResult[]> => {
    await delay(2000); // Wait 2s for matrix effect to look cool
    const results: SearchResult[] = [];
    const q = query.toLowerCase();

    // Mock search logic
    MOCK_FABRICATIONS.forEach(f => {
      if (f.content.toLowerCase().includes(q) || f.source.toLowerCase().includes(q)) {
        results.push({
          id: f.id,
          type: 'fabrication',
          title: `[${f.type.toUpperCase()}] ${f.content.substring(0, 30)}...`,
          snippet: f.content,
          match_score: 10
        });
      }
    });

    MOCK_FILES.forEach(f => {
       if (f.name.toLowerCase().includes(q)) {
         results.push({
           id: f.name,
           type: 'file',
           title: f.name,
           snippet: `Ingested artifact: ${f.type}`,
           match_score: 8
         })
       }
    });

    return results;
  }
};

// --- Real API ---

const realApi = {
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
    if (!res.ok) throw new Error('Failed to get workspace status');
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
    if (!res.ok) throw new Error(`Failed to run ${scriptName}`);
    return res.json();
  },
  
  backupDb: async (): Promise<ScriptResult> => {
    const res = await fetch(`${API_BASE}/runner/backup-db`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to backup database');
    return res.json();
  },

  uploadFile: async (file: File): Promise<IngestedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/ingest/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
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
    if (!res.ok) throw new Error('Extraction failed');
    return res.json();
  },

  getFabrications: async (): Promise<FabricationItem[]> => {
    const res = await fetch(`${API_BASE}/fabrications`);
    if (!res.ok) return [];
    return res.json();
  },

  search: async (query: string): Promise<SearchResult[]> => {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  }
};

export const api = USE_MOCK ? mockApi : realApi;
