
import React, { useState } from 'react';
import { useForgeStore } from '../store';

const AuthGate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useForgeStore();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      const result = register(email, password);
      if (!result.success) setError(result.error || 'Erro ao registrar.');
    } else {
      const result = login(email, password);
      if (!result.success) setError(result.error || 'Erro ao entrar.');
    }
  };

  const handleDevAccess = () => {
    setError(null);
    login('admin@forge.com', 'admin');
  };

  return (
    <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">SaaS Cloud v2.5 Online</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Forge Enterprise</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-tight">Sua Força de Trabalho Autônoma Local.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">E-mail Corporativo</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl text-white outline-none focus:border-blue-500 transition-all font-bold"
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Senha de Acesso</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl text-white outline-none focus:border-blue-500 transition-all font-bold"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all active:scale-95">
              {isRegistering ? 'Criar Conta Enterprise' : 'Autenticar no Kernel'}
            </button>
          </form>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[8px] font-black text-slate-600 uppercase">Acesso Alternativo</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            
            <button 
              onClick={handleDevAccess}
              className="w-full py-4 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
            >
               <span className="group-hover:rotate-180 transition-transform">⚙️</span>
               Entrar como Admin (admin/admin)
            </button>
          </div>

          <div className="text-center pt-4">
             <button 
               type="button"
               onClick={() => {
                 setIsRegistering(!isRegistering);
                 setError(null);
               }}
               className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors tracking-widest"
             >
               {isRegistering ? 'Já possui licença? Entrar' : 'Não tem conta? Registrar agora'}
             </button>
          </div>
        </div>

        <div className="text-center">
           <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em]">Forge Master Console • Build 2025.A</p>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
