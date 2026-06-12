# ─────────────────────────────────────────────────────────────────────────────
# gerar_rasters.ps1
# Converte os rasters GeoTIFF para PNG georeferenciados em WGS84 (EPSG:4326),
# prontos para uso com L.imageOverlay no Leaflet (file:// sem servidor).
#
# Requer OSGeo4W instalado em C:\OSGeo4W (vem com QGIS).
# Execute este script apenas quando atualizar algum arquivo TIF.
# ─────────────────────────────────────────────────────────────────────────────

$root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$rasterDir = Join-Path $root "Raster"
$gdalwarp  = "C:\OSGeo4W\bin\gdalwarp.exe"
$gdaltrans = "C:\OSGeo4W\bin\gdal_translate.exe"
$gdaldem   = "C:\OSGeo4W\bin\gdaldem.exe"

if (-not (Test-Path $gdalwarp)) {
  Write-Error "gdalwarp.exe nao encontrado em C:\OSGeo4W\bin. Instale o QGIS / OSGeo4W."
  pause; exit 1
}

# ─── Raster cinza (Hillshade): reprojetar + escala para 8-bit ────────────────
function ConvertGray {
  param([string]$Name, [string]$Nodata, [string]$ScaleMin, [string]$ScaleMax)

  $tif  = Join-Path $rasterDir "$Name.tif"
  $temp = Join-Path $rasterDir "_tmp_$Name.tif"
  $png  = Join-Path $rasterDir "$Name.png"

  if (-not (Test-Path $tif)) { Write-Warning "Nao encontrado: $tif"; return }
  Write-Host "Convertendo $Name (cinza)..." -ForegroundColor Cyan

  & $gdalwarp -t_srs EPSG:4326 -dstalpha -srcnodata $Nodata -r bilinear -overwrite "$tif" "$temp"
  if ($LASTEXITCODE -ne 0) { Write-Error "Erro gdalwarp $Name"; return }

  & $gdaltrans -of PNG -ot Byte -scale_1 $ScaleMin $ScaleMax 0 255 "$temp" "$png"
  if ($LASTEXITCODE -ne 0) { Write-Error "Erro gdal_translate $Name"; return }

  [System.IO.File]::Delete($temp)
  $sz = [math]::Round((Get-Item $png).Length / 1KB, 0)
  Write-Host "  OK → $Name.png ($sz KB)" -ForegroundColor Green
}

# ─── Raster pseudocor (Hipsometria, Declividade, MapBiomas): gdaldem ─────────
function ConvertPseudocolor {
  param([string]$Name, [string]$Nodata, [string]$ColorFile)

  $tif    = Join-Path $rasterDir "$Name.tif"
  $step1  = Join-Path $rasterDir "_tmp1_$Name.tif"
  $step2  = Join-Path $rasterDir "_tmp2_$Name.tif"
  $png    = Join-Path $rasterDir "$Name.png"
  $colors = Join-Path $rasterDir $ColorFile

  if (-not (Test-Path $tif))    { Write-Warning "Nao encontrado: $tif"; return }
  if (-not (Test-Path $colors)) { Write-Warning "Nao encontrado: $colors"; return }
  Write-Host "Convertendo $Name (pseudocor)..." -ForegroundColor Cyan

  # Passo 1: Reprojetar para WGS84, mantendo NoData
  & $gdalwarp -t_srs EPSG:4326 -srcnodata $Nodata -dstnodata $Nodata -r bilinear -overwrite "$tif" "$step1"
  if ($LASTEXITCODE -ne 0) { Write-Error "Erro gdalwarp $Name"; return }

  # Passo 2: Aplicar tabela de cores + alpha para NoData
  & $gdaldem color-relief "$step1" "$colors" "$step2" -alpha
  if ($LASTEXITCODE -ne 0) { Write-Error "Erro gdaldem $Name"; return }

  # Passo 3: Salvar como PNG RGBA
  & $gdaltrans -of PNG "$step2" "$png"
  if ($LASTEXITCODE -ne 0) { Write-Error "Erro gdal_translate $Name"; return }

  [System.IO.File]::Delete($step1)
  [System.IO.File]::Delete($step2)
  $sz = [math]::Round((Get-Item $png).Length / 1KB, 0)
  Write-Host "  OK → $Name.png ($sz KB)" -ForegroundColor Green
}

# ─── Execução ────────────────────────────────────────────────────────────────
ConvertGray       -Name "Hillshade_SJC"   -Nodata "-9999" -ScaleMin "0" -ScaleMax "254.884"
ConvertPseudocolor -Name "Hipsometria_SJC" -Nodata "0"    -ColorFile "_color_hipsometria.txt"
# Declividade_SJC.png mantido como backup (não usado no Geoportal)
# ConvertPseudocolor -Name "Declividade_SJC" -Nodata "-9999" -ColorFile "_color_declividade.txt"

# Declividade – 6 classes individuais
ConvertPseudocolor -Name "Declividade_Plano"      -Nodata "-9999" -ColorFile "_color_decl_plano.txt"
ConvertPseudocolor -Name "Declividade_Suave"      -Nodata "-9999" -ColorFile "_color_decl_suave.txt"
ConvertPseudocolor -Name "Declividade_Ondulado"   -Nodata "-9999" -ColorFile "_color_decl_ondulado.txt"
ConvertPseudocolor -Name "Declividade_Forte"      -Nodata "-9999" -ColorFile "_color_decl_forte.txt"
ConvertPseudocolor -Name "Declividade_Montanhoso" -Nodata "-9999" -ColorFile "_color_decl_montanhoso.txt"
ConvertPseudocolor -Name "Declividade_Escarpado"  -Nodata "-9999" -ColorFile "_color_decl_escarpado.txt"

# MapBiomas: raster categórico, já em WGS84 — pipeline especial (sem gdalwarp)
# Executar manualmente: gdaldem color-relief -nearest_color_entry + gdal_translate -of PNG

Write-Host ""
Write-Host "Concluido! PNGs gerados em $rasterDir." -ForegroundColor Green
Write-Host ""
pause
