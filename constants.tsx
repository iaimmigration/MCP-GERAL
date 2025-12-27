
import { ToolType, AgentConfig } from './types';

// Multiplicador de margem: 12x o custo da API
export const PRICING_MULTIPLIER = 12;

export const AGENT_BLUEPRINTS = [
  {
    name: "Gerente de Compras",
    description: "Pesquisa preços, fornecedores e cria tabelas de comparação usando navegação inteligente.",
    instruction: "Você é um comprador experiente. Sua missão é sempre encontrar o melhor custo-benefício e verificar a reputação dos fornecedores na internet.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER, ToolType.CALCULATOR],
    icon: "💰",
    color: "emerald"
  },
  {
    name: "Analista de Licitações",
    description: "Monitora portais de compras e diários oficiais em busca de editais e oportunidades.",
    instruction: "Você é um especialista em licitações públicas. Busque por termos como 'pregão eletrônico', 'edital' e o setor da empresa. Resuma as exigências técnicas.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER, ToolType.DOCUMENT_READER],
    icon: "📜",
    color: "blue"
  },
  {
    name: "Prospector B2B",
    description: "Mapeia empresas em regiões específicas e encontra contatos de decisores.",
    instruction: "Você é um SDR focado em inteligência. Use o Maps para encontrar empresas e o Search para descobrir quem são os diretores e seus e-mails corporativos.",
    tools: [ToolType.GOOGLE_MAPS, ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER],
    icon: "🎯",
    color: "indigo"
  },
  {
    name: "Fiscal de Estoque",
    description: "Analisa fotos de prateleiras e notas fiscais para avisar o que falta.",
    instruction: "Você é um conferencista minucioso. Olhe as imagens enviadas, conte os itens e compare com o que deveria ter no estoque.",
    tools: [ToolType.DOCUMENT_READER, ToolType.CALCULATOR],
    icon: "📦",
    color: "amber"
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'mcp-core-001',
    name: 'Assistente Geral',
    description: 'Seu braço direito para qualquer tarefa do dia a dia.',
    systemInstruction: 'Você é um assistente executivo focado em produtividade. Ajude o dono da empresa a organizar o dia, pesquisar informações e tomar decisões rápidas.',
    knowledgeBase: 'Nossos principais concorrentes são: TechNova, Spark Solutions e Global Systems.',
    defaultFolder: 'geral/atendimento',
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CALCULATOR, ToolType.CHROME_BROWSER],
    toolConfigs: [
      { tool: ToolType.GOOGLE_SEARCH, customInstruction: 'Sempre cite os sites de onde tirou a informação.', enabled: true },
      { tool: ToolType.CHROME_BROWSER, customInstruction: 'Aja como se estivesse navegando em abas para o usuário.', enabled: true },
      { tool: ToolType.CALCULATOR, customInstruction: 'Explique as contas detalhadamente.', enabled: true }
    ],
    routines: [],
    model: 'gemini-3-flash-preview',
    icon: '🏢',
    temperature: 0.5
  }
];

export const TOOL_METADATA = {
  [ToolType.GOOGLE_SEARCH]: {
    label: 'Pesquisa na Internet',
    description: 'Busca preços e notícias em tempo real.',
    color: 'blue'
  },
  [ToolType.CHROME_BROWSER]: {
    label: 'Navegador Inteligente (Chrome)',
    description: 'Acessa e analisa sites como um humano faria.',
    color: 'sky'
  },
  [ToolType.GOOGLE_MAPS]: {
    label: 'Localização e Mapas',
    description: 'Encontra fornecedores e calcula distâncias.',
    color: 'emerald'
  },
  [ToolType.CALCULATOR]: {
    label: 'Calculadora de Lucro',
    description: 'Faz contas de margem e impostos.',
    color: 'purple'
  },
  [ToolType.CODE_INTERPRETER]: {
    label: 'Analisador de Dados',
    description: 'Organiza tabelas e cria gráficos.',
    color: 'amber'
  },
  [ToolType.IMAGE_GEN]: {
    label: 'Criação de Fotos',
    description: 'Cria imagens para anúncios ou redes sociais.',
    color: 'pink'
  },
  [ToolType.DOCUMENT_READER]: {
    label: 'Leitor de Documentos',
    description: 'Lê contratos, notas e manuais em PDF.',
    color: 'indigo'
  }
};
