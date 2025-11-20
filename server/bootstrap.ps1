<#
Bootstrap script for the RTMP proxy server.
- Runs `npm install` in the server directory
- Detects ffmpeg (local `..\public\server\ffmpeg.exe` or on PATH)
- Optionally sets user env var `FFMPEG_PATH` to the local binary
- Starts the server in a detached process
- Optionally registers scheduled task by invoking `install-service.ps1` elevated

Usage:
  PowerShell (recommended run as Administrator for task install):
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    .\bootstrap.ps1

This script is interactive and will show prompts.
#>

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$serverDir = $scriptDir
$repoRoot = Split-Path -Parent $serverDir
$publicServerFfmpeg = Join-Path -Path $repoRoot -ChildPath "public\server\ffmpeg.exe"

Write-Info "Bootstrap iniciado";
Write-Info "Server dir: $serverDir"

# 1) Check Node and npm
function Test-Command($cmd, $args = '--version') {
    # Prefer Get-Command to see if the executable is available, then try to run it.
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if (-not $found) { return $false }
    try {
        & $cmd $args > $null 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

if (-not (Test-Command 'node')) {
    Write-Err "Node.js não encontrado no PATH. Instale Node.js (https://nodejs.org) antes de continuar."; exit 1
}
if (-not (Test-Command 'npm')) {
    Write-Err "npm não encontrado no PATH. Instale Node.js (que inclui npm) antes de continuar."; exit 1
}

# 2) npm install
Write-Info "Executando 'npm install' em: $serverDir"
Push-Location $serverDir
try {
    $npmProc = Start-Process -FilePath 'npm' -ArgumentList 'install' -NoNewWindow -Wait -PassThru
    if ($npmProc.ExitCode -ne 0) { Write-Warn "npm install terminou com código $($npmProc.ExitCode). Verifique logs." }
    else { Write-Info "npm install concluído" }
} catch {
    Write-Err "Falha ao executar npm install: $_"; Pop-Location; exit 1
}
Pop-Location

# 3) Detect ffmpeg
$ffmpegFound = $false
$ffmpegPath = $null

if (Test-Path $publicServerFfmpeg) {
    $ffmpegFound = $true
    $ffmpegPath = (Resolve-Path $publicServerFfmpeg).Path
    Write-Info "Encontrado ffmpeg local em: $ffmpegPath"
} else {
    # Test PATH
    if (Test-Command 'ffmpeg') {
        $ffmpegFound = $true
        $ffmpegPath = 'ffmpeg' # on PATH
        Write-Info "ffmpeg detectado no PATH (usar ffmpeg global)."
    } else {
        Write-Warn "ffmpeg não encontrado localmente em 'public/server' nem no PATH. Para transmitir, baixe ffmpeg e coloque em 'public/server' ou adicione ao PATH."
    }
}

# 4) Optionally set user env var FFMPEG_PATH to local binary
if ($ffmpegFound -and $ffmpegPath -ne 'ffmpeg') {
    $resp = Read-Host "Deseja gravar variável de usuário FFMPEG_PATH apontando para: $ffmpegPath ? (S/N)"
    if ($resp.ToUpper() -eq 'S' -or $resp.ToUpper() -eq 'Y') {
        try {
            [Environment]::SetEnvironmentVariable('FFMPEG_PATH', $ffmpegPath, 'User')
            Write-Info "Variável de usuário 'FFMPEG_PATH' definida para: $ffmpegPath"
            Write-Info "OBS: para que apps já abertos vejam a variável, abra um novo terminal ou reinicie o Windows." 
        } catch {
            Write-Warn "Falha ao definir variável de ambiente: $_"
        }
    }
}

# 5) Start server in detached process
$startNow = Read-Host "Deseja iniciar o servidor agora em background? (S/N)"
if ($startNow.ToUpper() -eq 'S' -or $startNow.ToUpper() -eq 'Y') {
    Write-Info "Iniciando servidor em background (npm start)..."
    try {
        $startProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm start' -WorkingDirectory $serverDir -WindowStyle Minimized -PassThru
        Write-Info "Servidor iniciado com PID: $($startProc.Id). Para ver logs, cheque a janela do processo ou rode 'npm start' manualmente em um terminal.";
    } catch {
        Write-Err "Falha ao iniciar o servidor: $_"
    }
} else {
    Write-Info "Pulei iniciar o servidor agora. Você pode iniciar manualmente com:\ncd "$serverDir"\nnpm start"
}

# 6) Optionally register scheduled task (requires elevation)
$doInstall = Read-Host "Deseja registrar o servidor para iniciar automaticamente no logon (requer Admin)? (S/N)"
if ($doInstall.ToUpper() -eq 'S' -or $doInstall.ToUpper() -eq 'Y') {
    # Attempt to run install-service.ps1 elevated
    $installScript = Join-Path -Path $serverDir -ChildPath 'install-service.ps1'
    if (Test-Path $installScript) {
        try {
            Write-Info "Tentando executar o instalador com elevação (pode pedir confirmação UAC)..."
            Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$installScript`"" -Verb RunAs -Wait
            Write-Info "install-service.ps1 finalizado (se foi executado com sucesso, tarefa registrada)."
        } catch {
            Write-Warn "Falha ao executar install-service.ps1 com elevação: $_"
            Write-Info "Você pode executar manualmente como Administrador: PowerShell -NoProfile -ExecutionPolicy Bypass -File \"$installScript\""
        }
    } else {
        Write-Warn "install-service.ps1 não encontrado no diretório do servidor.";
    }
}

Write-Info "Bootstrap concluído.";

# EOF
