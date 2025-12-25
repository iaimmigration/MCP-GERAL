
import React, { useState } from 'react';
import { AgentConfig, ToolType } from '../types';
import { TOOL_METADATA, AGENT_BLUEPRINTS } from '../constants';

interface AgentEditorProps {
  initialConfig?: AgentConfig;
  onSave: (config: AgentConfig) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({ initialConfig, onSave, onCancel, onDelete }) => {
  const [config, setConfig] = useState<AgentConfig>(initialConfig || {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    systemInstruction: '',
    knowledgeBase: '',
    tools: [],
    model: 'gemini-3-flash-preview',
    icon: '🤖',
    temperature: 0.7,
    thinkingBudget: 0
  });

  const applyBlueprint = (blueprint: typeof AGENT_BLUEPRINTS[0]) => {
    setConfig(prev => ({
      ...prev,
      name: blueprint.name,
      description: blueprint.description,
      systemInstruction: blueprint.instruction,
      tools: blueprint.tools,
      icon: blueprint.icon
    }));
  };

  const toggleTool = (tool: ToolType) => {
    setConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  const icons = ['🤖', '🔍', '📍', '⚖️', '🧬', '🎨', '🚀', '🧠', '💼', '🛠️', '📉', '🔐', '🚚', '📊', '🖼️', '🧪', '📡'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-black text-white italic">Workshop de Forja</h2>
            <p className="text-slate-500 text-sm tracking-tight font-medium">Configure as capacidades sensoriais e cognitivas do seu agente.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* Blueprints Section */}
          {!initialConfig && (
            <section className="space-y-4">
              <label className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">Plantas (Blueprints)</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {AGENT_BLUEPRINTS.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => applyBlueprint(b)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-left transition-all group"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{b.icon}</div>
                    <div className="font-bold text-slate-200 text-sm">{b.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-2">{b.description}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Identity */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Identidade Industrial</label>
              <input
                type="text"
                value={config.name}
                onChange={e => setConfig({...config, name: e.target.value})}
                placeholder="Ex: Auditor de Risco"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-bold"
              />
              <input
                type="text"
                value={config.description}
                onChange={e => setConfig({...config, description: e.target.value})}
                placeholder="Propósito operacional"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div className="space-y-5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Avatar Símbolo</label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setConfig({...config, icon})}
                    className={`text-xl p-2.5 rounded-xl transition-all ${config.icon === icon ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-slate-950 border border-slate-800 hover:border-slate-600'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Prompt & Knowledge */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Lógica de Sistema</label>
              <textarea
                value={config.systemInstruction}
                onChange={e => setConfig({...config, systemInstruction: e.target.value})}
                placeholder="Como o agente deve agir..."
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none font-mono text-xs leading-relaxed"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Base de Conhecimento RAG</label>
              <textarea
                value={config.knowledgeBase}
                onChange={e => setConfig({...config, knowledgeBase: e.target.value})}
                placeholder="Dados proprietários para ancoragem técnica..."
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 text-emerald-100/80 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none font-mono text-xs leading-relaxed"
              />
            </div>
          </section>

          {/* Model & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Cérebro Computacional</label>
              <select
                value={config.model}
                onChange={e => setConfig({...config, model: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-bold"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash (Velocidade)</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro (Raciocínio Profundo)</option>
              </select>
              {config.model.includes('pro') && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Thinking Budget</div>
                  <input 
                    type="range" min="0" max="32768" step="1024"
                    value={config.thinkingBudget || 0}
                    onChange={e => setConfig({...config, thinkingBudget: parseInt(e.target.value)})}
                    className="w-full accent-indigo-500"
                  />
                  <div className="text-[10px] text-indigo-300 mt-1 font-bold">{config.thinkingBudget || 0} tokens para reflexão</div>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Módulos Sensoriais (MCP)</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(TOOL_METADATA) as ToolType[]).map(toolType => {
                  const meta = (TOOL_METADATA[toolType] as any);
                  const isActive = config.tools.includes(toolType);
                  return (
                    <button
                      key={toolType}
                      onClick={() => toggleTool(toolType)}
                      className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                        isActive 
                          ? `bg-${meta.color}-500/10 border-${meta.color}-500/50 text-white shadow-lg`
                          : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{meta.label}</span>
                      <span className="text-[9px] opacity-60 mt-1 line-clamp-1">{meta.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 flex justify-between gap-4 bg-slate-900/80 backdrop-blur-xl">
          <div className="flex gap-4 ml-auto">
            <button onClick={onCancel} className="px-8 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Descartar</button>
            <button
              onClick={() => onSave(config)}
              disabled={!config.name || !config.systemInstruction}
              className="px-12 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
            >
              Comissionar Agente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
