
import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, AgentRoutine, ToolType, TaskResult, AgentError } from '../types';
import { useForgeStore } from '../store';
import { executeAgentActionStream, runAgentDiagnostics } from '../services/geminiService';

interface MissionControlProps {
  agent: AgentConfig;
  onOpenChat: () => void;
  onEdit: () => void;
  onBack: () => void;
}

interface DiagStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error' | 'warn';
  details?: string;
}

const MissionControl: React.FC<MissionControlProps> = ({ agent, onOpenChat, onEdit, onBack }) => {
  const { 
    saveTaskResult, taskResults, clientId, isCloudConnected, isCloudSyncing, logAgentExecution
  } = useForgeStore();
  
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TaskResult | null>(null);
  const [customFolder, setCustomFolder] = useState(agent.defaultFolder || 'varreduras');
  
  const [diagSteps, setDiagSteps] = useState<DiagStep[]>([
    { id: 'API_HANDSHAKE', label: 'Conexão Gemini', status: 'pending' },
    { id: 'TOOLS_MANIFEST', label: 'Google Search Test', status: 'pending' },
    { id: 'DB_PERSISTENCE', label: 'Sincronia Cloud', status: 'pending' }
  ]);
  
  const [localInsights, setLocalInsights] = useState<{text: string, links: {uri: string, title: string}[], thought: string}>({ text: '', links: [], thought: '' });
  const [browserLogs, setBrowserLogs] = useState<{msg: string, time: string}[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const addBrowserLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBrowserLogs(prev => [...prev, { msg, time }].slice(-10));
  };

  const handleStartRoutine = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setBrowserLogs([]);
    setLocalInsights({ text: '', links: [], thought: '' });
    addBrowserLog("MANUAL_OVERRIDE: Iniciando execução com Gemini 3 Pro...");

    const firstRoutine = agent.routines && agent.routines.length > 0 ? agent.routines[0] : null;
    const prompt = firstRoutine 
      ? `EXECUTE AGORA: ${firstRoutine.task.instruction}`
      : "Inicie seu protocolo de análise. Verifique sua base de conhecimento e use as ferramentas de pesquisa para me dar um relatório detalhado sobre as tendências do seu nicho hoje.";

    try {
      let fullText = "";
      let fullThought = "";
      let groundingLinks: any[] = [];
      
      await executeAgentActionStream(
        agent,
        prompt,
        [],
        [],
        (text, grounding, thought) => {
          fullText = text;
          fullThought = thought || "";
          groundingLinks = grounding || [];
          setLocalInsights({ text, links: grounding || [], thought: fullThought });
        },
        (msg) => addBrowserLog(msg),
        coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
      );

      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const folderPath = `${customFolder}/${dateStr}/exec-manual`;
      
      await saveTaskResult(agent.id, firstRoutine?.name || "Execução de Precisão", folderPath, {
        insights: fullText,
        links: groundingLinks,
        thought: fullThought,
        location: coords,
        is_manual: true,
        timestamp: Date.now()
      });
      
      addBrowserLog(`SYNC: Sucesso. Score de precisão atualizado.`);

    } catch (e: any) {
      addBrowserLog(`ERRO: ${e.message}`);
      logAgentExecution(agent.id, false, {
        id: crypto.randomUUID(),
        code: 'TOOL_FAILURE',
        message: e.message || 'Erro durante execução manual.',
        timestamp: Date.now()
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDiagnostics = async () => {
    setIsTesting(true);
    const result = await runAgentDiagnostics(agent, (stepId, status, details) => {
      setDiagSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, details } : s));
    });
    
    if (!result) {
       logAgentExecution(agent.id, false, {
         id: crypto.randomUUID(),
         code: 'API_ERROR',
         message: 'Falha crítica no handshake com Gemini 3 Pro.',
         timestamp: Date.now()
       });
    }

    setDiagSteps(prev => prev.map(s => s.id === 'DB_PERSISTENCE' ? { ...s, status: isCloudConnected ? 'success' : 'error' } : s));
    setIsTesting(false);
  };

  const precision = agent.performance?.precisionScore ?? 100;
  const statusColor = precision > 90 ? 'text-emerald-500' : precision > 70 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden font-sans animate-fade-in">
      <header className="h-24 border-b border-slate-800 px-10 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="p-4 bg-slate-800 border border-slate-700 rounded-3xl text-slate-400 hover:text-white transition-all group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight text-xl uppercase leading-none">Mission Control</h2>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">Nível Pro: Gemini 3 Enabled</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={handleDiagnostics} disabled={isTesting || isExecuting} className="px-6 py-2.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all disabled:opacity-50">
             {isTesting ? 'Sincronizando...' : 'Diagnóstico Pro'}
           </button>
           <div className={`px-4 py-2 bg-slate-900 rounded-2xl border ${isCloudConnected ? 'border-emerald-500/20' : 'border-red-500/20'} flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isCloudConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                Cloud Link
              </span>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
          
          <div className="bg-white rounded-[3rem] p-12 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden border border-slate-200">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none grayscale">{agent.icon}</div>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>

            <div className="flex items-center gap-10 relative z-10">
              <div className="w-28 h-28 bg-slate-900 rounded-[2.8rem] flex items-center justify-center text-6xl shadow-2xl">
                {agent.icon}
              </div>
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3 uppercase">{agent.name}</h1>
                  <p className="text-slate-500 font-bold max-w-lg text-sm leading-relaxed">{agent.description}</p>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-[0.2em]">Fidelidade</span>
                      <div className={`text-2xl font-black ${statusColor}`}>{precision}%</div>
                   </div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="flex gap-2">
                      {agent.tools.map(t => (
                        <span key={t} className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded">{t}</span>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
              <button 
                onClick={handleStartRoutine} 
                disabled={isExecuting} 
                className={`flex-1 sm:flex-none px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 ${
                  isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                }`}
              >
                {isExecuting ? 'Pensando...' : 'Iniciar Agente'}
              </button>
              <button onClick={onOpenChat} className="px-10 py-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                Console Chat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               
               {/* Painel de Pensamento em Tempo Real */}
               <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[500px]">
                  <div className="p-6 bg-slate-800/40 border-b border-slate-700 flex items-center justify-between">
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-blue-500 animate-ping' : 'bg-slate-700'}`}></span>
                        Raciocínio Interno do Agente
                     </span>
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo: Gemini 3 Reasoning</span>
                  </div>
                  <div className="flex-1 p-8 font-mono text-xs overflow-y-auto custom-scrollbar bg-black/40 text-slate-400 leading-loose">
                     {isExecuting && !localInsights.thought ? (
                        <div className="animate-pulse">> Iniciando processo cognitivo...</div>
                     ) : localInsights.thought ? (
                        <div className="italic border-l-2 border-blue-500/30 pl-6 text-blue-300/80">
                           {localInsights.thought}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-800">
                           <div className="text-5xl mb-4 opacity-10">🧠</div>
                           <p className="uppercase font-black text-[10px] tracking-widest">O processo de pensamento aparecerá aqui durante a execução</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Saída Final */}
               <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[300px]">
                  <div className="p-6 bg-slate-800/40 border-b border-slate-700 flex items-center justify-between">
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Output de Precisão</span>
                  </div>
                  <div className="p-10 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                     {localInsights.text || "Aguardando resposta final..."}
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               {/* Escopo de Varredura (URLs Alvo) */}
               <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col shadow-xl">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                    🌐 Escopo de Varredura
                  </h3>
                  <div className="space-y-2">
                    {agent.targetUrls && agent.targetUrls.length > 0 ? (
                      agent.targetUrls.map(url => (
                        <div key={url} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-blue-400 truncate">
                          {url}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest">Busca Global (Sem restrição)</p>
                    )}
                  </div>
               </div>

               <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-[450px] shadow-xl">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    📂 Arquivo de Missão
                  </h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {taskResults.length === 0 ? (
                      <p className="text-center text-[10px] text-slate-700 uppercase mt-10">Vazio</p>
                    ) : (
                      taskResults.map(res => (
                        <button key={res.id} onClick={() => setSelectedResult(res)} className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-left hover:border-blue-500 transition-all group">
                          <div className="text-[8px] font-black text-blue-500 uppercase mb-1">/{res.folder_path}</div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">{res.task_name}</div>
                          <div className="text-[8px] text-slate-700 mt-3">{new Date(res.created_at).toLocaleString()}</div>
                        </button>
                      ))
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {selectedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-8 animate-fade-in">
           <div className="bg-white rounded-[3.5rem] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedResult.task_name}</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sessão ID: {selectedResult.id}</p>
                 </div>
                 <button onClick={() => setSelectedResult(null)} className="p-5 bg-slate-100 rounded-3xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/30">
                 <div className="max-w-3xl mx-auto space-y-12">
                    {selectedResult.payload.thought && (
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Log de Raciocínio (Audit)</h4>
                          <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem] text-[11px] text-blue-700 italic leading-relaxed">
                             {selectedResult.payload.thought}
                          </div>
                       </div>
                    )}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado Final</h4>
                       <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
                          {selectedResult.payload.insights}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;
