
import React, { useState } from 'react';
import { useForgeStore } from '../store';
import { executeAgentActionStream } from '../services/geminiService';
import { encryptData } from '../services/cryptoService';
import { saveRemoteConfig } from '../services/supabaseService';

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const store = useForgeStore();
  const { financialStats, totalTokensConsumed, tokenBalance, remoteKeys, masterSecret, vaultUnlocked, unlockVault, syncRemoteKeys } = store;

  const [cfoLog, setCfoLog] = useState<{msg: string, type: 'info' | 'success' | 'warn' | 'error'}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  
  const [vaultInputs, setVaultInputs] = useState({
    GEMINI_API_KEY: remoteKeys['GEMINI_API_KEY'] || '',
    RESEND_API_KEY: remoteKeys['RESEND_API_KEY'] || '',
    BROWSERLESS_URL: remoteKeys['BROWSERLESS_URL'] || ''
  });

  const cfoAgent = store.agents['mcp-finance-001'];

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(false);
    const success = await unlockVault(unlockInput);
    if (!success) {
      setUnlockError(true);
      setCfoLog(prev => [{msg: "ALERTA: Tentativa de acesso ao cofre com chave incorreta.", type: 'error'}, ...prev]);
    } else {
      setVaultInputs({
        GEMINI_API_KEY: store.remoteKeys['GEMINI_API_KEY'] || '',
        RESEND_API_KEY: store.remoteKeys['RESEND_API_KEY'] || '',
        BROWSERLESS_URL: store.remoteKeys['BROWSERLESS_URL'] || ''
      });
      setCfoLog(prev => [{msg: "COFRE DESBLOQUEADO: Acesso autorizado ao kernel de infraestrutura.", type: 'success'}, ...prev]);
    }
  };

  const handleSaveVault = async () => {
    if (!vaultUnlocked) return;
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(vaultInputs)) {
        if (value) {
          const encrypted = await encryptData(value, masterSecret);
          await saveRemoteConfig(key, encrypted);
        }
      }
      await syncRemoteKeys();
      setCfoLog(prev => [{msg: "SINCRONIZAÇÃO COMPLETA: Infraestrutura atualizada no Supabase.", type: 'success'}, ...prev]);
    } catch (e: any) {
      setCfoLog(prev => [{msg: `ERRO DE ESCRITA: ${e.message}`, type: 'error'}, ...prev]);
    } finally {
      setIsSaving(false);
    }
  };

  const runCfoAnalysis = async () => {
    if (!cfoAgent || isAnalyzing) return;
    setIsAnalyzing(true);
    setCfoLog(prev => [{msg: "INICIANDO VARREDURA DE INTEGRIDADE...", type: 'info'}, ...prev]);

    const context = `
      ESTADO ATUAL DO ECOSSISTEMA:
      - Total Consumido: ${totalTokensConsumed} tokens
      - Saldo Usuários: ${tokenBalance}
      - Markup: ${financialStats.currentMarkup}x
      - Infra Remota: ${vaultUnlocked ? 'Online' : 'Trancada'}
    `;

    try {
      await executeAgentActionStream(
        cfoAgent, context, [], [],
        () => {},
        (msg, level) => {
          setCfoLog(prev => [{msg, type: level === 'success' ? 'success' : level === 'warn' ? 'warn' : 'info'}, ...prev]);
        }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] overflow-hidden font-sans animate-fade-in relative">
      
      {/* Overlay de Bloqueio do Cofre */}
      {!vaultUnlocked && (
        <div className="absolute inset-0 z-50 bg-[#030712]/90 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3.5rem] space-y-8 shadow-2xl">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center text-4xl mx-auto border border-blue-500/30">🔐</div>
                 <h2 className="text-white font-black text-xl uppercase tracking-tighter">Cofre de Infraestrutura</h2>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Insira sua Master Key para descriptografar os segredos do Supabase.</p>
              </div>
              <form onSubmit={handleUnlock} className="space-y-6">
                 <input 
                    type="password" 
                    value={unlockInput}
                    onChange={e => setUnlockInput(e.target.value)}
                    className={`w-full p-6 bg-black border ${unlockError ? 'border-red-500' : 'border-white/10'} rounded-3xl text-white text-center font-mono outline-none focus:border-blue-500 transition-all`}
                    placeholder="••••••••••••••••"
                 />
                 <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    Desbloquear Kernel
                 </button>
              </form>
              <button onClick={onBack} className="w-full text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Voltar ao Dashboard</button>
           </div>
        </div>
      )}

      <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="p-4 bg-white/5 border border-white/10 rounded-[1.5rem] text-slate-400 hover:text-white">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3}/></svg>
          </button>
          <div>
            <h2 className="font-black text-white text-base uppercase tracking-tight">Enterprise Infrastructure</h2>
            <div className="flex items-center gap-4 mt-1">
               <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${remoteKeys['GEMINI_API_KEY'] ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vault Status: {vaultUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
               </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <button onClick={runCfoAnalysis} disabled={isAnalyzing} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase">Auditoria</button>
           <button onClick={handleSaveVault} disabled={isSaving || !vaultUnlocked} className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-600/20">Salvar Alterações</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-7 space-y-8">
             <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Configuração de APIs</h3>
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AES-GCM Protocol</span>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase px-2">Gemini Enterprise API Key</label>
                      <input 
                        type="password" 
                        value={vaultInputs.GEMINI_API_KEY}
                        onChange={e => setVaultInputs({...vaultInputs, GEMINI_API_KEY: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-mono text-xs focus:border-blue-500 outline-none"
                        placeholder="••••••••••••••••"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase px-2">Resend Mailer Key</label>
                      <input 
                        type="password" 
                        value={vaultInputs.RESEND_API_KEY}
                        onChange={e => setVaultInputs({...vaultInputs, RESEND_API_KEY: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-mono text-xs focus:border-blue-500 outline-none"
                        placeholder="re_••••••••"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase px-2">Browserless Cluster URL</label>
                      <input 
                        type="text" 
                        value={vaultInputs.BROWSERLESS_URL}
                        onChange={e => setVaultInputs({...vaultInputs, BROWSERLESS_URL: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-mono text-xs focus:border-blue-500 outline-none"
                        placeholder="wss://chrome.browserless.io?token=..."
                      />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] text-center">
                   <div className="text-3xl font-black text-white">{totalTokensConsumed}</div>
                   <div className="text-[8px] font-black text-slate-500 uppercase mt-2">Tokens Processados</div>
                </div>
                <div className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-[2.5rem] text-center">
                   <div className="text-3xl font-black text-blue-500">{financialStats.currentMarkup}x</div>
                   <div className="text-[8px] font-black text-blue-400 uppercase mt-2">Markup Global</div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-[3rem] p-10 h-[600px] overflow-hidden flex flex-col">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Auditoria em Tempo Real</h3>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 font-mono text-[9px]">
                {cfoLog.map((log, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    log.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    'bg-white/5 text-slate-400 border-white/5'
                  }`}>
                    [{new Date().toLocaleTimeString()}] {log.msg}
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
