
export enum ToolType {
  GOOGLE_SEARCH = 'googleSearch',
  GOOGLE_MAPS = 'googleMaps',
  CALCULATOR = 'calculator',
  CODE_INTERPRETER = 'codeInterpreter',
  IMAGE_GEN = 'imageGeneration',
  DOCUMENT_READER = 'documentReader',
  CHROME_BROWSER = 'chromeBrowser'
}

export interface AgentVariable {
  key: string;
  value: string;
  label: string;
}

export interface TaskResult {
  id: string;
  client_id: string;
  agent_id: string;
  task_name: string;
  folder_path: string;
  payload: any;
  created_at: number;
}

export interface MessageAttachment {
  mimeType: string;
  data: string; // Base64 encoded data
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  engine?: 'eden' | 'gemini';
  groundingUrls?: { uri: string; title: string }[];
  thought?: string; 
  generatedImages?: string[];
  isStreaming?: boolean;
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface AppState {
  agents: Record<string, AgentConfig>;
  activeAgentId: string | null;
  activeSessionId: string | null;
  sessions: ChatSession[];
  reminders: ActionReminder[];
  tokenBalance: number;
  totalTokensConsumed: number;
  engineStatus: 'healthy' | 'fallback' | 'offline';
  clientId: string; // ID único desta instalação/cliente
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  knowledgeBase?: string;
  defaultFolder?: string; // Pasta raiz para resultados deste agente
  tools: ToolType[];
  toolConfigs: ToolConfig[];
  routines: AgentRoutine[];
  model: string;
  icon: string;
  temperature?: number;
  variables?: AgentVariable[]; 
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface ActionReminder {
  id: string;
  agentId: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface ToolConfig {
  tool: ToolType;
  customInstruction: string;
  enabled: boolean;
}

export interface AgentRoutine {
  id: string;
  name: string;
  task: {
    id: string;
    target: string;
    instruction: string;
    alertCondition: string;
  };
  frequency: string;
  status: string;
  efficiencyScore: number;
  history: any[];
}
