---
name: jarvis-os
description: Permite a J.A.R.V.I.S. ejecutar comandos locales del SO de manera segura (Sin Shell).
icon: command-line
profile: all
capabilities:
  tools:
    - jarvis_run_command_safe
---

# Jarvis OS System Control

Este skill habilita a Nexus/Jarvis para ejecutar binarios en el sistema anfitrión de forma ultra-segura.
Se utiliza una arquitectura _Sin Shell_ (`shell: false`) para prevenir la inyección de comandos (RCE) y subshells.

## Tools

### jarvis_run_command_safe

Ejecuta un programa (binario) con argumentos de forma segura en el SO local bajo un whitelist estricto.

**Parameters:**

- `executable` (string, required): El binario a ejecutar (debe estar en el whitelist: `git`, `npm`, `pnpm`, `node`, `docker`, `ping`, `ipconfig`, `ifconfig`).
- `args` (array of strings, required): Lista de argumentos a pasar al binario (ej: `["build"]`, `["status"]`). No use comandos encadenados como `&&` o `|`.
- `timeout` (number): Tiempo máximo de ejecución en milisegundos (por defecto 10000).

**Notas de compatibilidad Windows 11:**
Los comandos internos del `cmd.exe` como `dir`, `echo` o `cd` no funcionarán ya que no son binarios reales. Para leer archivos o directorios, utilice herramientas nativas del agente o comandos como `ls` si están instalados en el PATH.
