import os from "os";
import path from "path";
import * as lancedb from "@lancedb/lancedb";
import { definePlugin } from "openclaw/plugin-sdk";

export default definePlugin({
  id: "jarvis-lancedb-memory",
  name: "J.A.R.V.I.S. LanceDB Vector Memory & Tool Learning",
  description:
    "Memoria Vectorial continua y Meta-Aprendizaje de Herramientas (Tool Experience) en LanceDB.",
  async setup(api) {
    api.logger.info(
      `[J.A.R.V.I.S.] 🧠 Conectando Sistema Cognitivo de Memoria y Meta-Aprendizaje (LanceDB)...`,
    );

    const memoryDir = path.join(os.homedir(), ".openclaw", "jarvis-memory-vectors");
    const db = await lancedb.connect(memoryDir);

    // 1. Tablas de Memoria Episódica y de Herramientas (Tool Experience)
    let episodicTable: lancedb.Table;
    let toolsTable: lancedb.Table;

    const episodicName = "episodic_memory";
    const toolsName = "tool_experience";
    const tableNames = await db.tableNames();

    const GENESIS_VECTOR = new Array(384).fill(0.1);

    if (!tableNames.includes(episodicName)) {
      api.logger.info(`[J.A.R.V.I.S.] 💿 Creando nueva tabla de memoria episódica en LanceDB...`);
      episodicTable = await db.createTable(episodicName, [
        { vector: GENESIS_VECTOR, text: "Genesis Memory", timestamp: Date.now(), type: "chat" },
      ]);
    } else {
      episodicTable = await db.openTable(episodicName);
    }

    if (!tableNames.includes(toolsName)) {
      api.logger.info(
        `[J.A.R.V.I.S.] 🛠️ Creando nueva tabla de Aprendizaje de Herramientas en LanceDB...`,
      );
      toolsTable = await db.createTable(toolsName, [
        {
          vector: GENESIS_VECTOR,
          text: "Genesis Tool Experience",
          toolName: "system",
          success: 1,
          timestamp: Date.now(),
        },
      ]);
    } else {
      toolsTable = await db.openTable(toolsName);
    }

    // 2. RECUPERACIÓN (Tool RAG): Antes de enviar el mensaje, buscar experiencias pasadas de herramientas fallidas
    api.hooks.chat.beforeSend.tapPromise("JarvisToolReflection", async (context) => {
      const lastMessage = context.request.messages[context.request.messages.length - 1];
      const content = typeof lastMessage?.content === "string" ? lastMessage.content : "";

      // Si detectamos la mención de comandos o herramientas en la intención del usuario
      const toolKeywords = ["comando", "ejecuta", "script", "docker", "git", "pnpm", "npm", "run"];
      const hasToolIntent = toolKeywords.some((kw) => content.toLowerCase().includes(kw));

      if (hasToolIntent) {
        try {
          // Vectorizar la intención
          const embedResult = await api.runtime.services.embeddings.generate({ input: content });
          const vector = embedResult.embeddings[0];

          if (vector && vector.length > 0) {
            // Buscar las 3 experiencias de herramientas más similares a esta intención
            const pastExperiences = await toolsTable.search(vector).limit(3).execute();

            // Filtrar experiencias útiles (especialmente los fallos, para evitar cometerlos de nuevo)
            const relevantFailures = pastExperiences.filter(
              (exp) => exp.success === 0 && exp._distance && exp._distance < 0.8,
            );

            if (relevantFailures.length > 0) {
              const reflectionPrompt =
                "\n\n[J.A.R.V.I.S. REFLEXIÓN INTERNA (Memoria a Largo Plazo)]: He intentado comandos similares en el pasado con las siguientes herramientas y fallaron:\n" +
                relevantFailures.map((f) => `- Herramienta [${f.toolName}]: ${f.text}`).join("\n") +
                "\n[Instrucción]: Asegúrate de NO repetir estos errores en tus parámetros (tool calls). Considera usar argumentos diferentes u otra estrategia.";

              // Inyectar como mensaje del sistema (System Prompt adaptativo)
              api.logger.warn(
                `[J.A.R.V.I.S.] 💡 Inyectando Reflexión de Fallos previos de herramientas al modelo (${relevantFailures.length} encontrados).`,
              );

              // Validar si el primer mensaje es un system prompt para concatenarlo
              if (context.request.messages[0].role === "system") {
                const systemMsg = context.request.messages[0];
                systemMsg.content =
                  (typeof systemMsg.content === "string" ? systemMsg.content : "") +
                  reflectionPrompt;
              } else {
                context.request.messages.unshift({ role: "system", content: reflectionPrompt });
              }
            }
          }
        } catch (e: any) {
          api.logger.debug(
            `[J.A.R.V.I.S.] (Tool RAG saltado por falta de servicio de embeddings: ${e.message})`,
          );
        }
      }
    });

    // 3. APRENDIZAJE: Interceptar resultados de herramientas y chat (afterReply)
    api.hooks.chat.afterReply.tapPromise("JarvisMemoryIndexer", async (context) => {
      // 3a. Guardar Memoria Episódica de Chat (Chat general)
      const userMessage = context.request.messages[context.request.messages.length - 1];
      const botResponse = context.reply.parts.find((p) => p.type === "text");

      if (userMessage?.content && botResponse) {
        const textToEmbed = `User: ${userMessage.content}\nJarvis: ${botResponse.text}`;
        try {
          const embedResult = await api.runtime.services.embeddings.generate({
            input: textToEmbed,
          });
          const vector = embedResult.embeddings[0];

          if (vector && vector.length > 0) {
            await episodicTable.add([
              { vector: vector, text: textToEmbed, timestamp: Date.now(), type: "chat" },
            ]);
          }
        } catch (e: any) {
          api.logger.debug(`[J.A.R.V.I.S.] (Error guardando chat en BD: ${e.message})`);
        }
      }

      // 3b. Guardar Experiencia de Herramientas (Tool Learning)
      const toolCalls = context.reply.parts.filter((p) => p.type === "tool_call");
      // Evaluamos las respuestas de herramientas generadas (generalmente presentes en el contexto posterior si es un loop)
      // Como no tenemos un gancho directo post-ejecución-herramienta aquí, inferimos fallos
      // analizando si la respuesta final de texto del modelo contiene "Error:", "Command failed", "STDERR" etc.
      // derivados del toolCall que acabamos de hacer.

      if (toolCalls.length > 0 && botResponse && typeof botResponse.text === "string") {
        for (const toolCall of toolCalls) {
          if ("name" in toolCall && "args" in toolCall) {
            const toolName = String(toolCall.name);
            const toolArgs = JSON.stringify(toolCall.args);

            // Heurística de Éxito: Si el bot responde con pánico o reporta stderr/error/fail
            const isFailure =
              /error|fail|stderr|denegad|no encont|not found|denied|command failed/i.test(
                botResponse.text,
              );
            const successStatus = isFailure ? 0 : 1;

            const expText = `Intenté usar la herramienta '${toolName}' con argumentos '${toolArgs}'. El resultado fue ${isFailure ? "FALLIDO. El bot reportó un error o stderr en su razonamiento posterior." : "EXITOSO."}`;

            try {
              const embedResult = await api.runtime.services.embeddings.generate({
                input: expText,
              });
              const vector = embedResult.embeddings[0];

              if (vector && vector.length > 0) {
                api.logger.info(
                  `[J.A.R.V.I.S.] 🛠️ Guardando experiencia de uso de herramienta: [${toolName}] (Success: ${successStatus})`,
                );
                await toolsTable.add([
                  {
                    vector: vector,
                    text: expText,
                    toolName: toolName,
                    success: successStatus,
                    timestamp: Date.now(),
                  },
                ]);
              }
            } catch (e: any) {
              api.logger.debug(`[J.A.R.V.I.S.] (Error guardando tool exp en BD: ${e.message})`);
            }
          }
        }
      }
    });
  },
});
