
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AgentEditor from './components/AgentEditor';
import LandingPage from './components/LandingPage';
import { AgentConfig, ChatMessage, ChatSession, AppState, ActionReminder } from './types';
import { DEFAULT_AGENTS } from './constants';

const STORAGE_KEY = 'mcp_agent_forge_enterprise_v12';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    console.log("[BOOT] Inicializando leitura do LocalStorage...");
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("[BOOT] Dados recuperados com sucesso.");
        return parsed;
      } catch (e) {
        console.error("[BOOT] Erro crítico ao processar LocalStorage:", e);
      }
    }
    console.log("[BOOT] Utilizando configuração padrão de fábrica.");
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
  const [showLanding, setShowLanding] = useState(state.activeAgentId === null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeAgent = state.agents.find(a => a.id === state.activeAgentId);
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);

  // LOGS DE DIAGNÓSTICO
  useEffect(() => {
    console.group("Forge State Monitor");
    console.log("Agent Ativo ID:", state.activeAgentId);
    console.log("Session Ativa ID:", state.activeSessionId);
    console.log("Agent Localizado:", !!activeAgent);
    console.log("Session Localizada:", !!activeSession);
    console.log("Total Sessões:", state.sessions.length);
    console.groupEnd();
  }, [state.activeAgentId, state.activeSessionId, state.sessions.length]);

  const handleSelectAgent = (id: string) => {
    console.log(`[ACTION] Selecionando Agente: ${id}`);
    setState(prev => {
      const agentSessions = prev.sessions.filter(s => s.agentId === id);
      const existingSessionId = agentSessions.length > 0 ? agentSessions[0].id : null;

      if (!existingSessionId) {
        console.log("[SYNC] Nenhuma sessão encontrada para este agente. Criando nova...");
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
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

      console.log(`[SYNC] Vinculando à sessão existente: ${existingSessionId}`);
      return {
        ...prev,
        activeAgentId: id,
        activeSessionId: existingSessionId
      };
    });
    setShowLanding(false);
  };

  const handleNewSession = (agentId: string) => {
    console.log(`[ACTION] Iniciando nova sessão para: ${agentId}`);
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
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
    setShowLanding(false);
  };

  const handleSaveAgent = (config: AgentConfig) => {
    console.log(`[FORGE] Comissionando Agente: ${config.name}`);
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
          id: `session-${Date.now()}`,
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
    setShowLanding(false);
  };

  const handleEmergencyReset = () => {
    if (confirm("Deseja resetar a Forja? Isso apagará todos os agentes e conversas customizadas.")) {
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
            const raw = msg.content || (msg.attachments?.length ? 'Análise Visual' : 'Consulta MCP');
            title = raw.slice(0, 32) + (raw.length > 32 ? '...' : '');
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
        onDeleteSession={(id) => setState(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }))}
        onRenameSession={(id, title) => setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === id ? {...s, title} : s) }))}
        onGoHome={() => { setShowLanding(true); setState(prev => ({ ...prev, activeAgentId: null, activeSessionId: null })); }}
        onToggleReminder={(id) => setState(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? {...r, completed: !r.completed} : r) }))}
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
            onCreateReminder={(r) => {
              const nr = { ...r, id: `t-${Date.now()}`, completed: false, createdAt: Date.now() } as ActionReminder;
              setState(prev => ({ ...prev, reminders: [nr, ...prev.reminders] }));
            }}
            onToggleReminder={(id) => setState(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? {...r, completed: !r.completed} : r) }))}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-10">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                   <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-400">MCP</div>
                   </div>
                   <div className="text-center">
                     <h2 className="text-white font-black uppercase tracking-widest text-sm">Diagnóstico de Kernel</h2>
                     <p className="text-slate-500 text-[10px] mt-2 font-mono">Sincronização em curso...</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Agente Ativo:</span>
                      <span className={state.activeAgentId ? "text-emerald-400" : "text-red-400"}>{state.activeAgentId ? "OK" : "PENDENTE"}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Agente Localizado:</span>
                      <span className={activeAgent ? "text-emerald-400" : "text-red-400"}>{activeAgent ? "OK" : "ERRO"}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Sessão Ativa:</span>
                      <span className={state.activeSessionId ? "text-emerald-400" : "text-red-400"}>{state.activeSessionId ? "OK" : "PENDENTE"}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-500">Integridade DB:</span>
                      <span className="text-emerald-400">ESTÁVEL</span>
                   </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                   <button 
                     onClick={() => {
                        if (state.activeAgentId) handleSelectAgent(state.activeAgentId);
                     }}
                     className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Tentar Forçar Sincronia
                   </button>
                   <button 
                     onClick={handleEmergencyReset}
                     className="w-full py-3 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700 hover:border-red-900/50"
                   >
                     Reset de Emergência (Wipe)
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
            setShowLanding(true);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
