
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
    { id: 'API_HANDSHAKE', label: 'Conexão Cloud', status: 'pending' },
    { id: 'TOOLS_MANIFEST', label: 'Manifesto de Ferramentas', status: 'pending' },
    { id: 'GROUNDING_FETCH', label: 'Grounding Real-time', status: 'pending' },
    { id: 'DB_PERSISTENCE', label: 'Integridade de Dados', status: 'pending' }
  ]);
  
  const [localInsights, setLocalInsights] = useState<{text: string, links: {uri: string, title: string}[]}>({ text: '', links: [] });
  const [browserLogs, setBrowserLogs] = useState<{msg: string, time: string}[]>([]);
  const [activeTabs, setActiveTabs] = useState<{title: string, uri: string}[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Localização não permitida"),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [browserLogs]);

  const addBrowserLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBrowserLogs(prev => [...prev, { msg, time }].slice(-20));
  };

  const handleRunE2E = async () => {
    setIsTesting(true);
    addBrowserLog("INICIANDO_DIAGNOSTICO: Teste End-to-End em execução...");
    
    await runAgentDiagnostics(agent, (stepId, status, details) => {
      setDiagSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, details } : s));
      if (status === 'success') addBrowserLog(`CHECK: ${stepId} validado com sucesso.`);
      if (status === 'error') addBrowserLog(`FAIL: ${stepId} detectou erro: ${details}`);
    });

    setIsTesting(false);
    addBrowserLog("DIAGNOSTICO_CONCLUIDO: Relatório gerado.");
  };

  const handleDeepScan = async () => {
    setIsSearching(true);
    setLocalInsights({ text: '', links: [] });
    setActiveTabs([]);
    setBrowserLogs([]);
    
    addBrowserLog("CONEXÃO_MCP: Estabelecendo canal seguro...");

    try {
      await executeAgentActionStream(
        agent,
        "Acesse o navegador agora e extraia as 3 informações mais cruciais para meu negócio baseadas na minha localização e perfil. Não simule, procure dados reais.",
        [],
        [],
        (text, grounding) => {
          setLocalInsights({ text, links: grounding || [] });
          if (grounding) {
            setActiveTabs(grounding.slice(0, 5));
          }
        },
        (msg) => {
          addBrowserLog(msg);
        },
        coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
      );
    } catch (e) {
      addBrowserLog("ERRO_OPERACIONAL: Falha na varredura de dados.");
    } finally {
      setIsSearching(false);
      addBrowserLog("SESSÃO_FINALIZADA: Dados consolidados.");
    }
  };

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
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Voltar para Home</span>
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2"></div>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight text-sm uppercase">Modo: Mission Control</h2>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Painel de Operações Técnicas</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
          
          <div className="bg-white rounded-[2.5rem] p-10 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none">{agent.icon}</div>
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-xl">{agent.icon}</div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{agent.name}</h1>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-100">Live Hardware Link</span>
                </div>
                <p className="text-slate-500 font-medium mt-2 max-w-md">{agent.description}</p>
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <button onClick={handleRunE2E} disabled={isTesting} className={`px-8 py-5 rounded-2xl font-black text-sm transition-all shadow-xl ${isTesting ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {isTesting ? 'Executando E2E...' : 'Teste Diagnóstico E2E'}
              </button>
              <button onClick={onOpenChat} className="px-10 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm transition-all shadow-xl">
                Abrir Linha de Comando
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              
              {/* Diagnóstico HUD */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {diagSteps.map(step => (
                  <div key={step.id} className={`p-5 rounded-3xl border transition-all ${
                    step.status === 'success' ? 'bg-emerald-950/20 border-emerald-500/30' : 
                    step.status === 'error' ? 'bg-red-950/20 border-red-500/30' : 
                    step.status === 'loading' ? 'bg-blue-950/20 border-blue-500/30 animate-pulse' : 
                    'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{step.label}</span>
                       <div className={`w-1.5 h-1.5 rounded-full ${
                         step.status === 'success' ? 'bg-emerald-500' : 
                         step.status === 'error' ? 'bg-red-500' : 
                         step.status === 'loading' ? 'bg-blue-500' : 
                         'bg-slate-700'
                       }`}></div>
                    </div>
                    <div className={`text-[10px] font-bold ${
                      step.status === 'success' ? 'text-emerald-400' : 
                      step.status === 'error' ? 'text-red-400' : 
                      'text-slate-300'
                    }`}>
                      {step.status === 'pending' ? 'AGUARDANDO' : 
                       step.status === 'loading' ? 'PROCESSANDO...' : 
                       step.status === 'success' ? 'VALIDADO' : 'FALHOU'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Web Engine (Acesso Real)
                </h3>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[450px]">
                <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-4">
                  <div className="flex-1 bg-slate-950 rounded-lg px-4 py-1.5 text-[10px] text-emerald-500 font-mono truncate border border-slate-800">
                    {isSearching ? 'https://mcp-gateway.gemini.internal/live-fetch' : activeTabs[0]?.uri || 'chrome://diagnostics'}
                  </div>
                </div>

                <div className="flex-1 flex flex-col bg-[#0a0f1d] relative overflow-hidden">
                  {isSearching ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center z-10 space-y-8">
                      <div className="w-24 h-24 bg-emerald-600/10 rounded-[2.5rem] border border-emerald-500/20 flex items-center justify-center text-5xl relative animate-pulse">🌐</div>
                      <div className="space-y-3 text-white font-black uppercase text-sm">Varredura em Tempo Real</div>
                    </div>
                  ) : activeTabs.length > 0 ? (
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 z-10 overflow-y-auto custom-scrollbar h-full">
                      {activeTabs.map((tab, idx) => (
                        <div key={idx} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between hover:border-emerald-500/50 transition-all group animate-fade-in shadow-lg">
                           <h5 className="text-white font-black text-xs leading-snug">{tab.title}</h5>
                           <p className="text-[10px] text-slate-500 font-mono truncate bg-slate-950 p-2 rounded-lg mt-4">{tab.uri}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center z-10 space-y-6">
                      <div className="text-7xl opacity-10 grayscale">🏢</div>
                      <h4 className="text-slate-500 font-black uppercase text-sm tracking-widest">Acesso Web Não Iniciado</h4>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-slate-900 border-t border-slate-800">
                  <button 
                    onClick={handleDeepScan}
                    disabled={isSearching}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all"
                  >
                    {isSearching ? 'BUSCANDO DADOS REAIS...' : 'INICIAR VARREDURA TÉCNICA'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col h-full shadow-xl">
                  <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-6">Log de Rede MCP</h3>
                  <div ref={logContainerRef} className="flex-1 overflow-y-auto font-mono text-[9px] space-y-4 custom-scrollbar pr-2 h-96">
                     {browserLogs.length === 0 ? (
                       <div className="text-slate-700 italic">Ocioso...</div>
                     ) : (
                       browserLogs.map((log, i) => (
                         <div key={i} className="space-y-1 animate-fade-in border-l-2 border-slate-800 pl-3">
                            <div className="text-slate-600 text-[8px]">{log.time}</div>
                            <div className="text-slate-300 font-bold leading-tight">{log.msg}</div>
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
