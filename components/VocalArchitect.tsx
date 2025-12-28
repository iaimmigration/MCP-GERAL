
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { AgentConfig } from '../types';
import AgentEditor from './AgentEditor';

// Utilitários raw PCM
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

interface VocalArchitectProps {
  currentConfig: AgentConfig;
  onUpdate: (config: Partial<AgentConfig>) => void;
  onDeploy: (config: AgentConfig) => void;
  onClose: () => void;
}

const VocalArchitect: React.FC<VocalArchitectProps> = ({ currentConfig, onUpdate, onDeploy, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'playing' | 'error'>('idle');
  const [showManualEditor, setShowManualEditor] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const speak = async (text: string) => {
    try {
      setStatus('playing');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setStatus('idle');
        source.start();
      } else {
        setStatus('idle');
      }
    } catch { setStatus('idle'); }
  };

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];
    recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
    recorder.onstop = () => processAudio(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
    recorder.start();
    setStatus('recording');
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const processAudio = async (blob: Blob) => {
    setStatus('processing');
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'audio/webm' } },
            { text: "Crie um robô especializado com base nesse áudio. Use configure_mcp_agent." }
          ]
        },
        config: {
          tools: [{ 
            functionDeclarations: [{
              name: 'configure_mcp_agent',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  specialty: { type: Type.STRING },
                  systemInstruction: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  allocationTarget: { type: Type.STRING }
                }
              }
            }] 
          }]
        }
      });

      if (result.functionCalls) {
        onUpdate(result.functionCalls[0].args as any);
        await speak(`Entendido. O robô ${result.functionCalls[0].args.name} foi rascunhado. Deseja salvar ou editar detalhes?`);
      }
      setStatus('idle');
    };
  };

  if (showManualEditor) {
    return <AgentEditor initialConfig={currentConfig} onSave={onDeploy} onCancel={() => setShowManualEditor(false)} />;
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
      <div className="bg-[#0f172a] border border-white/10 rounded-[3.5rem] p-12 w-full max-w-xl flex flex-col items-center gap-10 shadow-2xl">
        <div className="text-center space-y-2">
           <h3 className="text-white font-black text-xs uppercase tracking-[0.4em]">Vocal Architect</h3>
           <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Descreva seu novo Worker Digital</p>
        </div>

        <button 
          onMouseDown={handleStart} onMouseUp={handleStop}
          className={`w-40 h-40 rounded-full flex items-center justify-center text-5xl transition-all shadow-2xl ${
            status === 'recording' ? 'bg-red-600 scale-110 animate-pulse' : 
            status === 'processing' ? 'bg-blue-600 animate-spin-slow' :
            status === 'playing' ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700 shadow-blue-500/10'
          }`}
        >
          {status === 'recording' ? '⏹️' : status === 'processing' ? '⚙️' : status === 'playing' ? '🔊' : '🎙️'}
        </button>

        {currentConfig.name && (
          <div className="w-full bg-white/5 p-8 rounded-[2.5rem] border border-blue-500/20 flex items-center justify-between animate-in zoom-in-95">
             <div className="flex items-center gap-5">
                <span className="text-4xl">{currentConfig.icon}</span>
                <div>
                   <h4 className="text-white font-black text-sm uppercase tracking-tight">{currentConfig.name}</h4>
                   <p className="text-blue-500 text-[9px] font-bold uppercase">{currentConfig.specialty}</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setShowManualEditor(true)} className="p-3 bg-white/5 rounded-xl hover:text-white text-slate-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg>
                </button>
             </div>
          </div>
        )}

        <div className="flex gap-4 w-full">
           <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
           {currentConfig.name && (
             <button onClick={() => onDeploy(currentConfig)} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all">Implantar Robô</button>
           )}
        </div>
      </div>
    </div>
  );
};

export default VocalArchitect;
