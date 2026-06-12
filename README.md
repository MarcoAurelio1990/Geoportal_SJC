# Geoportal — São José do Calçado (ES)

WebGIS municipal desenvolvido com Leaflet, OpenStreetMap e Esri World Imagery.

---

## Por que não abrir o index.html diretamente?

Ao abrir `index.html` com duplo clique no Windows, o navegador usa o protocolo `file://`.
Nesse modo, o navegador bloqueia requisições `fetch()` para arquivos locais por política de
segurança (CORS), impedindo o carregamento dos GeoJSON da pasta `Vetor/`.

A solução é sempre servir o projeto via um servidor HTTP local (`http://localhost/...`).

---

## Como executar localmente

Escolha **uma** das opções abaixo. Todas iniciam um servidor na pasta do projeto.

---

### Opção 1 — Python (recomendado, sem instalação adicional)

Se tiver Python instalado:

```bash
# Python 3
python -m http.server 8000

# Python 2 (legado)
python -m SimpleHTTPServer 8000
```

Acesse: [http://localhost:8000](http://localhost:8000)

---

### Opção 2 — Node.js / npx

Se tiver Node.js instalado (não requer instalação de pacote):

```bash
npx serve .
```

Ou com `http-server`:

```bash
npx http-server . -p 8000
```

Acesse: [http://localhost:8000](http://localhost:8000)

---

### Opção 3 — PowerShell (Windows, sem dependências)

Execute no terminal, dentro da pasta do projeto:

```powershell
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()
Write-Host "Servidor iniciado em http://localhost:8000 — pressione Ctrl+C para parar"
$root = (Get-Location).Path
$mimes = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript"
  ".json"="application/json"; ".geojson"="application/json"
}
while ($listener.IsListening) {
  $ctx  = $listener.GetContext()
  $req  = $ctx.Request; $res = $ctx.Response
  $path = $req.Url.LocalPath -replace '/', '\'
  if ($path -eq '\') { $path = '\index.html' }
  $file = Join-Path $root $path.TrimStart('\')
  if (Test-Path $file -PathType Leaf) {
    $ext  = [IO.Path]::GetExtension($file).ToLower()
    $mime = if ($mimes[$ext]) { $mimes[$ext] } else { "application/octet-stream" }
    $bytes = [IO.File]::ReadAllBytes($file)
    $res.ContentType = $mime; $res.ContentLength64 = $bytes.Length
    $res.Headers.Add("Access-Control-Allow-Origin","*")
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $res.StatusCode = 404 }
  $res.Close()
}
```

Acesse: [http://localhost:8000](http://localhost:8000)

---

### Opção 4 — VS Code (Live Server)

1. Instale a extensão **Live Server** (Ritwick Dey) no VS Code.
2. Abra a pasta `Geoportal_SJC` no VS Code.
3. Clique com o botão direito em `index.html` → **Open with Live Server**.

O navegador abrirá automaticamente em `http://127.0.0.1:5500`.

---

### Opção 5 — QGIS (servidor embutido)

O QGIS possui um servidor HTTP simples acessível em:
**Plugins → Python Console** e também via QGIS Server para publicação mais avançada.
Para uso rápido, prefira as opções acima.

---

## Estrutura de arquivos

```
Geoportal_SJC/
├── index.html              # Ponto de entrada da aplicação
├── css/
│   └── style.css           # Layout, painel lateral, popup, legenda
├── js/
│   ├── config.js           # Definição de camadas, estilos e grupos
│   └── map.js              # Lógica do mapa, painel e controles
├── Vetor/                  # Camadas vetoriais (GeoJSON)
├── Raster/                 # Camadas raster (GeoTIFF) — implementação futura
├── Estilos_qmd/            # Estilos QGIS para camadas vetoriais
└── Estilos_qml/            # Estilos QGIS para camadas raster
```

---

## Camadas disponíveis (etapa vetorial)

| Grupo | Camada |
|---|---|
| Limites Administrativos | Município de São José do Calçado, Distritos (4) |
| Infraestrutura | Logradouros, Rodovias Estaduais (DER), Rodovias Federais (DNIT) |
| Hidrografia | Trechos de Drenagem |
| Serviços Públicos | Educação, Saúde, Segurança, Adm. Pública, Bancos, Turismo e Cultura |
| Meio Rural e Ambiental | Imóveis Rurais (CAR), Vegetação Nativa, Reserva Legal Averbada, Reserva Legal Proposta |

---

## Tecnologias

- [Leaflet 1.9.4](https://leafletjs.com/) — biblioteca de mapas interativos
- [OpenStreetMap](https://www.openstreetmap.org/) — mapa base cartográfico
- [Esri World Imagery](https://www.arcgis.com/) — mapa base de imagens de satélite
- HTML5 / CSS3 / JavaScript puro — sem frameworks ou bundlers
