import os from "os";
import path from "path";
import * as lancedb from "@lancedb/lancedb";
import { definePlugin } from "openclaw/plugin-sdk";

/**
 * Jarvis Episodic Memory (LanceDB Adapter)
 *
 * En lugar de datos aleatorios, invoca al API unificada de Memory de OpenClaw
 * para calcular los embeddings de texto y los persiste en una tabla LanceDB real.
 */
export default definePlugin({
  id: "jarvis-lancedb-memory",
  name: "J.A.R.V.I.S. LanceDB Vector Memory",
  description:
    "Memoria Vectorial continua, almacenando el historial con embeddings reales en disco.",
  async setup(api) {
    api.logger.info(`[J.A.R.V.I.S.] 🧠 Conectando Memoria Episódica Vectorial (LanceDB)...`);

    // 1. Inicialización de la base de datos en ~/.openclaw/jarvis-memory-vectors
    const memoryDir = path.join(os.homedir(), ".openclaw", "jarvis-memory-vectors");
    const db = await lancedb.connect(memoryDir);

    // 2. Definición/Apertura de la tabla (usando una dimensión genérica como 384, típica de nomic-embed-text)
    let table: lancedb.Table;
    const tableName = "episodic_memory";
    const tableNames = await db.tableNames();

    if (!tableNames.includes(tableName)) {
      api.logger.info(`[J.A.R.V.I.S.] 💿 Creando nueva tabla de memoria episódica en LanceDB...`);
      table = await db.createTable(tableName, [
        { vector: new Array(384).fill(0.1), text: "Genesis Memory", timestamp: Date.now() },
      ]);
    } else {
      table = await db.openTable(tableName);
    }

    // 3. Intercepción y Vectorización REAL.
    api.hooks.chat.afterReply.tapPromise("JarvisMemoryIndexer", async (context) => {
      const userMessage = context.request.messages[context.request.messages.length - 1];
      const botResponse = context.reply.parts.find((p) => p.type === "text");

      if (userMessage?.content && botResponse) {
        const textToEmbed = `User: ${userMessage.content}\nJarvis: ${botResponse.text}`;

        try {
          api.logger.debug(
            `[J.A.R.V.I.S.] 💿 Solicitando Embedding Real a OpenClaw: "${String(userMessage.content).slice(0, 30)}..."`,
          );

          // Solicitar el vector real a la infraestructura de modelos (API interna de OpenClaw)
          // Asumimos que OpenClaw provee un helper 'context.embeddings.generate(textToEmbed)'.
          // Si el proveedor no lo expone directamente en context, accedemos al infra.
          const embedResult = await api.runtime.services.embeddings.generate({
            input: textToEmbed,
          });

          // Obtener el array principal (embedding real de la GPU o Cloud)
          const vector = embedResult.embeddings[0];

          if (vector && vector.length > 0) {
            // Inserción en la base de datos vectorial local.
            await table.add([
              {
                vector: vector,
                text: textToEmbed,
                timestamp: Date.now(),
              },
            ]);
            api.logger.info(
              `[J.A.R.V.I.S.] 💿 Recuerdo guardado correctamente (Vector size: ${vector.length}).`,
            );
          }
        } catch (e: any) {
          api.logger.error(`[J.A.R.V.I.S.] ❌ Error generando embedding real: ${e.message}`);
        }
      }
    });
  },
});
