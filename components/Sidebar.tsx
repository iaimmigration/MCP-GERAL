
import React from 'react';
import { useForgeStore } from '../store';
import { AgentConfig } from '../types';

interface SidebarProps {
  onNewAgent: () => void;
  onOpenVocalArchitect: () => void;
  onGoHome: () => void;
  onOpenAdmin?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewAgent, onOpenVocalArchitect, onGoHome, onOpenAdmin }) => {
  const { 
    agents, sessions, activeAgentId, activeSessionId, tokenBalance,
    setActiveAgent, setActiveSession, 
    createSession, setCheckoutOpen, currentUser, logout
  } = useForgeStore();

  const agentsList: AgentConfig[] = Object.values(agents);
  
  return (
    <div className="w-80 h-full border-r border-blue-900 bg-[#0a1128] flex flex-col shrink-0 overflow-hidden">
      <div className="p-8 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between mb-6">
           <div onClick={onGoHome} className="flex items-center gap-3 cursor-pointer group">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">🤖</div>
             <div>
               <h1 className="text-sm font-black text-white leading-none tracking-tight uppercase">Forge Staffing</h1>
               <p className="text-[8px] mt-1 text-blue-400 uppercase tracking-widest font-black">Digital Workforce OS</p>
             </div>
           </div>
           <button onClick={logout} className="p-2 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-red-500 transition-all" title={currentUser?.email}>
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
           </button>
        </div>
      </div>

      <div className="p-6 border-b border-white/5 bg-blue-900/10">
         <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capacidade</span>
            <span className="text-[8px] font-bold uppercase text-blue-400">Enterprise</span>
         </div>
         <div className="flex items-end gap-2 px-1">
            <span className="text-2xl font-black text-white tracking-tighter">{new Intl.NumberFormat('pt-BR').format(tokenBalance)}</span>
            <span className="text-[10px] text-blue-400 font-bold mb-0.5 uppercase tracking-tighter">Tokens</span>
         </div>
         <button 
            onClick={() => setCheckoutOpen(true)}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
         >
           Adicionar Potência
         </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8 bg-black/10">
        <div className="space-y-4">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3">Seu Batalhão Digital</div>
          <div className="space-y-1 px-1">
            {agentsList.map((agent: AgentConfig) => (
              <button
                key={agent.id}
                onClick={() => {
                  setActiveAgent(agent.id);
                  // Verifica se já existe uma sessão para este agente ou cria uma nova
                  const existingSession = sessions.find(s => s.agentId === agent.id);
                  if (existingSession) {
                    setActiveSession(existingSession.id);
                  } else {
                    createSession(agent.id);
                  }
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group border ${
                  activeAgentId === agent.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-2xl' 
                    : 'hover:bg-white/5 border-transparent text-slate-400'
                }`}
              >
                <div className="relative">
                   <span className="text-2xl">{agent.icon}</span>
                   <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0a1128] ${agent.status === 'working' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                </div>
                <div className="flex-1 truncate">
                  <div className={`font-black text-xs truncate ${activeAgentId === agent.id ? 'text-white' : 'text-slate-200'}`}>{agent.name}</div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest ${activeAgentId === agent.id ? 'text-blue-200' : 'text-slate-500'}`}>
                    {agent.status === 'working' ? 'Em Missão...' : 'Stand-by'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 shrink-0 bg-black/20 space-y-3">
        <button 
          onClick={onOpenVocalArchitect} 
          className="w-full py-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 group shadow-lg shadow-blue-500/10"
        >
          <span className="text-lg group-hover:scale-125 transition-transform">🎙️</span>
          Vocal Architect
        </button>
        <button 
          onClick={onNewAgent} 
          className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl active:scale-95"
        >
          Solicitar Novo Worker
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
