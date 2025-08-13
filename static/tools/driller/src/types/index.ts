export type NodeType =
  | "root"
  | "question"
  | "answer"
  | "evidence"
  | "hypothesis"
  | "cause"
  | "category"
  | "conclusion";

export type ModeType =
  | "5whys"
  | "issue-tree"
  | "ishikawa"
  | "first-principles"
  | "concept-map"
  | "systems";

export type AttachmentKind = "code" | "image" | "link" | "text";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  title?: string;
  language?: string; // for code
  url?: string; // for link/image
  content?: string; // for text/code
}

export interface NodeMeta {
  mode?: ModeType;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  score?: number; // confidence/relevance
}

export interface MapNode {
  id: string;
  type: NodeType;
  title: string;
  body?: string;
  attachments?: Attachment[];
  meta: NodeMeta;
  position: { x: number; y: number };
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  label?: string; // e.g., "because", "contributes to"
  meta?: Record<string, unknown>;
}

export interface DrillerProject {
  id: string;
  name: string;
  rootNodeId: string;
  nodes: MapNode[];
  edges: MapEdge[];
  history?: any; // future: ops for undo/redo
  createdAt: string;
  updatedAt: string;
  summary?: string; // last generated summary (markdown)
}

export interface AIProvider {
  askQuestion(context: {
    project: DrillerProject;
    mode: ModeType;
    lastNodes: MapNode[];
  }): Promise<string>;
  
  createNodes(answer: string, context: {
    project: DrillerProject;
    mode: ModeType;
    questionNode?: MapNode;
  }): Promise<{ nodes: MapNode[]; edges: MapEdge[] }>;
  
  generateSynthesis(project: DrillerProject): Promise<string>;
}

export interface Position {
  x: number;
  y: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}