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
    almas:    { page: 1, perPage: 40, filtered: [], rarity: 'all' },
    mapas:    { page: 1, perPage: 24, filtered: [] },
    mapCollection: { page: 1, perPage: 18, filtered: [] },
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
  character: null,
  activeBuildId: null
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
let communityVoteConfig = { mode: 'demo', apiUrl: '', turnstileSiteKey: '' };
let communityVoteTotals = {};
let communityVotePending = false;

function getCommunityVoterId() {
  let id = localStorage.getItem('aureum_community_voter');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('aureum_community_voter', id);
  }
  return id;
}

function getLocalPatchVotes() {
  try { return JSON.parse(localStorage.getItem('aureum_patch_votes') || '{}'); }
  catch { return {}; }
}

function saveLocalPatchVotes(votes) {
  localStorage.setItem('aureum_patch_votes', JSON.stringify(votes));
}

function patchVoteMarkup(entry) {
  const id = String(entry.id);
  const totals = communityVoteTotals[id] || { up: 0, down: 0 };
  const selected = Number(getLocalPatchVotes()[id] || 0);
  return `<div class="patchnote-votes" data-patch-id="${escapePatchText(id)}">
    <span class="patchnote-vote-question">Esta mudança foi útil?</span>
    <button class="patch-vote-btn up ${selected === 1 ? 'selected' : ''}" data-vote="1" type="button" aria-label="Gostei">
      <span>▲</span><strong>${fmt(totals.up)}</strong>
    </button>
    <button class="patch-vote-btn down ${selected === -1 ? 'selected' : ''}" data-vote="-1" type="button" aria-label="Não gostei">
      <span>▼</span><strong>${fmt(totals.down)}</strong>
    </button>
  </div>`;
}

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
          ${patchVoteMarkup(entry)}
        </div>
      </article>`;
  }).join('');
}

async function loadCommunityVoteConfig() {
  try {
    const response = await fetch('community-votes-config.json');
    if (response.ok) communityVoteConfig = await response.json();
  } catch { /* modo local continua disponível */ }
}

async function loadCommunityVoteTotals() {
  if (!communityVoteConfig.apiUrl || communityVoteConfig.mode !== 'community' || !patchNotesData) return;
  const ids = (patchNotesData.entries || []).map(entry => entry.id).filter(Boolean).join(',');
  const response = await fetch(`${communityVoteConfig.apiUrl.replace(/\/$/, '')}/votes?ids=${encodeURIComponent(ids)}`);
  if (!response.ok) throw new Error('Contagem comunitária indisponível');
  communityVoteTotals = (await response.json()).totals || {};
}

function ensureTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-aureum-turnstile]');
    if (existing) { existing.addEventListener('load', () => resolve(window.turnstile), { once: true }); return; }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.aureumTurnstile = 'true';
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function getTurnstileToken() {
  const turnstile = await ensureTurnstile();
  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    container.className = 'community-turnstile';
    document.body.appendChild(container);
    let widgetId;
    const cleanup = () => {
      if (widgetId != null) turnstile.remove(widgetId);
      container.remove();
    };
    widgetId = turnstile.render(container, {
      sitekey: communityVoteConfig.turnstileSiteKey,
      size: 'flexible',
      appearance: 'interaction-only',
      execution: 'execute',
      theme: 'dark',
      action: 'patch_vote',
      callback: token => { cleanup(); resolve(token); },
      'error-callback': () => { cleanup(); reject(new Error('Verificação indisponível')); },
      'expired-callback': () => { cleanup(); reject(new Error('Verificação expirada')); }
    });
    turnstile.execute(widgetId);
  });
}

function showPatchVoteMessage(button, message, isError = false) {
  const group = button.closest('.patchnote-votes');
  let status = group.querySelector('.patch-vote-status');
  if (!status) {
    status = document.createElement('span');
    status.className = 'patch-vote-status';
    group.appendChild(status);
  }
  status.classList.toggle('error', isError);
  status.textContent = message;
  clearTimeout(status._timer);
  status._timer = setTimeout(() => status.remove(), 2600);
}

async function handlePatchVote(button) {
  if (communityVotePending) return;
  const group = button.closest('.patchnote-votes');
  const patchId = group.dataset.patchId;
  const votes = getLocalPatchVotes();
  const requested = Number(button.dataset.vote);
  const previous = Number(votes[patchId] || 0);
  const value = previous === requested ? 0 : requested;
  communityVotePending = true;
  group.classList.add('is-pending');

  try {
    let totals = communityVoteTotals[patchId] || { up: 0, down: 0 };
    if (communityVoteConfig.mode === 'community' && communityVoteConfig.apiUrl && communityVoteConfig.turnstileSiteKey) {
      const token = await getTurnstileToken();
      const response = await fetch(`${communityVoteConfig.apiUrl.replace(/\/$/, '')}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patchId, value, voterId: getCommunityVoterId(), turnstileToken: token })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível registrar o voto.');
      totals = result.totals;
    } else {
      totals = { ...totals };
      if (previous === 1) totals.up = Math.max(0, totals.up - 1);
      if (previous === -1) totals.down = Math.max(0, totals.down - 1);
      if (value === 1) totals.up += 1;
      if (value === -1) totals.down += 1;
    }
    communityVoteTotals[patchId] = totals;
    if (value) votes[patchId] = value; else delete votes[patchId];
    saveLocalPatchVotes(votes);
    group.querySelector('.up strong').textContent = fmt(totals.up);
    group.querySelector('.down strong').textContent = fmt(totals.down);
    group.querySelector('.up').classList.toggle('selected', value === 1);
    group.querySelector('.down').classList.toggle('selected', value === -1);
    showPatchVoteMessage(button, value ? 'Voto registrado' : 'Voto removido');
  } catch (error) {
    showPatchVoteMessage(button, error.message || 'Tente novamente.', true);
  } finally {
    communityVotePending = false;
    group.classList.remove('is-pending');
  }
}

async function fetchPatchNotes() {
  if (patchNotesData) return patchNotesData;
  const response = await fetch(`wiki-patchnotes.json?v=${Date.now()}`);
  if (!response.ok) throw new Error('Snapshot de Patch Notes indisponível');
  patchNotesData = await response.json();
  if ($('patchnotesTriggerLabel')) $('patchnotesTriggerLabel').textContent = `Novidades · ${fmt(patchNotesData.meta?.totalEntries || 0)}`;
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
      await loadCommunityVoteTotals().catch(() => {});
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
  $('patchnotesFeed').addEventListener('click', event => {
    const button = event.target.closest('.patch-vote-btn');
    if (button) handlePatchVote(button);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && overlay.classList.contains('open')) closePanel(); });
  $$('.patchnotes-tabs button').forEach(button => button.addEventListener('click', () => {
    patchNotesFilter = button.dataset.patchFilter;
    $$('.patchnotes-tabs button').forEach(tab => tab.classList.toggle('active', tab === button));
    renderPatchNotes();
  }));
  loadCommunityVoteConfig().then(() => fetchPatchNotes()).catch(() => {});
}

async function loadData() {
  const [res, collectionResponse] = await Promise.all([fetch('db.json'), fetch('map-collections.json')]);
  APP.db = await res.json();
  APP.mapCollections = collectionResponse.ok
    ? await collectionResponse.json()
    : { cities: [], collections: [] };
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

  const almasList = APP.db.items.filter(i => Number(i.id) >= 2000000);
  const normalItemsList = APP.db.items.filter(i => Number(i.id) < 2000000);
  APP.db.almas = almasList;

  $('total-mobs').textContent = APP.db.mobs.length;
  $('total-items').textContent = normalItemsList.length;
  if ($('total-almas')) $('total-almas').textContent = almasList.length;
  $('total-drops').textContent = APP.db.drops.length;

  populateFilters();
  initAllPages();
  initGlobalSearch();
  initOptimizer();
  initItemFinder();
  initMobCompare();
  initBuffCatalog();
  initSimulator();
  initCharacterBuilder();
  initCharacterPage();
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
  const itemTypes = [...new Set(APP.db.items.filter(i => i.id < 2000000).map(i => i.tipo).filter(Boolean))].sort();

  const mobRaca = $('mob-raca');
  racas.forEach(r => { const o = new Option(r, r); mobRaca.add(o); });

  const mobElem = $('mob-elemento');
  elems.forEach(e => { const o = new Option(e, e); mobElem.add(o); });

  const itemTipo = $('item-tipo');
  itemTypes.forEach(t => { const o = new Option(t, t); itemTipo.add(o); });
}

// ─── Navigation ───────────────────────────────
function initNav() {
  $$('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      const page = el.dataset.page;
      if (!page) return;
      e.preventDefault();
      navigateTo(page);
    });
  });

  window.addEventListener('popstate', (e) => {
    const pageFromState = e.state?.page;
    const pageFromHash = location.hash.replace('#', '');
    const targetPage = pageFromState || pageFromHash || 'monstros';
    if (targetPage) {
      navigateTo(targetPage, { pushHistory: false });
    }
  });

  const initialHash = location.hash.replace('#', '');
  if (initialHash && $('page-' + initialHash)) {
    navigateTo(initialHash, { pushHistory: false });
  } else {
    history.replaceState({ page: APP.currentPage || 'monstros' }, '', '#' + (APP.currentPage || 'monstros'));
  }
}

function navigateTo(page, options = {}) {
  const { pushHistory = true } = options;
  if (!page) return;

  APP.currentPage = page;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $$('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));

  if (pushHistory) {
    const currentHash = location.hash.replace('#', '');
    if (currentHash !== page) {
      history.pushState({ page }, '', '#' + page);
    }
  }

  const normalItemsCount = APP.db.items.filter(i => Number(i.id) < 2000000).length;
  const titles = {
    monstros: ['Monstros', `${APP.db.mobs.length} monstros no banco de dados`],
    drops: ['Drops por Monstro', `${APP.db.drops.length} relações entre monstros e itens`],
    itens: ['Enciclopédia de Itens', `${normalItemsCount} fichas de itens no catálogo`],
    almas: ['Sistema de Almas', `${(APP.db.almas || []).length} almas de monstros catalogadas`],
    mapas: ['Mapas', `${APP.db.maps.length} mapas disponíveis`],
    'map-collection': ['Coleção de Mapas', `${APP.mapCollections?.collections?.length || 0} coleções com progresso local`],
    character: ['Painel do Personagem', 'Crie, equipe e salve sua build antes de simular'],
    simulator: ['Simulador de Batalha', 'Analise sua build salva contra qualquer monstro'],
    'farm-optimizer': ['Otimizador de Farm', 'Encontre os melhores mobs para seu personagem'],
    'farm-journal': ['Metas & Diário de Farm', 'Calculadora de metas e diário de sessões reais de hunt'],
    'item-finder': ['Onde Farmar Item', 'Descubra onde dropar qualquer item'],
    'mob-compare': ['Comparar Monstros', 'Compare mobs lado a lado'],
    'wiki-sync': ['Sincronização Wiki', 'Revisão visual dos dados oficiais do AureumRO'],
  };
  const [title, sub] = titles[page] || [page, ''];
  $('pageTitle').textContent = title;
  $('pageSubtitle').textContent = sub;

  if (page === 'farm-journal') {
    if (typeof initJournal === 'function') initJournal();
    const buildName = $('sim-build-name')?.value?.trim() || 'Build ativa';
    const charLevel = Number($('sim-nivel')?.value) || 1;
    if ($('journal-build-status')) {
      $('journal-build-status').textContent = `${buildName} · Nv. ${charLevel} · ${$('sim-arma-elemento')?.value || 'Neutro'}`;
    }
  }

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
  initAlmasPage();
  initMapasPage();
  initMapCollectionPage();
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
    if (Number(i.id) >= 2000000) return false;
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
        <img src="${getItemIconUrl(it.id, 'item')}" referrerpolicy="no-referrer" alt="" style="width:24px;height:24px;object-fit:contain;flex-shrink:0;" onerror="this.src='https://placehold.co/24x24/1e2330/d4a843?text=Item'; this.onerror=null;">
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
// PAGE: SISTEMA DE ALMAS
// ═══════════════════════════════════════════════
function getAlmaRarity(item) {
  let mobId = typeof item.dropado_por === 'number' ? item.dropado_por : null;
  if (!mobId && Array.isArray(item.dropado_por) && item.dropado_por.length) {
    mobId = item.dropado_por[0];
  }
  if (!mobId && APP.dropsByMob) {
    const d = APP.db.drops?.find(drop => drop.item_id === item.id);
    if (d) mobId = d.mob_id;
  }
  const mob = mobId ? APP.db.mobs?.find(m => m.id === mobId) : null;
  const nameUpper = (item.nome || '').toUpperCase();

  if (mob?.mvp || nameUpper.includes(' MVP') || nameUpper.includes('BAPHOMET') || nameUpper.includes('BEELZEBUB') || nameUpper.includes('AMON RA') || nameUpper.includes('ATROCE') || nameUpper.includes('FARAÓ') || nameUpper.includes('MAYA') || nameUpper.includes('DRAKE') || nameUpper.includes('EDDGA') || nameUpper.includes('OSÍRIS') || nameUpper.includes('FREEONI') || nameUpper.includes('FLOR DO LUAR')) {
    return 'mvp';
  }

  if (nameUpper.includes('ANGELING') || nameUpper.includes('DEVILING') || nameUpper.includes('GHOSTRING') || nameUpper.includes('MASTERING') || nameUpper.includes('EREMES') || nameUpper.includes('MINI') || nameUpper.includes('ARCHANGELING')) {
    return 'mini';
  }

  return 'normal';
}

function initAlmasPage() {
  const onChange = debounce(filterAndRenderAlmas, 200);
  if ($('alma-search')) $('alma-search').addEventListener('input', onChange);
  if ($('alma-sort')) $('alma-sort').addEventListener('change', onChange);

  const pills = $$('#alma-rarity-filters .filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      APP.pages.almas.rarity = pill.dataset.rarity || 'all';
      filterAndRenderAlmas();
    });
  });

  filterAndRenderAlmas();
}

function filterAndRenderAlmas() {
  const q = $('alma-search')?.value.toLowerCase().trim() || '';
  const rarityFilter = APP.pages.almas.rarity || 'all';
  const sort = $('alma-sort')?.value || 'nome';

  const almas = APP.db.almas || APP.db.items.filter(i => Number(i.id) >= 2000000);

  let list = almas.filter(item => {
    const rarity = getAlmaRarity(item);
    if (rarityFilter !== 'all' && rarity !== rarityFilter) return false;
    if (q) {
      const matchName = item.nome?.toLowerCase().includes(q);
      const matchDesc = item.descricao?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (sort === 'raridade') {
      const rank = { mvp: 3, mini: 2, normal: 1 };
      const diff = rank[getAlmaRarity(b)] - rank[getAlmaRarity(a)];
      if (diff !== 0) return diff;
    }
    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  APP.pages.almas.filtered = list;
  APP.pages.almas.page = 1;
  if ($('alma-count')) $('alma-count').textContent = `${list.length} alma${list.length !== 1 ? 's' : ''}`;
  renderAlmasGrid();
}

function renderAlmasGrid() {
  const state = APP.pages.almas;
  const { page, perPage, filtered } = state;
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  const grid = $('almaGrid');
  if (!grid) return;

  if (!slice.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">✨</div><p>Nenhuma Alma encontrada para estes filtros.</p></div>';
    if ($('almaPagination')) $('almaPagination').innerHTML = '';
    return;
  }

  const rarityLabelMap = {
    normal: { text: 'Azul · Normal', class: 'badge-blue' },
    mini:   { text: 'Roxo · Mini-Chefe', class: 'badge-purple' },
    mvp:    { text: 'Vermelho · MVP', class: 'badge-red' }
  };

  grid.innerHTML = slice.map(alma => {
    const rarity = getAlmaRarity(alma);
    const rarityMeta = rarityLabelMap[rarity];
    const iconUrl = getItemIconUrl(alma.id, 'item');
    
    const cleanDesc = (alma.descricao || '')
      .replace(/Alma cristalizada de um monstro\.\s*•\s*/i, '')
      .replace(/Encaixe num espaco de Alma[^•]*•\s*/i, '')
      .replace(/So 1 efeito de cada alma por personagem\./i, '')
      .trim();

    return `<article class="alma-list-item rare-${rarity} clickable-card" data-id="${alma.id}">
      <div class="alma-list-icon">
        <img src="${iconUrl}" alt="${alma.nome}" onerror="this.src='https://placehold.co/44x44/1e2330/d4a843?text=Alma'; this.onerror=null;">
      </div>
      <div class="alma-list-content">
        <div class="alma-list-head">
          <h3>${alma.nome}</h3>
          <span class="alma-rarity-badge ${rarityMeta.class}">${rarityMeta.text}</span>
        </div>
        <p><b>Bônus:</b> ${cleanDesc || alma.descricao || 'Concede poder permanente no equipamento.'}</p>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.clickable-card').forEach(card => {
    card.addEventListener('click', () => openItemModal(parseInt(card.dataset.id)));
  });

  renderPagination('almaPagination', state, renderAlmasGrid);
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
  const racas = [...new Set(APP.db.mobs.map(m => m.raca).filter(Boolean))].sort();
  const raceSelect = $('ideal-raca');
  racas.forEach(r => raceSelect.add(new Option(r, r)));
  $('btn-optimize').addEventListener('click', runOptimizer);
  ['ideal-focus', 'ideal-raca', 'ideal-tamanho', 'ideal-safe-only'].forEach(id => $(id)?.addEventListener('change', runOptimizer));
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

APP.favoriteFarms = JSON.parse(localStorage.getItem('aureum_favorite_farms') || '[]');
APP.compareList = [];

function toggleFavoriteFarm(mobId) {
  const idx = APP.favoriteFarms.indexOf(mobId);
  if (idx >= 0) {
    APP.favoriteFarms.splice(idx, 1);
  } else {
    APP.favoriteFarms.push(mobId);
  }
  localStorage.setItem('aureum_favorite_farms', JSON.stringify(APP.favoriteFarms));
  runOptimizer();
}

function toggleCompareMob(mobId) {
  const idx = APP.compareList.indexOf(mobId);
  if (idx >= 0) {
    APP.compareList.splice(idx, 1);
  } else {
    if (APP.compareList.length >= 3) {
      alert('Você pode comparar no máximo 3 farms simultaneamente.');
      return;
    }
    APP.compareList.push(mobId);
  }
  updateCompareDock();
}

function updateCompareDock() {
  const dock = $('farm-compare-dock');
  const countEl = $('farm-compare-count');
  if (!dock || !countEl) return;

  countEl.textContent = APP.compareList.length;
  dock.style.display = APP.compareList.length > 0 ? 'flex' : 'none';

  document.querySelectorAll('.btn-toggle-compare').forEach(btn => {
    const id = Number(btn.dataset.id);
    const isComparing = APP.compareList.includes(id);
    btn.textContent = isComparing ? '⚖️ Rem. Comparativo' : '⚖️ Comparar';
    btn.style.color = isComparing ? 'var(--gold-light)' : 'var(--text-secondary)';
  });
}

function renderCompareModal() {
  const content = $('farmCompareContent');
  const overlay = $('farmCompareOverlay');
  if (!content || !overlay) return;

  if (APP.compareList.length === 0) return;

  const mobs = APP.compareList.map(id => APP.db.mobs.find(m => m.id === id)).filter(Boolean);
  const metrics = mobs.map(m => calculateHuntMetrics(m));

  let html = `
    <table class="breakdown-table" style="width:100%; border-collapse:collapse; font-size:12px;">
      <thead>
        <tr style="border-bottom:1px solid var(--gold);">
          <th style="padding:10px; text-align:left;">Métrica</th>
          ${mobs.map(m => `<th style="padding:10px; text-align:center; color:var(--gold-light);">${plainText(m.nome)} (Nv.${m.nivel})</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Mapa Principal</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${plainText(m.bestSpawn?.mapa_nome || 'N/I')}</td>`).join('')}
        </tr>
        <tr class="breakdown-row total">
          <td style="padding:8px; font-weight:bold;">Raw Zeny Líquido/h</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center; color:var(--gold-light); font-weight:bold;">${fmt(Math.round(m.netZenyHour))} z</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">EXP Total/h (Base+Job)</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${fmt(Math.round(m.baseExpHour + m.jobExpHour))}</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Ritmo de Abates</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${fmt(Math.round(m.killsHour))} kills/h</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Tempo p/ Derrotar (TTK)</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${Number.isFinite(m.ttk) ? m.ttk.toFixed(1) + 's' : '—'}</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Precisão (HIT %)</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${m.hitChance}%</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Esquiva (FLEE %)</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${m.dodgeChance}%</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Custo de Poções/h</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center; color:${m.itemizedCosts.potionCostHour > 0 ? 'var(--danger)' : 'var(--success)'};">${fmt(m.itemizedCosts.potionCostHour)} z</td>`).join('')}
        </tr>
        <tr class="breakdown-row">
          <td style="padding:8px; font-weight:bold;">Tempo até 50% Peso</td>
          ${metrics.map(m => `<td style="padding:8px; text-align:center;">${Number.isFinite(m.hoursToFill50) ? (m.hoursToFill50 * 60).toFixed(0) + ' min' : '∞'}</td>`).join('')}
        </tr>
      </tbody>
    </table>
  `;

  content.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function initCompareEvents() {
  $('btn-open-compare-modal')?.addEventListener('click', renderCompareModal);
  $('btn-clear-compare')?.addEventListener('click', () => {
    APP.compareList = [];
    updateCompareDock();
  });
  $('farmCompareClose')?.addEventListener('click', () => {
    const overlay = $('farmCompareOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
}

function generateRecommendationReasons(entry, goal) {
  const m = entry.metrics;
  const mob = entry.mob;
  const reasons = [];

  const currentArmaElem = $('sim-arma-elemento')?.value || 'Neutro';
  let mobElemStr = (mob.elemento || 'Neutro').split(' ')[0].trim();
  let mobElemLvl = parseInt((mob.elemento || '').replace(/^\D+/g, '')) || 1;
  mobElemLvl = Math.max(1, Math.min(4, mobElemLvl));
  const elemMod = ELEM_MULTI[mobElemLvl]?.[currentArmaElem]?.[mobElemStr] ?? 1;

  if (elemMod > 1.0) {
    reasons.push(`⚡ <b>Vantagem Elemental:</b> ${currentArmaElem} causa ${(elemMod * 100).toFixed(0)}% de dano em ${mobElemStr}`);
  }

  if (m.drops.length > 0) {
    const topDrop = m.drops[0];
    const dropShare = m.rawZenyKill > 0 ? Math.round((topDrop.expected / m.rawZenyKill) * 100) : 0;
    if (dropShare > 25) {
      reasons.push(`💰 <b>Drop Principal:</b> ${plainText(topDrop.name)} representa ${dropShare}% do zeny/h`);
    }
  }

  if (m.dodgeChance >= 85) {
    reasons.push(`🛡️ <b>Alta Segurança:</b> Esquiva ${m.dodgeChance}% (quase zero consumo de poções)`);
  }

  if (m.bestSpawn && m.bestSpawn.qtd >= 40) {
    reasons.push(`🎒 <b>Alta Densidade:</b> ${m.bestSpawn.qtd} mobs no mapa ${plainText(m.bestSpawn.mapa_nome || '')}`);
  }

  if (!m.bestSpawn) {
    reasons.push(`⚠️ <b>Spawn Parcial:</b> Ritmo usa estimativa base por falta de mapa cadastrado`);
  }

  return reasons;
}

function renderProgressionTimeline() {
  const container = $('farm-progression-timeline');
  if (!container) return;

  const charLevel = Number($('sim-nivel')?.value) || 1;
  const tiers = [
    { label: 'Tier 1: Início', minLvl: 1, maxLvl: 30, desc: 'Evolução rápida' },
    { label: 'Tier 2: Transição', minLvl: 31, maxLvl: 60, desc: 'Primeiros drops' },
    { label: 'Tier 3: Mid-game', minLvl: 61, maxLvl: 85, desc: 'Alta densidade' },
    { label: 'Tier 4: Endgame', minLvl: 86, maxLvl: 175, desc: 'Máximo retorno' }
  ];

  const allMobs = (APP.db?.mobs || []).filter(m => !m.mvp);

  container.innerHTML = tiers.map(tier => {
    const isCurrentTier = charLevel >= tier.minLvl && charLevel <= tier.maxLvl;
    const candidates = allMobs.filter(m => (m.nivel || 1) >= tier.minLvl && (m.nivel || 1) <= tier.maxLvl);
    
    let bestMob = null;
    let maxScore = -1;

    candidates.forEach(m => {
      const metric = calculateHuntMetrics(m);
      const score = metric.combatScore + (metric.netZenyHour > 0 ? 20 : 0);
      if (score > maxScore) {
        maxScore = score;
        bestMob = { mob: m, metric };
      }
    });

    if (!bestMob) return '';

    const mapId = bestMob.metric.bestSpawn?.mapa_id;
    return `
      <div class="timeline-step ${isCurrentTier ? 'active' : ''}" data-mob-id="${bestMob.mob.id}" data-map-id="${mapId || ''}" style="background:${isCurrentTier ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${isCurrentTier ? 'var(--gold)' : 'var(--border)'}; border-radius:10px; padding:10px 12px; transition:transform 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:10px; font-weight:700; color:${isCurrentTier ? 'var(--gold-light)' : 'var(--text-muted)'}; text-transform:uppercase;">${tier.label}</span>
          ${isCurrentTier ? '<span class="sim-badge conf-complete" style="font-size:9px; padding:1px 5px;">Seu Nível</span>' : ''}
        </div>
        <div style="font-size:13px; font-weight:bold; color:var(--text-primary);">${plainText(bestMob.mob.nome)} (Nv.${bestMob.mob.nivel})</div>
        <small style="display:block; color:var(--text-secondary); font-size:10px; margin-top:2px; margin-bottom:8px;">
          ${plainText(bestMob.metric.bestSpawn?.mapa_nome || 'Mapa N/I')} · ~${fmt(Math.round(bestMob.metric.netZenyHour))}z/h
        </small>
        <div style="display:flex; gap:6px;">
          ${mapId ? `<button type="button" class="btn-timeline-map" data-map-id="${mapId}" style="flex:1; font-size:9.5px; padding:3px 6px; background:rgba(212,168,67,0.12); border:1px solid rgba(212,168,67,0.3); border-radius:4px; color:var(--gold-light); cursor:pointer;">🗺️ Ver Mapa</button>` : `<button type="button" class="btn-timeline-mob" data-mob-id="${bestMob.mob.id}" style="flex:1; font-size:9.5px; padding:3px 6px; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:4px; color:var(--text-secondary); cursor:pointer;">🔍 Ver Monstro</button>`}
          <button type="button" class="btn-timeline-sim" data-mob-id="${bestMob.mob.id}" style="flex:1; font-size:9.5px; padding:3px 6px; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); border-radius:4px; color:#6ee7b7; cursor:pointer;">⚔️ Simular</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-timeline-map').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openMapModal(btn.dataset.mapId);
    };
  });

  container.querySelectorAll('.btn-timeline-mob').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openMobModal(Number(btn.dataset.mobId));
    };
  });

  container.querySelectorAll('.btn-timeline-sim').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const mob = APP.db.mobs.find(m => m.id === Number(btn.dataset.mobId));
      if (!mob) return;
      navigateTo('simulator');
      $('sim-mob-search').value = mob.nome;
      APP.currentSimMob = mob;
      runSimulation(mob);
    };
  });
}

function runOptimizer() {
  const raca = $('ideal-raca')?.value || '';
  const tamanho = $('ideal-tamanho')?.value || '';
  const focus = $('ideal-focus')?.value || 'all';
  const levelRange = Number($('ideal-level-range')?.value) || 10;
  const safeOnly = $('ideal-safe-only')?.checked || false;
  const charLevel = Number($('sim-nivel')?.value) || 1;
  const results = $('optimizer-results');
  if (!results) return;

  const buildName = $('sim-build-name')?.value?.trim() || 'Build ativa';
  if ($('farm-ideal-build')) {
    $('farm-ideal-build').textContent = `${buildName} · Nv. ${charLevel} · ${$('sim-arma-elemento')?.value || 'Neutro'}`;
  }

  renderProgressionTimeline();
  initCompareEvents();

  const candidates = APP.db.mobs.filter(mob => {
    if (mob.mvp || calcLevelPenalty(charLevel, mob.nivel || 1) === 0) return false;
    if (levelRange !== 999 && Math.abs((mob.nivel || 1) - charLevel) > levelRange) return false;
    if (raca && mob.raca !== raca) return false;
    if (tamanho && mob.tamanho !== tamanho) return false;
    return true;
  }).map(mob => ({ mob, metrics: calculateHuntMetrics(mob) }));

  const pool = safeOnly ? candidates.filter(entry => entry.metrics.safetyScore >= 55) : candidates;
  if (!pool.length) {
    results.innerHTML = '<div class="empty-state"><div class="icon">🧭</div><p>Nenhum mob atende a estes filtros com a build ativa na faixa de nível selecionada.</p></div>';
    return;
  }

  const values = {
    zeny: pool.map(entry => entry.metrics.netZenyHour),
    exp: pool.map(entry => entry.metrics.baseExpHour + entry.metrics.jobExpHour),
    combat: pool.map(entry => entry.metrics.combatScore),
    safety: pool.map(entry => entry.metrics.safetyScore)
  };

  const scoreFor = (entry, goal) => {
    const zeny = percentileScore(values.zeny, entry.metrics.netZenyHour);
    const exp = percentileScore(values.exp, entry.metrics.baseExpHour + entry.metrics.jobExpHour);
    const combat = percentileScore(values.combat, entry.metrics.combatScore);
    const safety = percentileScore(values.safety, entry.metrics.safetyScore);
    const weights = goal === 'zeny' ? [0.60,0.08,0.16,0.16] : goal === 'xp' ? [0.08,0.55,0.20,0.17] : goal === 'target_drop' ? [0.40,0.10,0.30,0.20] : [0.34,0.24,0.25,0.17];
    return Math.round(zeny * weights[0] + exp * weights[1] + combat * weights[2] + safety * weights[3]);
  };

  const goals = focus === 'all' ? ['balanced', 'zeny', 'xp', 'target_drop'] : [focus];
  const labels = {
    balanced:['Equilíbrio','Melhor combinação de retorno, combate e segurança'],
    zeny:['Raw zeny','Maior retorno NPC líquido para sua build'],
    xp:['Experiência','Maior ritmo de EXP sem penalidade de nível'],
    target_drop:['Drops Específicos','Menor tempo/esforço estimado para obter o item alvo']
  };

  const card = (entry, goal) => {
    const m = entry.metrics;
    const score = scoreFor(entry, goal);
    const reason = goal === 'zeny' ? `${fmt(Math.round(m.netZenyHour))} z líquido/h` : goal === 'xp' ? `${fmt(Math.round(m.baseExpHour + m.jobExpHour))} EXP total/h` : `Score ${score}/100 · segurança ${m.safetyScore}/100`;
    const isFav = APP.favoriteFarms.includes(entry.mob.id);
    const isComp = APP.compareList.includes(entry.mob.id);
    const reasons = generateRecommendationReasons(entry, goal);

    const mapId = m.bestSpawn?.mapa_id;
    return `<article class="farm-ideal-card" data-id="${entry.mob.id}">
      <div class="farm-ideal-rank">
        <span>${score}</span>
        <small>score</small>
        <button type="button" class="btn-fav-farm" data-id="${entry.mob.id}" style="background:none; border:none; cursor:pointer; font-size:14px; margin-top:4px;" title="Favoritar">${isFav ? '⭐' : '☆'}</button>
      </div>
      <div class="farm-ideal-card-main">
        <span class="sim-eyebrow">${labels[goal][0]}</span>
        <h3 class="btn-card-mob-title" data-mob-id="${entry.mob.id}" style="cursor:pointer;" title="Ver estatísticas do monstro">${plainText(entry.mob.nome)} 🔍</h3>
        <p>${plainText(entry.mob.elemento)} · ${plainText(entry.mob.raca)} · ${plainText(entry.mob.tamanho)} · Nv. ${entry.mob.nivel}</p>
        <b>${reason}</b>
        ${reasons.length ? `<div style="margin-top:6px; display:flex; flex-direction:column; gap:2px; font-size:10px; color:var(--text-muted);">${reasons.map(r => `<div>${r}</div>`).join('')}</div>` : ''}
      </div>
      <div class="farm-ideal-metrics">
        <span>TTK <b>${Number.isFinite(m.ttk) ? m.ttk.toFixed(1) + 's' : '—'}</b></span>
        <span>Hits <b>${m.hits}</b></span>
        <span>Mapa ${mapId ? `<b class="btn-card-map-link" data-map-id="${mapId}" style="cursor:pointer; color:var(--gold-light); text-decoration:underline;" title="Abrir mapa com todos os mobs e drops">🗺️ ${plainText(m.bestSpawn?.mapa_nome)}</b>` : `<b>${plainText(m.bestSpawn?.mapa_nome || '—')}</b>`}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <button type="button" class="btn-sim-target">Simular alvo →</button>
        ${mapId ? `<button type="button" class="btn-view-map" data-map-id="${mapId}" style="font-size:10px; padding:3px 6px; background:rgba(212,168,67,0.1); border:1px solid rgba(212,168,67,0.3); border-radius:4px; cursor:pointer; color:var(--gold-light);">🗺️ Detalhes do Mapa</button>` : `<button type="button" class="btn-view-mob" data-mob-id="${entry.mob.id}" style="font-size:10px; padding:3px 6px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:4px; cursor:pointer; color:var(--text-secondary);">🔍 Ver Monstro</button>`}
        <button type="button" class="btn-toggle-compare" data-id="${entry.mob.id}" style="font-size:10px; padding:3px 6px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:4px; cursor:pointer; color:${isComp ? 'var(--gold-light)' : 'var(--text-secondary)'};">${isComp ? '⚖️ Rem. Comparativo' : '⚖️ Comparar'}</button>
      </div>
    </article>`;
  };

  results.innerHTML = `<div class="farm-ideal-summary">${pool.length} mobs avaliados para ${plainText(buildName)}. Clique em uma recomendação para abrir a simulação completa.</div>${goals.map(goal => {
    const best = [...pool].sort((a,b) => scoreFor(b,goal) - scoreFor(a,goal)).slice(0,3);
    return `<section class="farm-ideal-group"><header><div><span class="sim-eyebrow">${labels[goal][0]}</span><h3>${labels[goal][1]}</h3></div><span>Top ${best.length}</span></header>${best.map(entry => card(entry, goal)).join('')}</section>`;
  }).join('')}`;

  results.querySelectorAll('.btn-sim-target').forEach(btn => {
    btn.onclick = (e) => {
      const cardEl = e.target.closest('.farm-ideal-card');
      const mob = APP.db.mobs.find(candidate => candidate.id === Number(cardEl.dataset.id));
      if (!mob) return;
      navigateTo('simulator');
      $('sim-mob-search').value = mob.nome;
      APP.currentSimMob = mob;
      runSimulation(mob);
    };
  });

  results.querySelectorAll('.btn-view-map, .btn-card-map-link').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openMapModal(btn.dataset.mapId);
    };
  });

  results.querySelectorAll('.btn-view-mob, .btn-card-mob-title').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openMobModal(Number(btn.dataset.mobId));
    };
  });

  results.querySelectorAll('.btn-fav-farm').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleFavoriteFarm(Number(btn.dataset.id));
    };
  });

  results.querySelectorAll('.btn-toggle-compare').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleCompareMob(Number(btn.dataset.id));
    };
  });

  updateCompareDock();
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

// ═══════════════════════════════════════════════
// SKILL DATA TABLE — Fase 2: Motor de Combate Auditável
// Cada skill possui:
//   name: Nome exibido
//   type: physical | magical | ranged | hybrid
//   levels: array de multiplicadores (lv1–lv10). Usado como SKILL_DATA[key].levels[level-1]
//   hits: número de hits por uso
//   sp: array de custo SP por nível, ou número fixo
//   ignoresDefense: ignora hard+soft DEF/MDEF
//   ignoresFlee: nunca erra
//   special: função customizada (recebe context) — apenas para fórmulas únicas
//   confidence: 'validated' | 'estimated' — qualidade da fórmula
// ═══════════════════════════════════════════════
const SKILL_DATA = {
  basico: {
    name: 'Ataque Básico', type: 'physical', levels: [1.0], hits: 1,
    sp: [0], confidence: 'validated'
  },
  bash: {
    name: 'Bash', type: 'physical',
    levels: [1.3, 1.6, 1.9, 2.2, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0],
    hits: 1, sp: [8,8,8,8,8,15,15,15,15,15], confidence: 'validated'
  },
  shield_charge: {
    name: 'Shield Charge', type: 'physical',
    levels: [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.5], hits: 1,
    sp: [12,12,12,12,12,12,12,12], confidence: 'estimated'
  },
  bowling_bash: {
    name: 'Bowling Bash', type: 'physical',
    levels: [1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.2, 4.6, 5.0],
    hits: 2, sp: [13,14,15,16,17,18,19,20,21,22], confidence: 'validated'
  },
  spiral_pierce: {
    name: 'Spiral Pierce', type: 'physical',
    levels: [1.5, 2.0, 2.5, 3.0, 3.5], hits: 5,
    sp: [18,21,24,27,30], confidence: 'estimated',
    special: 'spiral'
  },
  shield_boomerang: {
    name: 'Shield Boomerang', type: 'physical',
    levels: [1.3, 1.6, 1.9, 2.2, 2.5], hits: 1,
    sp: [12,12,12,12,12], confidence: 'estimated',
    special: 'shieldBoomerang'
  },
  holy_cross: {
    name: 'Holy Cross', type: 'physical',
    levels: [1.35, 1.7, 2.05, 2.4, 2.75, 3.1, 3.45, 3.8, 4.15, 4.5],
    hits: 1, sp: [11,11,11,11,11,11,11,11,11,11], confidence: 'estimated'
  },
  grand_cross: {
    name: 'Grand Cross', type: 'hybrid',
    levels: [1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4],
    hits: 3, sp: [37,44,51,58,65,72,79,86,93,100], confidence: 'estimated',
    special: 'grandCross'
  },
  fire_bolt: {
    name: 'Fire Bolt', type: 'magical',
    levels: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    hits: [1,2,3,4,5,6,7,8,9,10], sp: [12,14,16,18,20,22,24,26,28,30], confidence: 'validated'
  },
  cold_bolt: {
    name: 'Cold Bolt', type: 'magical',
    levels: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    hits: [1,2,3,4,5,6,7,8,9,10], sp: [12,14,16,18,20,22,24,26,28,30], confidence: 'validated'
  },
  storm_gust: {
    name: 'Storm Gust', type: 'magical',
    levels: [2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2, 5.6, 5.0],
    hits: 3, sp: [78,78,78,78,78,78,78,78,78,78], confidence: 'estimated'
  },
  lord_of_vermilion: {
    name: 'Lord of Vermilion', type: 'magical',
    levels: [1.6, 1.9, 2.2, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 3.3],
    hits: 4, sp: [60,64,68,72,76,80,84,88,92,96], confidence: 'estimated'
  },
  holy_light: {
    name: 'Holy Light', type: 'magical',
    levels: [1.25], hits: 1, sp: [15], confidence: 'validated'
  },
  magnus: {
    name: 'Magnus Exorcismus', type: 'magical',
    levels: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.3],
    hits: [1,1,2,2,3,3,4,4,5,5], sp: [40,40,40,40,40,40,40,40,40,40], confidence: 'estimated'
  },
  double_attack: {
    name: 'Double Attack', type: 'physical',
    levels: [1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0], hits: 2,
    sp: [0,0,0,0,0,0,0], confidence: 'estimated'
  },
  backstab: {
    name: 'Backstab', type: 'physical',
    levels: [3.4, 3.8, 4.2, 4.6, 5.0, 5.4, 5.8, 6.2, 6.6, 7.0],
    hits: 1, sp: [16,16,16,16,16,16,16,16,16,16],
    ignoresFlee: true, confidence: 'estimated'
  },
  raid: {
    name: 'Raid', type: 'physical',
    levels: [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0],
    hits: 1, sp: [20,20,20,20,20,20,20,20,20,20], confidence: 'estimated'
  },
  sonic_blow: {
    name: 'Sonic Blow', type: 'physical',
    levels: [1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.2, 4.6, 8.0],
    hits: 8, sp: [16,18,20,22,24,26,28,30,32,34], confidence: 'estimated'
  },
  soul_destroyer: {
    name: 'Soul Destroyer', type: 'hybrid',
    levels: [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 5.0],
    hits: 1, sp: [20,22,24,26,28,30,32,34,36,38],
    ignoresDefense: true, confidence: 'estimated',
    special: 'soulDestroyer'
  },
  occult_impaction: {
    name: 'Occult Impaction', type: 'physical',
    levels: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 4.75, 4.75],
    hits: 1, sp: [10,10,10,10,14,14,14,14,18,18],
    ignoresDefense: true, confidence: 'estimated',
    special: 'occult'
  },
  asura: {
    name: 'Asura Strike', type: 'physical',
    levels: [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 8.0],
    hits: 1, sp: [0,0,0,0,0,0,0,0,0,0],
    ignoresDefense: true, ignoresFlee: true, confidence: 'estimated',
    special: 'asura'
  },
  acid_demo: {
    name: 'Acid Demonstration', type: 'hybrid',
    levels: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    hits: 10, sp: [30,30,30,30,30,30,30,30,30,30],
    ignoresDefense: true, ignoresFlee: true, confidence: 'estimated',
    special: 'acidDemo'
  },
  mammonite: {
    name: 'Mammonite', type: 'physical',
    levels: [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0],
    hits: 1, sp: [5,5,5,5,5,5,5,5,5,5], confidence: 'estimated'
  },
  cart_rev: {
    name: 'Cart Revolution', type: 'physical',
    levels: [1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.5],
    hits: 1, sp: [12,12,12,12,12,12,12,12,12,12], confidence: 'estimated'
  },
  cart_termination: {
    name: 'Cart Termination', type: 'physical',
    levels: [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0], hits: 1,
    sp: [15,15,15,15,15,15,15,15], confidence: 'estimated'
  },
  double_strafe: {
    name: 'Double Strafe', type: 'ranged',
    levels: [1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9],
    hits: 2, sp: [12,12,12,12,12,12,12,12,12,12], confidence: 'estimated'
  },
  focused_arrow: {
    name: 'Focused Arrow Strike', type: 'ranged',
    levels: [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0],
    hits: 1, sp: [18,18,18,18,18,18,18,18,18,18], confidence: 'estimated'
  },
  arrow_vulcan: {
    name: 'Arrow Vulcan', type: 'ranged',
    levels: [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 8.0, 9.0, 9.0, 9.0],
    hits: 9, sp: [12,14,16,18,20,22,24,26,28,30], confidence: 'estimated'
  },
  rapid_shower: {
    name: 'Rapid Shower', type: 'ranged',
    levels: [1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 2.1, 2.4, 2.7, 5.0],
    hits: 5, sp: [22,22,22,22,22,22,22,22,22,22], confidence: 'estimated'
  },
  tracking: {
    name: 'Tracking', type: 'ranged',
    levels: [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 10.0, 10.0],
    hits: 1, sp: [15,20,25,30,35,40,45,50,55,60], confidence: 'estimated'
  },
  throw_shuriken: {
    name: 'Throw Shuriken', type: 'ranged',
    levels: [1.1, 1.2, 1.3, 1.4, 1.5], hits: 1,
    sp: [2,2,2,2,2], confidence: 'estimated',
    special: 'shuriken'
  },
  tornado_kick: {
    name: 'Tornado Kick', type: 'physical',
    levels: [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0],
    hits: 1, sp: [14,14,14,14,14,14,14,14,14,14], confidence: 'estimated'
  },
  kaahi: {
    name: 'Kaahi', type: 'physical',
    levels: [1.0], hits: 1, sp: [0], confidence: 'estimated'
  }
};

// ─── Helpers para SKILL_DATA ──────────────────
function getSkillInfo(skillKey, level) {
  const skill = SKILL_DATA[skillKey] || SKILL_DATA.basico;
  const lvl = Math.max(1, Math.min(level || 1, skill.levels.length));
  const mult = skill.levels[lvl - 1] ?? skill.levels[skill.levels.length - 1];
  const hits = Array.isArray(skill.hits) ? (skill.hits[lvl - 1] ?? skill.hits[skill.hits.length - 1]) : skill.hits;
  const spArr = Array.isArray(skill.sp) ? skill.sp : [skill.sp];
  const spCost = spArr[lvl - 1] ?? spArr[spArr.length - 1] ?? 0;
  const isMagic = skill.type === 'magical' || skill.type === 'hybrid';
  const isRanged = skill.type === 'ranged';
  return { skill, level: lvl, mult, hits, spCost, isMagic, isRanged, type: skill.type, ignoresDefense: !!skill.ignoresDefense, ignoresFlee: !!skill.ignoresFlee, confidence: skill.confidence || 'estimated', special: skill.special || null };
}

function getDamageTypeBadge(type) {
  switch (type) {
    case 'physical': return { icon: '⚔️', label: 'Físico Melee', cls: 'dtype-physical' };
    case 'ranged':   return { icon: '🏹', label: 'Físico à Distância', cls: 'dtype-ranged' };
    case 'magical':  return { icon: '✨', label: 'Mágico', cls: 'dtype-magical' };
    case 'hybrid':   return { icon: '💀', label: 'Híbrido', cls: 'dtype-hybrid' };
    default:         return { icon: '⚔️', label: 'Físico', cls: 'dtype-physical' };
  }
}

function getConfidenceBadge(level, reasons) {
  const badges = {
    complete:  { icon: '🟢', label: 'Completo', cls: 'conf-complete', tip: 'Todos os dados e fórmulas estão validados.' },
    estimated: { icon: '🟡', label: 'Estimado', cls: 'conf-estimated', tip: 'Alguns valores usam fórmulas aproximadas.' },
    incomplete:{ icon: '🔴', label: 'Incompleto', cls: 'conf-incomplete', tip: 'Dados críticos estão faltando.' }
  };
  const badge = badges[level] || badges.estimated;
  return { ...badge, reasons: reasons || [] };
}

// ═══════════════════════════════════════════════
// DAMAGE BREAKDOWN ENGINE — Fase 2
// Registra cada etapa do cálculo como um passo auditável.
// ═══════════════════════════════════════════════
function renderDamageBreakdown(steps) {
  if (!steps || !steps.length) return '';
  return `<div class="damage-breakdown">
    <button class="breakdown-toggle" type="button" onclick="this.parentElement.classList.toggle('expanded')">
      <span class="breakdown-toggle-icon">▶</span> Como chegamos neste dano?
    </button>
    <div class="breakdown-content">
      <table class="breakdown-table">
        <thead><tr><th>Etapa</th><th>Fórmula</th><th>Valor</th></tr></thead>
        <tbody>${steps.map(step => `<tr class="breakdown-row ${step.tone || ''}">
          <td>${plainText(step.label)}</td>
          <td class="breakdown-formula">${plainText(step.formula)}</td>
          <td class="breakdown-value">${step.value}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </div>`;
}

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
      tabStatsContent.style.display = 'grid';
      tabEquipContent.style.display = 'none';
    };
    tabEquipBtn.onclick = () => {
      tabEquipBtn.classList.add('active');
      tabStatsBtn.classList.remove('active');
      tabStatsContent.style.display = 'none';
      tabEquipContent.style.display = 'grid';
    };
  }

  const saved = JSON.parse(localStorage.getItem('aureum_sim_profile') || '{}');
  const fields = ['sim-nivel', 'sim-job-nivel', 'sim-classe', 'sim-hit', 'sim-flee', 'sim-atq', 'sim-skill-pct', 'sim-arma-tipo', 'sim-arma-elemento', 'sim-ataque-tipo', 'sim-skill-level', 'sim-reborn-rate', 'sim-reborn-elo', ...BUFF_FIELD_IDS, 'sim-farm-objective', 'sim-farm-cost-hour'];
  
  fields.forEach(id => {
    const el = $(id);
    if (el && saved[id] !== undefined) {
      if (el.type === 'checkbox') {
        el.checked = saved[id];
      } else {
        el.value = saved[id];
        if (id === 'sim-classe') {
          updateSkillsSelect(el.value);
        }
      }
    }
  });

  const saveProfile = () => {
    const profile = {};
    fields.forEach(id => {
      const el = $(id);
      if (el) profile[id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    localStorage.setItem('aureum_sim_profile', JSON.stringify(profile));
    refreshCharacterSummary();
  };

  fields.forEach(id => {
    const el = $(id);
    if (el) {
      const eventName = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
      el.addEventListener(eventName, saveProfile);
    }
  });

  // Phase 3: Target drop selector handling
  const objSelect = $('sim-farm-objective');
  const targetWrap = $('sim-target-drop-wrap');
  const targetInput = $('sim-target-item-search');
  const targetSugg = $('sim-target-item-suggest');

  const syncTargetWrap = () => {
    if (targetWrap) targetWrap.style.display = objSelect?.value === 'target_drop' ? 'block' : 'none';
  };
  objSelect?.addEventListener('change', syncTargetWrap);
  syncTargetWrap();

  if (targetInput && targetSugg) {
    targetInput.addEventListener('input', debounce(() => {
      const q = targetInput.value.trim().toLowerCase();
      if (q.length < 2) { targetSugg.classList.remove('open'); return; }
      const matches = (APP.db?.items || []).filter(i => i.nome?.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { targetSugg.classList.remove('open'); return; }
      targetSugg.innerHTML = matches.map(m => `<div class="suggestion-item" data-id="${m.id}">${m.nome}</div>`).join('');
      targetSugg.classList.add('open');
      targetSugg.querySelectorAll('.suggestion-item').forEach(el => {
        el.onclick = () => {
          const item = APP.db.items.find(i => i.id === parseInt(el.dataset.id));
          if (item) {
            APP.targetDropItemId = item.id;
            APP.targetDropName = item.nome;
            targetInput.value = item.nome;
            targetSugg.classList.remove('open');
            if (APP.currentSimMob) runSimulation(APP.currentSimMob);
          }
        };
      });
    }, 200));
  }


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

    refreshCharacterSummary();
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
    const structured = parseItemEffects(card);
    const findTarget = (bucket, target) => Object.entries(bucket || {}).find(([key]) => window.AureumEffects.normalize(key) === window.AureumEffects.normalize(target))?.[1] || 0;
    const raceValue = findTarget(structured.targets.raceDamage, mobRace) + (mob.mvp ? Number(structured.targets.raceDamage.MVP) || 0 : 0);
    const sizeValue = findTarget(structured.targets.sizeDamage, mobSize);
    const elementValue = findTarget(structured.targets.elementDamage, mobElemStr);
    mods.raca += raceValue;
    mods.tamanho += sizeValue;
    mods.elemento += elementValue;
    mods.atqFlat += structured.atq || 0;

    // Explicit mappings remain only as compatibility fallback for legacy descriptions.
    if (cardData) {
      if (cardData.atq && !structured.atq) mods.atqFlat += cardData.atq;
      if (cardData.mvp && mob.mvp && !structured.targets.raceDamage.MVP) mods.tamanho += cardData.mvp;
      if (cardData.race?.[mobRace] && !raceValue) mods.raca += cardData.race[mobRace];
      if (cardData.size?.[mobSize] && !sizeValue) mods.tamanho += cardData.size[mobSize];
      if (cardData.element?.[mobElem] && !elementValue) mods.elemento += cardData.element[mobElem];
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

// ═══════════════════════════════════════════════
// FASE 3 — INTELIGÊNCIA DE FARM E PONTUAÇÃO DE HUNT
// ═══════════════════════════════════════════════

function getCharacterWeightCapacity() {
  const str = (Number($('sim-str')?.value) || 1) + (APP.character?.effects?.str || 0);
  const classSelect = $('sim-classe');
  let className = 'NOVICE';
  if (classSelect && classSelect.value && typeof classSpritesData !== 'undefined' && classSpritesData && classSpritesData[classSelect.value]) {
    className = classSpritesData[classSelect.value].split('/').pop().replace('.gif', '').toUpperCase();
  }
  let classBonus = 0;
  if (className.includes('MERCHANT') || className.includes('BLACKSMITH') || className.includes('WHITESMITH') || className.includes('ALCHEMIST') || className.includes('CREATOR') || className.includes('MECHANIC') || className.includes('MEISTER') || className.includes('BIOLO')) {
    classBonus = 800;
  } else if (className.includes('KNIGHT') || className.includes('CRUSADER') || className.includes('PALADIN') || className.includes('ROYAL') || className.includes('RUNE')) {
    classBonus = 600;
  }
  const itemBonus = Number(APP.character?.effects?.weightCapacity) || 0;
  return Math.max(2000, 2000 + str * 30 + classBonus + itemBonus);
}

function calculateItemizedCosts(combatOverride = {}, dodgeChance = 95, mobLevel = 1, charLevel = 1) {
  const manualCostHour = Math.max(0, Number($('sim-farm-cost-hour')?.value) || 0);
  const buffCostHour = Math.max(0, Number(APP.character?.effects?.consumableCostHour) || 0);
  
  const weaponType = $('sim-arma-tipo')?.value || 'Desarmado';
  const aspd = APP.character?.derived?.aspd || 150;
  const attacksPerSec = 50 / (200 - Math.min(193, aspd));

  let ammoCostHour = 0;
  if (['Arco', 'Instrumento', 'Chicote', 'ArmaFogo'].includes(weaponType)) {
    ammoCostHour = Math.round(attacksPerSec * 3600 * 2); // 2z por flecha/munição base
  }

  let potionCostHour = 0;
  if (dodgeChance < 70 && mobLevel >= charLevel - 10) {
    const hitsReceivedPerSec = (1 - dodgeChance / 100) * 0.6;
    const charDef = Number(APP.character?.derived?.def) || 0;
    const mobAtqEst = Math.max(10, mobLevel * 6 - charDef);
    const damagePerSec = hitsReceivedPerSec * mobAtqEst;
    const yellowPotionsHour = Math.ceil((damagePerSec * 3600) / 350);
    potionCostHour = yellowPotionsHour * 340;
  }

  const totalCostHour = manualCostHour + buffCostHour + ammoCostHour + potionCostHour;
  return { manualCostHour, buffCostHour, ammoCostHour, potionCostHour, totalCostHour };
}

function generateActionableAlerts(mob, selected) {
  const alerts = [];
  const charHit = Number($('sim-hit')?.value) || 0;
  const charLevel = Number($('sim-nivel')?.value) || 1;
  const reqHit = (mob.nivel || 0) + (mob.agi || 0) + 20;

  if (selected.hitChance < 100) {
    const missingHit = Math.max(1, reqHit - charHit);
    const gainPct = Math.round((100 / selected.hitChance - 1) * 100);
    alerts.push({
      tone: 'warning',
      text: `HIT em ${selected.hitChance}%: elevar +${missingHit} de precisão trará +${gainPct}% abates/h.`
    });
  }

  if (selected.dodgeChance < 60) {
    alerts.push({
      tone: 'danger',
      text: `Esquiva em ${selected.dodgeChance}%: consumo estimado de ~${fmt(selected.itemizedCosts.potionCostHour)} z/h em poções.`
    });
  }

  if (Number.isFinite(selected.hoursToFill50) && selected.hoursToFill50 < 0.5) {
    alerts.push({
      tone: 'warning',
      text: `Loot pesado: inventário atinge 50% de peso em ${Math.round(selected.hoursToFill50 * 60)} min.`
    });
  }

  if (selected.expPenalty < 1) {
    alerts.push({
      tone: 'warning',
      text: `EXP reduzida para ${Math.round(selected.expPenalty * 100)}% pela diferença de nível (${charLevel} vs ${mob.nivel}).`
    });
  }

  const currentArmaElem = $('sim-arma-elemento')?.value || 'Neutro';
  let mobElemStr = (mob.elemento || 'Neutro').split(' ')[0].trim();
  let mobElemLvl = parseInt((mob.elemento || '').replace(/^\D+/g, '')) || 1;
  mobElemLvl = Math.max(1, Math.min(4, mobElemLvl));
  const levelMatrix = ELEM_MULTI[mobElemLvl] || ELEM_MULTI[1];
  
  let bestElem = 'Neutro';
  let bestElemMod = 0;
  Object.keys(levelMatrix).forEach(elem => {
    const mod = levelMatrix[elem]?.[mobElemStr] ?? 1;
    if (mod > bestElemMod) { bestElemMod = mod; bestElem = elem; }
  });
  const currentElemMod = levelMatrix[currentArmaElem]?.[mobElemStr] ?? 1;
  if (bestElemMod > currentElemMod && bestElemMod > 1) {
    const gain = Math.round((bestElemMod / Math.max(0.1, currentElemMod) - 1) * 100);
    alerts.push({
      tone: 'info',
      text: `💡 Otimização Elemental: Ataque de ${bestElem} causará ${(bestElemMod * 100).toFixed(0)}% de dano (+${gain}% DPS).`
    });
  }

  const cardMods = getEquippedCardModifiers(mob);
  if (cardMods.raca === 0 && mob.raca) {
    alerts.push({
      tone: 'info',
      text: `🛡️ Carta de Raça: Equipar cartas vs ${mob.raca} aumentará o dano proporcionalmente.`
    });
  }

  return alerts;
}

function calculateHuntMetrics(mob, combatOverride = {}) {
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
  const elementBase = ELEM_MULTI[defenseLevel]?.[attackElement]?.[defenseElement] ?? 1;
  const raceMod = 1 + cardMods.raca / 100;
  const sizeMod = sizeBase * (1 + cardMods.tamanho / 100);
  const elementMod = elementBase * (1 + cardMods.elemento / 100);
  const characterDamageMod = 1 + (Number(APP.character?.effects?.damagePct) || 0) / 100;
  const estimatedDamage = elementMod <= 0 ? 0 : Math.max(1, Math.floor((charAtq * sizeMod - (mob.def || 0)) * raceMod * elementMod * skillMult * characterDamageMod));
  const requiredHit = (mob.nivel || 0) + (mob.agi || 0) + 20;
  const estimatedHitChance = Math.max(5, Math.min(100, 100 - (requiredHit - (Number($('sim-hit')?.value) || 0))));
  const requiredFlee = (mob.nivel || 0) + (mob.des || 0) + 75;
  const estimatedDodgeChance = Math.max(5, Math.min(95, 95 - (requiredFlee - (Number($('sim-flee')?.value) || 0))));
  const damage = combatOverride.damage != null ? Number(combatOverride.damage) : estimatedDamage;
  const hitChance = combatOverride.hitChance != null ? Number(combatOverride.hitChance) : estimatedHitChance;
  const dodgeChance = combatOverride.dodgeChance != null ? Number(combatOverride.dodgeChance) : estimatedDodgeChance;
  const hits = damage > 0 ? Math.ceil((mob.hp || 1) / damage) : Infinity;
  const cappedAspd = Math.min(193, aspd);
  const attacksPerSecond = 50 / (200 - cappedAspd);
  const estimatedTtk = Number.isFinite(hits) ? hits / Math.max(.05, attacksPerSecond * hitChance / 100) : Infinity;
  const ttk = Number.isFinite(combatOverride.ttk) ? combatOverride.ttk : estimatedTtk;

  const spawns = APP.spawnsByMob?.get(mob.id) || [];
  const bestSpawn = spawns.reduce((best, spawn) => (Number(spawn.qtd) || 0) > (Number(best?.qtd) || 0) ? spawn : best, null);
  const density = Number(bestSpawn?.qtd) || 1;
  const movementFactor = 1 + (Number(APP.character?.effects?.moveSpeed) || 0) / 100;
  const densityFactor = Math.min(.98, (.42 + Math.log2(density + 1) * .085) * movementFactor);
  const rawKillsHour = Number.isFinite(ttk) ? Math.min(3600, 3600 / Math.max(.8, ttk + 1.5) * densityFactor) : 0;

  // Fase 3: Peso e Lotação de Inventário
  const weightCapacity = getCharacterWeightCapacity();
  const allMobDrops = (APP.dropsByMob?.get(mob.id) || []).map(drop => {
    const item = APP.itemById?.get(drop.item_id);
    const npcPrice = Number(item?.preco_venda) || 0;
    const baseChance = Number(drop.chance) || 0;
    const chance = Math.min(1, baseChance * (1 + (Number(APP.character?.effects?.dropRate) || 0) / 100));
    const expected = chance * npcPrice;
    return { id: drop.item_id, name: drop.item || item?.nome || 'Item', chance, baseChance, npcPrice, expected, weight: Number(item?.peso) || 0 };
  });

  const drops = allMobDrops.filter(drop => drop.npcPrice > 0).sort((a,b) => b.expected - a.expected);
  const rawZenyKill = drops.reduce((sum, drop) => sum + drop.expected, 0);
  const expectedWeightKill = allMobDrops.reduce((sum, drop) => sum + drop.chance * drop.weight, 0);
  
  const expectedWeightHourRaw = expectedWeightKill * rawKillsHour;
  const weight50 = weightCapacity * 0.5;
  const weight90 = weightCapacity * 0.9;
  const hoursToFill50 = expectedWeightHourRaw > 0 ? (weight50 / expectedWeightHourRaw) : Infinity;
  const hoursToFill90 = expectedWeightHourRaw > 0 ? (weight90 / expectedWeightHourRaw) : Infinity;

  const tripsPerHour = Number.isFinite(hoursToFill90) && hoursToFill90 > 0 ? (1 / hoursToFill90) : 0;
  const travelPenaltyFactor = Math.max(0.70, 1 - Math.min(0.30, (tripsPerHour * 3.5) / 60));
  const killsHour = rawKillsHour * travelPenaltyFactor;
  const expectedWeightHour = expectedWeightKill * killsHour;

  // Fase 3: Detalhamento de Custos Itemizados
  const expPenalty = calcLevelPenalty(charLevel, mob.nivel || 1);
  const itemizedCosts = calculateItemizedCosts(combatOverride, dodgeChance, mob.nivel || 1, charLevel);
  const costHour = itemizedCosts.totalCostHour;
  const rawZenyHour = rawZenyKill * killsHour;
  const netZenyHour = Math.max(0, rawZenyHour - costHour);

  // Fase 3: Target Drop Focus ETA
  const targetDrop = drops[0] || allMobDrops[0];
  const targetKillsToDrop = targetDrop ? Math.ceil(1 / Math.max(0.000001, targetDrop.chance)) : Infinity;
  const targetHoursToDrop = killsHour > 0 && Number.isFinite(targetKillsToDrop) ? (targetKillsToDrop / killsHour) : Infinity;

  const durabilityBonus = Math.min(12, (Number(APP.character?.derived?.hp) || 0) / 2500 + (Number(APP.character?.derived?.def) || 0) / 45);
  const safetyScore = Math.round(Math.max(0, Math.min(100, dodgeChance * .4 + hitChance * .15 + Math.max(0, 32 - Math.min(32, ttk)) * 1.2 + durabilityBonus + (mob.nivel <= charLevel + 15 ? 8 : 0))));

  return {
    damage, hitChance, dodgeChance, hits, ttk, killsHour, rawKillsHour, bestSpawn, density, densityFactor, drops, allMobDrops,
    rawZenyKill, rawZenyHour, netZenyHour, costHour, itemizedCosts, manualCostHour: itemizedCosts.manualCostHour, buffCostHour: itemizedCosts.buffCostHour,
    expectedWeightKill, expectedWeightHour, weightCapacity, hoursToFill50, hoursToFill90, travelPenaltyFactor,
    targetDrop, targetKillsToDrop, targetHoursToDrop,
    baseExpHour: (mob.exp_base || 0) * expPenalty * killsHour,
    jobExpHour: (mob.exp_classe || 0) * expPenalty * killsHour,
    expPenalty, attacksPerSecond, safetyScore, movementFactor,
    combatScore: Number.isFinite(ttk) ? Math.round(Math.max(0, Math.min(100, 70 * Math.exp(-ttk / 18) + hitChance * .2 + (dodgeChance / 95 * 100) * .1))) : 0
  };
}

function saveCurrentHunt(mobId) {
  const mob = APP.db.mobs.find(m => m.id === mobId);
  if (!mob) return;
  const metrics = calculateHuntMetrics(mob);
  const saved = JSON.parse(localStorage.getItem('aureum_saved_hunts') || '[]');
  const entry = {
    id: Date.now(),
    mobId: mob.id,
    mobName: mob.nome,
    buildName: $('sim-build-name')?.value || 'Build Ativa',
    netZenyHour: metrics.netZenyHour,
    baseExpHour: metrics.baseExpHour,
    safetyScore: metrics.safetyScore,
    timestamp: new Date().toISOString()
  };
  saved.unshift(entry);
  localStorage.setItem('aureum_saved_hunts', JSON.stringify(saved.slice(0, 20)));
  alert(`Hunt em ${mob.nome} salva no histórico local!`);
}

function buildHuntAssessment(mob, combatOverride = {}) {
  const selected = calculateHuntMetrics(mob, combatOverride);
  const universe = APP.db.mobs.filter(candidate => !candidate.mvp).map(candidate => calculateHuntMetrics(candidate));
  const zenyScore = percentileScore(universe.map(metric => metric.rawZenyHour), selected.netZenyHour);
  const expScore = selected.expPenalty ? percentileScore(universe.map(metric => metric.baseExpHour + metric.jobExpHour), selected.baseExpHour + selected.jobExpHour) : 0;
  const combatScore = selected.combatScore;
  const safetyScore = selected.safetyScore;
  const objective = $('sim-farm-objective')?.value || 'balanced';
  
  let weights;
  if (objective === 'zeny') {
    weights = { zeny:.58, combat:.18, exp:.08, safety:.16, label:'58% Zeny | 18% Combate | 8% EXP | 16% Segurança' };
  } else if (objective === 'xp') {
    weights = { zeny:.08, combat:.23, exp:.50, safety:.19, label:'8% Zeny | 23% Combate | 50% EXP | 19% Segurança' };
  } else if (objective === 'target_drop') {
    weights = { zeny:.40, combat:.30, exp:.10, safety:.20, label:'40% Target Drop | 30% Combate | 20% Segurança | 10% EXP' };
  } else {
    weights = { zeny:.34, combat:.28, exp:.22, safety:.16, label:'34% Zeny | 28% Combate | 22% EXP | 16% Segurança' };
  }
  
  const overall = Math.round(zenyScore * weights.zeny + combatScore * weights.combat + expScore * weights.exp + safetyScore * weights.safety);
  const grade = getHuntGrade(overall);
  const topDrops = selected.drops.slice(0, 3);
  const ttkLabel = Number.isFinite(selected.ttk) ? `${selected.ttk.toFixed(1)}s` : 'Inviável';
  const alerts = generateActionableAlerts(mob, selected);

  const costTooltip = `Consumos/h: Buffs (${fmt(selected.itemizedCosts.buffCostHour)}z) + Munição (${fmt(selected.itemizedCosts.ammoCostHour)}z) + Poções (${fmt(selected.itemizedCosts.potionCostHour)}z) + Manual (${fmt(selected.itemizedCosts.manualCostHour)}z)`;

  // Fase 3: Target drop ETA bar
  const targetDropHtml = (objective === 'target_drop' && selected.targetDrop) ? `
    <div class="hunt-target-drop-card" style="background:rgba(212,168,67,0.08); border:1px solid rgba(212,168,67,0.25); padding:10px 14px; border-radius:8px; margin:10px 0; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="color:var(--gold-light); font-size:10px; font-weight:700; text-transform:uppercase;">🎯 Alvo Prioritário</span>
        <div style="font-size:13px; font-weight:bold; color:var(--text-primary);">${plainText(selected.targetDrop.name)}</div>
        <small style="color:var(--text-muted); font-size:10px;">Chance de drop: ${(selected.targetDrop.chance * 100).toFixed(selected.targetDrop.chance < 0.001 ? 3 : 2)}%</small>
      </div>
      <div style="text-align:right;">
        <span style="font-size:16px; color:var(--gold-light); font-weight:bold;">${Number.isFinite(selected.targetHoursToDrop) ? selected.targetHoursToDrop.toFixed(1) + 'h' : '—'}</span>
        <small style="display:block; color:var(--text-secondary); font-size:10px;">~${fmt(selected.targetKillsToDrop)} abates</small>
      </div>
    </div>
  ` : '';

  return `<section class="hunt-assessment grade-${grade.label.toLowerCase()}">
    <div class="hunt-score-hero">
      <div class="hunt-grade">${grade.label}</div>
      <div>
        <span class="sim-eyebrow">FARM SCORE V3</span>
        <strong>${overall}/100</strong>
        <small>${grade.text} para a build atual</small>
      </div>
      <div class="hunt-weight-note">${weights.label}</div>
    </div>

    ${targetDropHtml}

    <div class="hunt-score-grid">
      <div title="${costTooltip}">
        <span>Raw Zeny líquido/h</span>
        <strong>${fmt(Math.round(selected.netZenyHour))} z</strong>
        <small>Bruto ${fmt(Math.round(selected.rawZenyHour))} z · custo total ${fmt(selected.costHour)} z</small>
      </div>
      <div>
        <span>Ritmo estimado</span>
        <strong>${fmt(Math.round(selected.killsHour))} kills/h</strong>
        <small>TTK ${ttkLabel} · ${selected.hitChance}% acerto${selected.travelPenaltyFactor < 1 ? ` · viagem -${Math.round((1-selected.travelPenaltyFactor)*100)}%` : ''}</small>
      </div>
      <div>
        <span>EXP Base/h</span>
        <strong>${fmt(Math.round(selected.baseExpHour))}</strong>
        <small>EXP Classe/h ${fmt(Math.round(selected.jobExpHour))} · percentil ${expScore}</small>
      </div>
      <div>
        <span>Segurança & Peso</span>
        <strong>${safetyScore}/100</strong>
        <small>Carga: ${fmt(Math.round(selected.expectedWeightHour))} kg/h · cap ${fmt(selected.weightCapacity)} kg</small>
      </div>
    </div>

    <div class="hunt-subscore-row">
      <span>Combate <b>${combatScore}</b></span><i style="--score:${combatScore}%"></i>
      <span>Raw Zeny <b>${zenyScore}</b></span><i style="--score:${zenyScore}%"></i>
      <span>Experiência <b>${expScore}</b></span><i style="--score:${expScore}%"></i>
      <span>Segurança <b>${safetyScore}</b></span><i style="--score:${safetyScore}%"></i>
    </div>

    <div class="hunt-drop-value">
      <span>Maiores contribuições ao Raw Zeny</span>
      ${topDrops.length ? topDrops.map(drop => `<div><strong>${plainText(drop.name)}</strong><small>${(drop.chance*100).toFixed(drop.chance < .001 ? 3 : 2)}% × ${fmt(drop.npcPrice)} z</small><b>${fmt(drop.expected,2)} z/kill</b></div>`).join('') : '<small>Nenhum drop com preço de venda ao NPC foi encontrado.</small>'}
    </div>

    ${alerts.length ? `<div class="hunt-alerts">${alerts.map(alert => `<span class="hunt-alert-${alert.tone}">⚠ ${plainText(alert.text)}</span>`).join('')}</div>` : ''}

    <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
      <button type="button" class="build-action" onclick="saveCurrentHunt(${mob.id})" style="font-size:11px; padding:6px 12px;">💾 Salvar esta Hunt no histórico</button>
      <small style="color:var(--text-muted); font-size:10px;">Capacidade: 50% em ${Number.isFinite(selected.hoursToFill50) ? (selected.hoursToFill50 * 60).toFixed(0) + ' min' : '∞'}</small>
    </div>

    <p class="hunt-disclaimer">Projeção Fase 3: considera ataques contínuos, melhor mapa, preço NPC, consumíveis itemizados, tempo de retorno por lotação de inventário e penalidades de nível.</p>
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

const SUPPORT_BUFF_CATALOG = [
  { id:'sim-buff-bless', name:'Bênção Nv 10', kind:'classe', durationLabel:'Sessão', effects:{str:10,int:10,dex:10}, label:'FOR/INT/DES +10' },
  { id:'sim-buff-agi', name:'Aumentar AGI Nv 10', kind:'classe', durationLabel:'Sessão', effects:{agi:10}, label:'AGI +10' },
  { id:'sim-buff-concent', name:'Concentração Nv 10', kind:'classe', durationLabel:'Sessão', dynamic:'concentration', label:'AGI/DES +12%' },
  { id:'sim-buff-loud', name:'Grito de Guerra', kind:'classe', durationLabel:'Sessão', effects:{str:4}, label:'FOR +4' },
  { id:'sim-buff-quicken', name:'Rapidez / Adrenalina', kind:'classe', durationLabel:'Sessão', effects:{aspd:3}, label:'ASPD +3' },
  { id:'sim-buff-potion-concentration', name:'Poção da Concentração', kind:'consumível', itemId:645, duration:1800, effects:{aspdPct:10}, label:'Vel. de ataque +10%', exclusive:'aspd-potion' },
  { id:'sim-buff-potion-awakening', name:'Poção do Despertar', kind:'consumível', itemId:656, duration:1800, effects:{aspdPct:15}, label:'Vel. de ataque +15%', exclusive:'aspd-potion' },
  { id:'sim-buff-potion-berserk', name:'Poção da Fúria Selvagem', kind:'consumível', itemId:657, duration:1800, effects:{aspdPct:20}, label:'Vel. de ataque +20%', exclusive:'aspd-potion' },
  { id:'sim-buff-cell-juice', name:'Suco Celular Enriquecido', kind:'consumível', itemId:12437, duration:500, effects:{aspdPct:10}, label:'Vel. de ataque +10%' },
  { id:'sim-buff-abrasive', name:'Abrasivo', kind:'consumível', itemId:14536, duration:300, effects:{crit:30}, label:'CRIT +30' }
];
const BUFF_FIELD_IDS = SUPPORT_BUFF_CATALOG.map(buff => buff.id);

function getBuffCost(buff) {
  const item = buff.itemId ? APP.itemById?.get(buff.itemId) : null;
  const unitCost = Math.max(0, Number(item?.preco_compra) || 0);
  const unitsHour = buff.duration ? Math.ceil(3600 / buff.duration) : 0;
  return { item, unitCost, unitsHour, hourlyCost:unitCost * unitsHour };
}

function initBuffCatalog() {
  const host = $('sim-buff-catalog');
  if (!host) return;
  host.innerHTML = SUPPORT_BUFF_CATALOG.map(buff => {
    const cost = getBuffCost(buff);
    const duration = buff.duration ? (buff.duration % 60 ? `${buff.duration}s` : `${buff.duration / 60}min`) : buff.durationLabel;
    const costLabel = buff.kind === 'consumível' ? (cost.unitCost ? `${fmt(cost.hourlyCost)} z/h` : 'sem preço NPC') : 'sem custo';
    return `<label class="buff-option ${buff.kind}" title="${plainText(buff.label)} · ${duration} · ${costLabel}"><input type="checkbox" id="${buff.id}" data-exclusive="${buff.exclusive || ''}"><span><b>${plainText(buff.name)}</b><small>${plainText(buff.label)} · ${duration} · ${costLabel}</small></span></label>`;
  }).join('');
  host.querySelectorAll('[data-exclusive]').forEach(input => input.addEventListener('change', () => {
    if (!input.checked || !input.dataset.exclusive) return;
    host.querySelectorAll(`[data-exclusive="${input.dataset.exclusive}"]`).forEach(other => { if (other !== input) other.checked = false; });
  }));
}

const CHARACTER_BUILD_BASE_KEYS = [
  'sim-nivel','sim-job-nivel','sim-classe','sim-str','sim-agi','sim-vit','sim-int','sim-dex','sim-luk','sim-skill-pct','sim-arma-elemento',
  'sim-ataque-tipo','sim-reborn-rate','sim-reborn-elo', ...BUFF_FIELD_IDS
];

const REBORN_ELOS = ['Bronze','Prata','Ouro','Platina','Esmeralda','Diamante','Mestre','Grão Mestre','Desafiante','Monarca'];
const REBORN_TABLE = {
  '1x': {
    coin:[1000,1890,2780,3670,4560,5440,6330,7220,8110,9000], zeny:[1000000,1890000,2780000,3670000,4560000,5440000,6330000,7220000,8110000,9000000],
    atq:[6,8,12,14,16,18,20,20,20,20], damagePct:[5,5,5,6,6,8,8,9,9,10], moveSpeed:[1,2,3,4,5,6,7,8,9,10], crit:[4,4,6,6,7,8,8,9,9,10], critResist:[2,3,4,5,5,5,10,13,13,15], hit:[5,5,9,9,13,13,18,18,20,25], flee:[5,5,9,9,13,13,18,18,20,25], perfectDodge:[2,2,2,2,3,3,3,4,4,5], hardDef:[5,5,5,6,6,7,7,8,8,10], softDef:[30,40,50,60,70,80,80,90,90,100], hardMdef:[5,5,5,6,6,7,7,8,8,10], softMdef:[30,40,50,60,70,80,80,90,90,100], hp:[200,350,450,550,650,750,750,950,950,1000], sp:[15,15,25,25,35,35,45,45,50,50], regenPct:[3,3,3,3,3,4,4,4,4,5], hpKill:[15,15,25,25,35,35,45,45,50,50], spKill:[3,3,3,4,4,4,5,5,5,5], dropRate:[6,8,10,15,20,25,30,35,40,50], pvpReduction:[6,6,10,10,14,14,15,16,18,20], allStats:[0,0,0,0,0,0,0,1,2,3]
  },
  '3x': {
    coin:[1000,2000,3000,4000,5000,6000,7000,8000,9000,10000], zeny:[1000000,1890000,2780000,3670000,4560000,5440000,6330000,7220000,8110000,9000000],
    atq:[4,6,9,12,14,16,18,20,20,20], damagePct:[3,3,4,5,5,6,6,8,9,10], moveSpeed:[1,2,3,4,5,6,7,8,9,10], crit:[3,3,4,4,6,6,7,8,9,10], critResist:[1,2,3,4,4,4,8,10,12,15], hit:[3,3,8,8,10,12,14,16,20,25], flee:[3,3,8,8,10,12,14,16,20,25], perfectDodge:[1,1,1,1,2,2,2,3,4,5], hardDef:[3,3,3,4,4,5,5,7,7,10], softDef:[20,30,40,50,60,70,70,75,85,100], hardMdef:[3,3,3,4,4,5,5,7,8,10], softMdef:[15,25,35,45,55,65,70,80,90,100], hp:[135,250,350,450,550,650,650,750,850,1000], sp:[10,10,15,15,20,20,35,35,40,50], regenPct:[2,2,2,2,2,3,3,3,4,5], hpKill:[8,12,16,20,25,25,30,35,45,50], spKill:[2,2,3,3,4,4,4,4,5,5], dropRate:[5,6,8,10,12,16,18,20,25,30], pvpReduction:[3,4,6,8,10,10,12,16,18,20], allStats:[0,0,0,0,0,0,0,1,2,3]
  },
  '5x': {
    coin:[1000,2000,3000,4000,5000,6000,7000,8000,9000,10000], zeny:[1000000,2000000,3000000,4000000,5000000,6000000,7000000,8000000,9000000,10000000],
    atq:[2,4,6,8,10,12,14,16,18,20], damagePct:[1,2,3,4,5,6,7,8,9,10], moveSpeed:[1,2,3,4,5,6,7,8,9,10], crit:[1,2,3,4,5,6,7,8,9,10], critResist:[0,0,0,0,5,5,7,7,10,15], hit:[1,2,3,4,5,10,15,20,20,25], flee:[1,2,3,4,5,10,15,20,20,25], perfectDodge:[0,0,0,0,1,1,3,3,5,5], hardDef:[2,2,2,3,3,4,4,6,6,10], softDef:[10,20,30,40,50,60,70,80,90,100], hardMdef:[1,1,1,2,2,4,4,5,5,8], softMdef:[10,20,30,40,50,60,70,80,90,100], hp:[100,200,300,400,500,600,700,800,900,1000], sp:[5,10,15,20,25,30,35,40,45,50], regenPct:[1,1,1,1,2,2,3,3,4,5], hpKill:[5,10,15,20,25,30,35,40,45,50], spKill:[1,1,2,2,3,3,4,4,5,5], dropRate:[4,4,6,6,8,8,10,10,12,15], pvpReduction:[2,4,6,8,10,12,14,16,18,20], allStats:[0,0,0,0,0,0,0,1,2,3]
  }
};

function getRebornEffects() {
  const rate = $('sim-reborn-rate')?.value || '5x';
  const tier = Math.max(0, Math.min(10, Number($('sim-reborn-elo')?.value) || 0));
  if (!tier || !REBORN_TABLE[rate]) return { active:false, rate, tier:0, name:'Sem título', labels:[] };
  const index = tier - 1;
  const table = REBORN_TABLE[rate];
  const effect = { active:true, rate, tier, name:REBORN_ELOS[index], labels:[] };
  Object.entries(table).forEach(([key, values]) => { effect[key] = values[index] || 0; });
  effect.str = effect.agi = effect.vit = effect.int = effect.dex = effect.luk = effect.allStats;
  effect.matq = effect.atq;
  effect.labels = [
    `Reborn ${effect.name} (${rate}): ATQ/ATQM +${effect.atq}`,
    `Reborn: dano +${effect.damagePct}% · HIT/FLEE +${effect.hit}`,
    `Reborn: HP +${effect.hp} · SP +${effect.sp} · drop +${effect.dropRate}%`,
    effect.allStats ? `Reborn: todos os atributos +${effect.allStats}` : null
  ].filter(Boolean);
  return effect;
}

function plainText(value = '') {
  return String(value).replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' })[c]);
}

function parseItemEffects(item) {
  return window.AureumEffects.parseItemEffects(item);
}

function getAllEquippedItems() {
  const base = [APP.simEquip.weapon, APP.simEquip.shield, APP.simEquip.armor];
  const cards = [...(APP.simEquip.weaponCards||[]), ...(APP.simEquip.shieldCards||[]), ...(APP.simEquip.armorCards||[])];
  return [...base, ...Object.values(APP.simEquip.extra || {}), ...cards].filter(Boolean);
}

function aggregateCharacterEffects() {
  const sum = getAllEquippedItems().reduce((sum, item) => {
    const effect = parseItemEffects(item);
    Object.keys(sum).forEach(key => { if (key !== 'labels') sum[key] += effect[key] || 0; });
    sum.labels.push(...effect.labels.map(label => `${item.nome}: ${label}`));
    return sum;
  }, { str:0,agi:0,vit:0,int:0,dex:0,luk:0,atq:0,matq:0,def:0,mdef:0,hit:0,flee:0,hp:0,sp:0,aspd:0,aspdPct:0,hpPct:0,spPct:0,damagePct:0,magicDamagePct:0,rangedDamagePct:0,critDamagePct:0,moveSpeed:0,crit:0,critPct:0,critResist:0,perfectDodge:0,hardDef:0,softDef:0,hardMdef:0,softMdef:0,regenPct:0,hpKill:0,spKill:0,dropRate:0,pvpReduction:0,castReduction:0,postCastReduction:0,spCostReduction:0,consumableCostHour:0,labels:[] });

  const reborn = getRebornEffects();
  if (reborn.active) {
    Object.keys(sum).forEach(key => { if (key !== 'labels') sum[key] += Number(reborn[key]) || 0; });
    sum.labels.push(...reborn.labels);
  }
  sum.reborn = reborn;

  SUPPORT_BUFF_CATALOG.filter(buff => $(buff.id)?.checked).forEach(buff => {
    if (buff.dynamic === 'concentration') {
      const agiBonus = Math.floor((Number($('sim-agi')?.value) || 1) * .12);
      const dexBonus = Math.floor((Number($('sim-dex')?.value) || 1) * .12);
      sum.agi += agiBonus;
      sum.dex += dexBonus;
      sum.labels.push(`${buff.name}: AGI +${agiBonus} · DES +${dexBonus}`);
    } else {
      Object.entries(buff.effects || {}).forEach(([key, value]) => { if (typeof sum[key] === 'number') sum[key] += Number(value) || 0; });
      sum.labels.push(`${buff.name}: ${buff.label}`);
    }
    if (buff.kind === 'consumível') sum.consumableCostHour += getBuffCost(buff).hourlyCost;
  });

  return sum;
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
  $('sim-build-new').onclick = () => { statIds.forEach(id => $(id).value = 1); APP.simEquip.weapon=null; APP.simEquip.shield=null; APP.simEquip.armor=null; APP.simEquip.weaponCards=[]; APP.simEquip.shieldCards=[]; APP.simEquip.armorCards=[]; APP.simEquip.extra = {}; APP.activeBuildId = null; localStorage.removeItem('aureum_active_build_id'); $('sim-build-select').value = ''; $('sim-build-name').value = 'Nova build'; $('sim-reborn-rate').value = '5x'; $('sim-reborn-elo').value = '0'; APP.renderSimulatorEquipment?.(); persistAndRefresh(); renderExtra(); updateSimulationBuildGate(); };
  if ($('sim-build-delete')) $('sim-build-delete').onclick = deleteCharacterBuild;
  $('sim-build-duplicate').onclick = duplicateCharacterBuild;
  $('sim-build-share').onclick = () => openBuildTransfer('export');
  $('sim-build-import').onclick = () => openBuildTransfer('import');
  $('sim-build-select').onchange = e => { if (e.target.value) loadCharacterBuild(e.target.value, renderExtra); };
  document.addEventListener('click', e => { if (e.target.closest('#sim-tab-equip-content')) setTimeout(refreshCharacterSummary, 0); });
  renderExtra(); renderBuildSelect(); initBuildTransfer(); refreshCharacterSummary();
}

function getBuildEffectCoverage() {
  const audit = window.AureumEffects.auditItems(getAllEquippedItems());
  return { items:audit.entries.map(entry => entry.item), entries:audit.entries, ...audit.counts, percent:audit.percent };
}

function getActiveBuild() {
  const id = APP.activeBuildId || localStorage.getItem('aureum_active_build_id');
  const build = id && readBuildStore()[id];
  return build ? { id, build } : null;
}

function updateSimulationBuildGate() {
  const active = getActiveBuild();
  const eyebrow = $('sim-empty-eyebrow');
  const title = $('sim-empty-title');
  const copy = $('sim-empty-copy');
  const link = $('sim-empty-go-character');
  const status = document.querySelector('.arena-status');

  if (active) {
    if (eyebrow) eyebrow.textContent = 'PRONTO PARA ANALISAR';
    if (title) title.textContent = 'Escolha um monstro para iniciar';
    if (copy) copy.textContent = `A build “${active.build.name}” está salva e pronta. Escolha um alvo para analisar dano, acerto, XP e eficiência de farm.`;
    if (link) link.hidden = true;
    if (status && !APP.currentSimMob) status.innerHTML = '<i></i> Build salva · aguardando alvo';
  } else {
    if (eyebrow) eyebrow.textContent = 'BUILD NECESSÁRIA';
    if (title) title.textContent = 'Crie e salve uma build primeiro';
    if (copy) copy.textContent = 'O simulador usa uma build salva para cruzar atributos, equipamentos, cartas, elemento, raça e tamanho com o monstro escolhido.';
    if (link) link.hidden = false;
    if (status) status.innerHTML = '<i></i> Aguardando build salva';
  }
}

function renderSimulationBuildRequired() {
  const container = $('sim-battle-results');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML = `<div class="simulation-build-required">
    <span class="sim-eyebrow">BUILD NECESSÁRIA</span>
    <h4>Salve sua build para liberar a simulação</h4>
    <p>O alvo foi identificado, mas os cálculos só usam equipamentos, cartas e atributos de uma build salva.</p>
    <button class="character-sim-link" type="button" data-open-character>Ir ao Painel do Personagem <span>→</span></button>
  </div>`;
  container.querySelector('[data-open-character]')?.addEventListener('click', () => navigateTo('character'));
  const arenaStatus = document.querySelector('.arena-status');
  if (arenaStatus) arenaStatus.innerHTML = '<i></i> Salve uma build para continuar';
}

function initCharacterPage() {
  const mount = $('character-builder-mount');
  const panel = document.querySelector('#page-simulator .sim-char-panel');
  const layout = document.querySelector('#page-simulator .simulator-layout');
  if (mount && panel) mount.append(panel);
  layout?.classList.add('solo');

  APP.activeBuildId = localStorage.getItem('aureum_active_build_id') || null;
  const active = getActiveBuild();
  const select = $('sim-build-select');
  if (active && select) {
    select.value = active.id;
    select.dispatchEvent(new Event('change'));
  }

  $('character-go-simulator')?.addEventListener('click', () => navigateTo('simulator'));
  $('sim-empty-go-character')?.addEventListener('click', () => navigateTo('character'));
  updateSimulationBuildGate();
}

function captureCharacterBuild(name) {
  return {
    name: String(name || $('sim-build-name').value.trim() || 'Minha build').slice(0, 80),
    base: Object.fromEntries(CHARACTER_BUILD_BASE_KEYS.map(key => {
      const element = $(key);
      return [key, element?.type === 'checkbox' ? element.checked : (element?.value ?? null)];
    })),
    equip: {
      weapon: APP.simEquip.weapon?.id,
      shield: APP.simEquip.shield?.id,
      armor: APP.simEquip.armor?.id,
      weaponCards: (APP.simEquip.weaponCards || []).map(card => card?.id),
      shieldCards: (APP.simEquip.shieldCards || []).map(card => card?.id),
      armorCards: (APP.simEquip.armorCards || []).map(card => card?.id),
      extra: Object.fromEntries(Object.entries(APP.simEquip.extra || {}).filter(([, item]) => item?.id).map(([key, item]) => [key, item.id]))
    }
  };
}

function makeCopyName(builds, sourceName) {
  const names = new Set(Object.values(builds).map(build => String(build?.name || '').toLocaleLowerCase('pt-BR')));
  const base = `Cópia de ${sourceName || 'Minha build'}`;
  if (!names.has(base.toLocaleLowerCase('pt-BR'))) return base;
  let index = 2;
  while (names.has(`${base} (${index})`.toLocaleLowerCase('pt-BR'))) index += 1;
  return `${base} (${index})`;
}

function duplicateCharacterBuild() {
  if (!getActiveBuild()) {
    $('sim-build-status').textContent = 'Salve a build atual antes de duplicá-la.';
    return;
  }
  const builds = readBuildStore();
  const name = makeCopyName(builds, $('sim-build-name').value.trim());
  const id = String(Date.now());
  builds[id] = captureCharacterBuild(name);
  localStorage.setItem('aureum_character_builds', JSON.stringify(builds));
  APP.activeBuildId = id;
  localStorage.setItem('aureum_active_build_id', id);
  $('sim-build-name').value = name;
  renderBuildSelect();
  $('sim-build-select').value = id;
  refreshCharacterSummary();
  updateSimulationBuildGate();
}

function encodeBuildCode(build) {
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, build }));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `AUREUM1.${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

function decodeBuildCode(code) {
  const raw = String(code || '').trim().replace(/\s/g, '');
  if (!raw.startsWith('AUREUM1.')) throw new Error('Este código não é uma build AureumRO válida.');
  const encoded = raw.slice(8).replace(/-/g, '+').replace(/_/g, '/');
  const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4);
  let binary;
  try { binary = atob(padded); } catch (_) { throw new Error('Não foi possível ler este código de build.'); }
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch (_) { throw new Error('O conteúdo da build está corrompido ou incompleto.'); }
  if (payload?.version !== 1 || !payload.build || typeof payload.build !== 'object') throw new Error('Esta versão de build ainda não é suportada.');
  return normalizeImportedBuild(payload.build);
}

function normalizeImportedBuild(build) {
  if (!build || typeof build !== 'object' || !build.base || !build.equip) throw new Error('O código não contém os dados necessários da build.');
  const toId = value => Number.isFinite(Number(value)) ? Number(value) : undefined;
  const list = value => Array.isArray(value) ? value.map(toId) : [];
  const extra = Object.fromEntries(CHARACTER_SLOTS.map(slot => [slot.key, toId(build.equip.extra?.[slot.key])]).filter(([, value]) => value));
  const buffKeys = BUFF_FIELD_IDS;
  return {
    name: String(build.name || 'Build importada').slice(0, 80),
    base: Object.fromEntries(CHARACTER_BUILD_BASE_KEYS.map(key => {
      if (key === 'sim-reborn-rate') return [key, build.base[key] || '5x'];
      if (key === 'sim-reborn-elo') return [key, String(build.base[key] || '0')];
      return [key, buffKeys.includes(key) ? !!build.base[key] : (build.base[key] ?? null)];
    })),
    equip: { weapon: toId(build.equip.weapon), shield: toId(build.equip.shield), armor: toId(build.equip.armor), weaponCards: list(build.equip.weaponCards), shieldCards: list(build.equip.shieldCards), armorCards: list(build.equip.armorCards), extra }
  };
}

let buildTransferMode = 'export';

function setBuildTransferStatus(message = '', isError = false) {
  const status = $('buildTransferStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function closeBuildTransfer() {
  $('buildTransferOverlay')?.classList.remove('open');
  $('buildTransferOverlay')?.setAttribute('aria-hidden', 'true');
}

function openBuildTransfer(mode) {
  const overlay = $('buildTransferOverlay');
  const code = $('buildTransferCode');
  if (!overlay || !code) return;
  buildTransferMode = mode;
  const exporting = mode === 'export';
  $('buildTransferEyebrow').textContent = exporting ? 'BUILD PORTÁTIL' : 'IMPORTAR BUILD';
  $('buildTransferTitle').textContent = exporting ? 'Compartilhar build' : 'Importar uma build';
  $('buildTransferCopy').textContent = exporting
    ? 'Use este código para abrir a mesma build em outro navegador, sem depender de arquivo ou JSON.'
    : 'Cole o código recebido. A build será salva localmente e poderá ser revisada antes de simular.';
  $('buildTransferConfirm').textContent = exporting ? 'Copiar código' : 'Importar build';
  code.readOnly = exporting;
  code.placeholder = exporting ? '' : 'Cole aqui o código que começa com AUREUM1.';
  if (exporting) {
    const active = getActiveBuild();
    if (!active) { $('sim-build-status').textContent = 'Salve a build antes de compartilhá-la.'; return; }
    code.value = encodeBuildCode(active.build);
  } else {
    code.value = '';
  }
  setBuildTransferStatus();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => { if (exporting) code.select(); else code.focus(); }, 0);
}

async function copyBuildCode() {
  const code = $('buildTransferCode');
  try {
    await navigator.clipboard.writeText(code.value);
    setBuildTransferStatus('Código copiado. Agora é só colar no outro navegador.');
  } catch (_) {
    code.select();
    setBuildTransferStatus('Selecione e copie o código manualmente (Ctrl + C).');
  }
}

function importBuildCode() {
  try {
    const build = decodeBuildCode($('buildTransferCode').value);
    const builds = readBuildStore();
    const id = String(Date.now());
    builds[id] = build;
    localStorage.setItem('aureum_character_builds', JSON.stringify(builds));
    renderBuildSelect();
    $('sim-build-select').value = id;
    $('sim-build-select').dispatchEvent(new Event('change'));
    closeBuildTransfer();
  } catch (error) {
    setBuildTransferStatus(error.message || 'Não foi possível importar esta build.', true);
  }
}

function initBuildTransfer() {
  const overlay = $('buildTransferOverlay');
  if (!overlay) return;
  $('buildTransferClose').onclick = closeBuildTransfer;
  $('buildTransferCancel').onclick = closeBuildTransfer;
  $('buildTransferConfirm').onclick = () => buildTransferMode === 'export' ? copyBuildCode() : importBuildCode();
  overlay.addEventListener('click', event => { if (event.target === overlay) closeBuildTransfer(); });
}

function getClassFactors(className) {
  const c = String(className || '').toUpperCase();
  if (c.includes('KNIGHT') || c.includes('CRUSADER') || c.includes('GUARD') || c.includes('CHICKEN') || c.includes('ROYAL')) {
    return { hp: 1.5, sp: 0.7 };
  }
  if (c.includes('WIZARD') || c.includes('MAGE') || c.includes('SAGE') || c.includes('SORCERER') || c.includes('ELEMENTAL') || c.includes('WARLOCK')) {
    return { hp: 0.7, sp: 1.8 };
  }
  if (c.includes('PRIEST') || c.includes('CARDINAL') || c.includes('MONK') || c.includes('INQUISITOR') || c.includes('SURA') || c.includes('ACOLYTE')) {
    return { hp: 1.1, sp: 1.4 };
  }
  if (c.includes('ASSASSIN') || c.includes('CROSS') || c.includes('ROGUE') || c.includes('CHASER') || c.includes('STALKER') || c.includes('THIEF') || c.includes('NINJA') || c.includes('KAGEROU') || c.includes('OBORO') || c.includes('SHINKIRO') || c.includes('SHIRANUI')) {
    return { hp: 1.1, sp: 0.9 };
  }
  if (c.includes('BLACKSMITH') || c.includes('WHITESMITH') || c.includes('MEISTER') || c.includes('ALCHEMIST') || c.includes('BIOLO') || c.includes('CREATOR') || c.includes('MERCHANT') || c.includes('MECHANIC')) {
    return { hp: 1.2, sp: 0.8 };
  }
  if (c.includes('NOVICE')) {
    return { hp: 0.5, sp: 0.5 };
  }
  return { hp: 1.0, sp: 1.0 };
}

function refreshCharacterSummary() {
  if (!$('sim-derived-strip')) return;
  const bonus = aggregateCharacterEffects();
  const level = Number($('sim-nivel').value) || 1;
  const str = (Number($('sim-str').value)||1) + bonus.str;
  const agi = (Number($('sim-agi').value)||1) + bonus.agi;
  const vit = (Number($('sim-vit').value)||1) + bonus.vit;
  const int = (Number($('sim-int').value)||1) + bonus.int;
  const dex = (Number($('sim-dex').value)||1) + bonus.dex;
  const luk = (Number($('sim-luk').value)||1) + bonus.luk;
  
  // Obter Classe e seus fatores de HP/SP
  const classSelect = $('sim-classe');
  let className = 'NOVICE';
  if (classSelect && classSelect.value && classSpritesData && classSpritesData[classSelect.value]) {
    className = classSpritesData[classSelect.value].split('/').pop().replace('.gif', '');
  }
  const factors = getClassFactors(className);

  // Cálculos Derivados Avançados
  const baseHp = 100 + level * 50 * factors.hp;
  const hp = Math.floor(baseHp * (1 + vit / 100) * (1 + (bonus.hpPct || 0) / 100) + bonus.hp);

  const baseSp = 10 + level * 5 * factors.sp;
  const sp = Math.floor(baseSp * (1 + int / 100) * (1 + (bonus.spPct || 0) / 100) + bonus.sp);

  const weaponType = $('sim-arma-tipo')?.value || 'Desarmado';
  const isRanged = ['Arco', 'Instrumento', 'Chicote', 'ArmaFogo'].includes(weaponType);
  const weaponAtq = Number(APP.simEquip.weapon?.atq)||0;
  const statusAtq = isRanged
    ? (dex + dex*dex/100 + str/5 + luk/3)
    : (str + str*str/100 + dex/5 + luk/3);
  const fixedAtq = statusAtq + bonus.atq;
  const minWeaponAtq = weaponAtq * Math.min(1, dex / 100);
  const minAtq = Math.floor(fixedAtq + minWeaponAtq);
  const maxAtq = Math.floor(fixedAtq + weaponAtq);
  const atq = Math.floor((minAtq + maxAtq) / 2);
  
  const weaponAtqm = Number(APP.simEquip.weapon?.atqm || APP.simEquip.weapon?.matq) || 0;
  const fixedAtqm = weaponAtqm + (bonus.atqm || bonus.matq || 0);
  const minAtqm = Math.floor(int + Math.floor(int / 7) ** 2 + fixedAtqm);
  const maxAtqm = Math.floor(int + Math.floor(int / 5) ** 2 + fixedAtqm);
  const atqm = Math.floor((minAtqm + maxAtqm) / 2);

  const hit = Math.floor(level + dex + luk/3 + bonus.hit);
  const flee = Math.floor(level + agi + bonus.flee);
  const baseAspd = Math.min(193, 150 + agi/5 + dex/10 + bonus.aspd);
  const aspd = Math.min(193, Math.floor(200 - (200 - baseAspd) * (1 - Math.min(80, bonus.aspdPct || 0) / 100)));

  const def = Math.floor(vit / 2 + level / 2 + (bonus.def || 0) + (bonus.hardDef || 0) + (bonus.softDef || 0));
  const mdef = Math.floor(int / 4 + vit / 4 + level / 4 + (bonus.mdef || 0) + (bonus.hardMdef || 0) + (bonus.softMdef || 0));
  const critBase = 1 + luk / 3 + (bonus.crit || 0);
  const crit = Math.floor(critBase * (1 + (bonus.critPct || 0) / 100));
  const castReduction = Math.min(100, Math.floor((dex * 2 + int) / 530 * 100) + (bonus.castReduction || 0));

  $('sim-atq').value = atq; $('sim-hit').value = hit; $('sim-flee').value = flee;
  
  const derivedEntries = [
    ['HP', hp],
    ['SP', sp],
    ['ATQ', atq],
    ['ATQM', atqm],
    ['HIT', hit],
    ['FLEE', flee],
    ['ASPD', aspd],
    ['DEF', def],
    ['MDEF', mdef],
    ['CRIT', crit]
  ];
  const previousDerived = APP.previousDerived || {};
  $('sim-derived-strip').innerHTML = derivedEntries.map(([label,value]) => {
    const delta = Number(value) - Number(previousDerived[label]);
    const changed = Number.isFinite(delta) && delta !== 0 && previousDerived[label] != null;
    const tone = changed ? (delta > 0 ? ' increased' : ' decreased') : '';
    const deltaLabel = changed ? `<small class="stat-delta">${delta > 0 ? '+' : ''}${delta}</small>` : '';
    return `<div class="derived-stat${tone}"><b>${value}</b><span>${label}</span>${deltaLabel}</div>`;
  }).join('');
  APP.previousDerived = Object.fromEntries(derivedEntries);

  if ($('sim-equip-live-summary')) {
    $('sim-equip-live-summary').innerHTML = [
      ['ATQ', atq], ['ATQM', atqm], ['HIT', hit], ['FLEE', flee], ['HP', hp], ['DEF', def],
      ['Dano', `+${bonus.damagePct || 0}%`], ['Drop', `+${bonus.dropRate || 0}%`]
    ].map(([label,value]) => `<div><b>${value}</b><span>${label}</span></div>`).join('');
  }

  const coverage = getBuildEffectCoverage();
  if ($('sim-effect-coverage')) {
    const reviewCount = coverage.partial + coverage.incomplete;
    const tone = reviewCount ? 'warning' : coverage.items.length ? 'complete' : 'empty';
    const incompleteNames = coverage.entries.filter(entry => ['partial','incomplete'].includes(entry.effects.coverage.status)).map(entry => entry.item.nome).join(', ');
    $('sim-effect-coverage').className = `effect-coverage ${tone}`;
    $('sim-effect-coverage').title = incompleteNames ? `Revisar: ${incompleteNames}` : '';
    $('sim-effect-coverage').innerHTML = coverage.items.length
      ? `<div><strong>${coverage.percent}% com cobertura</strong><span>${coverage.complete} completo${coverage.complete === 1 ? '' : 's'}${coverage.partial ? ` · ${coverage.partial} parcial${coverage.partial === 1 ? '' : 'is'}` : ''}${coverage.informational ? ` · ${coverage.informational} informativo${coverage.informational === 1 ? '' : 's'}` : ''}</span></div><i style="--coverage:${coverage.percent}%"></i>${reviewCount ? `<b>${reviewCount} para revisar</b>` : '<b>Build coberta</b>'}`
      : '<div><strong>Cobertura da build</strong><span>Equipe itens para auditar os efeitos</span></div><b>Aguardando</b>';
  }

  const reborn = bonus.reborn || getRebornEffects();
  if ($('sim-reborn-impact')) {
    $('sim-reborn-impact').classList.toggle('active', reborn.active);
    $('sim-reborn-impact').innerHTML = reborn.active
      ? `<span>${plainText(reborn.name)} · ${plainText(reborn.rate)}</span><small>ATQ/ATQM +${reborn.atq} · dano +${reborn.damagePct}% · drop +${reborn.dropRate}% · ${fmt(reborn.coin)} Coins / ${fmt(reborn.zeny)} z</small>`
      : '<span>Reborn inativo</span><small>Selecione o título equipado</small>';
  }
  
  const unresolvedEffects = coverage.entries
    .filter(entry => ['partial','incomplete'].includes(entry.effects.coverage.status))
    .flatMap(entry => [...entry.effects.unresolved, ...entry.effects.conditional].slice(0, 3).map(detail => `${entry.item.nome}: ${detail}`));
  const visibleEffects = [
    ...bonus.labels.map(label => `<span class="effect-chip">${plainText(label)}</span>`),
    ...unresolvedEffects.map(label => `<span class="effect-chip unresolved" title="Este efeito permanece apenas informativo até receber uma regra de cálculo.">${plainText(label)}</span>`)
  ];
  $('sim-auto-effects').innerHTML = visibleEffects.length ? visibleEffects.join('') : '<span class="effect-empty">Equipe itens para ver os bônus.</span>';
  
  APP.character = { 
    level, 
    stats:{str,agi,vit,int,dex,luk}, 
    derived:{hp,sp,atq,minAtq,maxAtq,atqm,minAtqm,maxAtqm,hit,flee,aspd,def,mdef,crit,perfectDodge:bonus.perfectDodge,castReduction},
    equipment:Object.fromEntries(getAllEquippedItems().map(i => [i.id,i.nome])), 
    effects:bonus,
    reborn
  };
  const activeBuild = getActiveBuild();
  $('sim-build-status').textContent = activeBuild
    ? `${getAllEquippedItems().length} itens/cartas · ${bonus.labels.length} efeitos automáticos · build salva e pronta para simular`
    : `${getAllEquippedItems().length} itens/cartas · ${bonus.labels.length} efeitos automáticos · salve a build para liberar o simulador`;
  if (APP.currentSimMob) runSimulation(APP.currentSimMob);
}

function readBuildStore() { try { return JSON.parse(localStorage.getItem('aureum_character_builds') || '{}'); } catch (_) { return {}; } }

function renderBuildSelect() {
  const select = $('sim-build-select');
  if (!select) return;
  const builds = readBuildStore();
  const entries = Object.entries(builds);
  const options = entries.map(([id, b]) => `<option value="${id}">${plainText(b.name || 'Build Sem Nome')}</option>`).join('');
  select.innerHTML = `<option value="">Builds salvas (${entries.length})</option>` + options;
  if (APP.activeBuildId && builds[APP.activeBuildId]) {
    select.value = APP.activeBuildId;
  }
}

function saveCharacterBuild() {
  const builds = readBuildStore();
  const name = $('sim-build-name').value.trim() || 'Minha build';
  const id = (APP.activeBuildId && builds[APP.activeBuildId]) ? APP.activeBuildId : String(Date.now());
  builds[id] = captureCharacterBuild(name);
  localStorage.setItem('aureum_character_builds', JSON.stringify(builds));
  APP.activeBuildId = id;
  localStorage.setItem('aureum_active_build_id', id);
  renderBuildSelect();
  refreshCharacterSummary();
  updateSimulationBuildGate();
  if ($('sim-build-status')) {
    $('sim-build-status').textContent = `Build "${name}" salva com sucesso!`;
  }
}

function deleteCharacterBuild() {
  const builds = readBuildStore();
  if (!APP.activeBuildId || !builds[APP.activeBuildId]) {
    alert('Nenhuma build salva está selecionada para excluir.');
    return;
  }
  const buildName = builds[APP.activeBuildId].name || 'esta build';
  if (!confirm(`Tem certeza que deseja excluir a build "${buildName}"?`)) return;

  delete builds[APP.activeBuildId];
  localStorage.setItem('aureum_character_builds', JSON.stringify(builds));

  const remainingKeys = Object.keys(builds);
  if (remainingKeys.length > 0) {
    const nextId = remainingKeys[0];
    loadCharacterBuild(nextId, () => {});
  } else {
    APP.activeBuildId = null;
    localStorage.removeItem('aureum_active_build_id');
    $('sim-build-name').value = 'Minha build';
    renderBuildSelect();
    refreshCharacterSummary();
    updateSimulationBuildGate();
  }
}

function loadCharacterBuild(id, renderExtra = () => {}) {
  const build = readBuildStore()[id];
  if (!build) return;

  APP.activeBuildId = id;
  localStorage.setItem('aureum_active_build_id', id);

  if (!Object.prototype.hasOwnProperty.call(build.base || {}, 'sim-reborn-rate')) $('sim-reborn-rate').value = '5x';
  if (!Object.prototype.hasOwnProperty.call(build.base || {}, 'sim-reborn-elo')) $('sim-reborn-elo').value = '0';

  Object.entries(build.base || {}).forEach(([k, v]) => {
    const el = $(k);
    if (el) {
      if (el.type === 'checkbox') el.checked = !!v;
      else {
        el.value = v;
        if (k === 'sim-classe') {
          updateSkillsSelect(v);
        }
      }
    }
  });

  const find = itemId => APP.db.items.find(i => i.id === itemId) || null;
  APP.simEquip.weapon = find(build.equip.weapon);
  APP.simEquip.shield = find(build.equip.shield);
  APP.simEquip.armor = find(build.equip.armor);
  APP.simEquip.weaponCards = (build.equip.weaponCards || []).map(find);
  APP.simEquip.shieldCards = (build.equip.shieldCards || []).map(find);
  APP.simEquip.armorCards = (build.equip.armorCards || []).map(find);
  APP.simEquip.extra = Object.fromEntries(Object.entries(build.equip.extra || {}).map(([k, v]) => [k, find(v)]).filter(([, v]) => v));

  $('sim-build-name').value = build.name || 'Minha build';
  localStorage.setItem('aureum_character_extra', JSON.stringify(build.equip.extra || {}));

  APP.renderSimulatorEquipment?.();
  if (typeof renderExtra === 'function') renderExtra();
  renderBuildSelect();
  refreshCharacterSummary();
  updateSimulationBuildGate();
}

function runSimulation(mob) {
  if (!getActiveBuild()) {
    renderSimulationBuildRequired();
    return;
  }
  const container = $('sim-battle-results');
  container.style.display = 'block';
  const arenaStatus = document.querySelector('.arena-status');
  if (arenaStatus) arenaStatus.innerHTML = `<i></i> Analisando ${plainText(mob.nome)}`;

  const charNivel = parseInt($('sim-nivel').value) || 1;
  const charHit = parseInt($('sim-hit').value) || 0;
  const charFlee = parseInt($('sim-flee').value) || 0;
  const str = (Number($('sim-str').value)||1) + (APP.character?.effects?.str || 0);
  const agi = (Number($('sim-agi').value)||1) + (APP.character?.effects?.agi || 0);
  const vit = (Number($('sim-vit').value)||1) + (APP.character?.effects?.vit || 0);
  const int_ = (Number($('sim-int').value)||1) + (APP.character?.effects?.int || 0);
  const dex = (Number($('sim-dex').value)||1) + (APP.character?.effects?.dex || 0);
  const luk = (Number($('sim-luk').value)||1) + (APP.character?.effects?.luk || 0);
  
  const cardMods = getEquippedCardModifiers(mob);
  const bRaca = cardMods.raca;
  const bTamanho = cardMods.tamanho;
  const bElemento = cardMods.elemento;

  const reqHit = (mob.nivel || 0) + (mob.agi || 0) + 20;
  const reqFlee = (mob.nivel || 0) + (mob.des || 0) + 75;

  // --- SMART ENGINE ---
  let mobElemStr = (mob.elemento || 'Neutro').split(' ')[0].trim();
  let mobElemLvl = parseInt((mob.elemento || '').replace(/^\D+/g, '')) || 1;
  mobElemLvl = Math.max(1, Math.min(4, mobElemLvl));

  const elemMap = { 'Água': 'Agua', 'Maldito': 'Maldito', 'Fogo': 'Fogo', 'Terra': 'Terra', 'Vento': 'Vento', 'Veneno': 'Veneno', 'Sagrado': 'Sagrado', 'Sombrio': 'Sombrio', 'Fantasma': 'Fantasma', 'Neutro': 'Neutro' };
  const mobElem = elemMap[mobElemStr] || 'Neutro';
  const mobTamanho = mob.tamanho || 'Médio';

  const armaTipo = $('sim-arma-tipo').value;
  const armaElem = $('sim-arma-elemento').value;
  const ataqueTipo = $('sim-ataque-tipo')?.value || 'basico';
  const skillLevel = parseInt($('sim-skill-level')?.value) || 10;

  // ── Fase 2: Use SKILL_DATA ──
  const si = getSkillInfo(ataqueTipo, skillLevel);
  const isMagic = si.isMagic;
  const ignoresDefense = si.ignoresDefense;
  const ignoresFlee = si.ignoresFlee;
  const isMultiHit = si.hits;

  const sizeMod = (SIZE_PENALTY[armaTipo] && SIZE_PENALTY[armaTipo][mobTamanho]) ? SIZE_PENALTY[armaTipo][mobTamanho] : 1.0;
  const levelMatrix = ELEM_MULTI[mobElemLvl] || ELEM_MULTI[1];
  const elemMod = (levelMatrix[armaElem] && levelMatrix[armaElem][mobElem] != null) ? levelMatrix[armaElem][mobElem] : 1.0;

  const raceMod = 1 + (bRaca / 100);
  const sizeTotal = sizeMod * (1 + bTamanho / 100);
  const elementTotal = elemMod * (1 + bElemento / 100);
  const finalMod = raceMod * sizeTotal * elementTotal;
  const finalSizeMod = isMagic ? 1.0 : sizeMod;

  // Obter estatísticas derivadas consolidadas do Personagem
  const charSp = APP.character?.derived?.sp || 10;
  const aspd = APP.character?.derived?.aspd || 150;
  const characterDamageMod = 1 + (Number(APP.character?.effects?.damagePct) || 0) / 100;

  // ── Fase 2: Damage Breakdown Steps ──
  const buildBreakdown = (atqVal, atqmVal, label) => {
    const steps = [];
    const baseVal = isMagic ? atqmVal : atqVal;
    steps.push({ label: isMagic ? 'ATQM base' : 'ATQ base', value: fmt(baseVal), formula: `Derivado do personagem (${label})` });

    // Skill multiplier
    let rawDmg;
    const skillMult = si.mult;
    switch (si.special) {
      case 'spiral': {
        const weaponWeight = Number(APP.simEquip.weapon?.peso) || 0;
        const bonusAtq = APP.character?.effects?.atq || 0;
        const weaponAtq = Number(APP.simEquip.weapon?.atq) || 0;
        const statusAtq = Math.max(0, atqVal - weaponAtq - bonusAtq);
        rawDmg = (Math.floor(weaponWeight / 2) * 5 + statusAtq) * skillMult;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `Peso arma: ${weaponWeight} · Fórmula especial`, tone: 'info' });
        break;
      }
      case 'shieldBoomerang': {
        const shieldDef = Number(APP.simEquip.shield?.def) || 0;
        rawDmg = shieldDef * 4.0 + atqVal * skillMult;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `DEF Escudo: ${shieldDef} × 4 + ATQ × ${skillMult}`, tone: 'info' });
        break;
      }
      case 'grandCross':
        rawDmg = (atqVal + atqmVal) * skillMult;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `(ATQ + ATQM) × ${skillMult} — Híbrido`, tone: 'info' });
        break;
      case 'soulDestroyer':
        rawDmg = (atqVal * skillMult) + (int_ * 5.0) + 1000;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `ATQ×${skillMult} + INT×5 + 1000 — Híbrido`, tone: 'info' });
        break;
      case 'occult':
        rawDmg = atqVal * (1 + (mob.def || 0) / 100) * skillMult;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `ATQ × (1 + DEF%/100) × ${skillMult}`, tone: 'info' });
        break;
      case 'asura':
        rawDmg = (atqVal * (skillMult + charSp / 10) + 1000);
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${(skillMult + charSp/10).toFixed(1)}`, formula: `ATQ × (${skillMult} + SP/${10}) + 1000 · SP: ${charSp}`, tone: 'info' });
        break;
      case 'acidDemo':
        rawDmg = (atqVal * 0.7 + atqmVal * 0.7) * (mob.vit || 1) * skillMult;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `(ATQ+ATQM)×0.7 × VIT mob × ${skillMult}`, tone: 'info' });
        break;
      case 'shuriken':
        rawDmg = atqVal * skillMult + 150;
        steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `ATQ × ${skillMult} + 150`, tone: 'info' });
        break;
      default:
        rawDmg = isMagic ? atqmVal * skillMult : atqVal * skillMult;
        if (ataqueTipo !== 'basico') {
          steps.push({ label: `${si.skill.name} Lv${si.level}`, value: `×${skillMult.toFixed(1)}`, formula: `${skillMult * 100}% do ${isMagic ? 'ATQM' : 'ATQ'}`, tone: skillMult > 1 ? 'info' : '' });
        }
    }

    // Defense
    let afterDef;
    if (ignoresDefense) {
      afterDef = rawDmg;
      steps.push({ label: 'Defesa ignorada', value: '—', formula: `${si.skill.name} ignora DEF/MDEF`, tone: 'success' });
    } else if (isMagic) {
      const hardMdef = mob.mdef || 0;
      const softMdef = mob.int || 0;
      afterDef = rawDmg * (100 - hardMdef) / 100 - softMdef;
      steps.push({ label: 'Hard MDEF do alvo', value: `-${hardMdef}%`, formula: `dano × (100 - ${hardMdef}) / 100`, tone: hardMdef > 30 ? 'danger' : 'warning' });
      if (softMdef > 0) steps.push({ label: 'Soft MDEF (INT)', value: `-${softMdef}`, formula: `mob INT = ${softMdef}`, tone: 'warning' });
    } else {
      const hardDef = mob.def || 0;
      const softDef = mob.vit || 0;
      afterDef = rawDmg * (100 - hardDef) / 100 - softDef;
      steps.push({ label: 'Hard DEF do alvo', value: `-${hardDef}%`, formula: `dano × (100 - ${hardDef}) / 100`, tone: hardDef > 30 ? 'danger' : 'warning' });
      if (softDef > 0) steps.push({ label: 'Soft DEF (VIT)', value: `-${softDef}`, formula: `mob VIT = ${softDef}`, tone: 'warning' });
    }

    // Modifiers
    if (raceMod !== 1.0) steps.push({ label: `Raça: ${plainText(mob.raca || '?')}`, value: `×${raceMod.toFixed(2)}`, formula: bRaca ? `Bônus de cartas/equip +${bRaca}%` : 'Sem bônus', tone: raceMod > 1 ? 'success' : raceMod < 1 ? 'danger' : '' });
    if (elemMod !== 1.0 || bElemento) steps.push({ label: `Elemento: ${armaElem} → ${mobElemStr} Nv${mobElemLvl}`, value: `×${(elemMod * (1 + bElemento/100)).toFixed(2)}`, formula: `Tabela: ${(elemMod*100).toFixed(0)}%${bElemento ? ` + bônus ${bElemento}%` : ''}`, tone: elemMod > 1 ? 'success' : elemMod < 1 ? 'danger' : '' });
    if (!isMagic && finalSizeMod !== 1.0) steps.push({ label: `Tamanho: ${armaTipo} → ${mobTamanho}`, value: `×${(finalSizeMod * (1 + bTamanho/100)).toFixed(2)}`, formula: `Penalidade: ${(finalSizeMod*100).toFixed(0)}%${bTamanho ? ` + bônus ${bTamanho}%` : ''}`, tone: finalSizeMod >= 1 ? 'success' : 'warning' });
    if (characterDamageMod !== 1.0) steps.push({ label: 'Dano % (equipamento)', value: `×${characterDamageMod.toFixed(2)}`, formula: `+${(Number(APP.character?.effects?.damagePct) || 0)}% de equipamentos`, tone: 'success' });

    let finalDmg = afterDef * raceMod * elemMod * (1 + bElemento / 100) * (1 + bTamanho / 100) * finalSizeMod * characterDamageMod;
    finalDmg = Math.max(1, Math.floor(finalDmg));
    steps.push({ label: 'Dano final por hit', value: fmt(finalDmg), formula: `${label}`, tone: 'total' });

    return { damage: finalDmg, steps };
  };

  // Obter ranges de ATQ/ATQM
  const charMinAtq = APP.character?.derived?.minAtq ?? APP.character?.derived?.atq ?? 0;
  const charMaxAtq = APP.character?.derived?.maxAtq ?? APP.character?.derived?.atq ?? 0;
  const charAvgAtq = APP.character?.derived?.atq ?? 0;
  const charMinAtqm = APP.character?.derived?.minAtqm ?? APP.character?.derived?.atqm ?? 0;
  const charMaxAtqm = APP.character?.derived?.maxAtqm ?? APP.character?.derived?.atqm ?? 0;
  const charAvgAtqm = APP.character?.derived?.atqm ?? 0;

  const breakMin = buildBreakdown(charMinAtq, charMinAtqm, 'Mínimo');
  const breakAvg = buildBreakdown(charAvgAtq, charAvgAtqm, 'Médio');
  const breakMax = buildBreakdown(charMaxAtq, charMaxAtqm, 'Máximo');

  const estDanoMin = breakMin.damage;
  const estDanoAvg = breakAvg.damage;
  const estDanoMax = breakMax.damage;

  const totalDanoMin = estDanoMin * isMultiHit;
  const totalDanoAvg = estDanoAvg * isMultiHit;
  const totalDanoMax = estDanoMax * isMultiHit;

  // ── Fase 2: Cálculo de Crítico ──
  const critRate = Math.max(0, Math.min(100, Math.floor(1 + luk * 0.3 + (APP.character?.derived?.crit || 0) - (mob.luk || 0) * 0.2)));
  const critDamageMod = 1 + (Number(APP.character?.effects?.critDamagePct) || 0) / 100;
  // Dano crítico: usa o max damage, ignora soft DEF
  const critDmgPerHit = (() => {
    if (isMagic || ignoresDefense) return estDanoMax; // magia não crita, skills q ignoram DEF já têm max
    const rawDmg = charMaxAtq * si.mult;
    const hardDef = mob.def || 0;
    const afterHardDef = rawDmg * (100 - hardDef) / 100; // soft DEF ignorada em crit
    return Math.max(1, Math.floor(afterHardDef * raceMod * elemMod * (1 + bElemento / 100) * (1 + bTamanho / 100) * finalSizeMod * characterDamageMod * critDamageMod));
  })();
  const totalCritDmg = critDmgPerHit * isMultiHit;

  let hitChance = 100 - (reqHit - charHit);
  hitChance = Math.max(5, Math.min(100, hitChance));
  if (ignoresFlee) hitChance = 100;

  let dodgeChance = 95 - (reqFlee - charFlee);
  dodgeChance = Math.max(5, Math.min(95, dodgeChance));

  const cappedAspd = Math.min(193, aspd);
  const attacksPerSecond = 50 / (200 - cappedAspd);
  
  // DPS ajustado com crítico (Fase 2)
  const normalDmgForDps = totalDanoAvg;
  const critDmgForDps = totalCritDmg;
  const effectiveCritRate = isMagic ? 0 : Math.min(critRate, 100) / 100;
  const avgDmgWithCrit = normalDmgForDps * (1 - effectiveCritRate) + critDmgForDps * effectiveCritRate;
  const dps = avgDmgWithCrit * attacksPerSecond * (hitChance / 100);

  const hitsToKill = totalDanoAvg > 0 ? Math.ceil((mob.hp || 1) / totalDanoAvg) : '∞';
  const effectiveAttacksPerSecond = attacksPerSecond * (hitChance / 100);
  const ttkSeconds = totalDanoAvg > 0 && effectiveAttacksPerSecond > 0
    ? hitsToKill / effectiveAttacksPerSecond
    : Infinity;

  // ── Fase 2: Matchup data ──
  const matchupData = {
    mobRace: mob.raca || 'Desconhecida', mobSize: mobTamanho, mobElement: mobElemStr,
    mobElementLevel: mobElemLvl, attackElement: armaElem,
    weaponLabel: APP.simEquip.weapon?.subtipo || armaTipo,
    raceBonus: bRaca, sizeBonus: bTamanho, elementBonus: bElemento,
    raceMod, sizeBase: finalSizeMod, sizeTotal, elementBase: elemMod, elementTotal, finalMod
  };
  
  const preview = $('sim-matchup-preview');
  if (preview) { preview.className = ''; preview.innerHTML = renderMatchupBreakdown(matchupData); }

  const huntAssessmentHtml = buildHuntAssessment(mob, {
    damage: totalDanoAvg,
    hitChance,
    dodgeChance,
    ttk: ttkSeconds
  });

  // ── Fase 2: Confidence level ──
  const confidenceReasons = [];
  if (si.confidence === 'estimated') confidenceReasons.push(`${si.skill.name}: multiplicadores estimados`);
  const coverage = getBuildEffectCoverage();
  if (coverage.partial + coverage.incomplete > 0) confidenceReasons.push(`${coverage.partial + coverage.incomplete} item(ns) com efeitos parciais`);
  if (!APP.simEquip.weapon && ataqueTipo === 'basico') confidenceReasons.push('Sem arma equipada');
  if (mob.def == null && mob.mdef == null) confidenceReasons.push('Mob sem DEF/MDEF no banco');
  const confLevel = confidenceReasons.length === 0 ? 'complete' : (si.confidence === 'validated' && confidenceReasons.length <= 1) ? 'estimated' : 'estimated';
  const confBadge = getConfidenceBadge(confLevel, confidenceReasons);

  // ── Fase 2: Damage Type Badge ──
  const dtBadge = getDamageTypeBadge(si.type);

  // ── Tips ──
  let tipHtml = '';
  if (elemMod > 1.0) {
    tipHtml += `<div style="color:var(--success); font-size:12px; margin-top:10px;">💡 Ótima escolha! ${armaElem} causa ${Math.round(elemMod * 100)}% de dano em ${mobElemStr} (Nv.${mobElemLvl}).</div>`;
  } else if (elemMod < 1.0) {
    tipHtml += `<div style="color:var(--danger); font-size:12px; margin-top:10px;">⚠️ Compatibilidade elemental: ${armaElem} contra ${mobElemStr} (Nv.${mobElemLvl}) aplica ${Math.round(elemMod * 100)}%.</div>`;
  }
  if (finalSizeMod < 1.0) {
    tipHtml += `<div style="color:var(--warning); font-size:12px; margin-top:5px;">⚠️ Penalidade de tamanho: ${matchupData.weaponLabel} aplica ${Math.round(finalSizeMod * 100)}% em alvos de tamanho ${mobTamanho}.</div>`;
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

  // ── Fase 2: SP cost info ──
  const spInfo = si.spCost > 0 ? `<div style="font-size:10px; color:var(--text-secondary); margin-top:4px;">SP por uso: ${si.spCost}</div>` : '';

  // ── Fase 2: Critical info section ──
  const critSection = (!isMagic && critRate > 0) ? `
    <div style="display:flex; justify-content:space-around; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px; margin-top:8px;">
      <div>
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">CRIT Rate</div>
        <div style="font-size:16px; color:#f59e0b; font-weight:bold;">${critRate}%</div>
      </div>
      <div style="width:1px; height:24px; background:rgba(255,255,255,0.05);"></div>
      <div>
        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Dano Crítico</div>
        <div style="font-size:16px; color:#f59e0b; font-weight:bold;">${fmt(totalCritDmg)}</div>
        <div style="font-size:9px; color:var(--text-secondary);">${critDamageMod > 1 ? `+${Math.round((critDamageMod-1)*100)}% bônus crit` : 'Sem bônus crit %'}</div>
      </div>
    </div>` : '';

  container.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; gap:30px; margin-top:20px;">
      
      <!-- Lado Jogador -->
      <div style="text-align:center;">
        <div style="height:60px; display:flex; align-items:center; justify-content:center; margin-bottom:5px;">
          <img src="${(typeof classSpritesData !== 'undefined' && classSpritesData && classSpritesData[document.getElementById('sim-classe')?.value]) ? classSpritesData[document.getElementById('sim-classe')?.value] : 'assets/sprites/classes/NOVICE.gif'}" style="max-height:100%; object-fit:contain;" onerror="this.style.display='none'">
        </div>
        <div style="color:var(--gold); font-weight:bold; margin-top:10px;">Nível ${charNivel}</div>
        <div style="font-size:12px; color:var(--text-muted);">HIT: ${charHit} | FLEE: ${charFlee}</div>
        <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:center; gap:4px; margin-top:4px;">
          <span>${isMagic ? 'ATQM' : 'ATQ'}:</span>
          <span style="font-weight:600; color:var(--text-primary);">${isMagic ? (charMinAtqm + ' ~ ' + charMaxAtqm) : (charMinAtq + ' ~ ' + charMaxAtq)}</span>
        </div>
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

    <!-- Fase 2: Badges de tipo de dano + confiança -->
    <div style="display:flex; justify-content:center; gap:10px; margin-top:12px; flex-wrap:wrap;">
      <span class="sim-badge ${dtBadge.cls}">${dtBadge.icon} ${dtBadge.label}</span>
      <span class="sim-badge ${confBadge.cls}" title="${plainText(confBadge.tip)}${confidenceReasons.length ? '\\n' + confidenceReasons.map(r => '• ' + r).join('\\n') : ''}">${confBadge.icon} ${confBadge.label}</span>
      ${si.spCost > 0 ? `<span class="sim-badge sim-badge-sp">SP ${si.spCost}/uso</span>` : ''}
    </div>

    ${levelWarning}
    ${huntAssessmentHtml}

    <div style="margin-top:20px; background:rgba(255,255,255,0.02); border:1px solid var(--gold); padding:15px; border-radius:var(--radius); text-align:center;">
      ${renderMatchupBreakdown(matchupData)}
      <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase;">
        Estimativa de Dano ${isMultiHit > 1 ? `(${isMultiHit}x hits)` : 'por Ataque'}${ataqueTipo !== 'basico' ? ` — ${plainText(si.skill.name)} Lv${si.level}` : ''}
      </div>
      
      <!-- Range de Dano -->
      <div style="display:flex; justify-content:center; align-items:baseline; gap:10px; margin:6px 0;">
        <span style="font-size:13px; color:var(--text-muted);">Min ${isMultiHit > 1 ? totalDanoMin : estDanoMin}</span>
        <span style="font-size:32px; color:var(--gold); font-weight:bold;">${isMultiHit > 1 ? totalDanoAvg : estDanoAvg}</span>
        <span style="font-size:13px; color:var(--text-muted);">Max ${isMultiHit > 1 ? totalDanoMax : estDanoMax}</span>
      </div>
      <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-top:-5px; margin-bottom:12px;">
        (Média Estimada)
      </div>

      <!-- DPS e TTK -->
      <div style="display:flex; justify-content:space-around; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px; margin-top:10px;">
        <div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">DPS Estimado</div>
          <div style="font-size:18px; color:var(--gold); font-weight:bold;">${fmt(dps)}</div>
          <div style="font-size:10px; color:var(--text-secondary);">ASPD: ${cappedAspd} (${attacksPerSecond.toFixed(2)} ataques/s)</div>
          ${effectiveCritRate > 0 ? `<div style="font-size:9px; color:#f59e0b;">Inclui ${critRate}% de crítico</div>` : ''}
        </div>
        <div style="width:1px; height:30px; background:rgba(255,255,255,0.05);"></div>
        <div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Tempo p/ Derrotar</div>
          <div style="font-size:18px; color:var(--success); font-weight:bold;">${ttkSeconds === Infinity ? '∞' : ttkSeconds.toFixed(1) + 's'}</div>
          <div style="font-size:10px; color:var(--text-secondary);">Necessário ${hitsToKill} ${isMultiHit > 1 ? 'ataques' : 'acertos'}</div>
        </div>
      </div>

      ${critSection}

      ${ataqueTipo !== 'basico' ? '<div style="font-size:10px; color:var(--text-muted); margin-top:10px;">Para habilidades, o DPS usa a animação baseada em ASPD como referência de spam.</div>' : ''}
      ${spInfo}
      ${tipHtml}
    </div>

    <!-- Fase 2: Painel "Como chegamos neste dano?" -->
    ${renderDamageBreakdown(breakAvg.steps)}

    <div style="margin-top:20px; background:rgba(0,0,0,0.2); padding:15px; border-radius:var(--radius); border:1px solid var(--border);">
      <div style="margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="font-size:14px;">Sua Chance de Acerto</span>
          <span style="color:var(${hitChance >= 100 ? '--gold' : 'white'}); font-weight:bold;">${hitChance}%</span>
        </div>
        <div style="width:100%; background:var(--bg-card); height:8px; border-radius:4px; overflow:hidden;">
          <div style="width:${hitChance}%; background:var(--gold); height:100%; transition:width 0.5s;"></div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); text-align:left; margin-top:4px;">
          ${ignoresFlee ? 'Esta habilidade nunca erra!' : `Para 100%, você precisa de ${reqHit} HIT.`}
        </div>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="font-size:14px;">Sua Chance de Esquiva</span>
          <span style="color:var(${dodgeChance >= 95 ? '--gold' : 'white'}); font-weight:bold;">${dodgeChance}%</span>
        </div>
        <div style="width:100%; background:var(--bg-card); height:8px; border-radius:4px; overflow:hidden;">
          <div style="width:${dodgeChance}%; background:var(--gold); height:100%; transition:width 0.5s;"></div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); text-align:left; margin-top:4px;">Para 95%, você precisa de ${reqFlee} FLEE.</div>
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
  } else if (previous.type === 'map-collection') {
    openMapCollectionModal(previous.id, true);
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
  $('mobModal').classList.remove('collection-detail-modal');
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
              <img src="${getItemIconUrl(d.item_id, 'item')}" referrerpolicy="no-referrer" alt="" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.src='https://placehold.co/24x24/1e2330/d4a843?text=Item'; this.onerror=null;">
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
  $('mobModal').classList.remove('collection-detail-modal');
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
        <img src="${getItemIconUrl(item.id, 'collection')}" referrerpolicy="no-referrer" alt="${item.nome}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='${getItemIconUrl(item.id, 'item')}'; this.onerror=function(){this.src='https://placehold.co/75x100/1e2330/d4a843?text=Item';this.onerror=null;};">
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
  $('mobModal').classList.remove('collection-detail-modal');
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

// ─── Sprites de Classes ───────────────────────
const CLASS_FRIENDLY_NAMES = {
  "0": "Aprendiz (Novice)",
  "1": "Espadachim (Swordman)",
  "2": "Mago (Magician)",
  "3": "Arqueiro (Archer)",
  "4": "Noviço (Acolyte)",
  "5": "Mercador (Merchant)",
  "6": "Gatuno (Thief)",
  "7": "Cavaleiro (Knight)",
  "8": "Sacerdote (Priest)",
  "9": "Bruxo (Wizard)",
  "10": "Ferreiro (Blacksmith)",
  "11": "Caçador (Hunter)",
  "12": "Mercenário (Assassin)",
  "14": "Templário (Crusader)",
  "15": "Monge (Monk)",
  "16": "Sábio (Sage)",
  "17": "Arruaceiro (Rogue)",
  "18": "Alquimista (Alchemist)",
  "19": "Bardo (Bard)",
  "20": "Dançarina (Dancer)",
  "23": "Super Aprendiz",
  "24": "Justiceiro (Gunslinger)",
  "25": "Ninja",
  "4001": "Aprendiz T. (High Novice)",
  "4002": "Espadachim T. (High Swordman)",
  "4003": "Mago T. (High Magician)",
  "4004": "Arqueiro T. (High Archer)",
  "4005": "Noviço T. (High Acolyte)",
  "4006": "Mercador T. (High Merchant)",
  "4007": "Gatuno T. (High Thief)",
  "4008": "Lorde (Lord Knight)",
  "4009": "Sumo Sacerdote (High Priest)",
  "4010": "Arquimago (High Wizard)",
  "4011": "Mestre-Ferreiro (Whitesmith)",
  "4012": "Atirador de Elite (Sniper)",
  "4013": "Algoz (Assassin Cross)",
  "4015": "Paladino (Paladin)",
  "4016": "Campeão (Champion)",
  "4017": "Professor (Scholar)",
  "4018": "Desordeiro (Stalker)",
  "4019": "Criador (Creator)",
  "4020": "Menestrel (Clown)",
  "4021": "Cigana (Gypsy)",
  "4046": "Taekwon Kid",
  "4047": "Mestre Taekwon (Star Gladiator)",
  "4049": "Espiritualista (Soul Linker)"
};

const CLASS_SKILLS = {
  "default": [["basico", "Ataque Básico"]],
  "1": [["bash", "Golpe de Impacto (Bash)"], ["shield_charge", "Golpe de Escudo"]],
  "2": [["fire_bolt", "Lanças de Fogo"], ["cold_bolt", "Lanças de Gelo"]],
  "3": [["double_strafe", "Rajada de Flechas"]],
  "4": [["holy_light", "Luz Divina"]],
  "5": [["mammonite", "Mammonita"], ["cart_rev", "Choque do Carrinho"]],
  "6": [["double_attack", "Golpe Duplo"], ["backstab", "Apunhalar"]],
  "7": [["bowling_bash", "Impacto de Tyr (Bowling Bash)"], ["bash", "Golpe de Impacto"]],
  "8": [["holy_light", "Luz Divina"], ["magnus", "Magnus Exorcismus"]],
  "9": [["fire_bolt", "Lanças de Fogo"], ["storm_gust", "Nevasca (Storm Gust)"]],
  "10": [["cart_termination", "Choque Rápido do Carrinho"], ["mammonite", "Mammonita"], ["cart_rev", "Choque do Carrinho"]],
  "11": [["double_strafe", "Rajada de Flechas"], ["focused_arrow", "Tiro Preciso"]],
  "12": [["sonic_blow", "Lâminas Destruidoras (Sonic Blow)"], ["double_attack", "Golpe Duplo"]],
  "14": [["shield_boomerang", "Escudo Choque (Shield Boomerang)"], ["holy_cross", "Crux Divinum"]],
  "15": [["occult_impaction", "Impacto Psíquico (Occult Impaction)"], ["asura", "Asura Strike (Asura)"]],
  "16": [["fire_bolt", "Lanças de Fogo"]],
  "17": [["backstab", "Apunhalar"], ["raid", "Ataque Surpresa"]],
  "18": [["acid_demo", "Bomba Ácida (Acid Demonstration)"], ["mammonite", "Mammonita"]],
  "19": [["double_strafe", "Rajada de Flechas"], ["arrow_vulcan", "Vulcão de Flechas"]],
  "20": [["double_strafe", "Rajada de Flechas"], ["arrow_vulcan", "Vulcão de Flechas"]],
  "23": [["fire_bolt", "Lanças de Fogo"], ["mammonite", "Mammonita"]],
  "24": [["rapid_shower", "Descarregar Pistola (Rapid Shower)"], ["tracking", "Rastrear Alvo"]],
  "25": [["throw_shuriken", "Arremessar Shuriken"]],
  "4002": [["bash", "Golpe de Impacto"]],
  "4003": [["fire_bolt", "Lanças de Fogo"]],
  "4004": [["double_strafe", "Rajada de Flechas"]],
  "4005": [["holy_light", "Luz Divina"]],
  "4006": [["mammonite", "Mammonita"]],
  "4007": [["double_attack", "Golpe Duplo"]],
  "4008": [["spiral_pierce", "Lança Espiral (Spiral Pierce)"], ["bowling_bash", "Impacto de Tyr"]],
  "4009": [["magnus", "Magnus Exorcismus"]],
  "4010": [["storm_gust", "Nevasca (Storm Gust)"]],
  "4011": [["cart_termination", "Choque Rápido do Carrinho"], ["mammonite", "Mammonita"], ["cart_rev", "Choque do Carrinho"]],
  "4012": [["focused_arrow", "Tiro Preciso"], ["double_strafe", "Rajada de Flechas"]],
  "4013": [["sonic_blow", "Lâminas Destruidoras"], ["soul_destroyer", "Destruidor de Almas (Soul Destroyer)"]],
  "4015": [["shield_boomerang", "Escudo Choque (Shield Boomerang)"], ["grand_cross", "Crux Magnum"]],
  "4016": [["occult_impaction", "Impacto Psíquico (Occult Impaction)"], ["asura", "Asura Strike (Asura)"]],
  "4017": [["fire_bolt", "Lanças de Fogo"]],
  "4018": [["backstab", "Apunhalar"]],
  "4019": [["acid_demo", "Bomba Ácida (Acid Demonstration)"]],
  "4020": [["arrow_vulcan", "Vulcão de Flechas"]],
  "4021": [["arrow_vulcan", "Vulcão de Flechas"]],
  "4046": [["tornado_kick", "Chute Tornado"]],
  "4047": [["tornado_kick", "Chute Tornado"]],
  "4049": [["kaahi", "Kaahi"]]
};

let almasSpritesData = null;
async function initAlmaSprites() {
  try {
    const res = await fetch('almas-sprites.json');
    if (res.ok) {
      almasSpritesData = await res.json();
    }
  } catch (err) {
    console.error('Erro ao carregar almas-sprites.json:', err);
  }
}

function getItemIconUrl(itemId, type = 'item') {
  const idStr = String(itemId);
  if (almasSpritesData && almasSpritesData[idStr]) {
    return almasSpritesData[idStr];
  }
  if (Number(itemId) >= 2000000) {
    return 'assets/sprites/almas/Almas_rar_normal.png';
  }
  return `https://static.divine-pride.net/images/items/${type}/${idStr}.png`;
}

function updateSkillsSelect(classId) {
  const select = document.getElementById('sim-ataque-tipo');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="basico">Ataque Básico</option>';
  const skills = CLASS_SKILLS[classId] || [];
  skills.forEach(([val, name]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = name;
    select.appendChild(opt);
  });
  if ([...select.options].some(o => o.value === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = 'basico';
  }
}

let classSpritesData = null;
async function initClassSprites() {
  try {
    const res = await fetch('class-sprites.json');
    if (!res.ok) return;
    classSpritesData = await res.json();
    const select = document.getElementById('sim-classe');
    if (!select) return;
    
    select.innerHTML = '';
    for (const [id, path] of Object.entries(classSpritesData)) {
      const nomeAmigavel = CLASS_FRIENDLY_NAMES[id] || path.split('/').pop().replace('.gif', '');
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = nomeAmigavel;
      select.appendChild(opt);
    }

    select.addEventListener('change', (e) => {
      const src = (e.target.value && classSpritesData[e.target.value]) ? classSpritesData[e.target.value] : null;
      
      const spriteImg = document.getElementById('sim-player-sprite');
      if (spriteImg) {
        if (src) {
          spriteImg.src = src;
          spriteImg.style.display = 'block';
        } else {
          spriteImg.style.display = 'none';
        }
      }

      const radarSprite = document.getElementById('sim-arena-radar-sprite');
      if (radarSprite) {
        if (src) {
          radarSprite.src = src;
          radarSprite.style.display = 'block';
        } else {
          radarSprite.style.display = 'none';
        }
      }

      // Atualizar o seletor de habilidades
      updateSkillsSelect(e.target.value);

      // Re-executar a simulação para atualizar a imagem de batalha se houver alvo
      if (typeof APP !== 'undefined' && APP.currentSimMob && typeof runSimulation === 'function') {
        runSimulation(APP.currentSimMob);
      }
    });

    select.value = "0";
    select.dispatchEvent(new Event('change'));
  } catch (err) {
    console.error('Erro ao carregar class-sprites.json:', err);
  }
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  try {
    await Promise.all([initClassSprites(), initAlmaSprites()]);
    await loadData();
  } catch (err) {
    console.error('Falha ao carregar db.json:', err);
    $('mobGrid').innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Erro ao carregar banco de dados.<br>${err.message}</p></div>`;
  }
});


// ═══════════════════════════════════════════════
// FASE 5 — METAS, DIÁRIO DE FARM E EFICIÊNCIA REAL
// ═══════════════════════════════════════════════

APP.farmLogs = JSON.parse(localStorage.getItem('aureum_farm_logs') || '[]');
APP.farmTimer = {
  startTime: null,
  elapsedSec: 0,
  interval: null,
  isRunning: false,
  mobId: null
};

function initJournal() {
  const goalMobSelect = $('goal-target-mob');
  const logMobSelect = $('log-mob-select');
  if (!goalMobSelect || !logMobSelect) return;

  if (goalMobSelect.options.length <= 1) {
    const sortedMobs = [...(APP.db?.mobs || [])].sort((a, b) => (a.nivel || 0) - (b.nivel || 0));
    sortedMobs.forEach(m => {
      const opt1 = new Option(`${m.nome} (Nv. ${m.nivel})`, m.id);
      const opt2 = new Option(`${m.nome} (Nv. ${m.nivel})`, m.id);
      goalMobSelect.add(opt1);
      logMobSelect.add(opt2);
    });
  }

  const updateGoal = () => updateGoalProjection();
  $('goal-target-level')?.addEventListener('input', updateGoal);
  $('goal-target-zeny')?.addEventListener('input', updateGoal);
  $('goal-target-mob')?.addEventListener('change', updateGoal);

  initTimerEvents();
  initManualLogForm();
  initExportEvents();
  renderFarmLogsList();
}

function updateGoalProjection() {
  const targetLevel = Number($('goal-target-level')?.value) || 99;
  const targetZeny = Number($('goal-target-zeny')?.value) || 0;
  const mobId = Number($('goal-target-mob')?.value);
  const resultsEl = $('goal-projection-results');
  if (!resultsEl) return;

  const currentLevel = Number($('sim-nivel')?.value) || 1;
  const mob = APP.db?.mobs?.find(m => m.id === mobId);

  if (!mob) {
    resultsEl.innerHTML = '<span style="color:var(--text-muted);">Selecione um monstro alvo para ver a projeção de tempo e abates.</span>';
    return;
  }

  const metrics = calculateHuntMetrics(mob);
  const levelDiff = Math.max(0, targetLevel - currentLevel);
  
  // Base XP estimate per level ~ 1000 * lvl^1.8
  let xpNeeded = 0;
  for (let l = currentLevel; l < targetLevel; l++) {
    xpNeeded += Math.round(1500 * Math.pow(l, 1.6));
  }

  const killsForExp = metrics.expPenalty > 0 && mob.exp_base > 0 ? Math.ceil(xpNeeded / (mob.exp_base * metrics.expPenalty)) : 0;
  const killsForZeny = targetZeny > 0 && metrics.rawZenyKill > 0 ? Math.ceil(targetZeny / metrics.rawZenyKill) : 0;
  const totalKills = Math.max(killsForExp, killsForZeny);
  const estimatedHours = metrics.killsHour > 0 ? (totalKills / metrics.killsHour) : 0;
  const totalPotionCost = estimatedHours * metrics.itemizedCosts.potionCostHour;
  const totalRawZeny = totalKills * metrics.rawZenyKill;

  resultsEl.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
      <div>
        <span style="display:block; color:var(--text-muted); font-size:10px; text-transform:uppercase;">Evolução</span>
        <strong style="font-size:14px; color:var(--gold-light);">Nv. ${currentLevel} → Nv. ${targetLevel}</strong>
      </div>
      <div>
        <span style="display:block; color:var(--text-muted); font-size:10px; text-transform:uppercase;">Abates Necessários</span>
        <strong style="font-size:14px; color:var(--text-primary);">${fmt(totalKills)} kills</strong>
      </div>
      <div>
        <span style="display:block; color:var(--text-muted); font-size:10px; text-transform:uppercase;">Tempo Estimado</span>
        <strong style="font-size:14px; color:var(--gold-light);">${estimatedHours > 0 ? estimatedHours.toFixed(1) + ' horas' : '—'}</strong>
      </div>
      <div>
        <span style="display:block; color:var(--text-muted); font-size:10px; text-transform:uppercase;">Raw Zeny Gerado</span>
        <strong style="font-size:14px; color:#4ade80;">+${fmt(Math.round(totalRawZeny))} z</strong>
      </div>
      <div>
        <span style="display:block; color:var(--text-muted); font-size:10px; text-transform:uppercase;">Gasto c/ Poções</span>
        <strong style="font-size:14px; color:${totalPotionCost > 0 ? 'var(--danger)' : 'var(--success)'};">-${fmt(Math.round(totalPotionCost))} z</strong>
      </div>
    </div>
  `;
}

function initTimerEvents() {
  const btnStart = $('btn-timer-start');
  const btnPause = $('btn-timer-pause');
  const btnStop = $('btn-timer-stop');
  const display = $('tracker-timer-display');
  if (!btnStart || !display) return;

  const updateDisplay = () => {
    const sec = APP.farmTimer.elapsedSec;
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    display.textContent = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  };

  btnStart.onclick = () => {
    if (APP.farmTimer.isRunning) return;
    APP.farmTimer.isRunning = true;
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnStop.disabled = false;
    APP.farmTimer.interval = setInterval(() => {
      APP.farmTimer.elapsedSec++;
      updateDisplay();
    }, 1000);
  };

  btnPause.onclick = () => {
    if (!APP.farmTimer.isRunning) return;
    APP.farmTimer.isRunning = false;
    clearInterval(APP.farmTimer.interval);
    btnStart.disabled = false;
    btnPause.disabled = true;
  };

  btnStop.onclick = () => {
    clearInterval(APP.farmTimer.interval);
    APP.farmTimer.isRunning = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnStop.disabled = true;

    const durationMin = Math.max(1, Math.round(APP.farmTimer.elapsedSec / 60));
    const mobId = Number($('goal-target-mob')?.value || $('log-mob-select')?.value);
    
    if (!mobId) {
      alert('Selecione um mob no formulário para vincular a sessão gravada.');
      return;
    }

    const zenyStr = prompt('Zeny líquido obtido nesta sessão (opcional):', '0');
    const zenyGained = Number(zenyStr) || 0;

    saveFarmLog({
      id: Date.now(),
      date: new Date().toISOString(),
      mobId,
      durationMin,
      zenyGained,
      potionCost: 0,
      deaths: 0
    });

    APP.farmTimer.elapsedSec = 0;
    updateDisplay();
  };
}

function initManualLogForm() {
  const form = $('form-manual-log');
  if (!form) return;

  form.onsubmit = (e) => {
    e.preventDefault();
    const mobId = Number($('log-mob-select')?.value);
    const durationMin = Number($('log-duration-min')?.value) || 60;
    const zenyGained = Number($('log-zeny-gained')?.value) || 0;
    const potionCost = Number($('log-cost-potions')?.value) || 0;
    const deaths = Number($('log-deaths')?.value) || 0;

    saveFarmLog({
      id: Date.now(),
      date: new Date().toISOString(),
      mobId,
      durationMin,
      zenyGained,
      potionCost,
      deaths
    });

    form.reset();
    alert('Sessão registrada no Diário com sucesso!');
  };
}

function saveFarmLog(logEntry) {
  APP.farmLogs.unshift(logEntry);
  localStorage.setItem('aureum_farm_logs', JSON.stringify(APP.farmLogs));
  renderFarmLogsList();
}

function renderFarmLogsList() {
  const container = $('farm-logs-list');
  if (!container) return;

  if (APP.farmLogs.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">Nenhuma sessão de farm registrada no diário ainda.</div>';
    return;
  }

  let html = `
    <table class="breakdown-table" style="width:100%; border-collapse:collapse; font-size:12px;">
      <thead>
        <tr style="border-bottom:1px solid var(--gold); color:var(--text-muted); text-transform:uppercase; font-size:10px;">
          <th style="padding:8px; text-align:left;">Data / Hora</th>
          <th style="padding:8px; text-align:left;">Mob</th>
          <th style="padding:8px; text-align:center;">Duração</th>
          <th style="padding:8px; text-align:right;">Zeny Real/h</th>
          <th style="padding:8px; text-align:center;">Eficiência</th>
          <th style="padding:8px; text-align:center;">Mortes</th>
          <th style="padding:8px; text-align:center;">Ação</th>
        </tr>
      </thead>
      <tbody>
  `;

  APP.farmLogs.forEach(log => {
    const mob = APP.db?.mobs?.find(m => m.id === log.mobId);
    const dateStr = new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const realZenyHour = log.durationMin > 0 ? (log.zenyGained - log.potionCost) * (60 / log.durationMin) : 0;
    
    let efficiencyPct = 100;
    if (mob) {
      const metrics = calculateHuntMetrics(mob);
      if (metrics.netZenyHour > 0) {
        efficiencyPct = Math.round((realZenyHour / metrics.netZenyHour) * 100);
      }
    }

    const effColor = efficiencyPct >= 90 ? '#4ade80' : efficiencyPct >= 65 ? '#fcd34d' : '#f87171';

    html += `
      <tr class="breakdown-row" style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:8px;">${dateStr}</td>
        <td style="padding:8px; font-weight:bold; color:var(--text-primary);">${plainText(mob?.nome || 'Mob desconhecido')}</td>
        <td style="padding:8px; text-align:center;">${log.durationMin} min</td>
        <td style="padding:8px; text-align:right; color:var(--gold-light); font-weight:bold;">${fmt(Math.round(realZenyHour))} z/h</td>
        <td style="padding:8px; text-align:center;">
          <span style="display:inline-block; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; background:${effColor}20; color:${effColor}; border:1px solid ${effColor}40;">
            ${efficiencyPct}%
          </span>
        </td>
        <td style="padding:8px; text-align:center; color:${log.deaths > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${log.deaths}</td>
        <td style="padding:8px; text-align:center;">
          <button type="button" class="btn-delete-log" data-id="${log.id}" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:12px;" title="Excluir">✕</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('.btn-delete-log').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      APP.farmLogs = APP.farmLogs.filter(l => l.id !== id);
      localStorage.setItem('aureum_farm_logs', JSON.stringify(APP.farmLogs));
      renderFarmLogsList();
    };
  });
}

function initExportEvents() {
  $('btn-export-logs-json')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(APP.farmLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aureum_diario_farm_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  $('btn-export-logs-csv')?.addEventListener('click', () => {
    let csv = "Data,Mob,Duracao Min,Zeny Obtido,Gastos Pocoes,Mortes\n";
    APP.farmLogs.forEach(l => {
      const mob = APP.db?.mobs?.find(m => m.id === l.mobId);
      csv += `"${l.date}","${mob?.nome || ''}",${l.durationMin},${l.zenyGained},${l.potionCost},${l.deaths}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aureum_diario_farm_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  $('btn-clear-logs')?.addEventListener('click', () => {
    if (!confirm('Deseja apagar todo o histórico de sessões do diário?')) return;
    APP.farmLogs = [];
    localStorage.removeItem('aureum_farm_logs');
    renderFarmLogsList();
  });
}



// ═══════════════════════════════════════════════
// FASE 6 — COMUNIDADE & QUALIDADE CONTÍNUA (SERVERLESS / GITHUB PAGES)
// ═══════════════════════════════════════════════

APP.communityBuilds = [];
APP.formulasChangelog = [];
APP.recommendationVotes = JSON.parse(localStorage.getItem('aureum_recommendation_votes') || '{}');

async function loadCommunityBuilds() {
  try {
    const res = await fetch('community-builds.json');
    if (res.ok) {
      APP.communityBuilds = await res.json();
      populateCommunityBuildsSelect();
    }
  } catch (err) {
    console.warn('Não foi possível carregar community-builds.json:', err);
  }
}

function populateCommunityBuildsSelect() {
  const select = $('sim-community-builds-select');
  if (!select || !APP.communityBuilds.length) return;

  select.innerHTML = '<option value="">⭐ Builds Comunitárias...</option>';
  APP.communityBuilds.forEach(b => {
    const opt = new Option(`${b.name} (${b.class})`, b.id);
    select.add(opt);
  });

  select.onchange = () => {
    const buildId = select.value;
    if (!buildId) return;
    const b = APP.communityBuilds.find(item => item.id === buildId);
    if (!b) return;

    if (b.stats) {
      Object.entries(b.stats).forEach(([k, v]) => { if ($(k)) $(k).value = v; });
    }
    if (b.armament) {
      Object.entries(b.armament).forEach(([k, v]) => { if ($(k)) $(k).value = v; });
    }
    if ($('sim-build-name')) $('sim-build-name').value = b.name;

    refreshCharacterSummary();
    updateSimulationBuildGate();
    alert(`Build comunitária "${b.name}" carregada no simulador!`);
  };
}

function exportBuildToURL() {
  const buildObj = getActiveBuild();
  if (!buildObj) {
    alert('Configure uma build antes de gerar o link!');
    return;
  }

  try {
    const jsonStr = JSON.stringify({
      name: $('sim-build-name')?.value || 'Minha Build',
      stats: buildObj.base,
      equip: buildObj.equip
    });
    const b64 = btoa(encodeURIComponent(jsonStr));
    const fullUrl = `${location.origin}${location.pathname}#build=${b64}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
      alert('Link único da build copiado para a área de transferência! Cole no Discord ou Fórum para compartilhar.');
    }).catch(() => {
      prompt('Copie o link único da build abaixo:', fullUrl);
    });
  } catch (err) {
    console.error('Erro ao gerar link da build:', err);
  }
}

function checkURLForBuildImport() {
  const hash = location.hash;
  if (hash.includes('#build=')) {
    const b64 = hash.split('#build=')[1];
    if (!b64) return;
    try {
      const jsonStr = decodeURIComponent(atob(b64));
      const payload = JSON.parse(jsonStr);
      if (payload && payload.stats) {
        Object.entries(payload.stats).forEach(([k, v]) => { if ($(k)) $(k).value = v; });
        if (payload.name && $('sim-build-name')) $('sim-build-name').value = payload.name;
        refreshCharacterSummary();
        updateSimulationBuildGate();
        console.log('Build importada da URL com sucesso:', payload.name);
      }
    } catch (err) {
      console.warn('Falha ao decodificar build da URL:', err);
    }
  }
}

function openReportDivergenceModal(targetName = '') {
  const overlay = $('reportDivergenceOverlay');
  if (!overlay) return;

  if (targetName && $('report-target-name')) {
    $('report-target-name').value = targetName;
  }

  overlay.style.display = 'flex';
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function initReportDivergenceEvents() {
  $('btn-open-report-divergence')?.addEventListener('click', () => openReportDivergenceModal());
  
  $('reportDivergenceClose')?.addEventListener('click', closeReportDivergenceModal);
  $('reportDivergenceCancel')?.addEventListener('click', closeReportDivergenceModal);

  $('reportDivergenceSubmit')?.addEventListener('click', () => {
    const type = $('report-type')?.value || 'mob_stat';
    const targetName = $('report-target-name')?.value?.trim() || 'Não especificado';
    const description = $('report-description')?.value?.trim() || '';

    if (!description) {
      alert('Por favor, descreva a divergência antes de abrir a issue.');
      return;
    }

    const buildName = $('sim-build-name')?.value || 'N/A';
    const charLevel = $('sim-nivel')?.value || 'N/A';

    const title = encodeURIComponent(`[DIVERGÊNCIA] ${type.toUpperCase()}: ${targetName}`);
    const bodyText = `### 🐛 Relato de Divergência

**Tipo:** ${type}
**Alvo/Item/Mapa:** ${targetName}
**Nível/Build Ativa:** Nv. ${charLevel} (${buildName})
**Navegador:** ${navigator.userAgent}

---

### 📝 Descrição
${description}

---
*Enviado automaticamente pelo AureumRO Portal (Zero-Backend).*`;

    const issueUrl = `https://github.com/marlonhms/ROData/issues/new?title=${title}&body=${encodeURIComponent(bodyText)}`;
    window.open(issueUrl, '_blank');
    closeReportDivergenceModal();
  });
}

function closeReportDivergenceModal() {
  const overlay = $('reportDivergenceOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
}

async function openFormulasChangelogModal() {
  const overlay = $('formulasChangelogOverlay');
  const content = $('formulasChangelogContent');
  if (!overlay || !content) return;

  if (!APP.formulasChangelog.length) {
    try {
      const res = await fetch('formulas-changelog.json');
      if (res.ok) APP.formulasChangelog = await res.json();
    } catch (err) {
      console.warn('Erro ao carregar formulas-changelog.json:', err);
    }
  }

  content.innerHTML = (APP.formulasChangelog || []).map(entry => `
    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:10px; padding:12px; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <strong style="color:var(--gold-light); font-size:14px;">v${entry.version} — ${entry.title}</strong>
        <span style="color:var(--text-muted); font-size:11px;">${entry.date}</span>
      </div>
      <ul style="margin:0; padding-left:18px; color:var(--text-secondary); font-size:12px; line-height:1.5;">
        ${(entry.changes || []).map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
  `).join('') || '<div style="color:var(--text-muted);">Nenhum registro de fórmula encontrado.</div>';

  overlay.style.display = 'flex';
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function initFormulasChangelogEvents() {
  $('btn-open-formulas-changelog')?.addEventListener('click', openFormulasChangelogModal);
  $('formulasChangelogClose')?.addEventListener('click', () => {
    const overlay = $('formulasChangelogOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
}

function initPhase6() {
  loadCommunityBuilds();
  checkURLForBuildImport();
  initReportDivergenceEvents();
  initFormulasChangelogEvents();

  $('sim-build-link')?.addEventListener('click', exportBuildToURL);
}

// Auto init Phase 6 on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initPhase6, 300);
});

