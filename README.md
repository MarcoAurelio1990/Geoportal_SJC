# Geoportal de São José do Calçado

**Versão Beta 1.0 · 2026**

Plataforma WebGIS municipal para visualização, consulta, análise e exportação de dados territoriais, ambientais, rurais, viários, hidrográficos e de uso e cobertura da terra do município de São José do Calçado, Espírito Santo.

---

## Objetivo

O Geoportal de São José do Calçado foi desenvolvido para:

- Integrar dados geoespaciais municipais em uma plataforma interativa única;
- Apoiar o planejamento territorial e a tomada de decisão;
- Apoiar a gestão ambiental municipal;
- Facilitar o acesso público às informações geográficas do município;
- Servir como base técnica para futuras expansões e integrações de dados.

---

## Tecnologias Utilizadas

| Tecnologia | Descrição |
|---|---|
| HTML5 | Estrutura da interface |
| CSS3 | Estilos e layout responsivo |
| JavaScript | Lógica da aplicação e interações do mapa |
| [Leaflet 1.9.4](https://leafletjs.com) | Biblioteca de mapas interativos (incluída localmente) |
| [proj4js](https://proj4js.org) | Transformação de sistemas de coordenadas (incluída localmente) |
| [jsPDF 3.x](https://github.com/parallax/jsPDF) | Geração de PDF cartográfico (incluída localmente) |
| [html2canvas](https://html2canvas.hertzen.com) | Captura de painéis para imagem (incluída localmente) |
| GeoJSON | Formato de dados vetoriais |
| [QGIS](https://qgis.org) | Processamento e organização dos dados geoespaciais |
| [GDAL](https://gdal.org) | Conversão e processamento de rasters |
| Python 3 | Scripts de cálculo de estatísticas por camada |
| PowerShell | Scripts de geração de dados e rasters |

> Todas as bibliotecas JavaScript (`Leaflet`, `proj4js`, `jsPDF`, `html2canvas`) estão incluídas localmente em `js/libs/`, sem dependência de CDN externo.

---

## Estrutura de Pastas

```
Geoportal_SJC/
│
├── index.html                          # Página principal do Geoportal
│
├── css/
│   └── style.css                       # Estilos da interface
│
├── js/
│   ├── libs/                           # Bibliotecas locais (Leaflet, jsPDF, html2canvas, proj4js)
│   ├── config.js                       # Configuração das camadas (LAYER_CONFIG, grupos, estilos)
│   ├── map.js                          # Lógica principal do mapa e ferramentas
│   ├── geodata.js                      # Dados vetoriais compilados (gerado por gerar_dados.ps1)
│   ├── geodata_car_mapbiomas.js        # Estatísticas MapBiomas por imóvel CAR
│   ├── geodata_distrito_mapbiomas.js   # Estatísticas MapBiomas por distrito
│   └── geodata_distrito_stats.js       # Estatísticas territoriais por distrito
│
├── Raster/                             # Imagens raster em PNG (e TIF originais)
│   ├── Hillshade_SJC.png
│   ├── Hipsometria_SJC.png
│   ├── Declividade_SJC.png
│   ├── Declividade_Plano.png           # Classes individuais de declividade
│   ├── Declividade_Suave.png
│   ├── Declividade_Ondulado.png
│   ├── Declividade_Forte.png
│   ├── Declividade_Montanhoso.png
│   ├── Declividade_Escarpado.png
│   ├── MapBiomas_2024.png
│   ├── MapBiomas_Classe_*.png          # Classes individuais MapBiomas
│   └── _color_*.txt                    # Paletas de cores para geração dos rasters
│
├── Vetor/                              # GeoJSON originais (fonte para geração de geodata.js)
│   ├── SJC.geojson
│   ├── Distritos.geojson
│   ├── Logradouro.geojson
│   ├── DER_RODOVIA_SJCA.geojson
│   ├── DNIT_RODOVIA_SJCA_CLIP.geojson
│   ├── Trecho_Drenagem_clip.geojson
│   ├── Educacao.geojson
│   ├── Saude.geojson
│   ├── Seguranca.geojson
│   ├── ADM_PUBLICA.geojson
│   ├── Bancos.geojson
│   ├── Turismo_Culturas.geojson
│   ├── Imoveis_Rurais_CAR.geojson
│   ├── Vegetação_Nativa.geojson
│   ├── Reserva_Legal_Averbada.geojson
│   ├── Reserva_Legal_Proposta.geojson
│   ├── Curvas_Nivel_50m_WGS84.geojson
│   ├── ESTADOS_BRASIL.geojson          # Usado no minimapa
│   └── ES_MUNICIPIOS.geojson           # Usado no minimapa
│
├── Estilos_qml/                        # Estilos QGIS para camadas raster (.qml)
├── Estilos_qmd/                        # Estilos QGIS para camadas vetoriais (.qmd)
│
├── assets/
│   └── img/                            # Imagens da interface (splash, minimapa)
│
├── gerar_dados.ps1                     # Gera js/geodata.js a partir dos GeoJSON
├── gerar_rasters.ps1                   # Converte/exporta rasters TIF para PNG
├── gerar_minimapa.ps1                  # Gera a imagem base do minimapa
├── gerar_car_mapbiomas.py              # Calcula estatísticas MapBiomas por imóvel CAR
├── gerar_distrito_mapbiomas.py         # Calcula MapBiomas por distrito
├── gerar_distrito_stats.py             # Calcula estatísticas territoriais por distrito
│
├── iniciar_servidor.bat                # Inicia servidor local HTTP (duplo clique no Windows)
├── iniciar_servidor.ps1                # Versão PowerShell do servidor local
│
└── README.md
```

---

## Como Executar Localmente

O Geoportal é uma aplicação estática, mas requer um servidor HTTP local para funcionar corretamente. O protocolo `file://` do navegador impõe restrições que afetam o carregamento de arquivos e a exportação PDF.

### Procedimento recomendado

1. Abra a pasta do projeto no Windows Explorer.
2. Execute o arquivo:
   ```
   iniciar_servidor.bat
   ```
3. Abra o endereço indicado no terminal — normalmente `http://localhost:8000` — no navegador.

### Por que usar servidor local?

- Carregamento correto de todos os arquivos (GeoJSON, rasters, scripts);
- Evita as restrições de segurança do protocolo `file://`;
- Garante funcionamento completo da exportação PDF com mapa base e rasters;
- Necessário para testar o projeto antes de publicar online.

> O `iniciar_servidor.bat` executa `python -m http.server` automaticamente. Requer Python 3 instalado no sistema.

---

## Funcionalidades Implementadas

### Interface e Navegação
- Tela inicial (splash) com imagem aérea e estatísticas do município
- Cabeçalho institucional com nome e localização
- Sidebar de camadas com grupos recolhíveis e controle individual por camada
- Busca global — pesquisa sobre todos os dados vetoriais ativos
- Barra de status com coordenadas em tempo real e escala aproximada
- Minimapa de localização (canto inferior direito)
- Rosa dos ventos (norte)
- Legenda dinâmica — atualizada automaticamente conforme as camadas ativas
- Modal "Sobre o Geoportal" com informações, fontes e links clicáveis

### Mapas Base
- **OpenStreetMap** (padrão)
- **Esri World Imagery** (satélite)
- **CartoDB Positron** (cinza)
- **Esri World Topo Map** (topográfico)

### Camadas e Visualização
- Estilização automática por camada com estilos definidos em `config.js`
- Destaque visual da feição selecionada (highlight)
- Foco visual em imóveis rurais CAR (spotlight com máscara de escurecimento e moldura dourada)
- Adaptação automática do estilo do CAR conforme o mapa base ativo:
  - Preenchimento colorido por situação (conformidade / regularização / aguardando) sobre OSM e CartoDB
  - Somente bordas sobre satélite Esri ou MapBiomas ativo
- Legenda do CAR adaptativa conforme o mapa base

### Painéis de Atributos
- Painel arrastável ao clicar em qualquer feição vetorial
- Painel do município — estatísticas territoriais e ambientais gerais
- Painel por distrito — área, cobertura vegetal, uso da terra e dados CAR por distrito
- Painel por imóvel rural CAR — situação, área declarada, sobreposições ambientais

### Ferramentas
- **Medição de área** — polígono interativo com resultado em hectares/km²
- **Medição de distância** — linha interativa com resultado em metros/km
- **Ir para coordenadas** — localização por lat/lng ou coordenadas UTM

### Exportação
- **Exportar como PNG** — captura o mapa com vetores e overlays configuráveis
- **Exportar PDF cartográfico** — layout A4 paisagem com:
  - Imagem do mapa (com ou sem rasters, conforme ambiente)
  - Painel lateral com cabeçalho institucional, título temático automático, informações técnicas, camadas ativas e legenda cartográfica vetorial limpa
  - Escala gráfica e rosa dos ventos
  - Minimapa de localização
  - Caixa de fonte e rodapé institucional
  - Painéis de atributos opcionais

---

## Camadas Disponíveis

### Limites Administrativos
| Camada | Tipo | Fonte |
|---|---|---|
| Município de São José do Calçado | Polígono | IBGE |
| Distritos | Polígono | Municipal |

### Sistema Viário
| Camada | Tipo | Fonte |
|---|---|---|
| Logradouros | Linha | OpenStreetMap |
| Rodovias Estaduais (DER-ES) | Linha | DER-ES |
| Rodovias Federais (DNIT) | Linha | DNIT |

### Hidrografia
| Camada | Tipo | Fonte |
|---|---|---|
| Trechos de Drenagem | Linha | IBGE / ANA |

### Serviços Públicos
| Camada | Tipo | Fonte |
|---|---|---|
| Educação | Ponto | OSM / Municipal |
| Saúde | Ponto | OSM / Municipal |
| Segurança | Ponto | OSM / Municipal |
| Administração Pública | Ponto | OSM / Municipal |
| Bancos | Ponto | OpenStreetMap |
| Turismo e Cultura | Ponto | OSM / Municipal |

### Meio Rural e Ambiental
| Camada | Tipo | Fonte |
|---|---|---|
| Imóveis Rurais (CAR) | Polígono | SICAR |
| Vegetação Nativa | Polígono | Municipal / SIG |
| Reserva Legal Averbada | Polígono | SICAR |
| Reserva Legal Proposta | Polígono | SICAR |

### Relevo
| Camada | Tipo | Fonte |
|---|---|---|
| Hillshade | Raster PNG | SRTM / GDAL |
| Hipsometria | Raster PNG | SRTM / GDAL |
| Declividade (7 classes) | Raster PNG | SRTM / GDAL |
| Curvas de Nível (50 m) | Linha | SRTM / QGIS |

### Uso e Cobertura da Terra
| Camada | Tipo | Fonte |
|---|---|---|
| MapBiomas 2024 (10 classes) | Raster PNG | Projeto MapBiomas |

---

## Como Gerar ou Atualizar os Dados

Os arquivos JavaScript de dados (`js/geodata*.js`) são **gerados automaticamente** — não devem ser editados manualmente.

### Scripts de geração

| Script | Linguagem | Função |
|---|---|---|
| `gerar_dados.ps1` | PowerShell | Lê todos os GeoJSON em `Vetor/` e gera `js/geodata.js` com os dados vetoriais embutidos como variáveis JavaScript |
| `gerar_rasters.ps1` | PowerShell | Converte os TIF originais em PNG otimizados usando as paletas de cores definidas nos arquivos `_color_*.txt` em `Raster/` |
| `gerar_minimapa.ps1` | PowerShell | Gera a imagem base do minimapa a partir dos GeoJSON de estados e municípios do ES |
| `gerar_car_mapbiomas.py` | Python 3 | Cruza cada imóvel rural (CAR) com o raster MapBiomas 2024 e gera `js/geodata_car_mapbiomas.js` |
| `gerar_distrito_mapbiomas.py` | Python 3 | Cruza cada distrito com o raster MapBiomas e gera `js/geodata_distrito_mapbiomas.js` |
| `gerar_distrito_stats.py` | Python 3 | Calcula estatísticas territoriais por distrito (área, vegetação, CAR, etc.) e gera `js/geodata_distrito_stats.js` |

### Executar scripts Python

```bash
# Instalar dependências (uma vez)
pip install geopandas rasterio numpy shapely

# Executar (na pasta do projeto)
python gerar_car_mapbiomas.py
python gerar_distrito_mapbiomas.py
python gerar_distrito_stats.py
```

### Executar scripts PowerShell

```powershell
# Na pasta do projeto, via PowerShell
.\gerar_dados.ps1
.\gerar_rasters.ps1
.\gerar_minimapa.ps1
```

---

## Como Publicar Online

O Geoportal é **100% estático** — não requer servidor back-end, banco de dados ou linguagem server-side.

### Plataformas compatíveis

- [GitHub Pages](https://pages.github.com)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- Servidor web próprio (Apache, Nginx, etc.)

### Checklist antes de publicar

- [ ] Testar localmente via `iniciar_servidor.bat` antes do deploy
- [ ] Confirmar que `js/geodata.js` está gerado e atualizado
- [ ] Confirmar que as pastas `assets/`, `css/`, `js/`, `Raster/` estão no deploy
- [ ] Os arquivos `.tif` originais **não precisam** ser publicados — apenas os `.png` em `Raster/` são usados
- [ ] Os GeoJSON em `Vetor/` **não precisam** ser publicados — os dados estão embutidos em `js/geodata.js`
- [ ] Verificar caminhos relativos em HTML e JS após o deploy

### Exemplo: publicar no GitHub Pages

```bash
git init
git add .
git commit -m "Geoportal SJC - Beta 1.0"
git branch -M main
git remote add origin https://github.com/usuario/geoportal-sjc.git
git push -u origin main
# Ativar GitHub Pages nas configurações do repositório (Source: branch main, pasta /)
```

---

## Fontes dos Dados

| Fonte | Dados utilizados |
|---|---|
| [IBGE](https://www.ibge.gov.br) | Limite municipal, malha de municípios do ES, hidrografia |
| [OpenStreetMap](https://www.openstreetmap.org) | Logradouros, pontos de serviços públicos, bancos |
| [Projeto MapBiomas](https://mapbiomas.org) | Raster de uso e cobertura da terra 2024 (10 classes) |
| [SICAR](https://www.car.gov.br) | Imóveis rurais, reserva legal averbada e proposta |
| [DER-ES](https://der.es.gov.br) | Rodovias estaduais do Espírito Santo |
| [DNIT](https://www.gov.br/dnit) | Rodovias federais |
| SRTM (NASA) | Modelo digital de elevação — base para hillshade, hipsometria e declividade |
| Bases municipais | Distritos administrativos, pontos de serviços complementares |
| Processamentos próprios | Curvas de nível, declividade por classes, vegetação nativa |

---

## Limitações Conhecidas

- **Versão Beta** — pode conter comportamentos a refinar antes da publicação definitiva;
- **Interface otimizada para desktop** — experiência em dispositivos móveis é funcional, mas não totalmente adaptada;
- **Mapas base dependem de conexão à internet** — OpenStreetMap, Esri e CartoDB requerem acesso à rede;
- **Exportação PDF com rasters e mapa base** requer servidor local (restrição de segurança do protocolo `file://`);
- **Desempenho com muitas camadas simultâneas** pode ser aprimorado com simplificação de geometrias em versões futuras;
- **Responsividade mobile** será aprimorada em versões futuras.

---

## Próximas Melhorias Previstas

- [ ] Aprimorar responsividade mobile e tablets;
- [ ] Otimizar tamanho dos rasters para publicação web;
- [ ] Adicionar metadados por camada (data de referência, resolução, sistema de coordenadas);
- [ ] Adicionar função de download de dados por camada (GeoJSON / CSV);
- [ ] Novos módulos de análise espacial;
- [ ] Integração com dados municipais atualizados;
- [ ] Melhoria de desempenho em dispositivos com baixa capacidade de memória.

---

## Créditos

**Desenvolvimento, organização dos dados, processamento geoespacial e estruturação da plataforma:**

Marco Bortolini

**Contato e redes:**  
[linktr.ee/marcosabortolini](https://linktr.ee/marcosabortolini)

**Ano:** 2026

---

*Geoportal de São José do Calçado · Beta 1.0 · Espírito Santo · Brasil*
