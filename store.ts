
import { create } from 'zustand';
import { Dexie, type EntityTable } from 'dexie';
import { AgentConfig, ChatSession, AppState, ChatMessage } from './types';
import { DEFAULT_AGENTS } from './constants';

class ForgeDatabase extends Dexie {
  state!: EntityTable<{ id: string; data: any }, 'id'>;
  constructor() {
    super('ForgeEnterpriseDB');
    (this as Dexie).version(2).stores({ state: 'id' });
  }
}

const db = new ForgeDatabase();

const mapAgents = (agentsArray: AgentConfig[]): Record<string, AgentConfig> => {
  return agentsArray.reduce((acc, agent) => ({ ...acc, [agent.id]: agent }), {});
};

interface ForgeStore extends AppState {
  isHydrated: boolean;
  isSaving: boolean;
  isCheckoutOpen: boolean;
  isTestMode: boolean; // Flag para ignorar restrições de tokens
  hydrate: () => Promise<void>;
  setCheckoutOpen: (open: boolean) => void;
  setActiveAgent: (id: string | null) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessage: (sessionId: string, data: Partial<ChatMessage>) => void;
  consumeTokens: (amount: number) => void;
  addCredits: (amount: number) => void;
  saveAgent: (agent: AgentConfig) => void;
  deleteAgent: (id: string) => void;
  createSession: (agentId: string) => string;
  persist: () => Promise<void>;
  resetAll: () => Promise<void>;
  renameSession: (id: string, title: string) => void;
  enableTestMode: () => void;
}

export const useForgeStore = create<ForgeStore>((set, get) => ({
  agents: mapAgents(DEFAULT_AGENTS),
  activeAgentId: null,
  activeSessionId: null,
  sessions: [],
  reminders: [],
  tokenBalance: 30000, // Saldo inicial Trial atualizado para 30k
  totalTokensConsumed: 0,
  isHydrated: false,
  isSaving: false,
  isCheckoutOpen: false,
  isTestMode: false,

  hydrate: async () => {
    // Verificar se estamos em modo de teste via URL antes da hidratação
    const isTestUrl = new URLSearchParams(window.location.search).get('mode') === 'test';
    
    const saved = await db.state.get('main');
    if (saved) {
      let agentsData = saved.data.agents;
      if (Array.isArray(agentsData)) {
        agentsData = mapAgents(agentsData);
      }
      set({ 
        ...saved.data, 
        agents: agentsData, 
        isHydrated: true, 
        isTestMode: isTestUrl || saved.data.isTestMode || false 
      });
    } else {
      set({ isHydrated: true, isTestMode: isTestUrl });
    }
  },

  enableTestMode: () => set({ isTestMode: true }),

  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),

  consumeTokens: (amount) => {
    // Se estiver em modo de teste, não subtrai saldo nem aumenta consumo total
    if (get().isTestMode) return;

    set(state => ({
      tokenBalance: Math.max(0, state.tokenBalance - amount),
      totalTokensConsumed: state.totalTokensConsumed + amount
    }));
    get().persist();
  },

  addCredits: (amount) => {
    set(state => ({ 
      tokenBalance: state.tokenBalance + amount,
      isCheckoutOpen: false 
    }));
    get().persist();
  },

  setActiveAgent: (id) => {
    const state = get();
    const firstSessionForAgent = state.sessions.find(s => s.agentId === id);
    set({ 
      activeAgentId: id, 
      activeSessionId: firstSessionForAgent ? firstSessionForAgent.id : null 
    });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  createSession: (agentId) => {
    const newSession: ChatSession = { 
      id: crypto.randomUUID(), 
      agentId, 
      title: 'Nova Conversa', 
      messages: [], 
      createdAt: Date.now() 
    };
    set(state => ({ 
      sessions: [newSession, ...state.sessions], 
      activeSessionId: newSession.id, 
      activeAgentId: agentId 
    }));
    get().persist();
    return newSession.id;
  },

  addMessage: (sessionId, message) => {
    set(state => ({
      sessions: state.sessions.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s)
    }));
    get().persist();
  },

  updateLastMessage: (sessionId, data) => {
    set(state => ({
      sessions: state.sessions.map(s => {
        if (s.id === sessionId) {
          const msgs = [...s.messages];
          if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...data };
          return { ...s, messages: msgs };
        }
        return s;
      })
    }));
    get().persist();
  },

  saveAgent: (agent) => {
    set(state => ({
      agents: {
        ...state.agents,
        [agent.id]: agent
      },
      activeAgentId: agent.id
    }));
    get().persist();
  },

  deleteAgent: (id) => set(state => {
    const { [id]: _, ...remainingAgents } = state.agents;
    return { 
      agents: remainingAgents, 
      activeAgentId: state.activeAgentId === id ? null : state.activeAgentId 
    };
  }),

  renameSession: (id, title) => set(state => ({ 
    sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s) 
  })),

  persist: async () => {
    set({ isSaving: true });
    const { agents, activeAgentId, activeSessionId, sessions, reminders, tokenBalance, totalTokensConsumed, isTestMode } = get();
    await db.state.put({ 
      id: 'main', 
      data: { agents, activeAgentId, activeSessionId, sessions, reminders, tokenBalance, totalTokensConsumed, isTestMode } 
    });
    setTimeout(() => set({ isSaving: false }), 300);
  },

  resetAll: async () => { await db.state.clear(); window.location.reload(); }
}));
