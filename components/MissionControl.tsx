
import React, { useState, useEffect } from 'react';
import { AgentConfig, ToolType, TaskResult, AgentError } from '../types';
import { useForgeStore } from '../store';
import { executeAgentActionStream } from '../services/geminiService';

interface MissionControlProps {
  agent: AgentConfig;
  onOpenChat: () => void;
  onEdit: () => void;
  onBack: () => void;
}

const MissionControl: React.FC<MissionControlProps> = ({ agent, onOpenChat, onEdit, onBack }) => {
  const { 
    saveTaskResult, taskResults, isCloudConnected, fetchTaskResults, logAgentExecution
  } = useForgeStore();
  
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TaskResult | null>(null);
  const [localInsights, setLocalInsights] = useState<{text: string, links: {uri: string; title: string}[], thought: string}>({ text: '', links: [], thought: '' });
  const [logs, setLogs] = useState<{msg: string, time: string}[]>([]);

  useEffect(() => {
    fetchTaskResults(agent.id);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true }
      );
    }
  }, [agent.id]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ msg, time }, ...prev].slice(0, 5));
  };

  const handleStartRoutine = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setLocalInsights({ text: '', links: [], thought: '' });
    addLog("Comando Local: Iniciando análise de alta precisão...");

    try {
      let fullText = "";
      let fullThought = "";
      let groundingLinks: any[] = [];
      
      await executeAgentActionStream(
        agent,
        "Gere um relatório de inteligência detalhado. Identifique novos fatos, tendências ou achados operacionais baseados nas suas diretrizes e sites alvo. SEMPRE extraia e liste os links das fontes encontradas.",
        [],
        [],
        (text, grounding, thought) => {
          fullText = text;
          fullThought = thought || "";
          groundingLinks = grounding || [];
          setLocalInsights({ text, links: grounding || [], thought: fullThought });
        },
        (msg) => addLog(msg),
        coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
      );

      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      await saveTaskResult(agent.id, "Achados de Inteligência", `reports/${dateStr}`, {
        insights: fullText,
        links: groundingLinks,
        thought: fullThought,
        timestamp: Date.now()
      });
      addLog("Achados salvos no Arquivo de Missão.");
    } catch (e: any) {
      addLog(`Falha: ${e.message}`);
      logAgentExecution(agent.id, false, { id: crypto.randomUUID(), code: 'TOOL_FAILURE', message: e.message, timestamp: Date.now() });
    } finally {
      setIsExecuting(false);
    }
  };

  const latestResult = taskResults[0];
  const precision = agent.performance?.precisionScore ?? 100;
  const statusColor = precision > 90 ? 'text-emerald-400' : precision > 70 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e3a8a] overflow-hidden animate-fade-in">
      <header className="h-20 border-b border-blue-800 px-10 flex items-center justify-between bg-blue-900/20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-blue-800 border border-blue-700 rounded-2xl text-blue-100 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-4">
             <div className="text-3xl">{agent.icon}</div>
             <div>
                <h2 className="font-black text-white text-lg uppercase tracking-tight leading-none">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                   <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest">Dashboard de Achados Ativo</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <button onClick={onEdit} className="px-6 py-2.5 bg-white text-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Configurar Agente</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
          
          {/* Hero Operacional */}
          <div className="lg:col-span-12 bg-blue-900/40 border border-blue-800 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
             <div className="space-y-4 relative z-10">
                <div className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em]">Propósito do Protocolo</div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter max-w-2xl">{agent.description}</h1>
                <div className="flex items-center gap-8 pt-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-blue-300 uppercase mb-1">Score de Precisão</span>
                      <span className={`text-2xl font-black ${statusColor}`}>{precision}%</span>
                   </div>
                   <div className="w-px h-10 bg-blue-800"></div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-blue-300 uppercase mb-1">Status Cloud</span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Sincronizado</span>
                   </div>
                </div>
             </div>
             <div className="flex flex-col gap-3 w-full md:w-auto relative z-10">
                <button onClick={handleStartRoutine} disabled={isExecuting} className="px-12 py-5 bg-blue-500 hover:bg-blue-400 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_15px_30px_rgba(30,64,175,0.3)]">
                  {isExecuting ? 'Minerando Achados...' : 'Executar Análise'}
                </button>
                <button onClick={onOpenChat} className="px-10 py-5 bg-blue-800 hover:bg-blue-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all">Chat Direto</button>
             </div>
          </div>

          {/* Área de Inteligência */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-white rounded-[3rem] border border-blue-200 overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="text-slate-900 font-black text-xs uppercase tracking-widest">Achados Operacionais & Evidências</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                        {latestResult ? `Última atualização: ${new Date(latestResult.created_at).toLocaleString('pt-BR')}` : 'Nenhum relatório gerado'}
                      </p>
                   </div>
                </div>

                <div className="flex-1 p-10 overflow-y-auto">
                   {isExecuting ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-6">
                         <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-xs font-black text-slate-900 uppercase tracking-widest animate-pulse">Cruzando dados e extraindo fontes...</p>
                      </div>
                   ) : (localInsights.text || latestResult) ? (
                      <div className="space-y-10 animate-fade-in">
                         {/* Insights de Texto */}
                         <div className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
                            {localInsights.text || latestResult?.payload?.insights}
                         </div>

                         {/* Seção de Achados (Links) */}
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                               Fontes e Links Extraídos
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {(localInsights.links || latestResult?.payload?.links || []).map((link: any, i: number) => (
                                  <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="p-5 bg-slate-50 border border-slate-200 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all group">
                                     <div className="flex items-start justify-between">
                                        <div className="flex-1 truncate">
                                           <div className="text-[10px] font-black text-slate-900 uppercase truncate mb-1">{link.title || 'Link de Fonte'}</div>
                                           <div className="text-[9px] text-blue-600 font-bold truncate opacity-70 group-hover:opacity-100">{link.uri}</div>
                                        </div>
                                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                        </div>
                                     </div>
                                  </a>
                               ))}
                               {(localInsights.links || latestResult?.payload?.links || []).length === 0 && (
                                  <div className="col-span-2 py-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
                                     <p className="text-[10px] text-slate-400 font-black uppercase">Nenhum link de grounding detectado nesta sessão.</p>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                         <div className="text-8xl mb-6">📉</div>
                         <p className="text-xs font-black uppercase tracking-widest">Aguardando gatilho operacional</p>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* Sidebar de Histórico e Status */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-blue-900 border border-blue-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Relatórios Cloud</h3>
                   <button onClick={() => fetchTaskResults(agent.id)} className="text-[9px] font-black text-blue-300 uppercase hover:text-white transition-colors">Atualizar</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                   {taskResults.length === 0 ? (
                      <p className="text-center text-[10px] text-blue-700 uppercase mt-10 italic">Nenhum resultado sincronizado</p>
                   ) : (
                      taskResults.map(res => (
                         <button 
                          key={res.id} 
                          onClick={() => setSelectedResult(res)} 
                          className={`w-full p-5 rounded-2xl text-left transition-all border ${
                            selectedResult?.id === res.id ? 'bg-blue-600 border-blue-500' : 'bg-blue-950 border-blue-800 hover:border-blue-600'
                          }`}
                         >
                            <div className={`text-[8px] font-black uppercase mb-1 ${selectedResult?.id === res.id ? 'text-blue-200' : 'text-blue-400'}`}>/{res.folder_path}</div>
                            <div className={`text-xs font-bold truncate ${selectedResult?.id === res.id ? 'text-white' : 'text-blue-100'}`}>{res.task_name}</div>
                            <div className="flex items-center justify-between mt-3">
                               <span className={`text-[8px] ${selectedResult?.id === res.id ? 'text-blue-200/50' : 'text-blue-700'}`}>{new Date(res.created_at).toLocaleDateString()}</span>
                               <span className={`text-[8px] font-black uppercase ${selectedResult?.id === res.id ? 'text-white' : 'text-emerald-400'}`}>
                                  {res.payload.links?.length || 0} Achados
                               </span>
                            </div>
                         </button>
                      ))
                   )}
                </div>
             </div>

             <div className="bg-blue-900 border border-blue-800 rounded-[2.5rem] p-8 shadow-xl">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Sites Alvo de Varredura</h3>
                <div className="space-y-2">
                   {agent.targetUrls?.map(url => (
                      <div key={url} className="px-3 py-2 bg-blue-950 border border-blue-800 rounded-xl text-[9px] font-bold text-blue-300 truncate">
                         {url}
                      </div>
                   ))}
                   {!agent.targetUrls?.length && <p className="text-[9px] text-blue-700 uppercase font-black">Pesquisa Global Ativa</p>}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Visualizador de Achado Histórico */}
      {selectedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/95 backdrop-blur-2xl p-8 animate-fade-in">
           <div className="bg-white rounded-[3.5rem] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedResult.task_name}</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sessão ID: {selectedResult.id}</p>
                 </div>
                 <button onClick={() => setSelectedResult(null)} className="p-5 bg-slate-100 rounded-3xl text-slate-400 hover:text-slate-900 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                 <div className="max-w-2xl mx-auto space-y-12">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo Operacional</h4>
                       <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedResult.payload.insights}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achados e Links de Suporte</h4>
                       <div className="grid grid-cols-1 gap-3">
                          {selectedResult.payload.links?.map((link: any, i: number) => (
                             <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="px-6 py-5 bg-white border border-slate-200 rounded-3xl text-[11px] font-bold text-blue-600 hover:shadow-xl transition-all flex items-center justify-between group">
                                <div className="truncate flex-1">
                                   <div className="text-slate-900 uppercase text-[10px] font-black mb-1 truncate">{link.title || 'Link de Fonte'}</div>
                                   <div className="opacity-60 truncate">{link.uri}</div>
                                </div>
                                <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-600 ml-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth={3}/></svg>
                             </a>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                 <button onClick={() => setSelectedResult(null)} className="px-10 py-4 bg-blue-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Fechar Relatório</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;