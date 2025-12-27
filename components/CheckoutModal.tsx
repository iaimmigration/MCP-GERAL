
import React, { useState } from 'react';
import { useForgeStore } from '../store';

const PACKAGES = [
  { id: 'starter', name: 'Plano Inicial', credits: 500000, price: 'R$ 49,90', bonus: '20%' },
  { id: 'pro', name: 'Plano Business', credits: 2500000, price: 'R$ 199,00', bonus: 'Popular' },
  { id: 'enterprise', name: 'Plano Escala', credits: 10000000, price: 'R$ 699,00', bonus: 'Melhor Preço' },
];

const CheckoutModal: React.FC = () => {
  const { setCheckoutOpen, addCredits } = useForgeStore();
  const [selected, setSelected] = useState(PACKAGES[1].id);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = () => {
    setIsProcessing(true);
    const pkg = PACKAGES.find(p => p.id === selected);
    // Simula atraso de pagamento
    setTimeout(() => {
      if (pkg) addCredits(pkg.credits);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh] md:h-auto">
        
        {/* Lado Esquerdo - Info de Valor */}
        <div className="md:w-1/3 bg-slate-900 p-10 text-white flex flex-col justify-between border-r border-slate-800">
          <div className="space-y-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl">💳</div>
            <h2 className="text-3xl font-black leading-tight uppercase tracking-tighter">Recarga de Inteligência</h2>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              Cada crédito MCP garante o processamento dos seus agentes. Cobramos uma margem operacional para manter a infraestrutura de alta performance e segurança dos seus dados.
            </p>
          </div>
          <div className="space-y-4 pt-10">
             <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Margem 12x Inclusa</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Créditos Vitalícios</span>
             </div>
          </div>
        </div>

        {/* Lado Direito - Seleção de Pacotes */}
        <div className="flex-1 p-10 flex flex-col justify-between bg-slate-50">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest">Escolha seu pacote</h3>
               <button onClick={() => setCheckoutOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">Fechar</button>
            </div>

            <div className="space-y-3">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                    selected === pkg.id ? 'bg-white border-blue-600 shadow-xl' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full border-2 ${selected === pkg.id ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}></div>
                     <div className="text-left">
                        <div className="font-black text-slate-900 text-sm uppercase">{pkg.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Intl.NumberFormat('pt-BR').format(pkg.credits)} Créditos</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-lg font-black text-slate-900">{pkg.price}</div>
                     <div className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">{pkg.bonus}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 space-y-4">
             <button 
              onClick={handlePurchase}
              disabled={isProcessing}
              className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
             >
               {isProcessing ? (
                 <>
                   <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                   Processando...
                 </>
               ) : 'Confirmar e Recarregar'}
             </button>
             <p className="text-center text-[9px] text-slate-400 font-medium">Pagamento simulado para fins de demonstração do modelo de negócios.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutModal;
