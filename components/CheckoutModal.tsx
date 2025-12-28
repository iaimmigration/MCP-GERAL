
import React, { useState } from 'react';
import { useForgeStore } from '../store';

const PACKAGES = [
  { 
    id: 'standard', 
    name: 'Standard Unit', 
    credits: 5000000, 
    price: '$50.00', 
    description: 'Ideal para automações departamentais e fluxos estáveis.',
    tier: 'Tier 1',
    color: 'blue'
  },
  { 
    id: 'professional', 
    name: 'Professional Cluster', 
    credits: 12000000, 
    price: '$80.00', 
    description: 'Capacidade ampliada com prioridade de processamento em nuvem.',
    tier: 'Tier 2',
    color: 'indigo',
    popular: true
  },
  { 
    id: 'industrial', 
    name: 'Industrial Workforce', 
    credits: 40000000, 
    price: '$200.00', 
    description: 'Escala massiva para operações 24/7 e múltiplos workers simultâneos.',
    tier: 'Tier 3',
    color: 'emerald'
  },
];

const CheckoutModal: React.FC = () => {
  const { setCheckoutOpen, addCredits } = useForgeStore();
  const [selected, setSelected] = useState(PACKAGES[1].id);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = () => {
    setIsProcessing(true);
    const pkg = PACKAGES.find(p => p.id === selected);
    // Simulação de processamento de gateway de pagamento seguro
    setTimeout(() => {
      if (pkg) addCredits(pkg.credits);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl p-4 animate-fade-in">
      <div className="bg-white rounded-[4rem] w-full max-w-6xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] flex flex-col md:flex-row h-[90vh] md:h-[700px] border border-white/20">
        
        {/* Painel Informativo Lateral */}
        <div className="md:w-80 bg-slate-900 p-12 text-white flex flex-col justify-between border-r border-slate-800 shrink-0">
          <div className="space-y-8">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg">💳</div>
            <div>
              <h2 className="text-3xl font-black leading-tight uppercase tracking-tighter">Marketplace de Potência</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Digital Fuel v2.5</p>
            </div>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              Adquira créditos de processamento para expandir sua força de trabalho. 
              Nossas taxas incluem infraestrutura de nuvem, bypass de segurança e manutenção do kernel.
            </p>
          </div>
          
          <div className="space-y-5">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-[10px] border border-blue-500/20 font-black">✓</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Taxa 20x Aplicada</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-[10px] border border-blue-500/20 font-black">✓</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Resiliência Total</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-[10px] border border-blue-500/20 font-black">✓</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Ativação Instantânea</span>
             </div>
          </div>
        </div>

        {/* Galeria de Pacotes */}
        <div className="flex-1 p-12 flex flex-col bg-slate-50/50">
          <div className="flex justify-between items-center mb-10">
             <div className="space-y-1 text-slate-900">
                <h3 className="font-black uppercase text-xs tracking-widest">Configuração de Créditos</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Selecione o volume de processamento</p>
             </div>
             <button onClick={() => setCheckoutOpen(false)} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
             </button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`relative group p-8 rounded-[3rem] border-2 transition-all flex flex-col justify-between text-left overflow-hidden ${
                  selected === pkg.id 
                    ? `bg-white border-${pkg.color}-600 shadow-2xl scale-105 z-10` 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    Mais Eficiente
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    selected === pkg.id ? `bg-${pkg.color}-600 text-white` : 'bg-slate-100 text-slate-400'
                  }`}>
                    {pkg.id === 'standard' ? '📦' : pkg.id === 'professional' ? '🚀' : '🏭'}
                  </div>
                  <div className="text-slate-900">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{pkg.tier}</div>
                    <h4 className="text-lg font-black uppercase leading-none">{pkg.name}</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{pkg.description}</p>
                </div>

                <div className="pt-10">
                   <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{pkg.price}</div>
                   <div className={`text-[9px] font-black uppercase tracking-widest ${selected === pkg.id ? `text-${pkg.color}-600` : 'text-slate-400'}`}>
                      {new Intl.NumberFormat('pt-BR').format(pkg.credits)} Tokens RPA
                   </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center gap-8 border-t border-slate-200 pt-10">
             <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total a Faturar</p>
                <div className="text-2xl font-black text-slate-900">{PACKAGES.find(p => p.id === selected)?.price}</div>
             </div>
             <button 
              onClick={handlePurchase}
              disabled={isProcessing}
              className={`px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${
                isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed w-full md:w-auto' : 'bg-slate-900 hover:bg-black text-white w-full md:w-auto hover:scale-105 active:scale-95'
              }`}
             >
               {isProcessing ? (
                 <>
                   <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                   Autenticando...
                 </>
               ) : 'Processar Pagamento'}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutModal;
