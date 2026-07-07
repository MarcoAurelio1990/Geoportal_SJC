# Geoportal SJC — Contexto do Projeto

## O que é este projeto
Geoportal interativo do município de **São José do Calçado — ES**, desenvolvido com Leaflet.js.
Publicado em: `https://geoportalsaojosedocalcado.vercel.app`
Repositório: `https://github.com/MarcoAurelio1990/Geoportal_SJC`

## Tecnologias
- **Leaflet.js** (CDN) — mapa interativo
- **Font Awesome** (CDN) — ícones
- **html2canvas + jsPDF** (local, em `js/libs/`) — exportação PDF
- **proj4.js** (local) — projeção cartográfica
- Hospedagem: **Vercel** (Hobby plan, gratuito, com compressão gzip)
- Backup: **GitHub Pages** (`https://marcoaurelio1990.github.io/Geoportal_SJC/`)

## Estrutura de arquivos principais
```
index.html               — página principal
css/style.css            — todos os estilos
js/config.js             — configuração de camadas (estilos, labels, popupCampos)
js/map.js                — lógica principal do mapa (~6000 linhas)
js/geodata.js            — dados vetoriais embutidos (~26 MB)
js/geodata_car_mapbiomas.js   — dados CAR e MapBiomas
js/geodata_distrito_stats.js  — estatísticas por distrito
js/geodata_distrito_mapbiomas.js — MapBiomas por distrito
js/libs/                 — bibliotecas locais (proj4, html2canvas, jsPDF)
Raster/                  — imagens PNG (Hillshade, Hipsometria, Declividade, MapBiomas)
assets/img/              — imagens da interface
```

## Camadas implementadas
### Limites Administrativos
- Limite Municipal (sjc)
- Distritos Administrativos

### Sistema Viário
- Rodovias DER Estaduais
- Vias Urbanas
- Estradas Vicinais

### Hidrografia
- Rios e Córregos

### Serviços Públicos
- Educação, Saúde, Segurança, Administração, Bancos, Turismo (pontos com ícones)

### Meio Rural e Ambiental
- APP Declarada (várias sub-camadas)
- CAR — Cadastro Ambiental Rural (com filtros e estatísticas)
- Vegetação Nativa / Reserva Legal

### Relevo
- Hillshade, Hipsometria, Declividade (6 classes), Curvas de Nível

### Uso e Cobertura da Terra
- MapBiomas 2024 (camada geral + 10 classes individuais)

## Funcionalidades implementadas
- Sidebar com grupos/subgrupos de camadas com checkboxes
- Legenda dinâmica (atualiza conforme camadas ativas)
- Minimapa de localização (ES + SJC)
- Busca de endereços (Nominatim/OpenStreetMap)
- Ferramentas de medição (distância e área)
- Exportação PDF com legenda
- Exportação KML por feição (botão no popup) e por camada (ícone na sidebar)
- Painel de estatísticas do município (arrastável)
- Painéis de estatísticas por distrito
- Filtros de CAR por situação
- Splash screen com indicadores do município
- Google Search Console configurado (indexado)

## Fluxo de atualização
1. Editar arquivos localmente em `E:\Acelerador_3M\WebGIS\Geoportal_SJC\`
2. Abrir **GitHub Desktop**
3. Escrever mensagem de commit e clicar **Commit to master**
4. Clicar **Push origin**
5. Vercel atualiza automaticamente em ~1 minuto

## Contas e acessos
- GitHub: `MarcoAurelio1990` (conta hotmail)
- Vercel: conta conectada ao GitHub (hotmail)
- Google Search Console: conta hotmail — propriedade `https://geoportalsaojosedocalcado.vercel.app`

## Decisões de arquitetura importantes
- `geodata.js` tem 26 MB — dados embutidos no JS, sem servidor backend
- Vercel comprime para ~5 MB na transferência (gzip)
- `distEstilo` em `buildDistrictSubgroup()` é hardcoded — NÃO lê de `config.js`
- `captureMapExport` é exposto como `window.captureMapExport` (usado pelo PDF)
- Rasters são PNGs com bounds fixos definidos em `config.js`
- `data-no-auto` em checkboxes exclui do toggle automático do grupo master

## Pendências / próximas versões (v1.1)
- Otimização do geodata.js (reduzir tamanho)
- Leaflet e Font Awesome locais (atualmente CDN)
- Exportação SHP (mais complexo que KML)
- Google Analytics para monitoramento de visitantes
- Rasters pendentes: Declividade PNG (já existe), MapBiomas 2024 PNG

## Versão atual
**Beta 1.0 · Julho de 2026**
