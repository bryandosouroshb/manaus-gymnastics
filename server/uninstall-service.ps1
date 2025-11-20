# Run this script as Administrator to remove the scheduled task created by install-service.ps1
# Usage: .\uninstall-service.ps1
$taskName = "manaus-rtmp-proxy"

Write-Host "Removing scheduled task '$taskName'..."

schtasks /Delete /TN $taskName /F
if ($LASTEXITCODE -eq 0) {
    Write-Host "Scheduled task removed." -ForegroundColor Green
} else {
    Write-Host "Failed to remove scheduled task or task did not exist." -ForegroundColor Yellow
}
