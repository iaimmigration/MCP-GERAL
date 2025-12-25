
import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      title: "Orquestração Modular (MCP)",
      description: "Separação inteligente entre 'cérebro' e 'músculos'. Ative apenas as ferramentas necessárias para seu nicho, reduzindo ruído e focando em performance.",
      icon: "🧩",
      color: "from-blue-500 to-cyan-400"
    },
    {
      title: "Grounding Anti-Alucinação",
      description: "Integração nativa com Google Search e Maps. Chega de inventar dados; seus agentes operam com base em informações reais e citadas do mundo atual.",
      icon: "🛡️",
      color: "from-emerald-500 to-teal-400"
    },
    {
      title: "Agilidade Operacional",
      description: "Reduza o Time-to-Market de semanas para minutos. Transforme ideias em agentes funcionais sem escrever uma única linha de código de infraestrutura.",
      icon: "⚡",
      color: "from-amber-500 to-orange-400"
    },
    {
      title: "Verticalização de Persona",
      description: "UX adaptada ao negócio. Configure o tom, o rigor e a especialidade de cada agente para que eles falem a língua exata do seu profissional ou cliente.",
      icon: "🎭",
      color: "from-purple-500 to-pink-400"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 md:p-12 lg:p-20">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            O Futuro da IA Verticalizada
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
            MCP Agent <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Forge</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Não crie apenas chats. Construa infraestruturas de inteligência especializadas, 
            configuradas para os desafios reais do seu mercado.
          </p>
          <div className="pt-8 flex justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
            >
              Começar Agora
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-900"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </section>

        {/* Product Engineer Quote */}
        <section className="relative p-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20">
          <div className="bg-slate-950 rounded-[calc(1.5rem-1px)] p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-3xl grayscale">
              👨‍💻
            </div>
            <div>
              <p className="text-lg italic text-slate-300 mb-4">
                "No mercado atual, a IA genérica está perdendo valor. O MCP Forge foi desenhado para entregar IA verticalizada, 
                onde a precisão dos dados e a agilidade de implementação são os únicos diferenciais que importam."
              </p>
              <div className="font-bold text-blue-400">Visão de Produto</div>
              <div className="text-xs text-slate-500">Engenharia de Soluções Sênior</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
