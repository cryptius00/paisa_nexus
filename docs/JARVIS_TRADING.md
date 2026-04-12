# J.A.R.V.I.S. Trading Automático y Análisis Cuantitativo 📈📉

Este documento detalla cómo J.A.R.V.I.S. (Paisa Nexus) puede ser utilizado como un asistente autónomo de _Algorithmic Trading_ aprovechando su arquitectura híbrida y su memoria de aprendizaje de errores (Tool Learning).

---

## 1. El Arsenal Financiero

A partir de la actualización de Abril de 2026, el módulo `jarvis-os` incluye `python` y `pip` en su lista blanca estricta. Esto permite a J.A.R.V.I.S.:

1.  Instalar librerías financieras de manera autónoma (`pip install ccxt pandas numpy ta-lib`).
2.  Ejecutar scripts locales para analizar los mercados.
3.  Desarrollar y probar nuevas estrategias algorítmicas sin tu intervención.

---

## 2. El Flujo de Trabajo (Trading Workflow)

### 2.1 Obtención de Datos (Local - RTX 3050)

La recolección de datos no requiere razonamiento avanzado. Puedes pedirle a J.A.R.V.I.S. que ejecute un script en Python (vía el comando `jarvis_run_command_safe`) para descargar los datos históricos de velas de Binance.
Al estar enrutado por `jarvis-router` a `qwen3.5:4b`, este proceso consumirá 0 tokens de nube.

### 2.2 Análisis Técnico y Decisiones (Cloud - Claude 3.5 / Gemini)

Una vez que el script de Python genera un reporte en texto (ej. "RSI: 25, MACD: Crossover Bullish"), puedes pedirle a J.A.R.V.I.S.: _"Analiza estos indicadores y decide si ejecutamos una orden de compra"_.
El router detectará la complejidad del análisis de mercado y enviará la consulta a la nube, donde un modelo experto con razonamiento lógico determinará la mejor estrategia de mercado.

### 2.3 Ejecución y Self-Reflection (LanceDB Tool-Learning)

Si el modelo de nube decide comprar, J.A.R.V.I.S. ejecutará `python order.py --buy`.
**¿Qué pasa si falla?** (ej. _Insufficient balance_ o _Invalid API Signature_):

1.  El plugin `jarvis-memory` capturará el error de Python y lo vectorizará en `LanceDB`.
2.  La próxima vez que J.A.R.V.I.S. intente hacer una orden, el **RAG de Reflexión Interna** inyectará un System Prompt: _"La última vez la orden falló por fondos insuficientes o parámetros decimales incorrectos. Revisa tu cálculo antes de llamar a Python"_.
3.  J.A.R.V.I.S. auto-corregirá la orden basándose en su propio historial de mercado.

---

## 3. Protocolo de Seguridad (Mandatorio) 🚨

Debido a que los LLMs pueden ser impredecibles en mercados volátiles, se debe aplicar el siguiente protocolo de seguridad estricto:

- **Regla 1: Solo Paper Trading.** Durante los primeros 30 días, todos los scripts de Python que interactúen con exchanges deben apuntar a la _Testnet_ (Simulación). Deja que la memoria de LanceDB se llene de errores y lecciones de J.A.R.V.I.S. operando dinero ficticio.
- **Regla 2: Límite de Capital Hardcodeado.** Si pasas a producción, nunca pases la clave API directamente en el chat. Almacénala como variable de entorno local en tu Windows 11, y programa tu script de Python para que tenga un límite máximo de pérdida diaria (Stop-Loss por código, independientemente de lo que diga el LLM).
- **Regla 3: No Modificar el OS-Sandbox.** Mantén `jarvis-os` configurado con `shell: false`. Esto asegura que J.A.R.V.I.S. solo puede ejecutar Python y no descargar herramientas maliciosas de terceros por consola (RCE).
