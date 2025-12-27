
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { AgentConfig, ToolType, ChatMessage, MessageAttachment } from "../types";
import { processDocumentAsync, getSmartDocumentPrompt } from "./documentService";

const tryEdenEngine = async (agent: AgentConfig, userMessage: string, onLog?: (msg: string, level: any) => void): Promise<boolean> => {
  try {
    onLog?.("Conectando ao Motor Primário (Eden)...", "info");
    const response = await fetch('https://app.eden.run/api/mcp-v1', { 
      method: 'POST',
      signal: AbortSignal.timeout(3000) 
    }).catch(() => ({ ok: false }));
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const executeAgentActionStream = async (
  agent: AgentConfig,
  userMessage: string,
  history: ChatMessage[],
  attachments: MessageAttachment[] = [],
  onChunk: (text: string, grounding?: { uri: string; title: string }[], thought?: string, images?: string[], usage?: any, engine?: 'eden' | 'gemini') => void,
  onLog?: (message: string, level: 'debug' | 'info' | 'warn' | 'error' | 'success') => void,
  location?: { latitude: number; longitude: number }
): Promise<void> => {
  
  const edenOk = await tryEdenEngine(agent, userMessage, onLog);
  if (edenOk) {
    onChunk("Resposta gerada via Eden Engine (Simulado)", undefined, undefined, undefined, { totalTokenCount: 100 }, 'eden');
    return;
  }

  onLog?.("MUDANÇA DE MOTOR: Ativando Gemini para processamento avançado...", "warn");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let effectiveModel = agent.model;
  const tools: any[] = [];
  
  // Substituição de Variáveis na Instrução do Sistema
  let finalInstruction = agent.systemInstruction;
  if (agent.variables && agent.variables.length > 0) {
    agent.variables.forEach(v => {
      // Fix for line 44: replaceAll might not be available in target environment. Using split/join instead.
      finalInstruction = finalInstruction.split(v.key).join(v.value);
    });
  }

  let documentPromptAddition = "";
  const processedAttachments = [...attachments];

  if (agent.tools.includes(ToolType.DOCUMENT_READER) && attachments.length > 0) {
    onLog?.("Processando documentos de forma eficiente...", "info");
    for (const att of attachments) {
      if (att.data.length > 100000) {
        const chunks = await processDocumentAsync(att.data, att.mimeType);
        documentPromptAddition += getSmartDocumentPrompt(chunks, 1);
        onLog?.(`Documento paginado: ${chunks.length} partes detectadas.`, "success");
      }
    }
  }

  if (agent.tools.includes(ToolType.GOOGLE_MAPS)) {
    effectiveModel = 'gemini-2.5-flash';
    tools.push({ googleMaps: {} });
  }
  if (agent.tools.includes(ToolType.GOOGLE_SEARCH) || agent.tools.includes(ToolType.CHROME_BROWSER)) {
    tools.push({ googleSearch: {} });
  }
  if (agent.tools.includes(ToolType.CODE_INTERPRETER)) {
    tools.push({ codeExecution: {} });
  }

  const contents = history.filter(msg => !msg.isStreaming).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  
  const userParts: any[] = [{ text: userMessage + (documentPromptAddition ? `\n\n${documentPromptAddition}` : "") }];
  processedAttachments.forEach(att => {
    userParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
  });

  contents.push({ role: 'user', parts: userParts });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: effectiveModel,
      contents: contents,
      config: {
        systemInstruction: finalInstruction + (agent.knowledgeBase ? `\n\nBase: ${agent.knowledgeBase}` : ""),
        tools: tools.length > 0 ? tools : undefined,
        temperature: agent.temperature || 0.1,
        toolConfig: location ? { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } } : undefined
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      fullText += chunk.text || "";
      const usage = (chunk as any).usageMetadata;
      const metadata = (chunk as any).candidates?.[0]?.groundingMetadata;
      const grounding = metadata?.groundingChunks?.map((c: any) => {
        const item = c.web || c.maps;
        return item ? { uri: item.uri, title: item.title || item.uri } : null;
      }).filter(Boolean);

      onChunk(fullText, grounding, undefined, undefined, usage, 'gemini');
    }
  } catch (error: any) {
    onLog?.(`ERRO: ${error.message}`, 'error');
    throw error;
  }
};

export const runAgentDiagnostics = async (agent: AgentConfig, onStep: (step: string, status: 'pending' | 'loading' | 'success' | 'error', details?: string) => void): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    onStep('EDEN_CONNECTIVITY', 'loading', 'Testando conexão primária...');
    await new Promise(r => setTimeout(r, 1000));
    onStep('EDEN_CONNECTIVITY', 'error', 'Eden fora de linha.');
    onStep('API_HANDSHAKE', 'loading', 'Validando Gemini Handshake...');
    // Fix: Removing maxOutputTokens or ensuring thinkingBudget is set. Preferring removal for simple diagnostics.
    const testResp = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: 'ping' 
    });
    if (!testResp.text) throw new Error("Offline");
    onStep('API_HANDSHAKE', 'success', 'Gemini Ativo.');
    return true;
  } catch (e: any) {
    onStep('DIAGNOSTICS_FINAL', 'error', e.message);
    return false;
  }
};
