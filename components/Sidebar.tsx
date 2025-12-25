
import React, { useState } from 'react';
import { useForgeStore } from '../store';
import { ChatSession } from '../types';

interface SidebarProps {
  onNewAgent: () => void;
  onGoHome: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewAgent, onGoHome }) => {
  const { 
    agents, sessions, reminders, activeAgentId, activeSessionId,
    setActiveAgent, setActiveSession, createSession, deleteSession, renameSession, toggleReminder
  } = useForgeStore();

  const activeAgentSessions = sessions.filter(s => s.agentId === activeAgentId);
  const activeAgentReminders = reminders.filter(r => r.agentId === activeAgentId && !r.completed);
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditValue(session.title);
  };

  const handleFinishRename = (sessionId: string) => {
    if (editValue.trim()) {
      renameSession(sessionId, editValue.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <div className="w-80 h-full border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden">
      <div 
        onClick={onGoHome}
        className="p-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800/30 transition-colors group shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:rotate-12 transition-transform">🤖</div>
          <div>
            <h1 className="text-lg font-black text-white leading-none tracking-tight">Oficina MCP</h1>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-black">Sua Equipe de Robôs</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
            <span>Meus Robôs MCP</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{agents.length}</span>
          </div>
          <div className="space-y-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group ${
                  activeAgentId === agent.id ? 'bg-blue-600/10 text-blue-100 ring-1 ring-blue-500/30' : 'hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{agent.icon}</span>
                <div className="flex-1 truncate">
                  <div className="font-bold text-sm truncate">{agent.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeAgentId && activeAgentReminders.length > 0 && (
          <div className="p-4 pt-0 space-y-4">
             <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] px-2">Agenda do Robô</div>
             <div className="space-y-2 px-1">
                {activeAgentReminders.slice(0, 3).map(reminder => (
                  <div key={reminder.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-start gap-3">
                    <input type="checkbox" checked={reminder.completed} onChange={() => toggleReminder(reminder.id)} className="mt-1 accent-blue-600"/>
                    <div className="text-[11px] font-bold text-slate-200 truncate">{reminder.title}</div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeAgentId && (
          <div className="p-4 pt-0 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Conversas</div>
              <button onClick={() => createSession(activeAgentId)} className="text-[9px] bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-400 px-2 py-1 rounded-md transition-all font-black">+ NOVA</button>
            </div>
            <div className="space-y-1">
              {activeAgentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`group/session w-full text-left p-3 rounded-xl transition-all text-xs flex flex-col gap-1 border border-transparent cursor-pointer ${
                    activeSessionId === session.id ? 'bg-slate-800 border-slate-700 text-slate-100' : 'hover:bg-slate-800/30 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {editingSessionId === session.id ? (
                      <input autoFocus className="bg-slate-950 border border-blue-500/50 rounded px-1 py-0.5 w-full outline-none text-white font-bold" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => handleFinishRename(session.id)} onKeyDown={e => e.key === 'Enter' && handleFinishRename(session.id)} onClick={e => e.stopPropagation()}/>
                    ) : (
                      <div className="font-bold truncate flex-1">{session.title}</div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover/session:opacity-100">
                      <button onClick={(e) => handleStartRename(e, session)} className="p-1 hover:text-blue-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="3"/></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="p-1 hover:text-red-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="3"/></svg></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <button onClick={onNewAgent} className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/20">Criar Robô MCP</button>
      </div>
    </div>
  );
};

export default Sidebar;
