
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

  const steps = [
    { label: 'Quem ele é', icon: '👤' },
    { label: 'O que ele sabe', icon: '🧠' },
    { label: 'Variáveis Contextuais', icon: '🏷️' },
    { label: 'Habilidades', icon: '⚡' },
    { label: 'Tarefas Automáticas', icon: '⏲️' }
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
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurador de Protocolo</h2>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Etapa {activeStep + 1} de {steps.length}</p>
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
                             setConfig({...config, name: bp.name, description: bp.description, systemInstruction: bp.instruction, icon: bp.icon, tools: bp.tools, targetUrls: []});
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
                         <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="Ex: Gestor de RH" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"/>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pasta de Resultados</label>
                         <input type="text" value={config.defaultFolder} onChange={e => setConfig({...config, defaultFolder: e.target.value})} placeholder="Ex: /financeiro/relatorios" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"/>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Propósito</label>
                         <input type="text" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} placeholder="Para que ele serve?" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"/>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 1 && (
             <div className="space-y-12 animate-fade-in">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Diretrizes Principais</label>
                   </div>
                   <textarea value={config.systemInstruction} onChange={e => setConfig({...config, systemInstruction: e.target.value})} placeholder="Defina as regras de comportamento..." className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-medium resize-none"/>
                </div>

                {/* Seção de URLs de Sites Específicos */}
                <div className="space-y-6 p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem]">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Sites Alvo (URLs)</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Especifique domínios para aumentar a assertividade das buscas.</p>
                   </div>
                   
                   <div className="flex gap-2">
                      <input 
                        type="url" 
                        value={newUrl} 
                        onChange={e => setNewUrl(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && addUrl()}
                        placeholder="https://exemplo.com.br" 
                        className="flex-1 p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                      />
                      <button onClick={addUrl} className="px-6 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Adicionar Site</button>
                   </div>

                   <div className="flex flex-wrap gap-2">
                      {(config.targetUrls || []).map(url => (
                        <div key={url} className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-3 group">
                           <span className="text-xs font-bold text-slate-700">{url}</span>
                           <button onClick={() => removeUrl(url)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                           </button>
                        </div>
                      ))}
                      {(config.targetUrls || []).length === 0 && (
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic py-2">Nenhuma URL específica configurada.</div>
                      )}
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Base de Conhecimento Fixa</label>
                   <textarea value={config.knowledgeBase} onChange={e => setConfig({...config, knowledgeBase: e.target.value})} placeholder="Documentação, valores ou FAQs..." className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-medium resize-none"/>
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="space-y-8 animate-fade-in">
                <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                   <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">Criar Variáveis Dinâmicas</h3>
                   <p className="text-xs text-blue-700/70 mb-6">Defina campos que podem ser alterados para reaproveitar este agente em diferentes contextos.</p>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-blue-400 block mb-1">Nome Interno (Ex: empresa)</label>
                        <input type="text" value={newVar.key} onChange={e => setNewVar({...newVar, key: e.target.value})} placeholder="empresa" className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none"/>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-blue-400 block mb-1">Rótulo Exibido</label>
                        <input type="text" value={newVar.label} onChange={e => setNewVar({...newVar, label: e.target.value})} placeholder="Nome da Empresa" className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none"/>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-blue-400 block mb-1">Valor Atual</label>
                        <input type="text" value={newVar.value} onChange={e => setNewVar({...newVar, value: e.target.value})} placeholder="Minha Empresa S.A" className="w-full p-4 bg-white border border-blue-200 rounded-xl outline-none"/>
                      </div>
                   </div>
                   <button onClick={addVariable} className="mt-6 px-10 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Configurar Variável</button>
                </div>

                <div className="space-y-3">
                   {config.variables?.map(v => (
                     <div key={v.key} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                           <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono text-xs text-blue-600">{v.key}</div>
                           <div>
                              <div className="text-xs font-black uppercase text-slate-900">{v.label}</div>
                              <div className="text-[10px] text-slate-500">{v.value || 'Nenhum valor definido'}</div>
                           </div>
                        </div>
                        <button onClick={() => removeVariable(v.key)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                        </button>
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
                    <div className="text-2xl mb-3">🛠️</div>
                    <div className="font-black text-xs uppercase mb-1">{meta.label}</div>
                    <div className={`text-[9px] font-medium leading-tight ${config.tools.includes(id as ToolType) ? 'text-blue-100' : 'text-slate-500'}`}>{meta.description}</div>
                  </button>
                ))}
             </div>
           )}

           {activeStep === 4 && (
             <div className="space-y-8 animate-fade-in">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
                   <h4 className="font-black text-sm uppercase mb-6">Agendar Rotina de Monitoramento</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nome da tarefa automática..." className="p-4 bg-white border border-slate-200 rounded-xl outline-none font-bold"/>
                      <select className="p-4 bg-white border border-slate-200 rounded-xl outline-none font-black text-xs uppercase">
                         <option>A cada 1 hora</option>
                         <option>Diariamente</option>
                         <option>Semanalmente</option>
                      </select>
                   </div>
                   <button className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Ativar Rotina</button>
                </div>
             </div>
           )}
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
           <button onClick={onCancel} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Descartar</button>
           <div className="flex gap-4">
              {activeStep > 0 && (
                <button onClick={() => setActiveStep(activeStep - 1)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Anterior</button>
              )}
              {activeStep < steps.length - 1 ? (
                <button onClick={() => setActiveStep(activeStep + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Próximo</button>
              ) : (
                <button onClick={() => onSave(config)} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">Salvar e Sincronizar</button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
