
from fastapi import FastAPI, HTTPException, Body, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import os
import shutil
import json
import time
import random
import hashlib
from typing import List, Optional, Dict, Any
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- JSON Database ---
DB_FILE = "mindwave_data.json"
INGEST_DIR_NAME = "ingestion_storage"

DEFAULT_DATA = {
    "workspace": {
        "path": "/usr/local/mindwave_dev",
        "isValid": True,
        "hasDb": True,
        "conceptCount": 4,
        "lastRun": None
    },
    "suggestions": {
        "next_id": "005",
        "current_batch": "mw_001",
        "next_batch": "mw_002"
    },
    "files": [
        {
            "name": "mission_brief.txt",
            "size": 1024,
            "type": "text",
            "lastModified": 1700000000,
            "id": "file_001"
        }
    ],
    "concepts": [
        "001_Neural_Link",
        "002_Dyson_Swarm", 
        "003_Hyper_Voxel",
        "004_Void_Shield"
    ],
    "fabrications": [
        {
            "id": "fab_init_001",
            "type": "concept",
            "content": "Zero Point Energy",
            "source": "mission_brief.txt",
            "created_at": 1700000000,
            "tags": ["ENERGY", "PHYSICS"]
        },
        {
            "id": "fab_init_002",
            "type": "idea",
            "content": "Use bio-luminescent interfaces for organic data visualization.",
            "source": "xenolith_scan.json",
            "created_at": 1700000050,
            "tags": ["UX", "BIO"]
        }
    ]
}

class JsonDB:
    def __init__(self):
        self.load()

    def load(self):
        if not os.path.exists(DB_FILE):
            self.data = DEFAULT_DATA.copy()
            self.save()
        else:
            try:
                with open(DB_FILE, 'r') as f:
                    self.data = json.load(f)
                    # Ensure fabrications exists for old DBs
                    if "fabrications" not in self.data:
                        self.data["fabrications"] = []
            except:
                self.data = DEFAULT_DATA.copy()
                self.save()

    def save(self):
        with open(DB_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get(self, key):
        return self.data.get(key)

    def set(self, key, value):
        self.data[key] = value
        self.save()
    
    def update_workspace(self, updates: Dict):
        self.data["workspace"].update(updates)
        self.save()

    def add_file(self, file_meta):
        self.data["files"].insert(0, file_meta)
        self.save()

    def add_concept(self, title):
        self.data["concepts"].append(title)
        self.data["workspace"]["conceptCount"] = len(self.data["concepts"])
        
        # Increment ID logic
        try:
            current_id = int(self.data["suggestions"]["next_id"])
            self.data["suggestions"]["next_id"] = f"{current_id + 1:03d}"
        except:
            pass
        self.save()

    def add_fabrication(self, item):
        self.data["fabrications"].insert(0, item)
        self.save()

db = JsonDB()

# --- Helpers ---
def get_ingest_path():
    if not os.path.exists(INGEST_DIR_NAME):
        os.makedirs(INGEST_DIR_NAME)
    return INGEST_DIR_NAME

# --- Models ---
class RunScriptRequest(BaseModel):
    script: str
    args: List[str] = []

class PathRequest(BaseModel):
    path: str

class ExtractRequest(BaseModel):
    filename: str

# --- Endpoints ---

@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "json_db"}

@app.get("/api/workspace/status")
def get_workspace_status():
    return db.get("workspace")

@app.post("/api/workspace/path")
def set_workspace_path(req: PathRequest):
    db.update_workspace({"path": req.path, "isValid": True})
    return db.get("workspace")

@app.get("/api/workspace/suggest")
def suggest_defaults():
    return db.get("suggestions")

# --- Runner / Simulation ---

@app.post("/api/runner/run")
def run_script(req: RunScriptRequest):
    """
    Simulates script execution by modifying the JSON DB.
    """
    script = req.script
    args = req.args
    
    time.sleep(1) # Artificial delay for realism

    # 1. Concept Scaffold
    if script == "scaffold_new_concept.py":
        # Extract ID and Title from args
        # Expected args: ['--id', '005', '--title', 'My Concept', ...]
        c_id = "000"
        title = "Unknown"
        dry_run = "--dry-run" in args
        
        try:
            if "--id" in args: c_id = args[args.index("--id")+1]
            if "--title" in args: title = args[args.index("--title")+1]
        except:
            pass

        full_title = f"{c_id}_{title.replace(' ', '_')}"

        if dry_run:
            return {
                "success": True,
                "stdout": f"[SIMULATION] Preview of {full_title}.md:\n\n# {c_id} {title}\n\n## Description\n(Draft content...)",
                "stderr": "",
                "return_code": 0
            }
        
        db.add_concept(full_title)
        
        # Add to fabrications as well
        db.add_fabrication({
            "id": f"fab_{int(time.time())}",
            "type": "concept",
            "content": f"{c_id} {title}",
            "source": "Manual Fabrication",
            "created_at": int(time.time()),
            "tags": ["MANUAL", "NEW"]
        })
        
        return {
            "success": True,
            "stdout": f"Created concept: {full_title}",
            "stderr": "",
            "return_code": 0
        }

    # 2. Database Build/Check/Sync
    elif script in ["run_mindwave_checks.py", "build_mindwave_db.py", "check_mindwave_db_sync.py"]:
        success = random.choice([True, True, True, False]) # Mostly success
        if success:
             return {"success": True, "stdout": f"{script} executed successfully.", "stderr": "", "return_code": 0}
        else:
             return {"success": False, "stdout": "", "stderr": "Simulation Error: Integrity Check Failed.", "return_code": 1}

    # 3. Handoff
    elif script == "generate_handoff_prompt.py":
        return {
            "success": True, 
            "stdout": "Handoff prompt generated for batch.", 
            "stderr": "", 
            "return_code": 0
        }
    
    elif script == "update_project_minutes_batch.py":
        # Simulate batch increment
        sugg = db.get("suggestions")
        curr = sugg["current_batch"] # e.g. mw_001
        
        try:
            num = int(curr.split('_')[1])
            new_curr = f"mw_{num+1:03d}"
            new_next = f"mw_{num+2:03d}"
            
            db.data["suggestions"]["current_batch"] = new_curr
            db.data["suggestions"]["next_batch"] = new_next
            db.save()
        except:
            pass
            
        return {
            "success": True,
            "stdout": "Project minutes updated. Batch incremented.",
            "stderr": "",
            "return_code": 0
        }
        
    elif script == "suggest_next_batch.py":
        return {
            "success": True, 
            "stdout": "Next batch calculated based on velocity.",
            "stderr": "",
            "return_code": 0
        }
        
    # Default fallback
    return {
        "success": True,
        "stdout": f"[MOCK] Executed {script}",
        "stderr": "",
        "return_code": 0
    }

@app.post("/api/runner/backup-db")
def backup_db():
    time.sleep(0.5)
    return {"success": True, "stdout": "Simulated DB Backup Complete.", "stderr": "", "return_code": 0}

# --- Ingestion & Fabrication ---

@app.post("/api/ingest/upload")
async def upload_ingestion_file(file: UploadFile = File(...)):
    try:
        storage_dir = get_ingest_path()
        file_path = os.path.join(storage_dir, file.filename)
        
        # Save actual file for viewer
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Update JSON DB
        stats = os.stat(file_path)
        ext = file.filename.split('.')[-1].lower()
        ftype = 'image' if ext in ['png', 'jpg', 'jpeg', 'gif'] else 'text'
        
        meta = {
            "name": file.filename,
            "size": stats.st_size,
            "type": ftype,
            "lastModified": stats.st_mtime,
            "id": hashlib.md5(file.filename.encode()).hexdigest()
        }
        db.add_file(meta)
        
        return {"filename": file.filename, "status": "saved"}
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.get("/api/ingest/list")
def list_ingestion_files():
    # Merge DB metadata with dynamic URLs
    files = db.get("files")
    result = []
    for f in files:
        # Check if file actually exists on disk
        if os.path.exists(os.path.join(get_ingest_path(), f["name"])):
            f_copy = f.copy()
            f_copy["url"] = f"http://localhost:8000/api/ingest/files/{f['name']}"
            result.append(f_copy)
    return result

@app.get("/api/ingest/files/{filename}")
def get_ingested_file(filename: str):
    file_path = os.path.join(get_ingest_path(), filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(404, detail="File not found")

@app.post("/api/ingest/extract")
def extract_concepts(req: ExtractRequest):
    time.sleep(1.5)
    
    # Generate simulated extraction results
    result = {
        "concepts_found": [c for c in db.get("concepts") if random.random() > 0.7],
        "potential_concepts": [f"New_Entity_{random.randint(100,999)}", "Unmapped_Protocol"],
        "ideas": [
            f"Idea extracted from {req.filename}: {random.choice(['Use quantum encryption', 'Optimize neural pathways', 'Deploy autonomous drones'])}",
            "Refactor sector map for better efficiency."
        ],
        "patent_claims": [
            "A system for digital consciousness transfer...",
            "Methodology for zero-latency neural bridging..."
        ],
        "jhanos_tags": ["SECTOR:UNKNOWN", "PRIORITY:HIGH"]
    }

    # --- Persist Results to Fabrications DB ---
    timestamp = int(time.time())
    
    # 1. Save Potential Concepts
    for pc in result["potential_concepts"]:
        db.add_fabrication({
            "id": f"fab_{random.randint(10000,99999)}",
            "type": "concept",
            "content": pc,
            "source": req.filename,
            "created_at": timestamp,
            "tags": ["EXTRACTED", "PENDING"]
        })

    # 2. Save Ideas
    for idea in result["ideas"]:
        db.add_fabrication({
            "id": f"fab_{random.randint(10000,99999)}",
            "type": "idea",
            "content": idea,
            "source": req.filename,
            "created_at": timestamp,
            "tags": ["INSIGHT"]
        })

    # 3. Save Claims
    for claim in result["patent_claims"]:
         db.add_fabrication({
            "id": f"fab_{random.randint(10000,99999)}",
            "type": "claim",
            "content": claim,
            "source": req.filename,
            "created_at": timestamp,
            "tags": ["IP", "LEGAL"]
        })
        
    # 4. Save Biz Ideas (Randomly generate one occasionally)
    if random.random() > 0.5:
        db.add_fabrication({
            "id": f"fab_{random.randint(10000,99999)}",
            "type": "biz",
            "content": "Monetize the neural link API for third-party developers.",
            "source": req.filename,
            "created_at": timestamp,
            "tags": ["BUSINESS", "STRATEGY"]
        })

    return result

@app.get("/api/fabrications")
def get_fabrications():
    return db.get("fabrications") or []

@app.get("/api/search")
def global_search(q: str):
    query = q.lower()
    results = []
    
    # 1. Search Concepts
    for concept in db.get("concepts"):
        if query in concept.lower():
            results.append({
                "id": concept,
                "type": "concept",
                "title": concept,
                "snippet": "Existing Knowledge Base Entity",
                "match_score": 10
            })
            
    # 2. Search Fabrications
    for item in db.get("fabrications"):
        if query in item["content"].lower() or query in item.get("source", "").lower():
            results.append({
                "id": item["id"],
                "type": "fabrication",
                "title": f"[{item['type'].upper()}] {item['content'][:30]}...",
                "snippet": item["content"],
                "match_score": 5
            })
            
    # 3. Search Files
    for f in db.get("files"):
        if query in f["name"].lower():
            results.append({
                "id": f["id"],
                "type": "file",
                "title": f["name"],
                "snippet": f"Ingested Artifact ({f['type']})",
                "match_score": 8
            })
            
    return results

if __name__ == "__main__":
    import uvicorn
    # Create dummy file for demo purposes if needed
    if not os.path.exists(INGEST_DIR_NAME):
        os.makedirs(INGEST_DIR_NAME)
        with open(os.path.join(INGEST_DIR_NAME, "mission_brief.txt"), "w") as f:
            f.write("Classified Mission Data.\nTarget: Alpha Centauri.")
            
    uvicorn.run(app, host="0.0.0.0", port=8000)
