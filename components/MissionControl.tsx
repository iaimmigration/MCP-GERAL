
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
         <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
        {logs.map((log, i) => (
          <div key={i} className="animate-in slide-in-from-left-2 duration-300 flex gap-3">
            <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
            <span className={`
              ${log.type === 'success' ? 'text-emerald-400' : 
                log.type === 'error' ? 'text-red-500 font-black' : 
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
    
    // Defensive check to satisfy the user's error report
    if (typeof updateAgentStatus === 'function') {
      updateAgentStatus(agent.id, 'working');
    } else {
      console.warn("Store Error: updateAgentStatus is not defined.");
    }

    setLogs([]);
    setExecutionProgress(0);
    addLog("Inicializando Agente em Sandbox Privada...", "info");

    const progressInterval = setInterval(() => {
      setExecutionProgress(p => p >= 95 ? 95 : p + 0.5);
    }, 150);

    let missionSummary = "";

    try {
      await executeAgentActionStream(
        agent, "Execute sua tarefa principal agora. Gere um sumário executivo curto do resultado para o e-mail de handover.", [], [],
        (text) => missionSummary += text,
        (msg, level) => addLog(msg, level === 'success' ? 'success' : 'info')
      );

      clearInterval(progressInterval);
      setExecutionProgress(100);
      
      saveTaskResult({
        id: crypto.randomUUID(),
        agentId: agent.id,
        taskName: "Execução Autônoma de Skill",
        summary: missionSummary,
        costTokens: 1500,
        estimatedHumanHours: 2,
        createdAt: Date.now(),
        status: 'success'
      });

      if (agent.handover.email) {
        addLog(`HANDOVER: Disparando e-mail para ${agent.handover.email}...`, "handover");
        const res = await sendHandoverEmail(agent.handover.email, agent.name, missionSummary, agent.allocationTarget);
        setLastEmailStatus(res && !res.error ? "Entregue" : "Falha");
      }

      if (typeof updateAgentStatus === 'function') {
        updateAgentStatus(agent.id, 'idle');
      }
      setIsExecuting(false);

    } catch (e: any) {
      clearInterval(progressInterval);
      addLog(`FALHA: ${e.message}`, "error");
      if (typeof updateAgentStatus === 'function') {
        updateAgentStatus(agent.id, 'alert');
      }
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
             <div className="text-3xl bg-blue-600/10 p-2 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">{agent.icon}</div>
             <div>
                <h2 className="font-black text-white text-base uppercase tracking-tight">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'working' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{agent.allocationTarget}</span>
                </div>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setActiveTab('console')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeTab === 'console' ? 'bg-white/10 border-white/20 text-white' : 'text-slate-500 border-transparent'}`}>Live Console</button>
           <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeTab === 'history' ? 'bg-white/10 border-white/20 text-white' : 'text-slate-500 border-transparent'}`}>Histórico ({agentHistory.length})</button>
           <button onClick={handleStartRoutine} disabled={isExecuting} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Iniciar Missão</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        {activeTab === 'console' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-8 bg-black rounded-[3rem] border border-white/5 p-12 flex flex-col justify-center items-center gap-6 relative overflow-hidden">
               {isExecuting ? (
                 <div className="w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-end">
                       <div>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse block mb-2">Kernel Protocol Beta</span>
                          <h3 className="text-white font-black text-xl uppercase tracking-tighter">Injetando Bypass Autônomo...</h3>
                       </div>
                       <span className="text-white font-mono text-5xl font-black">{Math.round(executionProgress)}%</span>
                    </div>
                    <div className="h-6 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                       <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)]" style={{ width: `${executionProgress}%` }}></div>
                    </div>
                    <p className="text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Não feche esta janela enquanto o processamento estiver em curso.</p>
                 </div>
               ) : (
                 <div className="text-center space-y-6 opacity-40 hover:opacity-100 transition-opacity">
                    <div className="text-7xl animate-bounce">📡</div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Aguardando Comando do Console Central</p>
                 </div>
               )}
            </div>
            <div className="lg:col-span-4 h-[550px]">
              <LiveTelemetryLog logs={logs} />
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
             {agentHistory.length === 0 ? (
               <div className="py-32 text-center space-y-6 bg-white/5 rounded-[4rem] border border-dashed border-white/10 animate-fade-in">
                  <div className="text-6xl opacity-10">📂</div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Arquivos de Missão Vazios</p>
               </div>
             ) : (
               agentHistory.map((task) => (
                 <div key={task.id} className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] flex flex-col md:flex-row justify-between gap-8 hover:border-blue-500/40 hover:bg-white/[0.07] transition-all group animate-in slide-in-from-bottom-4">
                    <div className="space-y-6 flex-1">
                       <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">Sucesso</span>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(task.createdAt).toLocaleString()}</span>
                       </div>
                       <p className="text-white text-lg font-medium leading-relaxed italic opacity-90 group-hover:opacity-100 transition-opacity">"{task.summary}"</p>
                    </div>
                    <div className="md:w-56 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex flex-col justify-center items-center gap-2 shadow-inner">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Eficiência Gerada</span>
                       <span className="text-3xl font-black text-emerald-500">R$ {task.estimatedHumanHours * 50}</span>
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-2 mt-2 w-full text-center">{task.estimatedHumanHours}h Humanas</span>
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
