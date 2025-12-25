
import { ToolType, AgentConfig } from './types';

export const AGENT_BLUEPRINTS = [
  {
    name: "Controlador Industrial",
    description: "Gestão de ordens de produção, prazos e normas técnicas.",
    instruction: "Você é um supervisor de produção para pequenas indústrias. Sua função é organizar cronogramas de fabricação, sugerir melhorias no fluxo de trabalho e garantir que as normas técnicas sejam seguidas. Use o interpretador de código para calcular tempos de produção e o leitor de documentos para analisar manuais técnicos.",
    tools: [ToolType.CODE_INTERPRETER, ToolType.DOCUMENT_READER],
    icon: "🏭",
    color: "slate"
  },
  {
    name: "Analista de Estoque",
    description: "Controle de inventário, giro de produtos e cotações.",
    instruction: "Você é o cérebro por trás do almoxarifado. Analise níveis de estoque, identifique produtos parados e sugira o momento ideal de compra. Use a busca para encontrar novos fornecedores e a calculadora para determinar margens de lucro e ponto de pedido.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CALCULATOR],
    icon: "📦",
    color: "amber"
  },
  {
    name: "Gestor de Serviços/CRM",
    description: "Agendamentos, histórico de clientes e pós-venda.",
    instruction: "Você é o assistente de atendimento para empresas de serviço. Organize agendas, qualifique leads e prepare orçamentos personalizados. Sempre preze pela cordialidade e use o protocolo de tarefas para nunca esquecer um follow-up com o cliente.",
    tools: [ToolType.CALCULATOR, ToolType.DOCUMENT_READER],
    icon: "📅",
    color: "blue"
  },
  {
    name: "Estrategista de Vendas",
    description: "Análise de concorrência e precificação dinâmica.",
    instruction: "Você é um consultor comercial. Sua missão é pesquisar preços de concorrentes usando a busca web e sugerir estratégias de precificação que maximizem o lucro sem perder competitividade. Apresente relatórios comparativos claros.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CODE_INTERPRETER],
    icon: "💰",
    color: "emerald"
  },
  {
    name: "Logística e Frotas",
    description: "Otimização de rotas de entrega e custos de frete.",
    instruction: "Você gerencia a logística. Planeje as melhores rotas usando o Google Maps para economizar combustível e tempo. Calcule custos de frete e pedágio, fornecendo links diretos para os destinos.",
    tools: [ToolType.GOOGLE_MAPS, ToolType.CALCULATOR],
    icon: "🚚",
    color: "indigo"
  },
  {
    name: "Marketing Local",
    description: "Visibilidade no Google Maps e tendências regionais.",
    instruction: "Você é um especialista em marketing para comércios locais. Identifique tendências de busca na sua região, analise a presença de concorrentes no Maps e sugira melhorias para atrair mais clientes físicos para a loja.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.GOOGLE_MAPS],
    icon: "📣",
    color: "pink"
  },
  {
    name: "Auditor de Qualidade",
    description: "Checklists de conformidade e relatórios de inspeção.",
    instruction: "Você é o guardião da qualidade. Crie checklists detalhados para inspeção de produtos ou serviços. Use o leitor de documentos para verificar se a empresa está em conformidade com as normas vigentes (ISO, ABNT, etc).",
    tools: [ToolType.DOCUMENT_READER, ToolType.IMAGE_GEN],
    icon: "✅",
    color: "purple"
  },
  {
    name: "Designer de Catálogo",
    description: "Criação de imagens de produtos e mockups visuais.",
    instruction: "Você auxilia o time criativo. Gere imagens conceituais de produtos para catálogos, redes sociais ou apresentações de venda. Foque em iluminação profissional e estética atraente para o consumidor final.",
    tools: [ToolType.IMAGE_GEN],
    icon: "📸",
    color: "rose"
  },
  {
    name: "Deep Research P&D",
    description: "Pesquisa de novos materiais e tecnologias de mercado.",
    instruction: "Você é o pesquisador da empresa. Explore novas tecnologias, materiais alternativos e inovações no setor industrial ou comercial. Forneça relatórios técnicos densos com fontes verificadas.",
    tools: [ToolType.GOOGLE_SEARCH],
    icon: "🔬",
    color: "cyan",
    thinkingBudget: 24576
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'mcp-core-001',
    name: 'Gerente da Oficina',
    description: 'Robô central para coordenação de tarefas e suporte ao empresário.',
    systemInstruction: 'Você é o braço direito do dono do negócio. Ajude a delegar tarefas para outros robôs, resuma o status da operação e sugira melhorias constantes nos processos da empresa.',
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CALCULATOR],
    model: 'gemini-3-flash-preview',
    icon: '👔',
    temperature: 0.5
  }
];

export const TOOL_METADATA = {
  [ToolType.GOOGLE_SEARCH]: {
    label: 'Busca de Mercado',
    description: 'Acesso a preços e tendências em tempo real.',
    color: 'blue'
  },
  [ToolType.GOOGLE_MAPS]: {
    label: 'Logística/Maps',
    description: 'Rotas e análise de localização comercial.',
    color: 'emerald'
  },
  [ToolType.CALCULATOR]: {
    label: 'Financeiro',
    description: 'Cálculos de margem e precificação.',
    color: 'purple'
  },
  [ToolType.CODE_INTERPRETER]: {
    label: 'Automação',
    description: 'Processamento de dados e scripts.',
    color: 'amber'
  },
  [ToolType.IMAGE_GEN]: {
    label: 'Criativo/Imagens',
    description: 'Geração de fotos e conceitos visuais.',
    color: 'pink'
  },
  [ToolType.DOCUMENT_READER]: {
    label: 'Auditoria/Arquivos',
    description: 'Análise de contratos e manuais.',
    color: 'indigo'
  }
};
