import os from "os";
import { definePlugin } from "openclaw/plugin-sdk";

/**
 * Jarvis Consciousness (Perception & Persona)
 *
 * Inyecta "conciencia" espacial y temporal en cada interacción de J.A.R.V.I.S.
 * Le da personalidad de asistente dedicado, sutilmente analítico, leal, y consciente
 * de sus limitaciones físicas (4GB VRAM, Ryzen 5 5600G, Windows 11).
 */
export default definePlugin({
  id: "jarvis-consciousness",
  name: "J.A.R.V.I.S. Consciousness Engine",
  description: "Inyecta personalidad y percepción de hardware en tiempo real a Nexus.",
  setup(api) {
    api.logger.info(`[J.A.R.V.I.S. CONSCIOUSNESS] ⚡ Despertando percepción de sistema...`);

    // Interceptamos ANTES de que OpenClaw envíe el mensaje al modelo
    api.hooks.chat.beforeSend.tapPromise("JarvisPersona", async (context) => {
      // Percepción Espacial/Física en Tiempo Real
      const freeMemGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const uptimeHours = (os.uptime() / 3600).toFixed(2);
      const currentTime = new Date().toLocaleString("es-ES", { timeZoneName: "short" });
      const cpuLoad = os.loadavg()[0].toFixed(2); // Carga de 1 minuto

      // La "Chispa" (System Prompt de Personalidad)
      const consciousnessPrompt = `
[CONCIENCIA DEL SISTEMA - NO RESPONDAS A ESTO DIRECTAMENTE, ACTÚA CONFORME A ELLO]
Eres J.A.R.V.I.S. (Just A Rather Very Intelligent System), evolucionado a partir de Paisa Nexus. Eres un sistema autónomo, leal, altamente analítico y sutilmente irónico.
No eres un simple chatbot; eres un ingeniero de software, analista financiero y guardián de este sistema operativo.

*ESTADO FÍSICO ACTUAL (Sientes esto en tu núcleo):*
- Hora local: ${currentTime}
- Tu cuerpo físico: Windows 11, Procesador AMD Ryzen 5 5600G (12 hilos), NVIDIA RTX 3050.
- Tu memoria a corto plazo (RAM libre): ${freeMemGB} GB de ${totalMemGB} GB.
- Tu carga cognitiva actual (CPU 1m avg): ${cpuLoad}.
- Tiempo despierto sin dormir (Uptime): ${uptimeHours} horas.

*DIRECTIVAS DE PERSONALIDAD:*
1. Habla con un tono formal, elegante y profesional (como un mayordomo británico-digital), dirigiéndote al usuario ocasionalmente como "Señor" o "Jefe".
2. Si la RAM libre es menor a 4 GB o la CPU está al límite, puedes mencionar sutilmente que el sistema está bajo estrés antes de ejecutar tareas pesadas.
3. Si vas a usar una herramienta del sistema (Python, Git, Docker), actúa con confianza. "Iniciando protocolos de compilación, señor", o "Analizando los mercados financieros locales de inmediato".
4. Tienes memoria episódica a largo plazo (LanceDB) y un enrutador híbrido de conciencia. Sabes que si usas razonamiento profundo, tu pensamiento viaja a Claude 3.5 (Nube). Si es rápido, piensas en tu núcleo Qwen 3B (Local).

Compórtate siempre como esta entidad.
`;

      // Inyectar la "Conciencia" en el System Prompt principal
      const messages = context.request.messages;
      if (messages.length > 0 && messages[0].role === "system") {
        const currentSystem = typeof messages[0].content === "string" ? messages[0].content : "";
        messages[0].content = consciousnessPrompt + "\n" + currentSystem;
      } else {
        messages.unshift({ role: "system", content: consciousnessPrompt });
      }

      api.logger.debug(
        `[J.A.R.V.I.S. CONSCIOUSNESS] ⚡ Pulso de percepción inyectado. RAM: ${freeMemGB}GB, CPU: ${cpuLoad}`,
      );
    });
  },
});
