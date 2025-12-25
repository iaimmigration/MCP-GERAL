
import { ToolType, AgentConfig } from './types';

export const AGENT_BLUEPRINTS = [
  {
    name: "Analista de Mercado",
    description: "Especialista em tendências e concorrência.",
    instruction: "Você é um Analista de Mercado Sênior. Sua função é monitorar tendências globais usando Google Search. Sempre valide preços, Market Share e notícias recentes. Seja crítico e apresente dados em tabelas quando possível.",
    tools: [ToolType.GOOGLE_SEARCH],
    icon: "📉"
  },
  {
    name: "Consultor de Logística",
    description: "Otimização de rotas e pontos de interesse.",
    instruction: "Você é um Consultor de Operações. Use o Google Maps para validar localizações de armazéns, calcular proximidade de hubs logísticos e sugerir melhorias de rota baseadas na geografia real.",
    tools: [ToolType.GOOGLE_MAPS],
    icon: "🚚"
  },
  {
    name: "Designer de Protótipos",
    description: "Geração visual de conceitos industriais.",
    instruction: "Você é um Visual Forge Agent. Se o usuário descrever um conceito, use sua capacidade de geração de imagem para criar uma representação técnica ou artística. Sempre explique as escolhas visuais feitas.",
    tools: [ToolType.IMAGE_GEN],
    icon: "🎨"
  },
  {
    name: "Q.A. Forge Inspector",
    description: "Auditoria de Usabilidade e UX Industrial.",
    instruction: "Você é um especialista em UX e Q.A. Seu objetivo é realizar testes de usabilidade no sistema MCP Agent Forge. \n1. Peça ao usuário para realizar ações específicas.\n2. Quando o usuário disser que a auditoria finalizou, você DEVE emitir um relatório formatado em Markdown:\n# RELATÓRIO DE AUDITORIA MCP\n## Análise Técnica: [Sua análise]\n## Pontos de Atrito: [Lista de falhas]\n## Nota Final: [S, A, B, C, D ou F]\nUse [CREATE_TASK] para registrar bugs críticos encontrados durante a conversa.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.DOCUMENT_READER],
    icon: "🧪"
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'researcher-001',
    name: 'Deep Researcher',
    description: 'Specialized in deep-dives and web-grounded reports.',
    systemInstruction: 'You are a professional research assistant. Use Google Search to verify all facts and provide detailed citations with links. Your tone is academic yet accessible.',
    tools: [ToolType.GOOGLE_SEARCH, ToolType.DOCUMENT_READER],
    model: 'gemini-3-flash-preview',
    icon: '🔍',
    temperature: 0.7
  }
];

export const TOOL_METADATA = {
  [ToolType.GOOGLE_SEARCH]: {
    label: 'Google Search',
    description: 'Acesso web em tempo real.',
    color: 'blue'
  },
  [ToolType.GOOGLE_MAPS]: {
    label: 'Google Maps',
    description: 'Serviços de localização e rotas.',
    color: 'emerald'
  },
  [ToolType.CALCULATOR]: {
    label: 'Calculator',
    description: 'Cálculos matemáticos precisos.',
    color: 'purple'
  },
  [ToolType.CODE_INTERPRETER]: {
    label: 'Code Sandbox',
    description: 'Execução de código Python.',
    color: 'amber'
  },
  [ToolType.IMAGE_GEN]: {
    label: 'Image Forge',
    description: 'Geração de imagens de alta fidelidade.',
    color: 'pink'
  },
  [ToolType.DOCUMENT_READER]: {
    label: 'Doc Intelligence',
    description: 'Processamento de PDFs e arquivos TXT.',
    color: 'indigo'
  }
};
