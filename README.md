
# MindWaveMine // Andromedan Interface

A specialized React + FastAPI R&D interface for the MindWaveMine workflow. This interface replaces the legacy Streamlit app with a consolidated, sci-fi "Andromedan" aesthetic dashboard designed for high-efficiency concept fabrication, maintenance, and project handoffs.

## ✨ Features

### 1. Command Deck (Dashboard)
*   **System Vitals**: Real-time monitoring of Workspace Root, Active Nodes, and Database Integrity.
*   **One-Click Maintenance**: Consolidated pipeline that runs diagnostics, backups the core database, synthesizes the knowledge base, and verifies synchronization in a single sequence.
*   **Rapid Fabrication**: Quickly instantiate new concept nodes by simply typing a designation and hitting Enter.
*   **Diagnostics Matrix**: Immediate access to individual reporting modules (Related Audit, Coverage Scan, etc.).

### 2. Precision Fabrication
*   **Live Simulation**: As you type a concept designation, the system runs a background dry-run simulation to preview the file structure and changes before you commit.
*   **Smart Suggestions**: Automatically detects the next available ID sequence based on `00_INDEX.md`.

### 3. Data Stream (Ingestion)
*   **Xenolith Ingestion**: Drag-and-drop interface for external artifacts (Text, Markdown, Images).
*   **Neural Scan**: Local concept extraction scanning. It cross-references ingested text files against your existing `00_INDEX.md` to highlight known concepts and identifies potential new entities (Capitalized proper nouns).
*   **Artifact Viewer**: Built-in holographic viewer for text and image files directly within the interface.

### 4. Transmission Protocol (Handoff)
*   **Automated End-Cycle**: Combines "Generate Handoff" and "Archive Minutes" into a single protocol.
*   **Sector Locking**: The active batch ID is auto-detected and locked to prevent human error during handoffs.

## 🛠️ Architecture

*   **Frontend**: React 19, TailwindCSS, Lucide/Heroicons (SVG), custom Glassmorphism UI.
*   **Backend**: FastAPI (Python).
*   **Persistence**: Uses `app_config.json` as a local JSON database to persist configuration (like workspace paths) across server restarts.

## 🚀 Getting Started

### Prerequisites
*   Node.js & NPM
*   Python 3.8+
*   A valid MindWaveMine workspace (folder containing `00_INDEX.md` and python scripts).

### Installation

1.  **Backend**:
    ```bash
    cd backend
    pip install fastapi uvicorn python-multipart
    python main.py
    ```
    The server runs on `http://localhost:8000`.

2.  **Frontend**:
    ```bash
    # Root directory
    npm install
    npm start
    ```
    The interface runs on `http://localhost:1234` (or similar).

### Configuration
On first launch, click **Sys. Calibration** (Gear Icon) in the sidebar. Enter the absolute path to your MindWaveMine root directory. This setting is saved to `app_config.json` automatically.

## 🌌 Aesthetic
The UI follows the "Andromedan Tech Agency" design language:
*   **Font**: `Rajdhani` (Headers) & `JetBrains Mono` (Data).
*   **Palette**: Deep Void Black, Neon Cyan (`#06b6d4`), and Nebulous Purple (`#a855f7`) and Data Orange (`#f97316`).
*   **Effects**: Glassmorphism, text glows, and holographic scanlines.
