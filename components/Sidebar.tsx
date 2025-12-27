
import React, { useState } from 'react';
import { useForgeStore } from '../store';
import { ChatSession, AgentConfig } from '../types';

interface SidebarProps {
  onNewAgent: () => void;
  onGoHome: () => void;
  onOpenAdmin?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewAgent, onGoHome, onOpenAdmin }) => {
  const { 
    agents, sessions, activeAgentId, activeSessionId, tokenBalance, isTestMode,
    setActiveAgent, setActiveSession, createSession, renameSession, setCheckoutOpen
  } = useForgeStore();

  const agentsList: AgentConfig[] = Object.values(agents);
  const activeAgentSessions = sessions.filter(s => s.agentId === activeAgentId);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleFinishRename = (sessionId: string) => {
    if (editValue.trim()) renameSession(sessionId, editValue.trim());
    setEditingSessionId(null);
  };

  const balanceFormatted = isTestMode ? "ILIMITADO" : new Intl.NumberFormat('pt-BR').format(tokenBalance);

  return (
    <div className="w-80 h-full border-r border-slate-800 bg-[#020617] flex flex-col shrink-0 overflow-hidden">
      <div onClick={onGoHome} className="p-8 border-b border-slate-800 cursor-pointer hover:bg-slate-800/20 transition-colors group shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg">🤖</div>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight uppercase">Agentes de MCP</h1>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-black">Central de Controle</p>
          </div>
        </div>
      </div>

      {/* Widget de Carteira */}
      <div className={`p-6 border-b border-slate-800 transition-colors ${isTestMode ? 'bg-blue-600/10' : 'bg-slate-900/40'}`}>
         <div className="flex items-center justify-between mb-3">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isTestMode ? 'text-blue-400' : 'text-slate-500'}`}>
              {isTestMode ? 'Acesso de Auditoria' : 'Saldo Trial'}
            </span>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isTestMode ? 'bg-blue-400' : 'bg-emerald-500'}`}></span>
         </div>
         <div className="flex items-end gap-2">
            <span className={`text-2xl font-black leading-none ${isTestMode ? 'text-blue-400' : 'text-white'}`}>{balanceFormatted}</span>
            {!isTestMode && (
              <span className="text-[10px] text-emerald-500 font-bold mb-1 uppercase tracking-tighter">Créditos</span>
            )}
         </div>
         {isTestMode ? (
           <div className="mt-4 p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl">
             <p className="text-[8px] font-black text-blue-400 uppercase leading-tight">Link de testes ativo. Restrições de token desabilitadas.</p>
           </div>
         ) : (
           <button 
            onClick={() => setCheckoutOpen(true)}
            className="w-full mt-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
           >
             Adquirir Créditos
           </button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
        <div className="space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center justify-between">
            <span>Meus Agentes</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">{agentsList.length}</span>
          </div>
          <div className="space-y-1">
            {agentsList.map((agent: AgentConfig) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${
                  activeAgentId === agent.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/10' : 'hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <span className="text-2xl">{agent.icon}</span>
                <div className="flex-1 truncate">
                  <div className={`font-black text-sm truncate ${activeAgentId === agent.id ? 'text-white' : 'text-slate-200'}`}>{agent.name}</div>
                  <div className={`text-[10px] font-medium truncate ${activeAgentId === agent.id ? 'text-blue-100' : 'text-slate-500'}`}>Console operacional</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeAgentId && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sessões</div>
              <button onClick={() => createSession(activeAgentId)} className="text-[9px] bg-slate-800 hover:bg-blue-600 text-slate-400 px-2 py-1 rounded-lg transition-all font-black">+ NOVA</button>
            </div>
            <div className="space-y-1">
              {activeAgentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`group/session w-full text-left p-4 rounded-xl transition-all text-xs flex flex-col gap-1 border border-transparent cursor-pointer ${
                    activeSessionId === session.id ? 'bg-slate-800/50 border-slate-700 text-slate-100' : 'hover:bg-slate-800/20 text-slate-500'
                  }`}
                >
                  <div className="font-bold truncate">{session.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-800 shrink-0 space-y-3">
        <button onClick={onNewAgent} className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl">Novo Protocolo</button>
        {onOpenAdmin && (
          <button 
            onClick={onOpenAdmin} 
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Command Center
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
