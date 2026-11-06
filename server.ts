import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const STORAGE_DIR = path.join(__dirname, 'storage');
const INGEST_DIR = path.join(STORAGE_DIR, 'ingested');
const DB_FILE = path.join(STORAGE_DIR, 'mindwave_data.json');

// Ensure storage directories exist
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(INGEST_DIR)) fs.mkdirSync(INGEST_DIR, { recursive: true });

// Setup Multer for Ingestion uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, INGEST_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({ storage });

// Default Initial Database
const DEFAULT_DATA = {
  workspace: {
    path: '/usr/local/mindwave/sector_7',
    isValid: true,
    hasDb: true,
    conceptCount: 142,
    lastRun: new Date().toISOString()
  },
  suggestions: {
    next_id: '116',
    current_batch: 'mw_115',
    next_batch: 'mw_116'
  },
  files: [
    {
      name: 'mission_brief_mw115.txt',
      storedName: 'mission_brief_mw115.txt',
      size: 1420,
      type: 'text',
      lastModified: Date.now() - 3600000,
      id: 'file_001',
      rawText: 'MindWave Batch mw_115: Invariant verification and canonical receipts.\nScope: Frame stabilization (mw_11), TrueWill boundary enforcement (mw_72), Tri-Lens logic (mw_102).'
    },
    {
      name: 'sector_lattice_map.png',
      storedName: 'sector_lattice_map.png',
      size: 2048576,
      type: 'image',
      lastModified: Date.now() - 7200000,
      id: 'file_002'
    },
    {
      name: 'xenolith_quantum_scan.json',
      storedName: 'xenolith_quantum_scan.json',
      size: 890,
      type: 'text',
      lastModified: Date.now() - 14400000,
      id: 'file_003',
      rawText: '{\n  "resonance": 432.8,\n  "coherence": 0.998,\n  "entropy_damping": true,\n  "target_sector": "mw_116_quantum_substrate"\n}'
    }
  ],
  concepts: [
    '011_frame_stabilization',
    '065_witnessing_not_summary',
    '072_truewill_coherence',
    '092_receipt_chain_traceability',
    '099_canonical_gate_e_check',
    '102_tri_lens_verification',
    '115_quantum_substrate_lattice'
  ],
  fabrications: [
    {
      id: 'fab_1',
      type: 'concept',
      content: 'Zero Point Resonance Lattice (mw_115)',
      source: 'mission_brief_mw115.txt',
      created_at: Date.now() - 500000,
      tags: ['PHYSICS', 'CORE', 'mw_115']
    },
    {
      id: 'fab_2',
      type: 'idea',
      content: 'Use bio-luminescent fiber nodes for quantum optical state diagnostics.',
      source: 'sector_lattice_map.png',
      created_at: Date.now() - 400000,
      tags: ['UX', 'HARDWARE']
    },
    {
      id: 'fab_3',
      type: 'claim',
      content: 'A deterministic mechanism for cryptographic receipt chain validation across asynchronous node handoffs.',
      source: 'xenolith_quantum_scan.json',
      created_at: Date.now() - 300000,
      tags: ['IP', 'PATENT']
    },
    {
      id: 'fab_4',
      type: 'biz',
      content: 'License real-time invariant verification oracle to distributed AI agent clusters.',
      source: 'Internal Protocol',
      created_at: Date.now() - 200000,
      tags: ['REVENUE', 'ORACLE']
    },
    {
      id: 'fab_5',
      type: 'invariant',
      content: 'INV:MW115_1 — Every Source Code quote in 03_INVARIANTS must be an exact substring of the concept document.',
      source: 'WORKFLOW_REFERENCE.md',
      created_at: Date.now() - 100000,
      tags: ['RULE', 'E_CHECK']
    }
  ],
  workflowChecks: [
    {
      id: 'A1',
      phase: 'phase_a',
      code: 'A1',
      title: 'Create Concept Doc',
      rule: 'Create mindwave/mw_XX_snake_case_name.md (XX zero-padded, snake_case)',
      governingPrinciple: 'One concept = one doc. No duplicate numbers.',
      completed: true,
      verified: true,
      evidence: 'Created mw_115_quantum_substrate_lattice.md'
    },
    {
      id: 'A2',
      phase: 'phase_a',
      code: 'A2',
      title: 'Register in 00_INDEX.md',
      rule: 'Add one row to mindwave/00_INDEX.md: | NN | [mw_NN_name](mw_NN_name.md) | description |',
      governingPrinciple: 'Global table of all canonical units',
      completed: true,
      verified: true,
      evidence: 'Row 115 registered in 00_INDEX.md'
    },
    {
      id: 'A3',
      phase: 'phase_a',
      code: 'A3',
      title: 'Bidirectional Related Links',
      rule: 'Add Related: in the new doc. In each linked doc, add this mw_XX to its Related line (bidirectional).',
      governingPrinciple: 'No orphaned nodes, bidirectional link graph',
      completed: true,
      verified: true,
      evidence: 'Linked to mw_92, mw_99, mw_102'
    },
    {
      id: 'A4',
      phase: 'phase_a',
      code: 'A4',
      title: 'Section in 03_INVARIANTS.md',
      rule: 'In mindwave/03_INVARIANTS.md add ## From mw_NN -- Title header',
      governingPrinciple: 'Central invariant registry anchor',
      completed: true,
      verified: true
    },
    {
      id: 'A5',
      phase: 'phase_a',
      code: 'A5',
      title: 'Update INVARIANTS_INDEX_template.md',
      rule: 'Add concept block and table (Invariant | Code | Link to 03)',
      governingPrinciple: 'Quick navigation index for test suites',
      completed: true,
      verified: true
    },
    {
      id: 'A6',
      phase: 'phase_a',
      code: 'A6',
      title: 'Concept Doc Invariant Link',
      rule: 'In new concept doc, link to INVARIANTS_INDEX_template and §5',
      governingPrinciple: 'Bidirectional link to rules',
      completed: true,
      verified: true
    },
    {
      id: 'B7',
      phase: 'phase_b',
      code: 'B7',
      title: 'Derive Invariants From Concept Doc Only',
      rule: 'Read concept doc; derive invariants only from this doc (no generic templates)',
      governingPrinciple: 'Authentic domain derivation',
      completed: true,
      verified: true
    },
    {
      id: 'B8',
      phase: 'phase_b',
      code: 'B8',
      title: 'Extraction Checklist & Tri-Lens',
      rule: 'Apply checklist: verbatim single-line quote (no ellipsis); Tri-Lens (English + Code + Math)',
      governingPrinciple: 'Witnessing not summary (mw_65) & Tri-Lens (mw_102)',
      completed: true,
      verified: true
    },
    {
      id: 'B9',
      phase: 'phase_b',
      code: 'B9',
      title: 'Write Invariants in 03_INVARIANTS.md',
      rule: 'Under ## From mw_NN, write ### Invariant N: (INV:MWNN_...) with anchors {#inv-mwNN-...}',
      governingPrinciple: 'Permanent canonical invariant anchors',
      completed: true,
      verified: true
    },
    {
      id: 'B10',
      phase: 'phase_b',
      code: 'B10',
      title: 'Update Invariant Index Table',
      rule: 'Add table rows: Invariant | Code | Link to 03 (#L<line>)',
      governingPrinciple: 'Traceability index row count sync',
      completed: true,
      verified: true
    },
    {
      id: 'B11',
      phase: 'phase_b',
      code: 'B11',
      title: 'Canonical Invariant Quotes in Doc',
      rule: 'Add section: "Canonical invariant quotes (Source Code, for traceability)" with exact phrases',
      governingPrinciple: 'Receipt chain (mw_92): doc -> canonical quotes -> 03 -> validator',
      completed: true,
      verified: true
    },
    {
      id: 'C12',
      phase: 'phase_c',
      code: 'C12',
      title: 'Run Coherence Checks & E-Check',
      rule: 'Run python mindwave/MW_SCRIPTS/run_mindwave_checks.py; E-check must pass (exit code 0)',
      governingPrinciple: 'Canonical gate: no invariant canonical until it survives E (mw_99)',
      completed: true,
      verified: true
    },
    {
      id: 'C13',
      phase: 'phase_c',
      code: 'C13',
      title: 'Update Project Minutes',
      rule: 'Update project_minutes.md: Last Updated, Batch summary, invariant coverage, next batch range',
      governingPrinciple: 'Eternal history and continuity audit',
      completed: true,
      verified: true
    },
    {
      id: 'E1',
      phase: 'enhancement',
      code: 'E1',
      title: 'Enhancement Clarity Decision',
      rule: 'Enhancement adds clarity. If it adds confusion, make no changes.',
      governingPrinciple: 'Do no harm to stable concepts',
      completed: true,
      verified: true
    },
    {
      id: 'E2',
      phase: 'enhancement',
      code: 'E2',
      title: 'Non-Contradictory Doc Update',
      rule: 'Edit mw_XX_*.md with clarity-preserving additions; never remove existing invariants',
      governingPrinciple: 'Preserve existing invariants (mw_72)',
      completed: true,
      verified: true
    },
    {
      id: 'E7',
      phase: 'enhancement',
      code: 'E7',
      title: 'Re-run Coherence Checker',
      rule: 'Run run_mindwave_checks.py from repo root after enhancement; E check must pass',
      governingPrinciple: 'TrueWill frame stabilization (mw_11, mw_72)',
      completed: true,
      verified: true
    }
  ],
  invariants: [
    {
      id: 'INV:MW115_1',
      conceptId: 'mw_115',
      conceptTitle: 'Quantum Substrate Lattice',
      sourceCodeQuote: 'The quantum lattice propagates excitation vectors across nearest-neighbor nodes within one Planck interval.',
      solobicLogic: 'Latency minimization requires immediate topological neighbor delegation.',
      implementation: 'lattice.propagate_vector(target=neighbors, max_latency=PLANCK_INTERVAL)',
      anchor: 'inv-mw115-lattice-prop',
      canonicalDocQuoteVerified: true,
      lineReference: 142
    },
    {
      id: 'INV:MW115_2',
      conceptId: 'mw_115',
      conceptTitle: 'Quantum Substrate Lattice',
      sourceCodeQuote: 'No excitation vector may be extinguished without committing an irreversible receipt to the audit ledger.',
      solobicLogic: 'Receipt chain preservation ensures full historical reproducibility.',
      implementation: 'audit_ledger.commit_receipt(vector.id, vector.signature)',
      anchor: 'inv-mw115-vector-receipt',
      canonicalDocQuoteVerified: true,
      lineReference: 168
    },
    {
      id: 'INV:MW099_1',
      conceptId: 'mw_099',
      conceptTitle: 'Canonical Gate E Check',
      sourceCodeQuote: 'No invariant is canonical until it survives E—every Source Code quote must be traceable to the concept doc.',
      solobicLogic: 'Only verified verbatim substrings pass the canonical validator gate.',
      implementation: 'assert canonical_quotes.contains(normalize_whitespace(invariant.quote))',
      anchor: 'inv-mw099-e-check-gate',
      canonicalDocQuoteVerified: true,
      lineReference: 88
    }
  ]
};

// JSON Database Helper
class JsonDatabase {
  data: typeof DEFAULT_DATA;

  constructor() {
    this.data = this.load();
  }

  load(): typeof DEFAULT_DATA {
    if (!fs.existsSync(DB_FILE)) {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.save();
      return this.data;
    }
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge defaults in case of missing keys
      this.data = {
        ...DEFAULT_DATA,
        ...parsed,
        workspace: { ...DEFAULT_DATA.workspace, ...parsed.workspace },
        suggestions: { ...DEFAULT_DATA.suggestions, ...parsed.suggestions },
        files: parsed.files || DEFAULT_DATA.files,
        concepts: parsed.concepts || DEFAULT_DATA.concepts,
        fabrications: parsed.fabrications || DEFAULT_DATA.fabrications,
        workflowChecks: parsed.workflowChecks || DEFAULT_DATA.workflowChecks,
        invariants: parsed.invariants || DEFAULT_DATA.invariants
      };
      return this.data;
    } catch (err) {
      console.error('Failed to parse database, resetting to default', err);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.save();
      return this.data;
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file', err);
    }
  }

  get<K extends keyof typeof DEFAULT_DATA>(key: K): (typeof DEFAULT_DATA)[K] {
    return this.data[key];
  }

  set<K extends keyof typeof DEFAULT_DATA>(key: K, value: (typeof DEFAULT_DATA)[K]) {
    this.data[key] = value;
    this.save();
  }
}

const db = new JsonDatabase();

// Seed initial sample file on disk if missing
const sampleBriefPath = path.join(INGEST_DIR, 'mission_brief_mw115.txt');
if (!fs.existsSync(sampleBriefPath)) {
  fs.writeFileSync(
    sampleBriefPath,
    'MindWave Batch mw_115: Invariant verification and canonical receipts.\nScope: Frame stabilization (mw_11), TrueWill boundary enforcement (mw_72), Tri-Lens logic (mw_102).'
  );
}

// Server-Side Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // ---------------- API ENDPOINTS ----------------

  // Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      engine: 'express-node-fullstack',
      storage: 'persistent_json',
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  // Workspace Status
  app.get('/api/workspace/status', (_req: Request, res: Response) => {
    const ws = db.get('workspace');
    res.json(ws);
  });

  // Set Workspace Path
  app.post('/api/workspace/path', (req: Request, res: Response) => {
    const { path: newPath } = req.body;
    const current = db.get('workspace');
    const updated = {
      ...current,
      path: newPath || current.path,
      isValid: Boolean(newPath && newPath.length > 2)
    };
    db.set('workspace', updated);
    res.json(updated);
  });

  // Suggestions (next_id, current_batch, next_batch)
  app.get('/api/workspace/suggest', (_req: Request, res: Response) => {
    res.json(db.get('suggestions'));
  });

  // Script Runner simulation with state mutations
  app.post('/api/runner/run', (req: Request, res: Response) => {
    const { script, args = [] } = req.body;
    const suggestions = db.get('suggestions');

    // 1. Concept Scaffolding
    if (script === 'scaffold_new_concept.py') {
      let id = suggestions.next_id;
      let title = 'unnamed_concept';
      const isDryRun = args.includes('--dry-run');

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--id' && args[i + 1]) id = args[i + 1];
        if (args[i] === '--title' && args[i + 1]) title = args[i + 1];
      }

      const snakeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const conceptTag = `mw_${id}_${snakeTitle}`;

      if (isDryRun) {
        return res.json({
          success: true,
          stdout: `[DRY RUN SIMULATION] File scaffold preview:\n` +
            `Target: mindwave/${conceptTag}.md\n` +
            `00_INDEX.md Entry: | ${id} | [${conceptTag}](${conceptTag}.md) | ${title} |\n` +
            `03_INVARIANTS.md Header: ## From mw_${id} -- ${title}\n` +
            `All checks passed. Ready to commit.`,
          stderr: '',
          return_code: 0
        });
      }

      // Commit changes to database
      const concepts = db.get('concepts');
      if (!concepts.includes(conceptTag)) {
        concepts.push(conceptTag);
        db.set('concepts', concepts);
      }

      // Add to fabrications
      const fabrications = db.get('fabrications');
      fabrications.unshift({
        id: `fab_${Date.now()}`,
        type: 'concept',
        content: `${conceptTag} — ${title}`,
        source: 'Manual Scaffolder',
        created_at: Date.now(),
        tags: ['MANUAL', `mw_${id}`]
      });
      db.set('fabrications', fabrications);

      // Increment next_id
      try {
        const nextNum = parseInt(id, 10) + 1;
        suggestions.next_id = String(nextNum).padStart(3, '0');
        db.set('suggestions', suggestions);
      } catch {
        // ignore
      }

      // Increment concept count in workspace
      const ws = db.get('workspace');
      ws.conceptCount = concepts.length;
      ws.lastRun = new Date().toISOString();
      db.set('workspace', ws);

      return res.json({
        success: true,
        stdout: `[SUCCESS] Created mindwave/${conceptTag}.md\n` +
          `[INDEX] Registered in 00_INDEX.md line ${concepts.length + 5}\n` +
          `[INVARIANTS] Scaffolded ## From mw_${id} -- ${title} in 03_INVARIANTS.md`,
        stderr: '',
        return_code: 0
      });
    }

    // 2. MindWave Verification Checks
    if (script === 'run_mindwave_checks.py') {
      const checks = db.get('workflowChecks');
      const passedCount = checks.filter(c => c.verified).length;
      return res.json({
        success: true,
        stdout: `=== MINDWAVE COHERENCE CHECK SUITE ===\n` +
          `Checked ${checks.length} protocol items.\n` +
          `[PASS] Naming syntax verified (zero-padded, snake_case)\n` +
          `[PASS] 00_INDEX.md integrity: 100% synchronized\n` +
          `[PASS] Bidirectional related links verified\n` +
          `[PASS] Invariant anchors and index line references aligned\n` +
          `[PASS] E-Check (mw_99): All Source Code quotes verifiable substrings of concept docs\n` +
          `Result: 0 errors, 0 warnings. Exit code 0.`,
        stderr: '',
        return_code: 0
      });
    }

    // 3. Knowledge Base Synthesis
    if (script === 'build_mindwave_db.py') {
      const ws = db.get('workspace');
      ws.hasDb = true;
      ws.lastRun = new Date().toISOString();
      db.set('workspace', ws);

      return res.json({
        success: true,
        stdout: `[BUILD] Parsing 00_INDEX.md and 03_INVARIANTS.md...\n` +
          `[SYNTHESIS] Extracted ${db.get('concepts').length} concept nodes and ${db.get('invariants').length} invariants.\n` +
          `[SQLITE] Compiled mindwave.db (WAL mode active).\n` +
          `[VERIFIED] SQLite hash matches file tree checksum.`,
        stderr: '',
        return_code: 0
      });
    }

    // 4. Sync Verification
    if (script === 'check_mindwave_db_sync.py') {
      return res.json({
        success: true,
        stdout: `[SYNC] Validating SQLite database against markdown files...\n` +
          `Concept count match: YES (${db.get('concepts').length})\n` +
          `Invariant count match: YES (${db.get('invariants').length})\n` +
          `Status: STABLE. No drift detected.`,
        stderr: '',
        return_code: 0
      });
    }

    // 5. Handoff Signal Generation
    if (script === 'generate_handoff_prompt.py') {
      return res.json({
        success: true,
        stdout: `[TRANSMISSION] Generated end-of-batch handoff prompt for ${suggestions.current_batch}.\n` +
          `Summary tokens compiled. Ready for dispatch to archival logs.`,
        stderr: '',
        return_code: 0
      });
    }

    // 6. Project Minutes Update
    if (script === 'update_project_minutes_batch.py') {
      let batch = suggestions.current_batch;
      let summary = 'Batch closed.';
      let nextBatch = suggestions.next_batch || 'mw_117';

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--batch' && args[i + 1]) batch = args[i + 1];
        if (args[i] === '--summary' && args[i + 1]) summary = args[i + 1];
        if (args[i] === '--next-batch' && args[i + 1]) nextBatch = args[i + 1];
      }

      // Advance batch
      try {
        const num = parseInt(batch.replace(/[^0-9]/g, ''), 10);
        suggestions.current_batch = nextBatch;
        suggestions.next_batch = `mw_${num + 2}`;
        db.set('suggestions', suggestions);
      } catch {
        // ignore
      }

      return res.json({
        success: true,
        stdout: `[ARCHIVE] Committed to project_minutes.md:\n` +
          `- Date: ${new Date().toISOString().split('T')[0]}\n` +
          `- Batch: ${batch}\n` +
          `- Summary: ${summary}\n` +
          `- Next target: ${nextBatch}\n` +
          `State successfully locked.`,
        stderr: '',
        return_code: 0
      });
    }

    // 7. Diagnostics (Audit, Coverage, Canonical Diff, Next Vector)
    if (script === 'generate_related_audit.py') {
      return res.json({
        success: true,
        stdout: `[AUDIT] 142 concepts scanned. 0 orphan nodes. 100% bidirectional coverage.`,
        stderr: '',
        return_code: 0
      });
    }

    if (script === 'generate_coverage_report.py') {
      return res.json({
        success: true,
        stdout: `[COVERAGE] Invariant density: 2.8 per concept. Canonical quote coverage: 100%.`,
        stderr: '',
        return_code: 0
      });
    }

    if (script === 'generate_canonical_diff.py') {
      return res.json({
        success: true,
        stdout: `[DIFF] 0 discrepancies found between 03_INVARIANTS.md and concept canonical quote blocks.`,
        stderr: '',
        return_code: 0
      });
    }

    if (script === 'suggest_next_batch.py') {
      return res.json({
        success: true,
        stdout: `[VECTOR] Next projected batch: ${suggestions.next_batch}. Recommended concepts: 5 nodes.`,
        stderr: '',
        return_code: 0
      });
    }

    // Default Fallback
    res.json({
      success: true,
      stdout: `[SYSTEM] Executed ${script} with args: [${args.join(', ')}]`,
      stderr: '',
      return_code: 0
    });
  });

  // Backup DB
  app.post('/api/runner/backup-db', (_req: Request, res: Response) => {
    res.json({
      success: true,
      stdout: 'Database snapshot backed up to mindwave.db.bak (1.8MB)',
      stderr: '',
      return_code: 0
    });
  });

  // Ingestion File Upload
  app.post('/api/ingest/upload', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const isImage = file.mimetype.startsWith('image/');
    const isText = file.mimetype.startsWith('text/') ||
      file.originalname.endsWith('.md') ||
      file.originalname.endsWith('.txt') ||
      file.originalname.endsWith('.json');

    let rawSnippet: string | undefined = undefined;
    if (isText) {
      try {
        const fullContent = fs.readFileSync(file.path, 'utf-8');
        rawSnippet = fullContent.slice(0, 5000);
      } catch {
        // ignore
      }
    }

    const fileRecord = {
      name: file.originalname,
      storedName: file.filename,
      size: file.size,
      type: isImage ? 'image' : 'text',
      url: `/api/ingest/files/${encodeURIComponent(file.filename)}`,
      lastModified: Date.now(),
      id: `file_${Date.now()}`,
      rawText: rawSnippet
    };

    const files = db.get('files');
    files.unshift(fileRecord);
    db.set('files', files);

    res.json(fileRecord);
  });

  // List Ingested Files
  app.get('/api/ingest/list', (_req: Request, res: Response) => {
    const files = db.get('files');
    // Ensure URLs are valid
    const mapped = files.map(f => ({
      ...f,
      url: `/api/ingest/files/${encodeURIComponent(f.storedName || f.name)}`
    }));
    res.json(mapped);
  });

  // Serve Ingested File Content
  app.get('/api/ingest/files/:filename', (req: Request, res: Response) => {
    const filename = String(req.params.filename);
    let filePath = path.join(INGEST_DIR, filename);

    if (!fs.existsSync(filePath)) {
      // Check if matches by original name
      const files = db.get('files');
      const match = files.find(f => f.storedName === filename || f.name === filename);
      if (match && match.storedName) {
        filePath = path.join(INGEST_DIR, match.storedName);
      }
    }

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Artifact not found in buffer.');
    }
  });

  // Extract Concepts from File
  app.post('/api/ingest/extract', (req: Request, res: Response) => {
    const { filename } = req.body;
    const files = db.get('files');
    const matchedFile = files.find(f => f.name === filename || f.storedName === filename);

    const concepts = db.get('concepts');
    const potentialConcept = `MW_${Math.floor(100 + Math.random() * 899)}_Adaptive_Substrate`;

    const result = {
      concepts_found: concepts.slice(0, 3),
      potential_concepts: [
        potentialConcept,
        'Quantum_Entangled_Telemetry',
        'Zero_Point_Flux_Barrier'
      ],
      ideas: [
        `Extracted from ${filename}: Use phase-locked quantum oscillation to verify invariant receipt chains without central polling.`,
        `Extracted from ${filename}: Deploy decentralized telemetry relays to dampen high-frequency state jitter.`
      ],
      patent_claims: [
        `Claim 1: A computer-implemented method for maintaining canonical truth gates across distributed concept registries, comprising receiving an invariant candidate quote and validating verbatim substring inclusion...`,
        `Claim 2: The system of Claim 1, further comprising a cryptographic receipt validator configured to reject modifications outside the active batch boundary.`
      ],
      jhanos_tags: ['SECTOR:ALPHA_7', 'INVARIANT:CANONICAL', 'SECURITY:LEVEL_4']
    };

    // Auto-persist new findings to Fabrications
    const fabrications = db.get('fabrications');
    const now = Date.now();

    fabrications.unshift({
      id: `fab_${now}_concept`,
      type: 'concept',
      content: potentialConcept,
      source: filename,
      created_at: now,
      tags: ['EXTRACTED', 'POTENTIAL']
    });

    fabrications.unshift({
      id: `fab_${now}_idea`,
      type: 'idea',
      content: result.ideas[0],
      source: filename,
      created_at: now + 1,
      tags: ['INSIGHT']
    });

    fabrications.unshift({
      id: `fab_${now}_claim`,
      type: 'claim',
      content: result.patent_claims[0],
      source: filename,
      created_at: now + 2,
      tags: ['IP', 'PATENT']
    });

    db.set('fabrications', fabrications);

    res.json(result);
  });

  // Fabrications CRUD
  app.get('/api/fabrications', (_req: Request, res: Response) => {
    res.json(db.get('fabrications'));
  });

  app.post('/api/fabrications', (req: Request, res: Response) => {
    const item = req.body;
    const fabrications = db.get('fabrications');
    const newItem = {
      id: item.id || `fab_${Date.now()}`,
      type: item.type || 'idea',
      content: item.content || 'Untitled fabrication',
      source: item.source || 'Manual Input',
      created_at: Date.now(),
      tags: item.tags || ['MANUAL']
    };
    fabrications.unshift(newItem);
    db.set('fabrications', fabrications);
    res.json(newItem);
  });

  app.delete('/api/fabrications/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    let fabrications = db.get('fabrications');
    fabrications = fabrications.filter(f => f.id !== id);
    db.set('fabrications', fabrications);
    res.json({ success: true });
  });

  // Global Search
  app.get('/api/search', (req: Request, res: Response) => {
    const q = String(req.query.q || '').toLowerCase();
    const results: any[] = [];

    if (!q.trim()) return res.json(results);

    // Concepts
    for (const c of db.get('concepts')) {
      if (c.toLowerCase().includes(q)) {
        results.push({
          id: c,
          type: 'concept',
          title: `[NODE] ${c}`,
          snippet: `Registered canonical MindWave concept node.`,
          match_score: 10
        });
      }
    }

    // Fabrications
    for (const f of db.get('fabrications')) {
      if (f.content.toLowerCase().includes(q) || f.source.toLowerCase().includes(q)) {
        results.push({
          id: f.id,
          type: 'fabrication',
          title: `[${f.type.toUpperCase()}] ${f.content.slice(0, 40)}...`,
          snippet: f.content,
          match_score: 8
        });
      }
    }

    // Files
    for (const file of db.get('files')) {
      if (file.name.toLowerCase().includes(q)) {
        results.push({
          id: file.id,
          type: 'file',
          title: `[ARTIFACT] ${file.name}`,
          snippet: `Ingested data stream artifact (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`,
          match_score: 6
        });
      }
    }

    // Invariants
    for (const inv of db.get('invariants')) {
      if (inv.sourceCodeQuote.toLowerCase().includes(q) || inv.conceptTitle.toLowerCase().includes(q)) {
        results.push({
          id: inv.id,
          type: 'fabrication',
          title: `[INVARIANT] ${inv.id} (${inv.conceptTitle})`,
          snippet: `"${inv.sourceCodeQuote}"`,
          match_score: 9
        });
      }
    }

    res.json(results);
  });

  // Workflow Protocol Status & Checks
  app.get('/api/workflow/status', (_req: Request, res: Response) => {
    const checks = db.get('workflowChecks');
    const suggestions = db.get('suggestions');
    const invariants = db.get('invariants');

    const passed = checks.filter(c => c.verified).length;
    const total = checks.length;

    res.json({
      currentBatch: suggestions.current_batch,
      nextBatch: suggestions.next_batch,
      activeConceptId: suggestions.next_id,
      lastRunDate: new Date().toISOString().split('T')[0],
      overallStatus: passed === total ? 'STABLE' : 'IN_PROGRESS',
      invariantsCount: invariants.length,
      checks,
      invariants
    });
  });

  // Toggle Workflow Check
  app.post('/api/workflow/check-toggle', (req: Request, res: Response) => {
    const { id } = req.body;
    const checks = db.get('workflowChecks');
    const target = checks.find(c => c.id === id);
    if (target) {
      target.completed = !target.completed;
      target.verified = target.completed;
      db.set('workflowChecks', checks);
    }
    res.json({ success: true, check: target });
  });

  // Verify Invariant Canonical Quote (E-Check mw_99)
  app.post('/api/workflow/verify-e-check', (req: Request, res: Response) => {
    const { invariantId, quote, conceptDocText } = req.body;
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();

    const normalizedQuote = normalize(quote || '');
    const normalizedDoc = normalize(conceptDocText || '');

    const isValid = normalizedQuote.length > 5 && normalizedDoc.includes(normalizedQuote);

    const invariants = db.get('invariants');
    const target = invariants.find(i => i.id === invariantId);
    if (target) {
      target.canonicalDocQuoteVerified = isValid;
      db.set('invariants', invariants);
    }

    res.json({
      success: true,
      valid: isValid,
      details: isValid
        ? 'E-Check Passed: Verbatim Source Code quote confirmed as authentic substring in concept doc.'
        : 'E-Check Failed: Quote does not appear as an exact substring in the concept document.'
    });
  });

  // Server-Side Gemini Chat AI Proxy (RAG-Grounded)
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const fabrications = db.get('fabrications');
      const invariants = db.get('invariants');
      const suggestions = db.get('suggestions');
      const ws = db.get('workspace');

      const researchContext = [
        `ACTIVE BATCH: ${suggestions.current_batch} | NEXT BATCH: ${suggestions.next_batch}`,
        `TOTAL REGISTERED CONCEPTS: ${ws.conceptCount}`,
        `FABRICATIONS INDEX:`,
        ...fabrications.slice(0, 15).map(f => `- [${f.type.toUpperCase()}] (${f.source}): ${f.content}`),
        `CANONICAL INVARIANTS:`,
        ...invariants.map(inv => `- [${inv.id}] (${inv.conceptTitle}): "${inv.sourceCodeQuote}" -> Logic: ${inv.solobicLogic}`)
      ].join('\n');

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the MindWave Neural Core, an advanced Andromedan R&D research interface.
Your task is to assist research engineers in formulating concepts, auditing invariants, checking receipt chains, and planning handoffs.

RESEARCH DATABASE CONTEXT:
${researchContext}

RESEARCHER QUERY:
${message}`,
        config: {
          systemInstruction: 'Adopt a sleek, technical, and precise Andromedan R&D persona. Ground answers strictly in the indexed research database and invariants when available. If referencing invariants, cite their exact INV IDs (e.g. INV:MW115_1). Be authoritative, articulate, and concise.',
        }
      });

      const replyText = response.text || 'Neural signal received, but Core returned empty buffer.';
      res.json({ reply: replyText });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({
        error: 'Neural Core Link Exception',
        details: err?.message || 'Check GEMINI_API_KEY configuration.'
      });
    }
  });

  // ---------------- VITE MIDDLEWARE (DEV) ----------------
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MINDWAVE R&D CORE] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
});
