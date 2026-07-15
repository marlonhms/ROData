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
  },
  simEquip: {
    weapon: null,
    weaponCards: [],
    shield: null,
    shieldCards: [],
    armor: null,
    armorCards: [],
    extra: {}
  },
  character: null
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
function applyWikiOverrides(wikiOverrides) {
  if (!APP.db?.items) return;
  const itemOverrides = wikiOverrides?.items || {};
  APP.db.items.forEach(item => {
    if (item._base_preco_venda !== undefined) item.preco_venda = item._base_preco_venda;
    const override = itemOverrides[item.id];
    if (!override) { item._wiki_source = null; return; }
    if (item._base_preco_venda === undefined) item._base_preco_venda = item.preco_venda;
    if (override.preco_venda != null) item.preco_venda = override.preco_venda;
    item._wiki_source = override.source || null;
  });
  APP.wikiOverrides = wikiOverrides;
  APP.itemById = new Map(APP.db.items.map(item => [item.id, item]));
}

let patchNotesData = null;
let patchNotesFilter = 'all';

function escapePatchText(value) {
  const element = document.createElement('span');
  element.textContent = String(value || '');
  return element.innerHTML;
}

function formatPatchDate(value, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function renderPatchNotes() {
  const feed = $('patchnotesFeed');
  if (!feed || !patchNotesData) return;
  const entries = (patchNotesData.entries || []).filter(entry => patchNotesFilter === 'all' || entry.type === patchNotesFilter);
  if (!entries.length) {
    feed.innerHTML = '<div class="patchnotes-empty">Nenhuma mudança encontrada neste filtro.</div>';
    return;
  }

  let lastDay = '';
  feed.innerHTML = entries.map(entry => {
    const day = new Date(entry.timestamp).toISOString().slice(0, 10);
    const divider = day !== lastDay
      ? `<div class="patchnotes-day"><span>${escapePatchText(formatPatchDate(entry.timestamp))}</span></div>`
      : '';
    lastDay = day;
    const isNew = entry.type === 'new';
    const details = (entry.details || []).slice(1).map(detail => `<li>${escapePatchText(detail)}</li>`).join('');
    return `${divider}
      <article class="patchnote-card ${isNew ? 'is-new' : ''}">
        <div class="patchnote-rail"><span></span></div>
        <div class="patchnote-body">
          <div class="patchnote-meta">
            <span class="patchnote-badge">${isNew ? 'Nova página' : 'Atualização'}</span>
            <time>${escapePatchText(formatPatchDate(entry.timestamp, true))}</time>
            ${entry.revisions > 1 ? `<span>${entry.revisions} edições reunidas</span>` : ''}
          </div>
          <h3>${escapePatchText(entry.title)}</h3>
          <p>${escapePatchText(entry.summary)}</p>
          ${details ? `<ul>${details}</ul>` : ''}
          <div class="patchnote-card-footer">
            <span>por ${escapePatchText(entry.author || 'Equipe AureumRO')}</span>
            <a href="${escapePatchText(entry.url)}" target="_blank" rel="noopener">Abrir artigo ↗</a>
          </div>
        </div>
      </article>`;
  }).join('');
}

async function fetchPatchNotes() {
  if (patchNotesData) return patchNotesData;
  const response = await fetch(`wiki-patchnotes.json?v=${Date.now()}`);
  if (!response.ok) throw new Error('Snapshot de Patch Notes indisponível');
  patchNotesData = await response.json();
  const generated = patchNotesData.meta?.generatedAt;
  if ($('patchnotesUpdated')) $('patchnotesUpdated').textContent = generated ? `Sincronizado em ${formatPatchDate(generated, true)}` : 'Snapshot oficial';
  if ($('patchnotesSource') && patchNotesData.meta?.source) $('patchnotesSource').href = patchNotesData.meta.source;
  const seen = Number(localStorage.getItem('aureum_patchnotes_seen') || 0);
  const latest = Number(patchNotesData.meta?.latestRevision || 0);
  if ($('patchnotesNewDot')) $('patchnotesNewDot').hidden = !latest || latest <= seen;
  return patchNotesData;
}

function initPatchNotes() {
  const overlay = $('patchnotesOverlay');
  const open = $('patchnotesOpen');
  if (!overlay || !open) return;

  const closePanel = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('patchnotes-open');
  };
  const openPanel = async () => {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('patchnotes-open');
    try {
      await fetchPatchNotes();
      renderPatchNotes();
      localStorage.setItem('aureum_patchnotes_seen', String(patchNotesData.meta?.latestRevision || 0));
      if ($('patchnotesNewDot')) $('patchnotesNewDot').hidden = true;
    } catch (error) {
      $('patchnotesFeed').innerHTML = '<div class="patchnotes-empty">Ainda não há um snapshot publicado. Execute o sincronizador de Patch Notes e tente novamente.</div>';
    }
  };

  open.addEventListener('click', openPanel);
  $('patchnotesClose').addEventListener('click', closePanel);
  overlay.addEventListener('click', event => { if (event.target === overlay) closePanel(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && overlay.classList.contains('open')) closePanel(); });
  $$('.patchnotes-tabs button').forEach(button => button.addEventListener('click', () => {
    patchNotesFilter = button.dataset.patchFilter;
    $$('.patchnotes-tabs button').forEach(tab => tab.classList.toggle('active', tab === button));
    renderPatchNotes();
  }));
  fetchPatchNotes().catch(() => {});
}

async function loadData() {
  const res = await fetch('db.json');
  APP.db = await res.json();
  try {
    const overrideResponse = await fetch('wiki-overrides.json');
    if (overrideResponse.ok) {
      const wikiOverrides = await overrideResponse.json();
      applyWikiOverrides(wikiOverrides);
    }
  } catch (error) {
    console.warn('Wiki overrides indisponíveis; usando apenas o db.json.', error);
  }
  APP.itemById = new Map(APP.db.items.map(item => [item.id, item]));
  APP.dropsByMob = new Map();
  APP.spawnsByMob = new Map();
  APP.db.drops.forEach(drop => {
    if (!APP.dropsByMob.has(drop.mob_id)) APP.dropsByMob.set(drop.mob_id, []);
    APP.dropsByMob.get(drop.mob_id).push(drop);
  });
  APP.db.spawns.forEach(spawn => {
    if (!APP.spawnsByMob.has(spawn.mob_id)) APP.spawnsByMob.set(spawn.mob_id, []);
    APP.spawnsByMob.get(spawn.mob_id).push(spawn);
  });

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
  initSimulator();
  initCharacterBuilder();
  initWikiSyncPage();
  initPatchNotes();
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
    drops: ['Drops por Monstro', `${APP.db.drops.length} relações entre monstros e itens`],
    itens: ['Enciclopédia de Itens', `${APP.db.items.length} fichas de itens no catálogo`],
    mapas: ['Mapas', `${APP.db.maps.length} mapas disponíveis`],
    'farm-optimizer': ['Otimizador de Farm', 'Encontre os melhores mobs para seu personagem'],
    'item-finder': ['Onde Farmar Item', 'Descubra onde dropar qualquer item'],
    'mob-compare': ['Comparar Monstros', 'Compare mobs lado a lado'],
    'wiki-sync': ['Sincronização Wiki', 'Revisão visual dos dados oficiais do AureumRO'],
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
    const npcPrice = drop => Number(APP.itemById?.get(drop.item_id)?.preco_venda) || 0;
    const expected = drop => npcPrice(drop) * (Number(drop.chance) || 0);
    switch(sort) {
      case 'chance':      return (a.chance || 0) - (b.chance || 0);
      case 'chance-desc': return (b.chance || 0) - (a.chance || 0);
      case 'raw-desc': return npcPrice(b) - npcPrice(a);
      case 'expected-desc': return expected(b) - expected(a);
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
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhuma relação de drop encontrada.</td></tr>';
    $('dropsPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = slice.map(d => {
    const pct = parseFloat(d.chance) * 100;
    const barW = Math.min(100, pct * 5);
    const isMvp = d.tipo === 'MVP Drop';
    const item = APP.itemById?.get(d.item_id);
    const npcPrice = Number(item?.preco_venda) || 0;
    const expected = npcPrice * (Number(d.chance) || 0);
    const spawns = APP.spawnsByMob?.get(d.mob_id) || [];
    const bestMap = spawns.reduce((best, spawn) => (Number(spawn.qtd) || 0) > (Number(best?.qtd) || 0) ? spawn : best, null);
    return `<tr>
      <td class="cell-name"><span class="clickable-link" data-mob-id="${d.mob_id}">${d.monstro || '—'}</span>${isMvp ? '<span class="badge badge-mvp drop-relation-badge">MVP</span>' : ''}</td>
      <td class="cell-name"><span class="clickable-link" data-item-id="${d.item_id}">${d.item || '—'}</span></td>
      <td>
        <div class="chance-bar-wrap">
          <div class="chance-bar-track"><div class="chance-bar-fill" style="width:${barW}%"></div></div>
          <span class="chance-text cell-gold">${fmtChance(d.chance)}</span>
        </div>
      </td>
      <td class="cell-gold">${npcPrice ? fmt(npcPrice) + ' z' : '—'}</td>
      <td><strong class="expected-zeny">${expected ? fmt(expected, 2) + ' z' : '—'}</strong></td>
      <td><span class="best-map-cell">${plainText(bestMap?.mapa_nome || '—')}</span>${bestMap ? `<small>${bestMap.qtd} mobs · ${plainText(bestMap.respawn || '')}</small>` : ''}</td>
      <td><div class="relation-actions"><button class="btn-sm" data-mob="${d.mob_id}">Monstro</button><button class="btn-sm" data-item="${d.item_id}">Item</button></div></td>
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
  tbody.querySelectorAll('.btn-sm[data-item]').forEach(btn => {
    btn.addEventListener('click', () => openItemModal(parseInt(btn.dataset.item)));
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
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhuma ficha de item encontrada.</td></tr>';
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
    <td class="cell-muted">${it.posicao || it.subtipo || '—'}</td>
    <td class="cell-muted">${it.peso ?? '—'}</td>
    <td class="cell-gold">${it.preco_venda != null ? fmt(it.preco_venda) + ' z' : '—'}</td>
    <td class="cell-muted">${it.slots ?? '—'}</td>
    <td class="cell-muted">${it.dropado_por ?? '—'}</td>
    <td><button class="btn-sm item-detail-btn" data-item-detail="${it.id}">Abrir ficha</button></td>
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
      <div class="map-card-thumbnail">
        <img src="https://www.divine-pride.net/img/map/raw/${map.id}" referrerpolicy="no-referrer" alt="" style="width:100%; height:100%; object-fit:contain;" onerror="this.style.display='none'; this.onerror=null;">
      </div>
      <div class="map-card-content">
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
      </div>
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
    // XP limiter: no XP if character is 20+ levels above the monster
    if (charLevel && (charLevel - (m.nivel || 0)) >= 20) return false;
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
// TOOL: COMBAT SIMULATOR
// ═══════════════════════════════════════════════
const SIZE_PENALTY = {
  'Desarmado':   { 'Pequeno': 1.0, 'Médio': 1.0, 'Grande': 1.0 },
  'Adaga':       { 'Pequeno': 1.0, 'Médio': 0.75, 'Grande': 0.5 },
  'Espada1M':    { 'Pequeno': 0.75, 'Médio': 1.0, 'Grande': 0.75 },
  'Espada2M':    { 'Pequeno': 0.75, 'Médio': 0.75, 'Grande': 1.0 },
  'Lanca1M':     { 'Pequeno': 0.75, 'Médio': 0.75, 'Grande': 1.0 },
  'Lanca2M':     { 'Pequeno': 0.75, 'Médio': 0.75, 'Grande': 1.0 },
  'Machado1M':   { 'Pequeno': 0.5, 'Médio': 0.75, 'Grande': 1.0 },
  'Machado2M':   { 'Pequeno': 0.5, 'Médio': 0.75, 'Grande': 1.0 },
  'Maca':        { 'Pequeno': 0.75, 'Médio': 1.0, 'Grande': 1.0 },
  'Cajado':      { 'Pequeno': 1.0, 'Médio': 1.0, 'Grande': 1.0 },
  'Arco':        { 'Pequeno': 1.0, 'Médio': 1.0, 'Grande': 0.75 },
  'Katar':       { 'Pequeno': 0.75, 'Médio': 1.0, 'Grande': 0.75 },
  'Livro':       { 'Pequeno': 1.0, 'Médio': 1.0, 'Grande': 0.5 },
  'Soco':        { 'Pequeno': 1.0, 'Médio': 1.0, 'Grande': 0.75 },
  'Instrumento': { 'Pequeno': 0.75, 'Médio': 1.0, 'Grande': 0.75 },
  'Chicote':     { 'Pequeno': 0.75, 'Médio': 1.0, 'Grande': 0.5 },
  'ArmaFogo':    { 'Pequeno': 1.0, 'Médio': 1.0, 'Grande': 1.0 },
  'Shuriken':    { 'Pequeno': 0.75, 'Médio': 0.75, 'Grande': 1.0 }
};

const ELEM_MULTI = {
  1: {
    'Neutro':   { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 1.0, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 0.9,  'Maldito': 1.0 },
    'Agua':     { 'Neutro': 1.0, 'Agua': 0.25, 'Terra': 1.0, 'Fogo': 1.5, 'Vento': 0.9,  'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Terra':    { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 0.25, 'Fogo': 0.9,  'Vento': 1.5, 'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Fogo':     { 'Neutro': 1.0, 'Agua': 0.9,  'Terra': 1.5, 'Fogo': 0.25, 'Vento': 1.0, 'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.25 },
    'Vento':    { 'Neutro': 1.0, 'Agua': 1.5, 'Terra': 0.9,  'Fogo': 1.0, 'Vento': 0.25, 'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Veneno':   { 'Neutro': 1.0, 'Agua': 1.5, 'Terra': 1.5, 'Fogo': 1.5, 'Vento': 1.5, 'Veneno': 0.0,  'Sagrado': 0.75, 'Sombrio': 0.75, 'Fantasma': 0.75, 'Maldito': 0.75 },
    'Sagrado':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': 0.0,  'Sombrio': 1.25, 'Fantasma': 1.0,  'Maldito': 1.25 },
    'Sombrio':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': 1.25, 'Sombrio': 0.0,  'Fantasma': 1.0,  'Maldito': -0.25 },
    'Fantasma': { 'Neutro': 0.9,  'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': 0.9,  'Sombrio': 0.9,  'Fantasma': 1.25, 'Maldito': 1.0 },
    'Maldito':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 0.9,  'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': 1.25, 'Sombrio': -0.25, 'Fantasma': 1.0,  'Maldito': 0.0 }
  },
  2: {
    'Neutro':   { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 1.0, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 0.7,  'Maldito': 1.0 },
    'Agua':     { 'Neutro': 1.0, 'Agua': 0.0,  'Terra': 1.0, 'Fogo': 1.75, 'Vento': 0.8,  'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Terra':    { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 0.0,  'Fogo': 0.8,  'Vento': 1.75, 'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Fogo':     { 'Neutro': 1.0, 'Agua': 0.8,  'Terra': 1.75, 'Fogo': 0.0,  'Vento': 1.0, 'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.5 },
    'Vento':    { 'Neutro': 1.0, 'Agua': 1.75, 'Terra': 0.8,  'Fogo': 1.0, 'Vento': 0.0,  'Veneno': 1.5, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Veneno':   { 'Neutro': 1.0, 'Agua': 1.5, 'Terra': 1.5, 'Fogo': 1.5, 'Vento': 1.5, 'Veneno': 0.0,  'Sagrado': 0.75, 'Sombrio': 0.75, 'Fantasma': 0.75, 'Maldito': 0.5 },
    'Sagrado':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': -0.25, 'Sombrio': 1.5, 'Fantasma': 1.0,  'Maldito': 1.5 },
    'Sombrio':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': 1.5, 'Sombrio': -0.25, 'Fantasma': 1.0,  'Maldito': -0.5 },
    'Fantasma': { 'Neutro': 0.7,  'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.75, 'Sagrado': 0.8,  'Sombrio': 0.8,  'Fantasma': 1.5,  'Maldito': 1.25 },
    'Maldito':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 0.8,  'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': 1.5, 'Sombrio': -0.5, 'Fantasma': 1.25, 'Maldito': 0.0 }
  },
  3: {
    'Neutro':   { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 1.0, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 0.5,  'Maldito': 1.0 },
    'Agua':     { 'Neutro': 1.0, 'Agua': -0.25, 'Terra': 1.0, 'Fogo': 2.0,  'Vento': 0.7,  'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Terra':    { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': -0.25, 'Fogo': 0.7,  'Vento': 2.0,  'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Fogo':     { 'Neutro': 1.0, 'Agua': 0.7,  'Terra': 2.0,  'Fogo': -0.25, 'Vento': 1.0, 'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.75 },
    'Vento':    { 'Neutro': 1.0, 'Agua': 2.0,  'Terra': 0.7,  'Fogo': 1.0, 'Vento': -0.25, 'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Veneno':   { 'Neutro': 1.0, 'Agua': 1.25, 'Terra': 1.25, 'Fogo': 1.25, 'Vento': 1.25, 'Veneno': 0.0,  'Sagrado': 0.5,  'Sombrio': 0.5,  'Fantasma': 0.5,  'Maldito': 0.25 },
    'Sagrado':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': -0.5, 'Sombrio': 1.75, 'Fantasma': 1.0,  'Maldito': 1.75 },
    'Sombrio':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': 1.75, 'Sombrio': -0.5, 'Fantasma': 1.0,  'Maldito': -0.75 },
    'Fantasma': { 'Neutro': 0.5,  'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': 0.7,  'Sombrio': 0.7,  'Fantasma': 1.75, 'Maldito': 1.5 },
    'Maldito':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 0.7,  'Vento': 1.0, 'Veneno': 0.25, 'Sagrado': 1.75, 'Sombrio': -0.75, 'Fantasma': 1.5,  'Maldito': 0.0 }
  },
  4: {
    'Neutro':   { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 1.0, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 0.0,  'Maldito': 1.0 },
    'Agua':     { 'Neutro': 1.0, 'Agua': -0.5, 'Terra': 1.0, 'Fogo': 2.0,  'Vento': 0.6,  'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Terra':    { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': -0.5, 'Fogo': 0.6,  'Vento': 2.0,  'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Fogo':     { 'Neutro': 1.0, 'Agua': 0.6,  'Terra': 2.0,  'Fogo': -0.5, 'Vento': 1.0, 'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 2.0 },
    'Vento':    { 'Neutro': 1.0, 'Agua': 2.0,  'Terra': 0.6,  'Fogo': 1.0, 'Vento': -0.5, 'Veneno': 1.25, 'Sagrado': 1.0, 'Sombrio': 1.0, 'Fantasma': 1.0,  'Maldito': 1.0 },
    'Veneno':   { 'Neutro': 1.0, 'Agua': 1.25, 'Terra': 1.25, 'Fogo': 1.25, 'Vento': 1.25, 'Veneno': 0.0,  'Sagrado': 0.5,  'Sombrio': 0.5,  'Fantasma': 0.5,  'Maldito': -0.5 },
    'Sagrado':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': -1.0, 'Sombrio': 2.0,  'Fantasma': 1.0,  'Maldito': 2.0 },
    'Sombrio':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': 2.0,  'Sombrio': -1.0, 'Fantasma': 1.0,  'Maldito': -1.0 },
    'Fantasma': { 'Neutro': 0.0,  'Agua': 1.0, 'Terra': 1.0, 'Fogo': 1.0, 'Vento': 1.0, 'Veneno': 0.5,  'Sagrado': 0.6,  'Sombrio': 0.6,  'Fantasma': 2.0,  'Maldito': 1.75 },
    'Maldito':  { 'Neutro': 1.0, 'Agua': 1.0, 'Terra': 1.0, 'Fogo': 0.6,  'Vento': 1.0, 'Veneno': -1.0, 'Sagrado': 2.0,  'Sombrio': -1.0, 'Fantasma': 1.75, 'Maldito': 0.0 }
  }
};

function initSimulator() {
  // Tab Navigation Click Handlers
  const tabStatsBtn = $('sim-tab-stats-btn');
  const tabEquipBtn = $('sim-tab-equip-btn');
  const tabStatsContent = $('sim-tab-stats-content');
  const tabEquipContent = $('sim-tab-equip-content');

  if (tabStatsBtn && tabEquipBtn) {
    tabStatsBtn.onclick = () => {
      tabStatsBtn.classList.add('active');
      tabEquipBtn.classList.remove('active');
      tabStatsContent.style.display = 'block';
      tabEquipContent.style.display = 'none';
    };
    tabEquipBtn.onclick = () => {
      tabEquipBtn.classList.add('active');
      tabStatsBtn.classList.remove('active');
      tabStatsContent.style.display = 'none';
      tabEquipContent.style.display = 'block';
    };
  }

  const saved = JSON.parse(localStorage.getItem('aureum_sim_profile') || '{}');
  const fields = ['sim-nivel', 'sim-classe', 'sim-hit', 'sim-flee', 'sim-atq', 'sim-skill-pct', 'sim-arma-tipo', 'sim-arma-elemento'];
  
  fields.forEach(id => {
    const el = $(id);
    if (el && saved[id] !== undefined) {
      el.value = saved[id];
    }
  });

  const saveProfile = () => {
    const profile = {};
    fields.forEach(id => {
      if ($(id)) profile[id] = $(id).value;
    });
    localStorage.setItem('aureum_sim_profile', JSON.stringify(profile));
    
    if (APP.currentSimMob) runSimulation(APP.currentSimMob);
  };

  fields.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', saveProfile);
  });

  // --- Dynamic Equipment rendering helper ---
  const renderEquipSlots = () => {
    // 1. Weapon Display
    const weapon = APP.simEquip.weapon;
    const wNameSpan = $('sim-weapon-name');
    const wRemoveBtn = $('sim-weapon-remove');
    const wSlotsDiv = $('sim-weapon-slots');
    
    if (weapon) {
      wNameSpan.textContent = `${weapon.nome} [${weapon.slots || 0}]`;
      wRemoveBtn.style.display = 'inline';
      
      let slotsHtml = '';
      const slotsCount = weapon.slots || 0;
      for (let i = 0; i < slotsCount; i++) {
        const equippedCard = APP.simEquip.weaponCards[i];
        const cardName = equippedCard ? equippedCard.nome : 'Vazio';
        
        slotsHtml += `
          <div style="background:rgba(255,255,255,0.01); border:1px dashed var(--border); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-muted);">Slot ${i+1}: <strong style="color:${equippedCard ? 'var(--gold)' : 'var(--text-muted)'};">${cardName}</strong></span>
              ${equippedCard ? `<button class="sim-card-remove-btn" data-type="weapon" data-index="${i}" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:11px;">Remover</button>` : ''}
            </div>
            ${!equippedCard ? `
              <div class="finder-search-wrap" style="margin-bottom:0;">
                <input type="text" class="sim-card-search-input filter-input" data-type="weapon" data-index="${i}" placeholder="Buscar carta de arma..." autocomplete="off" style="font-size:11px; padding:6px 10px; width:100%; box-sizing:border-box;">
                <div class="finder-suggestions sim-card-suggestions"></div>
              </div>
            ` : ''}
          </div>
        `;
      }
      wSlotsDiv.innerHTML = slotsHtml;
    } else {
      wNameSpan.textContent = 'Desarmado';
      wRemoveBtn.style.display = 'none';
      wSlotsDiv.innerHTML = '';
    }

    // 2. Shield Display
    const shield = APP.simEquip.shield;
    const sNameSpan = $('sim-shield-name');
    const sRemoveBtn = $('sim-shield-remove');
    const sSlotsDiv = $('sim-shield-slots');
    
    if (shield) {
      sNameSpan.textContent = `${shield.nome} [${shield.slots || 0}]`;
      sRemoveBtn.style.display = 'inline';
      
      let slotsHtml = '';
      const slotsCount = shield.slots || 0;
      for (let i = 0; i < slotsCount; i++) {
        const equippedCard = APP.simEquip.shieldCards[i];
        const cardName = equippedCard ? equippedCard.nome : 'Vazio';
        
        slotsHtml += `
          <div style="background:rgba(255,255,255,0.01); border:1px dashed var(--border); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-muted);">Slot ${i+1}: <strong style="color:${equippedCard ? 'var(--gold)' : 'var(--text-muted)'};">${cardName}</strong></span>
              ${equippedCard ? `<button class="sim-card-remove-btn" data-type="shield" data-index="${i}" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:11px;">Remover</button>` : ''}
            </div>
            ${!equippedCard ? `
              <div class="finder-search-wrap" style="margin-bottom:0;">
                <input type="text" class="sim-card-search-input filter-input" data-type="shield" data-index="${i}" placeholder="Buscar carta de escudo..." autocomplete="off" style="font-size:11px; padding:6px 10px; width:100%; box-sizing:border-box;">
                <div class="finder-suggestions sim-card-suggestions"></div>
              </div>
            ` : ''}
          </div>
        `;
      }
      sSlotsDiv.innerHTML = slotsHtml;
    } else {
      sNameSpan.textContent = 'Sem Escudo';
      sRemoveBtn.style.display = 'none';
      sSlotsDiv.innerHTML = '';
    }

    // 3. Armor Display
    const armor = APP.simEquip.armor;
    const aNameSpan = $('sim-armor-name');
    const aRemoveBtn = $('sim-armor-remove');
    const aSlotsDiv = $('sim-armor-slots');
    
    if (armor) {
      aNameSpan.textContent = `${armor.nome} [${armor.slots || 0}]`;
      aRemoveBtn.style.display = 'inline';
      
      let slotsHtml = '';
      const slotsCount = armor.slots || 0;
      for (let i = 0; i < slotsCount; i++) {
        const equippedCard = APP.simEquip.armorCards[i];
        const cardName = equippedCard ? equippedCard.nome : 'Vazio';
        
        slotsHtml += `
          <div style="background:rgba(255,255,255,0.01); border:1px dashed var(--border); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-muted);">Slot ${i+1}: <strong style="color:${equippedCard ? 'var(--gold)' : 'var(--text-muted)'};">${cardName}</strong></span>
              ${equippedCard ? `<button class="sim-card-remove-btn" data-type="armor" data-index="${i}" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:11px;">Remover</button>` : ''}
            </div>
            ${!equippedCard ? `
              <div class="finder-search-wrap" style="margin-bottom:0;">
                <input type="text" class="sim-card-search-input filter-input" data-type="armor" data-index="${i}" placeholder="Buscar carta de armadura..." autocomplete="off" style="font-size:11px; padding:6px 10px; width:100%; box-sizing:border-box;">
                <div class="finder-suggestions sim-card-suggestions"></div>
              </div>
            ` : ''}
          </div>
        `;
      }
      aSlotsDiv.innerHTML = slotsHtml;
    } else {
      aNameSpan.textContent = 'Sem Armadura';
      aRemoveBtn.style.display = 'none';
      aSlotsDiv.innerHTML = '';
    }

    bindCardInputs();
    
    const equipIds = {
      weaponId: weapon ? weapon.id : null,
      weaponCardIds: APP.simEquip.weaponCards.map(c => c ? c.id : null),
      shieldId: shield ? shield.id : null,
      shieldCardIds: APP.simEquip.shieldCards.map(c => c ? c.id : null),
      armorId: armor ? armor.id : null,
      armorCardIds: APP.simEquip.armorCards.map(c => c ? c.id : null)
    };
    localStorage.setItem('aureum_sim_equip', JSON.stringify(equipIds));

    if (APP.currentSimMob) runSimulation(APP.currentSimMob);
  };

  // Exposed so saved builds can refresh the legacy weapon/card widgets too.
  APP.renderSimulatorEquipment = renderEquipSlots;

  // --- Dynamic card inputs events binder ---
  const bindCardInputs = () => {
    document.querySelectorAll('.sim-card-remove-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.dataset.type;
        const idx = parseInt(btn.dataset.index);
        if (type === 'weapon') APP.simEquip.weaponCards[idx] = null;
        else if (type === 'shield') APP.simEquip.shieldCards[idx] = null;
        else if (type === 'armor') APP.simEquip.armorCards[idx] = null;
        renderEquipSlots();
      };
    });

    document.querySelectorAll('.sim-card-search-input').forEach(input => {
      const type = input.dataset.type;
      const idx = parseInt(input.dataset.index);
      const sugg = input.nextElementSibling;

      input.addEventListener('input', debounce(() => {
        const q = input.value.toLowerCase().trim();
        if (q.length < 2) { sugg.classList.remove('open'); return; }
        
        let filterPos = 'Mão Direita';
        if (type === 'shield') filterPos = 'Mão Esquerda';
        else if (type === 'armor') filterPos = 'Armadura';

        const matches = APP.db.items.filter(i => 
          i.tipo === 'Carta' && 
          i.posicao === filterPos && 
          i.nome?.toLowerCase().includes(q)
        ).slice(0, 8);

        if (!matches.length) { sugg.classList.remove('open'); return; }

        sugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome}</div>`).join('');
        sugg.classList.add('open');
        
        sugg.querySelectorAll('.suggestion-item').forEach(el => {
          el.onclick = () => {
            const card = APP.db.items.find(i => i.id === parseInt(el.dataset.id));
            if (card) {
              if (type === 'weapon') APP.simEquip.weaponCards[idx] = card;
              else if (type === 'shield') APP.simEquip.shieldCards[idx] = card;
              else if (type === 'armor') APP.simEquip.armorCards[idx] = card;
              renderEquipSlots();
            }
          };
        });
      }, 200));
    });
  };

  // --- Weapon Search ---
  const wSearch = $('sim-weapon-search');
  const wSugg = $('sim-weapon-suggest');
  if (wSearch) {
    wSearch.addEventListener('input', debounce(() => {
      const q = wSearch.value.toLowerCase().trim();
      if (q.length < 2) { wSugg.classList.remove('open'); return; }
      const matches = APP.db.items.filter(i => i.tipo === 'Arma' && i.nome?.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { wSugg.classList.remove('open'); return; }

      wSugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome} [${m.slots || 0}] (ATQ: ${m.atq})</div>`).join('');
      wSugg.classList.add('open');
      
      wSugg.querySelectorAll('.suggestion-item').forEach(el => {
        el.onclick = () => {
          const item = APP.db.items.find(i => i.id === parseInt(el.dataset.id));
          wSearch.value = '';
          wSugg.classList.remove('open');
          if (item) {
            APP.simEquip.weapon = item;
            APP.simEquip.weaponCards = new Array(item.slots || 0).fill(null);
            
            $('sim-atq').value = item.atq || 0;
            const subMap = {
              'Adaga': 'Adaga', 'Espada de 1 Mão': 'Espada1M', 'Espada de 2 Mãos': 'Espada2M',
              'Lança de 1 Mão': 'Lanca1M', 'Lança de 2 Mãos': 'Lanca2M', 'Machado de 1 Mão': 'Machado1M',
              'Machado de 2 Mãos': 'Machado2M', 'Maça': 'Maca', 'Cajado': 'Cajado', 'Arco': 'Arco',
              'Katar': 'Katar', 'Livro': 'Livro', 'Soqueira': 'Soco', 'Instrumento Musical': 'Instrumento',
              'Chicote': 'Chicote', 'Arma de Fogo': 'ArmaFogo', 'Shuriken Huuma': 'Shuriken'
            };
            $('sim-arma-tipo').value = subMap[item.subtipo] || 'Desarmado';
            
            saveProfile();
            renderEquipSlots();
          }
        };
      });
    }, 200));
  }

  $('sim-weapon-remove').onclick = () => {
    APP.simEquip.weapon = null;
    APP.simEquip.weaponCards = [];
    renderEquipSlots();
  };

  // --- Shield Search ---
  const sSearch = $('sim-shield-search');
  const sSugg = $('sim-shield-suggest');
  if (sSearch) {
    sSearch.addEventListener('input', debounce(() => {
      const q = sSearch.value.toLowerCase().trim();
      if (q.length < 2) { sSugg.classList.remove('open'); return; }
      const matches = APP.db.items.filter(i => i.tipo === 'Equipamento' && i.posicao === 'Mão Esquerda' && i.nome?.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { sSugg.classList.remove('open'); return; }

      sSugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome} [${m.slots || 0}]</div>`).join('');
      sSugg.classList.add('open');
      
      sSugg.querySelectorAll('.suggestion-item').forEach(el => {
        el.onclick = () => {
          const item = APP.db.items.find(i => i.id === parseInt(el.dataset.id));
          sSearch.value = '';
          sSugg.classList.remove('open');
          if (item) {
            APP.simEquip.shield = item;
            APP.simEquip.shieldCards = new Array(item.slots || 0).fill(null);
            renderEquipSlots();
          }
        };
      });
    }, 200));
  }

  $('sim-shield-remove').onclick = () => {
    APP.simEquip.shield = null;
    APP.simEquip.shieldCards = [];
    renderEquipSlots();
  };

  // --- Armor Search ---
  const aSearch = $('sim-armor-search');
  const aSugg = $('sim-armor-suggest');
  if (aSearch) {
    aSearch.addEventListener('input', debounce(() => {
      const q = aSearch.value.toLowerCase().trim();
      if (q.length < 2) { aSugg.classList.remove('open'); return; }
      const matches = APP.db.items.filter(i => i.tipo === 'Equipamento' && i.posicao === 'Armadura' && i.nome?.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { aSugg.classList.remove('open'); return; }

      aSugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome} [${m.slots || 0}]</div>`).join('');
      aSugg.classList.add('open');
      
      aSugg.querySelectorAll('.suggestion-item').forEach(el => {
        el.onclick = () => {
          const item = APP.db.items.find(i => i.id === parseInt(el.dataset.id));
          aSearch.value = '';
          aSugg.classList.remove('open');
          if (item) {
            APP.simEquip.armor = item;
            APP.simEquip.armorCards = new Array(item.slots || 0).fill(null);
            renderEquipSlots();
          }
        };
      });
    }, 200));
  }

  $('sim-armor-remove').onclick = () => {
    APP.simEquip.armor = null;
    APP.simEquip.armorCards = [];
    renderEquipSlots();
  };

  // --- Mob Search ---
  const input = $('sim-mob-search');
  const sugg  = $('sim-mob-suggest');

  if (input) {
    input.addEventListener('input', debounce(() => {
      const q = input.value.toLowerCase().trim();
      if (q.length < 2) { sugg.classList.remove('open'); return; }
      const matches = APP.db.mobs.filter(m => m.nome?.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { sugg.classList.remove('open'); return; }

      sugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome} (Nv.${m.nivel})</div>`).join('');
      sugg.classList.add('open');
      sugg.querySelectorAll('.suggestion-item').forEach(el => {
        el.onclick = () => {
          const mob = APP.db.mobs.find(m => m.id === parseInt(el.dataset.id));
          input.value = '';
          sugg.classList.remove('open');
          APP.currentSimMob = mob;
          runSimulation(mob);
        };
      });
    }, 200));
  }

  document.addEventListener('click', e => {
    if (wSugg && !wSugg.contains(e.target) && e.target !== wSearch) wSugg.classList.remove('open');
    if (sSugg && !sSugg.contains(e.target) && e.target !== sSearch) sSugg.classList.remove('open');
    if (aSugg && !aSugg.contains(e.target) && e.target !== aSearch) aSugg.classList.remove('open');
    if (sugg && !sugg.contains(e.target) && e.target !== input) sugg.classList.remove('open');
    document.querySelectorAll('.sim-card-suggestions').forEach(el => {
      if (!el.contains(e.target) && !e.target.classList.contains('sim-card-search-input')) {
        el.classList.remove('open');
      }
    });
  });

  // --- Load Saved Equipment & Cards from localStorage ---
  try {
    const savedEquip = JSON.parse(localStorage.getItem('aureum_sim_equip') || '{}');
    if (savedEquip.weaponId) {
      const weapon = APP.db.items.find(i => i.id === savedEquip.weaponId);
      if (weapon) {
        APP.simEquip.weapon = weapon;
        APP.simEquip.weaponCards = new Array(weapon.slots || 0).fill(null);
        if (savedEquip.weaponCardIds) {
          savedEquip.weaponCardIds.forEach((cid, idx) => {
            if (cid && idx < APP.simEquip.weaponCards.length) {
              const card = APP.db.items.find(i => i.id === cid);
              if (card) APP.simEquip.weaponCards[idx] = card;
            }
          });
        }
      }
    }
    if (savedEquip.shieldId) {
      const shield = APP.db.items.find(i => i.id === savedEquip.shieldId);
      if (shield) {
        APP.simEquip.shield = shield;
        APP.simEquip.shieldCards = new Array(shield.slots || 0).fill(null);
        if (savedEquip.shieldCardIds) {
          savedEquip.shieldCardIds.forEach((cid, idx) => {
            if (cid && idx < APP.simEquip.shieldCards.length) {
              const card = APP.db.items.find(i => i.id === cid);
              if (card) APP.simEquip.shieldCards[idx] = card;
            }
          });
        }
      }
    }
    if (savedEquip.armorId) {
      const armor = APP.db.items.find(i => i.id === savedEquip.armorId);
      if (armor) {
        APP.simEquip.armor = armor;
        APP.simEquip.armorCards = new Array(armor.slots || 0).fill(null);
        if (savedEquip.armorCardIds) {
          savedEquip.armorCardIds.forEach((cid, idx) => {
            if (cid && idx < APP.simEquip.armorCards.length) {
              const card = APP.db.items.find(i => i.id === cid);
              if (card) APP.simEquip.armorCards[idx] = card;
            }
          });
        }
      }
    }
  } catch (e) {
    console.error('Erro ao carregar equipamentos salvos no simulador:', e);
  }

  // Render slots for loaded equipment
  renderEquipSlots();
}

const CARD_MODIFIERS = {
  'Carta Lobo do Deserto': { size: { 'Pequeno': 15 }, atq: 5 },
  'Carta Esqueleto Operário': { size: { 'Médio': 15 }, atq: 5 },
  'Carta Minorous': { size: { 'Grande': 15 }, atq: 5 },
  'Carta Cavaleiro Branco': { size: { 'Médio': 20, 'Grande': 20 } },
  'Carta Agnes': { size: { 'Pequeno': 15 } },
  'Carta Nihil': { size: { 'Pequeno': 15 } }, 
  
  'Carta Goblin': { race: { 'Bruto': 20 } },
  'Carta Peco Peco Ovo': { race: { 'Amorfo': 20 } },
  'Carta Strouf': { race: { 'Dragão': 20 } },
  'Carta Caramujo': { race: { 'Planta': 20 } },
  'Carta Flora': { race: { 'Peixe': 20 } },
  'Carta Hydra': { race: { 'Humanoide': 20 } },
  'Carta Peterson': { race: { 'Demônio': 20 } },
  
  'Carta Kaho': { element: { 'Terra': 20 } },
  'Carta Vadon': { element: { 'Fogo': 20 } },
  'Carta Drainliar': { element: { 'Agua': 20 } },
  'Carta Mandrágora': { element: { 'Vento': 20 } },
  'Carta Papai Noel': { element: { 'Sombrio': 20 } },
  'Carta Scorpion': { race: { 'Planta': 20 } }, 
  'Carta Pequeno Urso': { race: { 'Morto-Vivo': 20 } }, 
  'Carta Anaconda': { element: { 'Veneno': 20 } },
  'Carta Cavaleiro do Abismo': { mvp: 25 },
};

function getEquippedCardModifiers(mob) {
  const mods = { raca: 0, tamanho: 0, elemento: 0, atqFlat: 0 };
  if (!APP.simEquip) return mods;

  const mobRace = mob.raca || '';
  const mobSize = mob.tamanho || 'Médio';
  
  let mobElemStr = (mob.elemento || 'Neutro').split(' ')[0].trim();
  const elemMap = { 'Água': 'Agua', 'Maldito': 'Maldito', 'Fogo': 'Fogo', 'Terra': 'Terra', 'Vento': 'Vento', 'Veneno': 'Veneno', 'Sagrado': 'Sagrado', 'Sombrio': 'Sombrio', 'Fantasma': 'Fantasma', 'Neutro': 'Neutro' };
  const mobElem = elemMap[mobElemStr] || 'Neutro';

  const allCards = getAllEquippedItems();

  allCards.forEach(card => {
    const cardData = CARD_MODIFIERS[card.nome];

    // The database descriptions are the scalable source for equipment/card bonuses.
    // Explicit mappings remain as a fallback for descriptions that do not follow a pattern.
    if (!cardData) {
      const description = String(card.descricao || '');
      const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const race = normalize(mobRace);
      const size = normalize(mobSize);
      const element = normalize(mobElem);
      const patterns = [
        { key:'raca', regex:/Dano físico contra (?:monstros d[ae] raça|a raça)\s+([^+•.]+?)\s*\+(\d+)%/gi, target:race },
        { key:'elemento', regex:/Dano físico contra (?:monstros d[ae] propriedade|a propriedade)\s+([^+•.]+?)\s*\+(\d+)%/gi, target:element },
        { key:'tamanho', regex:/Dano físico contra (?:oponentes|monstros) de tamanho\s+(Pequeno|Médio|Grande)\s*\+(\d+)%/gi, target:size }
      ];
      patterns.forEach(({key,regex,target}) => {
        let match;
        while ((match = regex.exec(description))) {
          if (normalize(match[1]).includes(target) || target.includes(normalize(match[1]))) mods[key] += Number(match[2]) || 0;
        }
      });
      const flatAtq = [...description.matchAll(/(?:ATQ|Ataque)\s*\+(\d+)(?!%)/gi)].reduce((sum,m) => sum + Number(m[1]), 0);
      mods.atqFlat += flatAtq;
      return;
    }

    if (cardData.atq) mods.atqFlat += cardData.atq;

    if (cardData.mvp && mob.mvp) {
      mods.tamanho += cardData.mvp; 
    }

    if (cardData.race && cardData.race[mobRace]) {
      mods.raca += cardData.race[mobRace];
    }

    if (cardData.size && cardData.size[mobSize]) {
      mods.tamanho += cardData.size[mobSize];
    }

    if (cardData.element && cardData.element[mobElem]) {
      mods.elemento += cardData.element[mobElem];
    }
  });

  return mods;
}

// ─── Wiki synchronization report ─────────────
function initWikiSyncPage() {
  const refresh = $('wiki-report-refresh');
  if (!refresh) return;
  refresh.addEventListener('click', loadWikiSyncReport);
  $('wiki-report-search').addEventListener('input', debounce(renderWikiSyncEntries, 150));
  $('wiki-report-status').addEventListener('change', renderWikiSyncEntries);
  loadWikiSyncReport();
}

async function loadWikiSyncReport() {
  const list = $('wiki-report-list');
  const button = $('wiki-report-refresh');
  button.disabled = true;
  button.textContent = 'Carregando...';
  list.innerHTML = '<div class="loading-wrap"><div class="loading-spinner"></div><span>Lendo relatório da sincronização...</span></div>';
  try {
    const cacheKey = Date.now();
    const [response, overrideResponse] = await Promise.all([
      fetch(`wiki-sync-report.json?v=${cacheKey}`),
      fetch(`wiki-overrides.json?v=${cacheKey}`)
    ]);
    if (!response.ok) throw new Error('Relatório ainda não foi gerado');
    if (overrideResponse.ok) applyWikiOverrides(await overrideResponse.json());
    APP.wikiSyncReport = await response.json();
    renderWikiSyncReport();
  } catch (error) {
    APP.wikiSyncReport = null;
    $('wiki-sync-meta').innerHTML = '';
    $('wiki-sync-summary').innerHTML = '';
    list.innerHTML = `<div class="wiki-report-empty"><span>🔄</span><h3>Nenhum relatório disponível</h3><p>Execute <strong>wiki-preview.bat</strong> na pasta do projeto e clique em “Atualizar relatório”.</p></div>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Atualizar relatório';
  }
}

function renderWikiSyncReport() {
  const report = APP.wikiSyncReport;
  if (!report) return;
  const summary = report.summary || {};
  const generated = report.meta?.generated_at ? new Date(report.meta.generated_at).toLocaleString('pt-BR') : '—';
  const appliedRevision = APP.wikiOverrides?.meta?.revision;
  const isApplied = appliedRevision && Number(appliedRevision) === Number(report.meta?.source_revision);
  $('wiki-sync-meta').innerHTML = `
    <span class="wiki-sync-state ${isApplied ? 'applied' : 'pending'}"><i></i>${isApplied ? 'Revisão aplicada ao dashboard' : 'Relatório aguardando aplicação'}</span>
    <span>Revisão da wiki <b>${report.meta?.source_revision || '—'}</b></span>
    <span>Gerado em <b>${generated}</b></span>
    <span>Modo <b>${report.meta?.mode === 'apply' ? 'Aplicação' : 'Prévia'}</b></span>`;
  const cards = [
    ['matched','Correspondências seguras','✓'], ['matched_multiple','Múltiplas variações','≋'],
    ['conflict','Conflitos protegidos','!'], ['unmatched','Não encontrados','?']
  ];
  $('wiki-sync-summary').innerHTML = cards.map(([key,label,icon]) => `<button class="wiki-summary-card status-${key}" data-wiki-filter="${key}"><span>${icon}</span><strong>${summary[key] || 0}</strong><small>${label}</small></button>`).join('');
  $('wiki-sync-summary').querySelectorAll('[data-wiki-filter]').forEach(card => card.onclick = () => { $('wiki-report-status').value = card.dataset.wikiFilter; renderWikiSyncEntries(); });
  renderWikiSyncEntries();
}

function renderWikiSyncEntries() {
  const report = APP.wikiSyncReport;
  if (!report) return;
  const overrideRevision = Number(APP.wikiOverrides?.meta?.revision);
  const reportRevision = Number(report.meta?.source_revision);
  const revisionApplied = overrideRevision > 0 && reportRevision > 0 && overrideRevision === reportRevision;
  const query = $('wiki-report-search').value.trim().toLowerCase();
  const status = $('wiki-report-status').value;
  const labels = { matched:'Correspondência segura', matched_multiple:'Múltiplas variações', conflict:'Conflito - não aplicado', unmatched:'Não encontrado', already_current:'Já atualizado' };
  const entries = (report.entries || []).filter(entry => {
    if (status && entry.status !== status) return false;
    if (query && !entry.wiki_name?.toLowerCase().includes(query) && !(entry.matched_items || []).some(item => item.nome?.toLowerCase().includes(query))) return false;
    return true;
  });
  $('wiki-report-count').textContent = `${entries.length} registro${entries.length === 1 ? '' : 's'}`;
  $('wiki-report-list').innerHTML = entries.length ? entries.map(entry => {
    const safe = entry.status === 'matched' || entry.status === 'matched_multiple' || entry.status === 'already_current';
    const applied = revisionApplied && (entry.status === 'matched' || entry.status === 'matched_multiple');
    const matches = entry.matched_items || [];
    return `<article class="wiki-report-row status-${entry.status}">
      <div class="wiki-report-item"><span class="wiki-status-label">${applied ? 'Aplicado sobre o banco base' : (labels[entry.status] || entry.status)}</span><strong>${plainText(entry.wiki_name)}</strong><small>${matches.length ? matches.map(item => `#${item.id} ${plainText(item.nome)}`).join(' · ') : 'Sem item correspondente no banco'}</small></div>
      <div class="wiki-price-flow"><div><span>Banco base</span><b>${fmt(entry.before)} z</b></div><i>→</i><div><span>${applied ? 'Valor oficial em uso' : 'Wiki oficial'}</span><b>${fmt(entry.after)} z</b></div></div>
      <div class="wiki-row-result ${safe ? 'safe' : 'blocked'}">${applied ? '✓ Aplicado' : safe ? '✓ Seguro' : '⊘ Protegido'}</div>
    </article>`;
  }).join('') : '<div class="wiki-report-empty"><span>⌕</span><h3>Nenhum registro encontrado</h3><p>Ajuste a busca ou o filtro selecionado.</p></div>';
}

function matchupTone(value) {
  if (value > 1) return 'positive';
  if (value < 1) return 'negative';
  return 'neutral';
}

function renderMatchupBreakdown(data) {
  const pct = value => `${Math.round(value * 100)}%`;
  return `<div class="matchup-grid">
    <div class="matchup-card ${matchupTone(data.raceMod)}"><span>Raça do alvo</span><strong>${plainText(data.mobRace)}</strong><em>${pct(data.raceMod)}</em><small>${data.raceBonus ? `Bônus equipado +${data.raceBonus}%` : 'Sem modificador equipado'}</small></div>
    <div class="matchup-card ${matchupTone(data.sizeTotal)}"><span>Tamanho</span><strong>${plainText(data.mobSize)}</strong><em>${pct(data.sizeTotal)}</em><small>${plainText(data.weaponLabel)}: ${pct(data.sizeBase)}${data.sizeBonus ? ` · bônus +${data.sizeBonus}%` : ''}</small></div>
    <div class="matchup-card ${matchupTone(data.elementTotal)}"><span>Elemento defensivo</span><strong>${plainText(data.mobElement)} Nv.${data.mobElementLevel}</strong><em>${pct(data.elementTotal)}</em><small>Ataque ${plainText(data.attackElement)}: ${pct(data.elementBase)}${data.elementBonus ? ` · bônus +${data.elementBonus}%` : ''}</small></div>
    <div class="matchup-card total ${matchupTone(data.finalMod)}"><span>Eficiência final</span><strong>Multiplicador combinado</strong><em>${pct(data.finalMod)}</em><small>Raça × tamanho × elemento</small></div>
  </div>`;
}

function calculateHuntMetrics(mob) {
  const charLevel = Number($('sim-nivel')?.value) || 1;
  const charAtq = Number($('sim-atq')?.value) || 0;
  const weaponType = $('sim-arma-tipo')?.value || 'Desarmado';
  const attackElement = $('sim-arma-elemento')?.value || 'Neutro';
  const skillMult = (Number($('sim-skill-pct')?.value) || 100) / 100;
  const aspd = APP.character?.derived?.aspd || 150;
  const cardMods = getEquippedCardModifiers(mob);
  const elementMatch = String(mob.elemento || 'Neutro 1').match(/^(.+?)\s+(\d)$/);
  const defenseElementLabel = elementMatch?.[1] || 'Neutro';
  const defenseLevel = Math.max(1, Math.min(4, Number(elementMatch?.[2]) || 1));
  const elementMap = { 'Água':'Agua','Agua':'Agua','Neutro':'Neutro','Terra':'Terra','Fogo':'Fogo','Vento':'Vento','Veneno':'Veneno','Sagrado':'Sagrado','Sombrio':'Sombrio','Fantasma':'Fantasma','Maldito':'Maldito' };
  const defenseElement = elementMap[defenseElementLabel] || 'Neutro';
  const sizeBase = SIZE_PENALTY[weaponType]?.[mob.tamanho] ?? 1;
  const elementBase = ELEM_MULTI[defenseLevel]?.[defenseElement]?.[attackElement] ?? 1;
  const raceMod = 1 + cardMods.raca / 100;
  const sizeMod = sizeBase * (1 + cardMods.tamanho / 100);
  const elementMod = elementBase * (1 + cardMods.elemento / 100);
  const damage = elementMod <= 0 ? 0 : Math.max(1, Math.floor((charAtq * sizeMod - (mob.def || 0)) * raceMod * elementMod * skillMult));
  const requiredHit = (mob.nivel || 0) + (mob.agi || 0) + 20;
  const hitChance = Math.max(5, Math.min(100, 100 - (requiredHit - (Number($('sim-hit')?.value) || 0))));
  const requiredFlee = (mob.nivel || 0) + (mob.des || 0) + 75;
  const dodgeChance = Math.max(5, Math.min(95, 95 - (requiredFlee - (Number($('sim-flee')?.value) || 0))));
  const hits = damage > 0 ? Math.ceil((mob.hp || 1) / damage) : Infinity;
  const attacksPerSecond = 50 / Math.max(7, 200 - aspd);
  const ttk = Number.isFinite(hits) ? hits / Math.max(.05, attacksPerSecond * hitChance / 100) : Infinity;

  const spawns = APP.spawnsByMob?.get(mob.id) || [];
  const bestSpawn = spawns.reduce((best, spawn) => (Number(spawn.qtd) || 0) > (Number(best?.qtd) || 0) ? spawn : best, null);
  const density = Number(bestSpawn?.qtd) || 1;
  const densityFactor = Math.min(.96, .42 + Math.log2(density + 1) * .085);
  const killsHour = Number.isFinite(ttk) ? Math.min(3600, 3600 / Math.max(.8, ttk + 1.5) * densityFactor) : 0;

  const drops = (APP.dropsByMob?.get(mob.id) || []).map(drop => {
    const item = APP.itemById?.get(drop.item_id);
    const npcPrice = Number(item?.preco_venda) || 0;
    const expected = (Number(drop.chance) || 0) * npcPrice;
    return { name: drop.item || item?.nome || 'Item', chance: Number(drop.chance) || 0, npcPrice, expected };
  }).filter(drop => drop.npcPrice > 0).sort((a,b) => b.expected - a.expected);
  const rawZenyKill = drops.reduce((sum, drop) => sum + drop.expected, 0);
  const expPenalty = calcLevelPenalty(charLevel, mob.nivel || 1);
  return {
    damage, hitChance, dodgeChance, hits, ttk, killsHour, bestSpawn, density, densityFactor, drops,
    rawZenyKill, rawZenyHour: rawZenyKill * killsHour,
    baseExpHour: (mob.exp_base || 0) * expPenalty * killsHour,
    jobExpHour: (mob.exp_classe || 0) * expPenalty * killsHour,
    expPenalty, attacksPerSecond,
    combatScore: Number.isFinite(ttk) ? Math.round(Math.max(0, Math.min(100, 70 * Math.exp(-ttk / 18) + hitChance * .2 + (dodgeChance / 95 * 100) * .1))) : 0
  };
}

function percentileScore(values, current) {
  if (current <= 0 || !values.length) return 0;
  const less = values.filter(value => value < current).length;
  const equal = values.filter(value => value === current).length;
  return Math.round(100 * (less + equal * .5) / values.length);
}

function getHuntGrade(score) {
  if (score >= 90) return { label:'S', text:'Excepcional' };
  if (score >= 80) return { label:'A', text:'Excelente' };
  if (score >= 65) return { label:'B', text:'Muito boa' };
  if (score >= 50) return { label:'C', text:'Razoável' };
  if (score >= 35) return { label:'D', text:'Pouco eficiente' };
  return { label:'E', text:'Não recomendada' };
}

function buildHuntAssessment(mob) {
  const selected = calculateHuntMetrics(mob);
  const universe = APP.db.mobs.filter(candidate => !candidate.mvp).map(calculateHuntMetrics);
  const zenyScore = percentileScore(universe.map(metric => metric.rawZenyHour), selected.rawZenyHour);
  const expScore = selected.expPenalty ? percentileScore(universe.map(metric => metric.baseExpHour + metric.jobExpHour), selected.baseExpHour + selected.jobExpHour) : 0;
  const combatScore = selected.combatScore;
  const overall = Math.round(zenyScore * .45 + combatScore * .35 + expScore * .20);
  const grade = getHuntGrade(overall);
  const topDrops = selected.drops.slice(0,3);
  const ttkLabel = Number.isFinite(selected.ttk) ? `${selected.ttk.toFixed(1)}s` : 'Inviável';
  return `<section class="hunt-assessment grade-${grade.label.toLowerCase()}">
    <div class="hunt-score-hero"><div class="hunt-grade">${grade.label}</div><div><span class="sim-eyebrow">HUNT SCORE</span><strong>${overall}/100</strong><small>${grade.text} para a build atual</small></div><div class="hunt-weight-note">45% Zeny · 35% Combate · 20% EXP</div></div>
    <div class="hunt-score-grid">
      <div><span>Raw Zeny/h</span><strong>${fmt(Math.round(selected.rawZenyHour))} z</strong><small>${fmt(selected.rawZenyKill,2)} z esperados por abate · percentil ${zenyScore}</small></div>
      <div><span>Ritmo estimado</span><strong>${fmt(Math.round(selected.killsHour))} kills/h</strong><small>TTK ${ttkLabel} · ${selected.hitChance}% de acerto</small></div>
      <div><span>EXP Base/h</span><strong>${fmt(Math.round(selected.baseExpHour))}</strong><small>EXP Classe/h ${fmt(Math.round(selected.jobExpHour))} · percentil ${expScore}</small></div>
      <div><span>Melhor densidade</span><strong>${selected.density} mobs</strong><small>${plainText(selected.bestSpawn?.mapa_nome || 'Mapa não informado')} · ${plainText(selected.bestSpawn?.respawn || 'respawn desconhecido')}</small></div>
    </div>
    <div class="hunt-subscore-row"><span>Combate <b>${combatScore}</b></span><i style="--score:${combatScore}%"></i><span>Raw Zeny <b>${zenyScore}</b></span><i style="--score:${zenyScore}%"></i><span>Experiência <b>${expScore}</b></span><i style="--score:${expScore}%"></i></div>
    <div class="hunt-drop-value"><span>Maiores contribuições ao Raw Zeny</span>${topDrops.length ? topDrops.map(drop => `<div><strong>${plainText(drop.name)}</strong><small>${(drop.chance*100).toFixed(drop.chance < .001 ? 3 : 2)}% × ${fmt(drop.npcPrice)} z</small><b>${fmt(drop.expected,2)} z/kill</b></div>`).join('') : '<small>Nenhum drop com preço de venda ao NPC foi encontrado.</small>'}</div>
    <p class="hunt-disclaimer">Projeção comparativa: considera ataques contínuos, melhor mapa conhecido, preço NPC base e valor esperado dos drops. Deslocamento, competição, consumíveis e tempo de loot ainda não são descontados.</p>
  </section>`;
}

// ── Character Builder: a normalized layer over the legacy simulator ──
const CHARACTER_SLOTS = [
  { key: 'headTop', label: 'Topo', positions: ['Topo da Cabeça'] },
  { key: 'headMid', label: 'Meio', positions: ['Meio da Cabeça'] },
  { key: 'headLow', label: 'Baixo', positions: ['Baixo da Cabeça'] },
  { key: 'garment', label: 'Capa', positions: ['Capa'] },
  { key: 'shoes', label: 'Sapatos', positions: ['Sapatos'] },
  { key: 'accessory1', label: 'Acessório 1', positions: ['Acessório'] },
  { key: 'accessory2', label: 'Acessório 2', positions: ['Acessório'] }
];

function plainText(value = '') {
  return String(value).replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' })[c]);
}

function parseItemEffects(item) {
  const text = String(item?.descricao || '').replace(/\s+/g, ' ');
  const effects = { str:0, agi:0, vit:0, int:0, dex:0, luk:0, atq:0, def: Number(item?.def)||0, hit:0, flee:0, hp:0, sp:0, aspd:0, labels:[] };
  const rules = [
    ['str', /(?:FOR|Força)\s*\+(\d+)/gi, 'FOR'], ['agi', /AGI\s*\+(\d+)/gi, 'AGI'],
    ['vit', /VIT\s*\+(\d+)/gi, 'VIT'], ['int', /INT\s*\+(\d+)/gi, 'INT'],
    ['dex', /DES\s*\+(\d+)/gi, 'DES'], ['luk', /SOR\s*\+(\d+)/gi, 'SOR'],
    ['atq', /(?:ATQ|Ataque)\s*\+(\d+)/gi, 'ATQ'], ['hit', /(?:Precisão|HIT)\s*\+(\d+)/gi, 'HIT'],
    ['flee', /(?:Esquiva(?! Perfeita)|FLEE)\s*\+(\d+)/gi, 'FLEE'],
    ['hp', /(?:Máx\. HP|HP máximo)\s*\+(\d+)/gi, 'HP'], ['sp', /(?:Máx\. SP|SP máximo)\s*\+(\d+)/gi, 'SP'],
    ['aspd', /(?:ASPD|Velocidade de ataque)\s*\+(\d+)/gi, 'ASPD']
  ];
  rules.forEach(([key, regex, label]) => {
    let match; let total = 0;
    while ((match = regex.exec(text))) total += Number(match[1]) || 0;
    if (total) { effects[key] += total; effects.labels.push(`${label} +${total}`); }
  });
  if (effects.def) effects.labels.push(`DEF +${effects.def}`);
  const percentRules = [
    /Dano físico contra (?:a raça |a propriedade )?([^+.]+?)\s*\+(\d+)%/gi,
    /Dano (?:físico|mágico)\s*\+(\d+)%/gi,
    /(?:ATQ|Ataque)\s*\+(\d+)%/gi
  ];
  percentRules.forEach(regex => { let match; while ((match = regex.exec(text))) effects.labels.push(match[2] ? `Dano vs ${match[1].trim()} +${match[2]}%` : `Dano +${match[1]}%`); });
  return effects;
}

function getAllEquippedItems() {
  const base = [APP.simEquip.weapon, APP.simEquip.shield, APP.simEquip.armor];
  const cards = [...(APP.simEquip.weaponCards||[]), ...(APP.simEquip.shieldCards||[]), ...(APP.simEquip.armorCards||[])];
  return [...base, ...Object.values(APP.simEquip.extra || {}), ...cards].filter(Boolean);
}

function aggregateCharacterEffects() {
  return getAllEquippedItems().reduce((sum, item) => {
    const effect = parseItemEffects(item);
    Object.keys(sum).forEach(key => { if (key !== 'labels') sum[key] += effect[key] || 0; });
    sum.labels.push(...effect.labels.map(label => `${item.nome}: ${label}`));
    return sum;
  }, { str:0,agi:0,vit:0,int:0,dex:0,luk:0,atq:0,def:0,hit:0,flee:0,hp:0,sp:0,aspd:0,labels:[] });
}

function initCharacterBuilder() {
  const host = $('sim-extra-equipment');
  if (!host) return;
  let savedExtra = {};
  try { savedExtra = JSON.parse(localStorage.getItem('aureum_character_extra') || '{}'); } catch (_) {}
  APP.simEquip.extra = {};
  Object.entries(savedExtra).forEach(([key,id]) => { const item = APP.db.items.find(i => i.id === id); if (item) APP.simEquip.extra[key] = item; });

  const renderExtra = () => {
    host.innerHTML = CHARACTER_SLOTS.map(slot => {
      const item = APP.simEquip.extra[slot.key];
      return `<div class="quick-slot" data-slot="${slot.key}"><span class="quick-slot-title">${slot.label}</span><strong class="quick-slot-value">${item ? plainText(item.nome) + (item.slots ? ` [${item.slots}]` : '') : 'Vazio'}</strong>${item ? `<button data-remove="${slot.key}" aria-label="Remover">×</button>` : ''}<div class="finder-search-wrap"><input class="filter-input extra-equip-search" data-key="${slot.key}" placeholder="Buscar item..." autocomplete="off"><div class="finder-suggestions"></div></div></div>`;
    }).join('');
    host.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => { delete APP.simEquip.extra[button.dataset.remove]; persistAndRefresh(); renderExtra(); });
    host.querySelectorAll('.extra-equip-search').forEach(input => {
      const suggestions = input.nextElementSibling;
      input.addEventListener('input', debounce(() => {
        const q = input.value.trim().toLowerCase();
        const slot = CHARACTER_SLOTS.find(s => s.key === input.dataset.key);
        if (q.length < 2) { suggestions.classList.remove('open'); return; }
        const matches = APP.db.items.filter(item => item.tipo === 'Equipamento' && slot.positions.some(p => String(item.posicao||'').includes(p)) && item.nome?.toLowerCase().includes(q)).slice(0,8);
        suggestions.innerHTML = matches.map(item => `<div class="suggestion-item" data-id="${item.id}">${plainText(item.nome)}${item.slots ? ` [${item.slots}]` : ''}${item.def ? ` · DEF ${item.def}` : ''}</div>`).join('');
        suggestions.classList.toggle('open', !!matches.length);
        suggestions.querySelectorAll('[data-id]').forEach(row => row.onclick = () => { APP.simEquip.extra[input.dataset.key] = APP.db.items.find(i => i.id === Number(row.dataset.id)); persistAndRefresh(); renderExtra(); });
      }, 180));
    });
  };

  const persistAndRefresh = () => {
    localStorage.setItem('aureum_character_extra', JSON.stringify(Object.fromEntries(Object.entries(APP.simEquip.extra).map(([k,v]) => [k,v.id]))));
    refreshCharacterSummary();
  };

  const statIds = ['sim-str','sim-agi','sim-vit','sim-int','sim-dex','sim-luk'];
  let baseSaved = {};
  try { baseSaved = JSON.parse(localStorage.getItem('aureum_character_base') || '{}'); } catch (_) {}
  statIds.forEach(id => { if (baseSaved[id] != null) $(id).value = baseSaved[id]; $(id).addEventListener('input', () => { localStorage.setItem('aureum_character_base', JSON.stringify(Object.fromEntries(statIds.map(k => [k,$(k).value])))); refreshCharacterSummary(); }); });

  $('sim-build-save').onclick = saveCharacterBuild;
  $('sim-build-new').onclick = () => { statIds.forEach(id => $(id).value = 1); APP.simEquip.weapon=null; APP.simEquip.shield=null; APP.simEquip.armor=null; APP.simEquip.weaponCards=[]; APP.simEquip.shieldCards=[]; APP.simEquip.armorCards=[]; APP.simEquip.extra = {}; $('sim-build-name').value = 'Nova build'; APP.renderSimulatorEquipment?.(); persistAndRefresh(); renderExtra(); };
  $('sim-build-select').onchange = e => { if (e.target.value) loadCharacterBuild(e.target.value, renderExtra); };
  document.addEventListener('click', e => { if (e.target.closest('#sim-tab-equip-content')) setTimeout(refreshCharacterSummary, 0); });
  renderExtra(); renderBuildSelect(); refreshCharacterSummary();
}

function refreshCharacterSummary() {
  if (!$('sim-derived-strip')) return;
  const bonus = aggregateCharacterEffects();
  const level = Number($('sim-nivel').value) || 1;
  const str = (Number($('sim-str').value)||1) + bonus.str;
  const agi = (Number($('sim-agi').value)||1) + bonus.agi;
  const dex = (Number($('sim-dex').value)||1) + bonus.dex;
  const luk = (Number($('sim-luk').value)||1) + bonus.luk;
  const weaponAtq = Number(APP.simEquip.weapon?.atq)||0;
  const atq = Math.floor(str + str*str/100 + dex/5 + luk/3 + weaponAtq + bonus.atq);
  const hit = Math.floor(level + dex + luk/3 + bonus.hit);
  const flee = Math.floor(level + agi + bonus.flee);
  const aspd = Math.min(193, Math.floor(150 + agi/5 + dex/10 + bonus.aspd));
  $('sim-atq').value = atq; $('sim-hit').value = hit; $('sim-flee').value = flee;
  $('sim-derived-strip').innerHTML = [['ATQ',atq],['HIT',hit],['FLEE',flee],['ASPD',aspd]].map(([label,value]) => `<div class="derived-stat"><b>${value}</b><span>${label}</span></div>`).join('');
  $('sim-auto-effects').innerHTML = bonus.labels.length ? bonus.labels.map(label => `<span class="effect-chip">${plainText(label)}</span>`).join('') : '<span class="effect-empty">Equipe itens para ver os bônus.</span>';
  APP.character = { level, stats:{str,agi,dex,luk}, derived:{atq,hit,flee,aspd}, equipment:Object.fromEntries(getAllEquippedItems().map(i => [i.id,i.nome])), effects:bonus };
  $('sim-build-status').textContent = `${getAllEquippedItems().length} itens/cartas · ${bonus.labels.length} efeitos automáticos · salvo neste navegador`;
  if (APP.currentSimMob) runSimulation(APP.currentSimMob);
}

function readBuildStore() { try { return JSON.parse(localStorage.getItem('aureum_character_builds') || '{}'); } catch (_) { return {}; } }
function renderBuildSelect() { const select=$('sim-build-select'); if(!select)return; const builds=readBuildStore(); select.innerHTML='<option value="">Builds salvas</option>'+Object.entries(builds).map(([id,b])=>`<option value="${id}">${plainText(b.name)}</option>`).join(''); }
function saveCharacterBuild() {
  const builds=readBuildStore(), name=$('sim-build-name').value.trim()||'Minha build', id=String(Date.now());
  builds[id]={name,base:Object.fromEntries(['sim-nivel','sim-classe','sim-str','sim-agi','sim-vit','sim-int','sim-dex','sim-luk','sim-skill-pct','sim-arma-elemento'].map(k=>[k,$(k)?.value])),equip:{weapon:APP.simEquip.weapon?.id,shield:APP.simEquip.shield?.id,armor:APP.simEquip.armor?.id,weaponCards:(APP.simEquip.weaponCards||[]).map(c=>c?.id),shieldCards:(APP.simEquip.shieldCards||[]).map(c=>c?.id),armorCards:(APP.simEquip.armorCards||[]).map(c=>c?.id),extra:Object.fromEntries(Object.entries(APP.simEquip.extra||{}).map(([k,v])=>[k,v.id]))}};
  localStorage.setItem('aureum_character_builds',JSON.stringify(builds)); renderBuildSelect(); $('sim-build-select').value=id; $('sim-build-status').textContent=`${name} salva com sucesso.`;
}
function loadCharacterBuild(id, renderExtra) {
  const build=readBuildStore()[id]; if(!build)return; Object.entries(build.base||{}).forEach(([k,v])=>{if($(k))$(k).value=v}); const find=id=>APP.db.items.find(i=>i.id===id)||null;
  APP.simEquip.weapon=find(build.equip.weapon); APP.simEquip.shield=find(build.equip.shield); APP.simEquip.armor=find(build.equip.armor); APP.simEquip.weaponCards=(build.equip.weaponCards||[]).map(find); APP.simEquip.shieldCards=(build.equip.shieldCards||[]).map(find); APP.simEquip.armorCards=(build.equip.armorCards||[]).map(find); APP.simEquip.extra=Object.fromEntries(Object.entries(build.equip.extra||{}).map(([k,v])=>[k,find(v)]).filter(([,v])=>v)); $('sim-build-name').value=build.name; localStorage.setItem('aureum_character_extra',JSON.stringify(build.equip.extra||{})); APP.renderSimulatorEquipment?.(); renderExtra(); refreshCharacterSummary();
}

function runSimulation(mob) {
  const container = $('sim-battle-results');
  container.style.display = 'block';
  const arenaStatus = document.querySelector('.arena-status');
  if (arenaStatus) arenaStatus.innerHTML = `<i></i> Analisando ${plainText(mob.nome)}`;

  const charNivel = parseInt($('sim-nivel').value) || 1;
  const charHit = parseInt($('sim-hit').value) || 0;
  const charFlee = parseInt($('sim-flee').value) || 0;
  
  const cardMods = getEquippedCardModifiers(mob);
  
  // sim-atq is already the consolidated value from stats, equipment and cards.
  const charAtq = parseInt($('sim-atq').value) || 0;
  const skillPct = parseInt($('sim-skill-pct').value) || 100;
  const armaTipo = $('sim-arma-tipo').value;
  const armaElem = $('sim-arma-elemento').value;
  
  const bRaca = cardMods.raca;
  const bTamanho = cardMods.tamanho;
  const bElemento = cardMods.elemento;

  const reqHit = (mob.nivel || 0) + (mob.agi || 0) + 20;
  const reqFlee = (mob.nivel || 0) + (mob.des || 0) + 75;

  let hitChance = 100 - (reqHit - charHit);
  hitChance = Math.max(5, Math.min(100, hitChance));

  let dodgeChance = 95 - (reqFlee - charFlee);
  dodgeChance = Math.max(5, Math.min(95, dodgeChance));

  // --- SMART ENGINE ---
  let mobElemStr = (mob.elemento || 'Neutro').split(' ')[0].trim();
  let mobElemLvl = parseInt((mob.elemento || '').replace(/^\D+/g, '')) || 1;
  mobElemLvl = Math.max(1, Math.min(4, mobElemLvl));

  const elemMap = { 'Água': 'Agua', 'Maldito': 'Maldito', 'Fogo': 'Fogo', 'Terra': 'Terra', 'Vento': 'Vento', 'Veneno': 'Veneno', 'Sagrado': 'Sagrado', 'Sombrio': 'Sombrio', 'Fantasma': 'Fantasma', 'Neutro': 'Neutro' };
  const mobElem = elemMap[mobElemStr] || 'Neutro';
  const mobTamanho = mob.tamanho || 'Médio';

  const sizeMod = (SIZE_PENALTY[armaTipo] && SIZE_PENALTY[armaTipo][mobTamanho]) ? SIZE_PENALTY[armaTipo][mobTamanho] : 1.0;
  
  const levelMatrix = ELEM_MULTI[mobElemLvl] || ELEM_MULTI[1];
  // PDF: row = monster defense element; column = attack element.
  const elemMod = (levelMatrix[mobElem] && levelMatrix[mobElem][armaElem] != null) ? levelMatrix[mobElem][armaElem] : 1.0;

  const raceMod = 1 + (bRaca / 100);
  const sizeTotal = sizeMod * (1 + bTamanho / 100);
  const elementTotal = elemMod * (1 + bElemento / 100);
  const finalMod = raceMod * sizeTotal * elementTotal;
  const skillMult = (skillPct / 100);

  let estDano = ((charAtq * sizeTotal) - (mob.def || 0)) * raceMod * elementTotal * skillMult;
  estDano = finalMod <= 0 ? 0 : Math.max(1, Math.floor(estDano));
  if (charAtq === 0) estDano = 0; 

  const matchupData = {
    mobRace: mob.raca || 'Desconhecida', mobSize: mobTamanho, mobElement: mobElemStr,
    mobElementLevel: mobElemLvl, attackElement: armaElem,
    weaponLabel: APP.simEquip.weapon?.subtipo || armaTipo,
    raceBonus: bRaca, sizeBonus: bTamanho, elementBonus: bElemento,
    raceMod, sizeBase: sizeMod, sizeTotal, elementBase: elemMod, elementTotal, finalMod
  };
  const preview = $('sim-matchup-preview');
  if (preview) { preview.className = ''; preview.innerHTML = renderMatchupBreakdown(matchupData); }

  let hitsToKill = (estDano > 0) ? Math.ceil((mob.hp || 1) / estDano) : '∞';
  const huntAssessmentHtml = buildHuntAssessment(mob);

  let tipHtml = '';
  if (elemMod > 1.0) {
    tipHtml += `<div style="color:var(--success); font-size:12px; margin-top:10px;">💡 Ótima escolha! ${armaElem} causa ${Math.round(elemMod * 100)}% de dano em ${mobElemStr} (Nv.${mobElemLvl}).</div>`;
  } else if (elemMod < 1.0) {
    tipHtml += `<div style="color:var(--danger); font-size:12px; margin-top:10px;">⚠️ Compatibilidade elemental: ${armaElem} contra ${mobElemStr} (Nv.${mobElemLvl}) aplica ${Math.round(elemMod * 100)}%.</div>`;
  }
  if (sizeMod < 1.0) {
    tipHtml += `<div style="color:var(--warning); font-size:12px; margin-top:5px;">⚠️ Penalidade de tamanho: ${matchupData.weaponLabel} aplica ${Math.round(sizeMod * 100)}% em alvos de tamanho ${mobTamanho}.</div>`;
  }
  
  const activeMods = [];
  if (cardMods.atqFlat > 0) activeMods.push(`+${cardMods.atqFlat} ATQ de Cartas`);
  if (cardMods.tamanho > 0) activeMods.push(`+${cardMods.tamanho}% vs Tamanho`);
  if (cardMods.raca > 0) activeMods.push(`+${cardMods.raca}% vs Raça`);
  if (cardMods.elemento > 0) activeMods.push(`+${cardMods.elemento}% vs Elemento`);
  if (activeMods.length > 0) {
    tipHtml += `<div style="color:var(--gold); font-size:11px; margin-top:5px; font-style:italic;">🛡️ Efeitos de Cartas ativos: ${activeMods.join(', ')}.</div>`;
  }

  const levelWarning = (mob.nivel - charNivel >= 20) ? 
    `<div style="color:var(--danger); font-size:12px; margin-top:10px;">⚠️ Alvo 20+ níveis acima (Você não receberá EXP!)</div>` : '';

  container.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; gap:30px; margin-top:20px;">
      
      <!-- Lado Jogador -->
      <div style="text-align:center;">
        <div style="font-size:40px;">🤺</div>
        <div style="color:var(--gold); font-weight:bold; margin-top:10px;">Nível ${charNivel}</div>
        <div style="font-size:12px; color:var(--text-muted);">HIT: ${charHit} | FLEE: ${charFlee}</div>
        <div style="font-size:12px; color:var(--text-muted);">ATQ: ${charAtq}</div>
      </div>

      <!-- VS -->
      <div style="font-size:24px; font-weight:bold; color:var(--text-muted);">VS</div>

      <!-- Lado Monstro -->
      <div style="text-align:center; cursor:pointer;" class="clickable-sim-mob" data-mob-id="${mob.id}">
        <div style="width:60px; height:60px; margin:0 auto; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid var(--border);">
          <img src="https://static.divine-pride.net/images/mobs/png/${mob.id}.png" referrerpolicy="no-referrer" alt="${mob.nome}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='https://placehold.co/60x60/1e2330/d4a843?text=Mob'; this.onerror=null;">
        </div>
        <div style="color:var(--danger); font-weight:bold; margin-top:10px;">${mob.nome}</div>
        <div style="font-size:12px; color:var(--text-muted);">Nv ${mob.nivel} | HP ${fmt(mob.hp)}</div>
      </div>
    </div>
    ${levelWarning}
    ${huntAssessmentHtml}

    <div style="margin-top:20px; background:rgba(255,255,255,0.02); border:1px solid var(--gold); padding:15px; border-radius:var(--radius); text-align:center;">
      ${renderMatchupBreakdown(matchupData)}
      <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase;">Estimativa de Dano por Hit</div>
      <div style="font-size:32px; color:var(--gold); font-weight:bold; margin:5px 0;">${estDano}</div>
      <div style="font-size:13px; color:var(--text-secondary);">Serão necessários <span style="color:white; font-weight:bold;">${hitsToKill}</span> acertos para derrotar.</div>
      ${tipHtml}
    </div>

    <div style="margin-top:20px; background:rgba(0,0,0,0.2); padding:15px; border-radius:var(--radius); border:1px solid var(--border);">
      <div style="margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="font-size:14px;">Sua Chance de Acerto</span>
          <span style="color:var(${hitChance >= 100 ? '--gold' : 'white'}); font-weight:bold;">${hitChance}%</span>
        </div>
        <div style="width:100%; background:var(--bg-card); height:8px; border-radius:4px; overflow:hidden;">
          <div style="width:${hitChance}%; background:var(--gold); height:100%; transition:width 0.5s;"></div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); text-align:left; margin-top:4px;">Para 100%, você precisa de ${reqHit} HIT.</div>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="font-size:14px;">Sua Chance de Esquiva</span>
          <span style="color:var(${dodgeChance >= 95 ? '--success' : 'white'}); font-weight:bold;">${dodgeChance}%</span>
        </div>
        <div style="width:100%; background:var(--bg-card); height:8px; border-radius:4px; overflow:hidden;">
          <div style="width:${(dodgeChance/95)*100}%; background:var(--success); height:100%; transition:width 0.5s;"></div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); text-align:left; margin-top:4px;">Para 95% (máximo), você precisa de ${reqFlee} FLEE.</div>
      </div>
    </div>
  `;

  const mobCard = container.querySelector('.clickable-sim-mob');
  if (mobCard) {
    mobCard.onclick = () => {
      openMobModal(mob.id);
    };
  }
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
        <button class="btn-primary" id="btn-sim-from-modal" style="margin-top:10px; padding:4px 10px; font-size:12px;">⚔️ Simular Combate</button>
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

  const btnSim = $('btn-sim-from-modal');
  if (btnSim) {
    btnSim.addEventListener('click', () => {
      closeModal();
      switchPage('simulator');
      APP.currentSimMob = mob;
      runSimulation(mob);
    });
  }

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
      label: item._wiki_source ? 'Venda NPC · Wiki oficial' : 'Venda NPC',
      standard: `${fmt(sellStandard)} z`,
      special: `${fmt(sellOvercharge)} z (Superf. Nv.10)`,
      note: item._wiki_source && item._base_preco_venda !== item.preco_venda ? `Banco base: ${fmt(item._base_preco_venda)} z · revisão ${item._wiki_source.revision}` : ''
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
        ${item._wiki_source ? `<a class="wiki-source-badge" href="${item._wiki_source.url}" target="_blank" rel="noopener">✓ Preço oficial da Wiki · rev. ${item._wiki_source.revision}</a>` : ''}
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
              ${shop.note ? `<div class="wiki-price-note">${shop.note}</div>` : ''}
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

    <div class="modal-map-preview-container" style="display:flex; justify-content:center; margin: 16px 0; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; overflow: hidden; align-items:center;">
      <img src="https://www.divine-pride.net/img/map/original/${mapData.id}" referrerpolicy="no-referrer" alt="${mapData.nome}" style="max-width: 100%; max-height: 250px; object-fit: contain; border-radius: 4px;" onerror="this.closest('.modal-map-preview-container').style.display='none';">
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
