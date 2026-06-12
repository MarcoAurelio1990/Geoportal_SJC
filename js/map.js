// ─── Basemaps ────────────────────────────────────────────────────────────────
const basemaps = {
  'OpenStreetMap': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }
  ),
  'Esri World Imagery': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    }
  )
};

// ─── Mapa ────────────────────────────────────────────────────────────────────
const map = L.map('map', {
  center: [-21.025, -41.654],
  zoom: 12,
  layers: [basemaps['OpenStreetMap']],
  zoomControl: false
});

L.control.zoom({ position: 'topright' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

// ─── Coordenadas do cursor ────────────────────────────────────────────────────
const coordEl = document.getElementById('coords');
map.on('mousemove', function (e) {
  coordEl.textContent = 'Lat: ' + e.latlng.lat.toFixed(6) + '  Lon: ' + e.latlng.lng.toFixed(6);
});
map.on('mouseout', function () {
  coordEl.textContent = 'Lat: —  Lon: —';
});

// ─── Seletor de basemap ───────────────────────────────────────────────────────
document.querySelectorAll('input[name="basemap"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    Object.values(basemaps).forEach(function (b) { map.removeLayer(b); });
    basemaps[this.value].addTo(map);
    // Garante que o limite municipal fica sempre no topo
    if (layerRefs['sjc']) layerRefs['sjc'].bringToFront();
  });
});

// ─── Registros ───────────────────────────────────────────────────────────────
const layerRefs = {};          // id → L.geoJSON layer
const districtLayers = {};     // nmDist → L.geoJSON layer (sub-camadas de distritos)
const groupCheckboxes = {};    // grupo → <input> checkbox master

// ─── Utilitários ─────────────────────────────────────────────────────────────
function limpaValor(v) {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  if (s === '' || s.toUpperCase() === 'NULL' || s.startsWith('NULL')) return '—';
  return s;
}

function buildPopup(props, campos, skipEmpty) {
  let html = '<table class="popup-table">';
  campos.forEach(function (c) {
    const val = limpaValor(props[c.campo]);
    if (skipEmpty && val === '—') return;
    html += '<tr><th>' + c.rotulo + '</th><td>' + val + '</td></tr>';
  });
  return html + '</table>';
}

function buildStyle(cfg) {
  const s = cfg.estilo;
  const isLine = cfg.tipo === 'line';
  return {
    color:       s.color,
    weight:      s.weight,
    opacity:     s.opacity !== undefined ? s.opacity : 1,
    fill:        isLine ? false : (s.fill !== false),
    fillColor:   s.fillColor || s.color,
    fillOpacity: isLine ? 0 : (s.fillOpacity !== undefined ? s.fillOpacity : (s.fill === false ? 0 : 0.15)),
    dashArray:   s.dashArray || null
  };
}

// Garante que o município fique sempre acima dos distritos e demais camadas
function bringMunicipioToFront() {
  if (layerRefs['sjc'] && map.hasLayer(layerRefs['sjc'])) {
    layerRefs['sjc'].bringToFront();
  }
}

// ─── Sincronização do checkbox de grupo ──────────────────────────────────────
function syncGroupCheckbox(grupo) {
  const masterCb = groupCheckboxes[grupo];
  if (!masterCb) return;

  // Coleta todos os checkboxes individuais do grupo
  const items = masterCb.closest('.layer-group')
    .querySelectorAll('.group-body input[type="checkbox"].layer-cb');

  let total = 0, checked = 0;
  items.forEach(function (cb) {
    total++;
    if (cb.checked) checked++;
  });

  if (checked === 0) {
    masterCb.checked = false;
    masterCb.indeterminate = false;
  } else if (checked === total) {
    masterCb.checked = true;
    masterCb.indeterminate = false;
  } else {
    masterCb.checked = false;
    masterCb.indeterminate = true;
  }
}

// ─── Liga/desliga camada e atualiza checkbox ──────────────────────────────────
function setLayerVisible(layer, visible) {
  if (!layer) return;
  if (visible) {
    if (!map.hasLayer(layer)) layer.addTo(map);
  } else {
    if (map.hasLayer(layer)) map.removeLayer(layer);
  }
  bringMunicipioToFront();
}

// ─── Painel lateral ───────────────────────────────────────────────────────────
function buildPanel() {
  const container = document.getElementById('layer-list');

  GRUPOS.forEach(function (grupo) {
    const camadas = LAYER_CONFIG.filter(function (c) { return c.grupo === grupo; });
    if (!camadas.length) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'layer-group';
    groupEl.dataset.grupo = grupo;

    // ── Cabeçalho do grupo ─────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'group-header';

    const masterCb = document.createElement('input');
    masterCb.type = 'checkbox';
    masterCb.className = 'group-master-cb';
    const visivelCount = camadas.filter(function (c) { return c.visivel; }).length;
    masterCb.checked = visivelCount === camadas.length;
    masterCb.indeterminate = visivelCount > 0 && visivelCount < camadas.length;
    masterCb.title = 'Ligar/desligar grupo';
    groupCheckboxes[grupo] = masterCb;

    masterCb.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    masterCb.addEventListener('change', function () {
      const on = this.checked;
      // Itera sobre checkboxes do grupo, excluindo os marcados como manuais (data-no-auto)
      groupEl.querySelectorAll('.group-body input[type="checkbox"].layer-cb:not([data-no-auto])').forEach(function (cb) {
        cb.checked = on;
        cb.indeterminate = false;
        cb.dispatchEvent(new Event('change'));
      });
    });

    const titleSpan = document.createElement('span');
    titleSpan.className = 'group-title';
    titleSpan.textContent = grupo;

    const toggleSpan = document.createElement('span');
    toggleSpan.className = 'group-toggle';
    toggleSpan.textContent = '▾';

    header.appendChild(masterCb);
    header.appendChild(titleSpan);
    header.appendChild(toggleSpan);

    // Colapsar/expandir ao clicar no cabeçalho (mas não no checkbox)
    header.addEventListener('click', function (e) {
      if (e.target === masterCb) return;
      body.classList.toggle('collapsed');
      toggleSpan.textContent = body.classList.contains('collapsed') ? '▸' : '▾';
    });

    // ── Corpo do grupo ─────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'group-body collapsed';
    toggleSpan.textContent = '▸';

    // Controla se os placeholders de sub-grupos já foram inseridos
    let rlPlaceholderInserted   = false;
    let declPlaceholderInserted = false;

    camadas.forEach(function (cfg) {
      // Distritos recebem tratamento especial (sub-grupo dinâmico)
      if (cfg.id === 'distritos') {
        const placeholder = document.createElement('div');
        placeholder.id = 'distritos-subgroup';
        body.appendChild(placeholder);
        return;
      }

      // Reserva Legal: agrupa rl_averbada e rl_proposta em sub-grupo único
      if (cfg.subgrupo === 'Reserva Legal') {
        if (!rlPlaceholderInserted) {
          const placeholder = document.createElement('div');
          placeholder.id = 'reservalegal-subgroup';
          body.appendChild(placeholder);
          rlPlaceholderInserted = true;
        }
        return;
      }

      // Declividade: 6 classes em sub-grupo expansível
      if (cfg.subgrupo === 'Declividade') {
        if (!declPlaceholderInserted) {
          const placeholder = document.createElement('div');
          placeholder.id = 'declividade-subgroup';
          body.appendChild(placeholder);
          declPlaceholderInserted = true;
        }
        return;
      }

      body.appendChild(buildLayerItem(cfg, grupo, groupEl));
    });

    groupEl.appendChild(header);
    groupEl.appendChild(body);
    container.appendChild(groupEl);
  });
}

// ─── Cria um item de camada simples ───────────────────────────────────────────
function buildLayerItem(cfg, grupo, groupEl) {
  const item = document.createElement('label');
  item.className = 'layer-item';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'layer-cb';
  cb.id = 'cb_' + cfg.id;
  cb.checked = cfg.visivel;
  if (cfg.autoGrupo === false) cb.dataset.noAuto = 'true';

  cb.addEventListener('change', function () {
    setLayerVisible(layerRefs[cfg.id], this.checked);
    syncGroupCheckbox(grupo);
  });

  const swatch = buildSwatch(cfg);
  const nameEl = document.createElement('span');
  nameEl.className = 'layer-name';
  nameEl.textContent = cfg.label;

  item.appendChild(cb);
  item.appendChild(swatch);
  item.appendChild(nameEl);
  return item;
}

// ─── Ícones SVG — Serviços Públicos ──────────────────────────────────────────
var SERVICE_ICON_PATHS = {
  educacao:    'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
  saude:       'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
  seguranca:   'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
  adm_publica: 'M12 3L2 8v2h20V8L12 3zM4 11v7h3v-7H4zm6 0v7h4v-7h-4zm7 0v7h3v-7h-3zM2 20v2h20v-2H2z',
  bancos:      'M6.5 10h-2v7h2v-7zm5 0h-2v7h2v-7zm8.5 9H2v2h18v-2zm-3.5-9h-2v7h2v-7zM11 1L2 6v2h18V6l-9-5z',
  turismo:     'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
};

function buildSvgIcon(id, color, size) {
  var d = SERVICE_ICON_PATHS[id];
  if (!d) return '';
  var s = size || 24;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" style="display:block">' +
    '<path d="' + d + '" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="' + d + '" fill="' + color + '"/>' +
    '</svg>';
}

function makeServiceDivIcon(id, color) {
  if (!SERVICE_ICON_PATHS[id]) return null;
  return L.divIcon({
    html: '<div class="service-icon-wrap">' + buildSvgIcon(id, color, 24) + '</div>',
    className: 'service-icon',
    iconSize:    [24, 24],
    iconAnchor:  [12, 12],
    popupAnchor: [0, -14]
  });
}

// ─── Cria símbolo de legenda ──────────────────────────────────────────────────
function buildSwatch(cfg) {
  const swatch = document.createElement('span');
  swatch.className = 'legend-swatch';
  if (cfg.tipo === 'point') {
    if (SERVICE_ICON_PATHS[cfg.id]) {
      swatch.style.cssText = 'width:18px;height:18px;flex-shrink:0;';
      swatch.innerHTML = buildSvgIcon(cfg.id, cfg.estilo.color, 18);
    } else {
    swatch.style.cssText =
      'width:12px;height:12px;border-radius:50%;background:' + cfg.estilo.color +
      ';border:2px solid #fff;box-shadow:0 0 0 1px ' + cfg.estilo.color + ';flex-shrink:0;';
    }
  } else if (cfg.tipo === 'line') {
    if (cfg.estilo.dashArray) {
      swatch.style.cssText =
        'width:22px;height:0;border-top:3px dashed ' + cfg.estilo.color +
        ';flex-shrink:0;';
    } else {
      swatch.style.cssText =
        'width:22px;height:4px;background:' + cfg.estilo.color +
        ';flex-shrink:0;border-radius:2px;';
    }
  } else if (cfg.tipo === 'raster') {
    var grad = (cfg.estilo && cfg.estilo.swatchGradient)
      || 'linear-gradient(to right, #111, #888, #f0f0f0)';
    swatch.style.cssText =
      'width:22px;height:12px;background:' + grad +
      ';flex-shrink:0;border-radius:2px;border:1px solid #bbb;';
  } else {
    const fill = (cfg.estilo.fill === false)
      ? 'transparent'
      : (cfg.estilo.fillColor || cfg.estilo.color);
    swatch.style.cssText =
      'width:16px;height:12px;background:' + fill +
      ';border:2px solid ' + cfg.estilo.color +
      ';flex-shrink:0;border-radius:2px;';
  }
  return swatch;
}

// ─── Sub-grupo dinâmico de Distritos ─────────────────────────────────────────
function buildDistrictSubgroup(geojson) {
  const placeholder = document.getElementById('distritos-subgroup');
  if (!placeholder) return;

  const grupoEl   = placeholder.closest('.layer-group');
  const groupBody = placeholder.closest('.group-body');
  const grupo     = 'Limites Administrativos';

  // Wrapper do sub-grupo
  const subgroup = document.createElement('div');
  subgroup.className = 'district-subgroup';

  // Cabeçalho expansível dos Distritos
  const subHeader = document.createElement('div');
  subHeader.className = 'district-subgroup-header';

  const subMasterCb = document.createElement('input');
  subMasterCb.type = 'checkbox';
  subMasterCb.className = 'layer-cb district-master-cb';
  subMasterCb.id = 'cb_distritos_master';
  subMasterCb.checked = false;
  subMasterCb.title = 'Ligar/desligar todos os distritos';

  subMasterCb.addEventListener('click', function (e) { e.stopPropagation(); });
  subMasterCb.addEventListener('change', function () {
    const on = this.checked;
    subgroup.querySelectorAll('.district-item-cb').forEach(function (cb) {
      cb.checked = on;
      cb.dispatchEvent(new Event('change'));
    });
    syncGroupCheckbox(grupo);
  });

  // Símbolo de legenda dos distritos
  const distSwatch = document.createElement('span');
  distSwatch.className = 'legend-swatch';
  distSwatch.style.cssText =
    'width:16px;height:12px;background:rgba(245,124,0,0.12);' +
    'border:2px dashed #F57C00;flex-shrink:0;border-radius:2px;';

  const subTitleSpan = document.createElement('span');
  subTitleSpan.className = 'district-subgroup-title';
  subTitleSpan.textContent = 'Distritos';

  const subToggle = document.createElement('span');
  subToggle.className = 'district-subgroup-toggle';
  subToggle.textContent = '▾';

  subHeader.appendChild(subMasterCb);
  subHeader.appendChild(distSwatch);
  subHeader.appendChild(subTitleSpan);
  subHeader.appendChild(subToggle);

  const subBody = document.createElement('div');
  subBody.className = 'district-subgroup-body collapsed';
  subToggle.textContent = '▸';

  // Colapsar/expandir ao clicar no cabeçalho
  subHeader.addEventListener('click', function (e) {
    if (e.target === subMasterCb) return;
    subBody.classList.toggle('collapsed');
    subToggle.textContent = subBody.classList.contains('collapsed') ? '▸' : '▾';
  });

  // ── Agrupa features por NM_DIST ──────────────────────────────────────────
  const byDist = {};
  geojson.features.forEach(function (f) {
    const nm = (f.properties.NM_DIST || 'Sem nome').trim();
    if (!byDist[nm]) byDist[nm] = [];
    byDist[nm].push(f);
  });

  const distNomes = Object.keys(byDist).sort();

  const distEstilo = {
    color:       '#F57C00',
    weight:      2,
    opacity:     1,
    fill:        true,
    fillColor:   '#F57C00',
    fillOpacity: 0.12,
    dashArray:   '8 5'
  };

  distNomes.forEach(function (nm) {
    // Cria layer individual para o distrito
    const distGeojson = { type: 'FeatureCollection', features: byDist[nm] };
    const layer = L.geoJSON(distGeojson, {
      style: function () { return Object.assign({}, distEstilo); },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">Distrito</div>' +
          buildPopup(feature.properties, [
            { campo: 'NM_DIST', rotulo: 'Distrito' },
            { campo: 'NM_MUN',  rotulo: 'Município' },
            { campo: 'NM_UF',   rotulo: 'Estado' },
            { campo: 'CD_DIST', rotulo: 'Código' }
          ])
        );
      }
    });

    const safeId = 'distrito_' + nm.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    // Distritos iniciam desligados (não adicionados ao mapa)
    districtLayers[nm] = layer;
    layerRefs[safeId] = layer;

    // ── Item no painel ───────────────────────────────────────────────────
    const item = document.createElement('div');
    item.className = 'district-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'layer-cb district-item-cb';
    cb.id = 'cb_' + safeId;
    cb.checked = false;

    cb.addEventListener('click', function (e) { e.stopPropagation(); });
    cb.addEventListener('change', function () {
      setLayerVisible(layer, this.checked);
      // Sincroniza o master de distritos
      const allDist = subgroup.querySelectorAll('.district-item-cb');
      let tot = 0, chk = 0;
      allDist.forEach(function (c) { tot++; if (c.checked) chk++; });
      subMasterCb.checked = chk === tot;
      subMasterCb.indeterminate = chk > 0 && chk < tot;
      syncGroupCheckbox(grupo);
    });

    const nameSpan = document.createElement('span');
    nameSpan.className = 'district-name';
    nameSpan.textContent = nm;
    nameSpan.title = 'Clique para aplicar zoom ao distrito';

    // Zoom + highlight ao clicar no nome
    nameSpan.addEventListener('click', function () {
      if (!map.hasLayer(layer)) {
        // Ativa a camada se estiver desligada antes de dar zoom
        cb.checked = true;
        setLayerVisible(layer, true);
        syncGroupCheckbox(grupo);
        const allDist = subgroup.querySelectorAll('.district-item-cb');
        let tot = 0, chk = 0;
        allDist.forEach(function (c) { tot++; if (c.checked) chk++; });
        subMasterCb.checked = chk === tot;
        subMasterCb.indeterminate = chk > 0 && chk < tot;
      }

      map.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 14 });

      // Destaque temporário
      layer.setStyle({
        color:       '#E65100',
        weight:      3,
        fillColor:   '#FF9800',
        fillOpacity: 0.35,
        dashArray:   null
      });
      bringMunicipioToFront();

      setTimeout(function () {
        layer.setStyle(Object.assign({}, distEstilo));
        bringMunicipioToFront();
      }, 2000);
    });

    item.appendChild(cb);
    item.appendChild(nameSpan);
    subBody.appendChild(item);
  });

  subgroup.appendChild(subHeader);
  subgroup.appendChild(subBody);
  placeholder.replaceWith(subgroup);

  // Inicializa estado do checkbox master de grupo
  syncGroupCheckbox(grupo);
}

// ─── Sub-grupo estático de Reserva Legal ─────────────────────────────────────
function buildReservaLegalSubgroup() {
  const placeholder = document.getElementById('reservalegal-subgroup');
  if (!placeholder) return;

  const grupoEl   = placeholder.closest('.layer-group');
  const grupo     = 'Meio Rural e Ambiental';

  const rlCamadas = LAYER_CONFIG.filter(function (c) { return c.subgrupo === 'Reserva Legal'; });

  const subgroup = document.createElement('div');
  subgroup.className = 'rl-subgroup';

  const subHeader = document.createElement('div');
  subHeader.className = 'rl-subgroup-header';

  const subMasterCb = document.createElement('input');
  subMasterCb.type = 'checkbox';
  subMasterCb.className = 'layer-cb rl-master-cb';
  subMasterCb.id = 'cb_rl_master';
  subMasterCb.checked = false;
  subMasterCb.title = 'Ligar/desligar Reserva Legal';

  subMasterCb.addEventListener('click', function (e) { e.stopPropagation(); });
  subMasterCb.addEventListener('change', function () {
    const on = this.checked;
    subgroup.querySelectorAll('.rl-item-cb').forEach(function (cb) {
      cb.checked = on;
      cb.dispatchEvent(new Event('change'));
    });
    syncGroupCheckbox(grupo);
  });

  // Símbolo de legenda (misto das duas RL)
  const rlSwatch = document.createElement('span');
  rlSwatch.className = 'legend-swatch';
  rlSwatch.style.cssText =
    'width:16px;height:12px;background:rgba(46,125,50,0.45);' +
    'border:2px solid #2E7D32;flex-shrink:0;border-radius:2px;';

  const subTitle = document.createElement('span');
  subTitle.className = 'rl-subgroup-title';
  subTitle.textContent = 'Reserva Legal';

  const subToggle = document.createElement('span');
  subToggle.className = 'rl-subgroup-toggle';
  subToggle.textContent = '▸';

  subHeader.appendChild(subMasterCb);
  subHeader.appendChild(rlSwatch);
  subHeader.appendChild(subTitle);
  subHeader.appendChild(subToggle);

  const subBody = document.createElement('div');
  subBody.className = 'rl-subgroup-body collapsed';

  subHeader.addEventListener('click', function (e) {
    if (e.target === subMasterCb) return;
    subBody.classList.toggle('collapsed');
    subToggle.textContent = subBody.classList.contains('collapsed') ? '▸' : '▾';
  });

  rlCamadas.forEach(function (cfg) {
    const item = document.createElement('label');
    item.className = 'layer-item rl-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'layer-cb rl-item-cb';
    cb.id = 'cb_' + cfg.id;
    cb.checked = cfg.visivel;

    cb.addEventListener('change', function () {
      setLayerVisible(layerRefs[cfg.id], this.checked);
      // Sincroniza master de RL
      const allRl = subgroup.querySelectorAll('.rl-item-cb');
      let tot = 0, chk = 0;
      allRl.forEach(function (c) { tot++; if (c.checked) chk++; });
      subMasterCb.checked = chk === tot;
      subMasterCb.indeterminate = chk > 0 && chk < tot;
      syncGroupCheckbox(grupo);
    });

    const swatch = buildSwatch(cfg);
    const nameEl = document.createElement('span');
    nameEl.className = 'layer-name';
    nameEl.textContent = cfg.label;

    item.appendChild(cb);
    item.appendChild(swatch);
    item.appendChild(nameEl);
    subBody.appendChild(item);
  });

  subgroup.appendChild(subHeader);
  subgroup.appendChild(subBody);
  placeholder.replaceWith(subgroup);

  syncGroupCheckbox(grupo);
}

// ─── Sub-grupo de Declividade (6 classes individuais) ────────────────────────
function buildDeclivSubgroup() {
  const placeholder = document.getElementById('declividade-subgroup');
  if (!placeholder) return;

  const grupoEl  = placeholder.closest('.layer-group');
  const grupo    = 'Relevo';
  const classes  = LAYER_CONFIG.filter(function (c) { return c.subgrupo === 'Declividade'; });
  const criticas = ['decl_forte', 'decl_montanhoso', 'decl_escarpado'];

  const subgroup = document.createElement('div');
  subgroup.className = 'decl-subgroup';

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  const subHeader = document.createElement('div');
  subHeader.className = 'decl-subgroup-header';

  const subMasterCb = document.createElement('input');
  subMasterCb.type = 'checkbox';
  subMasterCb.className = 'layer-cb decl-master-cb';
  subMasterCb.id = 'cb_decl_master';
  subMasterCb.checked = false;
  subMasterCb.dataset.noAuto = 'true';   // excluído do master CB do grupo Relevo
  subMasterCb.title = 'Ligar/desligar Declividade';

  subMasterCb.addEventListener('click', function (e) { e.stopPropagation(); });
  subMasterCb.addEventListener('change', function () {
    const on = this.checked;
    subgroup.querySelectorAll('.decl-item-cb').forEach(function (cb) {
      cb.checked = on;
      cb.dispatchEvent(new Event('change'));
    });
    syncGroupCheckbox(grupo);
  });

  // Swatch gradiente representando as 6 classes
  const swatchEl = document.createElement('span');
  swatchEl.className = 'legend-swatch';
  swatchEl.style.cssText =
    'width:22px;height:12px;flex-shrink:0;border-radius:2px;' +
    'background:linear-gradient(to right,#1a9850 0% 17%,#91cf60 17% 33%,' +
    '#d9ef8b 33% 50%,#fee08b 50% 67%,#fc8d59 67% 83%,#d73027 83% 100%);';

  const subTitle = document.createElement('span');
  subTitle.className = 'decl-subgroup-title';
  subTitle.textContent = 'Declividade';

  const subToggle = document.createElement('span');
  subToggle.className = 'decl-subgroup-toggle';
  subToggle.textContent = '▸';

  subHeader.appendChild(subMasterCb);
  subHeader.appendChild(swatchEl);
  subHeader.appendChild(subTitle);
  subHeader.appendChild(subToggle);

  // ── Corpo (inicia recolhido) ───────────────────────────────────────────────
  const subBody = document.createElement('div');
  subBody.className = 'decl-subgroup-body collapsed';

  subHeader.addEventListener('click', function (e) {
    if (e.target === subMasterCb) return;
    subBody.classList.toggle('collapsed');
    subToggle.textContent = subBody.classList.contains('collapsed') ? '▸' : '▾';
  });

  // ── Botões de ação ─────────────────────────────────────────────────────────
  const actionsRow = document.createElement('div');
  actionsRow.className = 'decl-actions';

  function setClasses(ids) {
    subgroup.querySelectorAll('.decl-item-cb').forEach(function (cb) {
      const on = ids.indexOf(cb.dataset.classId) !== -1;
      if (cb.checked !== on) {
        cb.checked = on;
        cb.dispatchEvent(new Event('change'));
      }
    });
    syncDeclMaster();
    syncGroupCheckbox(grupo);
  }

  const btnTodas = document.createElement('button');
  btnTodas.className = 'decl-action-btn';
  btnTodas.textContent = 'Mostrar todas';
  btnTodas.addEventListener('click', function () {
    setClasses(classes.map(function (c) { return c.id; }));
  });

  const btnCriticas = document.createElement('button');
  btnCriticas.className = 'decl-action-btn decl-action-btn--criticas';
  btnCriticas.textContent = 'Áreas críticas';
  btnCriticas.addEventListener('click', function () {
    setClasses(criticas);
  });

  actionsRow.appendChild(btnTodas);
  actionsRow.appendChild(btnCriticas);
  subBody.appendChild(actionsRow);

  // ── Sincroniza master do sub-grupo ────────────────────────────────────────
  function syncDeclMaster() {
    const all = subgroup.querySelectorAll('.decl-item-cb');
    let tot = 0, chk = 0;
    all.forEach(function (c) { tot++; if (c.checked) chk++; });
    subMasterCb.checked      = chk > 0 && chk === tot;
    subMasterCb.indeterminate = chk > 0 && chk < tot;
  }

  // ── Itens de classe ────────────────────────────────────────────────────────
  classes.forEach(function (cfg) {
    const item = document.createElement('label');
    item.className = 'layer-item decl-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'layer-cb decl-item-cb';
    cb.id = 'cb_' + cfg.id;
    cb.dataset.classId = cfg.id;
    cb.dataset.noAuto  = 'true';   // excluído do master CB do grupo Relevo
    cb.checked = false;

    cb.addEventListener('change', function () {
      setLayerVisible(layerRefs[cfg.id], this.checked);
      syncDeclMaster();
      syncGroupCheckbox(grupo);
    });

    // Swatch de cor sólida da classe
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.cssText =
      'width:14px;height:14px;flex-shrink:0;border-radius:2px;' +
      'background:' + cfg.estilo.cor + ';';

    const nameEl = document.createElement('span');
    nameEl.className = 'layer-name';
    nameEl.textContent = cfg.label;

    item.appendChild(cb);
    item.appendChild(swatch);
    item.appendChild(nameEl);
    subBody.appendChild(item);
  });

  subgroup.appendChild(subHeader);
  subgroup.appendChild(subBody);
  placeholder.replaceWith(subgroup);

  syncGroupCheckbox(grupo);
}

// ─── Cor dinâmica CAR por situação ────────────────────────────────────────────
function getCarColor(situacao) {
  if (!situacao) return '#9E9E9E';
  const s = situacao.toLowerCase();
  if (s.indexOf('conformidade') !== -1)           return '#2E7D32';
  if (s.indexOf('regularização') !== -1 ||
      s.indexOf('regularizacao') !== -1)           return '#FFA000';
  if (s.indexOf('aguardando') !== -1 ||
      s.indexOf('em análise') !== -1 ||
      s.indexOf('em analise') !== -1)              return '#FF6F00';
  return '#9E9E9E';
}

// ─── Rótulo curto de situação CAR ─────────────────────────────────────────────
function getSitLabel(sit) {
  const s = (sit || '').toLowerCase();
  if (s.indexOf('conformidade') !== -1)                                               return 'Em conformidade';
  if (s.indexOf('regularização') !== -1 || s.indexOf('regularizacao') !== -1)        return 'Ag. regularização';
  if (s.indexOf('aguardando análise') !== -1 || s.indexOf('aguardando analise') !== -1) return 'Ag. análise';
  if (s.indexOf('em análise') !== -1 || s.indexOf('em analise') !== -1)              return 'Em análise';
  return sit || 'Não informado';
}

// ─── Classe de área de fragmento de Veg Nativa ───────────────────────────────
function getVegAreaClass(val) {
  const a = parseFloat(val);
  if (isNaN(a)) return null;
  if (a <= 1)   return 'Até 1 ha';
  if (a <= 5)   return '1 a 5 ha';
  if (a <= 10)  return '5 a 10 ha';
  if (a <= 50)  return '10 a 50 ha';
  return 'Acima de 50 ha';
}

// ─── MapBiomas: lookup de classes (cor e nome) ───────────────────────────────
var MB_CLASSES = (function () {
  var map = {};
  var mbCfg = LAYER_CONFIG.find(function (c) { return c.id === 'mapbiomas'; });
  if (mbCfg && mbCfg.classes) {
    mbCfg.classes.forEach(function (cl) {
      map[String(cl.valor)] = { label: cl.label, cor: cl.cor };
    });
  }
  return map;
}());

var MB_PIXEL_HA = (function () {
  var mbCfg = LAYER_CONFIG.find(function (c) { return c.id === 'mapbiomas'; });
  return (mbCfg && mbCfg.pixel_ha) ? mbCfg.pixel_ha : 0.00927;
}());

function buildCarMbSection(cod_imovel) {
  var lookup = (typeof CAR_MAPBIOMAS !== 'undefined') ? CAR_MAPBIOMAS : null;
  if (!lookup || !lookup[cod_imovel]) {
    return '<div class="car-mb-unavail">Composição MapBiomas não disponível para este imóvel.</div>';
  }
  var data = lookup[cod_imovel];
  // Converter para array [ { label, cor, ha, pixels } ] e ordenar por área desc
  var entries = [];
  var totalPixels = 0;
  Object.keys(data).forEach(function (val) {
    var px  = data[val];
    var cls = MB_CLASSES[val];
    if (!cls) return;
    totalPixels += px;
    entries.push({ label: cls.label, cor: cls.cor, pixels: px });
  });
  if (!entries.length) {
    return '<div class="car-mb-unavail">Composição MapBiomas não disponível para este imóvel.</div>';
  }
  entries.sort(function (a, b) { return b.pixels - a.pixels; });
  var totalHa = totalPixels * MB_PIXEL_HA;

  var rows = entries.map(function (e) {
    var ha  = (e.pixels * MB_PIXEL_HA).toFixed(1).replace('.', ',');
    var pct = totalPixels > 0 ? ((e.pixels / totalPixels) * 100).toFixed(1).replace('.', ',') : '0,0';
    return '<tr>' +
      '<td><span class="car-mb-swatch" style="background:' + e.cor + '"></span>' + e.label + '</td>' +
      '<td class="car-mb-ha">' + ha + ' ha</td>' +
      '<td class="car-mb-pct">' + pct + '%</td>' +
      '</tr>';
  }).join('');

  var totalHaFmt = totalHa.toFixed(1).replace('.', ',');

  return '<div class="car-mb-section">' +
    '<div class="car-mb-title">Uso e Cobertura da Terra <span class="car-mb-source">(MapBiomas 2024)</span></div>' +
    '<table class="car-mb-table">' +
    '<thead><tr><th>Classe</th><th>Área</th><th>%</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr><td><strong>Área analisada estimada</strong></td>' +
    '<td class="car-mb-ha"><strong>' + totalHaFmt + ' ha</strong></td><td></td></tr></tfoot>' +
    '</table></div>';
}

// ─── Classe de módulos fiscais ────────────────────────────────────────────────
function getModClass(val) {
  const mod = parseFloat(val);
  if (isNaN(mod)) return null;
  if (mod <= 1)   return 'Até 1 MF';
  if (mod <= 4)   return '1 a 4 MF';
  if (mod <= 15)  return '4 a 15 MF';
  return 'Acima de 15 MF';
}

// ─── Estado do filtro combinado CAR ──────────────────────────────────────────
var carFilter  = { situacao: null, modulo: null };
var carTotal   = 0; // total de feições, definido em buildCarStats

function toggleCarFilter(type, value) {
  // Clique na opção já ativa → deseleciona; senão → seleciona
  if (carFilter[type] === value) {
    carFilter[type] = null;
  } else {
    carFilter[type] = value;
  }
  renderCarFilter();
}

function clearCarFilter() {
  carFilter = { situacao: null, modulo: null };
  renderCarFilter();
}

function renderCarFilter() {
  const layer = layerRefs['car'];
  const hasSit = carFilter.situacao !== null;
  const hasMod = carFilter.modulo   !== null;
  const hasAny = hasSit || hasMod;

  // ── Aplica estilo a cada feição ────────────────────────────────────────────
  let filteredCount = 0;
  const filteredBounds = L.latLngBounds([]);

  if (layer) {
    layer.eachLayer(function (lyr) {
      const p = lyr.feature.properties;
      const sitMatch = !hasSit || getSitLabel(p.situacao_a) === carFilter.situacao;
      const modMatch = !hasMod || getModClass(p.modulos_ru)  === carFilter.modulo;
      const match    = sitMatch && modMatch;
      const cor = getCarColor(p.situacao_a);

      if (match) {
        lyr.setStyle({ color: cor, weight: 1.5, opacity: 0.9,
                       fill: true, fillColor: cor,
                       fillOpacity: hasAny ? 0.4 : 0.25 });
        lyr.options.interactive = true;
        filteredCount++;
        if (hasAny) {
          try { filteredBounds.extend(lyr.getBounds()); } catch(e) {}
        }
      } else {
        lyr.setStyle({ color: '#ccc', weight: 0.5, opacity: 0.15,
                       fill: true, fillColor: '#ccc', fillOpacity: 0.04 });
        lyr.options.interactive = false;
      }
    });
  }

  // ── Destaque das linhas ativas ─────────────────────────────────────────────
  document.querySelectorAll('.car-filter-row').forEach(function (r) {
    const active =
      (r.dataset.filterType === 'situacao' && r.dataset.filterVal === carFilter.situacao) ||
      (r.dataset.filterType === 'modulo'   && r.dataset.filterVal === carFilter.modulo);
    r.classList.toggle('active', active);
  });

  // ── Indicador de filtro ativo ──────────────────────────────────────────────
  const indicator   = document.getElementById('car-filter-indicator');
  const btnAll      = document.getElementById('car-btn-all');
  const countEl     = document.getElementById('car-filtered-count');

  if (hasAny) {
    const parts = [];
    if (hasSit) parts.push(carFilter.situacao);
    if (hasMod) parts.push(carFilter.modulo);
    if (indicator) { indicator.textContent = 'Filtro ativo: ' + parts.join(' + ');
                     indicator.style.display = 'block'; }
    if (btnAll)    btnAll.style.display = 'block';

    if (countEl) {
      const pct = carTotal > 0
        ? ((filteredCount / carTotal) * 100).toFixed(1).replace('.', ',') + '%'
        : '—';
      countEl.textContent = filteredCount + ' imóvel(is) (' + pct + ' do total)';
      countEl.style.display = 'block';
    }

    // Zoom automático para os imóveis filtrados
    if (filteredBounds.isValid()) {
      map.fitBounds(filteredBounds, { padding: [40, 40], maxZoom: 16 });
      bringMunicipioToFront();
    }
  } else {
    if (indicator) indicator.style.display = 'none';
    if (btnAll)    btnAll.style.display    = 'none';
    if (countEl)   countEl.style.display   = 'none';
  }
}

// ─── Painel de estatísticas do CAR ────────────────────────────────────────────
function buildCarStats(geojson) {
  carTotal = geojson.features.length;
  const total = carTotal;
  const porSit = {};
  const classMod = { 'Até 1 MF': 0, '1 a 4 MF': 0, '4 a 15 MF': 0, 'Acima de 15 MF': 0 };

  geojson.features.forEach(function (f) {
    const p = f.properties;
    const sitLabel = getSitLabel(p.situacao_a);
    porSit[sitLabel] = (porSit[sitLabel] || 0) + 1;
    const modClass = getModClass(p.modulos_ru);
    if (modClass) classMod[modClass]++;
  });

  const sitEntries = Object.entries(porSit).sort(function (a, b) { return b[1] - a[1]; });
  const sitColors = {
    'Em conformidade':   '#2E7D32',
    'Ag. regularização': '#FFA000',
    'Ag. análise':       '#FF6F00',
    'Em análise':        '#FF6F00'
  };

  // ── HTML ──────────────────────────────────────────────────────────────────
  let html =
    '<div id="car-stats">' +

    // Cabeçalho colapsável principal
    '<div class="car-stats-header" id="car-stats-toggle">' +
    '<span class="car-stats-toggle-icon">▶</span>' +
    '<span class="car-stats-header-label">Estatísticas do CAR</span>' +
    '</div>' +

    // Corpo colapsável
    '<div class="car-stats-body collapsed" id="car-stats-body">' +

    // Legenda CAR
    '<div class="stats-legend">' +
    '<div class="stats-legend-title">Legenda</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(46,125,50,0.25);border-color:#2E7D32"></span>Em conformidade</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(255,160,0,0.25);border-color:#FFA000"></span>Ag. regularização ambiental</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(255,111,0,0.25);border-color:#FF6F00"></span>Ag. análise / Em análise</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(158,158,158,0.25);border-color:#9E9E9E"></span>Outros</div>' +
    '</div>' +

    '<div class="car-stats-total">Total: <strong>' + total + '</strong> imóveis</div>' +

    // Contagem filtrada (oculta por padrão)
    '<div id="car-filtered-count" class="car-filtered-count" style="display:none"></div>' +

    // Indicador de filtro ativo (oculto por padrão)
    '<div id="car-filter-indicator" class="car-filter-active" style="display:none"></div>' +

    // Botão "Mostrar todos"
    '<button id="car-btn-all" class="car-filter-btn" style="display:none">✕ Mostrar todos os imóveis</button>' +

    // ── Bloco: Por situação ────────────────────────────────────────────────
    '<div class="car-stats-section-header" data-target="car-sit-body">' +
    '<span class="car-section-icon">▶</span> Por situação do CAR' +
    '</div>' +
    '<div class="car-section-body collapsed" id="car-sit-body">' +
    '<table class="car-stats-table">';

  sitEntries.forEach(function (e) {
    const cor = sitColors[e[0]] || '#9E9E9E';
    const pct = ((e[1] / total) * 100).toFixed(1).replace('.', ',') + '%';
    html +=
      '<tr class="car-filter-row" data-filter-type="situacao" data-filter-val="' + e[0] + '">' +
      '<td><span class="car-sit-dot" style="background:' + cor + '"></span>' + e[0] + '</td>' +
      '<td class="car-stat-num">' + e[1] + '</td>' +
      '<td class="car-stat-pct">(' + pct + ')</td>' +
      '</tr>';
  });

  html +=
    '</table></div>' +

    // ── Bloco: Por módulos fiscais ─────────────────────────────────────────
    '<div class="car-stats-section-header" data-target="car-mod-body">' +
    '<span class="car-section-icon">▶</span> Por módulos fiscais/rurais' +
    '</div>' +
    '<div class="car-section-body collapsed" id="car-mod-body">' +
    '<table class="car-stats-table">';

  Object.entries(classMod).forEach(function (e) {
    const pct = ((e[1] / total) * 100).toFixed(1).replace('.', ',') + '%';
    html +=
      '<tr class="car-filter-row" data-filter-type="modulo" data-filter-val="' + e[0] + '">' +
      '<td>' + e[0] + '</td>' +
      '<td class="car-stat-num">' + e[1] + '</td>' +
      '<td class="car-stat-pct">(' + pct + ')</td>' +
      '</tr>';
  });

  html += '</table></div></div></div>';
  return html;
}

// ─── Inicializa interatividade do painel CAR ──────────────────────────────────
function initCarFilters() {
  // Toggle principal
  const mainToggle = document.getElementById('car-stats-toggle');
  const mainBody   = document.getElementById('car-stats-body');
  if (mainToggle && mainBody) {
    mainToggle.addEventListener('click', function () {
      mainBody.classList.toggle('collapsed');
      const icon = mainToggle.querySelector('.car-stats-toggle-icon');
      icon.textContent = mainBody.classList.contains('collapsed') ? '▶' : '▼';
    });
  }

  // Toggles de seção (Por situação / Por módulos)
  document.querySelectorAll('.car-stats-section-header').forEach(function (hdr) {
    hdr.addEventListener('click', function () {
      const body = document.getElementById(hdr.dataset.target);
      if (!body) return;
      body.classList.toggle('collapsed');
      const icon = hdr.querySelector('.car-section-icon');
      icon.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
    });
  });

  // Clique nas linhas de filtro (combinável: situação + módulo independentes)
  document.querySelectorAll('.car-filter-row').forEach(function (row) {
    row.addEventListener('click', function () {
      toggleCarFilter(row.dataset.filterType, row.dataset.filterVal);
    });
  });

  // Botão "Mostrar todos"
  const btnAll = document.getElementById('car-btn-all');
  if (btnAll) {
    btnAll.addEventListener('click', function () { clearCarFilter(); });
  }
}

// ─── Utilitário: somar área de feições ───────────────────────────────────────
function computeArea(geojson) {
  if (!geojson) return 0;
  return geojson.features.reduce(function (acc, f) {
    const v = parseFloat(f.properties.nu_area_im);
    return acc + (isNaN(v) ? 0 : v);
  }, 0);
}

// ─── Estatísticas e filtro da Reserva Legal ───────────────────────────────────
var rlFilter = null; // null | 'rl_averbada' | 'rl_proposta'

function toggleRLFilter(layerId) {
  rlFilter = (rlFilter === layerId) ? null : layerId;
  renderRLFilter();
}

function clearRLFilter() {
  rlFilter = null;
  renderRLFilter();
}

function renderRLFilter() {
  const hasFilter = rlFilter !== null;

  ['rl_averbada', 'rl_proposta'].forEach(function (id) {
    const layer = layerRefs[id];
    if (!layer) return;
    const focused  = !hasFilter || rlFilter === id;
    const fillCol  = id === 'rl_averbada' ? '#2E7D32' : '#81C784';
    layer.eachLayer(function (lyr) {
      if (focused) {
        lyr.setStyle({ color: fillCol, weight: 1, opacity: 0.9,
                       fill: true, fillColor: fillCol,
                       fillOpacity: hasFilter ? 0.55 : 0.45 });
        lyr.options.interactive = true;
      } else {
        lyr.setStyle({ color: '#ccc', weight: 0.5, opacity: 0.15,
                       fill: true, fillColor: '#ccc', fillOpacity: 0.04 });
        lyr.options.interactive = false;
      }
    });
  });

  // Zoom automático para a camada filtrada
  if (hasFilter) {
    const lyr = layerRefs[rlFilter];
    if (lyr && map.hasLayer(lyr)) {
      try { map.fitBounds(lyr.getBounds(), { padding: [40, 40] }); bringMunicipioToFront(); }
      catch (e) {}
    }
  }

  // Atualiza destaques
  document.querySelectorAll('.rl-filter-row').forEach(function (r) {
    r.classList.toggle('active', r.dataset.layerId === rlFilter);
  });

  const indicator = document.getElementById('rl-filter-indicator');
  const btnAll    = document.getElementById('rl-btn-all');
  if (hasFilter) {
    const label = rlFilter === 'rl_averbada' ? 'Reserva Legal Averbada' : 'Reserva Legal Proposta';
    if (indicator) { indicator.textContent = 'Filtro ativo: ' + label; indicator.style.display = 'block'; }
    if (btnAll)    btnAll.style.display = 'block';
  } else {
    if (indicator) indicator.style.display = 'none';
    if (btnAll)    btnAll.style.display    = 'none';
  }
}

function buildRLStats(rlAvData, rlPropData) {
  const avCount   = rlAvData   ? rlAvData.features.length   : 0;
  const propCount = rlPropData ? rlPropData.features.length : 0;
  const total     = avCount + propCount;
  const avArea    = computeArea(rlAvData);
  const propArea  = computeArea(rlPropData);
  const totalArea = avArea + propArea;
  const avPct     = total > 0 ? ((avCount   / total) * 100).toFixed(1).replace('.', ',') + '%' : '—';
  const propPct   = total > 0 ? ((propCount / total) * 100).toFixed(1).replace('.', ',') + '%' : '—';

  return (
    '<div id="rl-stats">' +
    '<div class="car-stats-header" id="rl-stats-toggle">' +
    '<span class="car-stats-toggle-icon">▶</span>' +
    '<span class="car-stats-header-label rl-header-label">Estatísticas — Reserva Legal</span>' +
    '</div>' +
    '<div class="car-stats-body collapsed" id="rl-stats-body">' +

    // Legenda
    '<div class="stats-legend">' +
    '<div class="stats-legend-title">Legenda</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(46,125,50,0.45);border-color:#2E7D32"></span>Reserva Legal Averbada</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(129,199,132,0.4);border-color:#81C784"></span>Reserva Legal Proposta</div>' +
    '</div>' +

    '<div class="car-stats-total">Total: <strong>' + total + '</strong> polígonos · <strong>' + totalArea.toFixed(1) + '</strong> ha</div>' +
    '<div id="rl-filter-indicator" class="car-filter-active" style="display:none"></div>' +
    '<button id="rl-btn-all" class="car-filter-btn" style="display:none">✕ Mostrar todas as Reservas Legais</button>' +
    '<table class="car-stats-table">' +
    '<tr class="car-filter-row rl-filter-row" data-layer-id="rl_averbada">' +
    '<td><span class="car-sit-dot" style="background:#2E7D32"></span>Averbada</td>' +
    '<td class="car-stat-num">' + avCount + '</td>' +
    '<td class="car-stat-pct">(' + avPct + ' · ' + avArea.toFixed(1) + ' ha)</td>' +
    '</tr>' +
    '<tr class="car-filter-row rl-filter-row" data-layer-id="rl_proposta">' +
    '<td><span class="car-sit-dot" style="background:#81C784"></span>Proposta</td>' +
    '<td class="car-stat-num">' + propCount + '</td>' +
    '<td class="car-stat-pct">(' + propPct + ' · ' + propArea.toFixed(1) + ' ha)</td>' +
    '</tr>' +
    '</table>' +
    '</div></div>'
  );
}

function initRLFilters() {
  const mainToggle = document.getElementById('rl-stats-toggle');
  const mainBody   = document.getElementById('rl-stats-body');
  if (mainToggle && mainBody) {
    mainToggle.addEventListener('click', function () {
      mainBody.classList.toggle('collapsed');
      mainToggle.querySelector('.car-stats-toggle-icon').textContent =
        mainBody.classList.contains('collapsed') ? '▶' : '▼';
    });
  }
  document.querySelectorAll('.rl-filter-row').forEach(function (row) {
    row.addEventListener('click', function () { toggleRLFilter(row.dataset.layerId); });
  });
  const btnAll = document.getElementById('rl-btn-all');
  if (btnAll) btnAll.addEventListener('click', clearRLFilter);
}

// ─── Estatísticas e filtro da Vegetação Nativa ────────────────────────────────
var vegTotal  = 0;
var vegFilter = null; // null | rótulo de situação

function toggleVegFilter(sitLabel) {
  vegFilter = (vegFilter === sitLabel) ? null : sitLabel;
  renderVegFilter();
}

function clearVegFilter() {
  vegFilter = null;
  renderVegFilter();
}

function renderVegFilter() {
  const layer     = layerRefs['veg_nativa'];
  const hasFilter = vegFilter !== null;
  let filteredCount  = 0;
  const filtBounds   = L.latLngBounds([]);

  if (layer) {
    layer.eachLayer(function (lyr) {
      const match = !hasFilter || getVegAreaClass(lyr.feature.properties.nu_area_im) === vegFilter;
      if (match) {
        lyr.setStyle({ color: '#1B5E20', weight: 1, opacity: 0.8,
                       fill: true, fillColor: '#1B5E20',
                       fillOpacity: hasFilter ? 0.55 : 0.35 });
        lyr.options.interactive = true;
        filteredCount++;
        if (hasFilter) { try { filtBounds.extend(lyr.getBounds()); } catch(e) {} }
      } else {
        lyr.setStyle({ color: '#ccc', weight: 0.5, opacity: 0.15,
                       fill: true, fillColor: '#ccc', fillOpacity: 0.04 });
        lyr.options.interactive = false;
      }
    });
  }

  document.querySelectorAll('.veg-filter-row').forEach(function (r) {
    r.classList.toggle('active', r.dataset.filterVal === vegFilter);
  });

  const indicator = document.getElementById('veg-filter-indicator');
  const btnAll    = document.getElementById('veg-btn-all');
  const countEl   = document.getElementById('veg-filtered-count');

  if (hasFilter) {
    if (indicator) { indicator.textContent = 'Filtro ativo: ' + vegFilter; indicator.style.display = 'block'; }
    if (btnAll)    btnAll.style.display = 'block';
    if (countEl) {
      const pct = vegTotal > 0 ? ((filteredCount / vegTotal) * 100).toFixed(1).replace('.', ',') + '%' : '—';
      countEl.textContent = filteredCount + ' fragmento(s) (' + pct + ' do total)';
      countEl.style.display = 'block';
    }
    if (filtBounds.isValid()) {
      map.fitBounds(filtBounds, { padding: [40, 40], maxZoom: 16 });
      bringMunicipioToFront();
    }
  } else {
    if (indicator) indicator.style.display = 'none';
    if (btnAll)    btnAll.style.display    = 'none';
    if (countEl)   countEl.style.display   = 'none';
  }
}

function buildVegStats(geojson) {
  vegTotal = geojson.features.length;
  const total     = vegTotal;
  const totalArea = computeArea(geojson);

  // Agrupa por classe de área
  const CLASSES = ['Até 1 ha', '1 a 5 ha', '5 a 10 ha', '10 a 50 ha', 'Acima de 50 ha'];
  const classeCount = {};
  const classeArea  = {};
  CLASSES.forEach(function (c) { classeCount[c] = 0; classeArea[c] = 0; });

  geojson.features.forEach(function (f) {
    const cls = getVegAreaClass(f.properties.nu_area_im);
    if (!cls) return;
    classeCount[cls]++;
    classeArea[cls] += parseFloat(f.properties.nu_area_im) || 0;
  });

  let html =
    '<div id="veg-stats">' +
    '<div class="car-stats-header" id="veg-stats-toggle">' +
    '<span class="car-stats-toggle-icon">▶</span>' +
    '<span class="car-stats-header-label veg-header-label">Estatísticas — Vegetação Nativa</span>' +
    '</div>' +
    '<div class="car-stats-body collapsed" id="veg-stats-body">' +

    '<div class="stats-legend">' +
    '<div class="stats-legend-title">Legenda</div>' +
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(27,94,32,0.35);border-color:#1B5E20"></span>Remanescente de Vegetação Nativa</div>' +
    '</div>' +

    '<div class="car-stats-total">Fragmentos: <strong>' + total + '</strong> · Área total: <strong>' + totalArea.toFixed(1) + '</strong> ha</div>' +
    '<div id="veg-filtered-count" class="car-filtered-count" style="display:none"></div>' +
    '<div id="veg-filter-indicator" class="car-filter-active" style="display:none"></div>' +
    '<button id="veg-btn-all" class="car-filter-btn" style="display:none">✕ Mostrar toda a Vegetação Nativa</button>' +

    '<div class="car-stats-section-header veg-section-header" data-target="veg-area-body">' +
    '<span class="car-section-icon">▶</span> Por classe de área dos fragmentos' +
    '</div>' +
    '<div class="car-section-body collapsed" id="veg-area-body">' +
    '<table class="car-stats-table">';

  CLASSES.forEach(function (cls) {
    const cnt  = classeCount[cls];
    const area = classeArea[cls];
    const pct  = totalArea > 0 ? ((area / totalArea) * 100).toFixed(1).replace('.', ',') + '%' : '—';
    html +=
      '<tr class="car-filter-row veg-filter-row" data-filter-val="' + cls + '">' +
      '<td>' + cls + '</td>' +
      '<td class="car-stat-num">' + cnt + '</td>' +
      '<td class="car-stat-pct">(' + area.toFixed(1) + ' ha · ' + pct + ')</td>' +
      '</tr>';
  });

  html += '</table></div></div></div>';
  return html;
}

function initVegFilters() {
  const mainToggle = document.getElementById('veg-stats-toggle');
  const mainBody   = document.getElementById('veg-stats-body');
  if (mainToggle && mainBody) {
    mainToggle.addEventListener('click', function () {
      mainBody.classList.toggle('collapsed');
      mainToggle.querySelector('.car-stats-toggle-icon').textContent =
        mainBody.classList.contains('collapsed') ? '▶' : '▼';
    });
  }
  document.querySelectorAll('.veg-section-header').forEach(function (hdr) {
    hdr.addEventListener('click', function () {
      const body = document.getElementById(hdr.dataset.target);
      if (!body) return;
      body.classList.toggle('collapsed');
      hdr.querySelector('.car-section-icon').textContent =
        body.classList.contains('collapsed') ? '▶' : '▼';
    });
  });
  // Usa delegação no corpo do painel para evitar conflito com click de seção
  const vegBody = document.getElementById('veg-area-body');
  if (vegBody) {
    vegBody.addEventListener('click', function (e) {
      const row = e.target.closest('.veg-filter-row');
      if (row) toggleVegFilter(row.dataset.filterVal);
    });
  }
  const btnAll = document.getElementById('veg-btn-all');
  if (btnAll) btnAll.addEventListener('click', clearVegFilter);
}

// ─── Carregamento de camadas ──────────────────────────────────────────────────
function processarGeojson(cfg, geojson) {
  // Distritos: tratamento especial (sub-grupo dinâmico)
  if (cfg.id === 'distritos') {
    buildDistrictSubgroup(geojson);
    return;
  }

  let layer;
  if (cfg.tipo === 'point') {
    layer = L.geoJSON(geojson, {
      pointToLayer: function (feature, latlng) {
        var divIcon = makeServiceDivIcon(cfg.id, cfg.estilo.color);
        if (divIcon) return L.marker(latlng, { icon: divIcon });
        return L.circleMarker(latlng, {
          radius:      cfg.estilo.radius || 7,
          color:       '#ffffff',
          weight:      1.5,
          opacity:     1,
          fillColor:   cfg.estilo.color,
          fillOpacity: 0.9
        });
      },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">' + cfg.label + '</div>' +
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty)
        );
      }
    });
  } else if (cfg.id === 'car') {
    layer = L.geoJSON(geojson, {
      style: function (feature) {
        const cor = getCarColor(feature.properties.situacao_a);
        return { color: cor, weight: 1.5, opacity: 0.9,
                 fill: true, fillColor: cor, fillOpacity: 0.25 };
      },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(function () {
          var cod = feature.properties.cod_imovel || '';
          return '<div class="popup-title">' + cfg.label + '</div>' +
            buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty) +
            buildCarMbSection(cod);
        }, { maxWidth: 340, maxHeight: 420 });
      }
    });

    const cbCar = document.getElementById('cb_car');
    if (cbCar) {
      const carItem = cbCar.closest('.layer-item');
      if (carItem) {
        const statsDiv = document.createElement('div');
        statsDiv.innerHTML = buildCarStats(geojson);
        carItem.after(statsDiv.firstChild);
        initCarFilters();
      }
    }
  } else if (cfg.id === 'rl_proposta') {
    // Cria a camada normalmente
    layer = L.geoJSON(geojson, {
      style: function () { return buildStyle(cfg); },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">' + cfg.label + '</div>' +
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty)
        );
      }
    });

    // Injeta painel de estatísticas RL após o .rl-subgroup
    const rlSubgroup = document.querySelector('.rl-subgroup');
    if (rlSubgroup) {
      const statsDiv = document.createElement('div');
      statsDiv.innerHTML = buildRLStats(
        window['GEODATA_RL_AVERBADA'],
        window['GEODATA_RL_PROPOSTA']
      );
      rlSubgroup.after(statsDiv.firstChild);
      initRLFilters();
    }
  } else if (cfg.id === 'veg_nativa') {
    layer = L.geoJSON(geojson, {
      style: function () { return buildStyle(cfg); },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">' + cfg.label + '</div>' +
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty)
        );
      }
    });

    // Injeta painel de estatísticas Veg Nativa após o item da camada
    const cbVeg = document.getElementById('cb_veg_nativa');
    if (cbVeg) {
      const vegItem = cbVeg.closest('.layer-item');
      if (vegItem) {
        const statsDiv = document.createElement('div');
        statsDiv.innerHTML = buildVegStats(geojson);
        vegItem.after(statsDiv.firstChild);
        initVegFilters();
      }
    }
  } else {
    layer = L.geoJSON(geojson, {
      style: function () { return buildStyle(cfg); },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">' + cfg.label + '</div>' +
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty)
        );
      }
    });
  }

  layerRefs[cfg.id] = layer;

  if (cfg.visivel) layer.addTo(map);

  if (cfg.id === 'sjc') {
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    layer.bringToFront();
  } else {
    bringMunicipioToFront();
  }

  const cb = document.getElementById('cb_' + cfg.id);
  if (cb) cb.checked = cfg.visivel;

  syncGroupCheckbox(cfg.grupo);
}

// ─── Camadas raster via L.imageOverlay (funciona com file://) ─────────────────
function buildRasterLegend(cfg) {
  const wrap = document.createElement('div');
  wrap.id = 'legend_' + cfg.id;
  wrap.className = 'raster-legend';

  const header = document.createElement('div');
  header.className = 'raster-legend-header';

  const toggle = document.createElement('span');
  toggle.className = 'raster-legend-toggle';
  toggle.textContent = '▸';

  header.appendChild(toggle);
  header.appendChild(document.createTextNode(' Legenda'));

  const body = document.createElement('div');
  body.className = 'raster-legend-body collapsed';

  cfg.legenda.forEach(function (item) {
    const row = document.createElement('div');
    row.className = 'raster-legend-row';

    const sw = document.createElement('span');
    sw.className = 'raster-legend-swatch';
    sw.style.background = item.cor;

    const lbl = document.createElement('span');
    lbl.textContent = item.label;

    row.appendChild(sw);
    row.appendChild(lbl);
    body.appendChild(row);
  });

  header.addEventListener('click', function () {
    body.classList.toggle('collapsed');
    toggle.textContent = body.classList.contains('collapsed') ? '▸' : '▾';
  });

  wrap.appendChild(header);
  wrap.appendChild(body);
  return wrap;
}

function ensureRelevoLayerOrder() {
  var hs = layerRefs['hillshade'];
  if (hs && map.hasLayer(hs)) hs.bringToFront();
}

function carregarRaster(cfg) {
  const layer = L.imageOverlay(cfg.arquivo, cfg.bounds, {
    opacity:     (cfg.estilo && cfg.estilo.opacity != null) ? cfg.estilo.opacity : 0.4,
    interactive: false,
    className:   'raster-overlay'
  });

  layerRefs[cfg.id] = layer;

  // Garante ordem de renderização: Hillshade sempre no topo do grupo Relevo.
  // Qualquer camada do grupo Relevo que não seja o próprio Hillshade dispara
  // ensureRelevoLayerOrder() ao ser adicionada ao mapa.
  if (cfg.grupo === 'Relevo' && cfg.id !== 'hillshade') {
    layer.on('add', function () { ensureRelevoLayerOrder(); });
  }

  if (cfg.visivel) layer.addTo(map);

  const cb = document.getElementById('cb_' + cfg.id);
  if (cb) cb.checked = cfg.visivel;

  // Injeta legenda discreta abaixo do item de camada
  if (cfg.legenda && cfg.legenda.length && cb) {
    const layerItem = cb.closest('.layer-item');
    if (layerItem) {
      const legendEl = buildRasterLegend(cfg);
      // Oculta a legenda enquanto a camada estiver desligada
      legendEl.style.display = cfg.visivel ? '' : 'none';
      layerItem.after(legendEl);
      // Sincroniza visibilidade da legenda com o checkbox da camada
      cb.addEventListener('change', function () {
        legendEl.style.display = this.checked ? '' : 'none';
      });
    }
  }

  syncGroupCheckbox(cfg.grupo);
  bringMunicipioToFront();
}

function carregarCamada(cfg) {
  // Rasters: carregados via L.imageOverlay, sem varName nem fetch
  if (cfg.tipo === 'raster') {
    carregarRaster(cfg);
    return;
  }

  // Usa variável embutida (geodata.js) se disponível — funciona com file://
  const dadosEmbutidos = window[cfg.varName];
  if (dadosEmbutidos) {
    processarGeojson(cfg, dadosEmbutidos);
    return;
  }

  // Fallback: fetch HTTP (requer servidor local)
  fetch(cfg.arquivo)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (geojson) {
      processarGeojson(cfg, geojson);
    })
    .catch(function (err) {
      console.warn('Não foi possível carregar ' + cfg.arquivo + ':', err);
    });
}

// ─── MapBiomas: estado do filtro interativo ───────────────────────────────────
var mbClassLayers = {};   // valor (int) → L.imageOverlay
var mbFilterAtivo = null; // valor inteiro | 'top3' | null
var mbTop3Vals    = [];   // pré-calculado no buildMapBiomasStats

function mbFilterClass(valor) {
  setLayerVisible(layerRefs['mapbiomas'], false);
  Object.keys(mbClassLayers).forEach(function (v) {
    setLayerVisible(mbClassLayers[v], parseInt(v) === valor);
  });
  mbFilterAtivo = valor;
  mbAtualizarUI();
}

function mbFilterTop3() {
  setLayerVisible(layerRefs['mapbiomas'], false);
  Object.keys(mbClassLayers).forEach(function (v) {
    setLayerVisible(mbClassLayers[v], mbTop3Vals.indexOf(parseInt(v)) !== -1);
  });
  mbFilterAtivo = 'top3';
  mbAtualizarUI();
}

function mbResetFilter(showMain) {
  Object.keys(mbClassLayers).forEach(function (v) {
    var lyr = mbClassLayers[v];
    if (map.hasLayer(lyr)) map.removeLayer(lyr);
  });
  if (showMain) {
    setLayerVisible(layerRefs['mapbiomas'], true);
    var cb = document.getElementById('cb_mapbiomas');
    if (cb && !cb.checked) {
      cb.checked = true;
      syncGroupCheckbox('Uso e Cobertura da Terra');
    }
  }
  mbFilterAtivo = null;
  mbAtualizarUI();
}

function mbAtualizarUI() {
  var badge  = document.getElementById('mb-filter-indicator');
  var btnAll = document.getElementById('mb-btn-todas');
  if (!badge || !btnAll) return;

  var ativo = mbFilterAtivo !== null;
  btnAll.style.display = ativo ? '' : 'none';

  if (mbFilterAtivo === 'top3') {
    badge.style.display = '';
    badge.textContent   = 'Filtro ativo: 3 principais classes';
  } else if (ativo) {
    var cfg = LAYER_CONFIG.find(function (c) { return c.id === 'mapbiomas'; });
    var cls = cfg && cfg.classes.find(function (c) { return c.valor === mbFilterAtivo; });
    badge.style.display = '';
    badge.textContent   = 'Filtro ativo: ' + (cls ? cls.label : mbFilterAtivo);
  } else {
    badge.style.display = 'none';
  }

  document.querySelectorAll('.mb-filter-row').forEach(function (row) {
    var v = parseInt(row.dataset.valor);
    var active = (mbFilterAtivo === 'top3')
      ? mbTop3Vals.indexOf(v) !== -1
      : v === mbFilterAtivo;
    row.classList.toggle('mb-filter-row--active', active);
  });
}

// ─── Painel de estatísticas do MapBiomas ──────────────────────────────────────
function buildMapBiomasStats(cfg) {
  if (!cfg || !cfg.classes) return;
  var cb = document.getElementById('cb_mapbiomas');
  if (!cb) return;
  var layerItem = cb.closest('.layer-item');
  if (!layerItem) return;

  // Pré-carrega overlays individuais por classe (ocultos)
  cfg.classes.forEach(function (cls) {
    mbClassLayers[cls.valor] = L.imageOverlay(cls.arquivo, cfg.bounds, {
      opacity: 1, interactive: false, className: 'raster-overlay'
    });
  });

  // Top 3 por área
  mbTop3Vals = cfg.classes.slice()
    .sort(function (a, b) { return b.pixels - a.pixels; })
    .slice(0, 3)
    .map(function (c) { return c.valor; });

  var totalPx = cfg.classes.reduce(function (s, c) { return s + c.pixels; }, 0);
  var totalHa = Math.round(totalPx * cfg.pixel_ha).toLocaleString('pt-BR');

  // ── HTML ──────────────────────────────────────────────────────────────────
  var rows = '';
  cfg.classes.forEach(function (cls) {
    var ha  = cls.pixels * cfg.pixel_ha;
    var haStr = ha < 1
      ? '&lt; 1 ha'
      : Math.round(ha).toLocaleString('pt-BR') + ' ha';
    var pct = (cls.pixels / totalPx * 100).toFixed(1).replace('.', ',') + '%';
    rows +=
      '<tr class="mb-filter-row" data-valor="' + cls.valor + '">' +
      '<td><span class="mb-swatch" style="background:' + cls.cor + '"></span>' + cls.label + '</td>' +
      '<td class="mb-stat-ha">' + haStr + '</td>' +
      '<td class="mb-stat-pct">' + pct + '</td>' +
      '</tr>';
  });

  var html =
    '<div id="mb-stats">' +
    '<div class="mb-stats-header" id="mb-stats-toggle">' +
    '<span class="mb-stats-toggle-icon">▶</span>' +
    '<span class="mb-stats-header-label">Legenda e Estatísticas</span>' +
    '</div>' +
    '<div class="mb-stats-body collapsed" id="mb-stats-body">' +
    '<div class="mb-stats-actions">' +
    '<button id="mb-btn-principais" class="mb-stat-action-btn">★ Classes Predominantes</button>' +
    '<button id="mb-btn-todas" class="mb-stat-action-btn mb-stat-action-btn--todas" style="display:none">✕ Mostrar todas</button>' +
    '</div>' +
    '<div id="mb-filter-indicator" class="mb-filter-active" style="display:none"></div>' +
    '<div class="mb-stats-total">Área mapeada: <strong>' + totalHa + ' ha</strong></div>' +
    '<table class="mb-stats-table">' + rows + '</table>' +
    '</div></div>';

  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var statsEl = tmp.firstChild;
  statsEl.style.display = cfg.visivel ? '' : 'none';

  // Insere após o layer-item (a legenda não existe pois cfg.legenda está ausente)
  layerItem.after(statsEl);

  // ── Visibilidade sincronizada com CB da camada ─────────────────────────────
  cb.addEventListener('change', function () {
    statsEl.style.display = this.checked ? '' : 'none';
    if (!this.checked) mbResetFilter(false);
  });

  // ── Toggle colapso ────────────────────────────────────────────────────────
  document.getElementById('mb-stats-toggle').addEventListener('click', function () {
    var body = document.getElementById('mb-stats-body');
    var icon = this.querySelector('.mb-stats-toggle-icon');
    body.classList.toggle('collapsed');
    icon.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
  });

  // ── Clique em linha → filtra classe ──────────────────────────────────────
  document.getElementById('mb-stats-body').addEventListener('click', function (e) {
    var row = e.target.closest('.mb-filter-row');
    if (!row) return;
    var v = parseInt(row.dataset.valor);
    if (mbFilterAtivo === v) mbResetFilter(true);
    else mbFilterClass(v);
  });

  // ── Botão Principais ─────────────────────────────────────────────────────
  document.getElementById('mb-btn-principais').addEventListener('click', function () {
    mbFilterTop3();
  });

  // ── Botão Mostrar todas ───────────────────────────────────────────────────
  document.getElementById('mb-btn-todas').addEventListener('click', function () {
    mbResetFilter(true);
  });
}

// ─── Inicialização ────────────────────────────────────────────────────────────
buildPanel();
buildReservaLegalSubgroup();
buildDeclivSubgroup();
LAYER_CONFIG.forEach(carregarCamada);
buildMapBiomasStats(LAYER_CONFIG.find(function (c) { return c.id === 'mapbiomas'; }));

// ─── Busca Global ─────────────────────────────────────────────────────────────

var SEARCH_CONFIG = [
  { layerId: 'distritos',
    getDisplay: function (p) { return limpaValor(p.NM_DIST); },
    searchFields: ['NM_DIST']
  },
  { layerId: 'educacao',
    getDisplay: function (p) { return limpaValor(p.Nome); },
    searchFields: ['Nome', 'Tipo', 'Modalidade', 'Distrito']
  },
  { layerId: 'saude',
    getDisplay: function (p) { return limpaValor(p.Nome); },
    searchFields: ['Nome', 'Endereço']
  },
  { layerId: 'seguranca',
    getDisplay: function (p) { return limpaValor(p.Nome); },
    searchFields: ['Nome', 'Endereço']
  },
  { layerId: 'adm_publica',
    getDisplay: function (p) { return limpaValor(p.Nome); },
    searchFields: ['Nome', 'Endereço']
  },
  { layerId: 'bancos',
    getDisplay: function (p) { return limpaValor(p.Nome); },
    searchFields: ['Nome', 'Endereço']
  },
  { layerId: 'turismo',
    getDisplay: function (p) { return limpaValor(p.Nome); },
    searchFields: ['Nome', 'Endereço']
  },
  { layerId: 'logradouro',
    getDisplay: function (p) {
      var tip = limpaValor(p.NM_TIP_LOG);
      var nm  = limpaValor(p.NM_LOG);
      if (tip !== '—' && nm !== '—') return tip + ' ' + nm;
      return nm !== '—' ? nm : tip;
    },
    searchFields: ['NM_LOG', 'NM_TIP_LOG', 'NM_TIT_LOG']
  },
  { layerId: 'der_rodovia',
    getDisplay: function (p) {
      var sig  = limpaValor(p.SIGLA);
      var desc = limpaValor(p.DESCRICAO);
      if (sig !== '—' && desc !== '—') return sig + ' — ' + desc;
      return sig !== '—' ? sig : desc;
    },
    searchFields: ['SIGLA', 'DESCRICAO']
  },
  { layerId: 'dnit_rodovia',
    getDisplay: function (p) {
      var br = limpaValor(p.vl_br);
      return br !== '—' ? 'BR-' + br : '—';
    },
    searchFields: ['vl_br', 'ds_local_i', 'ds_local_f']
  },
  { layerId: 'car',
    getDisplay: function (p) { return limpaValor(p.cod_imovel); },
    searchFields: ['cod_imovel', 'tipo_imove', 'situacao_a']
  },
  { layerId: 'veg_nativa',
    getDisplay: function (p) {
      var tipo = limpaValor(p.temas_ambi);
      var area = limpaValor(p.nu_area_im);
      if (area !== '—') {
        var a = parseFloat(area);
        return (tipo !== '—' ? tipo : 'Vegetação Nativa') + ' — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha';
      }
      return tipo !== '—' ? tipo : '—';
    },
    searchFields: ['temas_ambi', 'situacao_a', 'nu_area_im']
  },
  { layerId: 'rl_averbada',
    getDisplay: function (p) {
      var area = limpaValor(p.nu_area_im);
      if (area !== '—') {
        var a = parseFloat(area);
        return 'Averbada — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha';
      }
      return 'Averbada';
    },
    searchFields: ['temas_ambi', 'situacao_a', 'nu_area_im']
  },
  { layerId: 'rl_proposta',
    getDisplay: function (p) {
      var area = limpaValor(p.nu_area_im);
      if (area !== '—') {
        var a = parseFloat(area);
        return 'Proposta — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha';
      }
      return 'Proposta';
    },
    searchFields: ['temas_ambi', 'situacao_a', 'nu_area_im']
  }
];

var searchIndex = [];
var searchHighlightLayer = null;

function buildSearchIndex() {
  searchIndex = [];
  SEARCH_CONFIG.forEach(function (sc) {
    var layerCfg = LAYER_CONFIG.find(function (c) { return c.id === sc.layerId; });
    if (!layerCfg) return;
    var data = window[layerCfg.varName];
    if (!data || !data.features) return;

    data.features.forEach(function (feature) {
      var props = feature.properties || {};
      var displayName = sc.getDisplay(props);
      if (!displayName || displayName === '—') return;

      searchIndex.push({
        feature:     feature,
        layerId:     sc.layerId,
        layerLabel:  layerCfg.label,
        layerTipo:   layerCfg.tipo,
        layerCfg:    layerCfg,
        displayName: displayName,
        searchText:  sc.searchFields.map(function (f) {
          return String(props[f] || '');
        }).join(' ').toLowerCase()
      });
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var SEARCH_MAX = 30;

function runSearch(query) {
  var resultsEl = document.getElementById('search-results');
  var q = query.trim().toLowerCase();

  if (q.length < 2) {
    closeSearchResults();
    return;
  }

  var matches = searchIndex.filter(function (item) {
    return item.searchText.indexOf(q) !== -1 ||
           item.displayName.toLowerCase().indexOf(q) !== -1;
  });

  var searchBox = document.getElementById('search-box');

  if (matches.length === 0) {
    resultsEl.innerHTML = '<div class="search-no-result">Nenhum resultado encontrado.</div>';
    resultsEl.style.display = 'block';
    searchBox.classList.add('has-results');
    return;
  }

  var shown = matches.slice(0, SEARCH_MAX);
  var html = '';
  shown.forEach(function (item, i) {
    html += '<div class="search-result-item" data-idx="' + i + '">' +
      '<div class="search-result-name">' + escapeHtml(item.displayName) + '</div>' +
      '<div class="search-result-meta">' + escapeHtml(item.layerLabel) + '</div>' +
      '</div>';
  });
  if (matches.length > SEARCH_MAX) {
    html += '<div class="search-more">+' + (matches.length - SEARCH_MAX) +
            ' resultados adicionais — refine a busca.</div>';
  }

  resultsEl.innerHTML = html;
  resultsEl.style.display = 'block';
  document.getElementById('search-box').classList.add('has-results');

  resultsEl.querySelectorAll('.search-result-item').forEach(function (el, i) {
    el.addEventListener('click', function () { selectSearchResult(shown[i]); });
  });
}

function activateSearchLayer(item) {
  var layerId = item.layerId;

  // Distrito: ativa o CB individual do distrito
  if (layerId === 'distritos') {
    var nm = String(item.feature.properties.NM_DIST || '').trim();
    var safeId = 'distrito_' + nm.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    var distCb = document.getElementById('cb_' + safeId);
    if (distCb && !distCb.checked) {
      distCb.checked = true;
      distCb.dispatchEvent(new Event('change'));
    }
    return;
  }

  var cb = document.getElementById('cb_' + layerId);
  if (cb && !cb.checked) {
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
  }
}

function expandSearchLayerGroup(layerId) {
  var cb = document.getElementById('cb_' + layerId);
  if (!cb) return;
  var body = cb.closest('.group-body');
  if (body && body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    var toggle = body.previousElementSibling &&
                 body.previousElementSibling.querySelector('.group-toggle');
    if (toggle) toggle.textContent = '▾';
  }
}

function zoomToSearchResult(item) {
  var geom = item.feature.geometry;
  if (!geom) return;
  if (geom.type === 'Point') {
    map.setView(L.latLng(geom.coordinates[1], geom.coordinates[0]), 16);
  } else {
    try {
      var bounds = L.geoJSON(item.feature).getBounds();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch (e) { /* feature sem bounds válidos */ }
  }
}

function highlightSearchResult(item) {
  if (searchHighlightLayer) {
    map.removeLayer(searchHighlightLayer);
    searchHighlightLayer = null;
  }
  var geom = item.feature.geometry;
  if (!geom) return;

  if (item.layerTipo === 'point') {
    var ll = L.latLng(geom.coordinates[1], geom.coordinates[0]);
    searchHighlightLayer = L.circleMarker(ll, {
      radius: 20, color: '#FFD600', weight: 3, opacity: 1,
      fillColor: '#FFD600', fillOpacity: 0.25
    }).addTo(map);
  } else {
    searchHighlightLayer = L.geoJSON(item.feature, {
      style: {
        color: '#FFD600',
        weight: item.layerTipo === 'line' ? 5 : 3,
        opacity: 1,
        fillColor: '#FFD600',
        fillOpacity: item.layerTipo === 'polygon' ? 0.35 : 0
      }
    }).addTo(map);
  }

  bringMunicipioToFront();

  setTimeout(function () {
    if (searchHighlightLayer) {
      map.removeLayer(searchHighlightLayer);
      searchHighlightLayer = null;
    }
  }, 2500);
}

function openSearchPopup(item) {
  var layerId = item.layerId;
  var geoLayer;

  if (layerId === 'distritos') {
    var nm = String(item.feature.properties.NM_DIST || '').trim();
    geoLayer = districtLayers[nm];
  } else {
    geoLayer = layerRefs[layerId];
  }

  if (!geoLayer) return;

  geoLayer.eachLayer(function (lyr) {
    if (lyr.feature === item.feature) {
      setTimeout(function () { lyr.openPopup(); }, 350);
    }
  });
}

function closeSearchResults() {
  var resultsEl = document.getElementById('search-results');
  resultsEl.innerHTML = '';
  resultsEl.style.display = 'none';
  document.getElementById('search-box').classList.remove('has-results');
}

function selectSearchResult(item) {
  var inputEl = document.getElementById('search-input');
  inputEl.value = item.displayName;
  closeSearchResults();

  expandSearchLayerGroup(item.layerId);
  activateSearchLayer(item);
  zoomToSearchResult(item);
  highlightSearchResult(item);
  openSearchPopup(item);
}

function clearSearch() {
  var inputEl = document.getElementById('search-input');
  inputEl.value = '';
  closeSearchResults();
  document.querySelector('.search-clear-btn').style.display = 'none';
  if (searchHighlightLayer) {
    map.removeLayer(searchHighlightLayer);
    searchHighlightLayer = null;
  }
  inputEl.focus();
}

// ── Inicialização da busca ─────────────────────────────────────────────────────
(function initSearch() {
  buildSearchIndex();

  var inputEl  = document.getElementById('search-input');
  var clearBtn = document.querySelector('.search-clear-btn');
  var resultsEl = document.getElementById('search-results');
  var debounceTimer = null;

  inputEl.addEventListener('input', function () {
    clearBtn.style.display = this.value.length > 0 ? 'block' : 'none';
    clearTimeout(debounceTimer);
    var q = this.value;
    debounceTimer = setTimeout(function () { runSearch(q); }, 200);
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') clearSearch();
  });

  clearBtn.addEventListener('click', clearSearch);

  // Fecha lista ao clicar fora da caixa de busca
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#search-box')) {
      resultsEl.style.display = 'none';
    }
  });

  // Reabre lista ao focar novamente com texto
  inputEl.addEventListener('focus', function () {
    if (this.value.trim().length >= 2) runSearch(this.value);
  });
})();
