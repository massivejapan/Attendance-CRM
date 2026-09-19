$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Node version: $(& "$nodeDir\node.exe" -v)"
Write-Host "NPM version: $(& "$nodeDir\npm.cmd" -v)"

Write-Host "Running npm install with clean paths..."
& "$nodeDir\npm.cmd" install --no-audit --prefer-offline
