/* ============================================
   AureumRO Farm Dashboard — app.js
   ============================================ */

'use strict';

// ─── State ────────────────────────────────────
const APP = {
  db: null,
  currentPage: 'monstros',
  pages: {
    monstros: { page: 1, perPage: 24, filtered: [] },
    drops:    { page: 1, perPage: 50, filtered: [] },
    itens:    { page: 1, perPage: 50, filtered: [] },
    mapas:    { page: 1, perPage: 24, filtered: [] },
  }
};

// ─── Utility ──────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function fmt(n, dec = 0) {
  if (n == null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return n;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtChance(v) {
  if (v == null) return '—';
  const pct = parseFloat(v) * 100;
  if (pct < 0.01) return pct.toFixed(4) + '%';
  if (pct < 1)    return pct.toFixed(3) + '%';
  return pct.toFixed(2) + '%';
}

function elementClass(el) {
  if (!el) return '';
  const e = el.toLowerCase();
  if (e.includes('fogo')) return 'el-fogo';
  if (e.includes('água') || e.includes('agua')) return 'el-agua';
  if (e.includes('vento')) return 'el-vento';
  if (e.includes('terra')) return 'el-terra';
  if (e.includes('sagrado')) return 'el-sagrado';
  if (e.includes('sombrio')) return 'el-sombrio';
  if (e.includes('neutro')) return 'el-neutro';
  if (e.includes('veneno')) return 'el-veneno';
  if (e.includes('fantasma')) return 'el-fantasma';
  if (e.includes('maldito')) return 'el-maldito';
  return '';
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function getDropsForMob(mobId) {
  return APP.db.drops.filter(d => d.mob_id === mobId);
}
function getSpawnsForMob(mobId) {
  return APP.db.spawns.filter(s => s.mob_id === mobId);
}

// ─── Load Data ───────────────────────────────
async function loadData() {
  const res = await fetch('db.json');
  APP.db = await res.json();

  // Enrich mobs with drop/spawn count
  const dropCounts = {};
  APP.db.drops.forEach(d => { dropCounts[d.mob_id] = (dropCounts[d.mob_id] || 0) + 1; });
  APP.db.mobs.forEach(mob => { mob._dropCount = dropCounts[mob.id] || 0; });

  $('total-mobs').textContent = APP.db.mobs.length;
  $('total-items').textContent = APP.db.items.length;
  $('total-drops').textContent = APP.db.drops.length;

  populateFilters();
  initAllPages();
  initGlobalSearch();
  initOptimizer();
  initItemFinder();
  initMobCompare();
  initModal();
  initNav();
  initSidebar();
}

// ─── Populate Filter Selects ──────────────────
function populateFilters() {
  const racas = [...new Set(APP.db.mobs.map(m => m.raca).filter(Boolean))].sort();
  const elems = [...new Set(APP.db.mobs.map(m => m.elemento).filter(Boolean))].sort();
  const itemTypes = [...new Set(APP.db.items.map(i => i.tipo).filter(Boolean))].sort();

  const mobRaca = $('mob-raca');
  racas.forEach(r => { const o = new Option(r, r); mobRaca.add(o); });

  const mobElem = $('mob-elemento');
  elems.forEach(e => { const o = new Option(e, e); mobElem.add(o); });

  const optRaca = $('opt-raca');
  racas.forEach(r => { const o = new Option(r, r); optRaca.add(o); });

  const itemTipo = $('item-tipo');
  itemTypes.forEach(t => { const o = new Option(t, t); itemTipo.add(o); });
}

// ─── Navigation ───────────────────────────────
function initNav() {
  $$('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const page = el.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  APP.currentPage = page;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $$('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));

  const titles = {
    monstros: ['Monstros', `${APP.db.mobs.length} monstros no banco de dados`],
    drops: ['Drops', `${APP.db.drops.length} registros de drops`],
    itens: ['Itens', `${APP.db.items.length} itens no banco de dados`],
    mapas: ['Mapas', `${APP.db.maps.length} mapas disponíveis`],
    'farm-optimizer': ['Otimizador de Farm', 'Encontre os melhores mobs para seu personagem'],
    'item-finder': ['Onde Farmar Item', 'Descubra onde dropar qualquer item'],
    'mob-compare': ['Comparar Monstros', 'Compare mobs lado a lado'],
  };
  const [title, sub] = titles[page] || [page, ''];
  $('pageTitle').textContent = title;
  $('pageSubtitle').textContent = sub;

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    $('sidebar').classList.remove('mobile-open');
  }
}

// ─── Sidebar Toggle ───────────────────────────
function initSidebar() {
  $('sidebarToggle').addEventListener('click', () => {
    const sb = $('sidebar');
    if (window.innerWidth <= 900) {
      sb.classList.toggle('mobile-open');
    } else {
      sb.classList.toggle('collapsed');
      $('mainContent').classList.toggle('expanded');
    }
  });
}

// ─── Global Search ────────────────────────────
function initGlobalSearch() {
  $('globalSearch').addEventListener('input', debounce(e => {
    const q = e.target.value.trim();
    if (!q) return;
    // Auto-redirect to mobs page with search
    if (APP.currentPage !== 'monstros') navigateTo('monstros');
    $('mob-search').value = q;
    filterAndRenderMobs();
  }, 300));
}

// ═══════════════════════════════════════════════
// PAGE: MONSTROS
// ═══════════════════════════════════════════════
function initAllPages() {
  initMobsPage();
  initDropsPage();
  initItensPage();
  initMapasPage();
}

function initMobsPage() {
  const onChange = debounce(filterAndRenderMobs, 200);
  $('mob-search').addEventListener('input', onChange);
  $('mob-raca').addEventListener('change', onChange);
  $('mob-elemento').addEventListener('change', onChange);
  $('mob-tamanho').addEventListener('change', onChange);
  $('mob-mvp-only').addEventListener('change', onChange);
  $('mob-sort').addEventListener('change', onChange);
  filterAndRenderMobs();
}

function filterAndRenderMobs() {
  const q    = $('mob-search').value.toLowerCase();
  const raca = $('mob-raca').value;
  const elem = $('mob-elemento').value;
  const tam  = $('mob-tamanho').value;
  const mvp  = $('mob-mvp-only').checked;
  const sort = $('mob-sort').value;

  let list = APP.db.mobs.filter(m => {
    if (q && !m.nome?.toLowerCase().includes(q)) return false;
    if (raca && m.raca !== raca) return false;
    if (elem && m.elemento !== elem) return false;
    if (tam && m.tamanho !== tam) return false;
    if (mvp && !m.mvp) return false;
    return true;
  });

  // Sort
  const maxExp = Math.max(...APP.db.mobs.map(m => m.exp_base || 0));
  list.sort((a, b) => {
    switch(sort) {
      case 'nivel':      return (a.nivel || 0) - (b.nivel || 0);
      case 'nivel-desc': return (b.nivel || 0) - (a.nivel || 0);
      case 'hp':         return (a.hp || 0) - (b.hp || 0);
      case 'hp-desc':    return (b.hp || 0) - (a.hp || 0);
      case 'exp':        return (a.exp_base || 0) - (b.exp_base || 0);
      case 'exp-desc':   return (b.exp_base || 0) - (a.exp_base || 0);
      default:           return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    }
  });

  APP.pages.monstros.filtered = list;
  APP.pages.monstros.page = 1;
  APP.pages.monstros._maxExp = maxExp;
  $('mob-count').textContent = `${list.length} resultado${list.length !== 1 ? 's' : ''}`;
  renderMobGrid();
}

function renderMobGrid() {
  const state = APP.pages.monstros;
  const { page, perPage, filtered, _maxExp } = state;
  const start = (page - 1) * perPage;
  const slice = filtered.slice(start, start + perPage);
  const maxExp = _maxExp || 1;

  const grid = $('mobGrid');
  if (!slice.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🔎</div><p>Nenhum monstro encontrado com esses filtros.</p></div>';
    $('mobPagination').innerHTML = '';
    return;
  }

  grid.innerHTML = slice.map(mob => {
    const elClass = elementClass(mob.elemento);
    const expPct = Math.round(((mob.exp_base || 0) / maxExp) * 100);
    const clsPct = Math.round(((mob.exp_classe || 0) / maxExp) * 100);
    return `
    <div class="mob-card" data-id="${mob.id}" role="button" tabindex="0" aria-label="Ver detalhes de ${mob.nome}">
      <div class="mob-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div style="flex:1">
          <div class="mob-name">${mob.nome || '?'}</div>
          <div class="mob-id">#${mob.id} · Nv. ${mob.nivel ?? '?'}</div>
          <div class="mob-badges" style="margin-top:6px">
            ${mob.mvp ? '<span class="badge badge-mvp">⭐ MVP</span>' : ''}
            <span class="badge badge-element ${elClass}">${mob.elemento || '?'}</span>
            <span class="badge badge-race">${mob.raca || '?'}</span>
            <span class="badge badge-size">${mob.tamanho || '?'}</span>
          </div>
        </div>
        <div class="mob-sprite-container" style="width:50px; height:50px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); border:1px solid var(--border); overflow:hidden; flex-shrink:0; padding:2px;">
          <img src="https://static.divine-pride.net/images/mobs/png/${mob.id}.png" referrerpolicy="no-referrer" alt="${mob.nome}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='https://placehold.co/50x50/1e2330/d4a843?text=Mob'; this.onerror=null;">
        </div>
      </div>
      <div class="mob-stats-grid">
        <div class="mob-stat"><div class="mob-stat-label">HP</div><div class="mob-stat-value">${fmt(mob.hp)}</div></div>
        <div class="mob-stat"><div class="mob-stat-label">DEF</div><div class="mob-stat-value">${mob.def ?? '—'}</div></div>
        <div class="mob-stat"><div class="mob-stat-label">MDEF</div><div class="mob-stat-value">${mob.mdef ?? '—'}</div></div>
      </div>
      <div class="mob-exp-bar">
        <div class="exp-bar-row">
          <span class="exp-bar-label">Base</span>
          <div class="exp-bar-track"><div class="exp-bar-fill" style="width:${expPct}%"></div></div>
          <span class="exp-bar-value">${fmt(mob.exp_base)}</span>
        </div>
        <div class="exp-bar-row">
          <span class="exp-bar-label">Cl.</span>
          <div class="exp-bar-track"><div class="exp-bar-fill" style="width:${clsPct}%"></div></div>
          <span class="exp-bar-value">${fmt(mob.exp_classe)}</span>
        </div>
      </div>
      <div class="mob-card-footer">
        <div class="mob-drops-count">💎 <span>${mob._dropCount}</span> drops</div>
        <div class="mob-maps-count">🗺 <span>${mob.num_mapas ?? '?'}</span> mapas</div>
      </div>
    </div>`;
  }).join('');

  // Click to open modal
  grid.querySelectorAll('.mob-card').forEach(card => {
    const open = () => openMobModal(parseInt(card.dataset.id));
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });

  renderPagination('mobPagination', state, renderMobGrid);
}

// ═══════════════════════════════════════════════
// PAGE: DROPS
// ═══════════════════════════════════════════════
function initDropsPage() {
  const onChange = debounce(filterAndRenderDrops, 200);
  $('drop-search').addEventListener('input', onChange);
  $('drop-tipo').addEventListener('change', onChange);
  $('drop-sort').addEventListener('change', onChange);
  filterAndRenderDrops();
}

function filterAndRenderDrops() {
  const q    = $('drop-search').value.toLowerCase();
  const tipo = $('drop-tipo').value;
  const sort = $('drop-sort').value;

  let list = APP.db.drops.filter(d => {
    if (q && !d.item?.toLowerCase().includes(q) && !d.monstro?.toLowerCase().includes(q)) return false;
    if (tipo && d.tipo !== tipo) return false;
    return true;
  });

  list.sort((a, b) => {
    switch(sort) {
      case 'chance':      return (a.chance || 0) - (b.chance || 0);
      case 'chance-desc': return (b.chance || 0) - (a.chance || 0);
      case 'item':        return (a.item || '').localeCompare(b.item || '', 'pt-BR');
      case 'mob':         return (a.monstro || '').localeCompare(b.monstro || '', 'pt-BR');
      default:            return (b.chance || 0) - (a.chance || 0);
    }
  });

  APP.pages.drops.filtered = list;
  APP.pages.drops.page = 1;
  $('drop-count').textContent = `${list.length} resultado${list.length !== 1 ? 's' : ''}`;
  renderDropsTable();
}

function renderDropsTable() {
  const state = APP.pages.drops;
  const { page, perPage, filtered } = state;
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  const tbody = $('dropsBody');
  if (!slice.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum drop encontrado.</td></tr>';
    $('dropsPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = slice.map(d => {
    const pct = parseFloat(d.chance) * 100;
    const barW = Math.min(100, pct * 5);
    const isMvp = d.tipo === 'MVP Drop';
    return `<tr>
      <td class="cell-name"><span class="clickable-link" data-mob-id="${d.mob_id}">${d.monstro || '—'}</span></td>
      <td class="cell-name"><span class="clickable-link" data-item-id="${d.item_id}">${d.item || '—'}</span></td>
      <td>
        <div class="chance-bar-wrap">
          <div class="chance-bar-track"><div class="chance-bar-fill" style="width:${barW}%"></div></div>
          <span class="chance-text cell-gold">${fmtChance(d.chance)}</span>
        </div>
      </td>
      <td>${isMvp ? '<span class="badge badge-mvp">MVP</span>' : '<span class="cell-muted">Drop</span>'}</td>
      <td><button class="btn-sm" data-mob="${d.mob_id}">Ver mob</button></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.clickable-link[data-mob-id]').forEach(el => {
    el.addEventListener('click', () => openMobModal(parseInt(el.dataset.mobId)));
  });

  tbody.querySelectorAll('.clickable-link[data-item-id]').forEach(el => {
    el.addEventListener('click', () => openItemModal(parseInt(el.dataset.itemId)));
  });

  tbody.querySelectorAll('.btn-sm[data-mob]').forEach(btn => {
    btn.addEventListener('click', () => openMobModal(parseInt(btn.dataset.mob)));
  });

  renderPagination('dropsPagination', state, renderDropsTable);
}

// ═══════════════════════════════════════════════
// PAGE: ITENS
// ═══════════════════════════════════════════════
function initItensPage() {
  const onChange = debounce(filterAndRenderItens, 200);
  $('item-search').addEventListener('input', onChange);
  $('item-tipo').addEventListener('change', onChange);
  $('item-sort').addEventListener('change', onChange);
  filterAndRenderItens();
}

function filterAndRenderItens() {
  const q    = $('item-search').value.toLowerCase();
  const tipo = $('item-tipo').value;
  const sort = $('item-sort').value;

  let list = APP.db.items.filter(i => {
    if (q && !i.nome?.toLowerCase().includes(q)) return false;
    if (tipo && i.tipo !== tipo) return false;
    return true;
  });

  list.sort((a, b) => {
    switch(sort) {
      case 'preco-desc': return (b.preco_venda || 0) - (a.preco_venda || 0);
      case 'preco':      return (a.preco_venda || 0) - (b.preco_venda || 0);
      case 'peso-desc':  return (b.peso || 0) - (a.peso || 0);
      default:           return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    }
  });

  APP.pages.itens.filtered = list;
  APP.pages.itens.page = 1;
  $('item-count').textContent = `${list.length} resultado${list.length !== 1 ? 's' : ''}`;
  renderItensTable();
}

function renderItensTable() {
  const state = APP.pages.itens;
  const { page, perPage, filtered } = state;
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  const tbody = $('itensBody');
  if (!slice.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum item encontrado.</td></tr>';
    $('itensPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = slice.map(it => `<tr class="clickable-row" data-id="${it.id}">
    <td class="cell-muted">${it.id}</td>
    <td class="cell-name">
      <div style="display:flex;align-items:center;gap:8px;">
        <img src="https://static.divine-pride.net/images/items/item/${it.id}.png" referrerpolicy="no-referrer" alt="" style="width:24px;height:24px;object-fit:contain;flex-shrink:0;" onerror="this.src='https://placehold.co/24x24/1e2330/d4a843?text=Item'; this.onerror=null;">
        <span>${it.nome || '—'}</span>
      </div>
    </td>
    <td>${it.tipo || '—'}</td>
    <td class="cell-muted">${it.peso ?? '—'}</td>
    <td class="cell-gold">${it.preco_venda != null ? fmt(it.preco_venda) + ' z' : '—'}</td>
    <td class="cell-muted">${it.preco_compra != null ? fmt(it.preco_compra) + ' z' : '—'}</td>
    <td class="cell-muted">${it.slots ?? '—'}</td>
    <td class="cell-muted">${it.dropado_por ?? '—'}</td>
  </tr>`).join('');

  tbody.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => openItemModal(parseInt(row.dataset.id)));
  });

  renderPagination('itensPagination', state, renderItensTable);
}

// ═══════════════════════════════════════════════
// PAGE: MAPAS
// ═══════════════════════════════════════════════
function initMapasPage() {
  const onChange = debounce(filterAndRenderMapas, 200);
  $('map-search').addEventListener('input', onChange);
  $('map-sort').addEventListener('change', onChange);
  filterAndRenderMapas();
}

function filterAndRenderMapas() {
  const q    = $('map-search').value.toLowerCase();
  const sort = $('map-sort').value;

  let list = APP.db.maps.filter(m => {
    if (q && !m.nome?.toLowerCase().includes(q) && !m.id?.toLowerCase().includes(q)) return false;
    return true;
  });

  list.sort((a, b) => {
    switch(sort) {
      case 'total-desc':   return (b.total_mobs || 0) - (a.total_mobs || 0);
      case 'especies-desc': return (b.especies || 0) - (a.especies || 0);
      default:             return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    }
  });

  APP.pages.mapas.filtered = list;
  APP.pages.mapas.page = 1;
  $('map-count').textContent = `${list.length} resultado${list.length !== 1 ? 's' : ''}`;
  renderMapGrid();
}

function renderMapGrid() {
  const state = APP.pages.mapas;
  const { page, perPage, filtered } = state;
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  const grid = $('mapGrid');
  if (!slice.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🗺</div><p>Nenhum mapa encontrado.</p></div>';
    $('mapPagination').innerHTML = '';
    return;
  }

  grid.innerHTML = slice.map(map => {
    // Parse mobs preview
    const mobsParts = (map.monstros_desc || '').split('|').slice(0, 6)
      .map(s => s.trim()).filter(Boolean);
    const tagsHtml = mobsParts.map(p => `<span class="mob-tag">${p}</span>`).join('');

    return `<div class="map-card clickable-row" data-map-id="${map.id}">
      <div class="map-name">${map.nome || '—'}</div>
      <div class="map-id">${map.id}</div>
      <div class="map-stats">
        <div class="map-stat">
          <div class="map-stat-label">Espécies</div>
          <div class="map-stat-value">${map.especies ?? '—'}</div>
        </div>
        <div class="map-stat">
          <div class="map-stat-label">Total Mobs</div>
          <div class="map-stat-value">${fmt(map.total_mobs)}</div>
        </div>
      </div>
      ${tagsHtml ? `<div class="map-mobs-preview">${tagsHtml}</div>` : ''}
    </div>`;
  }).join('');

  grid.querySelectorAll('.map-card.clickable-row').forEach(el => {
    el.addEventListener('click', () => openMapModal(el.dataset.mapId));
  });

  renderPagination('mapPagination', state, renderMapGrid);
}

// ─── Pagination ───────────────────────────────
function renderPagination(containerId, state, renderFn) {
  const total = Math.ceil(state.filtered.length / state.perPage);
  const container = $(containerId);
  if (total <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" ${state.page === 1 ? 'disabled' : ''} data-p="${state.page - 1}">‹</button>`;

  const range = getPaginationRange(state.page, total);
  range.forEach(p => {
    if (p === '...') {
      html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
    } else {
      html += `<button class="page-btn ${p === state.page ? 'active' : ''}" data-p="${p}">${p}</button>`;
    }
  });

  html += `<button class="page-btn" ${state.page === total ? 'disabled' : ''} data-p="${state.page + 1}">›</button>`;
  container.innerHTML = html;

  container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = parseInt(btn.dataset.p);
      renderFn();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', current-1, current, current+1, '...', total];
}

// ═══════════════════════════════════════════════
// TOOL: FARM OPTIMIZER
// ═══════════════════════════════════════════════
function initOptimizer() {
  // Populate raca select
  const racas = [...new Set(APP.db.mobs.map(m => m.raca).filter(Boolean))].sort();
  const optRaca = $('opt-raca');
  racas.forEach(r => { if (!optRaca.querySelector(`[value="${r}"]`)) { const o = new Option(r, r); optRaca.add(o); } });

  $('btn-optimize').addEventListener('click', runOptimizer);
}

// ─── Level Penalty (RO rule: no EXP if char is 20+ levels above mob) ──────
// Returns 0 or 1: if the character is 20+ levels above the mob → 0 EXP.
// Mob same level or above the character → always 100% EXP.
function calcLevelPenalty(charLevel, mobLevel) {
  if (!charLevel || isNaN(charLevel)) return 1;
  return (charLevel - mobLevel >= 20) ? 0 : 1;
}

// Returns a badge object { label, cls } for the level status indicator
function getLevelBadge(charLevel, mobLevel) {
  if (!charLevel || isNaN(charLevel)) return null;
  const diff = charLevel - mobLevel;
  if (diff < 20) return { label: '✔ Nível Ideal', cls: 'lvl-ok' };
  return { label: '✖ 20+ nv acima do mob (0% EXP)', cls: 'lvl-bad' };
}

function runOptimizer() {
  const elem      = $('opt-elemento').value;
  const raca      = $('opt-raca').value;
  const tam       = $('opt-tamanho').value;
  const obj       = $('opt-objetivo').value;
  const charLevel = parseInt($('opt-nivel').value) || null;

  // Elemento -> fraqueza (o elemento do jogador deve ser o ponto fraco do mob)
  const contraElem = {
    'Água':    ['Fogo'],
    'Vento':   ['Água'],
    'Fogo':    ['Terra'],
    'Terra':   ['Vento'],
    'Sagrado': ['Sombrio','Morto-Vivo','Maldito'],
    'Sombrio': ['Sagrado'],
    'Neutro':  [],
  };

  let list = APP.db.mobs.filter(m => {
    if (raca && m.raca !== raca) return false;
    if (tam && m.tamanho !== tam) return false;
    return true;
  });

  // Prefer element weakness
  if (elem && contraElem[elem]) {
    const alvo = contraElem[elem];
    list.sort((a, b) => {
      const aWeak = alvo.some(el => a.elemento?.toLowerCase().includes(el.toLowerCase()));
      const bWeak = alvo.some(el => b.elemento?.toLowerCase().includes(el.toLowerCase()));
      if (aWeak && !bWeak) return -1;
      if (!aWeak && bWeak) return 1;
      return 0;
    });
  }

  // Helper: effective score considering level penalty
  function effectiveScore(mob) {
    const penalty = calcLevelPenalty(charLevel, mob.nivel || 1);
    switch (obj) {
      case 'exp_base':   return (mob.exp_base   || 0) * penalty;
      case 'exp_classe': return (mob.exp_classe || 0) * penalty;
      case 'drops':      return  mob._dropCount  || 0; // drops não têm penalidade de EXP
      case 'hp':         return -(mob.hp         || 999999); // menor HP = melhor
      default:           return (mob.exp_base   || 0) * penalty;
    }
  }

  // Secondary sort by effective objective (with level penalty applied)
  list.sort((a, b) => effectiveScore(b) - effectiveScore(a));

  const top = list.slice(0, 15);
  const results = $('optimizer-results');

  const objLabels = {
    exp_base: 'EXP Base Efetiva',
    exp_classe: 'EXP Classe Efetiva',
    drops: 'Drops',
    hp: 'HP',
  };

  // Show level range hint if character level is set
  let headerHtml = '';
  if (charLevel) {
    const minLvl = Math.max(1, charLevel - 19);
    const maxLvl = charLevel + 19;
    const idealMin = Math.max(1, charLevel - 10);
    const idealMax = charLevel + 10;
    headerHtml = `<div class="level-range-hint">
      <span class="lvl-hint-icon">⚔️</span>
      <div>
        <strong>Faixa de nível recomendada: ${minLvl}–${maxLvl}</strong>
        <span class="lvl-hint-sub"> · Faixa ideal (100% EXP): <strong>${idealMin}–${idealMax}</strong></span>
      </div>
    </div>`;
  }

  const cardsHtml = top.map((mob, i) => {
    const penalty   = calcLevelPenalty(charLevel, mob.nivel || 1);
    const badge     = getLevelBadge(charLevel, mob.nivel || 1);

    let val;
    if (obj === 'hp') {
      val = fmt(mob.hp);
    } else if (obj === 'drops') {
      val = mob._dropCount + ' drops';
    } else {
      const raw      = mob[obj] || 0;
      const effective = Math.round(raw * penalty);
      val = charLevel
        ? `${fmt(effective)} <span class="exp-raw">(base: ${fmt(raw)})</span>`
        : fmt(raw);
    }

    const rankClass = i === 0 ? '' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
    const grayedOut = penalty === 0 ? ' result-card--gray' : '';

    return `<div class="result-card${grayedOut}" data-id="${mob.id}">
      <div class="result-rank ${rankClass}">${rankLabel}</div>
      <div class="result-info">
        <div class="result-name">${mob.nome}</div>
        <div class="result-meta">Nv.${mob.nivel} · ${mob.elemento} · ${mob.raca} · ${mob.tamanho} · HP ${fmt(mob.hp)}</div>
        ${badge ? `<span class="lvl-badge ${badge.cls}">${badge.label}</span>` : ''}
      </div>
      <div>
        <div class="result-value">${val}</div>
        <div class="result-value-label">${objLabels[obj]}</div>
      </div>
    </div>`;
  }).join('');

  results.innerHTML = headerHtml + cardsHtml;

  if (!top.length) {
    results.innerHTML = '<div class="empty-state"><div class="icon">😶</div><p>Nenhum mob encontrado com esses critérios.</p></div>';
    return;
  }

  results.querySelectorAll('.result-card').forEach(card => {
    card.addEventListener('click', () => openMobModal(parseInt(card.dataset.id)));
  });
}

// ═══════════════════════════════════════════════
// TOOL: ITEM FINDER
// ═══════════════════════════════════════════════
function initItemFinder() {
  const input = $('finder-item-search');
  const sugg  = $('finderSuggestions');

  // Build item name list from drops
  const itemNames = [...new Set(APP.db.drops.map(d => d.item).filter(Boolean))].sort();

  input.addEventListener('input', debounce(() => {
    const q = input.value.toLowerCase().trim();
    if (q.length < 2) { sugg.classList.remove('open'); return; }
    const matches = itemNames.filter(n => n.toLowerCase().includes(q)).slice(0, 12);
    if (!matches.length) { sugg.classList.remove('open'); return; }

    sugg.innerHTML = matches.map(n => `<div class="suggestion-item">${n}</div>`).join('');
    sugg.classList.add('open');
    sugg.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        input.value = el.textContent;
        sugg.classList.remove('open');
        showItemSources(el.textContent);
      });
    });
  }, 200));

  document.addEventListener('click', e => {
    if (!sugg.contains(e.target) && e.target !== input) sugg.classList.remove('open');
  });
}

function showItemSources(itemName) {
  const drops = APP.db.drops.filter(d => d.item === itemName);
  const results = $('finder-results');

  if (!drops.length) {
    results.innerHTML = '<div class="empty-state"><div class="icon">😶</div><p>Nenhuma fonte encontrada para este item.</p></div>';
    return;
  }

  // Get item info
  const itemInfo = APP.db.items.find(i => i.nome === itemName);

  // Group by mob and get best chance
  const byMob = {};
  drops.forEach(d => {
    if (!byMob[d.mob_id] || byMob[d.mob_id].chance < d.chance) byMob[d.mob_id] = d;
  });
  const sources = Object.values(byMob).sort((a, b) => (b.chance || 0) - (a.chance || 0));

  let html = `<div class="finder-item-header ${itemInfo ? 'clickable-row' : ''}" ${itemInfo ? `data-item-id="${itemInfo.id}"` : ''} style="${itemInfo ? 'transition: border var(--transition); border-color: var(--border-hover); cursor: pointer;' : ''}">
    <div class="finder-item-title">${itemName} ${itemInfo ? '🔍' : ''}</div>
    <div class="finder-item-meta">
      ${itemInfo ? `Tipo: ${itemInfo.tipo || '—'} · Peso: ${itemInfo.peso ?? '—'} · Venda: ${itemInfo.preco_venda != null ? fmt(itemInfo.preco_venda) + ' z' : '—'}` : 'Item encontrado nos drops'}
      · <strong style="color:var(--gold)">${sources.length} fonte${sources.length !== 1 ? 's'  : ''}</strong>
      ${itemInfo ? '<br><span style="font-size:11px;color:var(--gold);margin-top:4px;display:inline-block">⚡ Clique para ver detalhes e atributos completos</span>' : ''}
    </div>
  </div>`;

  html += sources.map(d => {
    const spawns = getSpawnsForMob(d.mob_id);
    const mob = APP.db.mobs.find(m => m.id === d.mob_id);
    const mapList = spawns.slice(0, 3).map(s => `${s.mapa_nome} (${s.qtd}x)`).join(', ');

    return `<div class="finder-source-card" data-id="${d.mob_id}">
      <div>
        <div class="finder-source-mob">${d.monstro}</div>
        <div class="finder-source-meta">
          ${mob ? `Nv.${mob.nivel} · ${mob.elemento} · ${mob.raca}` : ''}
          ${mapList ? `<br>📍 ${mapList}` : ''}
        </div>
      </div>
      <div class="finder-chance">
        <div class="finder-chance-value">${fmtChance(d.chance)}</div>
        <div class="finder-chance-label">Chance de Drop</div>
        <div class="finder-chance-label" style="margin-top:2px">${d.tipo}</div>
      </div>
    </div>`;
  }).join('');

  results.innerHTML = html;

  const headerEl = results.querySelector('.finder-item-header.clickable-row');
  if (headerEl) {
    headerEl.addEventListener('click', () => {
      openItemModal(parseInt(headerEl.dataset.itemId));
    });
  }

  results.querySelectorAll('.finder-source-card').forEach(card => {
    card.addEventListener('click', () => openMobModal(parseInt(card.dataset.id)));
  });
}

// ═══════════════════════════════════════════════
// TOOL: MOB COMPARE
// ═══════════════════════════════════════════════
const compareSelected = [null, null, null];

function initMobCompare() {
  [0, 1, 2].forEach(idx => {
    const input = $(`compare-search-${idx}`);
    const sugg  = $(`compare-suggest-${idx}`);

    input.addEventListener('input', debounce(() => {
      const q = input.value.toLowerCase().trim();
      if (q.length < 2) { sugg.classList.remove('open'); return; }
      const matches = APP.db.mobs.filter(m => m.nome?.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { sugg.classList.remove('open'); return; }

      sugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome} (Nv.${m.nivel})</div>`).join('');
      sugg.classList.add('open');
      sugg.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
          const mob = APP.db.mobs.find(m => m.id === parseInt(el.dataset.id));
          compareSelected[idx] = mob;
          input.value = mob.nome;
          sugg.classList.remove('open');
          renderCompare();
        });
      });
    }, 200));

    document.addEventListener('click', e => {
      if (!sugg.contains(e.target) && e.target !== input) sugg.classList.remove('open');
    });
  });
}

function renderCompare() {
  const selected = compareSelected.filter(Boolean);
  if (!selected.length) return;

  const statKeys = [
    { key: 'nivel', label: 'Nível', higherBetter: true },
    { key: 'hp', label: 'HP', higherBetter: false },
    { key: 'def', label: 'DEF', higherBetter: false },
    { key: 'mdef', label: 'MDEF', higherBetter: false },
    { key: 'agi', label: 'AGI', higherBetter: false },
    { key: 'int', label: 'INT', higherBetter: false },
    { key: 'exp_base', label: 'EXP Base', higherBetter: true },
    { key: 'exp_classe', label: 'EXP Classe', higherBetter: true },
    { key: '_dropCount', label: 'Qtd Drops', higherBetter: true },
  ];

  const container = $('compare-results');
  container.innerHTML = compareSelected.map((mob, idx) => {
    if (!mob) return '<div></div>';
    return `<div class="compare-mob-card">
      <div class="compare-mob-name">${mob.nome}</div>
      <div class="compare-stat-row"><span class="compare-stat-key">Elemento</span><span class="compare-stat-val ${elementClass(mob.elemento)}">${mob.elemento || '—'}</span></div>
      <div class="compare-stat-row"><span class="compare-stat-key">Raça</span><span class="compare-stat-val">${mob.raca || '—'}</span></div>
      <div class="compare-stat-row"><span class="compare-stat-key">Tamanho</span><span class="compare-stat-val">${mob.tamanho || '—'}</span></div>
      ${statKeys.map(sk => {
        const val = mob[sk.key] ?? null;
        const vals = compareSelected.filter(Boolean).map(m => parseFloat(m[sk.key]) || 0);
        const best = Math.max(...vals);
        const worst = Math.min(...vals);
        const numVal = parseFloat(val) || 0;
        const isBest  = sk.higherBetter ? numVal === best  : numVal === worst;
        const isWorst = sk.higherBetter ? numVal === worst : numVal === best;
        const cls = isBest && vals.length > 1 ? 'best' : isWorst && vals.length > 1 ? 'worst' : '';
        return `<div class="compare-stat-row">
          <span class="compare-stat-key">${sk.label}</span>
          <span class="compare-stat-val ${cls}">${fmt(val)}</span>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// MOB DETAIL MODAL
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// MOB & ITEM DETAIL MODAL
// ═══════════════════════════════════════════════
const modalHistory = [];

function updateModalBackVisibility() {
  const btn = $('modalBack');
  if (btn) {
    btn.style.display = modalHistory.length > 0 ? 'flex' : 'none';
  }
}

function goBackModal() {
  if (modalHistory.length === 0) return;
  const previous = modalHistory.pop();
  if (previous.type === 'mob') {
    openMobModal(previous.id, true);
  } else if (previous.type === 'item') {
    openItemModal(previous.id, true);
  } else if (previous.type === 'map') {
    openMapModal(previous.id, true);
  }
}

function initModal() {
  $('modalClose').addEventListener('click', closeModal);
  const backBtn = $('modalBack');
  if (backBtn) {
    backBtn.addEventListener('click', goBackModal);
  }
  $('modalOverlay').addEventListener('click', e => {
    if (e.target === $('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function openMobModal(mobId, isBackAction = false) {
  const mob = APP.db.mobs.find(m => m.id === mobId);
  if (!mob) return;

  if (!isBackAction && $('modalOverlay').classList.contains('open')) {
    if (APP.currentModal) {
      modalHistory.push(APP.currentModal);
    }
  }
  if (!isBackAction && !$('modalOverlay').classList.contains('open')) {
    modalHistory.length = 0;
  }
  APP.currentModal = { type: 'mob', id: mobId };
  updateModalBackVisibility();

  const drops  = getDropsForMob(mobId);
  const spawns = getSpawnsForMob(mobId);

  const elClass = elementClass(mob.elemento);

  const reqHit = (mob.nivel || 0) + (mob.agi || 0) + 20;
  const reqFlee = (mob.nivel || 0) + (mob.des || 0) + 75;

  const statsData = [
    { label: 'Nível', value: mob.nivel },
    { label: 'HP', value: fmt(mob.hp) },
    { label: '100% Hit', value: reqHit, highlight: true },
    { label: '95% Flee', value: reqFlee, highlight: true },
    { label: 'ATQ', value: mob.atq },
    { label: 'DEF', value: mob.def },
    { label: 'MDEF', value: mob.mdef },
    { label: 'FOR', value: mob.for_ },
    { label: 'AGI', value: mob.agi },
    { label: 'VIT', value: mob.vit },
    { label: 'INT', value: mob.int },
    { label: 'DES', value: mob.des },
    { label: 'SOR', value: mob.sor },
    { label: 'Alcance', value: mob.alcance },
  ];

  $('modalContent').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:20px;">
      <div style="flex:1">
        <div class="modal-mob-title" style="margin:0">${mob.nome}</div>
        <div class="modal-mob-id" style="margin:4px 0 8px 0">#${mob.id}${mob.mvp ? ' · <span class="badge badge-mvp">⭐ MVP</span>' : ''}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge badge-element ${elClass}">${mob.elemento || '?'}</span>
          <span class="badge badge-race">${mob.raca || '?'}</span>
          <span class="badge badge-size">${mob.tamanho || '?'}</span>
        </div>
      </div>
      <div style="width:80px; height:80px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; padding:8px; flex-shrink:0;">
        <img src="https://static.divine-pride.net/images/mobs/png/${mob.id}.png" referrerpolicy="no-referrer" alt="${mob.nome}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='https://placehold.co/80x80/1e2330/d4a843?text=Mob'; this.onerror=null;">
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Atributos</div>
      <div class="modal-stats-grid">
        ${statsData.map(s => `
          <div class="modal-stat-box" ${s.highlight ? 'style="border-color:var(--gold-dark);background:rgba(212,168,67,0.05)"' : ''}>
            <div class="label" ${s.highlight ? 'style="color:var(--gold-light)"' : ''}>${s.label}</div>
            <div class="value" ${s.highlight ? 'style="color:var(--gold)"' : ''}>${s.value ?? '—'}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Experiência</div>
      <div class="modal-stats-grid">
        <div class="modal-stat-box"><div class="label">EXP Base</div><div class="value" style="color:var(--gold)">${fmt(mob.exp_base)}</div></div>
        <div class="modal-stat-box"><div class="label">EXP Classe</div><div class="value" style="color:var(--gold)">${fmt(mob.exp_classe)}</div></div>
        ${mob.mvp ? `<div class="modal-stat-box"><div class="label">EXP MVP</div><div class="value" style="color:var(--gold-light)">${fmt(mob.exp_mvp)}</div></div>` : ''}
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Drops (${drops.length})</div>
      ${drops.length ? `
      <table class="modal-drops-table">
        ${drops.sort((a,b) => (b.chance||0) - (a.chance||0)).map(d => `
        <tr>
          <td style="width:28px;padding-right:0;">
            <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:4px;overflow:hidden;">
              <img src="https://static.divine-pride.net/images/items/item/${d.item_id}.png" referrerpolicy="no-referrer" alt="" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.src='https://placehold.co/24x24/1e2330/d4a843?text=Item'; this.onerror=null;">
            </div>
          </td>
          <td><span class="clickable-link" data-item-id="${d.item_id}">${d.item}</span></td>
          <td style="color:var(--text-muted);font-size:11px">${d.tipo || ''}</td>
          <td>${fmtChance(d.chance)}</td>
        </tr>`).join('')}
      </table>` : '<p style="color:var(--text-muted);font-size:13px">Sem drops registrados.</p>'}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Onde Encontrar (${spawns.length} locais)</div>
      <div class="modal-spawns-list">
        ${spawns.map(s => `
        <div class="modal-spawn-item clickable-row" data-map-id="${s.mapa_id}">
          <div>
            <div class="spawn-map-name clickable-link">${s.mapa_nome}</div>
            <div class="spawn-meta">${s.mapa_id} · Respawn: ${s.respawn}</div>
          </div>
          <div class="spawn-qty">${s.qtd}x</div>
        </div>`).join('')}
        ${!spawns.length ? '<p style="color:var(--text-muted);font-size:13px">Sem locais registrados.</p>' : ''}
      </div>
    </div>
  `;

  // Bind item link clicks in mob modal
  $('modalContent').querySelectorAll('.clickable-link[data-item-id]').forEach(el => {
    el.addEventListener('click', () => openItemModal(parseInt(el.dataset.itemId)));
  });

  // Bind map clicks in mob modal
  $('modalContent').querySelectorAll('.modal-spawn-item[data-map-id]').forEach(el => {
    el.addEventListener('click', () => openMapModal(el.dataset.mapId));
  });

  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openItemModal(itemId, isBackAction = false) {
  const item = APP.db.items.find(i => i.id === itemId);
  if (!item) return;

  if (!isBackAction && $('modalOverlay').classList.contains('open')) {
    if (APP.currentModal) {
      modalHistory.push(APP.currentModal);
    }
  }
  if (!isBackAction && !$('modalOverlay').classList.contains('open')) {
    modalHistory.length = 0;
  }
  APP.currentModal = { type: 'item', id: itemId };
  updateModalBackVisibility();

  const drops = APP.db.drops.filter(d => d.item_id === itemId);

  // Group by mob and get best chance
  const byMob = {};
  drops.forEach(d => {
    if (!byMob[d.mob_id] || byMob[d.mob_id].chance < d.chance) byMob[d.mob_id] = d;
  });
  const sources = Object.values(byMob).sort((a, b) => (b.chance || 0) - (a.chance || 0));

  // Calculate best farm map-mob combination
  let bestScore = -1;
  let bestFarm = null;

  sources.forEach(d => {
    const spawns = getSpawnsForMob(d.mob_id);
    spawns.forEach(s => {
      const score = (d.chance || 0) * (s.qtd || 0);
      if (score > bestScore) {
        bestScore = score;
        bestFarm = {
          mob: d.monstro,
          mobId: d.mob_id,
          mapName: s.mapa_nome,
          mapId: s.mapa_id,
          chance: d.chance,
          qty: s.qtd,
          score: score
        };
      }
    });
  });

  const statsData = [];
  if (item.peso != null) statsData.push({ label: 'Peso', value: `${item.peso}` });
  if (item.slots != null && item.slots !== '') statsData.push({ label: 'Slots', value: `${item.slots}` });
  if (item.refinavel != null) statsData.push({ label: 'Refinável', value: item.refinavel ? 'Sim' : 'Não' });
  if (item.nv_min != null && item.nv_min > 0) statsData.push({ label: 'Nv. Mínimo', value: `${item.nv_min}` });
  if (item.atq != null && item.atq > 0) statsData.push({ label: 'ATQ', value: `${item.atq}` });
  if (item.def != null && item.def > 0) statsData.push({ label: 'DEF', value: `${item.def}` });
  if (item.nv_arma != null && item.nv_arma > 0) statsData.push({ label: 'Classe Arma', value: `Nv. ${item.nv_arma}` });
  if (item.posicao != null && item.posicao !== '') statsData.push({ label: 'Posição', value: item.posicao });

  const shopData = [];
  if (item.preco_compra != null && item.preco_compra > 0) {
    const buyStandard = item.preco_compra;
    const buyDiscount = Math.floor(item.preco_compra * 0.76);
    shopData.push({
      label: 'Compra NPC',
      standard: `${fmt(buyStandard)} z`,
      special: `${fmt(buyDiscount)} z (Desc. Nv.10)`
    });
  }
  if (item.preco_venda != null && item.preco_venda > 0) {
    const sellStandard = item.preco_venda;
    const sellOvercharge = Math.floor(item.preco_venda * 1.24);
    shopData.push({
      label: 'Venda NPC',
      standard: `${fmt(sellStandard)} z`,
      special: `${fmt(sellOvercharge)} z (Superf. Nv.10)`
    });
  }

  let descHtml = '—';
  if (item.descricao) {
    descHtml = item.descricao
      .replace(/\s*•\s*/g, '<br>• ')
      .replace(/^<br>• /, '')
      .replace(/•\s*--------------------------\s*•/g, '<div class="desc-divider"></div>')
      .replace(/--------------------------/g, '<div class="desc-divider"></div>');
  }

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:20px;">
      <div style="flex:1">
        <div class="modal-mob-title" style="margin:0">${item.nome}</div>
        <div class="modal-mob-id" style="margin:4px 0 8px 0">#${item.id} · <span style="color:var(--gold-light)">${item.tipo || 'Outros'}</span>${item.subtipo ? ` (${item.subtipo})` : ''}</div>
      </div>
      <div style="width:75px; height:100px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); border:1px solid var(--border); overflow:hidden; padding:4px; flex-shrink:0;">
        <img src="https://static.divine-pride.net/images/items/collection/${item.id}.png" referrerpolicy="no-referrer" alt="${item.nome}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='https://placehold.co/75x100/1e2330/d4a843?text=Item'; this.onerror=null;">
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Informações Técnicas</div>
      ${statsData.length ? `
        <div class="modal-stats-grid">
          ${statsData.map(s => `
            <div class="modal-stat-box">
              <div class="label">${s.label}</div>
              <div class="value">${s.value}</div>
            </div>`).join('')}
        </div>
      ` : '<p style="color:var(--text-muted);font-size:13px">Sem especificações técnicas registradas.</p>'}
    </div>

    ${item.classes ? `
      <div class="modal-section">
        <div class="modal-section-title">Classes Equipáveis</div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-size:13px;color:var(--text-secondary);line-height:1.5">
          ${item.classes}
        </div>
      </div>
    ` : ''}

    <div class="modal-section">
      <div class="modal-section-title">Descrição do Item</div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px 20px;font-size:13px;color:var(--text-primary);line-height:1.6;font-family:'Inter',sans-serif;">
        ${descHtml}
      </div>
    </div>

    ${bestFarm ? `
      <div class="modal-section" style="border:1px solid var(--gold);background:rgba(212,168,67,0.03);border-radius:var(--radius-sm);padding:16px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:20px">🏆</span>
          <span style="font-family:'Cinzel',serif;font-weight:700;color:var(--gold);font-size:12px;letter-spacing:1px;text-transform:uppercase">Melhor Local para Farm</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">
              <span class="clickable-best-mob clickable-link" data-mob-id="${bestFarm.mobId}">${bestFarm.mob}</span> 
              <span style="font-weight:400;color:var(--text-secondary);font-size:13px">no mapa</span> 
              <span class="clickable-best-map clickable-link" data-map-id="${bestFarm.mapId}">${bestFarm.mapName}</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
              ${bestFarm.qty}x monstros neste mapa · Chance de drop: ${fmtChance(bestFarm.chance)}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Score de Farm</div>
            <div style="font-size:22px;font-weight:800;color:var(--gold)">${bestFarm.score.toFixed(3)}</div>
          </div>
        </div>
      </div>
    ` : ''}

    ${shopData.length ? `
      <div class="modal-section">
        <div class="modal-section-title">Comércio (NPCs)</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px">
          ${shopData.map(shop => `
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600">${shop.label}</div>
              <div style="font-size:18px;font-weight:700;color:var(--gold-light)">${shop.standard}</div>
              <div style="font-size:13px;font-weight:600;color:#34d399">${shop.special}</div>
            </div>`).join('')}
        </div>
      </div>
    ` : ''}

    <div class="modal-section">
      <div class="modal-section-title">Monstros que Dropam (${sources.length})</div>
      ${sources.length ? `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${sources.map(d => {
            const mob = APP.db.mobs.find(m => m.id === d.mob_id);
            const spawns = getSpawnsForMob(d.mob_id);
            const mapList = spawns.slice(0, 3).map(s => `<span class="clickable-map-link clickable-link" data-map-id="${s.mapa_id}">${s.mapa_nome} (${s.qtd}x)</span>`).join(', ');
            const isMvp = d.tipo === 'MVP Drop';
            const totalQty = spawns.reduce((acc, s) => acc + (s.qtd || 0), 0);
            const totalScore = (d.chance || 0) * totalQty;

            return `
              <div class="modal-spawn-item clickable-row" data-mob-id="${d.mob_id}" style="transition:border-color var(--transition); display:flex; align-items:center; gap:12px;">
                <div class="mob-sprite-mini" style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:4px; overflow:hidden; flex-shrink:0;">
                  <img src="https://static.divine-pride.net/images/mobs/png/${d.mob_id}.png" referrerpolicy="no-referrer" alt="" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='https://placehold.co/36x36/1e2330/d4a843?text=Mob'; this.onerror=null;">
                </div>
                <div style="flex:1">
                  <div class="spawn-map-name" style="display:flex;align-items:center;gap:6px">
                    <span class="clickable-link" style="font-weight:600">${d.monstro}</span>
                    ${isMvp ? '<span class="badge badge-mvp" style="padding:1px 6px;font-size:8px">MVP</span>' : ''}
                    ${mob ? `<span style="color:var(--text-muted);font-size:11px;font-weight:400">Nv.${mob.nivel} · ${mob.elemento}</span>` : ''}
                  </div>
                  <div class="spawn-meta" style="margin-top:3px">${mapList ? `📍 ${mapList}` : 'Sem spawns no mapa'}</div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                  <div style="font-size:15px;font-weight:700;color:var(--gold-light)">${fmtChance(d.chance)}</div>
                  <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">${d.tipo}</div>
                  ${totalScore > 0 ? `<div style="font-size:10px;color:var(--gold);font-weight:600;margin-top:2px" title="Score = Chance de drop * total de spawns de todos os mapas">Score: ${totalScore.toFixed(3)}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<p style="color:var(--text-muted);font-size:13px">Este item não é dropado por nenhum monstro.</p>'}
    </div>
  `;

  // Bind mob clicks inside item modal
  $('modalContent').innerHTML = html;
  $('modalContent').querySelectorAll('.modal-spawn-item.clickable-row').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('clickable-map-link') || e.target.closest('.clickable-map-link')) {
        return;
      }
      openMobModal(parseInt(el.dataset.mobId));
    });
  });

  // Bind best farm clicks inside best farm card
  const bestMobEl = $('modalContent').querySelector('.clickable-best-mob');
  if (bestMobEl) {
    bestMobEl.addEventListener('click', () => openMobModal(parseInt(bestMobEl.dataset.mobId)));
  }
  const bestMapEl = $('modalContent').querySelector('.clickable-best-map');
  if (bestMapEl) {
    bestMapEl.addEventListener('click', () => openMapModal(bestMapEl.dataset.mapId));
  }

  // Bind map clicks inside item modal
  $('modalContent').querySelectorAll('.clickable-map-link').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMapModal(el.dataset.mapId);
    });
  });

  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openMapModal(mapId, isBackAction = false) {
  const mapData = APP.db.maps.find(m => m.id === mapId);
  if (!mapData) return;

  if (!isBackAction && $('modalOverlay').classList.contains('open')) {
    if (APP.currentModal) {
      modalHistory.push(APP.currentModal);
    }
  }
  if (!isBackAction && !$('modalOverlay').classList.contains('open')) {
    modalHistory.length = 0;
  }
  APP.currentModal = { type: 'map', id: mapId };
  updateModalBackVisibility();

  const spawns = APP.db.spawns.filter(s => s.mapa_id === mapId);
  spawns.sort((a, b) => (b.qtd || 0) - (a.qtd || 0));

  let html = `
    <div>
      <div class="modal-mob-title">${mapData.nome}</div>
      <div class="modal-mob-id">🗺️ ${mapData.id}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Estatísticas do Mapa</div>
      <div class="modal-stats-grid">
        <div class="modal-stat-box">
          <div class="label">Total de Monstros</div>
          <div class="value" style="color:var(--gold-light)">${fmt(mapData.total_mobs)}</div>
        </div>
        <div class="modal-stat-box">
          <div class="label">Espécies</div>
          <div class="value">${mapData.especies}</div>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Monstros no Mapa (${spawns.length})</div>
      ${spawns.length ? `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${spawns.map(s => {
            const mob = APP.db.mobs.find(m => m.id === s.mob_id);
            const isMvp = mob && mob.mvp;
            return `
              <div class="modal-spawn-item clickable-row" data-mob-id="${s.mob_id}" style="transition:border-color var(--transition); display:flex; align-items:center; gap:12px;">
                <div class="mob-sprite-mini" style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:4px; overflow:hidden; flex-shrink:0;">
                  <img src="https://static.divine-pride.net/images/mobs/png/${s.mob_id}.png" referrerpolicy="no-referrer" alt="" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='https://placehold.co/36x36/1e2330/d4a843?text=Mob'; this.onerror=null;">
                </div>
                <div style="flex:1">
                  <div class="spawn-map-name" style="display:flex;align-items:center;gap:6px">
                    <span class="clickable-link" style="font-weight:600">${s.monstro}</span>
                    ${isMvp ? '<span class="badge badge-mvp" style="padding:1px 6px;font-size:8px">MVP</span>' : ''}
                    ${mob ? `<span style="color:var(--text-muted);font-size:11px;font-weight:400">Nv.${mob.nivel} · ${mob.elemento}</span>` : ''}
                  </div>
                  <div class="spawn-meta" style="margin-top:3px">Respawn: ${s.respawn}</div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                  <div style="font-size:15px;font-weight:700;color:var(--gold-light)">${s.qtd}x</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<p style="color:var(--text-muted);font-size:13px">Nenhum monstro registrado neste mapa.</p>'}
    </div>
  `;

  $('modalContent').innerHTML = html;
  $('modalContent').querySelectorAll('.modal-spawn-item.clickable-row').forEach(el => {
    el.addEventListener('click', () => openMobModal(parseInt(el.dataset.mobId)));
  });

  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Background Particles ─────────────────────
function initParticles() {
  const container = $('bgParticles');
  const count = 28;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const dur = Math.random() * 20 + 15;
    const delay = Math.random() * -20;
    dot.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:rgba(212,168,67,${Math.random() * 0.3 + 0.05});
      left:${x}%; top:${y}%;
      animation: floatParticle ${dur}s ${delay}s infinite ease-in-out alternate;
    `;
    container.appendChild(dot);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatParticle {
      0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
      50% { transform: translate(${Math.random()*40-20}px, ${Math.random()*40-20}px) scale(1.5); opacity: 0.8; }
      100% { transform: translate(${Math.random()*40-20}px, ${Math.random()*40-20}px) scale(0.8); opacity: 0.2; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  try {
    await loadData();
  } catch (err) {
    console.error('Falha ao carregar db.json:', err);
    $('mobGrid').innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Erro ao carregar banco de dados.<br>${err.message}</p></div>`;
  }
});
