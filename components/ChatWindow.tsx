
import React, { useState, useRef, useEffect } from 'react';
import { AgentConfig, ChatMessage, ToolType, MessageAttachment, ToolLog, ActionReminder, Priority } from '../types';
import { executeAgentActionStream } from '../services/geminiService';
import { runSimulation, USABILITY_TEST_SCRIPT } from '../services/simulationService';

interface KernelLog {
  timestamp: number;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
}

interface ChatWindowProps {
  agent: AgentConfig;
  messages: ChatMessage[];
  reminders: ActionReminder[];
  toolLogs?: ToolLog[];
  onSendMessage: (message: ChatMessage) => void;
  onUpdateLastMessage: (content: string, grounding?: { uri: string; title: string }[], thought?: string, images?: string[]) => void;
  onEditAgent: () => void;
  onCreateReminder: (reminder: Partial<ActionReminder>) => void;
  onToggleReminder: (reminderId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  agent, 
  messages, 
  reminders,
  toolLogs = [], 
  onSendMessage, 
  onUpdateLastMessage, 
  onEditAgent,
  onCreateReminder,
  onToggleReminder
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSimStep, setCurrentSimStep] = useState<number>(-1);
  const [kernelLogs, setKernelLogs] = useState<KernelLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [showTaskLedger, setShowTaskLedger] = useState(false);
  const [expandedThoughtIdx, setExpandedThoughtIdx] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isTypingRef = useRef(false);

  // DEPLOYMENT CHECKPOINT
  useEffect(() => {
    console.log(`[KERNEL] ChatWindow montado para o agente: ${agent.name}`);
    addLog(`Kernel de Chat montado com sucesso para ${agent.name}.`, 'success');
    addLog(`Configuração: Model=${agent.model}, Tools=${agent.tools.length}`, 'debug');
    
    return () => {
      console.log(`[KERNEL] Desmontando ChatWindow para ${agent.name}`);
    };
  }, [agent.id]);

  const activeReminders = reminders.filter(r => r.agentId === agent.id && !r.completed);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, pendingAttachments]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [kernelLogs]);

  const addLog = (message: string, level: KernelLog['level'] = 'info') => {
    setKernelLogs(prev => [...prev, { timestamp: Date.now(), message, level }]);
  };

  const playNotification = (type: 'success' | 'alert' | 'task' | 'sim') => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
    } else if (type === 'sim') {
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
    }

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files) as File[]) {
      if (file.size > 20 * 1024 * 1024) {
        addLog(`Arquivo ${file.name} excede o limite de 20MB.`, 'error');
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const newAttachment: MessageAttachment = {
          name: file.name,
          data: base64,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain')
        };
        setPendingAttachments(prev => [...prev, newAttachment]);
        addLog(`Documento carregado: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const parseAndExecuteTasks = (text: string) => {
    const taskRegex = /\[CREATE_TASK:\s*(.*?)\s*\|\s*(low|medium|high)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\]/gi;
    let match;
    while ((match = taskRegex.exec(text)) !== null) {
      const [_, title, priority, date] = match;
      onCreateReminder({
        title,
        priority: priority as Priority,
        dueDate: new Date(date).getTime(),
        agentId: agent.id,
        sessionId: messages[0]?.timestamp.toString() || 'global'
      });
      addLog(`Tarefa Automática Criada: ${title}`, 'success');
      playNotification('task');
    }
  };

  const handleSubmit = async (e?: React.FormEvent, manualInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = manualInput || input;
    if ((!finalInput.trim() && pendingAttachments.length === 0) || isTypingRef.current) return;

    addLog(`Mensagem do Usuário Processada: "${finalInput.slice(0, 30)}..."`, 'info');
    if (pendingAttachments.length > 0) {
      addLog(`Enviando ${pendingAttachments.length} anexo(s) para análise.`, 'debug');
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: finalInput,
      timestamp: Date.now(),
      attachments: [...pendingAttachments]
    };

    onSendMessage(userMsg);
    setInput('');
    setPendingAttachments([]);
    setIsTyping(true);
    isTypingRef.current = true;

    try {
      await executeAgentActionStream(
        agent, 
        finalInput, 
        messages, 
        userMsg.attachments,
        (text, grounding, thought, images) => {
          if (text.includes('[HUMAN_INTERVENTION_REQUIRED]')) {
            addLog("Intervenção humana requerida pelo agente!", 'warn');
            playNotification('alert');
          }
          parseAndExecuteTasks(text);
          const cleanedText = text.replace('[HUMAN_INTERVENTION_REQUIRED]', '').replace(/\[CREATE_TASK:.*?\]/gi, '');
          onUpdateLastMessage(cleanedText, grounding, thought, images);
        },
        (msg, lvl) => addLog(msg, lvl as any)
      );
    } catch (error: any) {
      playNotification('alert');
      addLog(`Falha na execução do agente: ${error.message}`, 'error');
      onUpdateLastMessage("Falha crítica no núcleo de processamento.");
    } finally {
      setIsTyping(false);
      isTypingRef.current = false;
    }
  };

  const startUsabilitySimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentSimStep(0);
    setKernelLogs([]);
    addLog("=== INICIANDO PROTOCOLO DE AUDITORIA MCP ===", 'info');
    playNotification('sim');
    
    let stepCount = 0;
    await runSimulation(async (prompt) => {
      setCurrentSimStep(stepCount);
      addLog(`Executando Passo ${stepCount + 1}: ${USABILITY_TEST_SCRIPT[stepCount].expectedObservation}`, 'debug');
      
      await handleSubmit(undefined, prompt);
      
      let safetyCounter = 0;
      while(isTypingRef.current && safetyCounter < 100) {
        await new Promise(r => setTimeout(r, 200));
        safetyCounter++;
      }
      stepCount++;
    });

    setCurrentSimStep(USABILITY_TEST_SCRIPT.length);
    addLog("=== AUDITORIA FINALIZADA COM SUCESSO ===", 'success');
    playNotification('success');
    
    setTimeout(() => {
      setIsSimulating(false);
      setCurrentSimStep(-1);
    }, 10000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden font-sans">
      {/* Mission Ticker HUD */}
      <div className="h-6 bg-slate-900 border-b border-slate-800 flex items-center px-4 overflow-hidden relative z-30">
        <div className={`flex items-center gap-6 ${isSimulating ? 'animate-pulse' : 'animate-marquee'} whitespace-nowrap`}>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {isSimulating ? `MODO SIMULAÇÃO ATIVO: PASSO ${Math.min(currentSimStep + 1, USABILITY_TEST_SCRIPT.length)}/${USABILITY_TEST_SCRIPT.length}` : 'MCP Core: Active'}
            </span>
          </div>
          {activeReminders.map(r => (
            <div key={r.id} className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.priority === 'high' ? 'text-red-400 border-red-900/50 bg-red-950/20' : 'text-amber-400 border-amber-900/50 bg-amber-950/20'}`}>
                TASK: {r.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-1 ring-slate-700">
            {agent.icon}
          </div>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight flex items-center gap-2">
              {agent.name}
              {isTyping && <span className="flex gap-1"><span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></span><span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span></span>}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 font-black text-blue-400 uppercase tracking-tighter">{agent.model}</span>
              <button 
                onClick={() => setShowTaskLedger(!showTaskLedger)}
                className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase transition-all ${showTaskLedger ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'}`}
              >
                Ledger {activeReminders.length > 0 && `[${activeReminders.length}]`}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {agent.name.toLowerCase().includes('inspector') && (
             <button 
               onClick={startUsabilitySimulation}
               disabled={isSimulating}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${isSimulating ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 cursor-not-allowed' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-blue-600 hover:text-white'}`}
             >
               <span className={isSimulating ? 'animate-spin' : ''}>⚙️</span>
               {isSimulating ? 'Auditoria em Curso' : 'Iniciar Auditoria MCP'}
             </button>
           )}
           <div className="h-8 w-[1px] bg-slate-800 mx-1"></div>
           <button 
              onClick={() => setShowConsole(!showConsole)}
              className={`p-3 rounded-xl transition-all border ${showConsole ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-800 text-slate-400 hover:text-white'}`}
              title="Kernel Console"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg>
           </button>
           <button onClick={onEditAgent} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-12 scroll-smooth custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-40">
              <div className="text-6xl">{agent.icon}</div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">Protocolo Inicializado</p>
                <p className="text-xs text-slate-600 mt-2">Aguardando comando de voz ou texto...</p>
              </div>
            </div>
          )}

          {messages.filter(m => !m.isStreaming || m.content || m.activeTool).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] group relative ${
                msg.role === 'user' 
                  ? (msg.content.includes('operador') || isSimulating ? 'bg-slate-800/80 border border-blue-500/30' : 'bg-blue-600 shadow-[0_10px_40px_rgba(37,99,235,0.2)]')
                  : 'bg-slate-900 border border-slate-800 shadow-2xl'
              } rounded-3xl p-6 ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                
                {msg.role === 'user' && (msg.content.includes('operador') || isSimulating) && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">SIMULATED USER</span>
                  </div>
                )}

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {msg.attachments.map((at, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                        <span className="text-lg">📄</span>
                        <span className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[120px]">{at.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.role === 'model' && msg.thought && (
                  <div className="mb-4">
                    <button 
                      onClick={() => setExpandedThoughtIdx(expandedThoughtIdx === i ? null : i)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <svg className={`w-3 h-3 transition-transform ${expandedThoughtIdx === i ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg>
                      Cognitive Trace {expandedThoughtIdx !== i && '(Click to expand)'}
                    </button>
                    {expandedThoughtIdx === i && (
                      <div className="mt-2 p-4 bg-slate-950/50 border border-indigo-500/20 rounded-2xl text-[12px] font-mono text-indigo-200/70 leading-relaxed animate-in slide-in-from-top-2">
                        {msg.thought}
                      </div>
                    )}
                  </div>
                )}

                <div className="prose prose-invert max-w-none text-[15px] leading-relaxed whitespace-pre-wrap font-medium text-slate-200">
                  {msg.content}
                </div>

                {msg.generatedImages && msg.generatedImages.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-6">
                    {msg.generatedImages.map((img, idx) => (
                      <img key={idx} src={img} className="rounded-3xl border border-white/5 shadow-2xl animate-in zoom-in-95" alt="Forge Output" />
                    ))}
                  </div>
                )}

                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, idx) => (
                      <a key={idx} href={url.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-xl text-[10px] font-black text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all uppercase tracking-tight">
                        {url.title || "External Intelligence"}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Audit Progress Dashboard Overlay */}
        {isSimulating && (
          <div className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 z-50 animate-in slide-in-from-right-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Audit Dashboard</h3>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
              </div>
            </div>
            <div className="space-y-3">
              {USABILITY_TEST_SCRIPT.map((step, idx) => {
                const isCompleted = idx < currentSimStep;
                const isActive = idx === currentSimStep;
                return (
                  <div key={idx} className={`p-4 rounded-2xl border transition-all ${
                    isActive ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 
                    isCompleted ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950/50 border-slate-800 opacity-40'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-blue-200' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                          {idx === USABILITY_TEST_SCRIPT.length - 1 ? 'Análise Final' : `Passo ${idx + 1}`}
                        </p>
                        <p className={`text-[11px] mt-1 leading-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                          {step.expectedObservation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kernel Console Overlay */}
        {showConsole && (
          <div className="absolute bottom-4 left-4 right-4 h-64 bg-slate-950/90 backdrop-blur-3xl border border-indigo-500/30 rounded-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.6)] flex flex-col z-50 animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between px-6 py-3 border-b border-indigo-500/20 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">Kernel Output Console v1.0.4</span>
               </div>
               <div className="flex items-center gap-4">
                  <button onClick={() => setKernelLogs([])} className="text-[9px] font-black text-slate-500 hover:text-white uppercase">Clear</button>
                  <button onClick={() => setShowConsole(false)} className="text-slate-400 hover:text-white">✕</button>
               </div>
            </div>
            <div ref={consoleRef} className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-1.5 custom-scrollbar">
               {kernelLogs.length === 0 ? (
                 <div className="text-slate-700 italic">Nenhum log operacional registrado...</div>
               ) : (
                 kernelLogs.map((log, i) => (
                   <div key={i} className="flex gap-4 group">
                     <span className="text-slate-600 shrink-0 font-bold">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                     <span className={`shrink-0 uppercase font-black px-1 rounded ${
                       log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                       log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                       log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                       log.level === 'debug' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                     }`}>{log.level}</span>
                     <span className={`${log.level === 'error' ? 'text-red-300' : 'text-slate-300'} group-hover:text-white transition-colors`}>{log.message}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* Task Ledger Sidebar Overlay */}
        {showTaskLedger && (
          <div className="absolute top-4 right-4 w-96 max-h-[80%] bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 flex flex-col z-40 animate-in slide-in-from-right-10">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Directives</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status: Operational</p>
                </div>
                <button onClick={() => setShowTaskLedger(false)} className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {reminders.filter(r => r.agentId === agent.id).length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="text-4xl opacity-20">📁</div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No tasks logged in this cycle</div>
                  </div>
                ) : (
                  reminders.filter(r => r.agentId === agent.id).map(reminder => (
                    <div key={reminder.id} className={`group p-5 rounded-3xl border transition-all ${reminder.completed ? 'bg-slate-950/20 border-slate-800/30 grayscale' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => onToggleReminder(reminder.id)}
                          className={`mt-1 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${reminder.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-700 hover:border-blue-500'}`}
                        >
                          {reminder.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={4}/></svg>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold leading-tight ${reminder.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>{reminder.title}</div>
                          <div className="flex items-center gap-3 mt-3">
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                               reminder.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                               reminder.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                             }`}>
                               {reminder.priority}
                             </span>
                             <span className="text-[10px] text-slate-500 font-mono font-bold">{new Date(reminder.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-950 border-t border-slate-800 z-20">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto relative group">
          {pendingAttachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-300">
              {pendingAttachments.map((at, i) => (
                <div key={i} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-2">
                  <span className="text-lg">📄</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-200 truncate max-w-[150px]">{at.name}</span>
                    <span className="text-[8px] font-black uppercase text-indigo-400">{at.mimeType.split('/')[1]}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(i)}
                    className="ml-2 w-5 h-5 rounded-full hover:bg-indigo-500/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-[2rem] p-3 pl-6 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/40 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pendingAttachments.length > 0 ? "Adicione um comentário ou envie os arquivos..." : `Transmita comandos para ${agent.name}...`}
              className="flex-1 bg-transparent text-slate-100 py-3 focus:outline-none placeholder:text-slate-600 font-medium"
              disabled={isTyping || isSimulating}
            />
            <div className="flex items-center gap-2">
              {agent.tools.includes(ToolType.DOCUMENT_READER) && (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-3 text-slate-500 hover:text-indigo-400 transition-colors"
                  title="Upload Documents (PDF, TXT)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeWidth={2.5}/></svg>
                </button>
              )}
              {agent.tools.includes(ToolType.IMAGE_GEN) && (
                 <button type="button" className="p-3 text-slate-500 hover:text-pink-400 transition-colors" title="Visual Analysis mode enabled">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg>
                 </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept=".pdf,.txt,text/plain,application/pdf"
                onChange={handleFileUpload}
              />
              <button 
                type="submit" 
                disabled={isTyping || isSimulating} 
                className={`px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${isTyping || isSimulating ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`}
              >
                {isSimulating ? 'AUDITANDO' : 'Executar'}
              </button>
            </div>
          </div>
        </form>
        <p className="text-center mt-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">IA Industrial • Model Context Protocol v1.0.5</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};

export default ChatWindow;
