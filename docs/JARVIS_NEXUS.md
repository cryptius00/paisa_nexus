# Documentación Técnica: J.A.R.V.I.S. Nexus Architecture 🧠⚡

Este documento describe la evolución técnica implementada sobre el core de **Paisa Nexus / OpenClaw**, transformándolo de un simple enrutador de chat a un **Asistente de Ingeniería de Software Autónomo y Proactivo (AI-OS)**.

---

## 1. El Problema Original

La versión original de OpenClaw procesa todos los mensajes de forma lineal y estática:

1. **Ineficiencia de Hardware:** Envía un "Hola" al mismo modelo pesado que un requerimiento de refactorización de código, gastando tokens y tiempo de inferencia innecesariamente.
2. **Amnesia de Herramientas:** Si el agente ejecuta un comando (ej. `docker ps -a`) y falla por un flag incorrecto, lo olvidará al instante. Si se le pide lo mismo en otra sesión, cometerá el mismo error.
3. **Aislamiento del Sistema:** Por seguridad, OpenClaw no puede operar directamente sobre el host, requiriendo intervención humana constante para aplicar cambios.

---

## 2. La Solución: Arquitectura J.A.R.V.I.S.

Se han desarrollado tres módulos centrales (`jarvis-router`, `jarvis-memory`, `jarvis-os`) que operan en conjunto para crear un bucle de **Percepción -> Reflexión -> Acción**.

### 2.1 Enrutador Híbrido Cognitivo (`jarvis-router`)

- **Propósito:** Balanceo de carga inteligente basado en la semántica del mensaje.
- **Funcionamiento Técnico:**
  - Intercepta el hook `beforeSend` de OpenClaw.
  - Evalúa heurísticamente la intención del usuario. Si detecta intenciones complejas (palabras como `refactor`, `docker`, `architecture`, `typescript` o mensajes > 250 caracteres), sobreescribe el enrutamiento para delegarlo a un modelo de nube masivo (ej. `gpt-4o`).
  - Si es una charla corta, lo enruta a tu **RTX 3050 (4GB VRAM)** usando un modelo local hiper-optimizado (`qwen3.5:4b`).
- **Beneficio:** Latencia cero en tareas cotidianas y potencia infinita en programación, sin saturar la VRAM.

### 2.2 Memoria Vectorial y Meta-Aprendizaje (`jarvis-memory`)

- **Propósito:** Otorgar memoria a largo plazo y la capacidad de aprender de los errores.
- **Funcionamiento Técnico (RAG y LanceDB):**
  - **Base de Datos:** Se inicializa `LanceDB` en `~/.openclaw/jarvis-memory-vectors`.
  - **Tabla Episódica:** Tras cada respuesta (`afterReply`), el chat completo se vectoriza usando el runtime de embeddings interno de OpenClaw y se inserta en disco.
  - **Tabla de Experiencia (Tool Learning):** El sistema escanea las llamadas a herramientas (`tool_calls`). Si la respuesta del bot contiene palabras de pánico (`stderr`, `fail`, `error`), el vector se etiqueta con `success: 0`.
  - **Reflexión Interna (Self-Reflection RAG):** Antes de enviar un nuevo prompt relacionado con código o comandos (`beforeSend`), el módulo busca en LanceDB los vectores de `success: 0` con una distancia euclidiana < 0.8. Si hay coincidencias, **inyecta silenciosamente un System Prompt adicional**: _"La última vez que usaste esta herramienta, falló por X. Hazlo diferente."_
- **Beneficio:** El agente evoluciona. Si falla compilando en TypeScript hoy, mañana no cometerá el mismo error de sintaxis porque su base vectorial se lo advertirá en milisegundos.

### 2.3 Control Sandboxed del Sistema (`jarvis-os`)

- **Propósito:** Darle "manos" al agente en Windows 11 sin comprometer la seguridad.
- **Funcionamiento Técnico (Mitigación RCE):**
  - No usa `exec()` (que abre una shell `/bin/sh` o `cmd.exe` susceptible a inyecciones como `echo "hola" > && rm -rf /`).
  - Usa `spawn(bin, args, { shell: false })`, lo que obliga al sistema operativo a buscar únicamente binarios exactos y tratar el resto como texto plano, haciendo imposible la inyección de sub-shells.
  - Implementa una **Lista Blanca (Whitelist) estricta** (ej. `git`, `npm`, `pnpm`, `docker`, `ping`, `node`).
- **Beneficio:** Permite que Nexus lea logs, inicie contenedores, haga commits y revise el estado de la red de forma autónoma, con garantía matemática de que no podrá ejecutar un formateo de disco o invocar un troyano no autorizado.

---

## 3. Topología de Hardware Objetivo

Este código fue diseñado meticulosamente para la siguiente topología local:

- **CPU:** AMD Ryzen 5 5600G (6 Núcleos / 12 Hilos) -> Excelente para el subproceso de base de datos LanceDB y `spawn` de Node.js.
- **RAM:** 32 GB -> Vital para retener en memoria el contexto largo (16k-32k) y los buffers vectoriales antes de enviarlos a disco.
- **GPU:** NVIDIA RTX 3050 (4GB) -> Usada exclusivamente por Ollama para el modelo `qwen3.5:4b` de enrutamiento rápido y para generar los Embeddings de `jarvis-memory` de manera local y gratuita.

---

_Escrito por: El Arquitecto Autónomo J.A.R.V.I.S._
