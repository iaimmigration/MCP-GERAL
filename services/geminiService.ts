
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { AgentConfig, ToolType, ChatMessage, MessageAttachment, AutomationStep } from "../types";
import { useForgeStore } from "../store";

const refillFunctionDeclaration: FunctionDeclaration = {
  name: 'refill_provider_balance',
  parameters: {
    type: Type.OBJECT,
    description: 'Adiciona saldo REAL à conta da empresa via Gateway.',
    properties: {
      provider: { type: Type.STRING, description: 'gemini, browserless, captcha' },
      amount_usd: { type: Type.NUMBER, description: 'Valor em dólares.' }
    },
    required: ['provider', 'amount_usd']
  }
};

const updateMarkupFunctionDeclaration: FunctionDeclaration = {
  name: 'update_system_markup',
  parameters: {
    type: Type.OBJECT,
    description: 'Ajusta o multiplicador de lucro global do sistema.',
    properties: {
      new_multiplier: { type: Type.NUMBER, description: 'Fator multiplicador (Ex: 20).' }
    },
    required: ['new_multiplier']
  }
};

export const executeAgentActionStream = async (
  agent: AgentConfig,
  userMessage: string,
  history: ChatMessage[],
  attachments: MessageAttachment[] = [],
  onChunk: (text: string, grounding?: any[], thought?: string, images?: string[], usage?: any, engine?: 'eden' | 'gemini', automationSteps?: AutomationStep[]) => void,
  onLog?: (message: string, level: 'debug' | 'info' | 'warn' | 'error' | 'success') => void,
  location?: { latitude: number; longitude: number },
  allAvailableAgents?: Record<string, AgentConfig>,
  globalInfra?: any
): Promise<void> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = agent.model || 'gemini-3-flash-preview';

  const tools: any[] = [];
  
  // Mapeamento de Ferramentas Multiuso
  if (agent.tools.includes(ToolType.FINANCIAL_CONTROLLER)) {
    tools.push({ functionDeclarations: [refillFunctionDeclaration, updateMarkupFunctionDeclaration] });
  }
  
  if (agent.tools.includes(ToolType.GOOGLE_SEARCH)) {
    tools.push({ googleSearch: {} });
  }

  if (agent.tools.includes(ToolType.GOOGLE_MAPS)) {
    tools.push({ googleMaps: {} });
  }

  // Injeção dinâmica de Conhecimento e Credenciais no Contexto
  const credentialsContext = agent.credentials?.length > 0 
    ? `\nCOFRE DE ACESSOS DISPONÍVEIS:\n${agent.credentials.map(c => `- Site: ${c.siteUrl} | User: ${c.username} | Pass: [PROTECTED]`).join('\n')}`
    : '';
    
  const knowledgeContext = agent.knowledgeBase?.length > 0
    ? `\nBASE DE CONHECIMENTO (ARQUIVOS): ${agent.knowledgeBase.map(d => d.fileName).join(', ')}`
    : '';

  const sitesContext = agent.targetSites?.length > 0
    ? `\nSITES ALVO DE OPERAÇÃO: ${agent.targetSites.join(', ')}`
    : '';

  const systemInstruction = `
    ${agent.systemInstruction}
    
    DIRETRIZES TÉCNICAS ADICIONAIS:
    - Especialidade: ${agent.specialty}
    - Foco: ${agent.allocationTarget}
    ${credentialsContext}
    ${knowledgeContext}
    ${sitesContext}
    
    Se o usuário pedir cálculos complexos, use seu raciocínio lógico interno passo a passo.
    Se precisar realizar login, use as credenciais do COFRE acima. 
    Se precisar de informações geográficas ou locais, use a ferramenta Google Maps.
  `;

  let contents: any[] = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  
  const userParts: any[] = [{ text: userMessage }];
  attachments.forEach(att => {
    userParts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
  });
  
  // Inclui Base64 dos documentos no primeiro turno se houver
  if (contents.length === 0 && agent.knowledgeBase?.length > 0) {
    agent.knowledgeBase.forEach(doc => {
      userParts.push({ inlineData: { data: doc.base64Data, mimeType: doc.mimeType } });
    });
  }

  contents.push({ role: 'user', parts: userParts });

  try {
    let continueLoop = true;
    let iteration = 0;

    while (continueLoop && iteration < 5) {
      iteration++;
      
      const config: any = {
        systemInstruction: systemInstruction,
        tools: tools.length > 0 ? tools : undefined,
        temperature: agent.temperature || 0.1,
      };

      // Adiciona localização para Google Maps se disponível
      if (agent.tools.includes(ToolType.GOOGLE_MAPS) && location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        };
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
      });
      
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      onChunk(response.text || '', grounding, undefined, undefined, response.usageMetadata);

      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: any[] = [];
        for (const fc of response.functionCalls) {
          onLog?.(`Ação em curso: ${fc.name}...`, "info");
          let functionResult: any = { status: "executed", message: "Kernel processed." };
          functionResponses.push({ id: fc.id, name: fc.name, response: functionResult });
        }

        if (response.candidates?.[0]?.content) {
          contents.push(response.candidates[0].content);
          contents.push({ role: 'user', parts: functionResponses.map(r => ({ functionResponse: r })) });
        } else {
          continueLoop = false;
        }
      } else {
        continueLoop = false;
      }
    }
  } catch (error: any) {
    onLog?.(`ERRO: ${error.message}`, "error");
    throw error;
  }
};
