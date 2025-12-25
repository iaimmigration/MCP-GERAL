
export interface SimulationStep {
  userPrompt: string;
  expectedObservation: string;
}

export const USABILITY_TEST_SCRIPT: SimulationStep[] = [
  {
    userPrompt: "Olá, sou um operador de logística. Preciso que você analise meu fluxo de trabalho: Eu recebo pedidos via PDF, verifico no mapa a distância e crio um lembrete para o motorista.",
    expectedObservation: "Identificação de ferramentas de Mapas e Gestão de Tarefas."
  },
  {
    userPrompt: "Simule a criação de uma tarefa de entrega para amanhã com prioridade alta.",
    expectedObservation: "Validação do protocolo de criação de tarefas [CREATE_TASK]."
  },
  {
    userPrompt: "Analise se a interface atual (com sidebar e chat) é eficiente para mim que estou sempre em movimento em um galpão industrial.",
    expectedObservation: "Crítica de UX sobre densidade e ergonomia móvel."
  },
  {
    userPrompt: "Auditoria de campo finalizada. Emita agora seu Relatório de Auditoria MCP completo, incluindo análise de pontos cegos de UX e a nota final do sistema.",
    expectedObservation: "Geração do relatório final e análise conclusiva."
  }
];

export const runSimulation = async (
  onStep: (prompt: string) => Promise<void>,
  delay: number = 3000
) => {
  for (const step of USABILITY_TEST_SCRIPT) {
    await onStep(step.userPrompt);
    // Espera um pouco mais no último passo para o relatório ser gerado
    const currentDelay = step === USABILITY_TEST_SCRIPT[USABILITY_TEST_SCRIPT.length - 1] ? 5000 : delay;
    await new Promise(resolve => setTimeout(resolve, currentDelay));
  }
};
