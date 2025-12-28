
export enum ToolType {
  GOOGLE_SEARCH = 'googleSearch',
  GOOGLE_MAPS = 'googleMaps',
  CALCULATOR = 'calculator',
  CODE_INTERPRETER = 'codeInterpreter',
  IMAGE_GEN = 'imageGeneration',
  DOCUMENT_READER = 'documentReader',
  CHROME_BROWSER = 'chromeBrowser',
  AGENT_DELEGATION = 'agentDelegation',
  AUTH_BROWSER = 'authBrowser',
  CAPTCHA_SOLVER = 'captchaSolver',
  SELENIUM_AUTOMATION = 'seleniumAutomation',
  FINANCIAL_CONTROLLER = 'financialController'
}

export type AgentStatus = 'idle' | 'working' | 'alert' | 'offline';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  role: 'admin' | 'user';
}

export interface WebhookConfig {
  url: string;
  enabled: boolean;
  secret?: string;
}

export interface HandoverProtocols {
  email: string;
  webhook?: WebhookConfig;
  autoExportCsv: boolean;
}

export interface AutomationStep {
  id: string;
  action: 'navigate' | 'click' | 'type' | 'captcha' | 'human_intervention';
  selector?: string;
  value?: string;
  details?: string;
}

export interface MessageAttachment {
  data: string;
  mimeType: string;
  fileName?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  engine?: 'eden' | 'gemini';
  thought?: string;
  automationSteps?: AutomationStep[];
  grounding?: any[];
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface AgentVariable {
  key: string;
  value: string;
  label: string;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export interface AgentCredential {
  id: string;
  label: string;
  siteUrl: string;
  username: string;
  passwordSecret: string;
}

export interface KnowledgeDoc {
  id: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  specialty: string; 
  allocationTarget: string; 
  systemInstruction: string;
  tools: ToolType[];
  model: string;
  icon: string;
  status: AgentStatus;
  handover: HandoverProtocols;
  routines: any[];
  variables: AgentVariable[];
  credentials: AgentCredential[];
  targetSites: string[];
  knowledgeBase: KnowledgeDoc[];
  temperature: number;
  quickActions?: QuickAction[];
}

export interface TaskResult {
  id: string;
  agentId: string;
  taskName: string;
  summary: string;
  costTokens: number;
  estimatedHumanHours: number;
  createdAt: number;
  status: 'success' | 'failed';
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  agents: Record<string, AgentConfig>;
  activeAgentId: string | null;
  activeSessionId: string | null;
  sessions: any[];
  tokenBalance: number;
  totalTokensConsumed: number;
  taskResults: TaskResult[];
  clientId: string;
  globalInfra: {
    executionMode: string;
    captchaApiKey?: string;
  };
  financialStats: {
    userSalesVolume: number;
    currentMarkup: number;
  };
}
