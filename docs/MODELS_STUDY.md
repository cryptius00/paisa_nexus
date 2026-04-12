# Estudio de Modelos (Q2 2026): Optimización J.A.R.V.I.S. para 4GB VRAM

Este estudio analiza el estado del arte en Hugging Face y Ollama para determinar la configuración óptima del Enrutador Híbrido de Paisa Nexus, teniendo en cuenta las limitaciones físicas (NVIDIA RTX 3050 - 4GB VRAM) y las capacidades de la nube.

---

## 1. El Cerebro Rápido (Local - RTX 3050 4GB)

**Objetivo:** Ejecutar tareas de latencia cero, domótica, interacción por voz y _Tool Calling_ básico. El modelo debe caber completamente en la VRAM (menos de 3.5GB en su variante de 4 bits).

### 🏆 Ganador Actual: `qwen2.5:3b` o `qwen2.5-coder:3b`

- **Por qué:** Qwen 2.5 ha demostrado ser el rey indiscutible de los modelos pequeños. Su versión de 3 billones de parámetros (cuantizada a Q4_K_M en Ollama) ocupa apenas **2.1 GB de VRAM**.
- **Tool Calling:** Es excepcionalmente bueno entendiendo llamadas a herramientas en formato JSON (imprescindible para `jarvis-os`).
- **Contexto:** Soporta hasta 32k tokens, lo cual es vital para RAG y reflexiones internas sin "ahogar" la tarjeta.

### 🥈 Alternativa Fuerte: `llama3.2:1b` / `llama3.2:3b`

- **Por qué:** Llama 3.2 de 1B y 3B son increíblemente rápidos. Si el objetivo de Nexus es responder a tu voz en milisegundos, Llama 3.2:1b (1GB VRAM) generará más de 100 tokens/s en tu RTX 3050.
- **Desventaja:** Su capacidad para razonamiento complejo y uso de herramientas (Tool Calling) es inferior a Qwen 2.5.

---

## 2. El Analista Profundo (Nube / Router Fallback)

**Objetivo:** Razonamiento complejo, programación arquitectónica, refactorización masiva de código (10,000+ líneas) y depuración profunda. Esto se envía vía API (OpenAI, Anthropic, OpenRouter).

### 🏆 Ganador Actual (Código y Lógica): `claude-3.5-sonnet` (Anthropic)

- **Por qué:** En benchmarks de ingeniería de software (SWE-bench), Sonnet 3.5 aplasta a la competencia. Su capacidad para leer un archivo y escribir código correcto sin alucinar no tiene rival. Además, es más barato y rápido que Opus.

### 🥈 Alternativa Fuerte (Versatilidad Multimodal): `gpt-4o` (OpenAI)

- **Por qué:** Es el estándar de la industria. Excelente en Tool Calling, razonamiento y, sobre todo, comprensión visual (si alguna vez le envías capturas de pantalla de un error de consola a J.A.R.V.I.S.).

### 🥉 Alternativa Open-Source (Vía API/OpenRouter): `deepseek-coder-v2` o `llama3-70b`

- **Por qué:** DeepSeek Coder V2 es un modelo de mezcla de expertos (MoE) que compite cara a cara con GPT-4 en programación, pero a una fracción del coste. Si prefieres no usar OpenAI/Anthropic por privacidad, esta es la mejor opción.

---

## 3. El Índice Vectorial (Embeddings para LanceDB)

**Objetivo:** Convertir texto en vectores matemáticos para que J.A.R.V.I.S. construya su memoria episódica en milisegundos.

### 🏆 Ganador Absoluto: `nomic-embed-text`

- **Por qué:** Su dimensión de vector (768) es el punto dulce entre precisión y consumo de disco. Además, tiene una ventana de contexto de **8192 tokens**, lo que significa que J.A.R.V.I.S. puede vectorizar conversaciones enteras o scripts gigantes en una sola pasada.
- **Eficiencia:** Es extremadamente rápido ejecutándose en tu procesador Ryzen 5 o en la GPU.

### 🥈 Alternativa Fuerte: `mxbai-embed-large`

- **Por qué:** Creado por Mixedbread AI, este modelo suele ocupar los primeros puestos del benchmark MTEB (Massive Text Embedding Benchmark) para modelos locales. Es ligeramente más pesado pero más preciso en búsquedas semánticas sutiles.

---

## 📝 Conclusión y Configuración Final de J.A.R.V.I.S.

Si este fuera mi sistema, configuraría los archivos de la siguiente manera:

1.  **Ollama Local (`nexus.modelfile`):** `FROM qwen2.5-coder:3b` (Para programación rápida y uso de herramientas local).
2.  **Ollama Embeddings:** `nomic-embed-text` (Iniciado una sola vez en background para tu memoria LanceDB).
3.  **Router de Nube (`jarvis-router`):** Configurado para apuntar a `claude-3.5-sonnet` en los picos de carga cognitiva o código complejo.
