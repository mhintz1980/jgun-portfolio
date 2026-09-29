param([string]$Method = 'tools/list', [string]$ParamsFile, [int]$SingleBatchIndex = -1)
$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath (Join-Path $env:USERPROFILE '.claude.json') -Raw | ConvertFrom-Json
$server = $config.mcpServers.higgsfield
if (-not $server) { throw 'Higgsfield MCP configuration missing' }
$headers = @{'Accept'='application/json, text/event-stream'; 'Content-Type'='application/json'}
foreach ($prop in $server.headers.PSObject.Properties) { $headers[$prop.Name] = $prop.Value }
$params = if ($ParamsFile) { Get-Content -LiteralPath $ParamsFile -Raw | ConvertFrom-Json } else { @{} }
if ($SingleBatchIndex -ge 0) {
  $params = @{name='generate_video'; arguments=@{params=$params.arguments.requests[$SingleBatchIndex].params}}
}
$body = @{jsonrpc='2.0'; id=2; method=$Method; params=$params} | ConvertTo-Json -Depth 40 -Compress
$response = Invoke-WebRequest -Uri $server.url -Method Post -Headers $headers -Body $body -TimeoutSec 180
foreach ($line in ($response.Content -split "`n")) {
  if ($line.StartsWith('data: ')) { $line.Substring(6) }
}
