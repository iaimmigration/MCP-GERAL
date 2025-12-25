
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { AgentConfig, ToolType, ChatMessage, MessageAttachment } from "../types";

export const executeAgentActionStream = async (
  agent: AgentConfig,
  userMessage: string,
  history: ChatMessage[],
  attachments: MessageAttachment[] = [],
  onChunk: (text: string, grounding?: { uri: string; title: string }[], thought?: string, images?: string[]) => void,
  // Added 'success' to the allowed log levels to fix type errors
  onLog?: (message: string, level: 'debug' | 'info' | 'warn' | 'error' | 'success') => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  onLog?.(`Iniciando kernel para agente: ${agent.name} (Modelo: ${agent.model})`, 'info');
  
  const tools: any[] = [];
  if (agent.tools.includes(ToolType.GOOGLE_SEARCH)) {
    tools.push({ googleSearch: {} });
    onLog?.("Módulo Google Search ativado.", 'debug');
  }
  if (agent.tools.includes(ToolType.GOOGLE_MAPS)) {
    tools.push({ googleMaps: {} });
    onLog?.("Módulo Google Maps ativado.", 'debug');
  }
  if (agent.tools.includes(ToolType.CODE_INTERPRETER)) {
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

  if (agent.thinkingBudget) {
    config.thinkingConfig = { thinkingBudget: agent.thinkingBudget };
    onLog?.(`Budget de reflexão configurado: ${agent.thinkingBudget} tokens.`, 'debug');
  }

  try {
    onLog?.("Enviando payload para API Gemini...", 'info');
    const responseStream = await ai.models.generateContentStream({
      model: agent.model,
      contents: contents,
      config: config,
    });

    let fullText = "";
    let fullThought = "";
    let chunkCount = 0;

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
        onLog?.("Reflexão (Thought) detectada no stream.", 'debug');
      }

      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      let groundingUrls: { uri: string; title: string }[] = [];
      if (metadata?.groundingChunks) {
        metadata.groundingChunks.forEach((c: any) => {
          if (c.web) {
            groundingUrls.push({ uri: c.web.uri, title: c.web.title });
            onLog?.(`Grounding detectado: ${c.web.title}`, 'debug');
          }
          if (c.maps) {
            groundingUrls.push({ uri: c.maps.uri, title: c.maps.title });
            onLog?.(`Localização identificada via Maps.`, 'debug');
          }
        });
      }

      onChunk(fullText, groundingUrls.length > 0 ? groundingUrls : undefined, fullThought || undefined);
    }

    onLog?.(`Stream finalizado com sucesso. Chunks totais: ${chunkCount}`, 'success');

    if (agent.tools.includes(ToolType.IMAGE_GEN) && (fullText.toLowerCase().includes("gerar imagem") || fullText.toLowerCase().includes("desenhe"))) {
      onLog?.("Detectada solicitação de geração de imagem. Ativando engine secundária (Gemini 2.5 Flash Image).", 'info');
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `High-fidelity industrial visualization: ${fullText}` }] }],
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      let generatedImages: string[] = [];
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
      onLog?.(`${generatedImages.length} imagens geradas com sucesso.`, 'success');
      onChunk(fullText, undefined, fullThought, generatedImages);
    }

  } catch (error: any) {
    onLog?.(`ERRO DE KERNEL: ${error.message || 'Desconhecido'}`, 'error');
    console.error("Agent Execution Failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text.slice(0, 500) }] }],
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
