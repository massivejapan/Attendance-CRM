$nodeDir = "C:\Program Files\nodejs"
$env:PATH = "$nodeDir;$env:PATH"

& "$nodeDir\npm.cmd" install pg --save-dev --no-audit
& "$nodeDir\node.exe" scripts/test-pg.js
