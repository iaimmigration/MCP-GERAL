
import React, { useState } from 'react';
import { useForgeStore } from '../store';
import { ChatSession, AgentConfig } from '../types';

interface SidebarProps {
  onNewAgent: () => void;
  onGoHome: () => void;
  onOpenAdmin?: () => void; // Novo Prop
}

const Sidebar: React.FC<SidebarProps> = ({ onNewAgent, onGoHome, onOpenAdmin }) => {
  const { 
    agents, sessions, activeAgentId, activeSessionId, tokenBalance,
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

  const balanceFormatted = new Intl.NumberFormat('pt-BR').format(tokenBalance);

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
      <div className="p-6 bg-slate-900/40 border-b border-slate-800">
         <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saldo na Nuvem</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
         </div>
         <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white leading-none">{balanceFormatted}</span>
            <span className="text-[10px] text-emerald-500 font-bold mb-1 uppercase tracking-tighter">Créditos MCP</span>
         </div>
         <button 
          onClick={() => setCheckoutOpen(true)}
          className="w-full mt-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
         >
           Adquirir Créditos
         </button>
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
                  <div className={`text-[10px] font-medium truncate ${activeAgentId === agent.id ? 'text-blue-100' : 'text-slate-500'}`}>Abrir console</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeAgentId && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sessões Ativas</div>
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
        <button onClick={onNewAgent} className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl">Configurar Agente</button>
        {onOpenAdmin && (
          <button 
            onClick={onOpenAdmin} 
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Command Center
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
