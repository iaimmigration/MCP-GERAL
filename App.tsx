
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AgentEditor from './components/AgentEditor';
import IntelligenceCenter from './components/IntelligenceCenter';
import MissionControl from './components/MissionControl';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import AuthGate from './components/AuthGate';
import VocalArchitect from './components/VocalArchitect';
import { useForgeStore } from './store';
import { AgentConfig } from './types';

const App: React.FC = () => {
  const { 
    isHydrated, isCheckoutOpen, hydrate, agents, sessions,
    activeAgentId, activeSessionId, setActiveAgent, setActiveSession,
    isAuthenticated, saveAgent, vocalDraft, setVocalDraft
  } = useForgeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isVocalArchitectOpen, setIsVocalArchitectOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined);
  
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    hydrate().then(async () => {
      if (isAuthenticated) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    });
  }, [isAuthenticated, hydrate]);

  const activeAgent = activeAgentId ? agents[activeAgentId] : null;
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);

  if (!isHydrated) return null;
  if (!isAuthenticated) return <AuthGate />;

  if (hasApiKey === false) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="w-28 h-28 bg-blue-600/10 rounded-[3rem] flex items-center justify-center text-5xl border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)] relative z-10 animate-pulse">🔑</div>
        <div className="space-y-6 max-w-lg relative z-10">
           <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Kernel Lock: Billing Required</h1>
           <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase tracking-tight">Selecione uma chave de API de um projeto faturado para ativar os protocolos de RPA Enterprise do Forge OS.</p>
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest block">Consultar Documentação de Faturamento</a>
        </div>
        <button 
          onClick={async () => {
            // Assume success immediately to avoid race condition
            await (window as any).aistudio.openSelectKey();
            setHasApiKey(true);
          }}
          className="px-16 py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all active:scale-95 relative z-10"
        >
          Autenticar Chave Master
        </button>
      </div>
    );
  }

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setIsEditing(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a1128] overflow-hidden font-sans">
      <Sidebar 
        onNewAgent={() => { setEditingAgent(undefined); setIsEditing(true); }}
        onOpenVocalArchitect={() => setIsVocalArchitectOpen(true)}
        onGoHome={() => { 
          setActiveAgent(null); 
          setActiveSession(null); 
          setShowIntelligence(false); 
          setShowAdmin(false); 
        }}
        onOpenAdmin={() => { setShowAdmin(true); setActiveAgent(null); }}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative bg-black/20">
        {showAdmin ? (
          <AdminPanel onBack={() => setShowAdmin(false)} />
        ) : showIntelligence ? (
          <IntelligenceCenter onBack={() => setShowIntelligence(false)} />
        ) : activeAgent ? (
          activeSession ? (
            <ChatWindow 
              agent={activeAgent} 
              messages={activeSession.messages}
              onEditAgent={() => handleEditAgent(activeAgent)}
            />
          ) : (
            <MissionControl 
              agent={activeAgent} 
              onOpenChat={() => {}}
              onEdit={() => handleEditAgent(activeAgent)}
              onBack={() => setActiveAgent(null)}
            />
          )
        ) : (
          <Dashboard onEditAgent={handleEditAgent} />
        )}

        {isVocalArchitectOpen && (
          <VocalArchitect 
            currentConfig={vocalDraft}
            onUpdate={(partial) => setVocalDraft(partial)}
            onDeploy={(config) => { 
              saveAgent(config); 
              setIsVocalArchitectOpen(false); 
              setActiveAgent(config.id); 
            }}
            onClose={() => setIsVocalArchitectOpen(false)}
          />
        )}
      </main>

      {isEditing && (
        <AgentEditor 
          initialConfig={editingAgent}
          onSave={(cfg) => { saveAgent(cfg); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
          onDelete={(id) => { 
            useForgeStore.getState().deleteAgent(id); 
            setIsEditing(false); 
          }}
        />
      )}

      {isCheckoutOpen && <CheckoutModal />}
    </div>
  );
};

export default App;
