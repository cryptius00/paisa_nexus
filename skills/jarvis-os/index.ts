import { spawn } from "child_process";
import process from "process";
import { defineSkill } from "openclaw/plugin-sdk";

// Lista blanca estricta de binarios permitidos (NO shell commands).
// ACTUALIZADO (Abril 2026): Arsenal completo de J.A.R.V.I.S. + Capacidades de Trading (Python)
const ALLOWED_BINARIES = new Set([
  // Core
  "git",
  "npm",
  "pnpm",
  "node",
  "docker",
  "ping",
  "ipconfig",
  "ifconfig",
  // Advanced Tools (AST, Lints, GitHub, Web)
  "gh",
  "ast-grep",
  "oxlint",
  "oxfmt",
  "firecrawl",
  "dbt",
  "supabase",
  "playwright",
  // Algorithmic Trading & Data Science
  "python",
  "python3",
  "pip",
  "pip3",
]);

// Helper para Windows 11: Los ejecutables nativos y scripts globales de npm
// necesitan su extensión .cmd o .exe cuando se usa spawn sin shell.
function resolveWindowsBinary(bin: string): string {
  if (process.platform !== "win32") return bin;

  const cmdMap: Record<string, string> = {
    npm: "npm.cmd",
    pnpm: "pnpm.cmd",
    docker: "docker.exe",
    git: "git.exe",
    node: "node.exe",
    ping: "ping.exe",
    ipconfig: "ipconfig.exe",
    // Arsenal J.A.R.V.I.S. en Windows
    gh: "gh.exe",
    "ast-grep": "ast-grep.exe",
    oxlint: "oxlint.exe",
    oxfmt: "oxfmt.exe",
    firecrawl: "firecrawl.cmd",
    dbt: "dbt.exe",
    supabase: "supabase.exe",
    playwright: "playwright.cmd",
    // Trading & Python
    python: "python.exe",
    python3: "python.exe",
    pip: "pip.exe",
    pip3: "pip.exe",
  };

  return cmdMap[bin] || bin;
}

export default defineSkill({
  id: "jarvis-os",
  name: "J.A.R.V.I.S. Secure OS Controller (Windows Optimized)",
  description:
    "Control sandboxed y seguro del sistema para Nexus mediante comandos directos sin shell.",
  tools: [
    {
      name: "jarvis_run_command_safe",
      description:
        'Ejecuta un programa (binario) con argumentos de forma segura y sin shell. NOTA: Comandos internos de consola como "dir", "cd" o "echo" no funcionarán; usa herramientas FS de Node o comandos del arsenal.',
      schema: {
        type: "object",
        properties: {
          executable: {
            type: "string",
            description:
              "Binario a ejecutar. Permitidos: git, npm, pnpm, node, docker, gh, ast-grep, oxlint, oxfmt, firecrawl, dbt, supabase, playwright, python, pip.",
          },
          args: {
            type: "array",
            items: { type: "string" },
            description:
              'Array de argumentos a pasar al binario (ej: ["build"], ["script.py", "--buy"])',
          },
          timeout: { type: "number", description: "Timeout en ms (default 30000)" },
        },
        required: ["executable", "args"],
      },
      async run(input, ctx) {
        const bin = input.executable.trim();

        // 1. Sanitización Crítica: Verificar Whitelist de binarios explícitos
        if (!ALLOWED_BINARIES.has(bin)) {
          ctx.logger.error(
            `[J.A.R.V.I.S. OS] 🚫 Ejecución bloqueada por seguridad. Binario no permitido: ${bin}`,
          );
          return {
            content: [
              {
                type: "text",
                text: `ERROR DE SEGURIDAD: El binario "${bin}" no está en la Whitelist segura del Arsenal. Operación denegada.`,
              },
            ],
          };
        }

        const resolvedBin = resolveWindowsBinary(bin);
        ctx.logger.warn(
          `[J.A.R.V.I.S. OS] ✅ Ejecutando binario sandboxed: ${resolvedBin} ${input.args.join(" ")}`,
        );

        // 2. Ejecutar mediante spawn, NO EXEC.
        // Desactivamos 'shell' explícitamente para mitigar subshells.
        return new Promise((resolve) => {
          const child = spawn(resolvedBin, input.args, {
            shell: false,
            timeout: input.timeout || 30000,
          });

          let stdoutData = "";
          let stderrData = "";

          child.stdout.on("data", (data) => {
            stdoutData += data.toString();
          });
          child.stderr.on("data", (data) => {
            stderrData += data.toString();
          });

          child.on("error", (error) => {
            ctx.logger.error(`[J.A.R.V.I.S. OS] ❌ Fallo en ejecución del spawn:`, error.message);
            resolve({
              content: [
                {
                  type: "text",
                  text: `FALLO DE EJECUCIÓN (SPAWN):\nVerifica que el binario existe en el PATH. Error: ${error.message}`,
                },
              ],
            });
          });

          child.on("close", (code) => {
            resolve({
              content: [
                {
                  type: "text",
                  text: stdoutData || `Proceso terminado (Código ${code}) sin salida.`,
                },
                ...(stderrData ? [{ type: "text", text: `STDERR:\n${stderrData}` }] : []),
              ],
            });
          });
        });
      },
    },
  ],
});
