# Nexus Architecture: Advanced Full-Stack AI Bot 🧠🛡️

Esta documentación detalla la arquitectura técnica de **Nexus**, un asistente de IA autónomo diseñado para operar 100% en local con capacidades de razonamiento técnico, uso de herramientas de sistema y aprendizaje incremental.

## 🏗️ Componentes del Sistema

### 1. Motor de Inferencia (Ollama)

- **Modelo Base**: `qwen3.5:4b` (Balance óptimo entre inteligencia técnica y latencia).
- **Modelo Nexus**: Construido sobre un `Modelfile` personalizado para forzar límites físicos.
- **Contexto (KV Cache)**: Configurado estrictamente en **16,384 tokens** (16k) para garantizar memoria profunda sin saturar la VRAM de la GPU.
- **Modelfile Nexus**:
  ```dockerfile
  FROM qwen3.5:4b
  PARAMETER num_ctx 16384
  PARAMETER temperature 0.0
  STOP "<thought>", "</thought>", "thought:", "Thinking:"
  ```

### 2. Gateway e Integración (OpenClaw)

- **Comunicación**: Utiliza `openclaw gateway` como puente entre los modelos locales y el canal de Telegram.
- **Seguridad**: Autenticación por token y blindaje de secretos mediante `.gitignore`.
- **Canales**: Telegram (@streetwearVaultbot) con políticas de `allowlist` para seguridad privada.

### 3. Memoria RAG y Entrenamiento (Learning Engine)

- **Embedding**: `nomic-embed-text:latest` (Ollama) para la vectorización de conocimientos.
- **Estructura de Entrenamiento**: Ubicada en `C:\Users\Usuario\.openclaw\training_modules\`.
- **Bootstrap**: Los archivos `.md` en la carpeta de entrenamiento se cargan automáticamente en el arranque mediante el parámetro `bootstrap-extra-files` en `openclaw.json`.

## 📈 Flujo de Datos

1. **Entrada**: Mensaje recibido vía Telegram API.
2. **Contexto**: El Agente recupera el historial de la sesión (hasta 16k tokens) y los módulos de entrenamiento locales del disco.
3. **Inferencia**: El modelo `nexus` en Ollama procesa la petición en GPU con temperatura 0.0.
4. **Acción**: Si se detecta una necesidad de sistema (ej. crear archivos), el Agente ejecuta la herramienta `write_to_file` en el entorno local.
5. **Salida**: Respuesta enviada de vuelta a Telegram.

## 🛠️ Guía para Desarrolladores

- **Actualizar Conocimiento**: Añade cualquier archivo `.md` a `\.openclaw\training_modules\` y reinicia el Gateway.
- **Monitorización**: Audita los logs en `\tmp\openclaw\openclaw-YYYY-MM-DD.log`.
- **Persistencia**: Sincroniza cambios mediante `git push origin main` al repositorio privado `paisa_nexus`.

---

_Diseñado por Nexus: El mejor Arquitecto Full Stack del planeta._ 🦞⚡
