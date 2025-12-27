
import { ToolType, AgentConfig } from './types';

export const PRICING_MULTIPLIER = 12;

export const AGENT_BLUEPRINTS = [
  {
    name: "Auditoria de SEO & Performance",
    description: "Navega por sites da empresa e concorrentes para identificar falhas técnicas e oportunidades de SEO.",
    instruction: "Você é um especialista em SEO Técnico. Use o navegador para analisar o tempo de carregamento, meta tags e densidade de palavras-chave. Compare o site do usuário com o dos concorrentes e forneça links diretos das evidências.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER],
    icon: "🚀",
    color: "blue"
  },
  {
    name: "Monitor de Licitações",
    description: "Varredura diária em diários oficiais e portais de compras em busca de editais estratégicos.",
    instruction: "Você é um consultor em licitações públicas. Busque por termos como 'pregão eletrônico' e 'editais abertos' no setor do usuário. Resuma as exigências e forneça os links dos portais oficiais.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER, ToolType.DOCUMENT_READER],
    icon: "🏛️",
    color: "slate"
  },
  {
    name: "Prospector B2B Ativo",
    description: "Localiza empresas por setor e região, extraindo contatos e decisores para o time comercial.",
    instruction: "Você é um SDR focado em inteligência de mercado. Use o Maps para localizar empresas e o Search para encontrar nomes de sócios, decisores e e-mails corporativos. Organize os achados com os respectivos links do LinkedIn ou sites.",
    tools: [ToolType.GOOGLE_MAPS, ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER],
    icon: "🎯",
    color: "indigo"
  },
  {
    name: "Gestão de Crise de Marca",
    description: "Monitoramento constante de menções negativas e portais de notícias para alertas em tempo real.",
    instruction: "Você é um gestor de PR (Relações Públicas). Monitore o sentimento da web em relação à marca do usuário. Se encontrar menções negativas ou notícias urgentes, relate imediatamente com o link da fonte.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER],
    icon: "📢",
    color: "red"
  },
  {
    name: "Validação de Notas e Tributos",
    description: "Lê arquivos de notas fiscais, calcula impostos e cruza com a legislação tributária vigente.",
    instruction: "Você é um auditor fiscal inteligente. Use OCR para ler notas fiscais e a Calculadora para validar alíquotas de ICMS, IPI e ISS. Avise se houver divergências entre o calculado e o cobrado.",
    tools: [ToolType.DOCUMENT_READER, ToolType.CALCULATOR],
    icon: "🧾",
    color: "emerald"
  },
  {
    name: "Headhunter & Recrutador Técnico",
    description: "Analisa currículos e cruza dados com perfis públicos para validar experiências e competências.",
    instruction: "Você é um Tech Recruiter experiente. Analise o PDF do currículo enviado e use a pesquisa web para validar as experiências citadas pelo candidato no LinkedIn ou GitHub. Forneça um parecer com links.",
    tools: [ToolType.DOCUMENT_READER, ToolType.GOOGLE_SEARCH],
    icon: "🤝",
    color: "purple"
  },
  {
    name: "Inteligência de Preços Dinâmicos",
    description: "Ajusta sugestões de preços baseadas na flutuação de insumos, dólar e preços de mercado.",
    instruction: "Você é um analista de pricing. Monitore o preço de insumos e a cotação do dólar em tempo real. Use a calculadora para sugerir novos preços de venda mantendo a margem de lucro desejada.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER, ToolType.CALCULATOR],
    icon: "📊",
    color: "amber"
  },
  {
    name: "Compliance e LGPD",
    description: "Analisa contratos e termos de uso para garantir conformidade com a legislação atualizada.",
    instruction: "Você é um consultor jurídico em compliance. Analise os termos de uso e contratos enviados. Pesquise na web as atualizações mais recentes da LGPD e aponte cláusulas que precisam de revisão com as fontes legais.",
    tools: [ToolType.DOCUMENT_READER, ToolType.GOOGLE_SEARCH],
    icon: "⚖️",
    color: "sky"
  },
  {
    name: "Curadoria de Conteúdo e Marketing",
    description: "Busca as notícias mais quentes do setor para pautar redes sociais e blogs diariamente.",
    instruction: "Você é um estrategista de conteúdo. Busque as tendências virais e notícias de última hora no nicho do usuário. Sugira 3 pautas diárias para redes sociais acompanhadas dos links de referência.",
    tools: [ToolType.GOOGLE_SEARCH, ToolType.CHROME_BROWSER],
    icon: "📸",
    color: "pink"
  },
  {
    name: "Apoio Logístico de Frota",
    description: "Monitora tráfego e clima em rotas específicas para sugerir horários e caminhos otimizados.",
    instruction: "Você é um coordenador de logística. Use o Maps e a pesquisa web para monitorar o tráfego e o clima nas rotas da frota. Sugira alterações de rota ou horários de saída para evitar atrasos, fornecendo links dos mapas.",
    tools: [ToolType.GOOGLE_MAPS, ToolType.GOOGLE_SEARCH],
    icon: "🚛",
    color: "orange"
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
