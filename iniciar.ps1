Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Plataforma DondeE (Full-Stack)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "Iniciando Backend en :3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\DondeE - BE'; npm run dev"

Write-Host "Iniciando Frontend en :5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\DondeE - FE'; npm run dev"

Write-Host "Abriendo http://localhost:5173 ..." -ForegroundColor Magenta
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
