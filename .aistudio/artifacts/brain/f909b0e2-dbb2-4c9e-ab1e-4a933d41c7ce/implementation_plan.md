# MindWaveMine Full-Stack Architecture & Workflow Engine

Consolidate the MindWaveMine research and concept-fabrication environment into a unified, full-stack application. Replace the detached Python backend dependency with an embedded Node.js Express server running persistent JSON storage, restore all isolated workflow views into a dedicated navigation suite, and implement the interactive MindWave Phase A-B-C concept validation engine following `WORKFLOW_REFERENCE.md`.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1:
> - **Backend & Persistence**: Full-stack Express server with persistent file-backed JSON storage (`storage/mindwave_data.json` and `storage/ingested/`), eliminating the need for an external Python port 8000 process while preserving Python script runner capabilities.
> - **Navigation Hierarchy**: Expand the sidebar into dedicated, high-intent modules: **Command Deck** (Dashboard & Diagnostics), **Data Stream** (Artifact Ingestion & Viewer), **Knowledge Matrix** (Kanban & Concept Creator), **Workflow Protocol** (Interactive Phase A-B-C & Invariants Engine), **Neural Bridge** (End-to-End Synthesis), and **Transmission Handoff** (End-Cycle Archival).
> - **Workflow Reference Compliance**: Implement an interactive checklist and automated validation simulator for the strict MindWave concept lifecycle: Phase A (Document Creation & Indexing), Phase B (Invariant Extraction & Canonical Quotes), Phase C (MindWave Checks & Project Minutes), and Enhancement Flow (E1–E8).
> - **AI Integration**: Migrate Gemini RAG chat from client-side execution to a secure server-side proxy route (`/api/chat`) using `@google/genai` with `gemini-3.8-flash`.

---

## 1. Overview & Core Concept

- **What It Does**: A complete R&D research deck for the MindWave concept repository. Researchers and AI engineers can ingest raw research artifacts (transcripts, images, JSON logs), extract concepts, ideas, and patent claims, track them across an interactive Kanban board, validate compliance against MindWave canonical protocols, and generate batch handoffs.
- **Target Audience**: AI researchers, knowledge system architects, and concept developers managing complex ontological documentation systems.
- **Key Value**: Eliminates the "Neural Link Severed" connection failure, provides rock-solid data persistence across sessions, and ensures every created concept strictly adheres to the MindWave traceability invariants.

---

## 2. User Experience & Visual Design

- **Aesthetic Direction**: Andromedan Sci-Fi Command Center with high-contrast dark surfaces, deep void black (`#0f0c29`), nebulous purple (`#a855f7`), and neon cyan (`#06b6d4`).
- **Typography & Structure**:
  - Display & Headings: `Rajdhani` (bold, tracked, uppercase).
  - Body & Form Controls: `Rajdhani` and `Public Sans` for legibility.
  - Data & Telemetry: `JetBrains Mono` with `tabular-nums` for timestamps, IDs, hashes, and invariant line references.
- **Key User Flows**:
  1. **System Health & Maintenance**: View root workspace, construct integrity, active node count, and initiate one-click maintenance (Diagnostics -> Backup -> DB Build -> Sync Verification).
  2. **Data Stream Ingestion**: Drag and drop text, Markdown, or images into the buffer; inspect raw contents in the holographic viewer; run neural extraction to surface potential entities and patent claims.
  3. **Knowledge Matrix**: View categorized fabrications (Concepts, Ideas, Biz Ideas, Invariants, Claims) in Kanban columns; trigger manual node fabrication with live dry-run simulation.
  4. **Phase A-B-C Workflow Validator**: Step through new concept dumps or enhancement batches with interactive verification checklists (A1–A6, B7–B11, C12–C13, E1–E8), receipt-chain integrity testing, and canonical quote verification.
  5. **Transmission Handoff**: Auto-lock active sector ID, summarize the cycle's progress, trigger handoff signals, and commit to project minutes.
  6. **Neural AI Assistant**: Chat with the Andromedan Core through the bottom drawer, grounding answers directly in the indexed research database via server-side Gemini 3.8 Flash.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express Server with Persistent JSON vs. External Python Process**
  - *Chosen Approach*: Embed an Express API inside `server.ts` that mounts Vite in development, managing persistent storage in `storage/mindwave_data.json` and handling uploads in `storage/ingested/`.
  - *Why*: In the web preview environment, external background Python servers are unreliable and cause "Neural Link Severed" blocking screens. An embedded Express server provides instant, 100% reliable startup, full file upload capability, and seamless server-side Gemini integration.
  - *Alternatives Considered*: Pure mock API (lacked disk persistence) or requiring users to manually run FastAPI on port 8000.
- **Decision 2: Dedicated Navigation Tabs vs. Merged Neural Bridge**
  - *Chosen Approach*: Separate **Data Stream** (Ingestion), **Knowledge Matrix**, **Neural Bridge**, **Workflow Protocol**, and **Transmission Handoff** into distinct sidebar tabs.
  - *Why*: Complex operations (file analysis, Kanban organization, strict invariant validation, and end-cycle handoffs) were cramped inside a single view. Dedicated tabs allow full viewport space for deep work while keeping the Neural Bridge as a fast-track composite.
- **Decision 3: Server-Side Gemini API Proxy with `gemini-3.8-flash`**
  - *Chosen Approach*: Create `/api/chat` route on the Express server utilizing `@google/genai` with model `gemini-3.8-flash` and `User-Agent: 'aistudio-build'`.
  - *Why*: Fixes deprecated model aliases (`gemini-3-flash-preview`), protects the API key on the backend, and injects context from the persistent fabrication database.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vite React 19 Frontend                          │
│                                                                        │
│  ┌────────────────┐  ┌───────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Command Deck  │  │  Data Stream  │  │  Knowledge  │  │ Workflow  │ │
│  │   (Dashboard)  │  │  (Ingestion)  │  │   Matrix    │  │ Protocol  │ │
│  └───────┬────────┘  └───────┬───────┘  └──────┬──────┘  └─────┬─────┘ │
│          │                   │                 │               │       │
│  ┌───────┴────────┐  ┌───────┴───────┐  ┌──────┴───────────────┴─────┐ │
│  │ Transmission   │  │ Neural Bridge │  │ Log Viewer / Neural AI Chat│ │
│  │   (Handoff)    │  │  (Composite)  │  │       (Bottom Drawer)      │ │
│  └───────┬────────┘  └───────┬───────┘  └──────────────┬─────────────┘ │
└──────────┼───────────────────┼─────────────────────────┼───────────────┘
           │                   │                         │
           ▼                   ▼                         ▼
   REST Calls (/api/*) & Multipart Uploads       POST /api/chat
┌────────────────────────────────────────────────────────────────────────┐
│                       Express Server (server.ts)                       │
│                                                                        │
│   • /api/workspace/*    • /api/ingest/*       • /api/fabrications      │
│   • /api/runner/*       • /api/workflow/*     • /api/search            │
│   • /api/chat           (GoogleGenAI Server-Side: gemini-3.8-flash)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │            Persistent Storage             │
             │  • storage/mindwave_data.json             │
             │  • storage/ingested/*                     │
             │  • Local JSON database with sync recovery │
             └───────────────────────────────────────────┘
```

### Component & File Mapping

1. **Backend Server (`server.ts`)**:
   - Express server serving `/api` endpoints and mounting Vite dev middleware.
   - Handles file uploads with `multer` to `storage/ingested`.
   - Initializes `@google/genai` server-side client with `gemini-3.8-flash`.
   - Simulates MindWave script execution with deterministic status transitions and database updates.
2. **Client API Layer (`services/api.ts`)**:
   - Refactored to communicate directly with `/api/*` endpoints.
   - Fallback resilience: if the server is starting up, graceful retry with telemetry in logs.
3. **Workflow Protocol Engine (`views/WorkflowProtocol.tsx`)**:
   - Interactive engine for Phase A (Create doc & register), Phase B (Extract invariants & Tri-Lens), Phase C (Checks & project_minutes), and Enhancement Flow (E1–E8).
   - Invariant quote validator verifying that canonical quotes match verbatim.
4. **Data Stream & Handoff Views (`views/Ingestion.tsx` & `views/BatchHandoff.tsx`)**:
   - Fully integrated into primary navigation with real backend wiring.
5. **Styling & CSS (`index.css` & `index.html`)**:
   - Add missing `index.css` with Tailwind CSS v4 directives, `@custom-variant dark`, custom scrollbars, and neon glow effects.
   - Clean up HTML metadata and title.
6. **AI Assistant (`components/LogViewer.tsx`)**:
   - Chat endpoint calling `/api/chat` with database RAG injection and streaming feedback.
