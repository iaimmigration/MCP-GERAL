
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-800 pb-12">
          <div className="space-y-6">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/>
              </svg>
              Voltar ao Centro
            </button>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
              Manual de <br/>
              <span className="text-blue-600">Capacidades MCP</span>
            </h1>
          </div>
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 hidden md:block">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status do Kernel</div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-sm">Operacional: Nível 5</span>
            </div>
          </div>
        </div>

        {/* Impacto de Qualidade MCP */}
        <section className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 rounded-[3rem] p-10 md:p-16 space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/40">💎</div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">O Salto de Qualidade Operacional</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest">Ação no Mundo Real</h4>
                 <p className="text-slate-300 text-sm leading-relaxed font-medium">Seus agentes não são passivos. Eles executam varreduras, cruzam dados e operam ferramentas para entregar resultados prontos para decisão.</p>
              </div>
              <div className="space-y-4">
                 <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest">Rentabilidade Garantida</h4>
                 <p className="text-slate-300 text-sm leading-relaxed font-medium">Cada crédito MCP investido economiza horas de trabalho humano em tarefas repetitivas e burocráticas.</p>
              </div>
           </div>
        </section>

        {/* 10 Novas Funções Relevantes */}
        <section className="space-y-12">
           <div className="text-center">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">10 Funções de Elite para seu Negócio</h2>
              <p className="text-slate-500 mt-2 font-medium">Aplicações práticas do protocolo MCP em diferentes setores.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {newFunctions.map((func, i) => (
                <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all group">
                   <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{func.icon}</div>
                   <h3 className="text-white font-black text-xs uppercase mb-2 leading-tight">{func.title}</h3>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{func.desc}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Main Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
          {/* Web Intelligence */}
          <div className="space-y-6 group">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              🌐
            </div>
            <h3 className="text-2xl font-black text-white">Inteligência de Mercado Ativa</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Nossos agentes não apenas "leem" a internet; eles a processam. Equipados com o <span className="text-blue-400">Chrome Tools MCP</span>, eles entram em sites de concorrentes, extraem tabelas de preços e monitoram lançamentos. 
            </p>
          </div>

          {/* Multimodal Vision */}
          <div className="space-y-6 group p-8 bg-slate-900/30 border border-slate-800 rounded-[2.5rem]">
            <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
              👁️
            </div>
            <h3 className="text-2xl font-black text-white">Visão Industrial & OCR</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Anexe fotos de notas fiscais ou gôndolas. O agente extrai os dados, realiza cálculos tributários e gera relatórios de estoque instantaneamente usando visão computacional.
            </p>
          </div>
        </div>

        {/* Action Section */}
        <section className="bg-blue-600 rounded-[3rem] p-10 md:p-20 text-center space-y-8 shadow-[0_40px_100px_rgba(37,99,235,0.2)]">
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Implemente sua Equipe <br/>de Elite Digital hoje.</h2>
          <p className="text-blue-100/70 max-w-xl mx-auto font-medium">Acelere processos que antes levavam horas para serem concluídos em apenas alguns segundos de processamento.</p>
          <button 
            onClick={onBack}
            className="px-12 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            Configurar Meu Primeiro Agente
          </button>
        </section>

        <footer className="text-center py-12 text-slate-700 font-black text-[10px] uppercase tracking-[0.4em]">
          Protocolo MCP • Inteligência Certificada 2025
        </footer>
      </div>
    </div>
  );
};

export default IntelligenceCenter;
