'use strict';

const MAP_COLLECTION_STORAGE = 'aureum_map_collection_progress_v1';

function loadMapCollectionProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_COLLECTION_STORAGE) || '{}');
    return { items: saved.items || {}, priorities: saved.priorities || {} };
  } catch { return { items: {}, priorities: {} }; }
}

function saveMapCollectionProgress() {
  localStorage.setItem(MAP_COLLECTION_STORAGE, JSON.stringify(APP.mapCollectionProgress));
}

function collectionProgress(entry) {
  const marked = APP.mapCollectionProgress?.items?.[entry.id] || {};
  const done = entry.items.reduce((total, item, index) => total + (marked[index] ? 1 : 0), 0);
  return { done, total: entry.items.length, percent: entry.items.length ? Math.round(done / entry.items.length * 100) : 0 };
}

function collectionPriority(entry) {
  return Number(APP.mapCollectionProgress?.priorities?.[entry.id] || 0);
}

function initMapCollectionPage() {
  if (!$('collectionGrid')) return;
  APP.mapCollectionProgress = loadMapCollectionProgress();
  (APP.mapCollections?.cities || []).forEach(city => $('collection-city').add(new Option(city, city)));
  const refresh = debounce(filterAndRenderMapCollection, 160);
  $('collection-search').addEventListener('input', refresh);
  ['collection-city', 'collection-status', 'collection-priority', 'collection-sort']
    .forEach(id => $(id).addEventListener('change', filterAndRenderMapCollection));

  $('collectionGrid').addEventListener('change', event => {
    const card = event.target.closest('[data-collection-id]');
    if (!card) return;
    const id = card.dataset.collectionId;
    if (event.target.matches('[data-collection-item]')) {
      APP.mapCollectionProgress.items[id] ||= {};
      APP.mapCollectionProgress.items[id][event.target.dataset.collectionItem] = event.target.checked;
    } else if (event.target.matches('[data-collection-priority]')) {
      APP.mapCollectionProgress.priorities[id] = Number(event.target.value);
    } else return;
    saveMapCollectionProgress();
    filterAndRenderMapCollection();
  });

  $('collectionGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-complete-collection]');
    if (!button) return;
    const entry = APP.mapCollections.collections.find(item => item.id === button.dataset.completeCollection);
    if (!entry) return;
    const progress = collectionProgress(entry);
    APP.mapCollectionProgress.items[entry.id] = Object.fromEntries(entry.items.map((item, index) => [index, progress.done !== progress.total]));
    saveMapCollectionProgress();
    filterAndRenderMapCollection();
  });

  $('collectionRouteList').addEventListener('click', event => {
    const button = event.target.closest('[data-route-collection]');
    if (!button) return;
    const entry = APP.mapCollections.collections.find(item => item.id === button.dataset.routeCollection);
    if (!entry) return;
    $('collection-search').value = entry.name;
    $('collection-city').value = '';
    $('collection-status').value = 'all';
    filterAndRenderMapCollection();
    $('collectionGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  filterAndRenderMapCollection();
}

function filterAndRenderMapCollection() {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = normalize($('collection-search').value);
  const city = $('collection-city').value;
  const status = $('collection-status').value;
  const priorityFilter = $('collection-priority').value;
  const sort = $('collection-sort').value;
  const all = APP.mapCollections?.collections || [];
  const list = all.filter(entry => {
    const progress = collectionProgress(entry);
    const haystack = normalize([entry.name, entry.city, entry.bonus, ...entry.items.map(item => item.name)].join(' '));
    if (query && !haystack.includes(query)) return false;
    if (city && entry.city !== city) return false;
    if (priorityFilter !== 'all' && collectionPriority(entry) !== Number(priorityFilter)) return false;
    if (status === 'completed' && progress.done !== progress.total) return false;
    if (status === 'pending' && (progress.done === 0 || progress.done === progress.total)) return false;
    if (status === 'not-started' && progress.done !== 0) return false;
    return true;
  });
  list.sort((a, b) => {
    const ap = collectionProgress(a); const bp = collectionProgress(b);
    if (sort === 'progress') return bp.percent - ap.percent || a.name.localeCompare(b.name, 'pt-BR');
    if (sort === 'city') return a.city.localeCompare(b.city, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR');
    if (sort === 'name') return a.name.localeCompare(b.name, 'pt-BR');
    return collectionPriority(b) - collectionPriority(a) || bp.percent - ap.percent || a.name.localeCompare(b.name, 'pt-BR');
  });
  APP.pages.mapCollection.filtered = list;
  APP.pages.mapCollection.page = 1;
  $('collection-count').textContent = `${list.length} de ${all.length} mapas`;
  renderMapCollectionSummary();
  renderMapCollectionRoutes();
  renderMapCollectionBonuses();
  renderMapCollectionGrid();
}

function renderMapCollectionSummary() {
  const entries = APP.mapCollections.collections;
  const completed = entries.filter(entry => { const p = collectionProgress(entry); return p.total && p.done === p.total; });
  const totalItems = entries.reduce((sum, entry) => sum + entry.items.length, 0);
  const doneItems = entries.reduce((sum, entry) => sum + collectionProgress(entry).done, 0);
  const prioritized = entries.filter(entry => collectionPriority(entry) > 0 && collectionProgress(entry).percent < 100).length;
  const pct = entries.length ? Math.round(completed.length / entries.length * 100) : 0;
  $('collectionSummary').innerHTML = `
    <div class="collection-stat featured"><span>Progresso geral</span><strong>${pct}%</strong><small>${completed.length} de ${entries.length} mapas</small><i><b style="width:${pct}%"></b></i></div>
    <div class="collection-stat"><span>Itens encontrados</span><strong>${fmt(doneItems)}</strong><small>de ${fmt(totalItems)} requisitos</small></div>
    <div class="collection-stat"><span>Bônus ativos</span><strong>${completed.length}</strong><small>permanentes na conta</small></div>
    <div class="collection-stat"><span>Na fila</span><strong>${prioritized}</strong><small>mapas priorizados</small></div>`;
}

function renderMapCollectionRoutes() {
  const routes = APP.mapCollections.collections
    .filter(entry => collectionPriority(entry) > 0 && collectionProgress(entry).percent < 100)
    .sort((a, b) => collectionPriority(b) - collectionPriority(a) || collectionProgress(b).percent - collectionProgress(a).percent)
    .slice(0, 6);
  if (!routes.length) {
    $('collectionRouteList').innerHTML = '<div class="collection-route-empty">Defina uma prioridade nos mapas para montar sua próxima rota.</div>';
    return;
  }
  $('collectionRouteList').innerHTML = routes.map((entry, index) => {
    const progress = collectionProgress(entry); const priority = collectionPriority(entry);
    return `<button class="collection-route" data-route-collection="${plainText(entry.id)}"><b>${index + 1}</b>
      <span><strong>${plainText(entry.name)}</strong><small>${plainText(entry.city)} · ${progress.total - progress.done} itens restantes</small></span>
      <em class="priority-${priority}">${priority === 3 ? 'Alta' : priority === 2 ? 'Média' : 'Baixa'}</em></button>`;
  }).join('');
}

function renderMapCollectionBonuses() {
  const earned = APP.mapCollections.collections.filter(entry => { const p = collectionProgress(entry); return p.total && p.done === p.total; });
  const grouped = earned.reduce((result, entry) => { result[entry.bonus] = (result[entry.bonus] || 0) + 1; return result; }, {});
  const chips = Object.entries(grouped).map(([bonus, count]) => `<span>${plainText(bonus)}${count > 1 ? ` <b>×${count}</b>` : ''}</span>`).join('');
  $('collectionBonusPanel').innerHTML = `<div><span class="collection-eyebrow">BÔNUS CONQUISTADOS</span><h3>${earned.length ? `${earned.length} bônus permanentes ativos` : 'Nenhum bônus marcado ainda'}</h3></div>
    <div class="collection-bonus-chips">${chips || '<small>Finalize uma coleção para vê-la resumida aqui.</small>'}</div>`;
}

function renderMapCollectionGrid() {
  const state = APP.pages.mapCollection;
  const slice = state.filtered.slice((state.page - 1) * state.perPage, state.page * state.perPage);
  if (!slice.length) {
    $('collectionGrid').innerHTML = '<div class="empty-state"><div class="icon">📜</div><p>Nenhuma coleção encontrada com esses filtros.</p></div>';
    $('collectionPagination').innerHTML = '';
    return;
  }
  $('collectionGrid').innerHTML = slice.map(entry => {
    const progress = collectionProgress(entry); const priority = collectionPriority(entry);
    const complete = progress.total > 0 && progress.done === progress.total;
    const priorityLabel = ['Sem prioridade', 'Baixa', 'Média', 'Alta'];
    return `<article class="collection-card ${complete ? 'is-complete' : ''}" data-collection-id="${plainText(entry.id)}">
      <div class="collection-card-visual">${entry.mapImage ? `<img loading="lazy" src="${plainText(entry.mapImage)}" alt="Mapa ${plainText(entry.name)}" onerror="this.style.display='none'">` : '<span>Mapa indisponível</span>'}
        <div class="collection-card-city">${plainText(entry.city)}</div>${complete ? '<div class="collection-complete-seal">✓ Finalizado</div>' : ''}</div>
      <div class="collection-card-body"><div class="collection-card-head"><div><small>${plainText(entry.id)}</small><h3 title="${plainText(entry.name)}">${plainText(entry.name)}</h3></div>
        <select class="collection-priority priority-${priority}" data-collection-priority aria-label="Prioridade de ${plainText(entry.name)}">${priorityLabel.map((label, value) => `<option value="${value}" ${priority === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
        <div class="collection-bonus"><span>Bônus permanente</span><strong title="${plainText(entry.bonus)}">${plainText(entry.bonus)}</strong></div>
        <div class="collection-progress"><div><span>${progress.done}/${progress.total} itens</span><b>${progress.percent}%</b></div><i><span style="width:${progress.percent}%"></span></i></div>
        <div class="collection-items">${entry.items.map((item, index) => {
          const checked = Boolean(APP.mapCollectionProgress.items?.[entry.id]?.[index]); const source = item.sources.join(' · ');
          return `<label class="collection-item ${checked ? 'is-done' : ''}" title="${plainText(source)}"><input type="checkbox" data-collection-item="${index}" ${checked ? 'checked' : ''}>
            <span class="collection-item-image">${item.image ? `<img loading="lazy" src="${plainText(item.image)}" alt="" onerror="this.style.display='none'">` : ''}</span>
            <span><strong>${plainText(item.name)}${item.quantity > 1 ? ` ×${fmt(item.quantity)}` : ''}</strong><small>${plainText(source || 'Drop neste mapa')}</small></span></label>`;
        }).join('')}</div>
        <button class="collection-complete-button" type="button" data-complete-collection="${plainText(entry.id)}">${complete ? 'Reabrir coleção' : 'Marcar todos como concluídos'}</button>
      </div></article>`;
  }).join('');
  renderPagination('collectionPagination', state, renderMapCollectionGrid);
}
