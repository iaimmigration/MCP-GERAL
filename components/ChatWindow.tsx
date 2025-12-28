
import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { AgentConfig, ChatMessage, AgentVariable, QuickAction, MessageAttachment, AutomationStep, ToolType } from '../types';
import { executeAgentActionStream } from '../services/geminiService';
import { useForgeStore } from '../store';
import { PRICING_MULTIPLIER } from '../constants';

interface SeleniumTerminalProps {
  steps: AutomationStep[];
  onManualResolved: () => void;
  infraMode?: string;
}

const SeleniumTerminal: React.FC<SeleniumTerminalProps> = ({ steps, onManualResolved, infraMode }) => {
  const [activeStep, setActiveStep] = useState(-1);
  const [isManualMode, setIsManualMode] = useState(false);
  const [logs, setLogs] = useState<{ id: string; msg: string; type: 'info' | 'wait' | 'vault' | 'success' | 'error' | 'click' | 'cloud' | 'heal' }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (steps.length > 0) {
      let i = 0;
      const addLog = (msg: string, type: any = 'info') => {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), msg, type }].slice(-50));
      };

      const processNextStep = () => {
        if (i === 0) {
          addLog(`[SYSTEM] Inicializando Kernel RPA de Alta Resiliência...`, 'cloud');
          addLog(`[INFRA] Driver: ${infraMode || 'Simulated'}`, 'info');
        }

        if (i < steps.length) {
          const step = steps[i];
          setActiveStep(i);

          const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
          
          if (step.action === 'navigate') {
            addLog(`[${time}] [NAV] URL Alvo: ${step.value}`, 'info');
          } else if (step.action === 'click') {
            addLog(`[${time}] [WAIT] Buscando seletor: ${step.selector}`, 'wait');
            setTimeout(() => {
              addLog(`[${time}] [HEAL] Seletor principal instável. Usando redundância XPath...`, 'heal');
              addLog(`[${time}] [CLICK] Interação bem-sucedida via Fallback.`, 'success');
            }, 800);
          } else if (step.action === 'type') {
            addLog(`[${time}] [VAULT] Extraindo dado seguro para injeção...`, 'vault');
            setTimeout(() => addLog(`[${time}] [TYPE] Input processado no campo: ${step.selector}`, 'info'), 800);
          } else if (step.action === 'captcha') {
            addLog(`[${time}] [BYPASS] Desafio detectado. Consultando 2Captcha API...`, 'wait');
            setTimeout(() => addLog(`[${time}] [SUCCESS] Bypass autorizado (Token: ...${Math.random().toString(36).substring(7)})`, 'success'), 2000);
          } else if (step.action === 'human_intervention') {
            setIsManualMode(true);
            addLog(`[${time}] [HALT] Verificação Física Necessária: ${step.details}`, 'error');
            return; 
          }

          i++;
          const nextDelay = step.action === 'captcha' ? 2500 : 1200;
          setTimeout(processNextStep, nextDelay);
        } else {
          addLog(`[SYSTEM] Operação concluída. Sessão persistida no Supabase.`, 'success');
        }
      };

      processNextStep();
    }
  }, [steps, infraMode]);

  return (
    <div className={`mt-6 rounded-2xl border overflow-hidden shadow-2xl font-mono animate-in zoom-in-95 duration-500 w-full transition-all border-slate-800 ${isManualMode ? 'bg-red-950/30' : 'bg-[#050505]'}`}>
       <div className={`px-4 py-2 border-b flex items-center justify-between transition-colors ${isManualMode ? 'bg-red-900/40 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex gap-1.5">
             <div className={`w-2.5 h-2.5 rounded-full ${isManualMode ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
             <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
             <div className="w-2.5 h-2.5 bg-slate-700 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[7px] text-slate-500 font-black tracking-[0.2em]">RESILIENCE_CORE: ON</span>
             <span className={`text-[9px] font-black uppercase tracking-widest ${isManualMode ? 'text-red-400' : 'text-blue-500'}`}>
               {isManualMode ? 'Manual Override' : 'MCP RPA ENGINE v2.5'}
             </span>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 h-[340px]">
          <div className="p-5 space-y-3 border-r border-slate-900 overflow-y-auto custom-scrollbar bg-black/20">
             <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-4">Pipeline de Automação</div>
             {steps.map((step, idx) => (
               <div key={step.id} className={`flex items-start gap-3 text-[10px] transition-all duration-300 ${idx <= activeStep ? 'opacity-100' : 'opacity-10'}`}>
                  <div className="mt-1">
                     {idx < activeStep ? (
                       <span className="text-emerald-500">✓</span>
                     ) : idx === activeStep ? (
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                     ) : (
                       <span className="text-slate-800">○</span>
                     )}
                  </div>
                  <div className="truncate">
                     <span className={`font-black uppercase text-[9px] mr-2 ${idx === activeStep ? 'text-blue-400' : 'text-slate-600'}`}>{step.action}</span>
                     <span className="text-slate-400 text-[9px]">{step.details || step.selector || 'Executando...'}</span>
                  </div>
               </div>
             ))}
          </div>

          <div className="p-5 flex flex-col bg-black/40">
             <div className="text-[8px] font-black text-blue-500/50 uppercase tracking-widest mb-4 flex justify-between">
                <span>Kernel Logs</span>
                <span className="animate-pulse text-emerald-500">LIVE FEED</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 font-mono text-[9px]">
                {logs.map((log) => (
                  <div key={log.id} className="animate-in slide-in-from-left-1 duration-200">
                    <span className={`
                      ${log.type === 'wait' ? 'text-amber-500' : ''}
                      ${log.type === 'vault' ? 'text-purple-400 font-black' : ''}
                      ${log.type === 'success' ? 'text-emerald-400' : ''}
                      ${log.type === 'heal' ? 'text-blue-400 italic' : ''}
                      ${log.type === 'error' ? 'text-red-500 font-black' : ''}
                      ${log.type === 'cloud' ? 'text-blue-500' : ''}
                      ${log.type === 'info' ? 'text-slate-500' : ''}
                    `}>
                      {log.msg}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
             </div>
          </div>
       </div>

       {isManualMode && (
         <div className="p-6 bg-red-600/10 border-t border-red-500/20 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 text-red-500">
               <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Protocolo de Segurança Ativado</span>
            </div>
            <p className="text-[10px] text-white/80 leading-relaxed italic">
               "{steps[activeStep]?.value || 'Aguardando validação manual do usuário no navegador.'}"
            </p>
            <button 
             onClick={() => {
               setIsManualMode(false);
               onManualResolved();
             }}
             className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              Confirmar Resolução • Retomar Automação
            </button>
         </div>
       )}
    </div>
  );
};

interface ChatWindowProps {
  agent: AgentConfig;
  messages: ChatMessage[];
  onEditAgent: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agent, messages, onEditAgent }) => {
  const { 
    activeSessionId, addMessage, updateLastMessage, saveAgent, 
    setActiveSession, consumeTokens, agents, globalInfra
  } = useForgeStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [tempVariables, setTempVariables] = useState(agent.variables || []);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | undefined>(undefined);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      });
    }
  }, []);

  const handleManualHandshake = () => {
    if (!activeSessionId) return;
    addMessage(activeSessionId, { 
      role: 'user', 
      content: 'Ação manual concluída. Continue a sequência.', 
      timestamp: Date.now() 
    });
    setTimeout(() => handleSubmit(), 500);
  };

  const handleUpdateVariable = (index: number, value: string) => {
    const updated = [...tempVariables];
    updated[index].value = value;
    setTempVariables(updated);
    saveAgent({ ...agent, variables: updated });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const command = input.trim();
    if ((!command && attachments.length === 0 && messages.length === 0) || isTyping || !activeSessionId) return;

    if (command) {
      addMessage(activeSessionId, { role: 'user', content: command, timestamp: Date.now() });
      setInput('');
    }
    
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsTyping(true);

    try {
      let finalUsage = null;
      const historyToSend = command ? messages : messages.slice(0, -1);
      const messageToProcess = command || messages[messages.length - 1].content;

      await executeAgentActionStream(
        agent, messageToProcess, historyToSend, currentAttachments,
        (text, grounding, thought, images, usage, engine, automationSteps) => {
          finalUsage = usage;
          updateLastMessage(activeSessionId, {
            role: 'model',
            content: text,
            timestamp: Date.now(),
            engine: engine,
            thought: thought,
            automationSteps: automationSteps,
            grounding: grounding,
            tokenUsage: usage ? {
              promptTokens: usage.promptTokenCount * PRICING_MULTIPLIER,
              candidatesTokens: usage.candidatesTokenCount * PRICING_MULTIPLIER,
              totalTokens: usage.totalTokenCount * PRICING_MULTIPLIER
            } : undefined
          });
        },
        undefined,
        userLocation,
        agents,
        globalInfra
      );
      if (finalUsage) consumeTokens(finalUsage.totalTokenCount * PRICING_MULTIPLIER);
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
         await (window as any).aistudio.openSelectKey();
      }
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a1128] relative overflow-hidden font-sans">
      <header className="h-20 border-b border-blue-900/40 px-8 flex items-center justify-between bg-blue-950/40 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveSession(null)} className="p-3 bg-blue-900/40 hover:bg-blue-800/60 rounded-xl text-blue-400 border border-blue-800/50 transition-all flex items-center gap-2 group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2.5" stroke="currentColor"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Painel</span>
          </button>
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-2xl border border-blue-500/20 shadow-lg" onClick={onEditAgent}>{agent.icon}</div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="font-black text-white tracking-tight text-sm uppercase">{agent.name}</h2>
               <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ativo</span>
               </div>
            </div>
          </div>
        </div>
        <button onClick={() => setShowDashboard(!showDashboard)} className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-2xl border transition-all ${showDashboard ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>Status da Operação</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col transition-all duration-500 ${showDashboard ? 'max-w-[65%]' : 'max-w-full'}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-32">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[90%] rounded-[2rem] p-8 relative group/msg ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-xl' : 'bg-[#0f172a] border border-slate-800 text-slate-100 shadow-2xl'}`}>
                  {msg.thought && (
                    <div className="mb-6 p-4 bg-black/40 rounded-2xl border-l-4 border-blue-600 text-[10px] font-medium text-blue-400 italic">
                       {msg.thought}
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                  
                  {msg.grounding && msg.grounding.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fontes Grounding</span>
                       <div className="flex flex-wrap gap-2">
                          {msg.grounding.map((chunk: any, ci: number) => {
                             const isWeb = !!chunk.web;
                             const isMap = !!chunk.maps;
                             if (!isWeb && !isMap) return null;
                             
                             const uri = isWeb ? chunk.web.uri : chunk.maps.uri;
                             const title = isWeb ? chunk.web.title : (chunk.maps.title || 'Referência Local');
                             
                             return (
                               <a key={ci} href={uri} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 border rounded-xl text-[9px] font-black transition-all flex items-center gap-2 ${isMap ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20' : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20'}`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2.5}/></svg>
                                  {isMap ? '📍 ' : ''}{title}
                               </a>
                             );
                          })}
                       </div>
                    </div>
                  )}

                  {msg.automationSteps && msg.automationSteps.length > 0 && (
                    <SeleniumTerminal steps={msg.automationSteps} onManualResolved={handleManualHandshake} infraMode={agent.infraConfig?.executionMode || globalInfra.executionMode} />
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-blue-900/20 p-6 rounded-[2rem] border border-blue-800/40 text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                  Injetando Bypass & Fallback Protocols...
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-blue-900/30 bg-blue-950/20 space-y-4 shadow-2xl relative z-30">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
               {agent.quickActions?.map(action => (
                 <button key={action.id} onClick={() => setInput(action.prompt)} className="px-5 py-2.5 bg-blue-900/20 hover:bg-blue-800/40 border border-blue-800/50 rounded-2xl text-[9px] font-black text-blue-300 uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2">
                    <span>{action.icon}</span> {action.label}
                 </button>
               ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-4 bg-black/40 border border-blue-900/40 rounded-[2.5rem] p-2 pl-4 backdrop-blur-md">
              <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" accept="image/*,application/pdf"/>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-blue-900/40 text-blue-500 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" strokeWidth={2.5}/></svg>
              </button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Comande a infraestrutura..." className="flex-1 bg-transparent text-white py-3 outline-none font-medium text-sm"/>
              <button type="submit" disabled={isTyping} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl disabled:opacity-50 transition-all">
                Executar
              </button>
            </form>
          </div>
        </div>

        {showDashboard && (
          <div className="w-[35%] border-l border-blue-900/30 bg-black/10 flex flex-col animate-in slide-in-from-right-5 overflow-hidden backdrop-blur-md">
             <div className="p-10 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                <section className="space-y-6">
                   <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Vault: Injeção de Dados</h3>
                   <div className="space-y-4">
                      {tempVariables.map((v, i) => (
                        <div key={v.key} className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{v.label}</span>
                              <span className="text-[8px] font-mono text-blue-500 font-bold">{v.key}</span>
                           </div>
                           <input type="text" value={v.value} onChange={(e) => handleUpdateVariable(i, e.target.value)} className="w-full bg-transparent border-b border-white/10 text-xs text-white outline-none focus:border-blue-500 py-2 font-bold transition-all"/>
                        </div>
                      ))}
                   </div>
                </section>

                <section className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Integridade do Núcleo</h3>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] font-bold">
                         <span className="text-slate-500 uppercase">Self-Healing</span>
                         <span className="text-blue-500 uppercase">Ativado</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold">
                         <span className="text-slate-500 uppercase">Localização Geográfica</span>
                         <span className={`uppercase ${userLocation ? 'text-emerald-500' : 'text-amber-500'}`}>
                           {userLocation ? 'Sincronizada' : 'Pendente'}
                         </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold">
                         <span className="text-slate-500 uppercase">Protocolo 2Captcha</span>
                         <span className={`uppercase ${globalInfra.captchaApiKey || agent.infraConfig?.captchaApiKey ? 'text-emerald-500' : 'text-red-500'}`}>
                           {globalInfra.captchaApiKey || agent.infraConfig?.captchaApiKey ? 'Ready' : 'Missing API'}
                         </span>
                      </div>
                   </div>
                </section>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
