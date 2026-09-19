$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Running Next.js build test..."
& "$nodeDir\npm.cmd" run build
