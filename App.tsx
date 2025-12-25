
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AgentEditor from './components/AgentEditor';
import LandingPage from './components/LandingPage';
import { useForgeStore } from './store';
import { AgentConfig } from './types';

const App: React.FC = () => {
  const { 
    isHydrated, hydrate, agents, sessions, reminders,
    activeAgentId, activeSessionId, setActiveAgent, 
    resetAll, saveAgent, deleteAgent 
  } = useForgeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined);

  useEffect(() => {
    hydrate();
  }, []);

  const activeAgent = useMemo(() => 
    agents.find(a => a.id === activeAgentId), 
    [agents, activeAgentId]
  );
  
  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId), 
    [sessions, activeSessionId]
  );

  const showLanding = activeAgentId === null;

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Initializing Forge Kernel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        onNewAgent={() => { setEditingAgent(undefined); setIsEditing(true); }}
        onGoHome={() => setActiveAgent(null)}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {showLanding ? (
          <LandingPage onGetStarted={() => { setEditingAgent(undefined); setIsEditing(true); }} />
        ) : (activeAgent && activeSession) ? (
          <ChatWindow 
            agent={activeAgent} 
            messages={activeSession.messages}
            onEditAgent={() => { setEditingAgent(activeAgent); setIsEditing(true); }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-10">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                <div className="text-center space-y-4">
                   <div className="text-4xl">⚠️</div>
                   <h2 className="text-white font-black uppercase tracking-widest text-sm">FALHA DE SINCRONIA</h2>
                   <p className="text-slate-500 text-xs">O kernel detectou uma inconsistência no agente selecionado ou sessão ativa.</p>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                   <button onClick={() => setActiveAgent(null)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase transition-all">
                     Voltar ao Centro de Controle
                   </button>
                   <button onClick={resetAll} className="w-full py-3 bg-slate-800 hover:bg-red-900/40 text-slate-400 rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-700">
                     Reset de Emergência (WIPE)
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {isEditing && (
        <AgentEditor 
          initialConfig={editingAgent}
          onSave={(cfg) => { saveAgent(cfg); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
          onDelete={(id) => { deleteAgent(id); setIsEditing(false); }}
        />
      )}
    </div>
  );
};

export default App;
