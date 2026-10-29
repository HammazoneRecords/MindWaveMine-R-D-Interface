
export interface ScriptResult {
  success: boolean;
  stdout: string;
  stderr: string;
  return_code: number;
}

export interface WorkspaceStatus {
  path: string;
  isValid: boolean;
  conceptCount: number;
  hasDb: boolean;
  lastRun?: string;
}

export interface SuggestionResponse {
  next_id: string;
  next_batch?: string;
  current_batch?: string;
}

export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  COMMAND = 'COMMAND'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  detail?: string;
}

export interface PipelineStep {
  name: string;
  script: string;
  args?: string[];
  description: string;
}

export interface IngestedFile {
  name: string;
  size: number;
  type: string; // 'text' | 'image' | 'unknown'
  url: string;
  lastModified: number;
}

export interface ExtractionResult {
  concepts_found: string[];
  potential_concepts: string[];
  ideas: string[];
  patent_claims: string[];
  jhanos_tags: string[];
  summary?: string;
}

export interface FabricationItem {
  id: string;
  type: 'concept' | 'idea' | 'claim' | 'invariant' | 'biz';
  content: string;
  source: string;
  created_at: number;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  type: 'concept' | 'file' | 'fabrication';
  title: string;
  snippet: string;
  match_score: number;
}
