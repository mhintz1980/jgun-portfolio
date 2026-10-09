# Detached starter for the isolated diagnostic preview (parent runtime use).
# Serves ONLY .scratch/quality-diagnostic-dist on 127.0.0.1:5204 (strict).
# Port 4174 is the frozen baseline in active use - never touch it.
$prev = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npx vite preview --outDir .scratch/quality-diagnostic-dist --port 5204 --host 127.0.0.1 --strictPort > .scratch\quality-diagnostic-build-logs\preview-5204.log 2>&1' -WorkingDirectory 'C:/Users/Markimus/.buzz/REPOS/jgun-portfolio' -WindowStyle Hidden -PassThru
"PREVIEW_PID=" + $prev.Id
