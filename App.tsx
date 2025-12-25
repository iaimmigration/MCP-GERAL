
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AgentEditor from './components/AgentEditor';
import LandingPage from './components/LandingPage';
import { AgentConfig, ChatMessage, ChatSession, AppState, ActionReminder } from './types';
import { DEFAULT_AGENTS } from './constants';

const STORAGE_KEY = 'mcp_agent_forge_enterprise_v12';

// Utility for safe session title generation
const generateSessionTitle = (message: string): string => {
  const clean = message.replace(/\[.*?\]/g, '').trim();
  if (!clean) return 'Consulta MCP';
  return clean.slice(0, 32) + (clean.length > 32 ? '...' : '');
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    console.log("[BOOT] Lendo armazenamento local...");
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic schema validation check
        if (Array.isArray(parsed.agents) && Array.isArray(parsed.sessions)) {
          console.log("[BOOT] Integridade de dados validada.");
          return parsed;
        }
      } catch (e) {
        console.error("[BOOT] Falha na validação de esquema. Resetando...");
      }
    }
    return {
      agents: DEFAULT_AGENTS,
      activeAgentId: null,
      activeSessionId: null,
      sessions: [],
      reminders: []
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined);

  // PERFORMANCE: DEBOUNCED PERSISTENCE
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 800);
    return () => clearTimeout(handler);
  }, [state]);

  // DERIVED STATE: REACTIVE UI
  const activeAgent = useMemo(() => 
    state.agents.find(a => a.id === state.activeAgentId), 
    [state.agents, state.activeAgentId]
  );
  
  const activeSession = useMemo(() => 
    state.sessions.find(s => s.id === state.activeSessionId), 
    [state.sessions, state.activeSessionId]
  );

  const showLanding = state.activeAgentId === null;

  // KERNEL GUARDIAN: AUTO-REPAIR SYSTEM
  useEffect(() => {
    if (state.activeAgentId && !activeAgent) {
      console.warn("[GUARDIAN] Agente órfão detectado. Redirecionando...");
      setState(prev => ({ ...prev, activeAgentId: null, activeSessionId: null }));
    }
    if (state.activeSessionId && !activeSession && activeAgent) {
      const fallback = state.sessions.find(s => s.agentId === state.activeAgentId);
      setState(prev => ({ ...prev, activeSessionId: fallback?.id || null }));
    }
  }, [state.activeAgentId, activeAgent, state.activeSessionId, activeSession]);

  const handleSelectAgent = (id: string) => {
    setState(prev => {
      const agentSessions = prev.sessions.filter(s => s.agentId === id);
      const existingSessionId = agentSessions.length > 0 ? agentSessions[0].id : null;

      if (!existingSessionId) {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          agentId: id,
          title: 'Nova Conversa',
          messages: [],
          createdAt: Date.now()
        };
        return {
          ...prev,
          activeAgentId: id,
          activeSessionId: newSession.id,
          sessions: [newSession, ...prev.sessions]
        };
      }

      return {
        ...prev,
        activeAgentId: id,
        activeSessionId: existingSessionId
      };
    });
  };

  const handleNewSession = (agentId: string) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      agentId: agentId,
      title: 'Nova Conversa',
      messages: [],
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      activeAgentId: agentId,
      activeSessionId: newSession.id,
      sessions: [newSession, ...prev.sessions]
    }));
  };

  const handleSaveAgent = (config: AgentConfig) => {
    setState(prev => {
      const existingIdx = prev.agents.findIndex(a => a.id === config.id);
      let newAgents = [...prev.agents];
      if (existingIdx >= 0) newAgents[existingIdx] = config;
      else newAgents.push(config);

      const agentSessions = prev.sessions.filter(s => s.agentId === config.id);
      let activeSessionId = null;
      let newSessions = [...prev.sessions];

      if (agentSessions.length === 0) {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          agentId: config.id,
          title: 'Nova Conversa',
          messages: [],
          createdAt: Date.now()
        };
        newSessions = [newSession, ...newSessions];
        activeSessionId = newSession.id;
      } else {
        activeSessionId = agentSessions[0].id;
      }

      return { 
        ...prev, 
        agents: newAgents, 
        sessions: newSessions,
        activeAgentId: config.id,
        activeSessionId: activeSessionId
      };
    });
    setIsEditing(false);
    setEditingAgent(undefined);
  };

  const handleEmergencyReset = () => {
    if (confirm("Deseja realizar o WIPE TOTAL dos dados locais?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const handleSendMessage = (msg: ChatMessage) => {
    if (!state.activeSessionId) return;
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => {
        if (s.id === prev.activeSessionId) {
          const newMessages = [...s.messages, msg];
          let title = s.title;
          if (s.messages.length === 0 || s.title === 'Nova Conversa') {
            title = generateSessionTitle(msg.content || (msg.attachments?.length ? 'Análise Visual' : ''));
          }
          return { ...s, messages: newMessages, title };
        }
        return s;
      })
    }));
  };

  const handleUpdateLastMessage = (content: string, grounding?: { uri: string; title: string }[], thought?: string, images?: string[]) => {
    if (!state.activeSessionId) return;
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => {
        if (s.id === prev.activeSessionId) {
          const newMessages = [...s.messages];
          if (newMessages.length > 0) {
            const lastIdx = newMessages.length - 1;
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              content,
              groundingUrls: grounding,
              thought: thought || newMessages[lastIdx].thought,
              generatedImages: images || newMessages[lastIdx].generatedImages,
              isStreaming: false
            };
          }
          return { ...s, messages: newMessages };
        }
        return s;
      })
    }));
  };

  const handleRenameSession = (sessionId: string, title: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, title } : s)
    }));
  };

  const handleDeleteSession = (sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId),
      activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId
    }));
  };

  const handleToggleReminder = (id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
    }));
  };

  const handleCreateReminder = (r: Partial<ActionReminder>) => {
    const nr = { ...r, id: crypto.randomUUID(), completed: false, createdAt: Date.now() } as ActionReminder;
    setState(prev => ({ ...prev, reminders: [nr, ...prev.reminders] }));
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        agents={state.agents} 
        sessions={state.sessions}
        reminders={state.reminders}
        activeAgentId={state.activeAgentId} 
        activeSessionId={state.activeSessionId}
        onSelectAgent={handleSelectAgent}
        onSelectSession={(id) => setState(prev => ({ ...prev, activeSessionId: id }))}
        onNewAgent={() => { setEditingAgent(undefined); setIsEditing(true); }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onGoHome={() => setState(prev => ({ ...prev, activeAgentId: null, activeSessionId: null }))}
        onToggleReminder={handleToggleReminder}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {showLanding ? (
          <LandingPage onGetStarted={() => { setEditingAgent(undefined); setIsEditing(true); }} />
        ) : (activeAgent && activeSession) ? (
          <ChatWindow 
            agent={activeAgent} 
            messages={activeSession.messages}
            reminders={state.reminders}
            onSendMessage={handleSendMessage}
            onUpdateLastMessage={handleUpdateLastMessage}
            onEditAgent={() => { setEditingAgent(activeAgent); setIsEditing(true); }}
            onCreateReminder={handleCreateReminder}
            onToggleReminder={handleToggleReminder}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-10">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center gap-6">
                   <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-400">MCP</div>
                   </div>
                   <div className="text-center">
                     <h2 className="text-white font-black uppercase tracking-widest text-sm">Integridade de Kernel</h2>
                     <p className="text-slate-500 text-[10px] mt-2 font-mono">Validando checkpoints de persistência...</p>
                   </div>
                </div>

                <div className="space-y-3 bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Status do Agente:</span>
                      <span className={activeAgent ? "text-emerald-400" : "text-amber-400"}>
                        {activeAgent ? "VÁLIDO" : "NULO/AGUARDANDO"}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Sessão Ativa:</span>
                      <span className={activeSession ? "text-emerald-400" : "text-red-400"}>
                        {activeSession ? "OK" : "PENDENTE"}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Data Schema:</span>
                      <span className="text-emerald-400 font-mono">V12_VALID</span>
                   </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                   <button 
                     onClick={() => setState(prev => ({ ...prev, activeAgentId: null, activeSessionId: null }))}
                     className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Redirecionar para Painel Central
                   </button>
                   <button 
                     onClick={handleEmergencyReset}
                     className="w-full py-3 bg-slate-800 hover:bg-red-900/40 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700"
                   >
                     Reset de Emergência (Limpar Storage)
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {isEditing && (
        <AgentEditor 
          initialConfig={editingAgent}
          onSave={handleSaveAgent}
          onCancel={() => setIsEditing(false)}
          onDelete={(id) => {
            setState(prev => ({
              ...prev,
              agents: prev.agents.filter(a => a.id !== id),
              sessions: prev.sessions.filter(s => s.agentId !== id),
              reminders: prev.reminders.filter(r => r.agentId !== id),
              activeAgentId: null,
              activeSessionId: null
            }));
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
