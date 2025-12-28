
import React, { useState, useRef } from 'react';
import { AgentConfig, ToolType, AgentCredential, KnowledgeDoc } from '../types';

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
    specialty: '',
    allocationTarget: '',
    systemInstruction: '',
    tools: [],
    model: 'gemini-3-pro-preview',
    icon: '🤖',
    status: 'idle',
    handover: { email: '', autoExportCsv: true },
    routines: [],
    variables: [],
    credentials: [],
    targetSites: [],
    knowledgeBase: [],
    temperature: 0.1
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: 'Identidade', icon: '👤' },
    { label: 'Lógica', icon: '🧠' },
    { label: 'Cofre', icon: '🔐' },
    { label: 'Sites/URLs', icon: '🌐' },
    { label: 'Conhecimento', icon: '📚' },
    { label: 'Skills', icon: '⚡' }
  ];

  const handleAddCredential = () => {
    const newCred: AgentCredential = {
      id: crypto.randomUUID(),
      label: 'Novo Acesso',
      siteUrl: '',
      username: '',
      passwordSecret: ''
    };
    setConfig({...config, credentials: [...config.credentials, newCred]});
  };

  const handleUpdateCredential = (id: string, partial: Partial<AgentCredential>) => {
    setConfig({
      ...config,
      credentials: config.credentials.map(c => c.id === id ? {...c, ...partial} : c)
    });
  };

  const handleAddSite = () => {
    setConfig({...config, targetSites: [...config.targetSites, '']});
  };

  const handleUpdateSite = (idx: number, val: string) => {
    const updated = [...config.targetSites];
    updated[idx] = val;
    setConfig({...config, targetSites: updated});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: KnowledgeDoc[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const docPromise = new Promise<KnowledgeDoc>((resolve) => {
        reader.onloadend = () => {
          resolve({
            id: crypto.randomUUID(),
            fileName: file.name,
            mimeType: file.type,
            base64Data: (reader.result as string).split(',')[1]
          });
        };
      });
      reader.readAsDataURL(file);
      newDocs.push(await docPromise);
    }
    setConfig({...config, knowledgeBase: [...config.knowledgeBase, ...newDocs]});
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-4 font-sans text-slate-100">
      <div className="bg-[#0f172a] rounded-[4rem] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/5">
        
        <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
           <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[80%]">
              {steps.map((step, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-3xl transition-all whitespace-nowrap border ${
                    activeStep === i 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                   <span className="text-lg">{step.icon}</span>
                   <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                </button>
              ))}
           </div>
           <button onClick={onCancel} className="p-4 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/10">
           {activeStep === 0 && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex gap-8 items-start">
                   <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center text-6xl shadow-inner">
                      {config.icon}
                   </div>
                   <div className="flex-1 space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-2">Designação do Worker</label>
                        <input 
                            type="text" 
                            value={config.name} 
                            onChange={e => setConfig({...config, name: e.target.value})} 
                            className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl font-black text-2xl outline-none focus:border-blue-500 transition-all" 
                            placeholder="Ex: Auditor Jurídico Pro"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Especialidade</label>
                           <input 
                              type="text" 
                              value={config.specialty} 
                              onChange={e => setConfig({...config, specialty: e.target.value})} 
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs" 
                              placeholder="RPA, Compliance, etc"
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Icone Emoji</label>
                           <input 
                              type="text" 
                              value={config.icon} 
                              onChange={e => setConfig({...config, icon: e.target.value})} 
                              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-center"
                           />
                        </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vault: Gestão de Credenciais</h3>
                   <button onClick={handleAddCredential} className="px-6 py-3 bg-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">Adicionar Acesso</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {config.credentials.map(cred => (
                     <div key={cred.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6 relative group">
                        <button onClick={() => setConfig({...config, credentials: config.credentials.filter(c => c.id !== cred.id)})} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                        <input 
                          value={cred.label} 
                          onChange={e => handleUpdateCredential(cred.id, {label: e.target.value})} 
                          className="w-full bg-transparent border-b border-white/10 font-black text-xs uppercase text-blue-500"
                        />
                        <div className="space-y-4">
                           <input placeholder="URL do Site (ex: login.site.com)" value={cred.siteUrl} onChange={e => handleUpdateCredential(cred.id, {siteUrl: e.target.value})} className="w-full bg-black/40 p-4 rounded-xl text-[10px] border border-white/5 outline-none"/>
                           <input placeholder="Usuário / Email" value={cred.username} onChange={e => handleUpdateCredential(cred.id, {username: e.target.value})} className="w-full bg-black/40 p-4 rounded-xl text-[10px] border border-white/5 outline-none"/>
                           <input type="password" placeholder="Senha Mestra" value={cred.passwordSecret} onChange={e => handleUpdateCredential(cred.id, {passwordSecret: e.target.value})} className="w-full bg-black/40 p-4 rounded-xl text-[10px] border border-white/5 outline-none"/>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeStep === 3 && (
             <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Target Sites & Fontes</h3>
                   <button onClick={handleAddSite} className="px-6 py-3 bg-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">+ Link</button>
                </div>
                <div className="space-y-4">
                   {config.targetSites.map((site, idx) => (
                     <div key={idx} className="flex gap-4">
                        <input 
                          value={site} 
                          onChange={e => handleUpdateSite(idx, e.target.value)} 
                          className="flex-1 p-5 bg-white/5 border border-white/10 rounded-2xl font-mono text-xs"
                          placeholder="https://dominio-para-automatizar.com.br"
                        />
                        <button onClick={() => setConfig({...config, targetSites: config.targetSites.filter((_, i) => i !== idx)})} className="p-5 text-red-500 bg-red-500/5 rounded-2xl hover:bg-red-500/10">✕</button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeStep === 4 && (
             <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Base de Conhecimento (Docs)</h3>
                   <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">Upload PDF/DOCX</button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload}/>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {config.knowledgeBase.map(doc => (
                     <div key={doc.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center space-y-4 relative group">
                        <button onClick={() => setConfig({...config, knowledgeBase: config.knowledgeBase.filter(d => d.id !== doc.id)})} className="absolute top-2 right-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                        <div className="text-4xl">📄</div>
                        <p className="text-[10px] font-bold truncate px-2 text-slate-400">{doc.fileName}</p>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* Mantém outros passos de Lógica e Skills conforme necessário */}
           {activeStep === 1 && (
             <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Prompt Mestre de Comportamento</label>
                <textarea 
                  value={config.systemInstruction} 
                  onChange={e => setConfig({...config, systemInstruction: e.target.value})}
                  className="w-full p-8 bg-black/40 border border-white/5 rounded-[3rem] font-medium text-sm h-80 outline-none focus:border-blue-500 transition-all leading-relaxed"
                  placeholder="Defina as regras, limites e o tom de voz do agente..."
                />
             </div>
           )}

           {activeStep === 5 && (
             <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in">
                {Object.values(ToolType).map(tool => (
                  <button 
                    key={tool}
                    onClick={() => {
                      const tools = config.tools.includes(tool) 
                        ? config.tools.filter(t => t !== tool) 
                        : [...config.tools, tool];
                      setConfig({...config, tools});
                    }}
                    className={`p-8 rounded-[2.5rem] border text-left transition-all flex flex-col gap-4 ${
                      config.tools.includes(tool) ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                    }`}
                  >
                     <span className="text-[10px] font-black uppercase tracking-widest">{tool.replace('_', ' ')}</span>
                  </button>
                ))}
             </div>
           )}
        </div>

        <footer className="p-10 border-t border-white/5 flex justify-between items-center bg-black/40">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocolo de Segurança</span>
              <span className="text-emerald-500 text-[10px] font-bold">AES-256 Cloud Vault Ready</span>
           </div>
           <div className="flex gap-6">
              <button onClick={onCancel} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Descartar</button>
              <button 
                onClick={() => onSave(config)}
                className="px-20 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                Implantar Agente
              </button>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default AgentEditor;
