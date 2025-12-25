
import React from 'react';
import { AGENT_BLUEPRINTS } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-12 lg:p-16 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-8 py-10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/5 blur-[120px] rounded-full -z-10"></div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
            Protocolo MCP para Negócios
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
            Sua Empresa em<br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 bg-clip-text text-transparent">
              Alta Performance Digital
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Deixe o trabalho operacional para seus robôs especializados. 
            Configure agentes para indústria, comércio e serviços em minutos.
          </p>
          <div className="pt-8 flex justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
            >
              Abrir Minha Oficina
            </button>
          </div>
        </section>

        {/* Plug & Play Gallery */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Roadmaps de Automação</h2>
              <p className="text-slate-500 text-sm font-medium">Selecione um perfil de robô e comece a operar imediatamente.</p>
            </div>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">Indústria</span>
               <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">Varejo</span>
               <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">Serviços</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENT_BLUEPRINTS.map((agent, i) => (
              <div 
                key={i} 
                className="group relative p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/40 transition-all hover:bg-slate-900/80 cursor-pointer overflow-hidden flex flex-col justify-between h-64 shadow-lg hover:shadow-blue-500/5"
                onClick={onGetStarted}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-600/20 group-hover:border-blue-500/40 transition-all">
                      {agent.icon}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white mb-1 tracking-tight">{agent.name}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 font-medium">
                      {agent.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {agent.tools.map((tool, ti) => (
                    <span key={ti} className="text-[8px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-500 font-black uppercase border border-slate-800 group-hover:border-slate-700">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Business Quote */}
        <section className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="relative bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-4xl shadow-2xl animate-bounce">
              💡
            </div>
            <div className="space-y-6">
              <p className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight tracking-tight">
                "No mercado moderno, o gargalo não é a mão de obra, é a velocidade da informação. O MCP resolve isso."
              </p>
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-slate-700"></div>
                <div className="font-black text-blue-400 uppercase tracking-widest text-[10px]">Núcleo de Estratégia Industrial</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-slate-900 text-center space-y-4">
          <div className="text-slate-700 text-[9px] font-black uppercase tracking-[0.6em]">
            Oficina MCP • Versão Enterprise 2025
          </div>
          <p className="text-[10px] text-slate-800 max-w-lg mx-auto italic">Otimizado para o motor Gemini Pro & Flash da Google GenAI</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
