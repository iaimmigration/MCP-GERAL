
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { AgentConfig, ToolType, ChatMessage, MessageAttachment } from "../types";

// Helper for decoding base64 strings to Uint8Array
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper for decoding raw PCM audio data from the Gemini API
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const executeAgentActionStream = async (
  agent: AgentConfig,
  userMessage: string,
  history: ChatMessage[],
  attachments: MessageAttachment[] = [],
  onChunk: (text: string, grounding?: { uri: string; title: string }[], thought?: string, images?: string[]) => void,
  onLog?: (message: string, level: 'debug' | 'info' | 'warn' | 'error' | 'success') => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let effectiveModel = agent.model;
  const tools: any[] = [];
  const hasMaps = agent.tools.includes(ToolType.GOOGLE_MAPS);

  // Gemini 2.5 series is required for Maps grounding
  if (hasMaps) {
    effectiveModel = 'gemini-2.5-flash';
  }

  onLog?.(`Iniciando kernel para agente: ${agent.name} (Modelo: ${effectiveModel})`, 'info');
  
  if (agent.tools.includes(ToolType.GOOGLE_SEARCH)) {
    tools.push({ googleSearch: {} });
    onLog?.("Módulo Google Search ativado.", 'debug');
  }

  if (hasMaps) {
    // googleMaps can only be used with googleSearch, not other tools like code interpreter.
    tools.push({ googleMaps: {} });
    onLog?.("Módulo Google Maps ativado.", 'debug');
  } else if (agent.tools.includes(ToolType.CODE_INTERPRETER)) {
    tools.push({ codeExecution: {} });
    onLog?.("Sandbox de execução de código ativada.", 'debug');
  }

  const systemPrompt = `
    INSTRUÇÃO MESTRA: ${agent.systemInstruction}
    
    BASE DE CONHECIMENTO PROPRIETÁRIA:
    ${agent.knowledgeBase || 'Nenhuma informação proprietária fornecida.'}

    ${agent.tools.includes(ToolType.IMAGE_GEN) ? 'Você pode gerar imagens descrevendo-as detalhadamente.' : ''}
    ${agent.tools.includes(ToolType.DOCUMENT_READER) ? 'Você tem capacidade multimodal: pode ler arquivos PDF e TXT anexados.' : ''}

    PROTOCOLO DE RESILIÊNCIA E INTERVENÇÃO HUMANA (PHI):
    1. Se encontrar um bloqueio (CAPTCHA, etc), use: [HUMAN_INTERVENTION_REQUIRED] e explique o que precisa.

    PROTOCOLO DE GESTÃO DE TAREFAS (LEAD):
    1. Você pode criar lembretes de ação ou tarefas para o operador.
    2. Para criar uma tarefa, use o formato: [CREATE_TASK: Título da Tarefa | Prioridade (low/medium/high) | Data (YYYY-MM-DD)]
    3. Use isso para registrar bugs identificados ou follow-ups.
  `;

  const contents = history
    .filter(msg => !msg.isStreaming)
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.content },
        ...(msg.attachments || []).map(at => ({
          inlineData: { data: at.data, mimeType: at.mimeType }
        }))
      ]
    }));
  
  const currentMessageParts: any[] = [{ text: userMessage }];
  attachments.forEach(at => {
    onLog?.(`Processando anexo: ${at.name} (${at.mimeType})`, 'debug');
    currentMessageParts.push({
      inlineData: { data: at.data, mimeType: at.mimeType }
    });
  });

  contents.push({
    role: 'user',
    parts: currentMessageParts
  });

  const config: any = {
    systemInstruction: systemPrompt,
    tools: tools.length > 0 ? tools : undefined,
    temperature: agent.temperature ?? 0.7,
  };

  if (agent.thinkingBudget !== undefined && agent.thinkingBudget > 0 && !hasMaps) {
    config.thinkingConfig = { thinkingBudget: agent.thinkingBudget };
    onLog?.(`Budget de reflexão configurado: ${agent.thinkingBudget} tokens.`, 'debug');
  }

  try {
    onLog?.("Enviando payload para API Gemini...", 'info');
    const responseStream = await ai.models.generateContentStream({
      model: effectiveModel,
      contents: contents,
      config: config,
    });

    let fullText = "";
    let fullThought = "";
    let chunkCount = 0;
    const accumulatedGrounding: { uri: string; title: string }[] = [];

    for await (const chunk of responseStream) {
      chunkCount++;
      const textChunk = chunk.text;
      if (textChunk) {
        fullText += textChunk;
        if (chunkCount === 1) onLog?.("Primeiro chunk de resposta recebido.", 'success');
      }
      
      const thoughtPart = (chunk as any).candidates?.[0]?.content?.parts?.find((p: any) => p.thought)?.thought;
      if (thoughtPart) {
        fullThought += thoughtPart;
      }

      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        metadata.groundingChunks.forEach((c: any) => {
          if (c.web) {
            const exists = accumulatedGrounding.some(g => g.uri === c.web.uri);
            if (!exists) {
              accumulatedGrounding.push({ uri: c.web.uri, title: c.web.title });
            }
          }
          if (c.maps) {
            const exists = accumulatedGrounding.some(g => g.uri === c.maps.uri);
            if (!exists) {
              accumulatedGrounding.push({ uri: c.maps.uri, title: c.maps.title });
            }
          }
        });
      }

      onChunk(
        fullText, 
        accumulatedGrounding.length > 0 ? [...accumulatedGrounding] : undefined, 
        fullThought || undefined
      );
    }

    onLog?.(`Stream finalizado com sucesso. Chunks totais: ${chunkCount}`, 'success');

    if (agent.tools.includes(ToolType.IMAGE_GEN) && (fullText.toLowerCase().includes("gerar imagem") || fullText.toLowerCase().includes("desenhe"))) {
      onLog?.("Detectada solicitação de geração de imagem. Ativando engine secundária.", 'info');
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `High-fidelity industrial visualization: ${fullText}` }] }],
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      let generatedImages: string[] = [];
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImages.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
        }
      }
      onChunk(fullText, accumulatedGrounding, fullThought, generatedImages);
    }

  } catch (error: any) {
    onLog?.(`ERRO DE KERNEL: ${error.message || 'Desconhecido'}`, 'error');
    console.error("Agent Execution Failed:", error);
    throw error;
  }
};

export const generateSmartTitle = async (messages: ChatMessage[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const conversationContext = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [{ 
          text: `Resuma esta conversa em um título técnico e curto (máximo 4 palavras) para uma aba de sistema operacional industrial. Retorne APENAS o título, sem aspas ou pontos finais.\n\nContexto:\n${conversationContext}` 
        }] 
      }]
    });
    return response.text?.trim() || "Nova Conversa";
  } catch (e) {
    return "Conversa MCP";
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text.slice(0, 1000) }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
