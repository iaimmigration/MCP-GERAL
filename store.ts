
import { create } from 'zustand';
import { Dexie, type EntityTable } from 'dexie';
import { AgentConfig, AppState, User } from './types';
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
  setVocalDraft: (draft: Partial<AgentConfig>) => void;
  resetVocalDraft: () => void;
  consumeTokens: (amount: number) => void;
  persist: () => Promise<void>;
  setCheckoutOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  addCredits: (amount: number) => void;
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

  hydrate: async () => {
    const saved = await db.state.get('main');
    if (saved) {
      set({ ...saved.data });
    } else {
      const defaultAgentsRecord = DEFAULT_AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: agent }), {});
      set({ agents: defaultAgentsRecord });
    }
    set({ isHydrated: true });
  },

  register: (email, passwordHash) => {
    const { users } = get();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Este e-mail já está registrado.' };
    }
    const newUser: User = { id: crypto.randomUUID(), email, passwordHash };
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
    
    // Fallback para desenvolvimento (se não houver usuários)
    if (users.length === 0 && email === 'admin@forge.com' && passwordHash === 'admin') {
      const admin: User = { id: 'admin', email: 'admin@forge.com', passwordHash: 'admin' };
      set({ users: [admin], currentUser: admin, isAuthenticated: true });
      get().persist();
      return { success: true };
    }

    return { success: false, error: 'E-mail ou senha incorretos.' };
  },

  logout: () => {
    set({ isAuthenticated: false, currentUser: null, activeAgentId: null, activeSessionId: null });
    get().persist();
  },

  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),
  
  addCredits: (amount) => {
    set(state => ({ tokenBalance: state.tokenBalance + amount }));
    get().persist();
  },

  setActiveAgent: (id) => set({ activeAgentId: id }),
  setActiveSession: (id) => set({ activeSessionId: id }),

  saveAgent: (agent) => {
    set(state => ({ agents: { ...state.agents, [agent.id]: agent } }));
    get().persist();
  },

  deleteAgent: (id) => {
    set(state => {
      const { [id]: _, ...remaining } = state.agents;
      return { agents: remaining, activeAgentId: state.activeAgentId === id ? null : state.activeAgentId };
    });
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
