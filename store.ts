
import { create } from 'zustand';
import { Dexie, type EntityTable } from 'dexie';
import { z } from 'zod';
import { AgentConfig, ChatSession, AppState, ActionReminder, ChatMessage } from './types';
import { DEFAULT_AGENTS } from './constants';

// --- DATABASE LAYER (Dexie) ---
// Using named import for Dexie to resolve the inheritance type error:
// "Property 'version' does not exist on type 'ForgeDatabase'"
class ForgeDatabase extends Dexie {
  state!: EntityTable<{ id: string; data: any }, 'id'>;

  constructor() {
    super('ForgeEnterpriseDB');
    this.version(1).stores({
      state: 'id'
    });
  }
}

const db = new ForgeDatabase();

// --- SCHEMA VALIDATION (Zod) ---
const AppStateSchema = z.object({
  agents: z.array(z.any()),
  activeAgentId: z.string().nullable(),
  activeSessionId: z.string().nullable(),
  sessions: z.array(z.any()),
  reminders: z.array(z.any())
});

interface ForgeStore extends AppState {
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setActiveAgent: (id: string | null) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessage: (sessionId: string, data: Partial<ChatMessage>) => void;
  saveAgent: (agent: AgentConfig) => void;
  deleteAgent: (id: string) => void;
  createSession: (agentId: string) => string;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  createReminder: (reminder: Partial<ActionReminder>) => void;
  toggleReminder: (id: string) => void;
  resetAll: () => Promise<void>;
}

export const useForgeStore = create<ForgeStore>((set, get) => ({
  agents: DEFAULT_AGENTS,
  activeAgentId: null,
  activeSessionId: null,
  sessions: [],
  reminders: [],
  isHydrated: false,

  hydrate: async () => {
    const saved = await db.state.get('main');
    if (saved) {
      try {
        const validated = AppStateSchema.parse(saved.data);
        set({ ...validated, isHydrated: true });
      } catch (e) {
        console.error("Schema mismatch, using defaults", e);
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  },

  setActiveAgent: (id) => {
    const sessions = get().sessions.filter(s => s.agentId === id);
    const sessionId = sessions.length > 0 ? sessions[0].id : null;
    set({ activeAgentId: id, activeSessionId: sessionId });
    get().persist();
  },

  setActiveSession: (id) => {
    set({ activeSessionId: id });
    get().persist();
  },

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
      sessions: state.sessions.map(s => {
        if (s.id === sessionId) {
          const newMessages = [...s.messages, message];
          let title = s.title;
          if (s.messages.length === 0 || s.title === 'Nova Conversa') {
            const clean = (message.content || 'Análise').replace(/\[.*?\]/g, '').trim();
            title = clean.slice(0, 32) + (clean.length > 32 ? '...' : '');
          }
          return { ...s, messages: newMessages, title };
        }
        return s;
      })
    }));
    get().persist();
  },

  updateLastMessage: (sessionId, data) => {
    set(state => ({
      sessions: state.sessions.map(s => {
        if (s.id === sessionId) {
          const newMessages = [...s.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = { 
              ...newMessages[newMessages.length - 1], 
              ...data,
              isStreaming: false 
            };
          }
          return { ...s, messages: newMessages };
        }
        return s;
      })
    }));
    get().persist();
  },

  saveAgent: (agent) => {
    set(state => {
      const idx = state.agents.findIndex(a => a.id === agent.id);
      const newAgents = [...state.agents];
      if (idx >= 0) newAgents[idx] = agent;
      else newAgents.push(agent);
      return { agents: newAgents, activeAgentId: agent.id };
    });
    get().persist();
  },

  deleteAgent: (id) => {
    set(state => ({
      agents: state.agents.filter(a => a.id !== id),
      sessions: state.sessions.filter(s => s.agentId !== id),
      activeAgentId: state.activeAgentId === id ? null : state.activeAgentId
    }));
    get().persist();
  },

  deleteSession: (id) => {
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
    }));
    get().persist();
  },

  renameSession: (id, title) => {
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s)
    }));
    get().persist();
  },

  createReminder: (reminder) => {
    const nr = { ...reminder, id: crypto.randomUUID(), completed: false, createdAt: Date.now() } as ActionReminder;
    set(state => ({ reminders: [nr, ...state.reminders] }));
    get().persist();
  },

  toggleReminder: (id) => {
    set(state => ({
      reminders: state.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
    }));
    get().persist();
  },

  persist: async () => {
    const { agents, activeAgentId, activeSessionId, sessions, reminders } = get();
    await db.state.put({ 
      id: 'main', 
      data: { agents, activeAgentId, activeSessionId, sessions, reminders } 
    });
  },

  resetAll: async () => {
    await db.state.clear();
    window.location.reload();
  }
}));
