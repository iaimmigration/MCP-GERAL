
import React, { useState } from 'react';
import { AgentConfig, ToolType, AgentRoutine, AgentVariable } from '../types';
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
    defaultFolder: '',
    targetUrls: [],
    tools: [],
    toolConfigs: Object.values(ToolType).map(t => ({ tool: t, customInstruction: '', enabled: false })),
    routines: [],
    variables: [],
    model: 'gemini-3-flash-preview',
    icon: '🤖',
    temperature: 0.7
  });

  const [newVar, setNewVar] = useState({ key: '', label: '', value: '' });
  const [newUrl, setNewUrl] = useState('');
  
  // Estado para nova rotina
  const [newRoutine, setNewRoutine] = useState<Partial<AgentRoutine>>({
    name: '',
    frequency: 'daily',
    isCloudScheduled: true,
    task: { id: '', target: '', instruction: '', alertCondition: '' }
  });

  const steps = [
    { label: 'Quem ele é', icon: '👤' },
    { label: 'O que ele sabe', icon: '🧠' },
    { label: 'Variáveis Contextuais', icon: '🏷️' },
    { label: 'Habilidades', icon: '⚡' },
    { label: 'Cloud Orchestration', icon: '⏲️' }
  ];

  const addVariable = () => {
    if (!newVar.key || !newVar.label) return;
    const key = newVar.key.startsWith('{{') ? newVar.key : `{{${newVar.key}}}`;
    const variable: AgentVariable = { key, label: newVar.label, value: newVar.value };
    setConfig({ ...config, variables: [...(config.variables || []), variable] });
    setNewVar({ key: '', label: '', value: '' });
  };

  const removeVariable = (key: string) => {
    setConfig({ ...config, variables: config.variables?.filter(v => v.key !== key) });
  };

  const addUrl = () => {
    if (!newUrl.trim()) return;
    const urls = config.targetUrls || [];
    if (!urls.includes(newUrl)) {
      setConfig({ ...config, targetUrls: [...urls, newUrl] });
    }
    setNewUrl('');
  };

  const removeUrl = (url: string) => {
    setConfig({ ...config, targetUrls: (config.targetUrls || []).filter(u => u !== url) });
  };

  const addRoutine = () => {
    if (!newRoutine.name || !newRoutine.task?.instruction) return;
    const routine: AgentRoutine = {
      id: crypto.randomUUID(),
      name: newRoutine.name as string,
      isCloudScheduled: !!newRoutine.isCloudScheduled,
      frequency: newRoutine.frequency as any,
      status: 'active',
      efficiencyScore: 100,
      task: {
        id: crypto.randomUUID(),
        target: 'global',
        instruction: newRoutine.task.instruction,
        alertCondition: 'on_new_data'
      },
      history: []
    };
    setConfig({ ...config, routines: [...config.routines, routine] });
    setNewRoutine({ name: '', frequency: 'daily', isCloudScheduled: true, task: { id: '', target: '', instruction: '', alertCondition: '' } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a192f]/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-6">
              <button onClick={onCancel} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurar Protocolo</h2>
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{steps[activeStep].label}</p>
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
                      <h3 className="text-2xl font-black tracking-tight">Identidade Operacional</h3>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Agente</label>
                         <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="Ex: Monitor de Preços" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"/>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propósito</label>
                         <input type="text" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} placeholder="Para que ele serve?" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"/>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h3 className="text-2xl font-black tracking-tight">Atalhos (Blueprints)</h3>
                      <div className="grid grid-cols-1 gap-3">
                         {AGENT_BLUEPRINTS.map(bp => (
                           <button key={bp.name} onClick={() => setConfig({...config, name: bp.name, description: bp.description, systemInstruction: bp.instruction, icon: bp.icon, tools: bp.tools})} className="p-4 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 transition-all">
                              <div className="flex items-center gap-3">
                                 <span className="text-xl">{bp.icon}</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest">{bp.name}</span>
                              </div>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 1 && (
             <div className="space-y-12 animate-fade-in">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">System Instruction (O Cérebro)</label>
                   <textarea value={config.systemInstruction} onChange={e => setConfig({...config, systemInstruction: e.target.value})} className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium resize-none"/>
                </div>

                <div className="space-y-6 p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem]">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Domínios de Pesquisa (URLs Alvo)</h3>
                   <div className="flex gap-2">
                      <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyPress={e => e.key === 'Enter' && addUrl()} placeholder="https://portal.com.br" className="flex-1 p-4 bg-white border border-slate-200 rounded-xl outline-none"/>
                      <button onClick={addUrl} className="px-6 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Incluir</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {config.targetUrls?.map(url => (
                        <div key={url} className="px-3 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                           <span className="text-[10px] font-bold">{url}</span>
                           <button onClick={() => removeUrl(url)} className="text-slate-300 hover:text-red-500">×</button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="space-y-8 animate-fade-in">
                <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                   <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">Parâmetros Dinâmicos</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={newVar.label} onChange={e => setNewVar({...newVar, label: e.target.value})} placeholder="Nome da Variável" className="p-4 bg-white rounded-xl outline-none"/>
                      <input type="text" value={newVar.key} onChange={e => setNewVar({...newVar, key: e.target.value})} placeholder="{{CHAVE}}" className="p-4 bg-white rounded-xl outline-none"/>
                   </div>
                   <button onClick={addVariable} className="mt-4 px-8 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Cadastrar Variável</button>
                </div>
                <div className="space-y-2">
                   {config.variables?.map(v => (
                     <div key={v.key} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                        <span className="text-xs font-black text-blue-600">{v.key}</span>
                        <span className="text-xs font-bold text-slate-500">{v.label}</span>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeStep === 3 && (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                {Object.entries(TOOL_METADATA).map(([id, meta]) => (
                  <button key={id} onClick={() => {
                    const isEn = config.tools.includes(id as ToolType);
                    setConfig({
                      ...config,
                      tools: isEn ? config.tools.filter(t => t !== id) : [...config.tools, id as ToolType]
                    });
                  }} className={`p-6 text-left rounded-3xl border transition-all ${config.tools.includes(id as ToolType) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <div className="font-black text-xs uppercase mb-1">{meta.label}</div>
                    <div className="text-[9px] opacity-70 leading-tight">{meta.description}</div>
                  </button>
                ))}
             </div>
           )}

           {activeStep === 4 && (
             <div className="space-y-10 animate-fade-in">
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] text-white">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Orquestrador de Nuvem (Offline)</h3>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure tarefas para rodar mesmo com o sistema fechado.</p>
                      </div>
                      <div className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-full animate-pulse">Server-Side Active</div>
                   </div>

                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-500">Nome da Rotina</label>
                            <input type="text" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} placeholder="Ex: Varredura Diária de Preços" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500"/>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-500">Frequência</label>
                            <select value={newRoutine.frequency} onChange={e => setNewRoutine({...newRoutine, frequency: e.target.value as any})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 uppercase text-[10px] font-black">
                               <option value="hourly">A cada 1 hora</option>
                               <option value="daily">Diariamente</option>
                               <option value="weekly">Semanalmente</option>
                               <option value="manual">Apenas Manual</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-500">Instrução Específica para esta Rotina</label>
                         <textarea value={newRoutine.task?.instruction} onChange={e => setNewRoutine({...newRoutine, task: {...newRoutine.task!, instruction: e.target.value}})} placeholder="O que o servidor deve buscar quando disparar esta tarefa?" className="w-full h-24 p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 resize-none"/>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                         <input type="checkbox" checked={newRoutine.isCloudScheduled} onChange={e => setNewRoutine({...newRoutine, isCloudScheduled: e.target.checked})} className="w-5 h-5 accent-blue-600"/>
                         <div>
                            <div className="text-[10px] font-black uppercase text-white">Execução em Nuvem (Offline)</div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">O agente executará esta tarefa no servidor, independentemente de você estar com o app aberto.</p>
                         </div>
                      </div>

                      <button onClick={addRoutine} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Salvar Rotina no Orquestrador</button>
                   </div>
                </div>

                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Rotinas Agendadas</h4>
                   {config.routines.map(r => (
                     <div key={r.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className={`w-2 h-2 rounded-full ${r.isCloudScheduled ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
                           <div>
                              <div className="text-xs font-black text-slate-900 uppercase">{r.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase">{r.frequency} • {r.isCloudScheduled ? 'Server-Side' : 'Client-Side'}</div>
                           </div>
                        </div>
                        <button onClick={() => setConfig({...config, routines: config.routines.filter(x => x.id !== r.id)})} className="text-slate-300 hover:text-red-500 transition-colors">Remover</button>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
           <button onClick={onCancel} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Descartar Alterações</button>
           <div className="flex gap-4">
              {activeStep > 0 && (
                <button onClick={() => setActiveStep(activeStep - 1)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase">Anterior</button>
              )}
              {activeStep < steps.length - 1 ? (
                <button onClick={() => setActiveStep(activeStep + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl">Próximo</button>
              ) : (
                <button onClick={() => onSave(config)} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-500/20">Salvar Sincronia Cloud</button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
