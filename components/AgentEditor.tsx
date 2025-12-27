
import React, { useState } from 'react';
import { AgentConfig, ToolType, AgentRoutine } from '../types';
import { TOOL_METADATA, AGENT_BLUEPRINTS } from '../constants';

interface AgentEditorProps {
  initialConfig?: AgentConfig;
  onSave: (config: AgentConfig) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({ initialConfig, onSave, onCancel, onDelete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<AgentConfig>(initialConfig || {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    systemInstruction: '',
    knowledgeBase: '',
    tools: [],
    toolConfigs: Object.values(ToolType).map(t => ({ tool: t, customInstruction: '', enabled: false })),
    routines: [],
    model: 'gemini-3-flash-preview',
    icon: '🤖',
    temperature: 0.7
  });

  const [newRoutine, setNewRoutine] = useState<Partial<AgentRoutine>>({
    name: '',
    frequency: 'A cada 1 hora',
    task: { id: '', target: '', instruction: '', alertCondition: '' }
  });

  const steps = [
    { label: 'Quem ele é', icon: '👤' },
    { label: 'O que ele sabe', icon: '🧠' },
    { label: 'Habilidades', icon: '⚡' },
    { label: 'Tarefas Automáticas', icon: '⏲️' }
  ];

  const addRoutine = () => {
    if (!newRoutine.name) return;
    const routine: AgentRoutine = {
      id: crypto.randomUUID(),
      name: newRoutine.name!,
      frequency: newRoutine.frequency!,
      status: 'Ativo',
      efficiencyScore: 100,
      history: [],
      task: {
        id: crypto.randomUUID(),
        target: newRoutine.task?.target || 'Web',
        instruction: newRoutine.task?.instruction || '',
        alertCondition: newRoutine.task?.alertCondition || ''
      }
    };
    setConfig({ ...config, routines: [...config.routines, routine] });
    setNewRoutine({ name: '', frequency: 'A cada 1 hora', task: { id: '', target: '', instruction: '', alertCondition: '' } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-6">
              <button 
                onClick={onCancel}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{config.icon}</div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Editor de Agente</h2>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Passo {activeStep + 1} de {steps.length}</p>
                </div>
              </div>
           </div>
           <div className="flex gap-2">
              {steps.map((s, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all ${activeStep === i ? 'bg-blue-600 w-8' : 'bg-slate-200'}`}></div>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar text-slate-900">
           {activeStep === 0 && (
             <div className="space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h3 className="text-2xl font-black tracking-tight">Blueprints Rápidos:</h3>
                      <div className="grid grid-cols-1 gap-3">
                         {AGENT_BLUEPRINTS.map(bp => (
                           <button key={bp.name} onClick={() => {
                             setConfig({...config, name: bp.name, description: bp.description, systemInstruction: bp.instruction, icon: bp.icon, tools: bp.tools});
                             setActiveStep(1);
                           }} className="p-5 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                              <div className="text-2xl mb-2">{bp.icon}</div>
                              <div className="font-black text-sm uppercase mb-1">{bp.name}</div>
                              <div className="text-xs text-slate-500">{bp.description}</div>
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h3 className="text-2xl font-black tracking-tight">Identidade Visual:</h3>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Agente</label>
                         <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="Ex: Analista de Mercado" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"/>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
                         <input type="text" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} placeholder="Breve resumo..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"/>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 1 && (
             <div className="space-y-8 animate-fade-in">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Instruções de Comportamento</label>
                   <textarea value={config.systemInstruction} onChange={e => setConfig({...config, systemInstruction: e.target.value})} placeholder="Como o agente deve responder?" className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-medium resize-none"/>
                   <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Base de Conhecimento Específica</label>
                   <textarea value={config.knowledgeBase} onChange={e => setConfig({...config, knowledgeBase: e.target.value})} placeholder="Dados exclusivos da sua empresa..." className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-medium resize-none"/>
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                {Object.entries(TOOL_METADATA).map(([id, meta]) => (
                  <button key={id} onClick={() => {
                    const isEn = config.tools.includes(id as ToolType);
                    setConfig({
                      ...config,
                      tools: isEn ? config.tools.filter(t => t !== id) : [...config.tools, id as ToolType]
                    });
                  }} className={`p-6 text-left rounded-3xl border transition-all ${config.tools.includes(id as ToolType) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mb-3">🛠️</div>
                    <div className="font-black text-xs uppercase mb-1">{meta.label}</div>
                    <div className={`text-[9px] font-medium leading-tight ${config.tools.includes(id as ToolType) ? 'text-blue-100' : 'text-slate-500'}`}>{meta.description}</div>
                  </button>
                ))}
             </div>
           )}

           {activeStep === 3 && (
             <div className="space-y-8 animate-fade-in">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
                   <h4 className="font-black text-sm uppercase mb-6">Agendar Nova Rotina Automática</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} placeholder="Nome da tarefa..." className="p-4 bg-white border border-slate-200 rounded-xl outline-none"/>
                      <select value={newRoutine.frequency} onChange={e => setNewRoutine({...newRoutine, frequency: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl outline-none">
                         <option>A cada 1 hora</option>
                         <option>Diariamente</option>
                         <option>Semanalmente</option>
                      </select>
                   </div>
                   <button onClick={addRoutine} className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Adicionar Rotina</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                   {config.routines.map(r => (
                     <div key={r.id} className="p-5 border border-slate-100 rounded-2xl flex justify-between items-center bg-white">
                        <span className="font-bold text-sm">{r.name} ({r.frequency})</span>
                        <button onClick={() => setConfig({...config, routines: config.routines.filter(x => x.id !== r.id)})} className="text-red-500 text-xs font-black">Remover</button>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
           <button onClick={onCancel} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Cancelar Alterações</button>
           <div className="flex gap-4">
              {activeStep > 0 && (
                <button onClick={() => setActiveStep(activeStep - 1)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Anterior</button>
              )}
              {activeStep < steps.length - 1 ? (
                <button onClick={() => setActiveStep(activeStep + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Próximo</button>
              ) : (
                <button onClick={() => onSave(config)} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">Finalizar Agente</button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
