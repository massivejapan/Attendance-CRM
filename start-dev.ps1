$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Starting Next.js Dev Server on http://localhost:3000..."
& "$nodeDir\npm.cmd" run dev
