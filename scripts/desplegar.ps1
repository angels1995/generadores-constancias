param([string]$Rama = 'trabajo/generadores')
$ErrorActionPreference = 'Stop'
if ($Rama -notmatch '^[a-zA-Z0-9][a-zA-Z0-9/_-]*$') { throw 'Nombre de rama no permitido.' }
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sshKey = Join-Path $env:USERPROFILE '.ssh\generadores-vps'
if (!(Test-Path -LiteralPath $sshKey)) { throw 'No se encuentra la llave SSH local de generadores.' }
Push-Location $projectRoot
try {
    $pending = & git status --porcelain
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo revisar Git.' }
    if ($pending) { throw 'Hay cambios locales pendientes. Revísalos, haz commit y push antes de desplegar. No se sobrescribió nada.' }
    & git fetch origin $Rama
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar la rama publicada.' }
    $localCommit = & git rev-parse HEAD
    $publishedCommit = & git rev-parse "origin/$Rama"
    if ($localCommit -ne $publishedCommit) { throw 'Tu commit local no coincide con la rama publicada. Revisa y publica antes de desplegar.' }
    $remoteDir = (& ssh -i $sshKey -o BatchMode=yes root@62.171.156.216 'mktemp -d /tmp/generadores-deploy.XXXXXXXX').Trim()
    if ($LASTEXITCODE -ne 0 -or $remoteDir -notmatch '^/tmp/generadores-deploy\.[a-zA-Z0-9]+$') { throw 'No se pudo preparar el despliegue remoto.' }
    & scp -i $sshKey -o BatchMode=yes (Join-Path $PSScriptRoot 'desplegar-servidor.sh') "root@62.171.156.216:$remoteDir/deploy.sh"
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo enviar el script de despliegue.' }
    & ssh -i $sshKey -o BatchMode=yes root@62.171.156.216 "bash $remoteDir/deploy.sh $Rama $localCommit"
    if ($LASTEXITCODE -ne 0) { throw 'El servidor detuvo o revirtió el despliegue. Revisa su salida.' }
} finally { Pop-Location }
