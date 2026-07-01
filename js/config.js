const GRUPOS = [
  'Limites Administrativos',
  'Sistema Viário',
  'Hidrografia',
  'Serviços Públicos',
  'Meio Rural e Ambiental',
  'Relevo',
  'Uso e Cobertura da Terra'
];

const LAYER_CONFIG = [
  // ── Limites Administrativos ─────────────────────────────────────────────────
  {
    id: 'sjc',
    varName: 'GEODATA_SJC',
    label: 'Município de São José do Calçado',
    grupo: 'Limites Administrativos',
    arquivo: 'Vetor/SJC.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#1E3A5F',
      weight: 4,
      opacity: 1,
      fill: false
    },
    popupCampos: [
      { campo: 'NM_MUN',   rotulo: 'Município' },
      { campo: 'SIGLA_UF', rotulo: 'UF' },
      { campo: 'CD_MUN',   rotulo: 'Código IBGE' },
      { campo: 'AREA_KM2', rotulo: 'Área (km²)' }
    ],
    visivel: true
  },
  {
    id: 'distritos',
    varName: 'GEODATA_DISTRITOS',
    label: 'Distritos',
    grupo: 'Limites Administrativos',
    arquivo: 'Vetor/Distritos.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#7E57C2',
      weight: 2,
      opacity: 1,
      fill: true,
      fillColor: '#7E57C2',
      fillOpacity: 0.10,
      dashArray: '8,4'
    },
    popupCampos: [
      { campo: 'NM_DIST', rotulo: 'Distrito' },
      { campo: 'NM_MUN',  rotulo: 'Município' },
      { campo: 'NM_UF',   rotulo: 'Estado' },
      { campo: 'CD_DIST', rotulo: 'Código' }
    ],
    visivel: false
  },

  // ── Sistema Viário ───────────────────────────────────────────────────────────
  {
    id: 'logradouro',
    varName: 'GEODATA_LOGRADOURO',
    label: 'Logradouros',
    grupo: 'Sistema Viário',
    arquivo: 'Vetor/Logradouro.geojson',
    tipo: 'line',
    estilo: {
      color: '#9E9E9E',
      weight: 1.5,
      opacity: 0.9
    },
    popupCampos: [
      { campo: 'NM_TIP_LOG', rotulo: 'Tipo' },
      { campo: 'NM_TIT_LOG', rotulo: 'Título' },
      { campo: 'NM_LOG',     rotulo: 'Nome' },
      { campo: 'TOT_RES',    rotulo: 'Total Residencial' },
      { campo: 'TOT_GERAL',  rotulo: 'Total Geral' }
    ],
    visivel: false
  },
  {
    id: 'der_rodovia',
    varName: 'GEODATA_DER_RODOVIA',
    label: 'Rodovias Estaduais (DER)',
    grupo: 'Sistema Viário',
    arquivo: 'Vetor/DER_RODOVIA_SJCA.geojson',
    tipo: 'line',
    estilo: {
      color: '#E67E22',
      weight: 3,
      opacity: 1
    },
    popupCampos: [
      { campo: 'SIGLA',     rotulo: 'Rodovia' },
      { campo: 'DESCRICAO', rotulo: 'Descrição' },
      { campo: 'SIT',       rotulo: 'Situação' },
      { campo: 'ADMIN',     rotulo: 'Administração' }
    ],
    visivel: false
  },
  {
    id: 'dnit_rodovia',
    varName: 'GEODATA_DNIT_RODOVIA',
    label: 'Rodovias Federais (DNIT)',
    grupo: 'Sistema Viário',
    arquivo: 'Vetor/DNIT_RODOVIA_SJCA_CLIP.geojson',
    tipo: 'line',
    estilo: {
      color: '#D32F2F',
      weight: 3,
      opacity: 1
    },
    popupCampos: [
      { campo: 'vl_br',      rotulo: 'Rodovia BR' },
      { campo: 'nm_tipo_tr', rotulo: 'Tipo' },
      { campo: 'ds_local_i', rotulo: 'Início' },
      { campo: 'ds_local_f', rotulo: 'Fim' },
      { campo: 'vl_extensa', rotulo: 'Extensão (km)' },
      { campo: 'ds_legenda', rotulo: 'Situação' }
    ],
    visivel: false
  },

  // ── Hidrografia ──────────────────────────────────────────────────────────────
  {
    id: 'drenagem',
    varName: 'GEODATA_DRENAGEM',
    label: 'Trechos de Drenagem',
    grupo: 'Hidrografia',
    arquivo: 'Vetor/Trecho_Drenagem_clip.geojson',
    tipo: 'line',
    estilo: {
      color: '#2196F3',
      weight: 2,
      opacity: 0.9
    },
    popupCampos: [
      { campo: 'nome',       rotulo: 'Nome' },
      { campo: 'regime',     rotulo: 'Regime' },
      { campo: 'navegabili', rotulo: 'Navegabilidade' },
      { campo: 'coincideco', rotulo: 'Coincide com' }
    ],
    visivel: false
  },

  // ── Serviços Públicos ────────────────────────────────────────────────────────
  {
    id: 'educacao',
    varName: 'GEODATA_EDUCACAO',
    label: 'Educação',
    grupo: 'Serviços Públicos',
    arquivo: 'Vetor/Educacao.geojson',
    tipo: 'point',
    estilo: { color: '#1565C0', radius: 7 },
    popupCampos: [
      { campo: 'Nome',       rotulo: 'Nome' },
      { campo: 'Tipo',       rotulo: 'Tipo' },
      { campo: 'Modalidade', rotulo: 'Modalidade' },
      { campo: 'Distrito',   rotulo: 'Distrito' },
      { campo: 'Endereço',   rotulo: 'Endereço' }
    ],
    visivel: false
  },
  {
    id: 'saude',
    varName: 'GEODATA_SAUDE',
    label: 'Saúde',
    grupo: 'Serviços Públicos',
    arquivo: 'Vetor/Saude.geojson',
    tipo: 'point',
    estilo: { color: '#D32F2F', radius: 7 },
    popupCampos: [
      { campo: 'Nome',     rotulo: 'Nome' },
      { campo: 'Endereço', rotulo: 'Endereço' }
    ],
    visivel: false
  },
  {
    id: 'seguranca',
    varName: 'GEODATA_SEGURANCA',
    label: 'Segurança',
    grupo: 'Serviços Públicos',
    arquivo: 'Vetor/Seguranca.geojson',
    tipo: 'point',
    estilo: { color: '#283593', radius: 7 },
    popupCampos: [
      { campo: 'Nome',     rotulo: 'Nome' },
      { campo: 'Endereço', rotulo: 'Endereço' }
    ],
    visivel: false
  },
  {
    id: 'adm_publica',
    varName: 'GEODATA_ADM_PUBLICA',
    label: 'Administração Pública',
    grupo: 'Serviços Públicos',
    arquivo: 'Vetor/ADM_PUBLICA.geojson',
    tipo: 'point',
    estilo: { color: '#616161', radius: 7 },
    popupCampos: [
      { campo: 'Nome',     rotulo: 'Nome' },
      { campo: 'Endereço', rotulo: 'Endereço' }
    ],
    visivel: false
  },
  {
    id: 'bancos',
    varName: 'GEODATA_BANCOS',
    label: 'Bancos',
    grupo: 'Serviços Públicos',
    arquivo: 'Vetor/Bancos.geojson',
    tipo: 'point',
    estilo: { color: '#2E7D32', radius: 7 },
    popupCampos: [
      { campo: 'Nome',     rotulo: 'Nome' },
      { campo: 'Endereço', rotulo: 'Endereço' }
    ],
    visivel: false
  },
  {
    id: 'turismo',
    varName: 'GEODATA_TURISMO',
    label: 'Turismo e Cultura',
    grupo: 'Serviços Públicos',
    arquivo: 'Vetor/Turismo_Culturas.geojson',
    tipo: 'point',
    estilo: { color: '#F57C00', radius: 7 },
    popupCampos: [
      { campo: 'Nome',     rotulo: 'Nome' },
      { campo: 'Endereço', rotulo: 'Endereço' }
    ],
    visivel: false
  },

  // ── Meio Rural e Ambiental ───────────────────────────────────────────────────
  {
    id: 'car',
    varName: 'GEODATA_CAR',
    label: 'Imóveis Rurais (CAR)',
    grupo: 'Meio Rural e Ambiental',
    arquivo: 'Vetor/Imoveis_Rurais_CAR.geojson',
    tipo: 'polygon',
    estilo: {
      // estilo base — sobrescrito por cor dinâmica por situação em map.js
      color: '#9E9E9E',
      weight: 1.5,
      opacity: 0.9,
      fill: true,
      fillOpacity: 0.25
    },
    popupCampos: [
      { campo: 'cod_imovel', rotulo: 'Código do imóvel' },
      { campo: 'tipo_imove', rotulo: 'Tipo do imóvel' },
      { campo: 'situacao_a', rotulo: 'Situação do CAR' },
      { campo: 'modulos_ru', rotulo: 'Módulos fiscais/rurais' }
    ],
    visivel: false
  },
  {
    id: 'veg_nativa',
    varName: 'GEODATA_VEG_NATIVA',
    label: 'Vegetação Nativa',
    grupo: 'Meio Rural e Ambiental',
    arquivo: 'Vetor/Vegetação_Nativa.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#1B5E20',
      weight: 1,
      opacity: 0.8,
      fillColor: '#1B5E20',
      fillOpacity: 0.35,
      fill: true
    },
    skipEmpty: true,
    popupCampos: [
      { campo: 'temas_ambi', rotulo: 'Tipo' },
      { campo: 'situacao_a', rotulo: 'Situação' },
      { campo: 'nu_area_im', rotulo: 'Área (ha)' },
      { campo: 'modulos_ru', rotulo: 'Módulos fiscais/rurais' },
      { campo: 'tipo_imove', rotulo: 'Tipo de imóvel' },
      { campo: 'dt_atualiz', rotulo: 'Atualização' }
    ],
    visivel: false
  },
  {
    id: 'rl_averbada',
    varName: 'GEODATA_RL_AVERBADA',
    label: 'Reserva Legal Averbada',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'Reserva Legal',
    arquivo: 'Vetor/Reserva_Legal_Averbada.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#2E7D32',
      weight: 1,
      opacity: 0.9,
      fillColor: '#2E7D32',
      fillOpacity: 0.45,
      fill: true
    },
    skipEmpty: true,
    popupCampos: [
      { campo: 'temas_ambi', rotulo: 'Tipo' },
      { campo: 'situacao_a', rotulo: 'Situação' },
      { campo: 'nu_area_im', rotulo: 'Área (ha)' },
      { campo: 'modulos_ru', rotulo: 'Módulos fiscais/rurais' },
      { campo: 'tipo_imove', rotulo: 'Tipo de imóvel' },
      { campo: 'dt_atualiz', rotulo: 'Atualização' }
    ],
    visivel: false
  },
  {
    id: 'rl_proposta',
    varName: 'GEODATA_RL_PROPOSTA',
    label: 'Reserva Legal Proposta',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'Reserva Legal',
    arquivo: 'Vetor/Reserva_Legal_Proposta.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#81C784',
      weight: 1,
      opacity: 0.9,
      fillColor: '#81C784',
      fillOpacity: 0.4,
      fill: true
    },
    skipEmpty: true,
    popupCampos: [
      { campo: 'temas_ambi', rotulo: 'Tipo' },
      { campo: 'situacao_a', rotulo: 'Situação' },
      { campo: 'nu_area_im', rotulo: 'Área (ha)' },
      { campo: 'modulos_ru', rotulo: 'Módulos fiscais/rurais' },
      { campo: 'tipo_imove', rotulo: 'Tipo de imóvel' },
      { campo: 'dt_atualiz', rotulo: 'Atualização' }
    ],
    visivel: false
  },

  // ── Meio Rural e Ambiental › APP Declarada (SICAR) ──────────────────────────
  {
    id: 'app_total',
    varName: 'GEODATA_APP_TOTAL',
    label: 'APP Total',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'APP Declarada (SICAR)',
    arquivo: 'Vetor/APP_Total_SJC.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#0D47A1',
      weight: 1.5,
      opacity: 1,
      fill: true,
      fillColor: '#64B5F6',
      fillOpacity: 0.18
    },
    popupCampos: [
      { campo: 'nom_tema',   rotulo: 'Tipo de APP' },
      { campo: 'num_area',   rotulo: 'Área (ha)' },
      { campo: 'des_condic', rotulo: 'Situação ambiental' },
      { campo: 'ind_status', rotulo: 'Status do cadastro' },
      { campo: 'cod_imovel', rotulo: 'Código do imóvel (CAR)' }
    ],
    visivel: false
  },
  {
    id: 'app_rios',
    varName: 'GEODATA_APP_RIOS',
    label: 'APP de Rios',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'APP Declarada (SICAR)',
    arquivo: 'Vetor/APP_Rios_SJC.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#0288D1',
      weight: 1.5,
      opacity: 1,
      fill: true,
      fillColor: '#4FC3F7',
      fillOpacity: 0.22
    },
    popupCampos: [
      { campo: 'nom_tema',   rotulo: 'Tipo de APP' },
      { campo: 'num_area',   rotulo: 'Área (ha)' },
      { campo: 'des_condic', rotulo: 'Situação ambiental' },
      { campo: 'ind_status', rotulo: 'Status do cadastro' },
      { campo: 'cod_imovel', rotulo: 'Código do imóvel (CAR)' }
    ],
    visivel: false
  },
  {
    id: 'app_nascentes',
    varName: 'GEODATA_APP_NASCENTES',
    label: 'APP de Nascentes',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'APP Declarada (SICAR)',
    arquivo: 'Vetor/APP_Nascentes_SJC.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#00796B',
      weight: 1.5,
      opacity: 1,
      fill: true,
      fillColor: '#4DB6AC',
      fillOpacity: 0.25
    },
    popupCampos: [
      { campo: 'nom_tema',   rotulo: 'Tipo de APP' },
      { campo: 'num_area',   rotulo: 'Área (ha)' },
      { campo: 'des_condic', rotulo: 'Situação ambiental' },
      { campo: 'ind_status', rotulo: 'Status do cadastro' },
      { campo: 'cod_imovel', rotulo: 'Código do imóvel (CAR)' }
    ],
    visivel: false
  },
  {
    id: 'app_lagos',
    varName: 'GEODATA_APP_LAGOS',
    label: 'APP de Lagos',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'APP Declarada (SICAR)',
    arquivo: 'Vetor/APP_Lagos_SJC.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#01579B',
      weight: 1.5,
      opacity: 1,
      fill: true,
      fillColor: '#81D4FA',
      fillOpacity: 0.25
    },
    popupCampos: [
      { campo: 'nom_tema',   rotulo: 'Tipo de APP' },
      { campo: 'num_area',   rotulo: 'Área (ha)' },
      { campo: 'des_condic', rotulo: 'Situação ambiental' },
      { campo: 'ind_status', rotulo: 'Status do cadastro' },
      { campo: 'cod_imovel', rotulo: 'Código do imóvel (CAR)' }
    ],
    visivel: false
  },
  {
    id: 'app_declividade',
    varName: 'GEODATA_APP_DECLIVIDADE',
    label: 'APP por Declividade',
    grupo: 'Meio Rural e Ambiental',
    subgrupo: 'APP Declarada (SICAR)',
    arquivo: 'Vetor/APP_Declividade_SJC.geojson',
    tipo: 'polygon',
    estilo: {
      color: '#5D4037',
      weight: 1.5,
      opacity: 1,
      fill: true,
      fillColor: '#A1887F',
      fillOpacity: 0.22
    },
    popupCampos: [
      { campo: 'nom_tema',   rotulo: 'Tipo de APP' },
      { campo: 'num_area',   rotulo: 'Área (ha)' },
      { campo: 'des_condic', rotulo: 'Situação ambiental' },
      { campo: 'ind_status', rotulo: 'Status do cadastro' },
      { campo: 'cod_imovel', rotulo: 'Código do imóvel (CAR)' }
    ],
    visivel: false
  },

  // ── Relevo › Declividade (6 classes individuais) ─────────────────────────────
  // PNG único Declividade_SJC.png mantido como backup — não referenciado aqui.
  {
    id: 'decl_plano', label: 'Plano (0 – 3°)',
    grupo: 'Relevo', subgrupo: 'Declividade',
    arquivo: 'Raster/Declividade_Plano.png', tipo: 'raster', autoGrupo: false,
    estilo: { opacity: 0.75, cor: '#1a9850' },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id: 'decl_suave', label: 'Suave Ondulado (3 – 8°)',
    grupo: 'Relevo', subgrupo: 'Declividade',
    arquivo: 'Raster/Declividade_Suave.png', tipo: 'raster', autoGrupo: false,
    estilo: { opacity: 0.75, cor: '#91cf60' },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id: 'decl_ondulado', label: 'Ondulado (8 – 20°)',
    grupo: 'Relevo', subgrupo: 'Declividade',
    arquivo: 'Raster/Declividade_Ondulado.png', tipo: 'raster', autoGrupo: false,
    estilo: { opacity: 0.75, cor: '#d9ef8b' },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id: 'decl_forte', label: 'Forte Ondulado (20 – 35°)',
    grupo: 'Relevo', subgrupo: 'Declividade',
    arquivo: 'Raster/Declividade_Forte.png', tipo: 'raster', autoGrupo: false,
    estilo: { opacity: 0.75, cor: '#fee08b' },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id: 'decl_montanhoso', label: 'Montanhoso (35 – 50°)',
    grupo: 'Relevo', subgrupo: 'Declividade',
    arquivo: 'Raster/Declividade_Montanhoso.png', tipo: 'raster', autoGrupo: false,
    estilo: { opacity: 0.75, cor: '#fc8d59' },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id: 'decl_escarpado', label: 'Escarpado (> 50°)',
    grupo: 'Relevo', subgrupo: 'Declividade',
    arquivo: 'Raster/Declividade_Escarpado.png', tipo: 'raster', autoGrupo: false,
    estilo: { opacity: 0.75, cor: '#d73027' },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id:      'hillshade',
    label:   'Relevo Sombreado (Hillshade)',
    grupo:   'Relevo',
    arquivo: 'Raster/Hillshade_SJC.png',
    tipo:    'raster',
    estilo: {
      opacity:         0.4,
      swatchGradient:  'linear-gradient(to right, #111 0%, #777 50%, #f5f5f5 100%)'
    },
    // Bounds WGS84 do raster reprojetado (gerado por gerar_rasters.ps1)
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    visivel: false
  },
  {
    id:      'hipsometria',
    label:   'Hipsometria (Altitude)',
    grupo:   'Relevo',
    arquivo: 'Raster/Hipsometria_SJC.png',
    tipo:    'raster',
    estilo: {
      opacity:        1,
      swatchGradient: 'linear-gradient(to right,#1a9850 0% 17%,#91cf60 17% 33%,#d9ef8b 33% 50%,#fee08b 50% 67%,#fc8d59 67% 83%,#d73027 83% 100%)'
    },
    bounds: [[-21.109676, -41.741038], [-20.841752, -41.567234]],
    legenda: [
      { cor: '#1a9850', label: '131 – 200 m' },
      { cor: '#91cf60', label: '200 – 400 m' },
      { cor: '#d9ef8b', label: '400 – 600 m' },
      { cor: '#fee08b', label: '600 – 800 m' },
      { cor: '#fc8d59', label: '800 – 1000 m' },
      { cor: '#d73027', label: '> 1000 m'    }
    ],
    visivel: false
  },

  // ── Relevo › Curvas de Nível ─────────────────────────────────────────────────
  {
    id:        'curvas_nivel',
    varName:   'GEODATA_CURVAS_NIVEL',
    label:     'Curvas de Nível',
    grupo:     'Relevo',
    arquivo:   'Vetor/Curvas_Nivel_50m_WGS84.geojson',
    tipo:      'line',
    estilo: {
      color:   '#D4AF37',
      weight:  1.0,
      opacity: 0.9,
      fill:    false
    },
    popupCampos: [
      { campo: 'ELEV', rotulo: 'Altitude (m)' }
    ],
    visivel: false
  },

  // ── Uso e Cobertura da Terra ─────────────────────────────────────────────────
  {
    id:       'mapbiomas',
    label:    'MapBiomas 2024',
    grupo:    'Uso e Cobertura da Terra',
    arquivo:  'Raster/MapBiomas_2024.png',
    tipo:     'raster',
    pixel_ha: 0.00927,  // ~10m pixel em WGS84 lat ~21°S → ≈92.7 m²
    estilo: {
      opacity:        1,
      swatchGradient: 'linear-gradient(to right,#1f8d49 0% 10%,#7a5900 10% 20%,#d6bc74 20% 30%,#edde8e 30% 40%,#ffefc3 40% 50%,#d4271e 50% 60%,#db4d4f 60% 70%,#091077 70% 80%,#2532e4 80% 90%,#e07400 90% 100%)'
    },
    bounds: [[-21.111936, -41.741208], [-20.839657, -41.566575]],
    // Sem legenda[] — o painel de estatísticas serve como legenda interativa
    classes: [
      { valor:  3, label: 'Formação Florestal',        cor: '#1f8d49', pixels: 622620,   arquivo: 'Raster/MapBiomas_Classe_3.png'  },
      { valor:  9, label: 'Silvicultura',               cor: '#7a5900', pixels: 126539,   arquivo: 'Raster/MapBiomas_Classe_9.png'  },
      { valor: 12, label: 'Formação Campestre',         cor: '#d6bc74', pixels:   9426,   arquivo: 'Raster/MapBiomas_Classe_12.png' },
      { valor: 15, label: 'Pastagem',                   cor: '#edde8e', pixels: 1869511,  arquivo: 'Raster/MapBiomas_Classe_15.png' },
      { valor: 21, label: 'Mosaico de Usos',            cor: '#ffefc3', pixels: 279683,   arquivo: 'Raster/MapBiomas_Classe_21.png' },
      { valor: 24, label: 'Área Urbana',                cor: '#d4271e', pixels:  19881,   arquivo: 'Raster/MapBiomas_Classe_24.png' },
      { valor: 25, label: 'Outras Áreas Não Vegetadas', cor: '#db4d4f', pixels:    256,   arquivo: 'Raster/MapBiomas_Classe_25.png' },
      { valor: 31, label: 'Aquicultura',                cor: '#091077', pixels:     28,   arquivo: 'Raster/MapBiomas_Classe_31.png' },
      { valor: 33, label: 'Corpos d\'Água',             cor: '#2532e4', pixels:  11116,   arquivo: 'Raster/MapBiomas_Classe_33.png' },
      { valor: 36, label: 'Área Urbanizada',            cor: '#e07400', pixels:   4711,   arquivo: 'Raster/MapBiomas_Classe_36.png' }
    ],
    visivel: false
  }
];
