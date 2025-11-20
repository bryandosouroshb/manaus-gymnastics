<#
 Run this script as Administrator to create a scheduled task that starts the RTMP proxy at user logon.
 Usage (PowerShell as Admin):
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\install-service.ps1
#>

# Ensure running as Administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Este script precisa ser executado como Administrador. Abra o PowerShell como Administrador e rode novamente." -ForegroundColor Yellow
    exit 1
}

$taskName = "manaus-rtmp-proxy"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Creating scheduled task '$taskName' to start server at user logon (path: $scriptDir)..."

try {
    # Prefer using ScheduledTasks cmdlets (available on modern Windows)
    if (Get-Command -Name New-ScheduledTaskAction -ErrorAction SilentlyContinue) {
        Write-Host "Using ScheduledTasks cmdlets to register task..."

        # If a task exists, unregister it first
        if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
            Write-Host "Task already exists. Unregistering existing task..."
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        }

        $action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c cd /d `"$scriptDir`" && npm start"
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -RunLevel Highest -Force

        Write-Host "Scheduled task created via ScheduledTasks cmdlets. The RTMP proxy will start at user logon." -ForegroundColor Green
    } else {
        Write-Host "ScheduledTasks cmdlets not available; falling back to schtasks.exe"

        # If task exists, remove it first
        $exists = schtasks /Query /TN $taskName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Task already exists. Deleting existing task..."
            schtasks /Delete /TN $taskName /F | Out-Null
        }

        # Build the command string properly quoted for schtasks
        $escapedPath = $scriptDir -replace '"','\"'
        # Build the TR argument safely using concatenation to avoid nested parsing
        $tr = 'cmd /c "cd /d ' + $escapedPath + ' && npm start"'
        $cmd = 'schtasks /Create /SC ONLOGON /RL HIGHEST /TN "' + $taskName + '" /TR "' + $tr + '" /F'

        Invoke-Expression $cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Scheduled task created via schtasks. The RTMP proxy will start at user logon." -ForegroundColor Green
        } else {
            Write-Host "schtasks exited with code $LASTEXITCODE. Task may not have been created." -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Failed to create scheduled task: $_" -ForegroundColor Red
}
