
import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, ToolType, TaskResult, AgentStatus } from '../types';
import { useForgeStore } from '../store';
import { executeAgentActionStream } from '../services/geminiService';
import { sendHandoverEmail } from '../services/emailService';

const LiveTelemetryLog: React.FC<{ logs: {msg: string, time: string, type?: string}[] }> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  return (
    <div className="bg-black border border-white/5 rounded-3xl p-6 font-mono text-[10px] h-full flex flex-col shadow-inner relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent opacity-30"></div>
      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
         <span className="text-blue-500 font-black tracking-widest uppercase">Live Kernel Stream</span>
         <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full"></span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
        {logs.map((log, i) => (
          <div key={i} className="animate-in slide-in-from-left-2 duration-300 flex gap-3">
            <span className="text-slate-600 shrink-0">[{log.time}]</span>
            <span className={`
              ${log.type === 'success' ? 'text-emerald-400' : 
                log.type === 'error' ? 'text-red-500' : 
                log.type === 'handover' ? 'text-purple-400 font-bold' : 'text-slate-400'}
            `}>
              {log.msg}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

interface MissionControlProps {
  agent: AgentConfig;
  onOpenChat: () => void;
  onEdit: () => void;
  onBack: () => void;
}

const MissionControl: React.FC<MissionControlProps> = ({ agent, onOpenChat, onEdit, onBack }) => {
  const { saveTaskResult, updateAgentStatus, taskResults } = useForgeStore();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');
  const [logs, setLogs] = useState<{msg: string, time: string, type?: string}[]>([]);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [lastEmailStatus, setLastEmailStatus] = useState<string | null>(null);

  const agentHistory = taskResults.filter(t => t.agentId === agent.id);

  const addLog = (msg: string, type: string = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setLogs(prev => [...prev, { msg, time, type }].slice(-30));
  };

  const handleStartRoutine = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setLastEmailStatus(null);
    updateAgentStatus(agent.id, 'working');
    setLogs([]);
    setExecutionProgress(0);
    addLog("Inicializando Agente em Sandbox Privada...", "info");

    const progressInterval = setInterval(() => {
      setExecutionProgress(p => p >= 90 ? 90 : p + 1);
    }, 200);

    let missionSummary = "";

    try {
      await executeAgentActionStream(
        agent, "Execute sua tarefa principal agora. Gere um sumário executivo curto do resultado para o e-mail de handover.", [], [],
        (text) => missionSummary += text,
        (msg, level) => addLog(msg, level === 'success' ? 'success' : 'info')
      );

      clearInterval(progressInterval);
      setExecutionProgress(100);
      
      // PERSISTÊNCIA DO RESULTADO PARA ROI
      saveTaskResult({
        id: crypto.randomUUID(),
        agentId: agent.id,
        taskName: "Execução Autônoma de Skill",
        summary: missionSummary,
        costTokens: 1500, // Simulado
        estimatedHumanHours: 2, // Estimativa de economia
        createdAt: Date.now(),
        status: 'success'
      });

      if (agent.handover.email) {
        addLog(`HANDOVER: Disparando e-mail para ${agent.handover.email}...`, "handover");
        const res = await sendHandoverEmail(agent.handover.email, agent.name, missionSummary, agent.allocationTarget);
        setLastEmailStatus(res && !res.error ? "Entregue" : "Falha");
      }

      updateAgentStatus(agent.id, 'idle');
      setIsExecuting(false);

    } catch (e: any) {
      clearInterval(progressInterval);
      addLog(`FALHA: ${e.message}`, "error");
      updateAgentStatus(agent.id, 'alert');
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020617] overflow-hidden font-sans">
      <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3}/></svg>
          </button>
          <div className="flex items-center gap-4">
             <div className="text-3xl bg-blue-600/10 p-2 rounded-2xl border border-blue-500/20">{agent.icon}</div>
             <div>
                <h2 className="font-black text-white text-base uppercase tracking-tight">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${agent.status === 'working' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{agent.allocationTarget}</span>
                </div>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setActiveTab('console')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeTab === 'console' ? 'bg-white/10 border-white/20 text-white' : 'text-slate-500 border-transparent'}`}>Live Console</button>
           <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeTab === 'history' ? 'bg-white/10 border-white/20 text-white' : 'text-slate-500 border-transparent'}`}>Histórico ({agentHistory.length})</button>
           <button onClick={handleStartRoutine} disabled={isExecuting} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20">Iniciar Missão</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        {activeTab === 'console' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-8 bg-black rounded-[3rem] border border-white/5 p-12 flex flex-col justify-center items-center gap-6 relative overflow-hidden">
               {isExecuting ? (
                 <div className="w-full space-y-8 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Injetando Protocolos Autônomos</span>
                       <span className="text-white font-mono text-4xl font-black">{Math.round(executionProgress)}%</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                       <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300" style={{ width: `${executionProgress}%` }}></div>
                    </div>
                 </div>
               ) : (
                 <div className="text-center space-y-4 opacity-30">
                    <div className="text-6xl">📡</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Aguardando Comando de Campo</p>
                 </div>
               )}
            </div>
            <div className="lg:col-span-4 h-[500px]">
              <LiveTelemetryLog logs={logs} />
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
             {agentHistory.length === 0 ? (
               <div className="py-20 text-center space-y-4 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  <div className="text-4xl opacity-20">📂</div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhuma missão arquivada para este agente.</p>
               </div>
             ) : (
               agentHistory.map((task) => (
                 <div key={task.id} className="bg-black/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-6 hover:border-blue-500/20 transition-all">
                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase">Sucesso</span>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(task.createdAt).toLocaleString()}</span>
                       </div>
                       <p className="text-white text-sm font-medium leading-relaxed italic">"{task.summary.slice(0, 150)}..."</p>
                    </div>
                    <div className="md:w-48 p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center items-center gap-1">
                       <span className="text-[8px] font-black text-slate-500 uppercase">Economia Gerada</span>
                       <span className="text-xl font-black text-emerald-500">R$ {task.estimatedHumanHours * 50}</span>
                       <span className="text-[7px] font-bold text-slate-600 uppercase">{task.estimatedHumanHours}h Humanas</span>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionControl;
