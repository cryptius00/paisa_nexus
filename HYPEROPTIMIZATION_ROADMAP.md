# Hoja de Ruta para la Hyperoptimización de Paisa Nexus

## 1. Introducción

Este documento detalla una hoja de ruta técnica para la hyperoptimización de **Paisa Nexus**, el agente autónomo desarrollado por cryptius00. El objetivo principal es mejorar significativamente el rendimiento, la eficiencia y la capacidad de razonamiento del agente en un entorno de hardware local (Ryzen 5600, 32GB RAM, RTX 3050 6GB), superando las limitaciones actuales de los modelos Transformer tradicionales y acercándose a la fluidez de agentes de mayor escala como OpenClaw.

La estrategia se centra en la evolución de la arquitectura del modelo, la gestión inteligente del contexto y la optimización de la inferencia, aprovechando la sólida base ya establecida en Paisa Nexus.

## 2. Análisis del Estado Actual de Paisa Nexus

Paisa Nexus representa una implementación robusta de un agente autónomo con capacidades notables para la ejecución local. Sus fortalezas incluyen:

*   **Integración Local Robusta**: Uso de Ollama para la inferencia local de LLMs, con un `Modelfile` personalizado (`nexus.modelfile`) que optimiza la asignación de recursos (`num_gpu 99`, `num_thread 8`) y el comportamiento del modelo (`temperature 0.0`, `repeat_penalty 1.1`).
*   **Gestión de Contexto Inicial**: Configuración de una ventana de contexto de 16k tokens (`num_ctx 16384`) para el modelo Qwen 3.5 4B, buscando un equilibrio entre memoria y VRAM.
*   **Sistema de Herramientas y Habilidades**: Utiliza `openclaw` como *framework* para la orquestación de agentes, permitiendo la ejecución de herramientas de sistema (`write_to_file`) y la integración de habilidades.
*   **Memoria RAG Básica**: Carga de módulos de entrenamiento (`.md`) en el arranque a través de `bootstrap-extra-files`, proporcionando una base de conocimiento al agente.
*   **Comunicación y Persistencia**: Integración con Telegram y gestión de sesiones para la interacción continua.

Sin embargo, la arquitectura actual presenta limitaciones inherentes a los modelos Transformer en entornos de recursos limitados, que pueden ser abordadas mediante las siguientes optimizaciones:

*   **Consumo de VRAM por KV Cache**: La arquitectura Transformer, incluso con un contexto limitado a 16k, consume VRAM de manera lineal con la longitud del contexto, lo que puede saturar rápidamente los 6GB de la RTX 3050 en interacciones prolongadas o con prompts complejos.
*   **"Prompt Bloat" por RAG Estático**: La carga de todos los módulos de entrenamiento en el *bootstrap* puede llevar a prompts iniciales muy largos, ralentizando la inferencia y ocupando espacio valioso en la ventana de contexto, incluso si solo una fracción de esa información es relevante para la tarea actual.
*   **Velocidad de Inferencia**: La generación de tokens puede ser lenta para modelos de 4B parámetros en una RTX 3050, afectando la fluidez y la capacidad de respuesta del agente.
*   **Razonamiento Lineal**: El modelo procesa la información de manera secuencial, lo que puede ser ineficiente para tareas que requieren una planificación o un análisis más profundo.

## 3. Pilares de la Hyperoptimización

La estrategia de hyperoptimización se basa en cinco pilares fundamentales, diseñados para maximizar el rendimiento y la eficiencia de Paisa Nexus en el hardware del usuario:

### 3.1. Transición a Arquitecturas Post-Transformer (Mamba/Híbridos)

*   **Concepto**: Reemplazar o complementar la arquitectura Transformer de Qwen 3.5 4B con modelos basados en State Space Models (SSMs) como Mamba, o arquitecturas híbridas (ej. Jamba). Estos modelos ofrecen un rendimiento competitivo con un consumo de memoria del KV Cache que no escala linealmente con la longitud del contexto, sino que mantiene un estado fijo.
*   **Beneficio**: Permite manejar ventanas de contexto mucho más grandes (o historiales de sesión más largos) sin agotar la VRAM de la RTX 3050, lo que es crucial para tareas complejas y bases de conocimiento extensas.
*   **Implementación**: Identificar modelos Mamba o híbridos disponibles en formatos compatibles con Ollama (ej. GGUF) y actualizar el `FROM` en `nexus.modelfile`.

### 3.2. Implementación de Decodificación Especulativa (Speculative Decoding)

*   **Concepto**: Utilizar un modelo "borrador" (draft model) más pequeño y rápido para generar una secuencia de tokens candidatos, que luego son verificados en paralelo por el modelo principal (el modelo Qwen o Mamba). Si los tokens coinciden, se aceptan varios tokens a la vez, acelerando la generación.
*   **Beneficio**: Acelera significativamente la velocidad de inferencia (tokens/segundo) sin sacrificar la calidad de la salida del modelo principal, mejorando la fluidez y la capacidad de respuesta del agente.
*   **Implementación**: Configurar Ollama (si soporta la función directamente) o integrar un *backend* de inferencia que permita la decodificación especulativa con un modelo borrador adecuado (ej. un modelo de 0.5B o 1B parámetros).

### 3.3. Optimización de la Cuantización

*   **Concepto**: Asegurar el uso de los formatos de cuantización más eficientes y adecuados para la RTX 3050. La cuantización reduce el tamaño del modelo y el consumo de VRAM, permitiendo cargar modelos más grandes o ejecutar inferencias más rápidas.
*   **Beneficio**: Maximiza la cantidad de modelo que puede residir en los 6GB de VRAM, o libera VRAM para otras operaciones, mejorando la eficiencia general.
*   **Implementación**: Evaluar formatos como EXL2 (para backends compatibles) o GGUF con `k-quants` optimizados (ej. `Q4_K_M`, `Q5_K_M`) para encontrar el mejor equilibrio entre tamaño, velocidad y precisión para el hardware específico.

### 3.4. Gestión Inteligente del Contexto (RAG Dinámico)

*   **Concepto**: Transformar el sistema RAG de Paisa Nexus de una carga estática en el *bootstrap* a un mecanismo dinámico. En lugar de inyectar todo el conocimiento al inicio, el agente utilizará una herramienta de búsqueda (`memory_search`) para recuperar solo los fragmentos de conocimiento más relevantes para la consulta actual del usuario o la tarea en curso.
*   **Beneficio**: Reduce drásticamente el "prompt bloat", disminuye el tiempo de procesamiento del prompt inicial, mejora la precisión del modelo al proporcionarle información más enfocada y permite escalar la base de conocimientos sin impactar negativamente el rendimiento.
*   **Implementación**: Refactorizar la lógica de carga de `bootstrap-extra-files` en `src/agents/agent-command.ts` y `src/agents/cli-runner.ts` para que, en su lugar, el agente invoque la herramienta `memory_search` con la consulta actual para recuperar el contexto relevante.

### 3.5. Refinamiento del Uso de Herramientas para SLMs

*   **Concepto**: Optimizar la forma en que el modelo genera y utiliza las llamadas a herramientas, reconociendo que los Small Language Models (SLMs) pueden tener dificultades con la generación de JSON estructurado complejo.
*   **Beneficio**: Mejora la fiabilidad y eficiencia del agente al interactuar con el entorno, reduciendo errores en las llamadas a herramientas y mejorando la capacidad del agente para ejecutar acciones complejas.
*   **Implementación**: 
    *   **Modelos Específicos para Herramientas**: Si es posible, utilizar un modelo ligeramente más grande o una variante de `Qwen` optimizada para la generación de código/JSON (ej. `Qwen2.5-Coder-7B-Instruct` cuantizado) para la fase de planificación y llamada a herramientas.
    *   **Validación Estricta y Retroalimentación**: Implementar validación de esquemas JSON para las salidas de herramientas y proporcionar retroalimentación explícita al LLM cuando la llamada a la herramienta es inválida, permitiéndole corregir su razonamiento.
    *   **Simplificación de Esquemas**: Revisar y simplificar los esquemas JSON de las herramientas existentes para reducir la complejidad que el LLM debe generar.

## 4. Hoja de Ruta Detallada (Fases de Implementación)

Esta hoja de ruta propone un enfoque iterativo, comenzando con las optimizaciones de mayor impacto y menor riesgo.

### Fase 1: Implementación de RAG Dinámico (Alto Impacto, Riesgo Moderado)

*   **Objetivo**: Reemplazar la carga estática de conocimientos por una recuperación dinámica basada en la consulta.
*   **Tareas**: 
    1.  **Desactivar Carga de Bootstrap**: Modificar `src/agents/cli-runner.ts` para que no inyecte `bootstrap-extra-files` directamente en el prompt inicial.
    2.  **Integrar `memory_search`**: Asegurarse de que la herramienta `memory_search` esté disponible y sea invocada por el agente antes de la inferencia principal para recuperar contexto relevante de los módulos de entrenamiento.
    3.  **Refinar Prompts**: Ajustar los prompts del sistema para guiar al agente a usar `memory_search` de manera efectiva.
    4.  **Pruebas**: Validar que el agente puede acceder y utilizar el conocimiento de los módulos de entrenamiento de forma dinámica.

### Fase 2: Evaluación y Transición a Arquitecturas Post-Transformer (Alto Impacto, Riesgo Moderado)

*   **Objetivo**: Evaluar y migrar a un modelo más eficiente en el uso de VRAM para contextos largos.
*   **Tareas**: 
    1.  **Investigación de Modelos**: Identificar modelos Mamba o híbridos (ej. Jamba) disponibles en Ollama que sean adecuados para tareas de agente y que puedan ser cuantizados para la RTX 3050.
    2.  **Benchmarking**: Realizar pruebas de rendimiento (tokens/segundo, uso de VRAM) con el modelo actual (Qwen 3.5 4B) y los modelos candidatos Mamba/híbridos.
    3.  **Actualizar `nexus.modelfile`**: Modificar el `FROM` en `nexus.modelfile` para apuntar al modelo Mamba/híbrido seleccionado.
    4.  **Ajuste de Parámetros**: Reajustar `num_ctx`, `num_gpu`, `num_thread` y `temperature` según las características del nuevo modelo.
    5.  **Pruebas de Integración**: Asegurar que el nuevo modelo funciona correctamente con el sistema de herramientas y el RAG dinámico.

### Fase 3: Integración de Decodificación Especulativa (Impacto Alto, Riesgo Moderado)

*   **Objetivo**: Acelerar la generación de tokens del agente.
*   **Tareas**: 
    1.  **Investigación de Soporte**: Determinar si la versión de Ollama utilizada o un *backend* de inferencia alternativo soporta decodificación especulativa.
    2.  **Selección de Modelo Borrador**: Elegir un modelo borrador pequeño y rápido compatible con el modelo principal.
    3.  **Configuración**: Implementar la configuración necesaria para activar la decodificación especulativa.
    4.  **Benchmarking y Ajuste**: Medir la mejora en tokens/segundo y ajustar la configuración para optimizar el rendimiento.

### Fase 4: Refinamiento de Herramientas y Lógica del Agente (Impacto Moderado, Riesgo Bajo)

*   **Objetivo**: Mejorar la fiabilidad y la eficiencia del uso de herramientas por parte del agente.
*   **Tareas**: 
    1.  **Análisis de Errores de Herramientas**: Monitorear los logs del agente para identificar patrones de errores en las llamadas a herramientas (ej. JSON inválido).
    2.  **Validación de Esquemas**: Implementar validación de esquemas JSON en las llamadas a herramientas para detectar errores tempranamente.
    3.  **Retroalimentación al LLM**: Desarrollar un mecanismo para que el agente reciba retroalimentación estructurada cuando una llamada a herramienta falla, permitiéndole corregir su razonamiento.
    4.  **Simplificación de Herramientas**: Revisar los esquemas de las herramientas más utilizadas y simplificarlos si es posible.

## 5. Resultados Esperados

Al seguir esta hoja de ruta, Paisa Nexus experimentará las siguientes mejoras:

*   **Mayor Velocidad de Inferencia**: Respuestas más rápidas y una experiencia de usuario más fluida.
*   **Mayor Capacidad de Contexto**: Habilidad para manejar historiales de conversación más largos y bases de conocimiento más extensas sin degradación del rendimiento.
*   **Uso Eficiente de la VRAM**: Optimización del consumo de memoria de la GPU, permitiendo un uso más sostenible de la RTX 3050.
*   **Razonamiento Más Preciso**: Mejora en la capacidad del agente para seleccionar y utilizar información relevante, reduciendo alucinaciones y respuestas genéricas.
*   **Agente Más Robusto**: Menos errores en la ejecución de herramientas y una mayor capacidad de auto-corrección.

Esta hoja de ruta servirá como guía para transformar Paisa Nexus en una "Estructura Hyperoptimizada" que aproveche al máximo tu hardware local, llevando la autonomía del agente a un nuevo nivel de eficiencia y capacidad.
