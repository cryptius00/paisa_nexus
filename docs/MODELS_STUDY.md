# Estudio de Modelos (Actualizado a Abril 2026): Optimización J.A.R.V.I.S. para 4GB VRAM

Este estudio analiza el estado del arte en Hugging Face y Ollama a fecha de **12 de abril de 2026** para determinar la configuración óptima del Enrutador Híbrido de Paisa Nexus. Se han tenido en cuenta las limitaciones físicas de tu hardware (**NVIDIA RTX 3050 - 4GB VRAM**, 32GB RAM, Ryzen 5 5600G) y las capacidades actuales de la nube.

---

## 🚨 ADVERTENCIA CRÍTICA DE ARQUITECTURA (VRAM Thrashing en Ollama) 🚨

Con **4GB de VRAM**, Ollama **NO** puede mantener dos modelos cargados en la GPU simultáneamente (Ejemplo: Un modelo de chat como `qwen2.5` y un modelo de embeddings como `nomic-embed-text`).

Si intentas chatear y vectorizar memoria al mismo tiempo, Ollama sufrirá de **"VRAM Thrashing"**: descargará el modelo de chat de la tarjeta gráfica, cargará el de embeddings en la VRAM, hará el cálculo, lo descargará, y volverá a cargar el de chat.
Este ciclo tomará entre 5 y 15 segundos **por cada mensaje**, arruinando por completo la experiencia de "Latencia Cero" que buscamos en J.A.R.V.I.S.

**LA SOLUCIÓN (Abril 2026): Separar Inferencia y Memoria**
Para mantener la RTX 3050 dedicada 100% al razonamiento rápido (Chat/Tools), debemos externalizar la creación de vectores de memoria (Embeddings) a una API ultra-rápida y barata, o forzar a Ollama a ejecutar el modelo de embeddings **exclusivamente en la CPU** (usando los 12 hilos de tu Ryzen 5 5600G), dejando la VRAM libre.

---

## 1. El Cerebro Rápido (Local - RTX 3050 4GB)

**Objetivo:** Ejecutar tareas de latencia cero, domótica, interacción por voz y _Tool Calling_ autónomo (`jarvis-os`). El modelo debe vivir permanentemente en la VRAM.

### 🏆 Ganador Absoluto (Abril 2026): `qwen2.5-coder:3b` o `qwen3.5:4b` (Cuantizado a Q4_K_M)

- **Por qué:** La familia Qwen (especialmente la versión Coder de 3B) es la reina indiscutible para tarjetas de 4GB de VRAM.
- **Tool Calling:** Tiene un entendimiento nativo excepcional para generar JSON y llamar herramientas, perfecto para el plugin `jarvis-os`.
- **Eficiencia:** Ocupa aproximadamente 2.1 GB de VRAM. Si configuras `keep_alive: -1` en Ollama, el modelo nunca se descargará, respondiendo a tus comandos de sistema instantáneamente.

---

## 2. El Índice Vectorial (Embeddings para LanceDB)

**Objetivo:** Vectorizar texto para la memoria episódica (`jarvis-memory`) sin interrumpir al "Cerebro Rápido" en la GPU.

### 🏆 Opción A (Recomendada): Cloud Embeddings (`text-embedding-3-small` de OpenAI o Cloudflare AI)

- **Por qué:** Al delegar los embeddings a la nube, tu RTX 3050 nunca tiene que descargar a `qwen`. El costo de la API de embeddings de OpenAI o Cloudflare es literalmente de fracciones de centavo por cada millón de tokens. Es la opción más arquitectónicamente limpia para sistemas con 4GB de VRAM.

### 🥈 Opción B (100% Local / Ryzen 5): `nomic-embed-text` (Forzado a CPU)

- **Por qué:** Si exiges privacidad total, puedes correr una **segunda instancia** de Ollama (o usar `llama.cpp` crudo) configurada con `OLLAMA_NUM_GPU=0` (o equivalente) solo para los embeddings. Esto forzará al Ryzen 5 5600G a calcular los vectores en la RAM del sistema, dejando la tarjeta de video intacta para `qwen`.

---

## 3. El Analista Profundo (Nube / Router Fallback)

**Objetivo:** Programación arquitectónica profunda y refactorización masiva de código delegado vía API.

### 🏆 Ganadores (Código y Razonamiento Lógico - Abril 2026):

1.  **`claude-3.5-sonnet` (Anthropic):** Sigue siendo el "estándar de oro" para los desarrolladores. Su capacidad para leer un archivo entero, entender la arquitectura y escribir un parche funcional sin dañar el código circundante es inigualable en el día a día.
2.  **`gemini-3-pro-preview` (Google):** Lidera algunas tablas de codificación ofreciendo una ventana de contexto masiva (hasta 2 millones de tokens).
3.  **`deepseek-v3.2-exp` / `qwen3-coder-480b`:** Opciones open-weights gigantescas hosteadas en la nube con "thinking mode" (razonamiento avanzado estilo o1) que están revolucionando la programación autónoma a un costo bajísimo.

---

## 📝 Topología Final Recomendada (openclaw.json)

1.  **Model.Local:** Ollama -> `qwen2.5-coder:3b` (Vive en la RTX 3050, responde al instante).
2.  **Model.Embeddings:** OpenAI -> `text-embedding-3-small` (Libera la VRAM, coste casi cero).
3.  **Model.Cloud:** Anthropic -> `claude-3.5-sonnet` (Usado solo cuando `jarvis-router` detecta prompts de programación complejos).
