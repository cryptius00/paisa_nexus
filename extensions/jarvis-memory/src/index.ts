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

    let episodicTable: lancedb.Table;
    let toolsTable: lancedb.Table;

    const episodicName = "episodic_memory";
    const toolsName = "tool_experience";
    const tableNames = await db.tableNames();

    // Variable para retener las dimensiones reales del modelo
    let realVectorDimension = 0;

    try {
      // Obtener la dimension dinámica del modelo configurado (ej: nomic-embed-text -> 768)
      // Esto evita fallos estrictos de esquema (Dimension Mismatch) de LanceDB
      api.logger.info(`[J.A.R.V.I.S.] 🧠 Calculando dimensiones del vector base...`);
      const genesisEmbed = await api.runtime.services.embeddings.generate({
        input: "Genesis Memory",
      });
      realVectorDimension = genesisEmbed.embeddings[0].length;
      api.logger.info(
        `[J.A.R.V.I.S.] 🧠 Modelo de Embedding activo detectado con ${realVectorDimension} dimensiones.`,
      );
    } catch (e) {
      // Fallback a 768 asumiendo nomic-embed-text o mxbai-embed-large
      api.logger.warn(
        `[J.A.R.V.I.S.] ⚠️ No se pudo testear embedding al inicio. Asumiendo fallback de 768 dimensiones.`,
      );
      realVectorDimension = 768;
    }

    const GENESIS_VECTOR = new Array(realVectorDimension).fill(0.1);

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

      const toolKeywords = ["comando", "ejecuta", "script", "docker", "git", "pnpm", "npm", "run"];
      const hasToolIntent = toolKeywords.some((kw) => content.toLowerCase().includes(kw));

      if (hasToolIntent) {
        try {
          const embedResult = await api.runtime.services.embeddings.generate({ input: content });
          const vector = embedResult.embeddings[0];

          if (vector && vector.length === realVectorDimension) {
            const pastExperiences = await toolsTable.search(vector).limit(3).execute();

            const relevantFailures = pastExperiences.filter(
              (exp) => exp.success === 0 && exp._distance && exp._distance < 0.8,
            );

            if (relevantFailures.length > 0) {
              const reflectionPrompt =
                "\n\n[J.A.R.V.I.S. REFLEXIÓN INTERNA (Memoria a Largo Plazo)]: He intentado comandos similares en el pasado con las siguientes herramientas y fallaron:\n" +
                relevantFailures.map((f) => `- Herramienta [${f.toolName}]: ${f.text}`).join("\n") +
                "\n[Instrucción]: Asegúrate de NO repetir estos errores en tus parámetros (tool calls). Considera usar argumentos diferentes u otra estrategia.";

              api.logger.warn(
                `[J.A.R.V.I.S.] 💡 Inyectando Reflexión de Fallos previos de herramientas al modelo (${relevantFailures.length} encontrados).`,
              );

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
      // 3a. Guardar Memoria Episódica de Chat
      const userMessage = context.request.messages[context.request.messages.length - 1];
      const botResponse = context.reply.parts.find((p) => p.type === "text");

      if (userMessage?.content && botResponse) {
        const textToEmbed = `User: ${userMessage.content}\nJarvis: ${botResponse.text}`;
        try {
          const embedResult = await api.runtime.services.embeddings.generate({
            input: textToEmbed,
          });
          const vector = embedResult.embeddings[0];

          if (vector && vector.length === realVectorDimension) {
            await episodicTable.add([
              { vector: vector, text: textToEmbed, timestamp: Date.now(), type: "chat" },
            ]);
          } else {
            api.logger.warn(
              `[J.A.R.V.I.S.] ⚠️ Vector de diferente dimensión ignorado (Esquema estricto: ${realVectorDimension})`,
            );
          }
        } catch (e: any) {
          api.logger.debug(`[J.A.R.V.I.S.] (Error guardando chat en BD: ${e.message})`);
        }
      }

      // 3b. Guardar Experiencia de Herramientas
      const toolCalls = context.reply.parts.filter((p) => p.type === "tool_call");
      if (toolCalls.length > 0 && botResponse && typeof botResponse.text === "string") {
        for (const toolCall of toolCalls) {
          if ("name" in toolCall && "args" in toolCall) {
            const toolName = String(toolCall.name);
            const toolArgs = JSON.stringify(toolCall.args);

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

              if (vector && vector.length === realVectorDimension) {
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
