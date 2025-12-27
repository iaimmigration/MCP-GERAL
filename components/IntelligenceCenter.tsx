
import React from 'react';

interface IntelligenceCenterProps {
  onBack: () => void;
}

const IntelligenceCenter: React.FC<IntelligenceCenterProps> = ({ onBack }) => {
  const newFunctions = [
    { title: "Monitoramento de Licitações", desc: "Varredura diária em portais de compras e Diários Oficiais para encontrar editais.", icon: "🏛️" },
    { title: "Prospecção B2B Ativa", desc: "Localiza empresas no Maps e extrai contatos de decisores via Search.", icon: "🎯" },
    { title: "Gestão de Crise de Marca", desc: "Monitoramento de menções negativas e notícias em tempo real.", icon: "📢" },
    { title: "Auditoria de SEO & Web", desc: "Análise técnica de sites próprios e de concorrentes para otimização.", icon: "🚀" },
    { title: "Compliance & Jurídico", desc: "Busca jurisprudência e analisa conformidade de contratos com a LGPD.", icon: "⚖️" },
    { title: "Headhunting Inteligente", desc: "Triagem de currículos cruzando dados com perfis profissionais na web.", icon: "🤝" },
    { title: "Precificação Dinâmica", desc: "Sugestões de preço baseadas em cotações de insumos e concorrentes.", icon: "📊" },
    { title: "Fiscalização de Gôndola", desc: "Análise visual de prateleiras para auditoria de share e ruptura.", icon: "🛒" },
    { title: "Curadoria de Marketing", desc: "Busca tendências virais para pautar redes sociais e blogs.", icon: "📸" },
    { title: "Logística Inteligente", desc: "Planejamento de rotas monitorando tráfego e clima em tempo real.", icon: "🚛" }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-12 lg:p-20 custom-scrollbar animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-20 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-800 pb-12">
          <div className="flex items-center gap-8">
            <button 
              onClick={onBack}
              className="p-4 bg-slate-900 border border-slate-800 rounded-3xl text-blue-500 hover:border-blue-500/50 transition-all group"
            >
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Capacidades MCP</h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Manual Técnico de Operações</p>
            </div>
          </div>
          <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 hidden lg:block">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kernel Status</div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-sm">V2.5 Stable</span>
            </div>
          </div>
        </div>

        <section className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 rounded-[3rem] p-10 md:p-16">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="text-3xl">💎</div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Salto de Qualidade Digital</h2>
                 <p className="text-slate-300 text-lg font-medium leading-relaxed opacity-80">
                   Seus agentes não são passivos. Eles executam varreduras, cruzam dados e operam ferramentas para entregar resultados prontos para decisão.
                 </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-2">Ação no Mundo Real</h4>
                    <p className="text-slate-400 text-sm font-medium">Busca ativa, navegação autônoma e extração OCR inteligente.</p>
                 </div>
                 <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-2">ROI Instantâneo</h4>
                    <p className="text-slate-400 text-sm font-medium">Economia massiva em tarefas burocráticas e repetitivas.</p>
                 </div>
              </div>
           </div>
        </section>

        <section className="space-y-12">
           <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Especialidades MCP</h2>
              <p className="text-slate-500 font-medium">Aplicações práticas do protocolo em múltiplos setores.</p>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {newFunctions.map((func, i) => (
                <div key={i} className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-blue-500/40 transition-all group">
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{func.icon}</div>
                   <h3 className="text-white font-black text-[10px] uppercase mb-2 tracking-widest leading-tight">{func.title}</h3>
                   <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-3">{func.desc}</p>
                </div>
              ))}
           </div>
        </section>

        <section className="bg-blue-600 rounded-[3.5rem] p-12 md:p-24 text-center space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500 animate-pulse opacity-20 -z-10"></div>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">Implemente sua Equipe <br/>de Elite Digital agora.</h2>
          <button 
            onClick={onBack}
            className="px-14 py-6 bg-white text-blue-600 rounded-[2rem] font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            Começar Configuração
          </button>
        </section>

        <footer className="text-center py-12 text-slate-800 font-black text-[10px] uppercase tracking-[0.5em]">
          Protocolo MCP • Enterprise Edition 2025
        </footer>
      </div>
    </div>
  );
};

export default IntelligenceCenter;
