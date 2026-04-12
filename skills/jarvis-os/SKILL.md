---
name: jarvis-os
description: Permite a J.A.R.V.I.S. ejecutar comandos locales del SO de manera autónoma (Bash/PowerShell).
icon: command-line
profile: all
capabilities:
  tools:
    - jarvis_run_command
---

# Jarvis OS System Control

Este skill habilita a Nexus/Jarvis para ejecutar scripts del sistema.
Su uso principal es para automatizaciones, refactorización, manejo de docker y scripts `NEXUS_GUARD.ps1`.

## Tools

### jarvis_run_command

Ejecuta un comando en la consola del sistema local (Bash en Linux/Mac, PowerShell en Windows).
Utilice esto para arrancar servidores, compilar aplicaciones o leer el estado del OS.

**Parameters:**

- `command` (string, required): El comando a ejecutar (ej. `npm run dev`, `docker ps`).
- `timeout` (number): Tiempo máximo de ejecución en milisegundos.
