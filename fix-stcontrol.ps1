$lines = Get-Content 'public\stcontrol.html' -Encoding UTF8
$newLines = @()
$skip = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'EVENT LISTENERS DE BROADCAST' -and $i -gt 1700) {
        $skip = $true
        continue
    }
    if ($skip -and $lines[$i] -match 'Event listeners para controles de display especiais') {
        $skip = $false
    }
    if (-not $skip) {
        $newLines += $lines[$i]
    }
}

$newLines | Set-Content 'public\stcontrol.html' -Encoding UTF8
Write-Host "Fixed! Removed duplicate event listeners section."
