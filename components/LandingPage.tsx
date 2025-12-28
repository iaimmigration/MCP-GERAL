
import React from 'react';
import { AGENT_BLUEPRINTS } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
  onViewIntelligence: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onViewIntelligence }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 md:p-12 lg:p-16 custom-scrollbar text-slate-900">
      <div className="max-w-7xl mx-auto space-y-32">
        {/* Hero Section */}
        <section className="text-center space-y-8 py-10 relative">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em]">
            Digital Staffing Agency v2.5
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
            Trabalhadores Digitais<br/>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Prontos para Escalar
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Alocamos inteligência artificial especializada para resolver gargalos operacionais em minutos. Sem recrutamento, sem encargos, 100% de performance.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95"
            >
              Consultar Especialistas Disponíveis
            </button>
          </div>
        </section>

        {/* Security Trust Section */}
        <section className="bg-slate-50 border border-slate-200 rounded-[3rem] p-12 flex flex-wrap justify-center gap-12 md:gap-24 grayscale opacity-60">
           <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">AES-256 Encryption</span>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-2xl">⚖️</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">LGPD / GDPR Compliant</span>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-2xl">🏦</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stripe Secure Billing</span>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Healing Engine</span>
           </div>
        </section>

        {/* Marketplace Section */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Batalhão Digital</h2>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-tight">Escolha o especialista por competência técnica</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AGENT_BLUEPRINTS.map((worker: any, i) => (
              <div 
                key={i} 
                className="group bg-white border border-slate-200 rounded-[3rem] p-10 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between h-[480px]"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                      {worker.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-100">Live</span>
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Alocado: 42 Empresas</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">{worker.name}</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">"{worker.description}"</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Stack de Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {worker.tools.map((tool: any, ti: number) => (
                        <span key={ti} className="text-[8px] font-black bg-white text-slate-600 px-2 py-1 rounded-lg uppercase border border-slate-200">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Budget Estimado</span>
                      <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">{worker.salary_label}</span>
                    </div>
                    <button 
                      onClick={onGetStarted}
                      className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 transition-colors"
                    >
                      Alocar Agora
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing Action */}
        <section className="bg-blue-600 rounded-[4rem] p-16 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight uppercase relative z-10">
              Transforme sua empresa em uma <br/><span className="bg-white text-blue-600 px-4">Operação Autônoma.</span>
           </h2>
           <p className="text-blue-100 text-lg font-medium max-w-2xl mx-auto relative z-10 opacity-80 uppercase tracking-tight">
              Acesse o marketplace, selecione seu worker e veja a produtividade triplicar em menos de 24 horas.
           </p>
           <button 
              onClick={onGetStarted}
              className="px-14 py-6 bg-white text-blue-600 rounded-[2rem] font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl relative z-10"
           >
              Entrar no Console
           </button>
        </section>

        <footer className="py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          Forge Digital Staffing • Global Enterprise Protocol
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
