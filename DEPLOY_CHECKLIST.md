# Checklist de Deploy — Geoportal SJC · Beta 1.0

## Incluir no pacote de publicação

### Arquivos raiz
- [x] `index.html`
- [x] `README.md` _(opcional — não afeta o funcionamento)_

### Estilos
- [x] `css/style.css`

### JavaScript
- [x] `js/config.js`
- [x] `js/map.js`
- [x] `js/geodata.js`
- [x] `js/geodata_car_mapbiomas.js`
- [x] `js/geodata_distrito_stats.js`
- [x] `js/geodata_distrito_mapbiomas.js`

### Bibliotecas locais
- [x] `js/libs/proj4.min.js`
- [x] `js/libs/html2canvas.min.js`
- [x] `js/libs/jspdf.umd.min.js`

> **Atenção:** Leaflet (CSS + JS) e Font Awesome são carregados via CDN externo.
> Para deploy offline ou robusto, baixar os arquivos abaixo e atualizar os `<link>`/`<script>` no `index.html`:
> - `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` → `js/libs/leaflet.css`
> - `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` → `js/libs/leaflet.js`
> - `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css` + pasta `webfonts/` → `js/libs/`

### Imagens e assets
- [x] `assets/img/Geo_Portal_2.jpg`
- [x] `assets/img/Marco_Bortolini.png`
- [x] `assets/img/SJC_drone3.jpg`
- [x] `assets/img/localizaxcao.png`

### Rasters (PNG apenas)
- [x] `Raster/Hillshade_SJC.png`
- [x] `Raster/Hipsometria_SJC.png`
- [x] `Raster/MapBiomas_2024.png`
- [x] `Raster/MapBiomas_Classe_3.png`
- [x] `Raster/MapBiomas_Classe_9.png`
- [x] `Raster/MapBiomas_Classe_12.png`
- [x] `Raster/MapBiomas_Classe_15.png`
- [x] `Raster/MapBiomas_Classe_21.png`
- [x] `Raster/MapBiomas_Classe_24.png`
- [x] `Raster/MapBiomas_Classe_25.png`
- [x] `Raster/MapBiomas_Classe_31.png`
- [x] `Raster/MapBiomas_Classe_33.png`
- [x] `Raster/MapBiomas_Classe_36.png`
- [x] `Raster/Declividade_Plano.png`
- [x] `Raster/Declividade_Suave.png`
- [x] `Raster/Declividade_Ondulado.png`
- [x] `Raster/Declividade_Forte.png`
- [x] `Raster/Declividade_Montanhoso.png`
- [x] `Raster/Declividade_Escarpado.png`

---

## NÃO incluir no pacote de publicação

### Dados-fonte (já embutidos em geodata.js)
- [ ] `Vetor/` _(pasta inteira)_

### Rasters originais e metadados
- [ ] `Raster/*.tif` _(arquivos GeoTIFF originais)_
- [ ] `Raster/*.tif.aux.xml` _(metadados GDAL)_
- [ ] `Raster/*.png.aux.xml` _(metadados GDAL dos PNGs)_
- [ ] `Raster/_color_*.txt` _(tabelas de cor GDAL)_

### Scripts de geração de dados
- [ ] `gerar_dados.ps1`
- [ ] `gerar_minimapa.ps1`
- [ ] `gerar_distrito_mapbiomas.py`
- [ ] `gerar_distrito_stats.py`

### Scripts de servidor local
- [ ] `iniciar_servidor.bat`
- [ ] `iniciar_servidor.ps1`

### Metadados QGIS
- [ ] `*.qmd` _(em qualquer pasta)_

### Pastas de backup e desenvolvimento
- [ ] `_backup_orfaos/` _(pasta inteira)_

### Imagens não referenciadas
- [ ] `assets/img/SJC_drone.jpeg`
- [ ] `assets/img/SJC_drone2.jpg`
- [ ] `assets/img/minimapa_es_sjc.png`
- [ ] `assets/img/minimapa_es_certo.png`
- [ ] `assets/img/minimapa_es_certo_2.png`
- [ ] `assets/img/minimapa_es_certo_3.png`
- [ ] `assets/img/geoportal_sjc_mapa_*.pdf` _(PDFs exportados)_
- [ ] `assets/img/Geo_Portal.png` _(versão antiga do ícone)_

---

## Riscos conhecidos antes da publicação

| Risco | Detalhe | Mitigação |
|---|---|---|
| Leaflet e Font Awesome via CDN | Sem internet o app não abre | Baixar e servir localmente (ver seção acima) |
| geodata.js com 26 MB | Carregamento lento em servidor online | Previsto para otimização na v1.1 |
| PDF com Esri Imagery | Mapa pode ficar em branco no PDF | Aviso exibido no modal antes da exportação |
| Basemaps dependem de CDN externo | Tiles não carregam sem internet | Comportamento esperado; informar usuário |
