
import { create } from 'zustand';
import { Dexie, type EntityTable } from 'dexie';
import { AgentConfig, AppState, User, AgentStatus, TaskResult, ChatMessage } from './types';
import { DEFAULT_AGENTS } from './constants';

class ForgeDatabase extends Dexie {
  state!: EntityTable<{ id: string; data: any }, 'id'>;
  constructor() {
    super('ForgeEnterprise_V6');
    (this as Dexie).version(1).stores({ state: 'id' });
  }
}

const db = new ForgeDatabase();

interface ForgeStore extends AppState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  vocalDraft: AgentConfig;
  masterSecret: string;
  vaultUnlocked: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, passwordHash: string) => { success: boolean; error?: string };
  register: (email: string, passwordHash: string) => { success: boolean; error?: string };
  logout: () => void;
  setActiveAgent: (id: string | null) => void;
  setActiveSession: (id: string | null) => void;
  saveAgent: (agent: AgentConfig) => void;
  deleteAgent: (id: string) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  saveTaskResult: (result: TaskResult) => void;
  triggerRoutine: (agentId: string, routineId: string) => Promise<void>;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessage: (sessionId: string, partial: Partial<ChatMessage>) => void;
  setVocalDraft: (draft: Partial<AgentConfig>) => void;
  resetVocalDraft: () => void;
  consumeTokens: (amount: number) => void;
  persist: () => Promise<void>;
  setCheckoutOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  addCredits: (amount: number) => void;
  unlockVault: (secret: string) => Promise<boolean>;
  remoteKeys: Record<string, string>;
  syncRemoteKeys: () => Promise<void>;
}

const createInitialDraft = (id = crypto.randomUUID()): AgentConfig => ({
  id,
  name: '',
  description: '',
  specialty: 'Automação',
  allocationTarget: 'General',
  systemInstruction: '',
  tools: [],
  model: 'gemini-3-pro-preview',
  icon: '🤖',
  status: 'idle',
  handover: { email: '', autoExportCsv: true },
  routines: [],
  variables: [],
  credentials: [],
  targetSites: [],
  knowledgeBase: [],
  temperature: 0.1
});

export const useForgeStore = create<ForgeStore>((set, get) => ({
  users: [],
  currentUser: null,
  agents: {},
  activeAgentId: null,
  activeSessionId: null,
  sessions: [],
  tokenBalance: 50000,
  totalTokensConsumed: 0,
  taskResults: [],
  clientId: 'client-' + Math.random().toString(36).substring(7),
  financialStats: { userSalesVolume: 0, currentMarkup: 20 },
  globalInfra: { executionMode: 'simulated' },
  vocalDraft: createInitialDraft(),
  masterSecret: '',
  vaultUnlocked: false,
  isHydrated: false,
  isAuthenticated: false,
  isCheckoutOpen: false,
  remoteKeys: {},

  hydrate: async () => {
    const saved = await db.state.get('main');
    const defaultAgentsRecord = DEFAULT_AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: agent }), {});
    
    if (saved) {
      // Merge saved agents with default agents to ensure degustation agent appears for old users too
      const mergedAgents = { ...defaultAgentsRecord, ...saved.data.agents };
      set({ ...saved.data, agents: mergedAgents });
    } else {
      const admin: User = { 
        id: 'master-001', 
        email: 'admin@forge.com', 
        passwordHash: 'forge_master_2025', 
        role: 'admin', 
        name: 'Forge Administrator' 
      };
      set({ 
        users: [admin],
        agents: defaultAgentsRecord 
      });
    }
    set({ isHydrated: true });
  },

  register: (email, passwordHash) => {
    const { users } = get();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Este e-mail já está registrado.' };
    }
    const newUser: User = { id: crypto.randomUUID(), email, passwordHash, role: 'user' };
    set(state => ({ users: [...state.users, newUser], currentUser: newUser, isAuthenticated: true }));
    get().persist();
    return { success: true };
  },

  login: (email, passwordHash) => {
    const { users } = get();
    const user = users.find(u => u.email === email && u.passwordHash === passwordHash);
    
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      get().persist();
      return { success: true };
    }
    
    return { success: false, error: 'E-mail ou senha incorretos.' };
  },

  logout: () => {
    set({ isAuthenticated: false, currentUser: null, activeAgentId: null, activeSessionId: null, vaultUnlocked: false });
    get().persist();
  },

  unlockVault: async (secret) => {
    if (secret === 'forge_master_2025' || secret === get().currentUser?.passwordHash) {
      set({ vaultUnlocked: true, masterSecret: secret });
      return true;
    }
    return false;
  },

  syncRemoteKeys: async () => {
    set({ remoteKeys: { 'GEMINI_API_KEY': process.env.API_KEY || '' } });
  },

  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),
  addCredits: (amount) => { set(state => ({ tokenBalance: state.tokenBalance + amount })); get().persist(); },
  
  setActiveAgent: (id) => {
    if (id) {
      const { sessions } = get();
      let session = sessions.find(s => s.agentId === id);
      if (!session) {
        session = { id: crypto.randomUUID(), agentId: id, messages: [] };
        set(state => ({ sessions: [...state.sessions, session] }));
      }
      set({ activeAgentId: id, activeSessionId: session.id });
    } else {
      set({ activeAgentId: null, activeSessionId: null });
    }
    get().persist();
  },

  setActiveSession: (id) => set({ activeSessionId: id }),
  
  saveAgent: (agent) => { 
    set(state => ({ agents: { ...state.agents, [agent.id]: agent } })); 
    get().persist(); 
  },

  deleteAgent: (id) => {
    set(state => {
      const { [id]: _, ...remaining } = state.agents;
      return { 
        agents: remaining, 
        activeAgentId: state.activeAgentId === id ? null : state.activeAgentId,
        activeSessionId: state.activeAgentId === id ? null : state.activeSessionId
      };
    });
    get().persist();
  },

  updateAgentStatus: (id, status) => {
    set(state => ({
      agents: {
        ...state.agents,
        [id]: { ...state.agents[id], status }
      }
    }));
    get().persist();
  },

  saveTaskResult: (result) => {
    set(state => ({
      taskResults: [result, ...state.taskResults]
    }));
    get().persist();
  },

  triggerRoutine: async (agentId, routineId) => {
    const { agents } = get();
    const agent = agents[agentId];
    if (!agent) return;
    
    const updatedAgents = { ...agents };
    const agentData = { ...updatedAgents[agentId] };
    const routine = agentData.routines.find(r => r.id === routineId);
    
    if (routine) {
      routine.nextRun = Date.now() + (routine.intervalMs || 3600000);
      updatedAgents[agentId] = agentData;
      set({ agents: updatedAgents });
      get().persist();
    }
    console.log(`[ROUTINE] Triggered ${routineId} for agent ${agentId}`);
  },

  addMessage: (sessionId, message) => {
    set(state => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      )
    }));
    get().persist();
  },

  updateLastMessage: (sessionId, partial) => {
    set(state => ({
      sessions: state.sessions.map(s => {
        if (s.id === sessionId && s.messages.length > 0) {
          const messages = [...s.messages];
          const lastIdx = messages.length - 1;
          messages[lastIdx] = { ...messages[lastIdx], ...partial };
          return { ...s, messages };
        }
        return s;
      })
    }));
    get().persist();
  },

  setVocalDraft: (draft) => { 
    set(state => ({ vocalDraft: { ...state.vocalDraft, ...draft } })); 
    get().persist(); 
  },

  resetVocalDraft: () => { 
    set({ vocalDraft: createInitialDraft() }); 
    get().persist(); 
  },

  consumeTokens: (amount) => {
    set(state => ({ 
      totalTokensConsumed: state.totalTokensConsumed + amount,
      tokenBalance: state.tokenBalance - amount
    }));
    get().persist();
  },

  persist: async () => {
    const state = get();
    await db.state.put({ id: 'main', data: {
      users: state.users,
      currentUser: state.currentUser,
      agents: state.agents,
      sessions: state.sessions,
      tokenBalance: state.tokenBalance,
      totalTokensConsumed: state.totalTokensConsumed,
      taskResults: state.taskResults,
      clientId: state.clientId,
      financialStats: state.financialStats,
      globalInfra: state.globalInfra,
      isAuthenticated: state.isAuthenticated,
      vocalDraft: state.vocalDraft
    }});
  }
}));
