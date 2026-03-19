# Nexus Balance Optimizer ⚖️🚀
# Este script ajusta las prioridades de proceso en Windows para máximo rendimiento de la IA local.

Write-Host "Iniciando Protocolo de Balance Nexus..." -ForegroundColor Cyan

# 1. Elevar prioridad de OpenClaw (Gateway)
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
foreach ($p in $nodeProcs) {
    if ($p.CommandLine -like "*openclaw*") {
        $p.PriorityClass = "AboveNormal"
        Write-Host "[OK] Prioridad de OpenClaw elevada a 'AboveNormal'" -ForegroundColor Green
    }
}

# 2. Sintonía de Ollama (Motor de Inferencia)
$ollamaProc = Get-Process -Name ollama -ErrorAction SilentlyContinue
if ($ollamaProc) {
    $ollamaProc.PriorityClass = "High"
    Write-Host "[OK] Prioridad de Ollama elevada a 'High' para latencia mínima" -ForegroundColor Green
}

# 3. Limpieza de Memoria Standby (Opcional)
# Write-Host "Optimizando RAM..."
# [GC]::Collect()

Write-Host "Armonía de Hardware alcanzada. Nexus está operando al máximo nivel." -ForegroundColor Gold
