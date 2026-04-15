# El Arsenal de J.A.R.V.I.S.: Herramientas y Skills (Abril 2026) 🛠️🛡️

Un agente de IA autónomo es tan bueno como las herramientas que puede manejar. En este documento se detalla el "Arsenal" de _Skills_ y conectores (MCP) recomendados para maximizar la eficiencia de J.A.R.V.I.S. (Paisa Nexus) en un entorno de programación local con hardware de 4GB VRAM (RTX 3050).

---

## 1. El Paradigma de Abril 2026: CLI vs. MCP Servers

A lo largo de 2025, el mundo de los agentes AI estuvo obsesionado con construir servidores masivos bajo el estándar **MCP (Model Context Protocol)**. Sin embargo, en el segundo trimestre de 2026, la comunidad de ingenieros de IA ha llegado a una conclusión reveladora:

- **El Problema del MCP Puro:** Los servidores MCP inyectan su esquema completo (todas las funciones, parámetros y descripciones) en el _Context Window_ del LLM en cada petición. Si le agregas a J.A.R.V.I.S. 4 servidores MCP distintos, gastarás cientos de miles de tokens solo en sobrecarga, ahogando la VRAM de tu RTX 3050 antes de que el agente escriba una sola línea de código.
- **La Solución de J.A.R.V.I.S. (CLI-First):** Los modelos como `Qwen3.5:4b` y `Claude-3.5-Sonnet` han sido entrenados con millones de líneas de comandos (Bash, PowerShell, Unix). En lugar de usar un servidor MCP pesado para interactuar con GitHub, es **hasta 30 veces más barato en tokens y 98% más rápido** enseñarle a J.A.R.V.I.S. a usar la herramienta CLI de GitHub directamente a través del skill `jarvis-os`.

---

## 2. El Arsenal Recomendado para Paisa Nexus

A continuación, se listan las herramientas que debes instalar en tu máquina (Windows 11) e incluir en la **lista blanca (`ALLOWED_BINARIES`)** de `jarvis-os` para que J.A.R.V.I.S. las opere como un maestro absoluto:

### 2.1 Control de Código y Ast (Sintaxis)

- **`ast-grep` (CLI):** Una herramienta revolucionaria para buscar y reemplazar código usando árboles de sintaxis abstracta (AST) en lugar de expresiones regulares (Regex). Si J.A.R.V.I.S. necesita refactorizar 50 archivos TypeScript, lo hará sin fallos de indentación.
- **`oxlint` / `oxfmt` (CLI):** Las herramientas en Rust que ya usas en OpenClaw. J.A.R.V.I.S. debe tener permiso para correr `oxlint` para auto-verificarse después de programar (Reflection-Loop).
- **`git` y `gh` (GitHub CLI):** J.A.R.V.I.S. no necesita un servidor MCP de GitHub; con el CLI `gh` puede leer PRs, revisar issues, y hacer commits directamente desde tu entorno sandboxed.

### 2.2 Navegación Web e Investigación

- **`firecrawl` (MCP Server o CLI):** Es la mejor herramienta de Abril de 2026 para _scraping_ orientado a LLMs. J.A.R.V.I.S. puede usarlo para leer la última documentación de un framework que tú le pidas, convirtiendo sitios web enteros en Markdown limpio.
- **`playwright` (Scripting Automático):** Para automatizaciones pesadas, J.A.R.V.I.S. puede escribir scripts locales de Playwright, ejecutarlos vía `jarvis-os`, tomar capturas de pantalla, analizarlas con un modelo de visión (como `llava`) y corregir problemas de frontend de forma autónoma.

### 2.3 Infraestructura y Despliegue

- **`docker` y `docker-compose`:** Esenciales. J.A.R.V.I.S. puede leer los logs de los contenedores si un servidor se cae o reconstruir imágenes locales.
- **`supabase` CLI / `dbt` MCP:** Si manejas bases de datos complejas, estos son los únicos casos donde los servidores MCP oficiales (como el `dbt MCP server` o la CLI de Supabase) valen la pena el gasto de tokens, ya que mapean esquemas de bases de datos de forma dinámica.

---

## 3. ¿Cómo aprende J.A.R.V.I.S. a usar esto? (Tool-Learning)

No necesitas enseñarle a usar la herramienta `gh` o `ast-grep` paso a paso.

1.  J.A.R.V.I.S. intentará usarla de forma intuitiva a través del comando `jarvis_run_command_safe`.
2.  Si la CLI devuelve un error de sintaxis (ej. `stderr: invalid flag -x`), el plugin **`jarvis-memory`** interceptará ese error y lo guardará en `LanceDB`.
3.  La próxima vez, J.A.R.V.I.S. leerá su propio error del pasado (Self-Reflection RAG) y ejecutará el comando con los flags correctos. ¡Se volverá un maestro mediante prueba y error en segundos!

---

**Resumen Operativo:** Para maximizar el rendimiento en tu PC, **evita llenar a OpenClaw de Servidores MCP innecesarios**. Mantén tu `jarvis-os` con una lista blanca sólida (Git, Docker, pnpm, ast-grep, gh, firecrawl) y deja que el Meta-Aprendizaje de LanceDB haga el resto.
