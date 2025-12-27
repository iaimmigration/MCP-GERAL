
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AgentEditor from './components/AgentEditor';
import LandingPage from './components/LandingPage';
import IntelligenceCenter from './components/IntelligenceCenter';
import MissionControl from './components/MissionControl';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import { useForgeStore } from './store';
import { AgentConfig } from './types';

const App: React.FC = () => {
  const { 
    isHydrated, isSaving, isCheckoutOpen, hydrate, agents, sessions,
    activeAgentId, activeSessionId, setActiveAgent, setActiveSession,
    resetAll, saveAgent, deleteAgent, createSession, persist 
  } = useForgeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      persist();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [persist]);

  const activeAgent = activeAgentId ? agents[activeAgentId] : null;
  
  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId), 
    [sessions, activeSessionId]
  );

  const showLanding = activeAgentId === null && !showIntelligence && !showAdmin;

  const handleOpenChat = () => {
    if (activeAgentId) {
      if (!activeSessionId) {
        createSession(activeAgentId);
      }
    }
  };

  const handleGoHome = () => {
    setActiveAgent(null);
    setActiveSession(null);
    setShowIntelligence(false);
    setShowAdmin(false);
  };

  const handleStartEdit = (agentToEdit?: AgentConfig) => {
    setEditingAgent(agentToEdit);
    setIsEditing(true);
  };

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Iniciando Protocolo MCP...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        onNewAgent={() => handleStartEdit(undefined)}
        onGoHome={handleGoHome}
        onOpenAdmin={() => { setShowAdmin(true); setActiveAgent(null); }}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {showAdmin ? (
          <AdminPanel onBack={() => setShowAdmin(false)} />
        ) : showIntelligence ? (
          <IntelligenceCenter onBack={() => setShowIntelligence(false)} />
        ) : showLanding ? (
          <LandingPage 
            onGetStarted={() => handleStartEdit(undefined)} 
            onViewIntelligence={() => setShowIntelligence(true)}
          />
        ) : activeAgent ? (
          activeSession ? (
            <ChatWindow 
              agent={activeAgent} 
              messages={activeSession.messages}
              onEditAgent={() => handleStartEdit(activeAgent)}
            />
          ) : (
            <MissionControl 
              agent={activeAgent} 
              onOpenChat={handleOpenChat}
              onEdit={() => handleStartEdit(activeAgent)}
              onBack={handleGoHome}
            />
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-10">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                <div className="text-center space-y-4">
                   <div className="text-4xl">⚠️</div>
                   <h2 className="text-white font-black uppercase tracking-widest text-sm">NÚCLEO NÃO ENCONTRADO</h2>
                   <p className="text-slate-500 text-xs">O agente selecionado não respondeu aos sinais.</p>
                </div>
                <button onClick={handleGoHome} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase transition-all">
                   Voltar ao Dashboard
                </button>
             </div>
          </div>
        )}

        <div className="absolute bottom-4 right-8 pointer-events-none z-50">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur transition-all duration-500 ${isSaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Banco MCP</span>
           </div>
        </div>
      </main>

      {isEditing && (
        <AgentEditor 
          initialConfig={editingAgent}
          onSave={(cfg) => { saveAgent(cfg); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
          onDelete={(id) => { deleteAgent(id); setIsEditing(false); }}
        />
      )}

      {isCheckoutOpen && <CheckoutModal />}
    </div>
  );
};

export default App;
