
import { create } from 'zustand';
import { Dexie, type EntityTable } from 'dexie';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AgentConfig, ChatSession, AppState, ChatMessage, TaskResult } from './types';
import { DEFAULT_AGENTS } from './constants';

const supabaseUrl = 'https://udffqkgeiuatdkckjfhu.supabase.co';
const supabaseKey = 'sb_publishable_AObeZqTHVo5YcohbdehXrA_pl50Tr6U';

const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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
  isCloudSyncing: boolean;
  isCloudConnected: boolean;
  isCheckoutOpen: boolean;
  isTestMode: boolean;
  taskResults: TaskResult[];
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
  saveTaskResult: (agentId: string, taskName: string, folder: string, payload: any) => Promise<void>;
  fetchTaskResults: (agentId: string) => Promise<void>;
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
  tokenBalance: 30000,
  totalTokensConsumed: 0,
  isHydrated: false,
  isSaving: false,
  isCloudSyncing: false,
  isCloudConnected: false,
  isCheckoutOpen: false,
  isTestMode: false,
  engineStatus: 'healthy',
  clientId: 'client-' + crypto.randomUUID().slice(0, 8),
  taskResults: [],

  hydrate: async () => {
    const isTestUrl = new URLSearchParams(window.location.search).get('mode') === 'test';
    const saved = await db.state.get('main');
    let localData = saved ? saved.data : {};
    
    let cloudAgents: Record<string, AgentConfig> = {};
    let cloudIsUp = false;

    if (supabase) {
      try {
        const { data: allAgents, error } = await supabase
          .from('mcp_agents')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && allAgents) {
          cloudIsUp = true;
          allAgents.forEach(row => {
            cloudAgents[row.id] = row.config;
          });
        }
      } catch (e) {}
    }

    let agentsData = localData.agents || DEFAULT_AGENTS;
    if (Array.isArray(agentsData)) {
      agentsData = mapAgents(agentsData);
    }

    const mergedAgents = { ...agentsData, ...cloudAgents };

    set({ 
      ...localData,
      clientId: localData.clientId || get().clientId,
      agents: mergedAgents, 
      isHydrated: true, 
      isCloudConnected: cloudIsUp,
      isTestMode: isTestUrl || localData.isTestMode || false 
    });
  },

  saveTaskResult: async (agentId, taskName, folder, payload) => {
    const clientId = get().clientId;
    set({ isCloudSyncing: true });
    
    if (supabase) {
      try {
        await supabase.from('task_results').insert({
          client_id: clientId,
          agent_id: agentId,
          task_name: taskName,
          folder_path: folder,
          payload: payload
        });
        set({ isCloudConnected: true });
        // Recarregar resultados locais
        get().fetchTaskResults(agentId);
      } catch (e) {
        set({ isCloudConnected: false });
      }
    }
    set({ isCloudSyncing: false });
  },

  fetchTaskResults: async (agentId) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('task_results')
      .select('*')
      .eq('client_id', get().clientId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ taskResults: data.map(d => ({
        id: d.id,
        client_id: d.client_id,
        agent_id: d.agent_id,
        task_name: d.task_name,
        folder_path: d.folder_path,
        payload: d.payload,
        created_at: new Date(d.created_at).getTime()
      })) });
    }
  },

  enableTestMode: () => set({ isTestMode: true }),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),

  consumeTokens: (amount) => {
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
    if (id) get().fetchTaskResults(id);
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

  saveAgent: async (agent) => {
    set({ isCloudSyncing: true });
    if (supabase) {
      try {
        await supabase.from('mcp_agents').upsert({
          id: agent.id,
          config: agent,
          updated_at: new Date().toISOString(),
          is_test_mode: get().isTestMode
        });
        set({ isCloudConnected: true });
      } catch (e) {
        set({ isCloudConnected: false });
      }
    }
    set(state => ({
      agents: { ...state.agents, [agent.id]: agent },
      activeAgentId: agent.id,
      isCloudSyncing: false
    }));
    get().persist();
  },

  deleteAgent: async (id) => {
    set({ isCloudSyncing: true });
    if (supabase) {
      try {
        await supabase.from('mcp_agents').delete().eq('id', id);
        await supabase.from('task_results').delete().eq('agent_id', id);
      } catch (e) {}
    }
    set(state => {
      const { [id]: _, ...remainingAgents } = state.agents;
      return { 
        agents: remainingAgents, 
        activeAgentId: state.activeAgentId === id ? null : state.activeAgentId,
        isCloudSyncing: false
      };
    });
    get().persist();
  },

  renameSession: (id, title) => set(state => ({ 
    sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s) 
  })),

  persist: async () => {
    set({ isSaving: true });
    const { agents, activeAgentId, activeSessionId, sessions, reminders, tokenBalance, totalTokensConsumed, isTestMode, clientId } = get();
    await db.state.put({ 
      id: 'main', 
      data: { agents, activeAgentId, activeSessionId, sessions, reminders, tokenBalance, totalTokensConsumed, isTestMode, clientId } 
    });
    setTimeout(() => set({ isSaving: false }), 300);
  },

  resetAll: async () => { 
    if (confirm("Reset total?")) {
      if (supabase) {
        await supabase.from('mcp_agents').delete().neq('id', 'void');
        await supabase.from('task_results').delete().neq('id', 'void');
      }
      await db.state.clear(); 
      window.location.reload(); 
    }
  }
}));
