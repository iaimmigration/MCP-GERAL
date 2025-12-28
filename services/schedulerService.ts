import { useForgeStore } from '../store';
// Add missing import for AgentConfig type
import { AgentConfig } from '../types';

let schedulerInterval: number | null = null;
let isJobRunning = false;

/**
 * MCP Heartbeat Kernel
 * Monitora todos os Workers e suas rotinas a cada 30 segundos.
 * Se o tempo de 'nextRun' já passou, dispara o job.
 */
export const startAutonomousScheduler = () => {
  if (schedulerInterval) return;

  console.log("[HEARTBEAT] Iniciando monitoramento proativo de força de trabalho...");
  
  schedulerInterval = window.setInterval(async () => {
    if (isJobRunning) return; // Evita sobreposição de jobs pesados

    const { agents, triggerRoutine } = useForgeStore.getState();
    const now = Date.now();

    // Fix: Explicitly cast agent objects to AgentConfig to avoid 'unknown' type errors during routine processing
    const agentsList = Object.values(agents) as AgentConfig[];

    for (const agent of agentsList) {
      if (!agent.routines) continue;

      for (const routine of agent.routines) {
        if (routine.enabled && routine.nextRun && now >= routine.nextRun) {
          isJobRunning = true;
          try {
            await triggerRoutine(agent.id, routine.id);
          } catch (e) {
            console.error(`[SCHEDULER] Falha ao disparar ${routine.name}:`, e);
          } finally {
            isJobRunning = false;
          }
        }
      }
    }
  }, 30000); // 30 segundos de heartbeat
};

export const stopAutonomousScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};