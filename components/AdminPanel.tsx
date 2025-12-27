import React from 'react';
import { useForgeStore } from '../store';
import { PRICING_MULTIPLIER } from '../constants';
import { AgentConfig } from '../types';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { 
    agents, sessions, totalTokensConsumed, tokenBalance, 
    engineStatus, resetAll 
  } = useForgeStore();

  // Explicitly type agentsList as AgentConfig[] to resolve TS errors where it's inferred as unknown[]
  const agentsList = Object.values(agents) as AgentConfig[];
  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);

  const stats = [
    { label: 'Agentes Ativos', value: agentsList.length, icon: '🤖', color: 'blue' },
    { label: 'Sessões Totais', value: sessions.length, icon: '📂', color: 'emerald' },
    { label: 'Mensagens Processadas', value: totalMessages, icon: '💬', color: 'purple' },
    { label: 'Consumo Global', value: new Intl.NumberFormat('pt-BR').format(totalTokensConsumed), icon: '📊', color: 'amber' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden font-sans animate-fade-in">
      <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-700 transition-all flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2.5" stroke="currentColor"/>
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Sair do Admin</span>
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2"></div>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight text-sm uppercase">MCP Admin Command Center</h2>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Monitoramento Global de Infraestrutura</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema Nominal</span>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
          
          {/* Dashboard de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl hover:border-blue-500/30 transition-all">
                <div className="text-3xl mb-4">{stat.icon}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Monitor de Redundância */}
            <div className="lg:col-span-2 space-y-6">
               <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Estado das Engines de Resposta
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-slate-950 border border-slate-800 rounded-3xl">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 font-black">E1</div>
                          <div>
                             <div className="text-xs font-black text-white uppercase">Eden Engine (Primária)</div>
                             <div className="text-[10px] text-slate-500 font-bold uppercase">https://app.eden.run/api</div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black rounded uppercase">Indisponível</span>
                          <span className="text-[8px] text-slate-600 mt-1 font-mono">Erro: 503 Service Unavailable</span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-950 border border-slate-800 rounded-3xl">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 font-black">E2</div>
                          <div>
                             <div className="text-xs font-black text-white uppercase">Google Gemini (Failover)</div>
                             <div className="text-[10px] text-slate-500 font-bold uppercase">SDK Nativo @google/genai</div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black rounded uppercase animate-pulse">Ativa / Em Uso</span>
                          <span className="text-[8px] text-slate-600 mt-1 font-mono">Latência: 1.2s avg</span>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Lista de Agentes em Detalhes */}
               <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Inventário de Agentes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                             <th className="pb-4">Agente</th>
                             <th className="pb-4">Modelo Base</th>
                             <th className="pb-4">Sessões</th>
                             <th className="pb-4">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                          {/* Explicitly typing agent as AgentConfig to fix "Property 'id' does not exist on type 'unknown'" error */}
                          {agentsList.map((agent: AgentConfig) => (
                            <tr key={agent.id} className="group">
                               <td className="py-4 flex items-center gap-3">
                                  <span className="text-xl">{agent.icon}</span>
                                  <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                               </td>
                               <td className="py-4 text-[10px] font-mono text-slate-500">{agent.model}</td>
                               <td className="py-4 text-xs font-bold text-slate-300">{sessions.filter(s => s.agentId === agent.id).length}</td>
                               <td className="py-4">
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black rounded uppercase">Standby</span>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>

            {/* Controle de Sistema */}
            <div className="space-y-6">
               <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Manutenção do Núcleo</h3>
                  <div className="space-y-4">
                     <button className="w-full p-6 bg-slate-950 border border-slate-800 rounded-3xl text-left hover:border-blue-500 transition-all group">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Backup MCP</div>
                        <div className="text-xs font-bold text-white group-hover:text-blue-400">Exportar Banco Dexie (.json)</div>
                     </button>
                     
                     <button className="w-full p-6 bg-slate-950 border border-slate-800 rounded-3xl text-left hover:border-blue-500 transition-all group">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Audit Logs</div>
                        <div className="text-xs font-bold text-white group-hover:text-blue-400">Limpar Histórico de Eventos</div>
                     </button>

                     <div className="h-px bg-slate-800 my-6"></div>

                     <button 
                        onClick={() => {
                          if (confirm("ATENÇÃO: Isso apagará todos os agentes, sessões e créditos permanentemente. Continuar?")) {
                            resetAll();
                          }
                        }}
                        className="w-full p-6 bg-red-950/20 border border-red-500/30 rounded-3xl text-left hover:bg-red-900/40 transition-all group"
                     >
                        <div className="text-[10px] font-black text-red-500 uppercase mb-1">Zona de Perigo</div>
                        <div className="text-xs font-bold text-red-400">Wipe Total de Dados (Reset de Fábrica)</div>
                     </button>
                  </div>
               </div>

               <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4">Suporte Enterprise</h3>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80 mb-6">
                    Sua licença MCP v2.5 está ativa. Para suporte customizado em modelos On-Premise, contate a engenharia central.
                  </p>
                  <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abrir Ticket Técnico</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;