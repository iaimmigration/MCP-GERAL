
import React, { useState, useMemo } from 'react';
import { useForgeStore } from '../store';
import { AgentConfig } from '../types';

interface DashboardProps {
  onEditAgent: (agent: AgentConfig) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEditAgent }) => {
  const { agents, setActiveAgent, taskResults } = useForgeStore();
  const [search, setSearch] = useState("");
  
  const agentsList: AgentConfig[] = Object.values(agents);
  const totalMoneySaved = taskResults.reduce((acc, curr) => acc + (curr.estimatedHumanHours * 50), 0);

  const filteredAgents = useMemo(() => {
    const s = search.toLowerCase();
    return agentsList.filter(a => 
       a.name.toLowerCase().includes(s) || 
       a.specialty.toLowerCase().includes(s)
    );
  }, [agentsList, search]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#020617] p-8 md:p-12 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-10">
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Operations Hub</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Gestão de Força de Trabalho Digital</p>
           </div>
           <div className="flex gap-4">
              <div className="px-8 py-5 bg-emerald-600/10 border border-emerald-500/20 rounded-[2rem] text-center min-w-[180px]">
                 <div className="text-3xl font-black text-emerald-500">R$ {totalMoneySaved.toLocaleString()}</div>
                 <div className="text-[8px] font-black text-emerald-400 uppercase mt-1">ROI Gerado</div>
              </div>
           </div>
        </header>

        <section className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAgents.map((agent) => (
                <div 
                  key={agent.id}
                  className="bg-black/40 border border-white/5 p-8 rounded-[3rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-8">
                      <div onClick={() => setActiveAgent(agent.id)} className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-3xl border border-white/10 cursor-pointer hover:scale-110 transition-transform">
                        {agent.icon}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditAgent(agent); }}
                        className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-500 hover:text-blue-500 transition-all"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg>
                      </button>
                  </div>

                  <div className="space-y-4">
                      <h3 className="text-white font-black text-lg tracking-tight uppercase truncate">{agent.name}</h3>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md">{agent.specialty}</span>
                        {agent.credentials.length > 0 && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Auth Vault</span>}
                      </div>
                      <div className="p-5 bg-white/5 rounded-2xl space-y-2">
                         <span className="text-[8px] font-black text-slate-600 uppercase">Target: {agent.allocationTarget}</span>
                         <div className="flex -space-x-2">
                            {agent.knowledgeBase.map((d, i) => (
                              <div key={i} className="w-6 h-6 bg-slate-800 border-2 border-[#020617] rounded-full flex items-center justify-center text-[8px]">📄</div>
                            ))}
                         </div>
                      </div>
                  </div>
                  <button onClick={() => setActiveAgent(agent.id)} className="w-full mt-6 py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Assumir Controle</button>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
