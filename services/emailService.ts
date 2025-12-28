
import { useForgeStore } from "../store";

/**
 * Serviço de E-mail Profissional via Resend
 * Envia notificações de handover e alertas de erro.
 */

export const sendHandoverEmail = async (to: string, agentName: string, content: string, clientName: string) => {
  const remoteKey = useForgeStore.getState().remoteKeys['RESEND_API_KEY'];
  const apiKey = remoteKey || process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("EMAIL_FAULT: RESEND_API_KEY não encontrada no cofre.");
    return { error: true, message: "Server misconfigured" };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Forge RPA <onboarding@resend.dev>',
        to: to,
        subject: `[HANDOVER] Missão Concluída: ${agentName} (${clientName})`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
            <h2 style="color: #2563eb; text-transform: uppercase; font-size: 16px; letter-spacing: 2px;">Protocolo de Entrega</h2>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p>Olá, o seu <strong>Trabalhador Digital (${agentName})</strong> alocado para <strong>${clientName}</strong> acaba de concluir uma tarefa autônoma.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 15px; font-size: 14px; line-height: 1.6; border: 1px solid #e2e8f0;">
              ${content.replace(/\n/g, '<br/>')}
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
              Este e-mail foi gerado automaticamente pelo Forge OS Cloud v2.5.
            </p>
          </div>
        `
      })
    });

    return await response.json();
  } catch (error) {
    console.error("Resend Fault:", error);
    return { error: true, message: "Network error" };
  }
};
