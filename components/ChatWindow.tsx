
import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { AgentConfig, ChatMessage, ToolType, MessageAttachment, Priority, ActionReminder } from '../types';
import { executeAgentActionStream } from '../services/geminiService';
import { runSimulation, USABILITY_TEST_SCRIPT } from '../services/simulationService';
import { useForgeStore } from '../store';

interface ChatWindowProps {
  agent: AgentConfig;
  messages: ChatMessage[];
  onEditAgent: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agent, messages, onEditAgent }) => {
  const { activeSessionId, addMessage, updateLastMessage, createReminder, toggleReminder, reminders } = useForgeStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSimStep, setCurrentSimStep] = useState<number>(-1);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [showTaskLedger, setShowTaskLedger] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const sanitizeContent = (content: string) => {
    return DOMPurify.sanitize(content);
  };

  const parseAndExecuteTasks = (text: string) => {
    const taskRegex = /\[CREATE_TASK:\s*(.*?)\s*\|\s*(low|medium|high)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\]/gi;
    let match;
    while ((match = taskRegex.exec(text)) !== null) {
      const [_, title, priority, date] = match;
      createReminder({
        title,
        priority: priority as Priority,
        dueDate: new Date(date).getTime(),
        agentId: agent.id,
        sessionId: activeSessionId || 'global'
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent, manualInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = manualInput || input;
    if ((!finalInput.trim() && pendingAttachments.length === 0) || isTyping || !activeSessionId) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: finalInput,
      timestamp: Date.now(),
      attachments: [...pendingAttachments]
    };

    addMessage(activeSessionId, userMsg);
    setInput('');
    setPendingAttachments([]);
    setIsTyping(true);

    try {
      await executeAgentActionStream(
        agent, 
        finalInput, 
        messages, 
        userMsg.attachments,
        (text, grounding, thought, images) => {
          parseAndExecuteTasks(text);
          const cleanedText = text.replace('[HUMAN_INTERVENTION_REQUIRED]', '').replace(/\[CREATE_TASK:.*?\]/gi, '');
          updateLastMessage(activeSessionId, {
            role: 'model',
            content: cleanedText,
            timestamp: Date.now(),
            groundingUrls: grounding,
            thought,
            generatedImages: images
          });
        }
      );
    } catch (error) {
      updateLastMessage(activeSessionId, { 
        role: 'model', 
        content: "Falha crítica no núcleo de processamento.", 
        timestamp: Date.now() 
      });
    } finally {
      setIsTyping(false);
    }
  };

  const startUsabilitySimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentSimStep(0);
    
    let stepCount = 0;
    await runSimulation(async (prompt) => {
      setCurrentSimStep(stepCount);
      await handleSubmit(undefined, prompt);
      stepCount++;
    });

    setTimeout(() => { setIsSimulating(false); setCurrentSimStep(-1); }, 5000);
  };

  const agentReminders = reminders.filter(r => r.agentId === agent.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden font-sans">
      <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-1 ring-slate-700">{agent.icon}</div>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight flex items-center gap-2">
              {agent.name}
              {isTyping && <span className="flex gap-1 animate-pulse"><span className="w-1 h-1 bg-blue-500 rounded-full"></span></span>}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 font-black text-blue-400 uppercase tracking-tighter">{agent.model}</span>
              <button onClick={() => setShowTaskLedger(!showTaskLedger)} className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase transition-all ${showTaskLedger ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'}`}>Ledger {agentReminders.filter(r => !r.completed).length > 0 && `[${agentReminders.filter(r => !r.completed).length}]`}</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {agent.name.toLowerCase().includes('inspector') && (
             <button onClick={startUsabilitySimulation} disabled={isSimulating} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Audit Mode</button>
           )}
           <button onClick={onEditAgent} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
              <div className={`max-w-[85%] group relative ${msg.role === 'user' ? 'bg-blue-600 shadow-xl' : 'bg-slate-900 border border-slate-800 shadow-2xl'} rounded-3xl p-6 ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                {msg.role === 'model' && msg.thought && (
                  <div className="mb-4 p-4 bg-slate-950/50 border border-indigo-500/20 rounded-2xl text-[12px] font-mono text-indigo-300/60 leading-relaxed">{msg.thought}</div>
                )}
                <div 
                  className="prose prose-invert max-w-none text-[15px] leading-relaxed whitespace-pre-wrap font-medium text-slate-200"
                  dangerouslySetInnerHTML={{ __html: sanitizeContent(msg.content) }}
                />
                {msg.generatedImages && msg.generatedImages.map((img, idx) => (
                  <img key={idx} src={img} className="mt-6 rounded-3xl border border-white/5 shadow-2xl" alt="Forge Output" />
                ))}
                {msg.groundingUrls && (
                  <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, idx) => (
                      <a key={idx} href={url.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-xl text-[10px] font-black text-slate-500 hover:text-blue-400 transition-all uppercase tracking-tight">{url.title || "External Intelligence"}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showTaskLedger && (
          <div className="absolute top-4 right-4 w-96 max-h-[80%] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] shadow-2xl p-8 flex flex-col z-40 animate-in slide-in-from-right-10">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Directives</h3>
                <button onClick={() => setShowTaskLedger(false)} className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {agentReminders.map(reminder => (
                  <div key={reminder.id} className={`p-5 rounded-3xl border ${reminder.completed ? 'bg-slate-950/20 border-slate-800/30' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleReminder(reminder.id)} className={`mt-1 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${reminder.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-700'}`}>{reminder.completed && '✓'}</button>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${reminder.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>{reminder.title}</div>
                        <div className="flex items-center gap-3 mt-3">
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${reminder.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{reminder.priority}</span>
                           <span className="text-[10px] text-slate-500 font-mono">{new Date(reminder.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-950 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-[2rem] p-3 pl-6 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Transmita comandos para ${agent.name}...`} className="flex-1 bg-transparent text-slate-100 py-3 focus:outline-none placeholder:text-slate-600 font-medium" disabled={isTyping || isSimulating}/>
          <button type="submit" disabled={isTyping || isSimulating} className={`px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${isTyping || isSimulating ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95'}`}>{isTyping ? 'OPERANDO' : 'Executar'}</button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
