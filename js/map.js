// ─── Basemaps ────────────────────────────────────────────────────────────────
const basemaps = {
  'Carto Positron': L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      crossOrigin: 'anonymous'
    }
  ),
  'OpenStreetMap': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      crossOrigin: 'anonymous'
    }
  ),
  'Esri World Imagery': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
      crossOrigin: 'anonymous' // Esri envia Access-Control-Allow-Origin: * — confirmado por teste direto
    }
  ),
  'OpenTopoMap': L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
      crossOrigin: 'anonymous' // OpenTopoMap envia Access-Control-Allow-Origin: * — confirmado por teste direto
    }
  ),
  'Carto Dark Matter': L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      crossOrigin: 'anonymous'
    }
  )
};

// ─── Mapa ────────────────────────────────────────────────────────────────────
const map = L.map('map', {
  center: [-21.025, -41.654],
  zoom: 12,
  layers: [basemaps['Carto Positron']],
  zoomControl: false,
  zoomSnap: 0.5
});

L.control.zoom({ position: 'topright' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

// ─── Barra de status: Lat/Lon/Zoom/Escala em tempo real ──────────────────────
(function () {
  var elLat   = document.getElementById('sb-lat');
  var elLon   = document.getElementById('sb-lon');
  var elZoom  = document.getElementById('sb-zoom');
  var elScale = document.getElementById('sb-scale');
  if (!elLat || !elLon || !elZoom || !elScale) return;

  function fmtCoord(v) {
    return v.toFixed(5).replace('.', ',');
  }

  // Escala aproximada 1:N para 96dpi, considerando a latitude do centro do mapa
  function calcScaleDenominator(zoom, lat) {
    var metersPerPixel = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom);
    return Math.round(metersPerPixel / 0.00026458333);
  }

  function updateZoomScale() {
    var z = map.getZoom();
    var c = map.getCenter();
    elZoom.textContent = z.toFixed(2);
    var denom = calcScaleDenominator(z, c.lat);
    elScale.textContent = '1:' + denom.toLocaleString('pt-BR');
  }

  map.on('mousemove', function (e) {
    elLat.textContent = fmtCoord(e.latlng.lat);
    elLon.textContent = fmtCoord(e.latlng.lng);
  });

  map.on('mouseout', function () {
    elLat.textContent = '—';
    elLon.textContent = '—';
  });

  map.on('zoomend moveend', updateZoomScale);
  updateZoomScale();
}());

// ─── Indicador de Norte ───────────────────────────────────────────────────────
(function () {
  var NorthControl = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function () {
      var div = L.DomUtil.create('div', 'north-indicator');
      div.innerHTML =
        '<svg viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg" aria-label="Norte" role="img">' +
          // Seta norte (metade esquerda escura, metade direita clara)
          '<polygon points="22,4 30,32 22,27 14,32" fill="#1E3A5F"/>' +
          '<polygon points="22,4 14,32 22,27 30,32" fill="#b0bec5"/>' +
          // Linha divisória central
          '<line x1="22" y1="4" x2="22" y2="32" stroke="#fff" stroke-width="0.8"/>' +
          // Letra N
          '<text x="22" y="50" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" ' +
               'font-size="14" font-weight="700" fill="#1E3A5F" letter-spacing="0">N</text>' +
        '</svg>';
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  new NorthControl().addTo(map);
}());

// ─── Legenda dinâmica ─────────────────────────────────────────────────────────
var _distLayerRefs = [];
var _legendBody = null;

function _lgLine(color, weight, dash) {
  weight = weight || 2;
  var da = dash ? ' stroke-dasharray="' + dash + '"' : '';
  return '<svg width="28" height="12" viewBox="0 0 28 12"><line x1="1" y1="6" x2="27" y2="6" stroke="' + color + '" stroke-width="' + weight + '"' + da + ' stroke-linecap="round"/></svg>';
}
function _lgPoly(stroke, fill, fillOp, dash) {
  fillOp = fillOp !== undefined ? fillOp : 0.35;
  var da = dash ? ' stroke-dasharray="' + dash + '"' : '';
  return '<svg width="18" height="14" viewBox="0 0 18 14"><rect x="1" y="1" width="16" height="12" rx="2" stroke="' + stroke + '" stroke-width="1.8" fill="' + fill + '" fill-opacity="' + fillOp + '"' + da + '/></svg>';
}
function _lgServiceIcon(id, color) {
  var d = SERVICE_ICON_PATHS[id];
  if (!d) return '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="' + color + '" fill-opacity="0.9"/></svg>';
  return '<svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="' + color + '" fill-opacity="0.15"/><path d="' + d + '" fill="' + color + '"/></svg>';
}
function _lgSwatch(cor) {
  return '<svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2" fill="' + cor + '"/></svg>';
}
function _lgItem(sym, label) {
  return '<div class="legend-item"><span class="legend-sym">' + sym + '</span><span class="legend-label">' + label + '</span></div>';
}

function updateLegend() {
  if (!_legendBody) return;
  var html = '';
  var any = false;

  // Limites
  var showSjc  = layerRefs['sjc']  && map.hasLayer(layerRefs['sjc']);
  var showDist = _distLayerRefs.some(function (l) { return map.hasLayer(l); });
  if (showSjc || showDist) {
    html += '<div class="legend-group-title">Limites</div>';
    if (showSjc)  html += _lgItem(_lgLine('#1E3A5F', 3),            'Limite Municipal');
    if (showDist) html += _lgItem(_lgLine('#7E57C2', 2, '8,4'),     'Distritos');
    any = true;
  }

  // Sistema Viário
  var showDnit = layerRefs['dnit_rodovia'] && map.hasLayer(layerRefs['dnit_rodovia']);
  var showDer  = layerRefs['der_rodovia']  && map.hasLayer(layerRefs['der_rodovia']);
  var showLog  = layerRefs['logradouro']   && map.hasLayer(layerRefs['logradouro']);
  if (showDnit || showDer || showLog) {
    html += '<div class="legend-group-title">Sistema Viário</div>';
    if (showDnit) html += _lgItem(_lgLine('#D32F2F', 2),   'Rodovias Federais');
    if (showDer)  html += _lgItem(_lgLine('#FF9800', 2),   'Rodovias Estaduais');
    if (showLog)  html += _lgItem(_lgLine('#9E9E9E', 1.5), 'Logradouros');
    any = true;
  }

  // Hidrografia
  if (layerRefs['drenagem'] && map.hasLayer(layerRefs['drenagem'])) {
    html += '<div class="legend-group-title">Hidrografia</div>';
    html += _lgItem(_lgLine('#2196F3', 1.5), 'Rios e Córregos');
    any = true;
  }

  // Serviços Públicos
  var SERVICOS = [
    { id: 'saude',       cor: '#D32F2F', label: 'Saúde' },
    { id: 'educacao',    cor: '#1565C0', label: 'Educação' },
    { id: 'seguranca',   cor: '#283593', label: 'Segurança' },
    { id: 'adm_publica', cor: '#616161', label: 'Adm. Pública' },
    { id: 'bancos',      cor: '#2E7D32', label: 'Bancos' },
    { id: 'turismo',     cor: '#F57C00', label: 'Turismo e Cultura' }
  ];
  var servHtml = '';
  SERVICOS.forEach(function (s) {
    if (layerRefs[s.id] && map.hasLayer(layerRefs[s.id]))
      servHtml += _lgItem(_lgServiceIcon(s.id, s.cor), s.label);
  });
  if (servHtml) { html += '<div class="legend-group-title">Serviços Públicos</div>' + servHtml; any = true; }

  // Meio Rural e Ambiental
  var showCar    = layerRefs['car']          && map.hasLayer(layerRefs['car']);
  var showVeg    = layerRefs['veg_nativa']   && map.hasLayer(layerRefs['veg_nativa']);
  var showRlA    = layerRefs['rl_averbada']  && map.hasLayer(layerRefs['rl_averbada']);
  var showRlP    = layerRefs['rl_proposta']  && map.hasLayer(layerRefs['rl_proposta']);
  var showAppTot = layerRefs['app_total']    && map.hasLayer(layerRefs['app_total']);
  var showAppRio = layerRefs['app_rios']     && map.hasLayer(layerRefs['app_rios']);
  var showAppNas = layerRefs['app_nascentes']&& map.hasLayer(layerRefs['app_nascentes']);
  var showAppLag = layerRefs['app_lagos']    && map.hasLayer(layerRefs['app_lagos']);
  var showAppDec = layerRefs['app_declividade'] && map.hasLayer(layerRefs['app_declividade']);
  var showAnyApp = showAppTot || showAppRio || showAppNas || showAppLag || showAppDec;
  if (showCar || showVeg || showRlA || showRlP || showAnyApp) {
    html += '<div class="legend-group-title">Meio Rural e Ambiental</div>';
    if (showCar) {
      var mbAtivoLegenda  = layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas']);
      var satAtivoLegenda = basemaps && basemaps['Esri World Imagery'] && map.hasLayer(basemaps['Esri World Imagery']);
      if (!mbAtivoLegenda && !satAtivoLegenda) {
        html += _lgItem(_lgPoly('#2E7D32', '#2E7D32', 0.25), 'CAR — Em conformidade');
        html += _lgItem(_lgPoly('#FFA000', '#FFA000', 0.25), 'CAR — Em regularização');
        html += _lgItem(_lgPoly('#FF6F00', '#FF6F00', 0.25), 'CAR — Aguardando');
      } else {
        html += _lgItem(_lgPoly('#9E9E9E', 'none', 0), 'Imóveis Rurais (CAR)');
      }
    }
    if (showVeg) html += _lgItem(_lgPoly('#1B5E20', '#1B5E20', 0.35), 'Vegetação Nativa');
    if (showRlA) html += _lgItem(_lgPoly('#2E7D32', '#2E7D32', 0.45), 'Reserva Legal Averbada');
    if (showRlP) html += _lgItem(_lgPoly('#81C784', '#81C784', 0.40), 'Reserva Legal Proposta');
    if (showAnyApp) {
      var mbAtLg  = layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas']);
      var satAtLg = basemaps && basemaps['Esri World Imagery'] && map.hasLayer(basemaps['Esri World Imagery']);
      var appSB   = mbAtLg || satAtLg; // somente borda
      html += '<div class="legend-group-title" style="margin-top:4px;font-style:italic">APP Declarada (SICAR)</div>';
      if (showAppTot) html += _lgItem(_lgPoly('#0D47A1', appSB ? 'none' : '#64B5F6', appSB ? 0 : 0.18), 'APP Total');
      if (showAppRio) html += _lgItem(_lgPoly('#0288D1', appSB ? 'none' : '#4FC3F7', appSB ? 0 : 0.22), 'APP de Rios');
      if (showAppNas) html += _lgItem(_lgPoly('#00796B', appSB ? 'none' : '#4DB6AC', appSB ? 0 : 0.25), 'APP de Nascentes');
      if (showAppLag) html += _lgItem(_lgPoly('#01579B', appSB ? 'none' : '#81D4FA', appSB ? 0 : 0.25), 'APP de Lagos');
      if (showAppDec) html += _lgItem(_lgPoly('#5D4037', appSB ? 'none' : '#A1887F', appSB ? 0 : 0.22), 'APP por Declividade');
    }
    any = true;
  }

  // Relevo
  var relHtml = '';
  if (layerRefs['hillshade'] && map.hasLayer(layerRefs['hillshade'])) {
    relHtml += _lgItem(
      '<svg width="28" height="12" viewBox="0 0 28 12"><defs><linearGradient id="lghs" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#111"/><stop offset="50%" stop-color="#777"/><stop offset="100%" stop-color="#f5f5f5"/></linearGradient></defs><rect x="1" y="2" width="26" height="8" rx="2" fill="url(#lghs)"/></svg>',
      'Relevo Sombreado'
    );
  }
  if (layerRefs['hipsometria'] && map.hasLayer(layerRefs['hipsometria'])) {
    var hipsCfg = LAYER_CONFIG.find(function (c) { return c.id === 'hipsometria'; });
    relHtml += '<div class="legend-group-title" style="margin-top:4px;font-style:italic">Hipsometria</div>';
    hipsCfg.legenda.forEach(function (f) { relHtml += _lgItem(_lgSwatch(f.cor), f.label); });
  }
  var DECL = [
    { id: 'decl_plano',      cor: '#1a9850', label: 'Plano (0 – 3°)' },
    { id: 'decl_suave',      cor: '#91cf60', label: 'Suave Ondulado (3 – 8°)' },
    { id: 'decl_ondulado',   cor: '#d9ef8b', label: 'Ondulado (8 – 20°)' },
    { id: 'decl_forte',      cor: '#fee08b', label: 'Forte Ondulado (20 – 35°)' },
    { id: 'decl_montanhoso', cor: '#fc8d59', label: 'Montanhoso (35 – 50°)' },
    { id: 'decl_escarpado',  cor: '#d73027', label: 'Escarpado (> 50°)' }
  ];
  var declHtml = '';
  DECL.forEach(function (dc) {
    if (layerRefs[dc.id] && map.hasLayer(layerRefs[dc.id]))
      declHtml += _lgItem(_lgSwatch(dc.cor), dc.label);
  });
  if (declHtml) relHtml += '<div class="legend-group-title" style="margin-top:4px;font-style:italic">Declividade</div>' + declHtml;
  if (layerRefs['curvas_nivel'] && map.hasLayer(layerRefs['curvas_nivel']))
    relHtml += _lgItem(_lgLine('#D4AF37', 1), 'Curvas de Nível');
  if (relHtml) { html += '<div class="legend-group-title">Relevo</div>' + relHtml; any = true; }

  // MapBiomas
  if (layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas'])) {
    var mbCfg = LAYER_CONFIG.find(function (c) { return c.id === 'mapbiomas'; });
    html += '<div class="legend-group-title">MapBiomas 2024</div>';
    mbCfg.classes.forEach(function (cls) { html += _lgItem(_lgSwatch(cls.cor), cls.label); });
    any = true;
  }

  _legendBody.innerHTML = html;

  // Controla visibilidade do body e do toggle
  var container = _legendBody.parentElement;
  var toggle = container ? container.querySelector('.legend-ctrl-toggle') : null;
  if (!any) {
    _legendBody.style.display = 'none';
    if (toggle) toggle.textContent = '▸';
  } else if (_legendBody.style.display === 'none' && container && container.dataset.userCollapsed !== '1') {
    _legendBody.style.display = '';
    if (toggle) toggle.textContent = '▾';
  }
}

(function () {
  var LegendControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      var container = L.DomUtil.create('div', 'legend-ctrl');
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      var header = L.DomUtil.create('div', 'legend-ctrl-header', container);
      header.innerHTML =
        '<i class="fa fa-list legend-ctrl-icon-fa" aria-hidden="true"></i>' +
        '<span class="legend-ctrl-title">Legenda</span>' +
        '<span class="legend-ctrl-toggle" title="Recolher/Expandir">▾</span>' +
        '<button class="legend-ctrl-close" title="Fechar">✕</button>';

      var body = L.DomUtil.create('div', 'legend-ctrl-body', container);
      body.style.display = 'none';
      _legendBody = body;

      // ── Recolher/Expandir ────────────────────────────────────────────────
      var toggleBtn = header.querySelector('.legend-ctrl-toggle');
      header.addEventListener('click', function (e) {
        if (e.target.classList.contains('legend-ctrl-close')) return;
        var isCollapsed = body.style.display === 'none';
        body.style.display = isCollapsed ? '' : 'none';
        toggleBtn.textContent = isCollapsed ? '▾' : '▸';
        container.dataset.userCollapsed = isCollapsed ? '0' : '1';
      });

      return container;
    }
  });

  var ctrl = new LegendControl();
  ctrl.addTo(map);
  var el = ctrl.getContainer();

  // ── Posicionar acima do minimapa ───────────────────────────────────────
  map.getContainer().appendChild(el);
  el.style.position = 'absolute';
  el.style.right    = '10px';
  el.style.bottom   = '272px';
  el.style.top      = 'auto';
  el.style.left     = 'auto';
  el.style.width    = '240px';
  el.style.zIndex   = 1100;
  el._free = true;

  // ── Botão Reabrir ──────────────────────────────────────────────────────
  var reopenBtn = document.createElement('button');
  reopenBtn.className = 'legend-reopen-btn';
  reopenBtn.innerHTML = '<i class="fa fa-list"></i> Legenda';
  reopenBtn.style.display = 'none';
  map.getContainer().appendChild(reopenBtn);

  // ── Fechar ────────────────────────────────────────────────────────────
  el.querySelector('.legend-ctrl-close').addEventListener('click', function (e) {
    e.stopPropagation();
    el.style.display = 'none';
    reopenBtn.style.display = 'flex';
  });
  reopenBtn.addEventListener('click', function () {
    el.style.display = '';
    reopenBtn.style.display = 'none';
  });

  // ── Arrastar ──────────────────────────────────────────────────────────
  var dragging = false, sx, sy, sl, st;
  var header = el.querySelector('.legend-ctrl-header');

  header.addEventListener('mousedown', function (e) {
    if (e.target.classList.contains('legend-ctrl-close') ||
        e.target.classList.contains('legend-ctrl-toggle')) return;
    // Converte right/bottom para left/top antes de arrastar
    if (el.style.right && el.style.right !== 'auto') {
      var rect = el.getBoundingClientRect();
      var mapRect = map.getContainer().getBoundingClientRect();
      el.style.left   = (rect.left - mapRect.left) + 'px';
      el.style.top    = (rect.top  - mapRect.top)  + 'px';
      el.style.right  = 'auto';
      el.style.bottom = 'auto';
    }
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    sl = parseInt(el.style.left) || 0;
    st = parseInt(el.style.top)  || 0;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    el.style.left = (sl + e.clientX - sx) + 'px';
    el.style.top  = (st + e.clientY - sy) + 'px';
  });

  document.addEventListener('mouseup', function () { dragging = false; });
}());

// Panes para efeito de halo nas Curvas de Nível
// halo (branco, mais grosso) fica logo abaixo da linha principal (marrom)
map.createPane('curvasHaloPane');
map.getPane('curvasHaloPane').style.zIndex = 448;
map.createPane('curvasPane');
map.getPane('curvasPane').style.zIndex = 450;

// ─── Barra de status inferior ─────────────────────────────────────────────────
var _sbLat   = document.getElementById('sb-lat');
var _sbLon   = document.getElementById('sb-lon');
var _sbZoom  = document.getElementById('sb-zoom');
var _sbScale = document.getElementById('sb-scale');

function _calcScale(zoom, lat) {
  // Escala nominal em tela a 96 DPI
  var metersPerPx = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom);
  var scale = metersPerPx * 96 / 0.0254;
  // Arredonda para valor legível
  var mag = Math.pow(10, Math.floor(Math.log10(scale)));
  var rounded = Math.round(scale / mag) * mag;
  return '1:' + rounded.toLocaleString('pt-BR');
}

function _updateZoomScale() {
  var z   = map.getZoom();
  var lat = map.getCenter().lat;
  if (_sbZoom)  _sbZoom.textContent  = z.toFixed(2).replace('.00', '');
  if (_sbScale) _sbScale.textContent = _calcScale(z, lat);
}

map.on('mousemove', function (e) {
  if (_sbLat) _sbLat.textContent = e.latlng.lat.toFixed(5);
  if (_sbLon) _sbLon.textContent = e.latlng.lng.toFixed(5);
});

map.on('mouseout', function () {
  if (_sbLat) _sbLat.textContent = '—';
  if (_sbLon) _sbLon.textContent = '—';
});

map.on('zoomend moveend', _updateZoomScale);
_updateZoomScale();

// ─── Seletor de mapa base (no cabeçalho) ─────────────────────────────────────
(function () {
  var BASEMAP_LABELS = {
    'Carto Positron':     'Carto Positron',
    'OpenStreetMap':      'OpenStreetMap',
    'Esri World Imagery': 'Satélite Esri',
    'OpenTopoMap':        'OpenTopoMap',
    'Carto Dark Matter':  'Carto Dark Matter'
  };
  var currentKey = 'Carto Positron';

  var btn   = document.getElementById('basemap-btn');
  var menu  = document.getElementById('basemap-menu');
  var label = document.getElementById('basemap-btn-label');
  if (!btn || !menu || !label) return;

  function buildMenu() {
    menu.innerHTML = '';
    Object.keys(BASEMAP_LABELS).forEach(function (key) {
      var item = document.createElement('button');
      item.className = 'basemap-menu-item' + (key === currentKey ? ' active' : '');
      item.innerHTML =
        '<i class="fa fa-check basemap-check" aria-hidden="true"></i>' +
        BASEMAP_LABELS[key];
      item.addEventListener('click', function () {
        Object.values(basemaps).forEach(function (b) { map.removeLayer(b); });
        basemaps[key].addTo(map);
        if (layerRefs['sjc']) layerRefs['sjc'].bringToFront();
        currentKey = key;
        label.textContent = BASEMAP_LABELS[key];
        closeMenu();
        buildMenu();
        // Atualiza estilo do CAR e APP ao trocar mapa base (satélite → sem preenchimento)
        if (typeof updateCarStyleForMapbiomas === 'function') updateCarStyleForMapbiomas();
        if (typeof updateAppStyleForBasemap === 'function') updateAppStyleForBasemap();
        updateLegend();
      });
      menu.appendChild(item);
    });
  }

  function openMenu()  { buildMenu(); menu.classList.remove('basemap-menu-hidden'); btn.classList.add('open'); }
  function closeMenu() { menu.classList.add('basemap-menu-hidden'); btn.classList.remove('open'); }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.contains('basemap-menu-hidden') ? openMenu() : closeMenu();
  });
  document.addEventListener('click', function () { closeMenu(); });
  menu.addEventListener('click', function (e) { e.stopPropagation(); });
}());

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

// ─── KML Export ──────────────────────────────────────────────────────────────
var _kmlReg = {};
var _kmlSeq = 0;

function _kmlEsc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _kmlCoordsArr(coords) {
  return coords.map(function(c){ return c[0]+','+c[1]+',0'; }).join(' ');
}
function _kmlGeom(geom) {
  if (!geom) return '';
  var t = geom.type, c = geom.coordinates;
  if (t === 'Point')
    return '<Point><coordinates>'+c[0]+','+c[1]+',0</coordinates></Point>';
  if (t === 'LineString')
    return '<LineString><coordinates>'+_kmlCoordsArr(c)+'</coordinates></LineString>';
  if (t === 'Polygon') {
    var s = '<Polygon><outerBoundaryIs><LinearRing><coordinates>'+_kmlCoordsArr(c[0])+'</coordinates></LinearRing></outerBoundaryIs>';
    for (var ii=1;ii<c.length;ii++) s += '<innerBoundaryIs><LinearRing><coordinates>'+_kmlCoordsArr(c[ii])+'</coordinates></LinearRing></innerBoundaryIs>';
    return s+'</Polygon>';
  }
  if (t === 'MultiPolygon')
    return '<MultiGeometry>'+c.map(function(poly){ return '<Polygon><outerBoundaryIs><LinearRing><coordinates>'+_kmlCoordsArr(poly[0])+'</coordinates></LinearRing></outerBoundaryIs></Polygon>'; }).join('')+'</MultiGeometry>';
  if (t === 'MultiLineString')
    return '<MultiGeometry>'+c.map(function(l){ return '<LineString><coordinates>'+_kmlCoordsArr(l)+'</coordinates></LineString>'; }).join('')+'</MultiGeometry>';
  return '';
}
function _kmlPlacemark(feature, name) {
  var p = feature.properties || {};
  var n = name || p.nome || p.NM_DIST || p.cod_imovel || p.NOME || p.name || 'Feição';
  var ext = '<ExtendedData>';
  Object.keys(p).forEach(function(k){ if(p[k]!=null) ext += '<Data name="'+_kmlEsc(k)+'"><value>'+_kmlEsc(p[k])+'</value></Data>'; });
  ext += '</ExtendedData>';
  return '<Placemark><name>'+_kmlEsc(n)+'</name>'+ext+_kmlGeom(feature.geometry)+'</Placemark>';
}
function _wrapKML(content, docName) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n<name>'+_kmlEsc(docName||'Geoportal SJC')+'</name>\n'+content+'\n</Document>\n</kml>';
}
function _triggerKML(kml, filename) {
  var blob = new Blob([kml], {type:'application/vnd.google-earth.kml+xml'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (filename||'export').replace(/[^\w\-]/g,'_')+'.kml';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 800);
}
function downloadFeatureKML(regId) {
  var feature = _kmlReg[regId];
  if (!feature) return;
  _triggerKML(_wrapKML(_kmlPlacemark(feature), 'Feição'), 'feicao_sjc');
}
function downloadLayerKML(layerId, layerName) {
  var lyr = layerRefs[layerId];
  if (!lyr || typeof lyr.toGeoJSON !== 'function') return;
  var gj = lyr.toGeoJSON();
  var feats = gj.type === 'FeatureCollection' ? gj.features : [gj];
  var content = feats.map(function(f){ return _kmlPlacemark(f); }).join('\n');
  _triggerKML(_wrapKML(content, layerName||layerId), layerName||layerId);
}
function _kmlPopupBtn(feature) {
  var id = 'k'+(++_kmlSeq);
  _kmlReg[id] = feature;
  return '<div class="popup-kml-footer"><button onclick="downloadFeatureKML(\''+id+'\')"><i class="fa fa-download"></i> Baixar KML</button></div>';
}

function buildPopup(props, campos, skipEmpty, feature) {
  let html = '<table class="popup-table">';
  campos.forEach(function (c) {
    const val = limpaValor(props[c.campo]);
    if (skipEmpty && val === '—') return;
    html += '<tr><th>' + c.rotulo + '</th><td>' + val + '</td></tr>';
  });
  html += '</table>';
  if (feature) html += _kmlPopupBtn(feature);
  return html;
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

    const GROUP_ICONS = {
      'Limites Administrativos': '<path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"/>',
      'Sistema Viário':          '<path d="M3 12h18M3 6h18M3 18h18"/><path d="M9 6v12M15 6v12" stroke-dasharray="2 3"/>',
      'Hidrografia':             '<path d="M3 12c1.5-3 3-4.5 4.5-4.5S10.5 9 12 9s3-1.5 4.5-1.5S19.5 9 21 12c-1.5 3-3 4.5-4.5 4.5S13.5 15 12 15s-3 1.5-4.5 1.5S4.5 15 3 12z"/>',
      'Serviços Públicos':       '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>',
      'Meio Rural e Ambiental':  '<path d="M12 22V12m0 0C12 7 8 4 4 5c0 4 3 7 8 7zm0 0c0-5 4-8 8-7-1 4-4 7-8 7"/>',
      'Relevo':                  '<path d="M3 20l5-9 4 5 3-4 6 8H3z"/>',
      'Uso e Cobertura da Terra':'<rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>',
    };
    const iconPaths = GROUP_ICONS[grupo];
    const titleSpan = document.createElement('span');
    titleSpan.className = 'group-title';
    if (iconPaths) {
      titleSpan.innerHTML =
        '<span class="group-icon-box">' +
        '<svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        iconPaths + '</svg></span>' + grupo;
    } else {
      titleSpan.textContent = grupo;
    }

    const toggleSpan = document.createElement('span');
    toggleSpan.className = 'group-toggle';
    toggleSpan.textContent = '▾';

    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'group-badge';
    badgeSpan.textContent = camadas.length;

    header.appendChild(masterCb);
    header.appendChild(titleSpan);
    header.appendChild(badgeSpan);
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
    let appPlaceholderInserted  = false;

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

      // APP Declarada: 5 categorias em sub-grupo expansível
      if (cfg.subgrupo === 'APP Declarada (SICAR)') {
        if (!appPlaceholderInserted) {
          const placeholder = document.createElement('div');
          placeholder.id = 'app-declarada-subgroup';
          body.appendChild(placeholder);
          appPlaceholderInserted = true;
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

  const dlBtn = document.createElement('button');
  dlBtn.className = 'layer-kml-btn';
  dlBtn.title = 'Baixar camada em KML';
  dlBtn.innerHTML = '<i class="fa fa-download"></i>';
  dlBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    downloadLayerKML(cfg.id, cfg.label);
  });

  item.appendChild(cb);
  item.appendChild(swatch);
  item.appendChild(nameEl);
  item.appendChild(dlBtn);
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

// Renderiza o mesmo ícone usado no mapa (halo branco + glifo colorido) num
// canvas via Path2D — usado na legenda do PDF para casar exatamente com os
// marcadores visíveis no mapa, sem depender de Image/data URI.
function renderServiceIconPng(iconId, color, sizePx) {
  var d = SERVICE_ICON_PATHS[iconId];
  if (!d) return null;
  var s = sizePx || 48;
  try {
    var c = document.createElement('canvas');
    c.width = s; c.height = s;
    var ctx = c.getContext('2d');
    ctx.scale(s / 24, s / 24);
    var p = new Path2D(d);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(p);
    ctx.fill(p);
    ctx.fillStyle = color;
    ctx.fill(p);
    return c.toDataURL('image/png');
  } catch (e) { return null; }
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

// ─── Painel de Informações Gerais do Município ────────────────────────────────
var _muniStatsPanel        = null;
var _muniLayerHighlighted  = false;

function _buildMuniMb() {
  if (typeof DISTRITO_MAPBIOMAS === 'undefined') return null;
  var agg = {};
  Object.keys(DISTRITO_MAPBIOMAS).forEach(function (dist) {
    var d = DISTRITO_MAPBIOMAS[dist];
    Object.keys(d).forEach(function (cls) {
      agg[cls] = (agg[cls] || 0) + d[cls];
    });
  });
  return agg;
}

function buildMunicipioMbHTML() {
  var agg = _buildMuniMb();
  if (!agg) return '';

  var totalPx = 0;
  var entries = [];
  Object.keys(agg).forEach(function (val) {
    var px  = agg[val];
    var cls = MB_CLASSES[val];
    if (!cls) return;
    totalPx += px;
    entries.push({ label: cls.label, cor: cls.cor, pixels: px });
  });
  if (!entries.length) return '';
  entries.sort(function (a, b) { return b.pixels - a.pixels; });

  var top    = entries.slice(0, 5);
  var rest   = entries.slice(5);
  var restPx = rest.reduce(function (s, e) { return s + e.pixels; }, 0);

  var rows = top.map(function (e) {
    var ha  = fmtN(e.pixels * MB_PIXEL_HA, 0);
    var pct = totalPx > 0 ? Math.round(e.pixels / totalPx * 100) : 0;
    return '<tr>' +
      '<td><span class="dist-mb-swatch" style="background:' + e.cor + '"></span>' + e.label + '</td>' +
      '<td class="dist-mb-num">' + ha + ' ha</td>' +
      '<td class="dist-mb-pct">' + pct + '%</td>' +
      '</tr>';
  }).join('');

  if (restPx > 0) {
    var haR  = fmtN(restPx * MB_PIXEL_HA, 0);
    var pctR = totalPx > 0 ? Math.round(restPx / totalPx * 100) : 0;
    rows += '<tr class="dist-mb-outras">' +
      '<td><span class="dist-mb-swatch dist-mb-swatch--outras"></span>Outras Classes</td>' +
      '<td class="dist-mb-num">' + haR + ' ha</td>' +
      '<td class="dist-mb-pct">' + pctR + '%</td>' +
      '</tr>';
  }

  return [
    '<table class="dist-stats-table dist-mb-table muni-mb-table">',
    '<thead><tr><th colspan="3">Uso e Cobertura da Terra',
    ' <span class="dist-stats-note">(MapBiomas 2024)</span></th></tr>',
    '<tr class="dist-mb-col-hdr"><th>Classe</th><th class="dist-mb-num">Área</th><th class="dist-mb-pct">%</th></tr>',
    '</thead>',
    '<tbody>', rows, '</tbody>',
    '</table>',
  ].join('');
}

function buildMunicipioStatsHTML() {
  // Agrega serviços de todos os distritos
  var svcAgg = {};
  Object.keys(DIST_SVCNAMES).forEach(function (k) { svcAgg[k] = 0; });
  if (typeof DISTRITO_STATS !== 'undefined') {
    Object.keys(DISTRITO_STATS).forEach(function (dist) {
      var svc = DISTRITO_STATS[dist].servicos || {};
      Object.keys(DIST_SVCNAMES).forEach(function (k) { svcAgg[k] += svc[k] || 0; });
    });
  }
  var svcRows = Object.keys(DIST_SVCNAMES).map(function (k) {
    return '<tr><td>' + DIST_SVCNAMES[k] + '</td><td class="dist-stats-num">' + svcAgg[k] + '</td></tr>';
  }).join('');

  // Agrega cobertura vegetal
  var vegHa = 0, rlAvHa = 0, rlPropHa = 0;
  if (typeof DISTRITO_STATS !== 'undefined') {
    Object.keys(DISTRITO_STATS).forEach(function (dist) {
      var s = DISTRITO_STATS[dist];
      vegHa    += s.veg_nativa_ha    || 0;
      rlAvHa   += s.rl_averbada_ha   || 0;
      rlPropHa += s.rl_proposta_ha   || 0;
    });
  }

  return [
    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Território</th></tr></thead>',
    '<tbody>',
    '<tr><td>Área territorial oficial</td><td class="dist-stats-num">273,5 km²</td></tr>',
    '<tr><td>Distritos administrativos</td><td class="dist-stats-num">4</td></tr>',
    '</tbody>',
    '</table>',

    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Meio Rural</th></tr></thead>',
    '<tbody>',
    '<tr><td>Imóveis Rurais (CAR)</td><td class="dist-stats-num">678</td></tr>',
    '</tbody>',
    '</table>',

    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Cobertura Vegetal <span class="dist-stats-note">(intersecção)</span></th></tr></thead>',
    '<tbody>',
    '<tr><td>Vegetação Nativa</td><td class="dist-stats-num">' + fmtN(vegHa, 1) + ' ha</td></tr>',
    '<tr><td>Reserva Legal Averbada</td><td class="dist-stats-num">' + fmtN(rlAvHa, 1) + ' ha</td></tr>',
    '<tr><td>Reserva Legal Proposta</td><td class="dist-stats-num">' + fmtN(rlPropHa, 1) + ' ha</td></tr>',
    '</tbody>',
    '</table>',
    '<p class="muni-stats-note">Áreas ambientais estimadas por processamento espacial.</p>',

    (function () {
      var stats   = _getAppMuniStats();
      var haTotal = stats['app_total'] ? stats['app_total'].ha : 0;
      var totalFmt = haTotal.toFixed(2).replace('.', ',');

      var catRows = _APP_CAT_SOURCES.map(function (src) {
        var s   = stats[src.key] || { ha: 0 };
        var pct = _fmtPct(s.ha, haTotal, 1);
        return '<tr><td>' + src.label + '</td>' +
               '<td class="dist-stats-num">' + s.ha.toFixed(2).replace('.', ',') + ' ha</td>' +
               '<td class="dist-stats-num">' + (pct || '—') + '</td></tr>';
      }).join('');

      return '<table class="dist-stats-table">' +
        '<thead><tr><th colspan="3">APP Declarada <span class="dist-stats-note">(SICAR)</span></th></tr></thead>' +
        '<tbody>' +
        '<tr><td colspan="2"><strong>APP Total Declarada</strong></td>' +
        '<td class="dist-stats-num"><strong>' + totalFmt + ' ha</strong></td></tr>' +
        catRows +
        '</tbody></table>' +
        '<p class="muni-stats-note" style="font-style:italic">' + _APP_NOTA + '</p>';
    }()),

    buildMunicipioMbHTML(),

    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Serviços Públicos <span class="dist-stats-note">(ponto dentro)</span></th></tr></thead>',
    '<tbody>', svcRows, '</tbody>',
    '</table>',
  ].join('');
}

// Aplica o destaque persistente no limite municipal. As estatísticas em si
// aparecem no popup/painel flutuante (bindPopup do sjc), não mais num
// painel fixo na barra lateral.
function showMunicipioStatsPanel(layer, baseEstilo) {
  if (_muniLayerHighlighted && layer) {
    layer.setStyle(Object.assign({}, baseEstilo));
  }
  if (layer) {
    layer.setStyle({
      color:       '#1E3A5F',
      weight:      3,
      fillColor:   '#1E3A5F',
      fillOpacity: 0.12,
    });
  }
  _muniLayerHighlighted = true;
  bringMunicipioToFront();
}

function clearMunicipioStatsSelection() {
  var sjcLayer = layerRefs['sjc'];
  var sjcCfg   = LAYER_CONFIG.find(function (c) { return c.id === 'sjc'; });
  if (sjcLayer && sjcCfg) {
    sjcLayer.setStyle(buildStyle(sjcCfg));
    bringMunicipioToFront();
  }
  _muniLayerHighlighted = false;
}

// ─── Painel de estatísticas por distrito ─────────────────────────────────────
var _selectedDistLayer  = null;   // L.geoJSON layer do distrito selecionado
var _selectedDistEstilo = null;   // estilo base para restaurar
var _distStatsPanel     = null;   // elemento DOM do painel

var DIST_SVCNAMES = {
  educacao:    'Educação',
  saude:       'Saúde',
  seguranca:   'Segurança',
  adm_publica: 'Administração Pública',
  bancos:      'Bancos',
  turismo:     'Turismo e Cultura',
};

function fmtN(n, dec) {
  return n.toFixed(dec).replace('.', ',');
}

function buildDistritoMbHTML(nm) {
  var lookup = (typeof DISTRITO_MAPBIOMAS !== 'undefined') ? DISTRITO_MAPBIOMAS[nm] : null;
  if (!lookup) return '';

  // Converter para array e ordenar desc
  var entries = [];
  var totalPx = 0;
  Object.keys(lookup).forEach(function (val) {
    var px  = lookup[val];
    var cls = MB_CLASSES[val];
    if (!cls) return;
    totalPx += px;
    entries.push({ label: cls.label, cor: cls.cor, pixels: px });
  });
  if (!entries.length) return '';
  entries.sort(function (a, b) { return b.pixels - a.pixels; });

  // Top 5 + agrupamento "Outras Classes"
  var top     = entries.slice(0, 5);
  var rest    = entries.slice(5);
  var restPx  = rest.reduce(function (s, e) { return s + e.pixels; }, 0);

  var rows = top.map(function (e) {
    var ha  = fmtN(e.pixels * MB_PIXEL_HA, 0);
    var pct = totalPx > 0 ? Math.round(e.pixels / totalPx * 100) : 0;
    return '<tr>' +
      '<td><span class="dist-mb-swatch" style="background:' + e.cor + '"></span>' + e.label + '</td>' +
      '<td class="dist-mb-num">' + ha + ' ha</td>' +
      '<td class="dist-mb-pct">' + pct + '%</td>' +
      '</tr>';
  }).join('');

  if (restPx > 0) {
    var haRest  = fmtN(restPx * MB_PIXEL_HA, 0);
    var pctRest = totalPx > 0 ? Math.round(restPx / totalPx * 100) : 0;
    rows += '<tr class="dist-mb-outras">' +
      '<td><span class="dist-mb-swatch dist-mb-swatch--outras"></span>Outras Classes</td>' +
      '<td class="dist-mb-num">' + haRest + ' ha</td>' +
      '<td class="dist-mb-pct">' + pctRest + '%</td>' +
      '</tr>';
  }

  return [
    '<table class="dist-stats-table dist-mb-table">',
    '<thead><tr><th colspan="3">Uso e Cobertura da Terra',
    ' <span class="dist-stats-note">(MapBiomas 2024)</span></th></tr>',
    '<tr class="dist-mb-col-hdr"><th>Classe</th><th class="dist-mb-num">Área</th><th class="dist-mb-pct">%</th></tr>',
    '</thead>',
    '<tbody>', rows, '</tbody>',
    '</table>',
  ].join('');
}

function buildDistritoStatsHTML(nm) {
  var stats = (typeof DISTRITO_STATS !== 'undefined') ? DISTRITO_STATS[nm] : null;
  if (!stats) {
    return '<p class="dist-stats-empty">Dados não disponíveis para este distrito.</p>';
  }

  var svcRows = Object.keys(DIST_SVCNAMES).map(function (k) {
    var cnt = stats.servicos[k] || 0;
    return '<tr><td>' + DIST_SVCNAMES[k] + '</td><td class="dist-stats-num">' + cnt + '</td></tr>';
  }).join('');

  return [
    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Território</th></tr></thead>',
    '<tbody>',
    '<tr><td>Área</td><td class="dist-stats-num">' + fmtN(stats.area_ha, 1) + ' ha&nbsp;/ ' + fmtN(stats.area_km2, 2) + ' km²</td></tr>',
    '</tbody>',
    '</table>',

    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Meio Rural e Ambiental <span class="dist-stats-note">(centroide)</span></th></tr></thead>',
    '<tbody>',
    '<tr><td>Imóveis Rurais (CAR)</td><td class="dist-stats-num">' + stats.car_count + '</td></tr>',
    '</tbody>',
    '</table>',

    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Cobertura Vegetal <span class="dist-stats-note">(intersecção)</span></th></tr></thead>',
    '<tbody>',
    '<tr><td>Vegetação Nativa</td><td class="dist-stats-num">' + fmtN(stats.veg_nativa_ha, 1) + ' ha</td></tr>',
    '<tr><td>Reserva Legal Averbada</td><td class="dist-stats-num">' + fmtN(stats.rl_averbada_ha, 1) + ' ha</td></tr>',
    '<tr><td>Reserva Legal Proposta</td><td class="dist-stats-num">' + fmtN(stats.rl_proposta_ha, 1) + ' ha</td></tr>',
    '</tbody>',
    '</table>',

    (function () {
      var tot   = stats.app_total_ha       || 0;
      var cats  = [
        { label: 'APP de Rios',         ha: stats.app_rios_ha        || 0 },
        { label: 'APP de Nascentes',    ha: stats.app_nascentes_ha   || 0 },
        { label: 'APP de Lagos',        ha: stats.app_lagos_ha       || 0 },
        { label: 'APP por Declividade', ha: stats.app_declividade_ha || 0 },
      ];
      var catRows = cats.map(function (c) {
        var pct = tot > 0 ? ((c.ha / tot) * 100).toFixed(1).replace('.', ',') + '%' : '—';
        return '<tr><td>' + c.label + '</td>' +
               '<td class="dist-stats-num">' + c.ha.toFixed(2).replace('.', ',') + ' ha</td>' +
               '<td class="dist-stats-num">' + pct + '</td></tr>';
      }).join('');
      return '<table class="dist-stats-table">' +
        '<thead><tr><th colspan="3">APP Declarada <span class="dist-stats-note">(SICAR · intersecção)</span></th></tr></thead>' +
        '<tbody>' +
        '<tr><td colspan="2"><strong>APP Total Declarada</strong></td>' +
        '<td class="dist-stats-num"><strong>' + tot.toFixed(2).replace('.', ',') + ' ha</strong></td></tr>' +
        catRows +
        '</tbody></table>';
    }()),

    buildDistritoMbHTML(nm),

    '<table class="dist-stats-table">',
    '<thead><tr><th colspan="2">Serviços Públicos <span class="dist-stats-note">(ponto dentro)</span></th></tr></thead>',
    '<tbody>', svcRows, '</tbody>',
    '</table>',
  ].join('');
}

// Aplica o destaque persistente (laranja) no distrito selecionado pelo nome
// na barra lateral. As estatísticas em si aparecem no popup/painel flutuante
// (bindPopup do distrito), não mais num painel fixo na sidebar.
function showDistritoStats(nm, layer, baseEstilo) {
  // Restaurar destaque anterior
  if (_selectedDistLayer && _selectedDistLayer !== layer) {
    _selectedDistLayer.setStyle(Object.assign({}, _selectedDistEstilo));
    bringMunicipioToFront();
  }

  _selectedDistLayer  = layer;
  _selectedDistEstilo = baseEstilo;

  // Highlight persistente
  layer.setStyle({
    color:       '#E65100',
    weight:      3,
    fillColor:   '#FF9800',
    fillOpacity: 0.35,
    dashArray:   null
  });
  bringMunicipioToFront();
}

function clearDistritoSelection() {
  if (_selectedDistLayer) {
    _selectedDistLayer.setStyle(Object.assign({}, _selectedDistEstilo));
    bringMunicipioToFront();
    _selectedDistLayer  = null;
    _selectedDistEstilo = null;
  }
  if (_distStatsPanel) _distStatsPanel.style.display = 'none';
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
    'width:16px;height:12px;background:rgba(126,87,194,0.10);' +
    'border:2px dashed #7E57C2;flex-shrink:0;border-radius:2px;';

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
    color:       '#7E57C2',
    weight:      2,
    opacity:     1,
    fill:        true,
    fillColor:   '#7E57C2',
    fillOpacity: 0.10,
    dashArray:   '8,4'
  };

  distNomes.forEach(function (nm) {
    // Cria layer individual para o distrito
    const distGeojson = { type: 'FeatureCollection', features: byDist[nm] };
    const layer = L.geoJSON(distGeojson, {
      style: function () { return Object.assign({}, distEstilo); },
      onEachFeature: function (feature, lyr) {
        // Conteúdo dinâmico: mostra as mesmas estatísticas do distrito
        // (Território, Meio Rural, Cobertura Vegetal, MapBiomas, Serviços
        // Públicos) diretamente no popup/painel flutuante, em vez do painel
        // fixo na barra lateral.
        lyr.bindPopup(function () {
          var distNm = (feature.properties.NM_DIST || 'Sem nome').trim();
          return '<div class="popup-title">' + distNm + '</div>' + buildDistritoStatsHTML(distNm);
        });
        // Clique direto no polígono no mapa também aplica o destaque
        // persistente (laranja) — mesma ação do clique no nome na lista.
        lyr.on('click', function (e) {
          L.DomEvent.stopPropagation(e.originalEvent);
          map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 14 });
          showDistritoStats(nm, layer, Object.assign({}, distEstilo));
        });
      }
    });

    const safeId = 'distrito_' + nm.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    // Distritos iniciam desligados (não adicionados ao mapa)
    districtLayers[nm] = layer;
    layerRefs[safeId] = layer;
    _distLayerRefs.push(layer);
    layer.on('add remove', updateLegend);

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

    // Zoom + highlight persistente + abre o popup com as estatísticas
    // (mesmo conteúdo de quando se clica no polígono direto no mapa)
    nameSpan.addEventListener('click', (function (capturedNm, capturedLayer) {
      return function () {
        if (!map.hasLayer(capturedLayer)) {
          cb.checked = true;
          setLayerVisible(capturedLayer, true);
          syncGroupCheckbox(grupo);
          const allDist = subgroup.querySelectorAll('.district-item-cb');
          let tot = 0, chk = 0;
          allDist.forEach(function (c) { tot++; if (c.checked) chk++; });
          subMasterCb.checked = chk === tot;
          subMasterCb.indeterminate = chk > 0 && chk < tot;
        }
        map.fitBounds(capturedLayer.getBounds(), { padding: [30, 30], maxZoom: 14 });
        showDistritoStats(capturedNm, capturedLayer, Object.assign({}, distEstilo));
        var firstChild = capturedLayer.getLayers()[0];
        if (firstChild) firstChild.openPopup(capturedLayer.getBounds().getCenter());
      };
    }(nm, layer)));

    item.appendChild(cb);
    item.appendChild(nameSpan);
    subBody.appendChild(item);
  });

  subgroup.appendChild(subHeader);
  subgroup.appendChild(subBody);

  // As estatísticas do distrito agora aparecem no popup/painel flutuante
  // (bindPopup), não mais num painel fixo na barra lateral.
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

// ─── Sub-grupo de APP Declarada (SICAR) ──────────────────────────────────────
function buildAppSubgroup() {
  const placeholder = document.getElementById('app-declarada-subgroup');
  if (!placeholder) return;

  const grupo      = 'Meio Rural e Ambiental';
  const appCamadas = LAYER_CONFIG.filter(function (c) { return c.subgrupo === 'APP Declarada (SICAR)'; });

  const subgroup = document.createElement('div');
  subgroup.className = 'app-subgroup';

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  const subHeader = document.createElement('div');
  subHeader.className = 'app-subgroup-header';

  const subMasterCb = document.createElement('input');
  subMasterCb.type = 'checkbox';
  subMasterCb.className = 'layer-cb app-master-cb';
  subMasterCb.id = 'cb_app_master';
  subMasterCb.checked = false;
  subMasterCb.title = 'Ligar/desligar APP Declarada';

  subMasterCb.addEventListener('click', function (e) { e.stopPropagation(); });
  subMasterCb.addEventListener('change', function () {
    const on = this.checked;
    subgroup.querySelectorAll('.app-item-cb').forEach(function (cb) {
      cb.checked = on;
      cb.dispatchEvent(new Event('change'));
    });
    syncGroupCheckbox(grupo);
  });

  // Swatch representando as APPs (azul água)
  const appSwatch = document.createElement('span');
  appSwatch.className = 'legend-swatch';
  appSwatch.style.cssText =
    'width:16px;height:12px;background:rgba(2,136,209,0.35);' +
    'border:2px solid #0D47A1;flex-shrink:0;border-radius:2px;';

  const subTitle = document.createElement('span');
  subTitle.className = 'app-subgroup-title';
  subTitle.textContent = 'APP Declarada (SICAR)';

  const novoBadge = document.createElement('span');
  novoBadge.className = 'app-novo-badge';
  novoBadge.textContent = 'NOVO';

  const subToggle = document.createElement('span');
  subToggle.className = 'app-subgroup-toggle';
  subToggle.textContent = '▸';

  subHeader.appendChild(subMasterCb);
  subHeader.appendChild(appSwatch);
  subHeader.appendChild(subTitle);
  subHeader.appendChild(novoBadge);
  subHeader.appendChild(subToggle);

  // ── Corpo (inicia recolhido) ───────────────────────────────────────────────
  const subBody = document.createElement('div');
  subBody.className = 'app-subgroup-body collapsed';

  subHeader.addEventListener('click', function (e) {
    if (e.target === subMasterCb) return;
    subBody.classList.toggle('collapsed');
    subToggle.textContent = subBody.classList.contains('collapsed') ? '▸' : '▾';
  });

  // ── Sincroniza master do sub-grupo ────────────────────────────────────────
  function syncAppMaster() {
    const all = subgroup.querySelectorAll('.app-item-cb');
    let tot = 0, chk = 0;
    all.forEach(function (c) { tot++; if (c.checked) chk++; });
    subMasterCb.checked       = chk > 0 && chk === tot;
    subMasterCb.indeterminate = chk > 0 && chk < tot;
  }

  // ── Itens individuais ──────────────────────────────────────────────────────
  appCamadas.forEach(function (cfg) {
    const item = document.createElement('label');
    item.className = 'layer-item app-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'layer-cb app-item-cb';
    cb.id = 'cb_' + cfg.id;
    cb.checked = cfg.visivel || false;

    cb.addEventListener('change', function () {
      setLayerVisible(layerRefs[cfg.id], this.checked);
      syncAppMaster();
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

// ─── Estilo CAR adaptativo ao MapBiomas ──────────────────────────────────────
var carFocusedLayers = new Set(); // imóveis CAR atualmente em foco (0, 1 ou vários)

function updateCarStyleForMapbiomas() {
  var carLayer = layerRefs['car'];
  if (!carLayer) return;

  // Se há imóveis CAR em foco, reaplica o foco (a borda amarela e a regra de
  // fillOpacity dependem do estado atual do MapBiomas) em vez de resetar
  // todos os imóveis ao estilo uniforme — preserva a(s) seleção(ões).
  if (carFocusedLayers.size > 0) {
    refreshCarFocusVisuals();
    return;
  }

  var mbActive      = layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas']);
  var sateliteAtivo = basemaps && basemaps['Esri World Imagery'] && map.hasLayer(basemaps['Esri World Imagery']);
  var soBorda       = mbActive || sateliteAtivo;
  carLayer.eachLayer(function (lyr) {
    var props = lyr.feature && lyr.feature.properties;
    var cor   = getCarColor(props ? props.situacao_a : null);
    if (soBorda) {
      lyr.setStyle({ color: cor, weight: 2, opacity: 1, fill: true, fillColor: cor, fillOpacity: 0 });
    } else {
      lyr.setStyle({ color: cor, weight: 1.5, opacity: 0.9, fill: true, fillColor: cor, fillOpacity: 0.25 });
    }
  });
}

// ─── Estilo adaptativo das camadas APP (somente borda com MapBiomas/Satélite) ──
var APP_ESTILOS = {
  app_total:       { border: '#0D47A1', fill: '#64B5F6', fillOpacity: 0.18 },
  app_rios:        { border: '#0288D1', fill: '#4FC3F7', fillOpacity: 0.22 },
  app_nascentes:   { border: '#00796B', fill: '#4DB6AC', fillOpacity: 0.25 },
  app_lagos:       { border: '#01579B', fill: '#81D4FA', fillOpacity: 0.25 },
  app_declividade: { border: '#5D4037', fill: '#A1887F', fillOpacity: 0.22 }
};

function updateAppStyleForBasemap() {
  var mbActive  = layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas']);
  var satAtivo  = basemaps && basemaps['Esri World Imagery'] && map.hasLayer(basemaps['Esri World Imagery']);
  var soBorda   = mbActive || satAtivo;
  Object.keys(APP_ESTILOS).forEach(function (id) {
    var lyr = layerRefs[id];
    if (!lyr) return;
    var est = APP_ESTILOS[id];
    lyr.eachLayer(function (sub) {
      sub.setStyle({
        color: est.border, weight: 1.5, opacity: 1,
        fill: true, fillColor: est.fill, fillOpacity: soBorda ? 0 : est.fillOpacity
      });
    });
  });
}

// ─── Máscara de foco (spotlight) sobre o(s) imóvel(is) CAR selecionado(s) ───
// Um polígono "donut" (anel externo cobrindo o viewport + um anel interno por
// imóvel focado, usando fillRule evenodd) cria recortes transparentes
// exatamente sobre os imóveis selecionados, apagando visualmente todo o resto
// do mapa (MapBiomas, basemap, demais camadas) com um véu branco.
// Cópias dos contornos dos imóveis são redesenhadas acima da máscara para
// manter as bordas amarelas nítidas, já que a máscara fica acima do CAR original.
//
// O anel externo usa os limites do viewport atual (com bastante padding),
// recalculado em 'moveend'/'zoomend' — NÃO usa um retângulo fixo cobrindo o
// mundo todo: em zooms altos, coordenadas de pixel tão extremas fazem o
// algoritmo de clipping do renderer SVG do Leaflet colapsar o polígono num
// ponto degenerado (bug observado: o anel virava "M0 0L0 0Z", sem mascarar nada).
var CAR_FOCUS_MASK_PANE    = 'carFocusMaskPane';
var CAR_FOCUS_OUTLINE_PANE = 'carFocusOutlinePane';
var carFocusMaskLayer        = null;
var carFocusOutlineLayers    = [];
var carFocusMaskMoveHandler  = null;

function ensureCarFocusPanes() {
  if (!map.getPane(CAR_FOCUS_MASK_PANE)) {
    var maskPane = map.createPane(CAR_FOCUS_MASK_PANE);
    maskPane.style.zIndex = '410';
    maskPane.style.pointerEvents = 'none'; // nunca bloqueia clique/pan/zoom
  }
  if (!map.getPane(CAR_FOCUS_OUTLINE_PANE)) {
    var outlinePane = map.createPane(CAR_FOCUS_OUTLINE_PANE);
    outlinePane.style.zIndex = '415';
    outlinePane.style.pointerEvents = 'none';
  }
}

// Achata getLatLngs() (Polygon ou MultiPolygon, com ou sem buracos próprios)
// numa lista plana de anéis (cada anel = array de L.LatLng).
function collectPolygonRings(latlngs, out) {
  if (!Array.isArray(latlngs) || !latlngs.length) return;
  if (typeof latlngs[0].lat === 'number') {
    out.push(latlngs);
  } else {
    latlngs.forEach(function (sub) { collectPolygonRings(sub, out); });
  }
}

function buildCarFocusOuterRing() {
  // Padding generoso (2x o viewport em cada direção) para que o véu já esteja
  // pronto durante o pan, sem precisar recalcular a cada frame.
  var b = map.getBounds().pad(2);
  return [
    L.latLng(b.getNorth(), b.getWest()),
    L.latLng(b.getNorth(), b.getEast()),
    L.latLng(b.getSouth(), b.getEast()),
    L.latLng(b.getSouth(), b.getWest())
  ];
}

function buildCarFocusHoleRings() {
  var holeRings = [];
  carFocusedLayers.forEach(function (lyr) { collectPolygonRings(lyr.getLatLngs(), holeRings); });
  return holeRings;
}

// Reposiciona só o anel externo da máscara (chamado em pan/zoom) — os
// recortes internos (imóveis) já são reprojetados automaticamente pelo
// próprio Leaflet, não precisam ser recalculados aqui.
function refreshCarFocusMaskBounds() {
  if (!carFocusMaskLayer) return;
  carFocusMaskLayer.setLatLngs([buildCarFocusOuterRing()].concat(buildCarFocusHoleRings()));
}

function removeCarFocusMask() {
  if (carFocusMaskMoveHandler) { map.off('moveend zoomend', carFocusMaskMoveHandler); carFocusMaskMoveHandler = null; }
  if (carFocusMaskLayer) { map.removeLayer(carFocusMaskLayer); carFocusMaskLayer = null; }
  carFocusOutlineLayers.forEach(function (l) { map.removeLayer(l); });
  carFocusOutlineLayers = [];
}

// Reconstrói o estilo de todos os imóveis CAR (focados x demais) e a máscara
// de spotlight com base no conteúdo atual de carFocusedLayers.
function refreshCarFocusVisuals() {
  var carLayer = layerRefs['car'];
  if (!carLayer) return;
  var mbActive      = layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas']);
  var sateliteAtivo = basemaps && basemaps['Esri World Imagery'] && map.hasLayer(basemaps['Esri World Imagery']);
  var soBorda       = mbActive || sateliteAtivo;
  var peso = (soBorda ? 2 : 1.5) + 2;

  carLayer.eachLayer(function (lyr) {
    var props = lyr.feature && lyr.feature.properties;
    var cor   = getCarColor(props ? props.situacao_a : null);
    if (carFocusedLayers.has(lyr)) {
      lyr.setStyle({
        color: '#FFD400', weight: peso, opacity: 1, dashArray: null,
        fill: true, fillColor: cor, fillOpacity: soBorda ? 0 : 0.25
      });
      if (typeof lyr.bringToFront === 'function') lyr.bringToFront();
    } else {
      lyr.setStyle({
        color: cor, weight: 1, opacity: 0.2, dashArray: null,
        fill: true, fillColor: cor, fillOpacity: 0.06
      });
    }
  });

  try {
    ensureCarFocusPanes();
    removeCarFocusMask();
    if (carFocusedLayers.size === 0) return;

    carFocusMaskLayer = L.polygon([buildCarFocusOuterRing()].concat(buildCarFocusHoleRings()), {
      pane:        CAR_FOCUS_MASK_PANE,
      stroke:      false,
      fill:        true,
      fillColor:   '#ffffff',
      fillOpacity: 0.45,
      fillRule:    'evenodd',
      interactive: false
    }).addTo(map);

    carFocusedLayers.forEach(function (lyr) {
      var props = lyr.feature && lyr.feature.properties;
      var cor   = getCarColor(props ? props.situacao_a : null);
      carFocusOutlineLayers.push(L.polygon(lyr.getLatLngs(), {
        pane:        CAR_FOCUS_OUTLINE_PANE,
        color:       '#FFD400',
        weight:      peso,
        opacity:     1,
        fill:        soBorda ? false : true,
        fillColor:   cor,
        fillOpacity: soBorda ? 0 : 0.25,
        interactive: false
      }).addTo(map));
    });

    carFocusMaskMoveHandler = refreshCarFocusMaskBounds;
    map.on('moveend zoomend', carFocusMaskMoveHandler);
  } catch (e) { console.warn('[CAR Focus] Falha ao criar máscara de spotlight:', e); }
}

// ─── Foco visual no(s) imóvel(is) CAR selecionado(s) ─────────────────────────
// Adiciona um imóvel ao conjunto em foco (não remove os demais já focados —
// suporta múltiplos painéis/imóveis abertos simultaneamente).
function applyCarFocus(selectedLayer) {
  if (!selectedLayer) return;
  carFocusedLayers.add(selectedLayer);
  refreshCarFocusVisuals();
}

// Remove um único imóvel do foco (chamado ao fechar o painel daquele imóvel
// específico) — os demais imóveis focados, se houver, permanecem em foco.
function removeCarFocus(selectedLayer) {
  carFocusedLayers.delete(selectedLayer);
  if (carFocusedLayers.size === 0) {
    removeCarFocusMask();
    updateCarStyleForMapbiomas();
  } else {
    refreshCarFocusVisuals();
  }
}

// Restaura todos os imóveis CAR ao estilo correto para o estado atual do
// MapBiomas, remove a máscara de spotlight e limpa todo o foco (usado pelo
// reset geral / "Limpar Seleção", que fecham todos os painéis de uma vez).
function clearCarFocus() {
  carFocusedLayers.clear();
  removeCarFocusMask();
  updateCarStyleForMapbiomas();
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

// ─── Estatísticas APP — fontes de dados ──────────────────────────────────────
var _APP_TOTAL_SRC = {
  key: 'app_total', label: 'APP Total Declarada',
  data: function () { return (typeof GEODATA_APP_TOTAL !== 'undefined') ? GEODATA_APP_TOTAL : null; }
};
var _APP_CAT_SOURCES = [
  { key: 'app_rios',        label: 'APP de Rios',         data: function () { return (typeof GEODATA_APP_RIOS        !== 'undefined') ? GEODATA_APP_RIOS        : null; } },
  { key: 'app_nascentes',   label: 'APP de Nascentes',    data: function () { return (typeof GEODATA_APP_NASCENTES   !== 'undefined') ? GEODATA_APP_NASCENTES   : null; } },
  { key: 'app_lagos',       label: 'APP de Lagos',        data: function () { return (typeof GEODATA_APP_LAGOS       !== 'undefined') ? GEODATA_APP_LAGOS       : null; } },
  { key: 'app_declividade', label: 'APP por Declividade', data: function () { return (typeof GEODATA_APP_DECLIVIDADE !== 'undefined') ? GEODATA_APP_DECLIVIDADE : null; } }
];
// Array unificado mantido para compatibilidade com _getAppMuniStats
var _APP_SOURCES = [_APP_TOTAL_SRC].concat(_APP_CAT_SOURCES);

var _APP_NOTA = 'As categorias específicas podem apresentar sobreposição ou diferenças ' +
  'em relação à APP Total Declarada conforme a estrutura dos dados do SICAR.';

function _somaAppPorCod(geojson, cod) {
  if (!geojson || !geojson.features) return 0;
  return geojson.features.reduce(function (soma, f) {
    if ((f.properties.cod_imovel || '') === cod) {
      soma += parseFloat(f.properties.num_area) || 0;
    }
    return soma;
  }, 0);
}

function _fmtPct(ha, total, casas) {
  if (!total || total <= 0) return null;
  return ((ha / total) * 100).toFixed(casas || 1).replace('.', ',') + '%';
}

function buildCarAppSection(cod_imovel) {
  if (!cod_imovel) return '';

  var haTotal = _somaAppPorCod(_APP_TOTAL_SRC.data(), cod_imovel);

  var catRows = '';
  var temCategoria = false;
  _APP_CAT_SOURCES.forEach(function (src) {
    var ha = _somaAppPorCod(src.data(), cod_imovel);
    if (ha <= 0) return; // oculta zeros no painel do imóvel
    temCategoria = true;
    var pct = _fmtPct(ha, haTotal, 1);
    var pctCell = pct ? '<td class="car-mb-pct">' + pct + '</td>' : '<td></td>';
    catRows += '<tr><td>' + src.label + '</td>' +
               '<td class="car-mb-ha">' + ha.toFixed(2).replace('.', ',') + ' ha</td>' +
               pctCell + '</tr>';
  });

  if (haTotal <= 0 && !temCategoria) {
    return '<div class="car-mb-section">' +
      '<div class="car-mb-title">APP Declarada <span class="car-mb-source">(SICAR)</span></div>' +
      '<div class="car-mb-unavail">Sem APP declarada vinculada a este imóvel.</div>' +
      '</div>';
  }

  var totalRow = '<div class="car-app-total">APP Total Declarada: ' +
    '<strong>' + haTotal.toFixed(2).replace('.', ',') + ' ha</strong></div>';

  var catSection = temCategoria
    ? '<div class="car-app-subtitle">Composição por categoria:</div>' +
      '<table class="car-mb-table">' +
      '<thead><tr><th>Categoria</th><th>Área</th><th>%</th></tr></thead>' +
      '<tbody>' + catRows + '</tbody></table>'
    : '';

  return '<div class="car-mb-section">' +
    '<div class="car-mb-title">APP Declarada <span class="car-mb-source">(SICAR)</span></div>' +
    totalRow + catSection +
    '<div class="car-mb-unavail" style="font-style:italic;margin-top:4px">' + _APP_NOTA + '</div>' +
    '</div>';
}

// ─── Estatísticas APP municipais (lazy cache) ─────────────────────────────────
var _appMuniStats = null;
function _getAppMuniStats() {
  if (_appMuniStats) return _appMuniStats;
  _appMuniStats = {};
  _APP_SOURCES.forEach(function (src) {
    var gj = src.data();
    var total = 0;
    if (gj && gj.features) {
      gj.features.forEach(function (f) {
        total += parseFloat(f.properties.num_area) || 0;
      });
    }
    _appMuniStats[src.key] = { label: src.label, ha: total };
  });
  return _appMuniStats;
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

// ─── Estatísticas APP Declarada (SICAR) — painel lateral ─────────────────────
function computeAppArea(geojson) {
  if (!geojson || !geojson.features) return 0;
  return geojson.features.reduce(function (acc, f) {
    var v = parseFloat(f.properties.num_area);
    return acc + (isNaN(v) ? 0 : v);
  }, 0);
}

var _APP_STAT_CATS = [
  { key: 'app_rios',        label: 'APP de Rios',         border: '#0288D1', fill: 'rgba(2,136,209,0.3)',   gd: function () { return window.GEODATA_APP_RIOS;        } },
  { key: 'app_nascentes',   label: 'APP de Nascentes',    border: '#00796B', fill: 'rgba(0,121,107,0.3)',   gd: function () { return window.GEODATA_APP_NASCENTES;   } },
  { key: 'app_lagos',       label: 'APP de Lagos',        border: '#01579B', fill: 'rgba(1,87,155,0.3)',    gd: function () { return window.GEODATA_APP_LAGOS;       } },
  { key: 'app_declividade', label: 'APP por Declividade', border: '#5D4037', fill: 'rgba(93,64,55,0.3)',    gd: function () { return window.GEODATA_APP_DECLIVIDADE; } }
];

function buildAppStats() {
  var totGj    = window.GEODATA_APP_TOTAL;
  var totCount = totGj ? totGj.features.length : 0;
  var totArea  = computeAppArea(totGj);

  // Legenda
  var legendRows =
    '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:rgba(13,71,161,0.25);border-color:#0D47A1"></span>APP Total</div>' +
    _APP_STAT_CATS.map(function (c) {
      return '<div class="stats-legend-row"><span class="stats-legend-swatch" style="background:' + c.fill + ';border-color:' + c.border + '"></span>' + c.label + '</div>';
    }).join('');

  // Linhas por categoria
  var catRows = _APP_STAT_CATS.map(function (c) {
    var gj    = c.gd();
    var cnt   = gj ? gj.features.length : 0;
    var area  = computeAppArea(gj);
    var pct   = totArea > 0 ? ((area / totArea) * 100).toFixed(1).replace('.', ',') + '%' : '—';
    return '<tr>' +
      '<td><span class="car-sit-dot" style="background:' + c.border + '"></span>' + c.label + '</td>' +
      '<td class="car-stat-num">' + cnt + '</td>' +
      '<td class="car-stat-pct">(' + pct + ' · ' + area.toFixed(1).replace('.', ',') + ' ha)</td>' +
      '</tr>';
  }).join('');

  return '<div id="app-stats">' +
    '<div class="car-stats-header" id="app-stats-toggle">' +
    '<span class="car-stats-toggle-icon">▶</span>' +
    '<span class="car-stats-header-label app-header-label">Estatísticas — APP Declarada (SICAR)</span>' +
    '</div>' +
    '<div class="car-stats-body collapsed" id="app-stats-body">' +
    '<div class="stats-legend"><div class="stats-legend-title">Legenda</div>' + legendRows + '</div>' +
    '<div class="car-stats-total">Total: <strong>' + totCount + '</strong> polígonos · <strong>' +
      totArea.toFixed(1).replace('.', ',') + '</strong> ha</div>' +
    '<table class="car-stats-table">' + catRows + '</table>' +
    '<p class="muni-stats-note" style="font-style:italic;padding:4px 8px 6px">' + _APP_NOTA + '</p>' +
    '</div></div>';
}

function initAppStatsToggle() {
  var toggle = document.getElementById('app-stats-toggle');
  var body   = document.getElementById('app-stats-body');
  if (!toggle || !body) return;
  toggle.addEventListener('click', function () {
    body.classList.toggle('collapsed');
    toggle.querySelector('.car-stats-toggle-icon').textContent =
      body.classList.contains('collapsed') ? '▶' : '▼';
  });
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
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty, feature)
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
            buildCarMbSection(cod) +
            buildCarAppSection(cod) +
            _kmlPopupBtn(feature);
        }, { maxWidth: 340, maxHeight: 420 });
        lyr.on('click', function (e) {
          L.DomEvent.stopPropagation(e.originalEvent);
          map.fitBounds(lyr.getBounds(), { padding: [60, 60], maxZoom: 16 });
        });
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
    // Aplica estilo correto caso MapBiomas já esteja ativo quando o CAR carrega
    setTimeout(updateCarStyleForMapbiomas, 0);
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
  } else if (cfg.id === 'app_declividade') {
    // Última camada APP — injeta painel de estatísticas após o .app-subgroup
    layer = L.geoJSON(geojson, {
      style: function () { return buildStyle(cfg); },
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">' + cfg.label + '</div>' +
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty)
        );
      }
    });
    const appSubgroup = document.querySelector('.app-subgroup');
    if (appSubgroup) {
      const statsDiv = document.createElement('div');
      statsDiv.innerHTML = buildAppStats();
      appSubgroup.after(statsDiv.firstChild);
      initAppStatsToggle();
    }
  } else if (cfg.id === 'curvas_nivel') {
    // Pane para rótulos (acima das curvas, sem pointer-events)
    if (!map.getPane('curvasLabelPane')) {
      map.createPane('curvasLabelPane');
      map.getPane('curvasLabelPane').style.zIndex = 452;
      map.getPane('curvasLabelPane').style.pointerEvents = 'none';
    }

    var BASE_WEIGHT = cfg.estilo.weight || 1.0;

    // Curvas mestras (×250 m) com espessura dupla; normais com peso base
    layer = L.geoJSON(geojson, {
      style: function (feature) {
        var s = buildStyle(cfg);
        var elev = feature.properties && feature.properties.ELEV;
        if (elev && elev % 250 === 0) s.weight = BASE_WEIGHT * 2;
        return s;
      },
      pane: 'curvasPane',
      onEachFeature: function (feature, lyr) {
        lyr.bindPopup(
          '<div class="popup-title">' + cfg.label + '</div>' +
          buildPopup(feature.properties, cfg.popupCampos, cfg.skipEmpty)
        );
      }
    });

    // ── Rótulos nas curvas mestras com controle de densidade ──────────────────
    // Distância mínima entre rótulos em graus (~2 km no ES)
    var LABEL_MIN_DIST_DEG = 0.018;
    var LABEL_MIN_ZOOM     = 13;

    var placedPositions = [];  // posições já rotuladas

    function _tooClose(lat, lng) {
      for (var i = 0; i < placedPositions.length; i++) {
        var p = placedPositions[i];
        var dlat = lat - p[0];
        var dlng = lng - p[1];
        if (Math.sqrt(dlat * dlat + dlng * dlng) < LABEL_MIN_DIST_DEG) return true;
      }
      return false;
    }

    var curvasLabels = L.layerGroup([], { pane: 'curvasLabelPane' });

    geojson.features.forEach(function (feature) {
      var elev = feature.properties && feature.properties.ELEV;
      if (!elev || elev % 250 !== 0) return;
      var coords = feature.geometry && feature.geometry.coordinates;
      if (!coords || coords.length === 0) return;

      // Ponto médio da linha
      var mid = coords[Math.floor(coords.length / 2)];
      var lat = mid[1], lng = mid[0];

      if (_tooClose(lat, lng)) return;
      placedPositions.push([lat, lng]);

      curvasLabels.addLayer(L.marker(L.latLng(lat, lng), {
        icon: L.divIcon({
          className: 'curvas-label',
          html: '<span>' + elev + '</span>',
          iconSize: null,
          iconAnchor: [0, 0]
        }),
        pane: 'curvasLabelPane',
        interactive: false
      }));
    });

    // Mostrar rótulos apenas no zoom >= 13
    function _syncCurvasLabels() {
      if (!map.hasLayer(layer)) return;
      if (map.getZoom() >= LABEL_MIN_ZOOM) {
        if (!map.hasLayer(curvasLabels)) curvasLabels.addTo(map);
      } else {
        if (map.hasLayer(curvasLabels)) map.removeLayer(curvasLabels);
      }
    }
    layer.on('add', function () {
      _syncCurvasLabels();
      map.on('zoomend', _syncCurvasLabels);
    });
    layer.on('remove', function () {
      map.off('zoomend', _syncCurvasLabels);
      if (map.hasLayer(curvasLabels)) map.removeLayer(curvasLabels);
    });
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
  layer.on('add remove', updateLegend);

  // Curvas de Nível: pane próprio com zIndex elevado, sem necessidade de bringToFront
  // (o pane garante posição acima de rasters e demais vetores por CSS zIndex)

  if (cfg.visivel) layer.addTo(map);

  if (cfg.id === 'sjc') {
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    map.setZoom(map.getZoom() + 0.20);
    layer.bringToFront();

    // Estatísticas completas (Território, Meio Rural, Cobertura Vegetal,
    // MapBiomas, Serviços Públicos) aparecem no popup/painel flutuante —
    // substitui o popup básico criado pelo onEachFeature genérico acima.
    layer.eachLayer(function (lyr) {
      lyr.bindPopup(function () {
        return '<div class="popup-title">São José do Calçado</div>' + buildMunicipioStatsHTML();
      }, { autoPan: false });
      // Clique na borda (stroke): centraliza o município e abre popup.
      // autoPan: false impede o Leaflet de deslocar o mapa para acomodar
      // o painel grande — o fitBounds já garante o posicionamento correto.
      lyr.on('click', function (e) {
        L.DomEvent.stopPropagation(e.originalEvent);
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        showMunicipioStatsPanel(layer, buildStyle(cfg));
      });
      // fillOpacity: 0 → o interior do polígono SJC não intercepta
      // eventos de mouse, permitindo clicar nas camadas sobrepostas.
      // O handler map.on('click') detecta cliques dentro do município
      // via ray-casting (pointInSjc), independentemente do fill.
      lyr.setStyle({ fill: true, fillOpacity: 0 });
    });

    // Click no limite municipal → aplica destaque persistente.
    // Usa listener no mapa (não na camada) para funcionar mesmo quando outras
    // camadas (ex: distritos) estão por cima e interceptam o evento SVG.
    var capturedSjcLayer = layer;
    var capturedSjcEstilo = buildStyle(cfg);

    // Ray-casting ponto-dentro-polígono para LatLng arrays do Leaflet
    function latlngInRing(pt, ring) {
      var inside = false;
      var n = ring.length;
      for (var i = 0, j = n - 1; i < n; j = i++) {
        var xi = ring[i].lng, yi = ring[i].lat;
        var xj = ring[j].lng, yj = ring[j].lat;
        if (((yi > pt.lat) !== (yj > pt.lat)) &&
            (pt.lng < (xj - xi) * (pt.lat - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    }
    function pointInSjc(latlng) {
      var found = false;
      capturedSjcLayer.eachLayer(function (lyr) {
        if (found) return;
        var rings = lyr.getLatLngs();
        // Polygon: rings[0] = anel externo; MultiPolygon: rings[i][0]
        var outerRings = (rings.length && Array.isArray(rings[0]) && Array.isArray(rings[0][0]))
          ? rings.map(function (r) { return r[0]; })  // MultiPolygon
          : [rings[0]];                               // Polygon
        outerRings.forEach(function (ring) {
          if (!found && latlngInRing(latlng, ring)) found = true;
        });
      });
      return found;
    }

    // Coleta os elementos SVG do próprio SJC para distingui-los de outras camadas
    var sjcPaths = new Set();
    capturedSjcLayer.eachLayer(function (lyr) { if (lyr._path) sjcPaths.add(lyr._path); });

    map.on('click', function (e) {
      if (!map.hasLayer(capturedSjcLayer)) return;
      if (!pointInSjc(e.latlng)) return;

      // Só abre o painel do município quando nenhuma outra camada está ativa.
      // Se qualquer outra camada estiver visível, deixa ela tratar o clique.
      var outrasCamadasAtivas = Object.keys(layerRefs).some(function (id) {
        if (id === 'sjc') return false;
        var lyr = layerRefs[id];
        return lyr && map.hasLayer(lyr);
      });
      if (outrasCamadasAtivas) return;

      map.fitBounds(capturedSjcLayer.getBounds(), { padding: [20, 20] });
      showMunicipioStatsPanel(capturedSjcLayer, capturedSjcEstilo);
    });

    // Checkbox sjc: ao ligar, aplica zoom + destaque; ao desligar, restaura
    var cbSjc = document.getElementById('cb_sjc');
    if (cbSjc) {
      var newCb = cbSjc.cloneNode(true); // clone sem listeners
      cbSjc.parentNode.replaceChild(newCb, cbSjc);
      newCb.addEventListener('change', function () {
        setLayerVisible(layerRefs['sjc'], this.checked);
        syncGroupCheckbox('Limites Administrativos');
        if (this.checked) {
          map.fitBounds(layerRefs['sjc'].getBounds(), { padding: [20, 20] });
          showMunicipioStatsPanel(layerRefs['sjc'], buildStyle(LAYER_CONFIG.find(function (c) { return c.id === 'sjc'; })));
        } else {
          clearMunicipioStatsSelection();
        }
      });
    }
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
  // Ordem no topo do grupo Relevo: hillshade primeiro, curvas por cima
  var hs = layerRefs['hillshade'];
  if (hs && map.hasLayer(hs)) hs.bringToFront();
  var cn = layerRefs['curvas_nivel'];
  if (cn && map.hasLayer(cn)) cn.bringToFront();
}

function carregarRaster(cfg) {
  const layer = L.imageOverlay(cfg.arquivo, cfg.bounds, {
    opacity:     (cfg.estilo && cfg.estilo.opacity != null) ? cfg.estilo.opacity : 0.4,
    interactive: false,
    className:   'raster-overlay'
  });

  layerRefs[cfg.id] = layer;
  layer.on('add remove', updateLegend);

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
buildAppSubgroup();
buildDeclivSubgroup();
LAYER_CONFIG.forEach(carregarCamada);
buildMapBiomasStats(LAYER_CONFIG.find(function (c) { return c.id === 'mapbiomas'; }));

// Sincroniza estilos do CAR e APP quando MapBiomas é ligado/desligado,
// e aplica estilo correto imediatamente quando uma camada APP é adicionada.
map.on('layeradd layerremove', function (e) {
  if (layerRefs['mapbiomas'] && e.layer === layerRefs['mapbiomas']) {
    updateCarStyleForMapbiomas();
    if (typeof updateAppStyleForBasemap === 'function') updateAppStyleForBasemap();
    updateLegend();
    return;
  }
  // Ao adicionar uma camada APP, aplicar estilo adaptativo imediatamente
  var appIds = ['app_total','app_rios','app_nascentes','app_lagos','app_declividade'];
  var ehApp = appIds.some(function (id) { return layerRefs[id] && e.layer === layerRefs[id]; });
  if (ehApp && e.type === 'layeradd') {
    if (typeof updateAppStyleForBasemap === 'function') updateAppStyleForBasemap();
  }
});

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
  },
  { layerId: 'app_total',
    getDisplay: function (p) {
      var area = limpaValor(p.num_area);
      if (area !== '—') { var a = parseFloat(area); return 'APP Total — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha'; }
      return 'APP Total';
    },
    searchFields: ['cod_imovel', 'nom_tema', 'des_condic']
  },
  { layerId: 'app_rios',
    getDisplay: function (p) {
      var area = limpaValor(p.num_area);
      if (area !== '—') { var a = parseFloat(area); return 'APP de Rios — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha'; }
      return 'APP de Rios';
    },
    searchFields: ['cod_imovel', 'nom_tema', 'des_condic']
  },
  { layerId: 'app_nascentes',
    getDisplay: function (p) {
      var area = limpaValor(p.num_area);
      if (area !== '—') { var a = parseFloat(area); return 'APP de Nascentes — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha'; }
      return 'APP de Nascentes';
    },
    searchFields: ['cod_imovel', 'nom_tema', 'des_condic']
  },
  { layerId: 'app_lagos',
    getDisplay: function (p) {
      var area = limpaValor(p.num_area);
      if (area !== '—') { var a = parseFloat(area); return 'APP de Lagos — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha'; }
      return 'APP de Lagos';
    },
    searchFields: ['cod_imovel', 'nom_tema', 'des_condic']
  },
  { layerId: 'app_declividade',
    getDisplay: function (p) {
      var area = limpaValor(p.num_area);
      if (area !== '—') { var a = parseFloat(area); return 'APP por Declividade — ' + (isNaN(a) ? area : a.toFixed(2)) + ' ha'; }
      return 'APP por Declividade';
    },
    searchFields: ['cod_imovel', 'nom_tema', 'des_condic']
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

  // Atalho Ctrl+K / Cmd+K foca a busca
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      inputEl.focus();
      inputEl.select();
    }
  });

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


// Minimapa — botão recolher/expandir
(function () {
  var btn = document.querySelector('.minimap-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    document.getElementById('minimap-container').classList.toggle('collapsed');
  });
})();

// ─── Visão Inicial — reset completo do Geoportal ─────────────────────────────
function resetGeoportalToInitialState() {
  // 1. Fechar popups, modal de coordenada e dropdowns de toolbar
  map.closePopup();
  var coordOverlay = document.getElementById('coord-overlay');
  if (coordOverlay) coordOverlay.style.display = 'none';
  var basemapMenu = document.getElementById('basemap-menu');
  if (basemapMenu) basemapMenu.classList.add('basemap-menu-hidden');
  var basemapBtn = document.getElementById('basemap-btn');
  if (basemapBtn) basemapBtn.classList.remove('open');
  var toolsMenu = document.getElementById('tools-menu');
  if (toolsMenu) toolsMenu.classList.add('tools-menu-hidden');

  // 2. Remover marcador de coordenada
  if (typeof clearCoordMarker === 'function') clearCoordMarker();

  // 3. Limpar busca, painéis, seleções e destaque de feição
  if (typeof closeSearchResults === 'function') closeSearchResults();
  if (typeof clearSearch === 'function') clearSearch();
  if (typeof clearMunicipioStatsSelection === 'function') clearMunicipioStatsSelection();
  if (typeof clearDistritoSelection === 'function') clearDistritoSelection();
  if (typeof clearFeatureHighlight === 'function') clearFeatureHighlight();
  if (typeof removeDraggablePanel === 'function') removeDraggablePanel();

  // 4. Limpar filtros de CAR, Reserva Legal e Vegetação
  if (typeof clearCarFilter === 'function') clearCarFilter();
  if (typeof clearRLFilter === 'function') clearRLFilter();
  if (typeof clearVegFilter === 'function') clearVegFilter();

  // 5. Remover do mapa todas as camadas em layerRefs (vetoriais + imageOverlay)
  //    exceto o limite municipal (sjc), que permanece sempre visível
  Object.keys(layerRefs).forEach(function (id) {
    if (id === 'sjc') return;
    var lyr = layerRefs[id];
    if (lyr && map.hasLayer(lyr)) map.removeLayer(lyr);
  });

  // 6. Remover sub-camadas de distritos
  Object.keys(districtLayers).forEach(function (nm) {
    var lyr = districtLayers[nm];
    if (lyr && map.hasLayer(lyr)) map.removeLayer(lyr);
  });

  // 7. Remover camadas de classes MapBiomas (mbClassLayers)
  if (typeof mbClassLayers === 'object') {
    Object.keys(mbClassLayers).forEach(function (v) {
      var lyr = mbClassLayers[v];
      if (lyr && map.hasLayer(lyr)) map.removeLayer(lyr);
    });
  }

  // 8. Desmarcar checkboxes de camadas (exceto limite municipal) e de grupos
  LAYER_CONFIG.forEach(function (cfg) {
    if (cfg.id === 'sjc') return;
    var cb = document.getElementById('cb_' + cfg.id);
    if (cb) { cb.checked = false; cb.indeterminate = false; }
  });
  // Sub-checkboxes de distritos, RL, declividade (ids dinâmicos)
  document.querySelectorAll('#layer-list input[type=checkbox][id]').forEach(function (cb) {
    if (cb.id === 'cb_sjc') return;
    cb.checked = false; cb.indeterminate = false;
  });
  Object.keys(groupCheckboxes).forEach(function (g) {
    var gcb = groupCheckboxes[g];
    if (gcb) { gcb.checked = false; gcb.indeterminate = false; }
  });

  // 9. Resetar cfg.visivel para false em todas as camadas (exceto sjc)
  LAYER_CONFIG.forEach(function (cfg) {
    if (cfg.id === 'sjc') return;
    cfg.visivel = false;
  });

  // Garantir que o limite municipal está visível e marcado
  var sjcCfg = LAYER_CONFIG.find(function (c) { return c.id === 'sjc'; });
  if (sjcCfg && layerRefs['sjc']) {
    sjcCfg.visivel = true;
    if (!map.hasLayer(layerRefs['sjc'])) layerRefs['sjc'].addTo(map);
    var sjcCb = document.getElementById('cb_sjc');
    if (sjcCb) sjcCb.checked = true;
  }

  // 10. Voltar ao mapa base Carto Positron e atualizar visual do seletor
  Object.values(basemaps).forEach(function (b) { map.removeLayer(b); });
  basemaps['Carto Positron'].addTo(map);
  (function () {
    var menu = document.getElementById('basemap-menu');
    if (!menu) return;
    var BASEMAP_LABELS = {
      'Carto Positron':     'Carto Positron',
      'OpenStreetMap':      'OpenStreetMap',
      'Esri World Imagery': 'Satélite Esri',
      'OpenTopoMap':        'OpenTopoMap',
      'Carto Dark Matter':  'Carto Dark Matter'
    };
    menu.innerHTML = '';
    Object.keys(BASEMAP_LABELS).forEach(function (key) {
      var item = document.createElement('button');
      item.className = 'basemap-menu-item' + (key === 'Carto Positron' ? ' active' : '');
      item.innerHTML = '<i class="fa fa-check basemap-check" aria-hidden="true"></i>' + BASEMAP_LABELS[key];
      menu.appendChild(item);
    });
  }());

  // 11. Esvaziar e recolher legenda
  if (typeof updateLegend === 'function') updateLegend();

  // 12. Reposicionar mapa — replica exatamente o fitBounds + setZoom do carregamento inicial
  if (layerRefs['sjc']) {
    map.once('moveend', function () {
      map.setZoom(map.getZoom() + 0.20);
    });
    map.flyToBounds(layerRefs['sjc'].getBounds(), { padding: [20, 20], duration: 1.2 });
  } else {
    map.flyTo([-21.025, -41.654], 12, { duration: 1.2 });
  }

  // 13. Reabrir splash screen (ignora localStorage para este clique)
  if (typeof openSplash === 'function') openSplash();
}

document.getElementById('btn-home').addEventListener('click', resetGeoportalToInitialState);

// ─── Menu de Ferramentas ──────────────────────────────────────────────────────
(function () {
  var btn   = document.getElementById('btn-tools');
  var menu  = document.getElementById('tools-menu');
  var toast = document.getElementById('toolbar-toast');
  var toastTimer;

  function showToast(msg) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2800);
  }

  function openMenu()  { menu.classList.remove('tools-menu-hidden'); btn.classList.add('open'); }
  function closeMenu() { menu.classList.add('tools-menu-hidden');    btn.classList.remove('open'); }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.contains('tools-menu-hidden') ? openMenu() : closeMenu();
  });

  menu.querySelectorAll('.tools-menu-item').forEach(function (item) {
    item.addEventListener('click', function () {
      closeMenu();
      var tool = item.getAttribute('data-tool');
      if (tool === 'coord') {
        openCoordModal();
      } else if (tool === 'area') {
        if (typeof openMedirArea === 'function') openMedirArea();
      } else if (tool === 'dist') {
        if (typeof openMedirDistancia === 'function') openMedirDistancia();
      } else if (tool === 'img') {
        if (typeof openExportModal === 'function') openExportModal();
      } else if (tool === 'pdf') {
        if (typeof openPdfExportModal === 'function') openPdfExportModal();
      } else if (tool === 'clear') {
        if (typeof clearFeatureHighlight === 'function') clearFeatureHighlight();
        if (typeof removeDraggablePanel === 'function') removeDraggablePanel();
        showToast('Seleção limpa.');
      } else {
        showToast('⚙ Ferramenta em desenvolvimento.');
      }
    });
  });

  document.addEventListener('click', function () { closeMenu(); });
  menu.addEventListener('click', function (e) { e.stopPropagation(); });
}());

// ─── Ferramenta: Ir para Coordenada ──────────────────────────────────────────
(function () {
  // EPSG:31984 — SIRGAS 2000 / UTM Zona 24S
  proj4.defs('EPSG:31984',
    '+proj=utm +zone=24 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

  var overlay  = document.getElementById('coord-overlay');
  var input    = document.getElementById('coord-input');
  var errorEl  = document.getElementById('coord-error');
  var coordMarker = null;
  window.clearCoordMarker = function () {
    if (coordMarker) { map.removeLayer(coordMarker); coordMarker = null; }
  };

  function openCoordModal() {
    input.value = '';
    errorEl.style.display = 'none';
    overlay.classList.add('open');
    setTimeout(function () { input.focus(); }, 100);
  }
  window.openCoordModal = openCoordModal;

  function closeCoordModal() {
    overlay.classList.remove('open');
  }

  document.getElementById('coord-close').addEventListener('click', closeCoordModal);
  document.getElementById('coord-cancel').addEventListener('click', closeCoordModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeCoordModal();
  });

  // ── Parser ──────────────────────────────────────────────────────────────────
  function parseCoord(raw) {
    var s = raw.trim().replace(/[;,]+/g, ' ').replace(/\s+/g, ' ');
    var parts = s.split(' ').map(Number).filter(function (n) { return !isNaN(n); });
    if (parts.length < 2) return null;

    var a = parts[0], b = parts[1];

    // Geográfica: lat entre -90..90 e lon entre -180..180, ambos decimais
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180 && (s.indexOf('.') !== -1 || (Math.abs(a) < 90 && Math.abs(b) < 180))) {
      // Verifica se parece UTM (valores grandes)
      if (Math.abs(a) < 1000 && Math.abs(b) < 1000) {
        return { type: 'geo', lat: a, lon: b };
      }
    }

    // UTM: valores típicos > 1000 (Easting ~200000-900000, Northing ~1000000-9000000)
    if (Math.abs(a) > 1000 || Math.abs(b) > 1000) {
      var easting, northing;
      // Northing no hemisfério sul fica entre ~7000000 e ~9000000
      if (b > a) { easting = a; northing = b; }
      else        { easting = b; northing = a; }
      try {
        var wgs = proj4('EPSG:31984', 'EPSG:4326', [easting, northing]);
        var lon = wgs[0], lat = wgs[1];
        if (lat >= -35 && lat <= 5 && lon >= -75 && lon <= -30) {
          return { type: 'utm', lat: lat, lon: lon, easting: easting, northing: northing };
        }
      } catch (e) { return null; }
    }

    return null;
  }

  // ── Marcador personalizado azul ─────────────────────────────────────────────
  var coordIcon = L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#1E3A5F;border:3px solid #fff;box-shadow:0 0 0 2px #1E3A5F,0 2px 6px rgba(0,0,0,0.35)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12]
  });

  // ── Ação Ir ─────────────────────────────────────────────────────────────────
  function goToCoord() {
    errorEl.style.display = 'none';
    var result = parseCoord(input.value);

    if (!result) {
      errorEl.textContent = 'Coordenada inválida. Use Latitude, Longitude ou UTM SIRGAS 2000 Zona 24S.';
      errorEl.style.display = 'block';
      return;
    }

    if (coordMarker) { map.removeLayer(coordMarker); coordMarker = null; }

    var popupHtml =
      '<div style="font-family:\'Segoe UI\',Arial,sans-serif;font-size:12px;min-width:160px">' +
      '<div style="background:#1E3A5F;color:#fff;padding:7px 10px;font-weight:600;font-size:12px;margin:-1px -1px 8px">📍 Coordenada localizada</div>' +
      '<div style="padding:0 10px 8px">' +
      '<div style="margin-bottom:4px"><span style="color:#78909c;font-size:11px">Latitude</span><br><b>' + result.lat.toFixed(6) + '</b></div>' +
      '<div><span style="color:#78909c;font-size:11px">Longitude</span><br><b>' + result.lon.toFixed(6) + '</b></div>' +
      (result.type === 'utm' ? '<div style="margin-top:6px;font-size:11px;color:#90a4ae">UTM 24S → WGS84</div>' : '') +
      '</div></div>';

    coordMarker = L.marker([result.lat, result.lon], { icon: coordIcon })
      .addTo(map)
      .bindPopup(popupHtml, { maxWidth: 220 })
      .openPopup();

    map.flyTo([result.lat, result.lon], 16, { duration: 1.0 });
    closeCoordModal();
  }

  document.getElementById('coord-go').addEventListener('click', goToCoord);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') goToCoord();
    if (e.key === 'Escape') closeCoordModal();
  });
}());

// ─── Ferramenta: Medir Área ───────────────────────────────────────────────────
(function () {
  var active       = false;
  var vertices     = [];      // [{lat,lng}]
  var polyline     = null;    // L.polyline temporário
  var polygon      = null;    // L.polygon final
  var vertexMarkers = [];     // L.circleMarker de cada vértice
  var closingLine  = null;    // linha de fechamento dinâmica
  var resultPanel  = null;    // div do painel de resultado
  var instrução    = null;    // div de instrução flutuante
  var lastClickTime = 0;      // controle de duplo clique

  var STROKE = '#1E3A5F';
  var FILL   = 'rgba(30,58,95,0.18)';

  var vertexIcon = L.divIcon({
    className: '',
    html: '<div style="width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid #1E3A5F;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  // ── Cálculo de área geodésica (fórmula de Gauss com distâncias L.CRS) ────────
  function calcArea(pts) {
    // Shoelace em coordenadas planas não funciona bem; usamos aproximação esférica
    // baseada na fórmula do excesso esférico para polígonos pequenos (< país)
    var n = pts.length;
    if (n < 3) return 0;
    var R = 6371008.8;   // raio médio terrestre em metros
    var toRad = Math.PI / 180;
    var area = 0;
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      var lat1 = pts[i].lat * toRad;
      var lat2 = pts[j].lat * toRad;
      var dLon = (pts[j].lng - pts[i].lng) * toRad;
      area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs(area) * R * R / 2;
    return area;  // m²
  }

  function calcPerimetro(pts) {
    var total = 0;
    for (var i = 0; i < pts.length; i++) {
      var j = (i + 1) % pts.length;
      total += map.distance(
        L.latLng(pts[i].lat, pts[i].lng),
        L.latLng(pts[j].lat, pts[j].lng)
      );
    }
    return total; // m
  }

  function fmtArea(m2) {
    var ha = m2 / 10000;
    var lines = '<div class="medir-result-row"><span class="medir-result-label">Área</span></div>';
    lines += '<div class="medir-result-value">' + formatNum(m2, 1) + ' m²</div>';
    lines += '<div class="medir-result-value">' + formatNum(ha, 4) + ' ha</div>';
    if (m2 >= 1000000) lines += '<div class="medir-result-value">' + formatNum(m2 / 1000000, 4) + ' km²</div>';
    return lines;
  }

  function fmtPerim(m) {
    var lines = '<div class="medir-result-row" style="margin-top:8px"><span class="medir-result-label">Perímetro</span></div>';
    lines += '<div class="medir-result-value">' + formatNum(m, 1) + ' m</div>';
    lines += '<div class="medir-result-value">' + formatNum(m / 1000, 3) + ' km</div>';
    return lines;
  }

  function formatNum(n, dec) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  // ── UI: instrução e painel de resultado ───────────────────────────────────────
  function showInstrucao() {
    if (instrução) return;
    instrução = document.createElement('div');
    instrução.id = 'medir-instrucao';
    instrução.textContent = 'Clique no mapa para desenhar a área. Duplo clique para finalizar.';
    document.getElementById('map').appendChild(instrução);
  }

  function hideInstrucao() {
    if (instrução) { instrução.parentNode && instrução.parentNode.removeChild(instrução); instrução = null; }
  }

  function showResultPanel(m2, perim) {
    removeResultPanel();
    resultPanel = document.createElement('div');
    resultPanel.id = 'medir-result-panel';
    resultPanel.innerHTML =
      '<div class="medir-result-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:14px;height:14px;vertical-align:-2px;margin-right:5px"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Resultado da Medição</div>' +
      fmtArea(m2) + fmtPerim(perim) +
      '<div class="medir-result-actions">' +
        '<button id="medir-nova" class="medir-btn medir-btn-primary">Nova medição</button>' +
        '<button id="medir-limpar" class="medir-btn medir-btn-secondary">Limpar</button>' +
      '</div>';
    document.getElementById('map').appendChild(resultPanel);
    document.getElementById('medir-nova').addEventListener('click', function () { startFresh(); });
    document.getElementById('medir-limpar').addEventListener('click', function () { stopTool(); });
  }

  function removeResultPanel() {
    if (resultPanel) { resultPanel.parentNode && resultPanel.parentNode.removeChild(resultPanel); resultPanel = null; }
  }

  // ── Limpeza de camadas desenhadas ─────────────────────────────────────────────
  function clearDrawing() {
    if (polyline)  { map.removeLayer(polyline);  polyline  = null; }
    if (polygon)   { map.removeLayer(polygon);   polygon   = null; }
    if (closingLine) { map.removeLayer(closingLine); closingLine = null; }
    vertexMarkers.forEach(function (m) { map.removeLayer(m); });
    vertexMarkers = [];
    vertices = [];
  }

  function addVertexMarker(latlng) {
    var m = L.marker(latlng, { icon: vertexIcon, interactive: false, zIndexOffset: 500 }).addTo(map);
    vertexMarkers.push(m);
  }

  // ── Redesenha linha temporária durante o desenho ──────────────────────────────
  function redrawPolyline() {
    if (polyline) { map.removeLayer(polyline); polyline = null; }
    if (closingLine) { map.removeLayer(closingLine); closingLine = null; }
    if (vertices.length < 2) return;
    polyline = L.polyline(vertices.map(function (v) { return [v.lat, v.lng]; }), {
      color: STROKE, weight: 2.5, opacity: 0.9, dashArray: null, interactive: false
    }).addTo(map);
    // Linha de fechamento pontilhada entre último e primeiro vértice
    if (vertices.length >= 3) {
      closingLine = L.polyline([
        [vertices[vertices.length - 1].lat, vertices[vertices.length - 1].lng],
        [vertices[0].lat, vertices[0].lng]
      ], { color: STROKE, weight: 1.5, opacity: 0.5, dashArray: '6 5', interactive: false }).addTo(map);
    }
  }

  // ── Finalizar polígono ────────────────────────────────────────────────────────
  function finalize() {
    if (vertices.length < 3) {
      showToastMsg('Adicione pelo menos 3 pontos para calcular uma área.');
      return;
    }
    // Salvar vértices ANTES de clearDrawing() que zera o array
    var finalPts = vertices.slice();
    console.log('[MedirÁrea] vértices:', finalPts.length, finalPts);

    clearDrawing();

    polygon = L.polygon(finalPts.map(function (v) { return [v.lat, v.lng]; }), {
      color: STROKE, weight: 2.5, opacity: 0.9,
      fillColor: STROKE, fillOpacity: 0.18, interactive: false
    }).addTo(map);
    finalPts.forEach(function (v) { addVertexMarker(L.latLng(v.lat, v.lng)); });

    var area  = calcArea(finalPts);
    var perim = calcPerimetro(finalPts);
    console.log('[MedirÁrea] área m²:', area, '| perímetro m:', perim);

    map.getContainer().style.cursor = '';
    hideInstrucao();
    showResultPanel(area, perim);
    active = false;
    map.off('click', onMapClick);
    map.off('dblclick', onMapDblClick);
  }

  function showToastMsg(msg) {
    var t = document.getElementById('toolbar-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  // ── Handlers do mapa ──────────────────────────────────────────────────────────
  function onMapClick(e) {
    // Ignorar se for o segundo clique de um duplo-clique
    var now = Date.now();
    if (now - lastClickTime < 350) return;
    lastClickTime = now;
    vertices.push({ lat: e.latlng.lat, lng: e.latlng.lng });
    addVertexMarker(e.latlng);
    redrawPolyline();
  }

  function onMapDblClick(e) {
    lastClickTime = Date.now();
    L.DomEvent.stopPropagation(e);
    // Remover o vértice duplicado que o click simples adicionou antes do dblclick
    if (vertices.length > 1) vertices.pop();
    if (vertexMarkers.length > 1) {
      map.removeLayer(vertexMarkers.pop());
    }
    finalize();
  }

  // ── Iniciar / reiniciar / parar ───────────────────────────────────────────────
  function startFresh() {
    clearDrawing();
    removeResultPanel();
    if (polygon) { map.removeLayer(polygon); polygon = null; }
    active = true;
    map.doubleClickZoom.disable();   // evita zoom no dblclick de finalização
    map.getContainer().style.cursor = 'crosshair';
    showInstrucao();
    map.off('click', onMapClick).on('click', onMapClick);
    map.off('dblclick', onMapDblClick).on('dblclick', onMapDblClick);
  }

  function stopTool() {
    active = false;
    clearDrawing();
    if (polygon) { map.removeLayer(polygon); polygon = null; }
    vertexMarkers.forEach(function (m) { map.removeLayer(m); });
    vertexMarkers = [];
    removeResultPanel();
    hideInstrucao();
    map.getContainer().style.cursor = '';
    map.off('click', onMapClick);
    map.off('dblclick', onMapDblClick);
    map.doubleClickZoom.enable();    // restaura comportamento padrão
  }

  window.openMedirArea = function () {
    stopTool();
    startFresh();
  };

  window.stopMedirArea = stopTool;
}());

// ─── Ferramenta: Medir Distância ─────────────────────────────────────────────
(function () {
  var active        = false;
  var vertices      = [];       // [{lat,lng}]
  var polyline      = null;
  var vertexMarkers = [];
  var resultPanel   = null;
  var instrução     = null;
  var lastClickTime = 0;

  var STROKE = '#1E3A5F';

  var vertexIcon = L.divIcon({
    className: '',
    html: '<div style="width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid #1E3A5F;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  // ── Cálculo ───────────────────────────────────────────────────────────────────
  function calcDistancia(pts) {
    var total = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      total += map.distance(L.latLng(pts[i].lat, pts[i].lng), L.latLng(pts[i+1].lat, pts[i+1].lng));
    }
    return total; // metros
  }

  function formatNum(n, dec) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  // ── UI ────────────────────────────────────────────────────────────────────────
  function showInstrucao() {
    if (instrução) return;
    instrução = document.createElement('div');
    instrução.id = 'medir-dist-instrucao';
    instrução.className = 'medir-instrucao-pill';
    instrução.textContent = 'Clique no mapa para medir a distância. Duplo clique para finalizar.';
    document.getElementById('map').appendChild(instrução);
  }

  function hideInstrucao() {
    if (instrução) { instrução.parentNode && instrução.parentNode.removeChild(instrução); instrução = null; }
  }

  function showResultPanel(dist, segmentos) {
    removeResultPanel();
    resultPanel = document.createElement('div');
    resultPanel.id = 'medir-dist-result-panel';
    resultPanel.className = 'medir-result-panel';
    resultPanel.innerHTML =
      '<div class="medir-result-title">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:14px;height:14px;vertical-align:-2px;margin-right:5px"><line x1="2" y1="12" x2="22" y2="12"/><polyline points="8,6 2,12 8,18"/><polyline points="16,6 22,12 16,18"/></svg>' +
        'Resultado da Medição' +
      '</div>' +
      '<div class="medir-result-row"><span class="medir-result-label">Distância total</span></div>' +
      '<div class="medir-result-value">' + formatNum(dist, 1) + ' m</div>' +
      '<div class="medir-result-value">' + formatNum(dist / 1000, 3) + ' km</div>' +
      '<div class="medir-result-row" style="margin-top:8px"><span class="medir-result-label">Segmentos</span></div>' +
      '<div class="medir-result-value">' + segmentos + '</div>' +
      '<div class="medir-result-actions">' +
        '<button id="medir-dist-nova" class="medir-btn medir-btn-primary">Nova medição</button>' +
        '<button id="medir-dist-limpar" class="medir-btn medir-btn-secondary">Limpar</button>' +
      '</div>';
    document.getElementById('map').appendChild(resultPanel);
    document.getElementById('medir-dist-nova').addEventListener('click', function () { startFresh(); });
    document.getElementById('medir-dist-limpar').addEventListener('click', function () { stopTool(); });
  }

  function removeResultPanel() {
    if (resultPanel) { resultPanel.parentNode && resultPanel.parentNode.removeChild(resultPanel); resultPanel = null; }
  }

  // ── Camadas ───────────────────────────────────────────────────────────────────
  function clearDrawing() {
    if (polyline) { map.removeLayer(polyline); polyline = null; }
    vertexMarkers.forEach(function (m) { map.removeLayer(m); });
    vertexMarkers = [];
    vertices = [];
  }

  function addVertexMarker(latlng) {
    var m = L.marker(latlng, { icon: vertexIcon, interactive: false, zIndexOffset: 500 }).addTo(map);
    vertexMarkers.push(m);
  }

  function redrawPolyline() {
    if (polyline) { map.removeLayer(polyline); polyline = null; }
    if (vertices.length < 2) return;
    polyline = L.polyline(vertices.map(function (v) { return [v.lat, v.lng]; }), {
      color: STROKE, weight: 2.5, opacity: 0.9, interactive: false
    }).addTo(map);
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────────
  function finalize() {
    if (vertices.length < 2) {
      showToastMsg('Adicione pelo menos 2 pontos para calcular a distância.');
      return;
    }
    var finalPts = vertices.slice();
    console.log('[MedirDistância] pontos:', finalPts.length, finalPts);

    clearDrawing();

    polyline = L.polyline(finalPts.map(function (v) { return [v.lat, v.lng]; }), {
      color: STROKE, weight: 2.5, opacity: 0.9, interactive: false
    }).addTo(map);
    finalPts.forEach(function (v) { addVertexMarker(L.latLng(v.lat, v.lng)); });

    var dist = calcDistancia(finalPts);
    var segs = finalPts.length - 1;
    console.log('[MedirDistância] distância m:', dist, '| segmentos:', segs);

    map.getContainer().style.cursor = '';
    hideInstrucao();
    showResultPanel(dist, segs);
    active = false;
    map.off('click', onMapClick);
    map.off('dblclick', onMapDblClick);
  }

  function showToastMsg(msg) {
    var t = document.getElementById('toolbar-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function onMapClick(e) {
    var now = Date.now();
    if (now - lastClickTime < 350) return;
    lastClickTime = now;
    vertices.push({ lat: e.latlng.lat, lng: e.latlng.lng });
    addVertexMarker(e.latlng);
    redrawPolyline();
  }

  function onMapDblClick(e) {
    lastClickTime = Date.now();
    L.DomEvent.stopPropagation(e);
    if (vertices.length > 1) vertices.pop();
    if (vertexMarkers.length > 1) { map.removeLayer(vertexMarkers.pop()); }
    finalize();
  }

  // ── Iniciar / parar ───────────────────────────────────────────────────────────
  function startFresh() {
    clearDrawing();
    removeResultPanel();
    active = true;
    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = 'crosshair';
    showInstrucao();
    map.off('click', onMapClick).on('click', onMapClick);
    map.off('dblclick', onMapDblClick).on('dblclick', onMapDblClick);
  }

  function stopTool() {
    active = false;
    clearDrawing();
    vertexMarkers.forEach(function (m) { map.removeLayer(m); });
    vertexMarkers = [];
    removeResultPanel();
    hideInstrucao();
    map.getContainer().style.cursor = '';
    map.off('click', onMapClick);
    map.off('dblclick', onMapDblClick);
    map.doubleClickZoom.enable();
  }

  window.openMedirDistancia = function () {
    // Parar ferramenta de área se estiver ativa
    if (typeof stopMedirArea === 'function') stopMedirArea();
    stopTool();
    startFresh();
  };

  window.stopMedirDistancia = stopTool;
}());

// ─── Ferramenta: Exportar como Imagem ────────────────────────────────────────
// Implementação sem html2canvas: desenha o mapa manualmente via Canvas API,
// lendo diretamente os elementos já carregados na página (tiles, SVG vetorial,
// marcadores, legenda, minimapa, escala, norte). Evita a técnica de clonagem
// de iframe do html2canvas, que trava indefinidamente quando a página é aberta
// via file:// — funciona sem servidor local e sem extensões.
(function () {
  var overlay = document.getElementById('export-overlay');
  var warnEl  = document.getElementById('export-cors-warn');

  // Mapas base que podem ter CORS bloqueado (tiles não exportáveis)
  var CORS_RISK = []; // Esri e OpenTopoMap confirmados com Access-Control-Allow-Origin: * (testado em 2026-06-25)
  var CORS_OK   = ['Carto Positron', 'OpenStreetMap', 'Carto Dark Matter', 'Esri World Imagery', 'OpenTopoMap'];

  function currentBasemapKey() {
    var found = null;
    Object.keys(basemaps).forEach(function (k) {
      if (map.hasLayer(basemaps[k])) found = k;
    });
    return found;
  }

  function openExportModal() {
    if (!overlay) return;
    var key = currentBasemapKey();
    if (warnEl) warnEl.style.display = CORS_RISK.indexOf(key) !== -1 ? 'flex' : 'none';
    overlay.classList.add('open');
  }
  window.openExportModal = openExportModal;

  function closeExportModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
  }

  var _expClose  = document.getElementById('export-close');
  var _expCancel = document.getElementById('export-cancel');
  if (_expClose)  _expClose.addEventListener('click', closeExportModal);
  if (_expCancel) _expCancel.addEventListener('click', closeExportModal);
  if (overlay)    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeExportModal(); });

  // ── Util: desenha retângulo arredondado ───────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── Util: rasteriza um elemento DOM (com estilos computados inlinados) ───────
  // via SVG <foreignObject> + data URI. Não abre iframes nem faz requisições de
  // rede — funciona de forma síncrona e confiável em file://. Não usar em
  // elementos que contenham <img> (recursos teriam que ser buscados de novo
  // dentro do SVG isolado); para esses casos, desenhar a <img> separadamente.

  // ── Util: garante que uma Promise nunca trava o pipeline indefinidamente.
  // Alguns navegadores, ao abrir a página via file://, não disparam onload
  // nem onerror para imagens SVG via data URI com <foreignObject> — sem este
  // limite, uma única falha silenciosa travaria toda a exportação para sempre.
  function withTimeout(promise, ms, fallbackValue) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(fallbackValue);
      }, ms);
      promise.then(function (v) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      }).catch(function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(fallbackValue);
      });
    });
  }

  function domToImage(el) {
    return new Promise(function (resolve, reject) {
      try {
        var rect = el.getBoundingClientRect();
        var w = Math.ceil(rect.width), h = Math.ceil(rect.height);
        if (w <= 0 || h <= 0) { resolve(null); return; }

        function inlineStyles(srcNode, dstNode) {
          var cs = window.getComputedStyle(srcNode);
          var cssText = '';
          for (var i = 0; i < cs.length; i++) {
            var prop = cs[i];
            cssText += prop + ':' + cs.getPropertyValue(prop) + ';';
          }
          dstNode.setAttribute('style', cssText);
          var srcChildren = srcNode.children;
          var dstChildren = dstNode.children;
          for (var j = 0; j < srcChildren.length; j++) {
            if (dstChildren[j]) inlineStyles(srcChildren[j], dstChildren[j]);
          }
        }

        var clone = el.cloneNode(true);
        inlineStyles(el, clone);
        clone.removeAttribute('id');
        // Remove botões/inputs interativos do clone (irrelevantes na imagem estática)
        clone.querySelectorAll('button, input').forEach(function (n) { n.style.display = 'none'; });

        var htmlStr = new XMLSerializer().serializeToString(clone);
        var svgStr =
          '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
          '<foreignObject width="100%" height="100%">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;height:' + h + 'px;margin:0">' + htmlStr + '</div>' +
          '</foreignObject></svg>';

        var img = new Image();
        img.onload  = function () { resolve({ img: img, width: w, height: h }); };
        img.onerror = function (e) { reject(e); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      } catch (e) { reject(e); }
    });
  }

  // Desenha os <path> de um <svg> do Leaflet diretamente num canvas 2D via
  // Path2D, lendo getComputedStyle do elemento ainda anexado ao documento
  // (preserva CSS de leaflet.css/style.css, que se perderia ao clonar e
  // rasterizar o SVG isoladamente via new Image/data URI).
  function drawLeafletSvgDirect(svgEl, ctx, offsetX, offsetY) {
    var TRANSPARENT = ['none', 'rgba(0, 0, 0, 0)', 'transparent'];

    function applyGroupTransform(el) {
      var tr = el.style.transform || '';
      var m = tr.match(/translate(?:3d)?\(\s*([\-\d.]+)px,\s*([\-\d.]+)px/);
      if (m) ctx.translate(parseFloat(m[1]), parseFloat(m[2]));
    }

    function drawPathEl(el) {
      var d = el.getAttribute('d');
      if (!d) return;
      var cs = window.getComputedStyle(el);
      var stroke = cs.stroke || 'none';
      var fill = cs.fill || 'none';
      var sw = parseFloat(cs.strokeWidth) || 1;
      // "|| 1" trataria 0 (opacidade explícita) como ausente — usar isNaN
      var foParsed = parseFloat(cs.fillOpacity);
      var soParsed = parseFloat(cs.strokeOpacity);
      var fo = isNaN(foParsed) ? 1 : foParsed;
      var so = isNaN(soParsed) ? 1 : soParsed;
      try {
        var p2d = new Path2D(d);
        if (TRANSPARENT.indexOf(fill) === -1) {
          ctx.globalAlpha = fo;
          ctx.fillStyle = fill;
          ctx.fill(p2d, 'evenodd');
        }
        if (TRANSPARENT.indexOf(stroke) === -1) {
          ctx.globalAlpha = so;
          ctx.strokeStyle = stroke;
          ctx.lineWidth = sw;
          ctx.stroke(p2d);
        }
        ctx.globalAlpha = 1;
      } catch (e) {}
    }

    function traverse(el) {
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'g') {
        ctx.save();
        applyGroupTransform(el);
        Array.prototype.slice.call(el.children).forEach(traverse);
        ctx.restore();
      } else if (tag === 'path') {
        drawPathEl(el);
      } else if (el.children && el.children.length) {
        Array.prototype.slice.call(el.children).forEach(traverse);
      }
    }

    // O <svg> do Leaflet usa viewBox com origem deslocada (ex.: "-135 -81 1622 972")
    // — sem compensar isso, os paths desenham ~135px/81px fora de posição.
    var vb = (svgEl.getAttribute('viewBox') || '').trim().split(/\s+/).map(parseFloat);
    var vbMinX = vb.length === 4 ? vb[0] : 0;
    var vbMinY = vb.length === 4 ? vb[1] : 0;
    var vbW = vb.length === 4 ? vb[2] : null;
    var vbH = vb.length === 4 ? vb[3] : null;
    var svgW = parseFloat(svgEl.getAttribute('width'));
    var svgH = parseFloat(svgEl.getAttribute('height'));
    var scaleX = (vbW && svgW) ? svgW / vbW : 1;
    var scaleY = (vbH && svgH) ? svgH / vbH : 1;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-vbMinX, -vbMinY);
    Array.prototype.slice.call(svgEl.children).forEach(traverse);
    ctx.restore();
  }

  // ── Captura principal: monta o canvas final ───────────────────────────────────
  function captureMapExport(options) {
    var mapEl   = document.getElementById('map');
    var mapRect = mapEl.getBoundingClientRect();
    var dpr     = window.devicePixelRatio || 1;

    var canvas = document.createElement('canvas');
    canvas.width  = Math.ceil(mapRect.width  * dpr);
    canvas.height = Math.ceil(mapRect.height * dpr);
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Fundo padrão (visível se o mapa base não puder ser exportado)
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, mapRect.width, mapRect.height);

    var basemapKey = currentBasemapKey();

    // ── Diagnóstico (visível no DevTools → Console) ───────────────────────────────
    var DIAG = { mapRect: { w: mapRect.width, h: mapRect.height }, basemapKey: basemapKey,
                 tilesTotal: 0, tilesOk: 0, tilesErr: [],
                 rasterTotal: 0, rasterOk: 0, rasterErr: [],
                 svgTotal: 0, svgOk: 0, svgErr: [] };

    // 1. Tiles do mapa base (somente se suportar CORS) — desenhados a partir
    //    das <img> já carregadas em memória, sem nova requisição de rede.
    //    Pulado inteiramente em modo vectorOnly (fallback pós-contaminação).
    if (!options.vectorOnly && CORS_OK.indexOf(basemapKey) !== -1) {
      var tiles = mapEl.querySelectorAll('.leaflet-tile-pane img.leaflet-tile-loaded');
      DIAG.tilesTotal = tiles.length;
      tiles.forEach(function (img) {
        try {
          var r = img.getBoundingClientRect();
          ctx.drawImage(img, r.left - mapRect.left, r.top - mapRect.top, r.width, r.height);
          DIAG.tilesOk++;
        } catch (e) { DIAG.tilesErr.push(e.message || String(e)); }
      });
    }

    // 2. Demais panes do Leaflet (overlayPane + panes customizados), em ordem
    //    de z-index — inclui camadas raster (L.imageOverlay: Hipsometria,
    //    Hillshade, MapBiomas, Declividade), vetoriais (SVG: limite municipal,
    //    distritos, CAR, vegetação, medições) e marcadores HTML (divIcon:
    //    marcador de coordenada, vértices de medição, rótulos de curva de nível).
    //    Processar nessa ordem garante a mesma sobreposição visual do mapa ao vivo.
    var SVG_TIMEOUT_MS = 4000;
    var jobPromises = [];

    var panesOrdenados = Array.prototype.slice.call(mapEl.querySelectorAll('.leaflet-pane'))
      .filter(function (p) {
        // Excluir o pane raiz (.leaflet-map-pane), que é apenas um contêiner
        // wrapper de todos os outros panes — não tem conteúdo próprio para
        // desenhar, e processá-lo causaria captura duplicada/incorreta.
        // Excluir também o tile pane, já tratado separadamente no passo 1.
        return !p.classList.contains('leaflet-tile-pane') && !p.classList.contains('leaflet-map-pane');
      })
      .sort(function (a, b) {
        var za = parseInt(window.getComputedStyle(a).zIndex, 10) || 0;
        var zb = parseInt(window.getComputedStyle(b).zIndex, 10) || 0;
        return za - zb;
      });

    panesOrdenados.forEach(function (pane) {
      // Dentro do mesmo pane, elementos podem ter z-index individual divergente
      // da ordem do DOM (ex.: <svg> com z-index 200 e <img> de raster com
      // z-index 1, no mesmo .leaflet-overlay-pane) — sem reordenar aqui, o
      // raster seria desenhado por cima do vetor, escondendo-o.
      var filhosOrdenados = Array.prototype.slice.call(pane.children).sort(function (a, b) {
        var za = parseInt(window.getComputedStyle(a).zIndex, 10) || 0;
        var zb = parseInt(window.getComputedStyle(b).zIndex, 10) || 0;
        return za - zb;
      });
      filhosOrdenados.forEach(function (el) {
        var tag = el.tagName ? el.tagName.toLowerCase() : '';

        if (tag === 'img' && options.vectorOnly) {
          return; // modo vectorOnly: pula camadas raster (fonte de contaminação do canvas)
        }

        if (tag === 'img') {
          // Camada raster (L.imageOverlay): arquivo local — pode contaminar o
          // canvas sob file:// (cada arquivo é tratado como origem única).
          DIAG.rasterTotal++;
          var p = new Promise(function (resolve) {
            try {
              var r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) {
                // ctx.drawImage ignora a opacity CSS — sem isso, rasters como o
                // Hillshade (opacity 0.4) cobririam 100% opacos as camadas abaixo.
                var op = parseFloat(window.getComputedStyle(el).opacity);
                var prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = isNaN(op) ? 1 : op;
                ctx.drawImage(el, r.left - mapRect.left, r.top - mapRect.top, r.width, r.height);
                ctx.globalAlpha = prevAlpha;
                DIAG.rasterOk++;
              }
            } catch (e) { DIAG.rasterErr.push((el.src || el.className || 'raster') + ': ' + (e.message || e)); }
            resolve();
          });
          jobPromises.push(withTimeout(p, SVG_TIMEOUT_MS, null));

        } else if (tag === 'svg') {
          // Camadas vetoriais (renderer SVG padrão do Leaflet).
          // Desenha os <path> diretamente via Path2D a partir do DOM ainda
          // anexado à página — clonar+serializar+rasterizar via Image perde o
          // contexto de CSS externo (leaflet.css/style.css) e causava desvio
          // de posição entre o vetor exportado e o mapa real.
          DIAG.svgTotal++;
          try {
            var r2 = el.getBoundingClientRect();
            if (r2.width > 0 && r2.height > 0) {
              drawLeafletSvgDirect(el, ctx, r2.left - mapRect.left, r2.top - mapRect.top);
              DIAG.svgOk++;
            }
          } catch (e) { DIAG.svgErr.push(e.message || String(e)); }

        } else {
          // Marcadores HTML (divIcon): pontos de Serviços Públicos têm SVG
          // inline simples — desenhados via Path2D (mesma técnica robusta dos
          // vetores, imune à falha de Image/data URI sob file://). Demais
          // marcadores (coordenada, vértices de medição, rótulos de curva de
          // nível) seguem via domToImage, que funciona normalmente em HTTP.
          var svgIconEl = el.querySelector ? el.querySelector('.service-icon-wrap svg') : null;
          if (svgIconEl) {
            try {
              var rIcon = el.getBoundingClientRect();
              drawLeafletSvgDirect(svgIconEl, ctx, rIcon.left - mapRect.left, rIcon.top - mapRect.top);
            } catch (e) {}
          } else {
            var p3 = domToImage(el).then(function (res) {
              if (!res) return;
              var r3 = el.getBoundingClientRect();
              try { ctx.drawImage(res.img, r3.left - mapRect.left, r3.top - mapRect.top, res.width, res.height); } catch (e) {}
            }).catch(function () {});
            jobPromises.push(withTimeout(p3, SVG_TIMEOUT_MS, null));
          }
        }
      });
    });

    return Promise.all(jobPromises).then(function () {
      console.log('[Exportar][Diagnóstico]', JSON.stringify(DIAG, null, 2));
      window.__exportDiag = DIAG; // disponível no DevTools: digite __exportDiag no Console

      var overlayPromises = [];

      // 4. Legenda dinâmica
      if (options.incLegenda) {
        var legendaEl = document.querySelector('.legend-ctrl');
        if (legendaEl && legendaEl.offsetParent !== null) {
          // Forçar expansão temporária — se o usuário tiver recolhido a legenda,
          // a captura pegaria só o cabeçalho. Restaura o estado original depois.
          var legBody = legendaEl.querySelector('.legend-ctrl-body');
          var legBodyOrigDisplay = legBody ? legBody.style.display : null;
          if (legBody) legBody.style.display = '';
          var pLeg = domToImage(legendaEl).then(function (res) {
            if (legBody) legBody.style.display = legBodyOrigDisplay;
            if (!res) return;
            var r = legendaEl.getBoundingClientRect();
            ctx.drawImage(res.img, r.left - mapRect.left, r.top - mapRect.top, res.width, res.height);
          }).catch(function () {
            if (legBody) legBody.style.display = legBodyOrigDisplay;
          });
          overlayPromises.push(withTimeout(pLeg, SVG_TIMEOUT_MS, null));
        }
      }

      // 5. Escala
      if (options.incEscala) {
        var escalaEl = document.querySelector('.leaflet-control-scale');
        if (escalaEl) {
          var pEsc = domToImage(escalaEl).then(function (res) {
            if (!res) return;
            var r = escalaEl.getBoundingClientRect();
            ctx.drawImage(res.img, r.left - mapRect.left, r.top - mapRect.top, res.width, res.height);
          }).catch(function () {});
          overlayPromises.push(withTimeout(pEsc, SVG_TIMEOUT_MS, null));
        }
      }

      // 6. Indicador de Norte
      if (options.incNorte) {
        var norteEl = document.querySelector('.north-indicator');
        if (norteEl) {
          var pNorte = domToImage(norteEl).then(function (res) {
            if (!res) return;
            var r = norteEl.getBoundingClientRect();
            ctx.drawImage(res.img, r.left - mapRect.left, r.top - mapRect.top, res.width, res.height);
          }).catch(function () {});
          overlayPromises.push(withTimeout(pNorte, SVG_TIMEOUT_MS, null));
        }
      }

      // 7. Minimapa — tratado manualmente (contém <img>, incompatível com foreignObject)
      if (options.incMinimap) {
        var minimapEl = document.getElementById('minimap-container');
        if (minimapEl) {
          var mr = minimapEl.getBoundingClientRect();
          var mx = mr.left - mapRect.left, my = mr.top - mapRect.top;
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fillRect(mx, my, mr.width, mr.height);
          ctx.strokeStyle = '#1E3A5F';
          ctx.lineWidth = 1;
          ctx.strokeRect(mx, my, mr.width, mr.height);

          var imgEl = document.getElementById('minimap-img');
          if (imgEl && imgEl.complete && imgEl.naturalWidth > 0 && imgEl.offsetParent !== null) {
            var ir = imgEl.getBoundingClientRect();
            try { ctx.drawImage(imgEl, ir.left - mapRect.left, ir.top - mapRect.top, ir.width, ir.height); } catch (e) {}
          }

          ctx.fillStyle = '#1E3A5F';
          ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('LOCALIZAÇÃO', mx + 8, my + 14);
        }
      }

      // 8. Título do mapa
      if (options.titulo) {
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        var textW = ctx.measureText(options.titulo).width;
        var padX = 20, boxH = 30;
        var boxW = textW + padX * 2;
        var boxX = (mapRect.width - boxW) / 2, boxY = 12;
        ctx.fillStyle = 'rgba(30,58,95,0.90)';
        roundRect(ctx, boxX, boxY, boxW, boxH, boxH / 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.titulo, boxX + padX, boxY + boxH / 2 + 1);
      }

      return Promise.all(overlayPromises).then(function () { return canvas; });
    });
  }
  // Exposto para reuso pela ferramenta "Exportar PDF Cartográfico"
  window.captureMapExport = captureMapExport;

  // ── Prévia + salvar ────────────────────────────────────────────────────────────
  function showPreviewAndSave(canvasEl, filename) {
    var dataUrl = canvasEl.toDataURL('image/png');

    var oldPrev = document.getElementById('export-preview-overlay');
    if (oldPrev) oldPrev.parentNode.removeChild(oldPrev);

    var ov = document.createElement('div');
    ov.id = 'export-preview-overlay';
    ov.innerHTML =
      '<div id="export-preview-modal">' +
        '<div class="export-header" style="justify-content:space-between">' +
          '<span style="font-size:13px;font-weight:700">Prévia da Exportação</span>' +
          '<button id="export-preview-close" class="export-close-btn" title="Fechar">✕</button>' +
        '</div>' +
        '<div style="padding:12px;text-align:center;background:#f8f9fa;max-height:60vh;overflow:auto">' +
          '<img id="export-preview-img" src="' + dataUrl + '" style="max-width:100%;border:1px solid #ddd;border-radius:4px" />' +
        '</div>' +
        '<div style="padding:10px 16px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
          '<a id="export-preview-save" download="' + filename + '" href="' + dataUrl + '" class="export-btn-primary" style="text-decoration:none;text-align:center;padding:9px 18px">' +
            '⬇ Salvar PNG' +
          '</a>' +
          '<span style="font-size:11px;color:#90a4ae;flex:1">Ou clique com o botão direito na imagem → <b>Salvar imagem como…</b></span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(ov);

    document.getElementById('export-preview-close').addEventListener('click', function () {
      ov.parentNode && ov.parentNode.removeChild(ov);
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) ov.parentNode && ov.parentNode.removeChild(ov);
    });
  }

  function showToastMsg(msg, duration) {
    var t = document.getElementById('toolbar-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._exportTimer);
    t._exportTimer = setTimeout(function () { t.classList.remove('show'); }, duration || 3500);
  }

  // ── Exportar ─────────────────────────────────────────────────────────────────
  var _expGo = document.getElementById('export-go');
  if (_expGo) _expGo.addEventListener('click', function () {
    closeExportModal();

    var titulo     = document.getElementById('export-titulo').value.trim();
    var incLegenda = document.getElementById('export-inc-legenda').checked;
    var incMinimap = document.getElementById('export-inc-minimap').checked;
    var incEscala  = document.getElementById('export-inc-escala').checked;
    var incNorte   = document.getElementById('export-inc-norte').checked;

    showToastMsg('⏳ Gerando exportação, aguarde...', 60000);

    // Timeout de segurança — esta abordagem não depende de rede/iframe, então
    // não deveria travar, mas mantemos a rede de segurança por precaução.
    var finished = false;
    var timeoutId = setTimeout(function () {
      if (finished) return;
      finished = true;
      showToastMsg('⚠ Tempo de exportação esgotado. Tente novamente.', 5000);
    }, 15000);

    setTimeout(function () {
      var opcoesBase = {
        titulo:     titulo,
        incLegenda: incLegenda,
        incMinimap: incMinimap,
        incEscala:  incEscala,
        incNorte:   incNorte
      };

      captureMapExport(opcoesBase).then(function (canvas) {
        // Testar contaminação (comum em file://: tiles e rasters locais são
        // tratados como origens distintas). Se contaminado, recapturar em
        // modo somente-vetorial (sem mapa base nem camadas raster).
        var mapaSemRaster = false;
        try {
          canvas.toDataURL('image/png');
        } catch (taintErr) {
          mapaSemRaster = true;
        }

        if (mapaSemRaster) {
          var opcoesVetor = Object.assign({}, opcoesBase, { vectorOnly: true });
          return captureMapExport(opcoesVetor).then(function (vecCanvas) {
            return { canvas: vecCanvas, mapaSemRaster: true };
          });
        }
        return { canvas: canvas, mapaSemRaster: false };
      }).then(function (result) {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);

        var now   = new Date();
        var pad   = function (n) { return String(n).padStart(2, '0'); };
        var stamp = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) +
                    '_' + pad(now.getHours()) + pad(now.getMinutes());
        var nome  = 'geoportal_sjc_mapa_' + stamp + '.png';

        showPreviewAndSave(result.canvas, nome);
        if (result.mapaSemRaster) {
          showToastMsg('✓ Imagem gerada sem mapa base/raster (restrição do navegador em file://).', 6000);
        } else {
          showToastMsg('✓ Exportação gerada. Veja a prévia para salvar.', 3000);
        }
      }).catch(function (err) {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        console.error('[Exportar] Erro na captura:', err);
        showToastMsg('⚠ Erro ao exportar: ' + (err && err.message ? err.message : 'tente novamente'), 4000);
      });
    }, 50);
  });
}());

// ─── Ferramenta: Exportar PDF Cartográfico ───────────────────────────────────
// Reaproveita captureMapExport() (mapa+vetores, sem overlays) e rasteriza
// legenda/minimapa/norte/escala separadamente para montar um layout
// institucional em A4 paisagem via jsPDF — sem depender de CDN.
(function () {
  var overlay = document.getElementById('pdf-export-overlay');
  var warnEl  = document.getElementById('pdf-cors-warn');

  var CORS_RISK = ['Esri World Imagery']; // Esri bloqueia export de canvas em alguns ambientes
  var BASEMAP_LABELS = {
    'Carto Positron':     'Carto Positron',
    'OpenStreetMap':      'OpenStreetMap',
    'Esri World Imagery': 'Satélite Esri',
    'OpenTopoMap':        'OpenTopoMap',
    'Carto Dark Matter':  'Carto Dark Matter'
  };

  function currentBasemapKey() {
    var found = null;
    Object.keys(basemaps).forEach(function (k) { if (map.hasLayer(basemaps[k])) found = k; });
    return found;
  }

  function openPdfExportModal() {
    var key = currentBasemapKey();
    warnEl.style.display = CORS_RISK.indexOf(key) !== -1 ? 'flex' : 'none';
    overlay.classList.add('open');
  }
  window.openPdfExportModal = openPdfExportModal;

  function closePdfExportModal() { overlay.classList.remove('open'); }

  document.getElementById('pdf-export-close').addEventListener('click', closePdfExportModal);
  document.getElementById('pdf-export-cancel').addEventListener('click', closePdfExportModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closePdfExportModal(); });

  function showToastMsg(msg, duration) {
    var t = document.getElementById('toolbar-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._pdfTimer);
    t._pdfTimer = setTimeout(function () { t.classList.remove('show'); }, duration || 3500);
  }

  // ── Util locais (cópias independentes — mesma técnica do export PNG) ─────────
  function withTimeoutLocal(promise, ms, fallback) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(fallback); } }, ms);
      promise.then(function (v) {
        if (done) return; done = true; clearTimeout(timer); resolve(v);
      }).catch(function () {
        if (done) return; done = true; clearTimeout(timer); resolve(fallback);
      });
    });
  }

  function domToImageLocal(el) {
    // Usa html2canvas (já incluído no projeto) em vez de foreignObject+SVG+Image:
    // a técnica anterior ora travava com "wrong PNG signature" (string SVG
    // passada como se fosse PNG), ora produzia imagem em branco mesmo após
    // corrigir o formato — limitação conhecida de foreignObject com HTML
    // complexo (tabelas, flex, ícones). html2canvas renderiza o DOM real
    // diretamente num canvas, sem essas armadilhas.
    if (typeof html2canvas !== 'function') {
      return Promise.reject(new Error('html2canvas não disponível'));
    }
    var hiddenEls = el.querySelectorAll('button, input');
    var prevDisplay = [];
    hiddenEls.forEach(function (n) { prevDisplay.push(n.style.display); n.style.display = 'none'; });

    function restore() {
      hiddenEls.forEach(function (n, i) { n.style.display = prevDisplay[i]; });
    }

    // scale:2 — captura em resolução mais alta só para nitidez (evita
    // borrado). width/height retornados são o tamanho LÓGICO em CSS px
    // (getBoundingClientRect), não o canvas (2x) — é o que importa para
    // calcular o tamanho físico em mm no PDF, senão o texto sai maior do
    // que a fonte real usada no painel (12px ≈ mesmo tamanho do 8,5pt do
    // painel lateral).
    var logicalRect = el.getBoundingClientRect();
    return html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false })
      .then(function (canvas) {
        restore();
        return { dataUrl: canvas.toDataURL('image/png'), width: logicalRect.width, height: logicalRect.height };
      })
      .catch(function (e) { restore(); throw e; });
  }

  function imgElToDataUrl(imgEl) {
    var c = document.createElement('canvas');
    c.width = imgEl.naturalWidth; c.height = imgEl.naturalHeight;
    var ctx = c.getContext('2d');
    ctx.drawImage(imgEl, 0, 0);
    return c.toDataURL('image/png');
  }

  // ── Lista de camadas ativas (label de LAYER_CONFIG cuja camada está no mapa) ──
  function listaCamadasAtivas() {
    var nomes = [];
    LAYER_CONFIG.forEach(function (cfg) {
      var lyr = layerRefs[cfg.id];
      if (lyr && map.hasLayer(lyr) && cfg.label) nomes.push(cfg.label);
    });
    return nomes;
  }

  // ── Gerar PDF ──────────────────────────────────────────────────────────────────
  document.getElementById('pdf-export-go').addEventListener('click', function () {
    closePdfExportModal();

    var titulo       = document.getElementById('pdf-export-titulo').value.trim() || 'Base Cartográfica Municipal';
    var incLegenda    = document.getElementById('pdf-inc-legenda').checked;
    var incMinimap    = document.getElementById('pdf-inc-minimap').checked;
    var incNorte      = document.getElementById('pdf-inc-norte').checked;
    var incEscala     = document.getElementById('pdf-inc-escala').checked;
    var incCamadas    = document.getElementById('pdf-inc-camadas').checked;
    var incCreditos   = document.getElementById('pdf-inc-creditos').checked;
    var incPaineis    = document.getElementById('pdf-inc-paineis').checked;

    showToastMsg('⏳ Gerando PDF, aguarde...', 60000);

    var finished = false;
    var timeoutId = setTimeout(function () {
      if (finished) return;
      finished = true;
      showToastMsg('⚠ Tempo de geração esgotado. Tente novamente.', 5000);
    }, 20000);

    setTimeout(function () {
      // Desenha diretamente os paths SVG do Leaflet num canvas (sem new Image/data URI),
      // contornando a limitação do file:// onde onload nunca dispara.
      function drawVectorsDirectToCanvas(targetCanvas) {
        var ctx = targetCanvas.getContext('2d');
        var cw = targetCanvas.width, ch = targetCanvas.height;
        var mapEl = map.getContainer();
        var scaleX = cw / (mapEl.offsetWidth || 1);
        var scaleY = ch / (mapEl.offsetHeight || 1);

        ctx.fillStyle = '#f0efeb';
        ctx.fillRect(0, 0, cw, ch);

        var pane = map.getPanes().overlayPane;
        var svgRoot = pane ? pane.querySelector('svg') : null;
        if (!svgRoot) return;

        function applyTransform(el) {
          var tr = el.style.transform || '';
          var m = tr.match(/translate(?:3d)?\(\s*([\-\d.]+)px,\s*([\-\d.]+)px/);
          if (m) ctx.translate(parseFloat(m[1]) * scaleX, parseFloat(m[2]) * scaleY);
        }

        function drawPathEl(el) {
          var d = el.getAttribute('d');
          if (!d) return;
          var cs = window.getComputedStyle(el);
          var stroke = cs.stroke || 'none';
          var fill   = cs.fill   || 'none';
          var sw = parseFloat(cs.strokeWidth) || 1;
          // "|| 1" trataria 0 (opacidade explícita) como ausente — usar isNaN
          var foParsed2 = parseFloat(cs.fillOpacity);
          var soParsed2 = parseFloat(cs.strokeOpacity);
          var fo = isNaN(foParsed2) ? 1 : foParsed2;
          var so = isNaN(soParsed2) ? 1 : soParsed2;
          ctx.save();
          ctx.scale(scaleX, scaleY);
          try {
            var p2d = new Path2D(d);
            var transparent = ['none', 'rgba(0, 0, 0, 0)', 'transparent'];
            if (transparent.indexOf(fill) === -1) {
              ctx.globalAlpha = fo;
              ctx.fillStyle = fill;
              ctx.fill(p2d, 'evenodd');
            }
            if (transparent.indexOf(stroke) === -1) {
              ctx.globalAlpha = so;
              ctx.strokeStyle = stroke;
              ctx.lineWidth = sw;
              ctx.stroke(p2d);
            }
          } catch (e) {}
          ctx.restore();
        }

        function traverse(el) {
          var tag = (el.tagName || '').toLowerCase();
          if (tag === 'g') {
            ctx.save();
            applyTransform(el);
            Array.from(el.children).forEach(traverse);
            ctx.restore();
          } else if (tag === 'path') {
            drawPathEl(el);
          }
        }

        Array.from(svgRoot.children).forEach(traverse);
      }

      // Continua a montagem do PDF a partir de um canvas do mapa já pronto
      // (original ou recapturado em modo vetorial, caso o primeiro tenha contaminado)
      function continuarMontagemPdf(mapCanvas, mapaSemRaster) {
        var basemapKey = currentBasemapKey();
        var basemapNoCors = CORS_RISK.indexOf(basemapKey) !== -1;

        var overlayJobs = [];
        var legendaImgData = null;
        var paineisData = [];

        if (incPaineis && typeof window.getOpenAttributePanels === 'function') {
          window.getOpenAttributePanels().forEach(function (p) {
            overlayJobs.push(withTimeoutLocal(domToImageLocal(p.el), 4000, null).then(function (res) {
              if (res) {
                paineisData.push({
                  dataUrl: res.dataUrl, w: res.width, h: res.height,
                  screenLeft: p.left, screenTop: p.top,
                  featureBounds: p.featureBounds
                });
              }
            }));
          });
        }

        // Legenda sempre construída vetorialmente no PDF — sem captura DOM.
        // O widget web (com cabeçalho, botões e borda) não é adequado para
        // um produto cartográfico; o layout vetorial em jsPDF é mais limpo.
        // Norte e escala gráfica não usam mais captura de DOM — são desenhados
        // nativamente via jsPDF (mais confiáveis, ver mais abaixo).

        return Promise.all(overlayJobs).then(function () {
          return { mapCanvas: mapCanvas, basemapKey: basemapKey, basemapNoCors: basemapNoCors,
                   mapaSemRaster: mapaSemRaster,
                   legendaImgData: legendaImgData,
                   paineisData: paineisData };
        });
      }

      // Mapa "limpo" (tiles + vetores), sem overlays embutidos — eles vão no painel lateral
      window.captureMapExport({ incLegenda: false, incMinimap: false, incEscala: false, incNorte: false })
        .then(function (mapCanvas) {
          // Testar se o canvas ficou contaminado (comum em file://, onde tiles
          // e rasters locais são tratados como origens distintas pelo navegador).
          // Se sim, recapturar em modo somente-vetorial (sem tiles/raster).
          var mapaSemRaster = false;
          try {
            mapCanvas.toDataURL('image/png');
          } catch (taintErr) {
            mapaSemRaster = true;
          }

          var mapCanvasPromise = mapaSemRaster
            ? window.captureMapExport({ incLegenda: false, incMinimap: false, incEscala: false, incNorte: false, vectorOnly: true })
            : Promise.resolve(mapCanvas);

          return mapCanvasPromise.then(function (finalMapCanvas) {
            return continuarMontagemPdf(finalMapCanvas, mapaSemRaster);
          });
        })
        .then(function (data) {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);

          var jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
          var doc = new jsPDFCtor({ orientation: 'landscape', unit: 'mm', format: 'a4' });

          var PAGE_W = 297, PAGE_H = 210;
          var MARGIN = 8;
          var PANEL_W = 65; // ≈22% da largura da página
          var mapX = MARGIN, mapY = MARGIN;
          var mapW = PAGE_W - MARGIN * 3 - PANEL_W;
          var mapH = PAGE_H - MARGIN * 2 - 12; // reserva rodapé institucional
          var panelX = mapX + mapW + MARGIN;

          var center = map.getCenter();
          var agora = new Date();
          var dataEmissao = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          var escalaTxt = (typeof _calcScale === 'function') ? _calcScale(map.getZoom(), center.lat) : '—';
          var scaleDenom = parseInt((escalaTxt.split(':')[1] || '100000').replace(/\D/g, ''), 10) || 100000;

          // ── Fundo do mapa + imagem ──────────────────────────────────────────────
          doc.setFillColor(232, 232, 232);
          doc.rect(mapX, mapY, mapW, mapH, 'F');

          // No file://, o canvas fica vazio (vectorOnly também falha via Image).
          // Redesenhamos os vetores diretamente usando Path2D (sem new Image).
          if (data.mapaSemRaster) {
            try { drawVectorsDirectToCanvas(data.mapCanvas); } catch (e) {
              console.warn('[PDF] drawVectorsDirectToCanvas falhou:', e);
            }
          }

          // Recorte "cover" (preenche toda a moldura, sem faixas vazias) em vez de
          // "contain" — corta o excesso de largura ou altura do canvas capturado
          // para casar exatamente com a proporção da área do mapa no PDF.
          var cw = data.mapCanvas.width, ch = data.mapCanvas.height;
          var canvasAspect = cw / ch, targetAspect = mapW / mapH;
          var srcX, srcY, srcW, srcH;
          if (canvasAspect > targetAspect) {
            srcH = ch; srcW = ch * targetAspect; srcX = (cw - srcW) / 2; srcY = 0;
          } else {
            srcW = cw; srcH = cw / targetAspect; srcX = 0; srcY = (ch - srcH) / 2;
          }
          try {
            var cropCanvas = document.createElement('canvas');
            cropCanvas.width = srcW; cropCanvas.height = srcH;
            cropCanvas.getContext('2d').drawImage(data.mapCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
            doc.addImage(cropCanvas.toDataURL('image/png'), 'PNG', mapX, mapY, mapW, mapH);
          } catch (e) { console.warn('[PDF] Falha ao inserir imagem do mapa:', e); }
          doc.setDrawColor(120, 130, 145);
          doc.setLineWidth(0.4);
          doc.rect(mapX, mapY, mapW, mapH);

          // ── Escala gráfica sobre o mapa (canto inferior esquerdo) ───────────────
          // Desenho vetorial nativo (mais confiável que captura de DOM via
          // domToImage, que pode falhar sob file://). Aproximada a partir da
          // mesma escala numérica exibida no painel — não a substitui.
          try {
            var kmPerMm = scaleDenom / 1e6;
            var niceKm = [0.1, 0.2, 0.5, 1, 2, 3, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
            var targetSegKm = (24 * kmPerMm) / 3;
            var segKm = niceKm.reduce(function (prev, curr) {
              return Math.abs(curr - targetSegKm) < Math.abs(prev - targetSegKm) ? curr : prev;
            });
            var segMm = segKm / kmPerMm;
            var barX = mapX + 5, barY = mapY + mapH - 8, barH = 1.6;
            for (var si = 0; si < 3; si++) {
              var segX = barX + si * segMm;
              var dark = si % 2 === 0;
              doc.setFillColor(dark ? 40 : 255, dark ? 40 : 255, dark ? 40 : 255);
              doc.setDrawColor(40, 40, 40);
              doc.setLineWidth(0.2);
              doc.rect(segX, barY, segMm, barH, 'FD');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(30, 30, 30);
            doc.text('0', barX, barY + barH + 3);
            for (var sj = 1; sj <= 3; sj++) {
              var lbl = String(segKm * sj % 1 === 0 ? segKm * sj : (segKm * sj).toFixed(1));
              var lblW = doc.getTextWidth(lbl);
              doc.text(lbl, barX + sj * segMm - lblW / 2, barY + barH + 3);
            }
            doc.text('km', barX + 3 * segMm + 2.5, barY + barH + 3);
            doc.setTextColor(40, 40, 40);
          } catch (e) {}

          // ── Indicador de norte sobre o mapa (canto inferior esquerdo, acima da escala) ─
          try {
            var noX = mapX + 8, noY = mapY + mapH - 17;
            doc.setFillColor(50, 50, 50);
            doc.setDrawColor(50, 50, 50);
            doc.setLineWidth(0.2);
            doc.triangle(noX, noY - 7, noX - 2.5, noY, noX + 2.5, noY, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(40, 40, 40);
            var nLblW = doc.getTextWidth('N');
            doc.text('N', noX - nLblW / 2, noY + 4);
          } catch (e) {}

          // ── Painéis de atributos abertos (opcional) ─────────────────────────────
          // Posição fixa no canto inferior direito da moldura do mapa.
          // Tamanho físico real (CSS px → mm a 96dpi), igual à fonte do
          // painel lateral (12px ≈ 8,5pt) — só encolhe se não couber na
          // zona disponível, nunca amplia (texto ficaria maior que o resto
          // do documento). A captura em alta resolução (scale:2 no
          // html2canvas) mantém o texto nítido mesmo após esse encolhimento.
          if (incPaineis && data.paineisData && data.paineisData.length) {
            try {
              var PX_TO_MM = 25.4 / 96;
              var maxPanelW = mapW * 0.5, maxPanelH = mapH * 0.55;
              var stackY = mapY + mapH - 4; // empilha para cima a partir do canto inferior direito

              data.paineisData.forEach(function (p, painelIdx) {
                var pw = p.w * PX_TO_MM, ph = p.h * PX_TO_MM;
                var fitScale = Math.min(1, maxPanelW / pw, maxPanelH / ph);
                pw *= fitScale; ph *= fitScale;

                var px  = mapX + mapW - 4 - pw;
                var ppy = stackY - ph;
                if (ppy < mapY + 4) return; // sem espaço para mais painéis nesse canto
                stackY = ppy - 3;

                try {
                  doc.setDrawColor(180, 180, 180);
                  doc.setFillColor(255, 255, 255);
                  doc.rect(px, ppy, pw, ph, 'FD');
                  // Alias único por painel — sem isso, o cache interno de
                  // imagens do jsPDF pode reutilizar por engano os dados de
                  // OUTRO painel quando dois ficam na mesma posição/tamanho.
                  doc.addImage(p.dataUrl, 'PNG', px, ppy, pw, ph, 'painelAtributo' + painelIdx);
                } catch (e) { console.warn('[PDF] Falha ao inserir painel de atributos:', e); }
              });
            } catch (e) { console.warn('[PDF] Falha ao posicionar painéis de atributos:', e); }
          }

          // ── Painel lateral direito ───────────────────────────────────────────────
          var py = MARGIN;
          // ── Título temático gerado pelas camadas ativas ──────────────────────────
          function gerarTituloTematico() {
            var ids = [], grupos = [];
            LAYER_CONFIG.forEach(function (cfg) {
              var lyr = layerRefs[cfg.id];
              if (lyr && map.hasLayer(lyr) && cfg.id !== 'sjc') {
                ids.push(cfg.id);
                if (grupos.indexOf(cfg.grupo) === -1) grupos.push(cfg.grupo);
              }
            });
            if (ids.length === 0) return 'MAPA MUNICIPAL';
            if (ids.indexOf('mapbiomas') !== -1) return 'USO E COBERTURA DA TERRA — MAPBIOMAS 2024';
            if (grupos.length === 1) {
              var g = grupos[0];
              if (g === 'Sistema Viário')           return 'SISTEMA VIÁRIO MUNICIPAL';
              if (g === 'Hidrografia')              return 'HIDROGRAFIA MUNICIPAL';
              if (g === 'Serviços Públicos')        return 'SERVIÇOS PÚBLICOS MUNICIPAIS';
              if (g === 'Relevo')                   return 'RELEVO E HIPSOMETRIA';
              if (g === 'Uso e Cobertura da Terra') return 'USO E COBERTURA DA TERRA — MAPBIOMAS 2024';
              if (g === 'Limites Administrativos')  return 'LIMITES ADMINISTRATIVOS';
            }
            var temAmbiental = ids.some(function (id) {
              return ['car','veg_nativa','rl_averbada','rl_proposta'].indexOf(id) !== -1;
            });
            if (temAmbiental && grupos.length <= 2) return 'MEIO RURAL E AMBIENTAL';
            var temRelevo = ids.some(function (id) {
              return ['hillshade','hipsometria','decl_plano','decl_suave','decl_ondulado',
                      'decl_forte','decl_montanhoso','decl_escarpado','curvas_nivel'].indexOf(id) !== -1;
            });
            if (temRelevo && grupos.length <= 2) return 'RELEVO E HIPSOMETRIA';
            return 'MAPA TEMÁTICO MUNICIPAL';
          }

          var basemapLabel = BASEMAP_LABELS[data.basemapKey] || data.basemapKey || '—';

          // Cabeçalho institucional
          doc.setFillColor(30, 58, 95);
          doc.rect(panelX, py, PANEL_W, 13, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          var hdrLines = doc.splitTextToSize('GEOPORTAL DE SÃO JOSÉ DO CALÇADO', PANEL_W - 6);
          doc.text(hdrLines, panelX + 3, py + 5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text('Espírito Santo · Brasil', panelX + 3, py + 5 + hdrLines.length * 4 + 0.5);
          py += 14;

          // Título temático
          var tituloTematico = gerarTituloTematico();
          var tituloTLines = doc.splitTextToSize(tituloTematico, PANEL_W - 6);
          var tituloBlockH = tituloTLines.length * 4.5 + 10;
          doc.setFillColor(236, 241, 248);
          doc.setDrawColor(195, 210, 228);
          doc.setLineWidth(0.3);
          doc.rect(panelX, py, PANEL_W, tituloBlockH, 'FD');
          doc.setTextColor(25, 50, 85);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text(tituloTLines, panelX + 3, py + 5.5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(90, 110, 140);
          doc.text('Município de São José do Calçado - ES', panelX + 3, py + 5.5 + tituloTLines.length * 4.5 + 1.5);
          py += tituloBlockH + 4;

          // Informações técnicas
          doc.setLineWidth(0.2);
          var infoItens = [
            ['Data:', dataEmissao],
            ['Escala:', escalaTxt],
            ['Sistema de referência:', 'WGS84'],
            ['Mapa base:', basemapLabel],
            ['Centro do mapa:', center.lat.toFixed(5) + ', ' + center.lng.toFixed(5)]
          ];
          infoItens.forEach(function (par) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text(par[0], panelX + 3, py);
            py += 3;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(20, 20, 20);
            var valLines = doc.splitTextToSize(par[1], PANEL_W - 6);
            doc.text(valLines, panelX + 3, py);
            py += valLines.length * 3.2 + 2;
          });

          if (data.basemapNoCors) {
            doc.setTextColor(150, 100, 0);
            doc.setFontSize(7);
            var avisoLines = doc.splitTextToSize('⚠ Mapa base pode não ter sido capturado (sem suporte a exportação).', PANEL_W - 6);
            doc.text(avisoLines, panelX + 3, py);
            py += avisoLines.length * 3.2 + 3;
            doc.setTextColor(40, 40, 40);
          }

          if (data.mapaSemRaster) {
            doc.setTextColor(150, 100, 0);
            doc.setFontSize(7);
            var avisoRaster = doc.splitTextToSize(
              '⚠ Mapa base e camadas raster omitidos — restrição de segurança do navegador ao abrir o Geoportal direto do arquivo (file://). Rode via servidor local para exportação completa.',
              PANEL_W - 6
            );
            doc.text(avisoRaster, panelX + 3, py);
            py += avisoRaster.length * 3.2 + 3;
            doc.setTextColor(40, 40, 40);
          }

          py += 1;
          doc.setDrawColor(210, 210, 210);
          doc.setLineWidth(0.3);
          doc.line(panelX, py, panelX + PANEL_W, py);
          py += 4;

          // ── Camadas ativas ───────────────────────────────────────────────────────
          if (incCamadas) {
            var camadasAtivas = listaCamadasAtivas();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 58, 95);
            doc.text('CAMADAS ATIVAS', panelX + 3, py);
            py += 4;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(40, 40, 40);
            if (camadasAtivas.length === 0) {
              doc.setTextColor(120, 120, 120);
              doc.text('Nenhuma camada temática ativa.', panelX + 3, py);
              doc.setTextColor(40, 40, 40);
              py += 4;
            } else {
              camadasAtivas.forEach(function (nome) {
                if (py > MARGIN + mapH - 50) return;
                var linhas = doc.splitTextToSize('· ' + nome, PANEL_W - 6);
                doc.text(linhas, panelX + 3, py);
                py += linhas.length * 3.3 + 0.5;
              });
            }
            py += 2;
            doc.setDrawColor(210, 210, 210);
            doc.setLineWidth(0.3);
            doc.line(panelX, py, panelX + PANEL_W, py);
            py += 4;
          }

          // ── Legenda cartográfica (sempre vetorial) ───────────────────────────────
          if (incLegenda) {
            var LEGEND_GRUPO_LABELS = {
              'Limites Administrativos': 'LIMITES',
              'Sistema Viário':          'SISTEMA VIÁRIO',
              'Hidrografia':             'HIDROGRAFIA',
              'Serviços Públicos':       'SERVIÇOS PÚBLICOS',
              'Meio Rural e Ambiental':  'MEIO RURAL E AMBIENTAL',
              'Relevo':                  'RELEVO',
              'Uso e Cobertura da Terra':'USO E COBERTURA DA TERRA'
            };
            var mbAtivoPdf  = layerRefs['mapbiomas'] && map.hasLayer(layerRefs['mapbiomas']);
            var satAtivoPdf = basemaps && basemaps['Esri World Imagery'] && map.hasLayer(basemaps['Esri World Imagery']);
            var carSoBorda  = mbAtivoPdf || satAtivoPdf;
            var legendaLimitY    = MARGIN + mapH - 40;
            var legItemsOmitidos = 0;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(30, 58, 95);
            doc.text('LEGENDA', panelX + 3, py);
            py += 5;

            function drawLegItem(item) {
              if (py > legendaLimitY) { legItemsOmitidos++; return; }
              var sx = panelX + 3, sy = py - 2.8;
              doc.setDrawColor(item.color);
              doc.setFontSize(7);
              if (item.tipo === 'point') {
                var iconPng = item.iconId ? renderServiceIconPng(item.iconId, item.color, 48) : null;
                if (iconPng) {
                  try { doc.addImage(iconPng, 'PNG', sx, sy - 0.5, 5, 5); } catch (e) {}
                } else {
                  try { doc.setFillColor(item.color); doc.circle(sx + 2.5, sy + 1.5, 2, 'F'); } catch (e) {}
                }
              } else if (item.tipo === 'line') {
                try { doc.setLineWidth(0.7); doc.line(sx, sy + 1.5, sx + 8, sy + 1.5); } catch (e) {}
              } else {
                try {
                  doc.setLineWidth(0.4);
                  if (item.fill) {
                    doc.setFillColor(item.fillColor);
                    doc.rect(sx, sy, 7, 3.2, 'FD');
                  } else {
                    doc.rect(sx, sy, 7, 3.2, 'D');
                  }
                } catch (e) {}
              }
              doc.setTextColor(40, 40, 40);
              var nameLines = doc.splitTextToSize(item.label, PANEL_W - 15);
              doc.text(nameLines, sx + 10, py);
              py += nameLines.length * 3.6;
            }

            GRUPOS.forEach(function (grupo) {
              var camadasGrupo = LAYER_CONFIG.filter(function (cfg) {
                var lyr = layerRefs[cfg.id];
                return lyr && map.hasLayer(lyr) && cfg.grupo === grupo;
              });
              if (!camadasGrupo.length) return;
              if (py > legendaLimitY) { legItemsOmitidos++; return; }

              py += 1;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6.5);
              doc.setTextColor(50, 75, 110);
              doc.text(LEGEND_GRUPO_LABELS[grupo] || grupo.toUpperCase(), panelX + 3, py);
              py += 4;
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(40, 40, 40);

              camadasGrupo.forEach(function (cfg) {
                if (py > legendaLimitY) { legItemsOmitidos++; return; }
                if (cfg.tipo === 'raster') {
                  var classesR = Array.isArray(cfg.legenda) ? cfg.legenda
                               : (Array.isArray(cfg.classes) ? cfg.classes : null);
                  if (classesR) {
                    classesR.forEach(function (cl) {
                      drawLegItem({ label: cl.label, color: cl.cor, fillColor: cl.cor, tipo: 'polygon', fill: true });
                    });
                  }
                  return;
                }
                if (cfg.id === 'car') {
                  if (carSoBorda) {
                    drawLegItem({ label: 'Imóveis Rurais (CAR)', color: '#9E9E9E', fillColor: '#9E9E9E', tipo: 'polygon', fill: false });
                  } else {
                    drawLegItem({ label: 'Em conformidade',  color: '#2E7D32', fillColor: '#2E7D32', tipo: 'polygon', fill: true });
                    drawLegItem({ label: 'Em regularização', color: '#FFA000', fillColor: '#FFA000', tipo: 'polygon', fill: true });
                    drawLegItem({ label: 'Aguardando',       color: '#FF6F00', fillColor: '#FF6F00', tipo: 'polygon', fill: true });
                  }
                  return;
                }
                var est = cfg.estilo || {};
                var legItem = {
                  label:     cfg.label,
                  color:     est.color || '#888888',
                  fillColor: est.fillColor || est.color || '#888888',
                  tipo:      cfg.tipo,
                  fill:      cfg.tipo === 'polygon' && est.fill !== false
                };
                if (cfg.tipo === 'point' && SERVICE_ICON_PATHS[cfg.id]) legItem.iconId = cfg.id;
                drawLegItem(legItem);
              });
            });

            if (legItemsOmitidos > 0) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(6);
              doc.setTextColor(140, 140, 140);
              doc.text('+ ' + legItemsOmitidos + ' item(ns) não exibido(s)', panelX + 3, py);
              py += 4;
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(40, 40, 40);
            }
            py += 3;
          }

          // ── Minimapa (canto superior direito da página, fora do painel de texto) ─
          if (incMinimap) {
            var minimapImgEl = document.getElementById('minimap-img');
            if (minimapImgEl && minimapImgEl.complete && minimapImgEl.naturalWidth > 0) {
              try {
                var mmDataUrl = imgElToDataUrl(minimapImgEl);
                var mmW = 16, mmH = mmW * (minimapImgEl.naturalHeight / minimapImgEl.naturalWidth);
                var mmX = mapX + mapW - mmW - 4, mmY = mapY + 4;
                doc.setFillColor(255, 255, 255);
                doc.rect(mmX - 1, mmY - 1, mmW + 2, mmH + 2, 'F');
                doc.setDrawColor(30, 58, 95);
                doc.rect(mmX - 1, mmY - 1, mmW + 2, mmH + 2);
                doc.addImage(mmDataUrl, 'PNG', mmX, mmY, mmW, mmH);
              } catch (e) { console.warn('[PDF] Falha ao inserir minimapa:', e); }
            }
          }

          // ── Créditos e fonte ──────────────────────────────────────────────────────
          if (incCreditos) {
            var creditY = MARGIN + mapH - 13;
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.25);
            doc.setFillColor(248, 249, 250);
            doc.rect(panelX, creditY, PANEL_W, 13, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(70, 70, 70);
            doc.text('Fonte:', panelX + 3, creditY + 4);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(90, 90, 90);
            var fonteTxt = [
              'Geoportal de São José do Calçado - ES.',
              'Mapa base conforme provedor selecionado.',
              'Documento gerado automaticamente.'
            ];
            doc.text(fonteTxt, panelX + 3, creditY + 7, { lineHeightFactor: 1.2 });
            doc.setTextColor(40, 40, 40);
          }

          // ── Rodapé institucional (largura total da página) ──────────────────────
          var footY = PAGE_H - MARGIN + 2;
          doc.setDrawColor(200, 200, 200);
          doc.line(MARGIN, footY - 4, PAGE_W - MARGIN, footY - 4);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(130, 130, 130);
          doc.text('Geoportal de São José do Calçado - ES  •  Versão 1.0  •  2026  •  Desenvolvimento: Marco Bortolini  •  linktr.ee/marcosabortolini', MARGIN, footY);

          // ── Salvar ───────────────────────────────────────────────────────────────
          var now   = new Date();
          var pad   = function (n) { return String(n).padStart(2, '0'); };
          var stamp = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) +
                      '_' + pad(now.getHours()) + pad(now.getMinutes());
          var nomeArquivo = 'geoportal_sjc_mapa_' + stamp + '.pdf';

          doc.save(nomeArquivo);
          if (data.mapaSemRaster) {
            showToastMsg('✓ PDF gerado sem mapa base/raster (restrição do navegador em file://). Veja o aviso no painel.', 6000);
          } else {
            showToastMsg('✓ PDF gerado: ' + nomeArquivo, 4000);
          }
        })
        .catch(function (err) {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);
          console.error('[Exportar PDF] Erro:', err);
          showToastMsg('⚠ Erro ao gerar PDF: ' + (err && err.message ? err.message : 'tente novamente'), 4500);
        });
    }, 50);
  });
}());

// ─── Painéis flutuantes arrastáveis + destaque de feição selecionada ─────────
// Suporta múltiplos painéis abertos simultaneamente — cada um com seu próprio
// destaque visual independente (inclusive vários imóveis CAR focados ao
// mesmo tempo, com a máscara de spotlight acomodando todos).
(function () {

  // ── Estado ────────────────────────────────────────────────────────────────
  var openPanels    = [];        // lista ordenada de registros { el, layer, kind, savedStyle, savedHaloEl }
  var panelsByLayer = new Map(); // layer -> registro (evita abrir 2 painéis para a mesma feição)
  var panelZCounter = 1000;

  // ── Highlight (por feição individual) ────────────────────────────────────
  function undoHighlightForRecord(record) {
    if (!record) return;
    if (record.kind === 'car') {
      if (typeof removeCarFocus === 'function') removeCarFocus(record.layer);
      return;
    }
    try {
      if (record.savedHaloEl) {
        record.savedHaloEl.classList.remove('feature-highlight-halo');
      } else if (record.layer && typeof record.layer.setStyle === 'function' && record.savedStyle) {
        record.layer.setStyle(record.savedStyle);
      }
    } catch (ignore) {}
  }

  // Identifica a qual camada (chave de layerRefs) uma feição individual
  // pertence — usado para fechar o painel anterior só dentro da mesma camada.
  function findLayerGroupKey(layer) {
    if (!layer || !layerRefs) return null;
    for (var key in layerRefs) {
      var grp = layerRefs[key];
      if (grp && typeof grp.hasLayer === 'function' && grp.hasLayer(layer)) {
        // Cada distrito é registrado em layerRefs com uma chave própria
        // (distrito_Sede, distrito_Norte...), pois são camadas separadas —
        // mas devem ser tratados como UM grupo só (fecha o painel de um
        // distrito ao abrir outro, igual às demais camadas).
        if (key.indexOf('distrito_') === 0) return 'distritos';
        return key;
      }
    }
    return null;
  }

  function buildHighlightRecord(layer, groupKey) {
    if (!layer) return null;

    // SJC e Distritos já têm destaque persistente dedicado, aplicado pelo
    // próprio listener de click da camada (showMunicipioStatsPanel /
    // showDistritoStats) — pular aqui evita que o destaque genérico amarelo
    // sobrescreva essa cor própria (azul / laranja) logo depois.
    if (groupKey === 'sjc' || groupKey === 'distritos') {
      return { layer: layer, kind: 'none' };
    }

    // Imóvel do CAR — foco visual dedicado (mantém MapBiomas visível através
    // do imóvel selecionado e apaga os demais imóveis como contexto espacial;
    // suporta múltiplos imóveis focados ao mesmo tempo)
    var carLayer = layerRefs && layerRefs['car'];
    if (carLayer && layer instanceof L.Path && carLayer.hasLayer(layer)) {
      if (typeof applyCarFocus === 'function') applyCarFocus(layer);
      return { layer: layer, kind: 'car' };
    }

    // Ponto com L.Marker (divIcon) — halo via CSS no elemento DOM
    if (layer instanceof L.Marker) {
      var el = layer.getElement();
      var wrap = el ? el.querySelector('.service-icon-wrap') : null;
      if (wrap) {
        wrap.classList.add('feature-highlight-halo');
        return { layer: layer, kind: 'marker', savedHaloEl: wrap };
      }
      return { layer: layer, kind: 'marker' };
    }

    // CircleMarker (ponto sem ícone SVG)
    if (layer instanceof L.CircleMarker) {
      var opts = layer.options;
      var savedCm = { color: opts.color, weight: opts.weight, fillColor: opts.fillColor, fillOpacity: opts.fillOpacity };
      layer.setStyle({ color: '#FFD400', weight: 3 });
      return { layer: layer, kind: 'circle', savedStyle: savedCm };
    }

    // Polígono ou linha (L.Path)
    if (layer instanceof L.Path) {
      var o = layer.options;
      var savedPath = { color: o.color, weight: o.weight, fillColor: o.fillColor, fillOpacity: o.fillOpacity, dashArray: o.dashArray };
      var newWeight = (o.weight || 2) + 2;
      layer.setStyle({ color: '#FFD400', weight: newWeight, dashArray: null });
      if (typeof layer.bringToFront === 'function') layer.bringToFront();
      return { layer: layer, kind: 'path', savedStyle: savedPath };
    }

    return null;
  }

  // Exporta o conteúdo visível de um painel (título + corpo) como imagem PNG,
  // independente da exportação geral em PDF. Usa html2canvas diretamente
  // (mesma técnica robusta usada na captura de painéis para o PDF).
  function exportPanelAsPng(panelEl, titleText) {
    if (typeof html2canvas !== 'function') return;
    var hiddenEls = panelEl.querySelectorAll('button, input');
    var prevDisplay = [];
    hiddenEls.forEach(function (n) { prevDisplay.push(n.style.display); n.style.display = 'none'; });

    html2canvas(panelEl, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false })
      .then(function (canvas) {
        hiddenEls.forEach(function (n, i) { n.style.display = prevDisplay[i]; });
        var safeName = (titleText || 'painel').trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w\-]+/g, '')
          .substring(0, 60) || 'painel';
        var stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        var link = document.createElement('a');
        link.download = 'geoportal_' + safeName + '_' + stamp + '.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(function (e) {
        hiddenEls.forEach(function (n, i) { n.style.display = prevDisplay[i]; });
        console.warn('[Painel] Falha ao exportar PNG:', e);
      });
  }

  // ── Painel individual ────────────────────────────────────────────────────
  function removeSinglePanel(record) {
    if (!record) return;
    if (record.el && record.el.parentNode) record.el.parentNode.removeChild(record.el);
    if (record.layer) panelsByLayer.delete(record.layer);
    var idx = openPanels.indexOf(record);
    if (idx !== -1) openPanels.splice(idx, 1);
    undoHighlightForRecord(record);
  }

  function removeAllPanels() {
    openPanels.slice().forEach(removeSinglePanel);
  }

  function bringPanelToFront(record) {
    if (record && record.el) record.el.style.zIndex = String(++panelZCounter);
  }

  function makeDraggablePanel(titleText, bodyHTML, anchorX, anchorY, highlightRecord) {
    var panel = document.createElement('div');
    panel.className = 'draggable-panel';
    panel.style.zIndex = String(++panelZCounter);

    var header = document.createElement('div');
    header.className = 'draggable-panel-header';

    var titleSpan = document.createElement('span');
    titleSpan.className = 'panel-title-text';
    titleSpan.textContent = titleText;

    var record = highlightRecord || null;

    var exportBtn = document.createElement('button');
    exportBtn.className = 'draggable-panel-export';
    exportBtn.title = 'Exportar este painel como imagem (PNG)';
    exportBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    exportBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      exportPanelAsPng(panel, titleText);
    });

    var closeBtn = document.createElement('button');
    closeBtn.className = 'draggable-panel-close';
    closeBtn.innerHTML = '&#x2715;';
    closeBtn.title = 'Fechar';
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeSinglePanel(record);
    });

    header.appendChild(titleSpan);
    header.appendChild(exportBtn);
    header.appendChild(closeBtn);

    var body = document.createElement('div');
    body.className = 'draggable-panel-body';
    body.innerHTML = bodyHTML;

    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(panel);

    // Posição inicial próxima ao clique, ajustada para não sair da tela
    var pw = panel.offsetWidth  || 260;
    var ph = panel.offsetHeight || 150;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var left = Math.min(Math.max(anchorX + 12, 4), vw - pw - 4);
    var top  = Math.min(Math.max(anchorY - 20,  4), vh - ph - 4);
    panel.style.left = left + 'px';
    panel.style.top  = top  + 'px';

    if (record) {
      record.el = panel;
      openPanels.push(record);
      panelsByLayer.set(record.layer, record);
    }

    // Traz para frente ao interagir
    panel.addEventListener('mousedown', function () { bringPanelToFront(record); }, true);

    // ── Lógica de arraste ────────────────────────────────────────────────────
    var dragging = false;
    var startMouseX, startMouseY, startLeft, startTop;

    function onDragStart(clientX, clientY) {
      dragging    = true;
      startMouseX = clientX;
      startMouseY = clientY;
      startLeft   = panel.offsetLeft;
      startTop    = panel.offsetTop;
      header.style.cursor = 'grabbing';
    }

    function onDragMove(clientX, clientY) {
      if (!dragging) return;
      var newLeft = startLeft + (clientX - startMouseX);
      var newTop  = startTop  + (clientY - startMouseY);
      var maxLeft = window.innerWidth  - panel.offsetWidth  - 4;
      var maxTop  = window.innerHeight - panel.offsetHeight - 4;
      panel.style.left = Math.min(Math.max(newLeft, 4), maxLeft) + 'px';
      panel.style.top  = Math.min(Math.max(newTop,  4), maxTop)  + 'px';
    }

    function onDragEnd() {
      dragging = false;
      header.style.cursor = 'grab';
    }

    // Mouse
    header.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      onDragStart(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function (e) { onDragMove(e.clientX, e.clientY); });
    document.addEventListener('mouseup',   onDragEnd);

    // Touch
    header.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      var t = e.touches[0];
      onDragStart(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      onDragMove(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', onDragEnd);

    // Impede que cliques no painel propaguem para o mapa
    panel.addEventListener('mousedown',  function (e) { e.stopPropagation(); });
    panel.addEventListener('wheel',      function (e) { e.stopPropagation(); });
    panel.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
  }

  // ── Intercepta todo popupopen do Leaflet ─────────────────────────────────
  map.on('popupopen', function (e) {
    var popup   = e.popup;
    var source  = popup._source;  // feição clicada (layer individual)
    var content = popup.getContent();

    // Já existe painel aberto para esta feição — só traz para frente, sem duplicar
    if (panelsByLayer.has(source)) {
      map.closePopup(popup);
      bringPanelToFront(panelsByLayer.get(source));
      return;
    }

    // Apenas um painel por camada/tipo de feição — clicar numa nova feição
    // fecha o painel da feição anterior DA MESMA CAMADA automaticamente.
    // Painéis de camadas diferentes continuam podendo coexistir (ex.: um
    // imóvel CAR aberto junto com um ponto de Educação).
    var groupKey = findLayerGroupKey(source);
    if (groupKey) {
      openPanels.slice().forEach(function (rec) {
        if (rec.groupKey === groupKey) removeSinglePanel(rec);
      });
    }

    // Resolve conteúdo dinâmico (função passada ao bindPopup)
    if (typeof content === 'function') {
      content = content(source);
    }

    // Extrai título (.popup-title) e corpo (restante)
    var tmp = document.createElement('div');
    tmp.innerHTML = typeof content === 'string' ? content : '';
    var titleEl   = tmp.querySelector('.popup-title');
    var titleText = titleEl ? titleEl.textContent.trim() : '';
    if (titleEl) titleEl.parentNode.removeChild(titleEl);
    var bodyHTML = tmp.innerHTML;

    // Posição na tela calculada a partir do ponto geográfico do popup
    var latlng = popup.getLatLng();
    var pt      = latlng
      ? map.latLngToContainerPoint(latlng)
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var mapRect = map.getContainer().getBoundingClientRect();
    var screenX = mapRect.left + pt.x;
    var screenY = mapRect.top  + pt.y;

    // Aplica destaque na feição antes de fechar o popup nativo
    var record = buildHighlightRecord(source, groupKey);
    if (record) record.groupKey = groupKey;

    // Fecha o popup Leaflet nativo e abre o painel flutuante
    map.closePopup(popup);
    makeDraggablePanel(titleText, bodyHTML, screenX, screenY, record);
  });

  // Escape fecha o painel aberto mais recentemente (repetir fecha um a um)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openPanels.length) {
      removeSinglePanel(openPanels[openPanels.length - 1]);
    }
  });

  // Expostos para uso em resetGeoportalToInitialState e ferramenta "Limpar
  // Seleção" — ambos os nomes legados apontam para a limpeza completa, já
  // que os dois sempre eram chamados em conjunto antes do suporte a múltiplos
  // painéis (idempotente: chamar os dois em sequência não causa problema).
  window.clearFeatureHighlight = removeAllPanels;
  window.removeDraggablePanel  = removeAllPanels;

  // ─── Sidebar toggle ──────────────────────────────────────────────────────────
  (function () {
    var sidebar = document.getElementById('sidebar');
    var toggleBtn = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
      var collapsed = sidebar.classList.toggle('collapsed');
      toggleBtn.innerHTML = collapsed ? '&#8250;' : '&#8249;';
      toggleBtn.style.left = collapsed ? '0' : '280px';
      setTimeout(function () { map.invalidateSize(); }, 260);
    });
  })();

  // Exposto para a captura de painéis na exportação de PDF
  window.getOpenAttributePanels = function () {
    return openPanels.map(function (record) {
      var el = record.el;
      if (!el) return null;
      var rect = el.getBoundingClientRect();
      var bounds = (record.layer && typeof record.layer.getBounds === 'function') ? record.layer.getBounds() : null;
      return {
        el: el,
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        titleText: (el.querySelector('.panel-title-text') || {}).textContent || '',
        featureBounds: bounds // usado no PDF para escolher um canto que não cubra a feição
      };
    }).filter(Boolean);
  };
}());
