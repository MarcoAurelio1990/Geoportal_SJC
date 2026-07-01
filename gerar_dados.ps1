# ─────────────────────────────────────────────────────────────────────────────
# gerar_dados.ps1
# Lê todos os GeoJSON da pasta Vetor\ e gera js/geodata.js com os dados
# embutidos como variáveis JavaScript.
#
# Execute este script sempre que atualizar algum arquivo GeoJSON.
# Depois disso o index.html pode ser aberto diretamente no navegador
# sem precisar de servidor HTTP.
# ─────────────────────────────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$layers = @(
  @{ var="GEODATA_SJC";          file="Vetor\SJC.geojson" },
  @{ var="GEODATA_DISTRITOS";    file="Vetor\Distritos.geojson" },
  @{ var="GEODATA_LOGRADOURO";   file="Vetor\Logradouro.geojson" },
  @{ var="GEODATA_DER_RODOVIA";  file="Vetor\DER_RODOVIA_SJCA.geojson" },
  @{ var="GEODATA_DNIT_RODOVIA"; file="Vetor\DNIT_RODOVIA_SJCA_CLIP.geojson" },
  @{ var="GEODATA_DRENAGEM";     file="Vetor\Trecho_Drenagem_clip.geojson" },
  @{ var="GEODATA_EDUCACAO";     file="Vetor\Educacao.geojson" },
  @{ var="GEODATA_SAUDE";        file="Vetor\Saude.geojson" },
  @{ var="GEODATA_SEGURANCA";    file="Vetor\Seguranca.geojson" },
  @{ var="GEODATA_ADM_PUBLICA";  file="Vetor\ADM_PUBLICA.geojson" },
  @{ var="GEODATA_BANCOS";       file="Vetor\Bancos.geojson" },
  @{ var="GEODATA_TURISMO";      file="Vetor\Turismo_Culturas.geojson" },
  @{ var="GEODATA_CAR";          file="Vetor\Imoveis_Rurais_CAR.geojson" },
  @{ var="GEODATA_VEG_NATIVA";   file="Vetor\Vegetação_Nativa.geojson" },
  @{ var="GEODATA_RL_AVERBADA";  file="Vetor\Reserva_Legal_Averbada.geojson" },
  @{ var="GEODATA_RL_PROPOSTA";  file="Vetor\Reserva_Legal_Proposta.geojson" },
  @{ var="GEODATA_CURVAS_NIVEL";     file="Vetor\Curvas_Nivel_50m_WGS84.geojson" },
  @{ var="GEODATA_APP_TOTAL";       file="Vetor\APP_Total_SJC.geojson" },
  @{ var="GEODATA_APP_RIOS";        file="Vetor\APP_Rios_SJC.geojson" },
  @{ var="GEODATA_APP_NASCENTES";   file="Vetor\APP_Nascentes_SJC.geojson" },
  @{ var="GEODATA_APP_LAGOS";       file="Vetor\APP_Lagos_SJC.geojson" },
  @{ var="GEODATA_APP_DECLIVIDADE"; file="Vetor\APP_Declividade_SJC.geojson" }
)

$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine("// Dados GeoJSON embutidos — gerado automaticamente por gerar_dados.ps1")
$null = $sb.AppendLine("// Permite abrir index.html diretamente sem servidor HTTP")
$null = $sb.AppendLine("")

foreach ($layer in $layers) {
  $file = Join-Path $root $layer.file
  if (-not (Test-Path $file)) {
    Write-Warning "Arquivo não encontrado: $($layer.file) — ignorado."
    continue
  }
  Write-Host "Lendo $($layer.file)..."
  $json = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
  $null = $sb.AppendLine("var $($layer.var) = $json;")
  $null = $sb.AppendLine("")
}

$outPath = Join-Path $root "js\geodata.js"
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)

$size = [math]::Round((Get-Item $outPath).Length / 1MB, 1)
Write-Host ""
Write-Host "Concluido! js\geodata.js gerado com $size MB." -ForegroundColor Green
Write-Host "Agora voce pode abrir o index.html diretamente no navegador." -ForegroundColor Green
Write-Host ""
pause
