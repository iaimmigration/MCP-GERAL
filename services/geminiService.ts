
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { AgentConfig, ToolType, ChatMessage, MessageAttachment } from "../types";
import { processDocumentAsync, getSmartDocumentPrompt } from "./documentService";

export const executeAgentActionStream = async (
  agent: AgentConfig,
  userMessage: string,
  history: ChatMessage[],
  attachments: MessageAttachment[] = [],
  onChunk: (text: string, grounding?: { uri: string; title: string }[], thought?: string, images?: string[], usage?: any, engine?: 'eden' | 'gemini') => void,
  onLog?: (message: string, level: 'debug' | 'info' | 'warn' | 'error' | 'success') => void,
  location?: { latitude: number; longitude: number }
): Promise<void> => {
  
  onLog?.("Inicializando Protocolo de Alta Precisão (Gemini 3 Pro)...", "info");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let effectiveModel = 'gemini-3-pro-preview'; 
  const tools: any[] = [];
  
  // Reforço de Diretrizes e Sites Alvo
  let finalInstruction = `
[STRICT_MODE_ACTIVE]
Você é o agente "${agent.name}".
DESCRIÇÃO: ${agent.description}

DIRETRIZES DO USUÁRIO:
${agent.systemInstruction}

BASE DE CONHECIMENTO:
${agent.knowledgeBase || "Nenhuma base adicional configurada."}

${agent.targetUrls && agent.targetUrls.length > 0 ? `
SITES ALVO E PRIORITÁRIOS:
Sua tarefa deve focar PRIORITARIAMENTE nos seguintes sites ou domínios:
${agent.targetUrls.map(url => `- ${url}`).join('\n')}
Sempre que usar a ferramenta de pesquisa ou navegação, verifique primeiro estes endereços.
` : ''}

REGRAS TÉCNICAS:
1. Use as ferramentas APENAS quando necessário.
2. Seja preciso, nunca invente (alucine) fatos não encontrados nas ferramentas.
3. Priorize os sites alvo definidos acima se o usuário pedir informações específicas desses portais.
  `;

  if (agent.variables && agent.variables.length > 0) {
    agent.variables.forEach(v => {
      finalInstruction = finalInstruction.split(v.key).join(v.value);
    });
  }

  const hasMaps = agent.tools.includes(ToolType.GOOGLE_MAPS);
  const hasSearch = agent.tools.includes(ToolType.GOOGLE_SEARCH) || agent.tools.includes(ToolType.CHROME_BROWSER);
  const hasCode = agent.tools.includes(ToolType.CODE_INTERPRETER);

  if (hasMaps) {
    effectiveModel = 'gemini-2.5-flash';
    tools.push({ googleMaps: {} });
    if (hasSearch) tools.push({ googleSearch: {} });
  } else if (hasSearch) {
    tools.push({ googleSearch: {} });
  } else if (hasCode) {
    tools.push({ codeExecution: {} });
  }

  const contents = history.filter(msg => !msg.isStreaming).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: effectiveModel,
      contents: contents,
      config: {
        systemInstruction: finalInstruction,
        tools: tools.length > 0 ? tools : undefined,
        temperature: agent.temperature ?? 0.2,
        thinkingConfig: effectiveModel.includes('gemini-3') ? { 
          thinkingBudget: 16000 
        } : undefined,
        toolConfig: location ? { 
          retrievalConfig: { 
            latLng: { latitude: location.latitude, longitude: location.longitude } 
          } 
        } : undefined
      },
    });

    let fullText = "";
    let fullThought = "";

    for await (const chunk of responseStream) {
      const part = chunk.candidates?.[0]?.content?.parts?.[0];
      if (part && (part as any).thought) {
        fullThought += (part as any).thought;
      }

      fullText += chunk.text || "";
      
      const usage = (chunk as any).usageMetadata;
      const metadata = (chunk as any).candidates?.[0]?.groundingMetadata;
      const grounding = metadata?.groundingChunks?.map((c: any) => {
        const item = c.web || c.maps;
        return item ? { uri: item.uri, title: item.title || item.uri } : null;
      }).filter(Boolean);

      onChunk(fullText, grounding, fullThought, undefined, usage, 'gemini');
    }
  } catch (error: any) {
    onLog?.(`FALHA_OPERACIONAL: ${error.message}`, 'error');
    throw error;
  }
};

export const runAgentDiagnostics = async (agent: AgentConfig, onStep: (step: string, status: 'pending' | 'loading' | 'success' | 'error' | 'warn', details?: string) => void): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    onStep('API_HANDSHAKE', 'loading', 'Conectando ao núcleo Gemini 3 Pro...');
    const testResp = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: 'Olá, execute um check de integridade rápida e responda "OK".',
      config: { thinkingConfig: { thinkingBudget: 2000 } }
    });
    if (!testResp.text) throw new Error("O núcleo não respondeu ao sinal de sincronia.");
    onStep('API_HANDSHAKE', 'success', 'Conexão estável com Gemini 3 Pro.');
    return true;
  } catch (e: any) {
    onStep('API_HANDSHAKE', 'error', e.message);
    return false;
  }
};
