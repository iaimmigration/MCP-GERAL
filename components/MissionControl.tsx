
import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, AgentRoutine, ToolType, TaskResult } from '../types';
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
  status: 'pending' | 'loading' | 'success' | 'error';
  details?: string;
}

const MissionControl: React.FC<MissionControlProps> = ({ agent, onOpenChat, onEdit, onBack }) => {
  const { 
    saveTaskResult, taskResults, clientId, isCloudConnected, isCloudSyncing 
  } = useForgeStore();
  
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TaskResult | null>(null);
  
  const [diagSteps, setDiagSteps] = useState<DiagStep[]>([
    { id: 'EDEN_CONNECTIVITY', label: 'Conexão Primária', status: 'pending' },
    { id: 'API_HANDSHAKE', label: 'Cloud Handshake', status: 'pending' },
    { id: 'TOOLS_MANIFEST', label: 'Manifesto de Ferramentas', status: 'pending' },
    { id: 'DB_PERSISTENCE', label: 'Sincronia de Dados', status: 'pending' }
  ]);
  
  const [localInsights, setLocalInsights] = useState<{text: string, links: {uri: string, title: string}[]}>({ text: '', links: [] });
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
    setBrowserLogs(prev => [...prev, { msg, time }].slice(-20));
  };

  const handleDeepScan = async () => {
    setIsSearching(true);
    setBrowserLogs([]);
    addBrowserLog("MCP_GATEWAY: Estabelecendo canal de varredura...");

    try {
      let fullText = "";
      let groundingLinks: any[] = [];
      
      await executeAgentActionStream(
        agent,
        "Execute uma varredura geográfica e extraia insights críticos baseados na sua configuração atual e ferramentas ativas.",
        [],
        [],
        (text, grounding) => {
          fullText = text;
          groundingLinks = grounding || [];
          setLocalInsights({ text, links: grounding || [] });
        },
        (msg) => addBrowserLog(msg),
        coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
      );

      // Salvar resultado na "pasta" configurada ou padrão
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const baseFolder = agent.defaultFolder || 'varreduras-gerais';
      const folderName = `${baseFolder.startsWith('/') ? baseFolder.slice(1) : baseFolder}/${dateStr}`;
      
      await saveTaskResult(agent.id, "Varredura Geográfica", folderName, {
        insights: fullText,
        links: groundingLinks,
        location: coords,
        timestamp: Date.now()
      });
      addBrowserLog(`SYNC: Resultado registrado em Cloud://${clientId}/${agent.id}/${folderName}`);

    } catch (e) {
      addBrowserLog("ERRO_OPERACIONAL: Falha na varredura profunda.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden font-sans animate-fade-in">
      <header className="h-24 border-b border-slate-800 px-10 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="p-4 bg-slate-800 border border-slate-700 rounded-3xl text-slate-400 hover:text-white transition-all group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight text-xl uppercase leading-none">Mission Control</h2>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">Agente: {agent.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className={`px-4 py-2 bg-slate-900 rounded-2xl border ${isCloudConnected ? 'border-emerald-500/20' : 'border-red-500/20'} flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isCloudConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                {isCloudConnected ? 'Cloud Sync Ativo' : 'Cloud Offline'}
              </span>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
          
          <div className="bg-white rounded-[3rem] p-12 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none grayscale">{agent.icon}</div>
            <div className="flex items-center gap-10 relative z-10">
              <div className="w-28 h-28 bg-blue-600 rounded-[2.8rem] flex items-center justify-center text-6xl shadow-xl">{agent.icon}</div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">{agent.name}</h1>
                <p className="text-slate-500 font-bold max-w-lg text-sm leading-relaxed">{agent.description}</p>
                {agent.defaultFolder && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Pasta Raiz: {agent.defaultFolder}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
              <button onClick={handleDeepScan} disabled={isSearching} className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">
                {isSearching ? 'Escaneando...' : 'Deep Scan'}
              </button>
              <button onClick={onOpenChat} className="px-10 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">
                Acessar Chat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[450px]">
                  <div className="p-6 bg-slate-800/40 border-b border-slate-700 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Console de Varredura</span>
                     <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                     </div>
                  </div>
                  <div className="flex-1 p-8 font-mono text-xs overflow-y-auto custom-scrollbar bg-black/40">
                     {isSearching ? (
                        <div className="space-y-4">
                           <div className="text-blue-500 animate-pulse">> ANALISANDO REDE...</div>
                           {browserLogs.map((log, i) => (
                             <div key={i} className="text-slate-500">> {log.msg}</div>
                           ))}
                        </div>
                     ) : localInsights.text ? (
                        <div className="text-emerald-500 whitespace-pre-wrap leading-relaxed">
                           {localInsights.text}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-800">
                           <div className="text-5xl mb-4 opacity-10">📡</div>
                           <div className="uppercase font-black tracking-widest text-[10px]">Aguardando Comando Operacional</div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-[450px] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-0"></div>
                  <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeWidth={2}/></svg>
                    Histórico de Pastas
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 relative z-10">
                    {taskResults.length === 0 ? (
                      <div className="text-center py-10">
                         <div className="text-3xl mb-4 opacity-20">📂</div>
                         <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Nenhum resultado arquivado</p>
                      </div>
                    ) : (
                      taskResults.map(res => (
                        <button 
                          key={res.id} 
                          onClick={() => setSelectedResult(res)}
                          className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left hover:border-blue-500/50 transition-all group"
                        >
                          <div className="text-[8px] font-black text-blue-400 uppercase mb-1 truncate">/{res.folder_path}</div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">{res.task_name}</div>
                          <div className="text-[8px] text-slate-700 mt-2 font-mono uppercase">{new Date(res.created_at).toLocaleString()}</div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8 animate-fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedResult.task_name}</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">/{selectedResult.folder_path}</p>
                 </div>
                 <button onClick={() => setSelectedResult(null)} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/30">
                 <div className="space-y-8">
                    <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                       <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Conteúdo do Insight</h4>
                       <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedResult.payload.insights}
                       </div>
                    </div>
                    {selectedResult.payload.links?.length > 0 && (
                      <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                         <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Grounding (Fontes Externas)</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedResult.payload.links.map((link: any, i: number) => (
                               <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                                  <div className="text-[10px] font-black text-slate-900 truncate">{link.title}</div>
                                  <div className="text-[8px] text-slate-400 truncate mt-1">{link.uri}</div>
                               </a>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;
