
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
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-10">
        <div className="w-24 h-24 bg-blue-600/20 rounded-[2.5rem] flex items-center justify-center text-4xl border border-blue-500/30">🔑</div>
        <div className="space-y-4 max-w-md">
           <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Billing Required</h1>
           <p className="text-slate-500 text-sm font-medium">Selecione uma chave de API paga para acessar as capacidades Enterprise de RPA.</p>
        </div>
        <button 
          onClick={async () => {
            await (window as any).aistudio.openSelectKey();
            setHasApiKey(true);
          }}
          className="px-12 py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl"
        >
          Selecionar Chave de API
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
        onGoHome={() => { setActiveAgent(null); setActiveSession(null); setShowIntelligence(false); setShowAdmin(false); }}
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
            onDeploy={(config) => { saveAgent(config); setIsVocalArchitectOpen(false); setActiveAgent(config.id); }}
            onClose={() => setIsVocalArchitectOpen(false)}
          />
        )}
      </main>

      {isEditing && (
        <AgentEditor 
          initialConfig={editingAgent}
          onSave={(cfg) => { saveAgent(cfg); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
          onDelete={(id) => { useForgeStore.getState().deleteAgent(id); setIsEditing(false); }}
        />
      )}

      {isCheckoutOpen && <CheckoutModal />}
    </div>
  );
};

export default App;
