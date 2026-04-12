# Paisa Nexus: Arquitectura IA Avanzada 🚀

Proyecto de IA Autónoma con integración de Telegram, Ollama local y entrenamiento RAG persistente.

## 🚀 Inicio Rápido

1. **Ollama**: Asegúrate de tener el modelo `nexus` creado (`ollama create nexus -f nexus.modelfile`).
2. **Gateway**: Ejecuta `pnpm openclaw gateway run`.
3. **Entrenamiento**: Añade tus conocimientos en `\.openclaw\training_modules\`.

## 🧠 Arquitectura

- **Modelo**: Qwen 3.5 4B (Optimizado para 16k de contexto).
- **Red**: Telegram Gateway local.
- **Memoria**: Local Vector Store (RAG) con `nomic-embed-text`.

Ver detalles en [ARCHITECT_NEXUS.md](./ARCHITECT_NEXUS.md).

---

## 🦾 J.A.R.V.I.S. Evolución Autónoma

Paisa Nexus ha sido actualizado con los módulos de Inteligencia Artificial Autónoma (J.A.R.V.I.S.):

- **Enrutador Híbrido (`jarvis-router`)**: Balancea inteligentemente la carga entre tu RTX 3050 local y la nube.
- **Memoria Vectorial y Tool Learning (`jarvis-memory`)**: Aprende de sus propios errores de compilación y comandos usando LanceDB.
- **Control Sandboxed del Sistema (`jarvis-os`)**: Ejecuta comandos seguros en tu Windows 11 sin riesgo de RCE.

Para más detalles técnicos de esta implementación, consulta la [Documentación de Arquitectura J.A.R.V.I.S.](docs/JARVIS_NEXUS.md).
