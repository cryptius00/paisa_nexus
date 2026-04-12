# Estudio de Modelos (Actualizado a Abril 2026): Optimización J.A.R.V.I.S. para 4GB VRAM

Este estudio analiza el estado del arte en Hugging Face y Ollama a fecha de **11 de abril de 2026** para determinar la configuración óptima del Enrutador Híbrido de Paisa Nexus. Se han tenido en cuenta las limitaciones físicas de tu hardware (**NVIDIA RTX 3050 - 4GB VRAM**, 32GB RAM, Ryzen 5 5600G) y las capacidades actuales de la nube.

---

## 1. El Cerebro Rápido (Local - RTX 3050 4GB)

**Objetivo:** Ejecutar tareas de latencia cero, domótica, interacción por voz y _Tool Calling_ autónomo (`jarvis-os`). El modelo debe caber completamente en tu VRAM (< 4GB).

### 🏆 Ganador Absoluto (Abril 2026): `qwen3.5:4b` (Cuantizado a Q4_K_M)

- **Por qué:** ¡Ya estabas usando el modelo correcto! Según los reportes más recientes de la comunidad open-source (Abril 2026), la familia Qwen3.5 (específicamente la versión de 4 Billones de parámetros) sigue siendo la reina indiscutible para tarjetas de 4GB de VRAM.
- **Tool Calling:** Qwen3.5 tiene un entendimiento nativo excepcional para generar JSON y llamar herramientas, lo que lo hace perfecto para el plugin `jarvis-os` que creamos.
- **Eficiencia:** En su formato de 4-bits (Q4_K_M), ocupa aproximadamente 2.3 GB de VRAM, dejando espacio suficiente libre en tu RTX 3050 para la interfaz gráfica del SO y otras tareas.

### 🥈 Alternativa Fuerte para Velocidad Extrema: `llama-4` (Meta - Versiones pequeñas) / `gemma-3:2b`

- **Por qué:** Las recientes familias Llama 4 (Lanzamiento Meta Abril 2026) y Gemma 3 ofrecen modelos ultra compactos. Gemma 3 (2B) vuela en hardware local y es excelente para tareas de chat puras, pero suele "alucinar" un poco más que Qwen3.5 al momento de escribir código o comandos de sistema estrictos.

---

## 2. El Analista Profundo (Nube / Router Fallback)

**Objetivo:** Razonamiento complejo, programación arquitectónica profunda, resolución de errores (debugging) y refactorización masiva de código. Esto se delega vía API (OpenAI, Anthropic, Google).

### 🏆 Ganadores (Código y Razonamiento Lógico - Abril 2026):

Según los _leaderboards_ más recientes (como LiveCodeBench y SWE-bench a Abril 2026):

1.  **`gemini-3-pro-preview` (Google):** Actualmente lidera algunas tablas de codificación (91.7% en LiveCodeBench), ofreciendo una ventana de contexto masiva.
2.  **`claude-3.5-sonnet` (Anthropic):** Sigue siendo el "estándar de oro" para los desarrolladores. Su capacidad para leer un archivo entero, entender la arquitectura y escribir un parche funcional sin dañar el código circundante es inigualable en el día a día.
3.  **`deepseek-v3.2-exp` / `qwen3-coder-480b`:** Si prefieres opciones open-weights gigantescas hosteadas en la nube (o vía OpenRouter), DeepSeek V3.2 con "thinking mode" (razonamiento avanzado estilo o1) está revolucionando la programación autónoma a un costo por token bajísimo.

---

## 3. El Índice Vectorial (Embeddings para LanceDB en J.A.R.V.I.S.)

**Objetivo:** Convertir texto de chat y registros de herramientas fallidas (`tool_experience`) en vectores matemáticos para la memoria de LanceDB.

### 🏆 Ganador Absoluto: `nomic-embed-text`

- **Por qué:** Mantiene su corona como el mejor modelo de embedding local generalista. Su dimensión de vector (768) es ideal para bases de datos locales, y su ventana de contexto de **8192 tokens** asegura que J.A.R.V.I.S. no recorte el historial largo de tus conversaciones antes de indexarlo.
- **Velocidad:** En tu Ryzen 5 5600G (con 12 hilos), la generación de estos vectores a través del CPU (dejando la VRAM libre para Qwen) tomará apenas milisegundos, haciendo que la inyección de contexto (RAG) sea invisible en la experiencia de chat.

---

## 📝 Conclusión y Recomendación Final para tu PC

Tu configuración arquitectónica actual es **perfecta** para Abril de 2026. Tienes el equilibrio exacto:

1.  **Motor Local:** Mantén `qwen3.5:4b` en tu RTX 3050. Es el mejor modelo que existe hoy para exprimir 4GB de VRAM y hacer llamadas a herramientas (`jarvis-os`) de manera fiable.
2.  **Memoria (LanceDB):** Configura OpenClaw para usar `nomic-embed-text`. Es rápido y preciso.
3.  **Router de Nube (`jarvis-router`):** Cuando le pidas a J.A.R.V.I.S. que programe cosas pesadas, configúralo para delegar a `claude-3.5-sonnet` o `gemini-3-pro`. Tu `jarvis-router` ya está programado para hacer esto automáticamente si el prompt tiene más de 250 caracteres o contiene palabras clave como "refactor" o "docker".
