
import { ToolType, AgentConfig } from './types';

export const PRICING_MULTIPLIER = 20;

// Configurações de Infraestrutura - SEMPRE USAR PROCESS.ENV EM PRODUÇÃO
export const BROWSERLESS_URL = process.env.BROWSERLESS_URL || 'wss://chrome.browserless.io?token=TOKEN_MISSING';
export const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY || '';

export const AGENT_BLUEPRINTS = [
  {
    id: 'worker-finance-001',
    name: "CFO Digital",
    specialty: "Gestão Financeira",
    description: "Especialista em fluxo de caixa, monitoramento de markup e refill automático de infraestrutura.",
    instruction: "Aja como um Diretor Financeiro (CFO) autônomo. Sua missão é garantir que a operação nunca pare por falta de saldo.",
    tools: [ToolType.FINANCIAL_CONTROLLER, ToolType.CALCULATOR],
    icon: "🏦",
    model: 'gemini-3-pro-preview',
    salary_label: "$80/mês base"
  },
  {
    id: 'worker-sales-002',
    name: "SDR Autônomo",
    specialty: "Vendas B2B",
    description: "Extração de leads, qualificação automática e agendamento de reuniões via e-mail.",
    instruction: "Você é um SDR de alta performance. Encontre decisores e dispare propostas via e-mail de handover.",
    tools: [ToolType.SELENIUM_AUTOMATION, ToolType.GOOGLE_SEARCH, ToolType.GOOGLE_MAPS],
    icon: "🎯",
    model: 'gemini-3-pro-preview',
    salary_label: "$120/mês base"
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'mcp-finance-001',
    name: 'Kernel CFO (SaaS Core)',
    specialty: 'Kernel Financeiro',
    allocationTarget: 'Infra Interna',
    description: 'Controlador Geral da sua conta Forge.',
    systemInstruction: 'Sua prioridade é a saúde financeira da conta do usuário.',
    tools: [ToolType.FINANCIAL_CONTROLLER],
    routines: [],
    variables: [],
    // Adicionando propriedades obrigatórias da interface AgentConfig para evitar erro de tipo
    credentials: [],
    targetSites: [],
    knowledgeBase: [],
    model: 'gemini-3-pro-preview',
    icon: '🏦',
    status: 'idle',
    handover: { email: '', autoExportCsv: true },
    temperature: 0.1
  }
];

export const TOOL_METADATA = {
  [ToolType.GOOGLE_SEARCH]: { label: 'Intelligence Web', color: 'blue' },
  [ToolType.SELENIUM_AUTOMATION]: { label: 'RPA Engine', color: 'slate' },
  [ToolType.CHROME_BROWSER]: { label: 'DOM Vision', color: 'sky' },
  [ToolType.CAPTCHA_SOLVER]: { label: 'Bypass Pro', color: 'red' },
  [ToolType.FINANCIAL_CONTROLLER]: { label: 'Profit Guard', color: 'emerald' },
  [ToolType.DOCUMENT_READER]: { label: 'OCR Vision', color: 'indigo' }
};
