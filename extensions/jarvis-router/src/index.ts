import { definePlugin } from "openclaw/plugin-sdk";

/**
 * Jarvis Hybrid Router (Local / Cloud)
 *
 * Intercepta los mensajes antes de ser enviados.
 * Determina heurísticamente si el prompt debe procesarse en tu GPU Local (RTX 3050 - Qwen 4b)
 * o si es complejo y requiere enviarse a la Nube (GPT-4o / Claude 3.5 Sonnet).
 */
export default definePlugin({
  id: "jarvis-hybrid-router",
  name: "J.A.R.V.I.S. Hybrid Intelligence Router",
  description: "Enruta dinámicamente tareas entre tu GPU local (RTX 3050) y la Nube.",
  setup(api) {
    api.hooks.chat.beforeSend.tapPromise("JarvisRouter", async (context) => {
      const lastMessage = context.request.messages[context.request.messages.length - 1];
      const content = typeof lastMessage?.content === "string" ? lastMessage.content : "";

      // Heurística de Complejidad Cognitiva
      const complexKeywords = [
        "function",
        "class",
        "docker",
        "refactor",
        "error",
        "bug",
        "architecture",
        "arquitectura",
        "typescript",
        "ts",
        "js",
        "html",
        "css",
        "analyze",
        "analizar",
      ];
      const contentLower = content.toLowerCase();
      const hasComplexKeywords = complexKeywords.some((keyword) => contentLower.includes(keyword));
      const isLong = content.length > 250;

      const isComplex = isLong || hasComplexKeywords;

      if (isComplex) {
        api.logger.info(
          `[J.A.R.V.I.S. Router] ☁️ Petición compleja (${content.length} chars). Enrutando a CLOUD (gpt-4o).`,
        );
        // Si tienes OpenAI configurado, delegará ahí. Si no, OpenClaw intentará el modelo.
        context.request.model = "gpt-4o";
      } else {
        api.logger.info(
          `[J.A.R.V.I.S. Router] 💻 Petición rápida detectada. Enrutando a LOCAL (qwen3.5:4b).`,
        );
        // Forzamos el modelo local de 4B parametrizado para la RTX 3050.
        context.request.model = "qwen3.5:4b";
      }
    });
  },
});
