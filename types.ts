
export enum ToolType {
  GOOGLE_SEARCH = 'googleSearch',
  GOOGLE_MAPS = 'googleMaps',
  CALCULATOR = 'calculator',
  CODE_INTERPRETER = 'codeInterpreter',
  IMAGE_GEN = 'imageGeneration',
  DOCUMENT_READER = 'documentReader'
}

export type Priority = 'low' | 'medium' | 'high';

export interface ActionReminder {
  id: string;
  agentId: string;
  sessionId: string;
  title: string;
  dueDate: number;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export interface ToolLog {
  timestamp: number;
  tool: ToolType | string;
  status: 'info' | 'success' | 'warning' | 'error' | 'intervention';
  message: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  knowledgeBase?: string;
  tools: ToolType[];
  model: string;
  icon: string;
  temperature?: number;
  thinkingBudget?: number;
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  toolLogs?: ToolLog[];
}

export interface MessageAttachment {
  name: string;
  data: string; // base64
  mimeType: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  groundingUrls?: { uri: string; title: string; source?: string }[];
  isStreaming?: boolean;
  activeTool?: string;
  attachments?: MessageAttachment[];
  thought?: string; 
  generatedImages?: string[];
  toolStatus?: 'healthy' | 'warning' | 'blocked' | 'waiting';
  requiresIntervention?: boolean;
}

export interface AppState {
  agents: AgentConfig[];
  activeAgentId: string | null;
  activeSessionId: string | null;
  sessions: ChatSession[];
  reminders: ActionReminder[];
}
