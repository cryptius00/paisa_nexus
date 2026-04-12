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
