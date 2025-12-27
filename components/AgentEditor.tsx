
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

  const applyBlueprint = (bp: any) => {
    setConfig({
      ...config,
      name: bp.name,
      description: bp.description,
      systemInstruction: bp.instruction,
      tools: bp.tools,
      icon: bp.icon,
      toolConfigs: config.toolConfigs.map(tc => ({
        ...tc,
        enabled: bp.tools.includes(tc.tool)
      }))
    });
    setActiveStep(1);
  };

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

  const removeRoutine = (id: string) => {
    setConfig({ ...config, routines: config.routines.filter(r => r.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header de Criação */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="text-4xl">{config.icon}</div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurar Robô</h2>
                 <p className="text-xs text-slate-500 font-medium">Defina os parâmetros operacionais do seu agente.</p>
              </div>
           </div>
           <div className="flex gap-2">
              {steps.map((s, i) => (
                <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${activeStep === i ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>
                   <span>{s.icon}</span>
                   <span className="hidden md:inline">{s.label}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar text-slate-900">
           
           {activeStep === 0 && (
             <div className="space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h3 className="text-2xl font-black tracking-tight">Escolha um Perfil Pronto:</h3>
                      <div className="grid grid-cols-1 gap-3">
                         {AGENT_BLUEPRINTS.map(bp => (
                           <button key={bp.name} onClick={() => applyBlueprint(bp)} className="p-5 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                              <div className="text-2xl mb-2">{bp.icon}</div>
                              <div className="font-black text-sm uppercase mb-1">{bp.name}</div>
                              <div className="text-xs text-slate-500 font-medium">{bp.description}</div>
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-6 pt-1">
                      <h3 className="text-2xl font-black tracking-tight">Ou defina agora:</h3>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Robô</label>
                         <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="Ex: Pesquisador de Preços" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"/>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breve descrição</label>
                         <input type="text" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} placeholder="O que ele faz?" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"/>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 1 && (
             <div className="space-y-10 animate-fade-in">
                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Manual de Instruções (Como ele deve agir?)</label>
                      <textarea value={config.systemInstruction} onChange={e => setConfig({...config, systemInstruction: e.target.value})} placeholder="Ex: Você deve ser sempre educado, procurar pelos menores preços e nunca mentir sobre informações..." className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-medium resize-none"/>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dados da sua Empresa (O que ele deve saber?)</label>
                      <textarea value={config.knowledgeBase} onChange={e => setConfig({...config, knowledgeBase: e.target.value})} placeholder="Ex: Nossa loja fica na Rua X, vendemos o produto Y por R$ 50,00 e nossos principais concorrentes são..." className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-medium resize-none"/>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="space-y-10 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {Object.entries(TOOL_METADATA).map(([id, meta]) => (
                     <button key={id} onClick={() => {
                        const isEn = config.tools.includes(id as ToolType);
                        setConfig({
                          ...config,
                          tools: isEn ? config.tools.filter(t => t !== id) : [...config.tools, id as ToolType],
                          toolConfigs: config.toolConfigs.map(tc => tc.tool === id ? {...tc, enabled: !isEn} : tc)
                        });
                     }} className={`p-6 text-left rounded-2xl border transition-all ${config.tools.includes(id as ToolType) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <div className="text-2xl mb-3">🛠️</div>
                        <div className="font-black text-xs uppercase mb-1">{meta.label}</div>
                        <div className={`text-[10px] font-medium leading-tight ${config.tools.includes(id as ToolType) ? 'text-blue-100' : 'text-slate-500'}`}>{meta.description}</div>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {activeStep === 3 && (
             <div className="space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   {/* Form de Nova Rotina */}
                   <div className="lg:col-span-1 space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-200">
                      <h3 className="text-lg font-black uppercase tracking-tight">Nova Rotina</h3>
                      <div className="space-y-4">
                         <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase">Nome da Rotina</label>
                           <input type="text" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} placeholder="Ex: Monitor de Preços" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold"/>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase">Frequência</label>
                           <select value={newRoutine.frequency} onChange={e => setNewRoutine({...newRoutine, frequency: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold">
                              <option>A cada 30 minutos</option>
                              <option>A cada 1 hora</option>
                              <option>A cada 6 horas</option>
                              <option>Diariamente</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase">Instrução de Alerta</label>
                           <textarea value={newRoutine.task?.alertCondition} onChange={e => setNewRoutine({...newRoutine, task: {...newRoutine.task!, alertCondition: e.target.value}})} placeholder="Quando avisar?" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm h-24 resize-none"/>
                         </div>
                         <button onClick={addRoutine} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Adicionar Rotina</button>
                      </div>
                   </div>

                   {/* Lista de Rotinas Ativas */}
                   <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-lg font-black uppercase tracking-tight">Rotinas Configuradas ({config.routines.length})</h3>
                      {config.routines.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                           <div className="text-4xl mb-4">⏲️</div>
                           <p className="font-bold text-sm">Nenhuma rotina automática definida.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {config.routines.map(r => (
                            <div key={r.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">⏲️</div>
                                  <div>
                                     <div className="font-black text-sm uppercase">{r.name}</div>
                                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.frequency} • {r.status}</div>
                                  </div>
                               </div>
                               <button onClick={() => removeRoutine(r.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                               </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
             </div>
           )}

        </div>

        {/* Footer de Navegação */}
        <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
           <button onClick={onCancel} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Cancelar</button>
           <div className="flex gap-4">
              {activeStep > 0 && (
                <button onClick={() => setActiveStep(activeStep - 1)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Anterior</button>
              )}
              {activeStep < steps.length - 1 ? (
                <button onClick={() => setActiveStep(activeStep + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">Próximo Passo</button>
              ) : (
                <button onClick={() => onSave(config)} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all">Finalizar e Ativar</button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
