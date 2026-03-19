# NEXUS RESOURCE GUARD v1.0 🛡️📊
# Guardián Dinámico de Eficiencia y Armonía Hardware

Write-Host "Iniciando Nexus Resource Guard... [MODO: EQUILIBRIO DINÁMICO]" -ForegroundColor Cyan

$THRESHOLD_RAM = 85
$THRESHOLD_VRAM = 90
$SCAN_INTERVAL = 30

function Get-VRAMUsage {
    try {
        $output = nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits
        if ($output) {
            $parts = $output.Split(',')
            $used = [int]$parts[0].Trim()
            $total = [int]$parts[1].Trim()
            return [math]::Round(($used / $total) * 100, 2)
        }
    } catch { return 0 }
}

while($true) {
    # 1. Obtener métricas
    $cpu = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
    $ram = (Get-Counter '\Memory\% Committed Bytes In Use').CounterSamples.CookedValue
    $vram = Get-VRAMUsage

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] CPU: $(([math]::Round($cpu,1)))% | RAM: $(([math]::Round($ram,1)))% | VRAM: $vram%" -ForegroundColor Gray

    # 2. Gestionar Ollama (Inferencia)
    $ollama = Get-Process -Name ollama -ErrorAction SilentlyContinue
    if ($ollama) {
        if ($ram -gt $THRESHOLD_RAM -or $vram -gt $THRESHOLD_VRAM) {
            if ($ollama.PriorityClass -ne 'BelowNormal') {
                Write-Host ">> Alerta de Recursos! Reduciendo prioridad de Ollama para proteger estabilidad." -ForegroundColor Yellow
                $ollama.PriorityClass = 'BelowNormal'
            }
        } elseif ($ram -lt 60 -and $vram -lt 70) {
            if ($ollama.PriorityClass -ne 'High') {
                Write-Host ">> Sistema Despejado. Restaurando Ollama a MÁXIMO RENDIMIENTO." -ForegroundColor Green
                $ollama.PriorityClass = 'High'
            }
        }
    }

    # 3. Gestionar OpenClaw (Comunicación)
    $node = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*openclaw*" }
    foreach($p in $node) {
        if ($p.PriorityClass -ne 'AboveNormal') {
            $p.PriorityClass = 'AboveNormal'
        }
    }

    Start-Sleep -Seconds $SCAN_INTERVAL
}
