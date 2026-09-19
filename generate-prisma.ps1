$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Generating Prisma Client..."
& "$nodeDir\npx.cmd" prisma generate
