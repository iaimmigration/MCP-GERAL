
import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { AgentConfig, ChatMessage, AgentRoutine } from '../types';
import { executeAgentActionStream } from '../services/geminiService';
import { useForgeStore } from '../store';
import { PRICING_MULTIPLIER } from '../constants';

interface ChatWindowProps {
  agent: AgentConfig;
  messages: ChatMessage[];
  onEditAgent: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agent, messages, onEditAgent }) => {
  const { 
    activeSessionId, addMessage, updateLastMessage, saveAgent, 
    setActiveSession, tokenBalance, consumeTokens, isTestMode
  } = useForgeStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const addLog = (msg: string, type: string = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }].slice(-20));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping || !activeSessionId) return;

    // Só bloqueia se NÃO estiver em modo de teste E saldo for zero
    if (!isTestMode && tokenBalance <= 0) {
      addLog("SALDO INSUFICIENTE. Por favor, adquira mais créditos.", "error");
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    addMessage(activeSessionId, userMsg);
    setInput('');
    setIsTyping(true);

    try {
      let finalUsage = null;
      await executeAgentActionStream(
        agent, input, messages, [],
        (text, grounding, thought, images, usage, engine) => {
          finalUsage = usage;
          const billedTokens = usage ? usage.totalTokenCount * PRICING_MULTIPLIER : 0;

          updateLastMessage(activeSessionId, {
            role: 'model',
            content: text,
            timestamp: Date.now(),
            engine: engine,
            groundingUrls: grounding,
            tokenUsage: usage ? {
              promptTokens: usage.promptTokenCount * PRICING_MULTIPLIER,
              candidatesTokens: usage.candidatesTokenCount * PRICING_MULTIPLIER,
              totalTokens: billedTokens
            } : undefined
          });
        },
        (msg, level) => addLog(msg, level)
      );

      if (finalUsage) {
        const totalBilled = finalUsage.totalTokenCount * PRICING_MULTIPLIER;
        // O store.ts já lida com o bypass de consumo se isTestMode for true
        consumeTokens(totalBilled);
      }
    } catch (error) {
      addLog(`Falha no Sistema de Redundância: ${error}`, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const balanceText = isTestMode ? "ILIMITADO" : new Intl.NumberFormat('pt-BR').format(tokenBalance);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden font-sans animate-fade-in">
      <header className={`h-20 border-b border-slate-800 px-8 flex items-center justify-between backdrop-blur-xl z-20 shrink-0 ${isTestMode ? 'bg-blue-600/5' : 'bg-slate-900/40'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveSession(null)} 
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-700 transition-all flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2.5" stroke="currentColor"/>
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Painel da Missão</span>
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2"></div>
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all" onClick={onEditAgent}>{agent.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-100 tracking-tight text-sm uppercase">{agent.name}</h2>
              <button onClick={onEditAgent} className="p-1 text-slate-500 hover:text-blue-400 transition-colors">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[8px] font-black uppercase tracking-widest ${isTestMode ? 'text-blue-400' : 'text-emerald-500'}`}>
                {isTestMode ? 'Protocolo Audit: UNLIMITED' : `Saldo: ${balanceText}`}
              </span>
              <div className="flex items-center gap-1">
                 <div className={`w-1 h-1 rounded-full animate-pulse ${isTestMode ? 'bg-blue-400' : 'bg-amber-500'}`}></div>
                 <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Failover Ativo</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setShowDashboard(!showDashboard)} className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-2xl border transition-all ${showDashboard ? 'bg-emerald-600 text-white shadow-lg border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
             {showDashboard ? 'Status ON' : 'Status OFF'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col transition-all duration-500 ${showDashboard ? 'max-w-[60%]' : 'max-w-full'}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 pointer-events-none">
                 <div className="text-6xl mb-6">{agent.icon}</div>
                 <h3 className="text-xl font-black uppercase tracking-widest">Canal Estabelecido</h3>
                 <p className="text-sm font-medium">Aguardando instruções do operador.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[90%] rounded-[2rem] p-6 relative group/msg ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'}`}>
                  
                  {msg.role === 'model' && msg.engine && (
                    <div className="flex items-center gap-2 mb-3">
                       <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${
                         msg.engine === 'eden' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                       }`}>
                         Motor: {msg.engine.toUpperCase()}
                       </span>
                    </div>
                  )}

                  <div className="prose prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                  
                  {msg.tokenUsage && (
                    <div className="absolute -bottom-6 left-2 opacity-0 group-hover/msg:opacity-100 transition-opacity text-[8px] font-black text-slate-600 uppercase tracking-widest">
                       Valor: {isTestMode ? "FREE" : new Intl.NumberFormat('pt-BR').format(msg.tokenUsage.totalTokens)} Créditos
                    </div>
                  )}

                  {msg.groundingUrls && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                       {msg.groundingUrls.map((g, idx) => (
                         <a key={idx} href={g.uri} target="_blank" rel="noreferrer" className="text-[9px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-emerald-500 hover:border-emerald-500 transition-colors truncate max-w-[150px]">{g.title || g.uri}</a>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <form onSubmit={handleSubmit} className={`flex items-center gap-4 border rounded-[2rem] p-2 pl-8 focus-within:border-blue-500 transition-colors shadow-2xl ${isTestMode ? 'bg-blue-600/5 border-blue-500/20' : 'bg-slate-900 border-slate-800'}`}>
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={(isTestMode || tokenBalance > 0) ? "Comando operacional..." : "SALDO ESGOTADO"} 
                disabled={!isTestMode && tokenBalance <= 0} 
                className="flex-1 bg-transparent text-slate-100 py-4 outline-none font-medium placeholder:text-slate-600" 
              />
              <button type="submit" disabled={isTyping || !input.trim() || (!isTestMode && tokenBalance <= 0)} className={`px-10 py-4 disabled:opacity-30 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${isTestMode ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-600 hover:bg-blue-500'}`}>Enviar</button>
            </form>
          </div>
        </div>

        {showDashboard && (
          <div className="w-[40%] border-l border-slate-800 bg-slate-900/10 flex flex-col animate-in slide-in-from-right-10 overflow-hidden backdrop-blur-sm">
             <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Multi-Engine Status</h3>
                  <div className={`px-2 py-1 border text-[8px] font-black rounded uppercase tracking-widest animate-pulse ${isTestMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                    {isTestMode ? 'Auditoria Ilimitada' : 'Redundância Ativa'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                      <div className="text-[8px] font-black text-blue-500 uppercase mb-2">Motor Primário (Eden)</div>
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-red-500"></div>
                         <div className="text-xl font-black text-slate-500">OFFLINE</div>
                      </div>
                      <div className="text-[8px] text-slate-700 font-bold mt-2 uppercase tracking-tighter">TIMEOUT: APP.EDEN.RUN</div>
                   </div>

                   <div className={`p-6 bg-slate-950 border rounded-3xl relative overflow-hidden group ${isTestMode ? 'border-blue-500/40' : 'border-emerald-500/20'}`}>
                      <div className={`absolute top-0 right-0 w-16 h-16 blur-xl group-hover:opacity-100 transition-colors ${isTestMode ? 'bg-blue-500/5' : 'bg-emerald-500/5'}`}></div>
                      <div className={`text-[8px] font-black uppercase mb-2 ${isTestMode ? 'text-blue-400' : 'text-emerald-500'}`}>Motor Ativo (Gemini)</div>
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full animate-pulse ${isTestMode ? 'bg-blue-400' : 'bg-emerald-500'}`}></div>
                         <div className="text-xl font-black text-white uppercase tracking-tighter">OPERACIONAL</div>
                      </div>
                      <div className={`text-[8px] font-bold mt-2 uppercase tracking-tighter ${isTestMode ? 'text-blue-500' : 'text-emerald-600'}`}>EXECUTANDO VIA PROTOCOLO MCP</div>
                   </div>
                </div>

                <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl">
                   <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Logs de Transação</h4>
                   <div className="space-y-3">
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 text-[8px] font-mono border-l border-slate-800 pl-3 py-0.5">
                           <span className="text-slate-700">{log.time}</span>
                           <span className={log.type === 'error' ? 'text-red-500' : log.type === 'warn' ? 'text-amber-500' : 'text-slate-400'}>
                             {log.msg}
                           </span>
                        </div>
                      ))}
                      {logs.length === 0 && <div className="text-[8px] font-mono text-slate-800 italic">Aguardando eventos...</div>}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
