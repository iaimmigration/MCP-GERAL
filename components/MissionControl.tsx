
import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, AgentRoutine, ToolType } from '../types';
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
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [diagSteps, setDiagSteps] = useState<DiagStep[]>([
    { id: 'EDEN_CONNECTIVITY', label: 'Conexão Primária', status: 'pending' },
    { id: 'API_HANDSHAKE', label: 'Cloud Handshake', status: 'pending' },
    { id: 'TOOLS_MANIFEST', label: 'Manifesto de Ferramentas', status: 'pending' },
    { id: 'DB_PERSISTENCE', label: 'Sincronia de Dados', status: 'pending' }
  ]);
  
  const [localInsights, setLocalInsights] = useState<{text: string, links: {uri: string, title: string}[]}>({ text: '', links: [] });
  const [browserLogs, setBrowserLogs] = useState<{msg: string, time: string}[]>([]);
  const [activeTabs, setActiveTabs] = useState<{title: string, uri: string}[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Localização não permitida"),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const addBrowserLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBrowserLogs(prev => [...prev, { msg, time }].slice(-20));
  };

  const handleRunE2E = async () => {
    setIsTesting(true);
    addBrowserLog("DIAGNOSTICO_INICIAL: Teste de integridade em execução...");
    await runAgentDiagnostics(agent, (stepId, status, details) => {
      setDiagSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, details } : s));
      if (status === 'success') addBrowserLog(`CHECK: ${stepId} validado.`);
      if (status === 'error') addBrowserLog(`FALHA: ${stepId} - ${details}`);
    });
    setIsTesting(false);
  };

  const handleDeepScan = async () => {
    setIsSearching(true);
    setBrowserLogs([]);
    addBrowserLog("MCP_GATEWAY: Estabelecendo canal de varredura...");

    try {
      await executeAgentActionStream(
        agent,
        "Execute uma varredura geográfica e extraia insights críticos baseados na sua configuração.",
        [],
        [],
        (text, grounding) => {
          setLocalInsights({ text, links: grounding || [] });
          if (grounding) setActiveTabs(grounding.slice(0, 5));
        },
        (msg) => addBrowserLog(msg),
        coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
      );
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
          <button 
            onClick={onBack} 
            className="p-4 bg-slate-800 border border-slate-700 rounded-3xl text-slate-400 hover:text-white transition-all group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight text-xl uppercase leading-none">Mission Control</h2>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">Agente: {agent.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={onEdit} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all">
             Editar Protocolo
           </button>
           <div className="px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sincronia Ativa</span>
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
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
              <button onClick={onEdit} className="px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                Configurar
              </button>
              <button onClick={handleRunE2E} disabled={isTesting} className="px-8 py-5 bg-blue-600/10 border border-blue-500/20 text-blue-600 hover:bg-blue-600/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                {isTesting ? 'Validando...' : 'Testar Kernel'}
              </button>
              <button onClick={onOpenChat} className="px-10 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">
                Acessar Chat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {diagSteps.map(step => (
                  <div key={step.id} className={`p-6 rounded-[2rem] border transition-all ${
                    step.status === 'success' ? 'bg-emerald-950/20 border-emerald-500/30' : 
                    step.status === 'error' ? 'bg-red-950/20 border-red-500/30' :
                    'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">{step.label}</div>
                    <div className={`text-[10px] font-black ${step.status === 'success' ? 'text-emerald-400' : step.status === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                      {step.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 bg-slate-800/40 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                     </div>
                     <div className="h-4 w-px bg-slate-700"></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Varredura Direta</span>
                  </div>
                </div>

                <div className="flex-1 bg-[#050a14] relative overflow-hidden flex flex-col items-center justify-center p-12 text-center">
                  {isSearching ? (
                    <div className="space-y-8 animate-pulse">
                       <div className="w-24 h-24 bg-blue-600/10 rounded-full border-2 border-blue-500/20 mx-auto flex items-center justify-center text-5xl">📡</div>
                       <div className="text-white font-black uppercase text-xs tracking-[0.5em]">Escaneando Satélites...</div>
                    </div>
                  ) : activeTabs.length > 0 ? (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto custom-scrollbar p-2">
                      {activeTabs.map((tab, idx) => (
                        <div key={idx} className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl text-left hover:border-blue-500/40 transition-all group">
                           <h5 className="text-white font-bold text-sm mb-2 leading-tight">{tab.title}</h5>
                           <div className="text-[10px] text-slate-500 font-mono truncate bg-slate-950 p-2 rounded-lg">{tab.uri}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6 opacity-20">
                      <div className="text-8xl">🛰️</div>
                      <h4 className="text-white font-black uppercase text-sm tracking-widest">Aguardando Varredura</h4>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-slate-900 border-t border-slate-800">
                  <button 
                    onClick={handleDeepScan}
                    disabled={isSearching}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl"
                  >
                    {isSearching ? 'PROCESSANDO...' : 'EXECUTAR VARREDURA PROFUNDA'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col h-full shadow-xl">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                    Log de Eventos
                  </h3>
                  <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-5 custom-scrollbar pr-3 h-[400px]">
                     {browserLogs.length === 0 ? (
                       <div className="text-slate-700 italic px-2">Terminal em standby...</div>
                     ) : (
                       browserLogs.map((log, i) => (
                         <div key={i} className="space-y-1.5 animate-fade-in border-l-2 border-slate-800 pl-4 py-1">
                            <div className="text-slate-600 text-[7px] uppercase font-black">{log.time}</div>
                            <div className="text-slate-300 font-bold leading-relaxed">{log.msg}</div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
