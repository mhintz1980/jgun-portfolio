param(
    [string]$BlenderPath = 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe',
    [string]$PythonPath = 'C:\Users\Markimus\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
)
$ErrorActionPreference = 'Stop'
& $BlenderPath -b --python-exit-code 1 --python (Join-Path $PSScriptRoot 'blockout.py')
if ($LASTEXITCODE -ne 0) { throw 'CAD camera blockout failed' }
& $PythonPath (Join-Path $PSScriptRoot 'compose_and_verify.py')
if ($LASTEXITCODE -ne 0) { throw 'Camera raster/projection checks failed' }
