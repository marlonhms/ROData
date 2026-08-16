(function initEconomyModule(root) {
  'use strict';

  const safe = value => typeof escapePatchText === 'function' ? escapePatchText(value) : String(value || '');
  const number = (value, digits = 0) => typeof fmt === 'function' ? fmt(value, digits) : Number(value || 0).toFixed(digits);
  const signed = (value, digits = 2) => `${Number(value) > 0 ? '+' : ''}${number(value, digits)}%`;
  const decisionState = { scenario:null, query:'', level:'all', visible:15 };
  const scenarioLabels = { restrictive:'Restritivo', stable:'Neutro', opening:'Expansionista' };
  const componentLabels = { pressure:'pressão atual', availability:'disponibilidade', history:'histórico de ajustes', price:'preço NPC' };
  const shortZeny = value => {
    const amount = Number(value) || 0;
    if (Math.abs(amount) >= 1000000) return `${number(amount / 1000000, 1)} mi`;
    if (Math.abs(amount) >= 1000) return `${number(amount / 1000, 1)} mil`;
    return number(amount, amount < 100 ? 1 : 0);
  };
  const dateLabel = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
  };

  function lineChart(series) {
    if (!series?.length) return '<div class="economy-empty">Série histórica indisponível.</div>';
    const width = 780;
    const height = 270;
    const pad = { left:52, right:22, top:22, bottom:42 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const values = series.flatMap(point => [Number(point.priceIndex) || 0, Number(point.emissionIndex) || 0]);
    const minValue = Math.max(0, Math.floor((Math.min(...values) - 8) / 10) * 10);
    const maxValue = Math.min(110, Math.ceil((Math.max(...values) + 4) / 10) * 10);
    const xAt = index => pad.left + (series.length === 1 ? chartWidth / 2 : chartWidth * index / (series.length - 1));
    const yAt = value => pad.top + chartHeight * (1 - ((Number(value) || 0) - minValue) / Math.max(1, maxValue - minValue));
    const pathFor = key => series.map((point, index) => `${index ? 'L' : 'M'} ${xAt(index).toFixed(1)} ${yAt(point[key]).toFixed(1)}`).join(' ');
    const gridValues = Array.from({ length:5 }, (_, index) => minValue + (maxValue - minValue) * index / 4);
    const grid = gridValues.map(value => {
      const y = yAt(value);
      return `<line x1="${pad.left}" y1="${y}" x2="${width-pad.right}" y2="${y}" class="economy-chart-grid" />
        <text x="${pad.left-9}" y="${y+4}" text-anchor="end" class="economy-chart-axis">${number(value)}%</text>`;
    }).join('');
    const lastLabelIndex = series.length - 1;
    const labelIndexes = new Set([0, Math.round(lastLabelIndex / 3), Math.round(lastLabelIndex * 2 / 3), lastLabelIndex]);
    const labels = series.map((point, index) => {
      if (!labelIndexes.has(index)) return '';
      return `<text x="${xAt(index)}" y="${height-15}" text-anchor="${index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}" class="economy-chart-axis">${index === 0 ? 'Baseline' : dateLabel(point.timestamp)}</text>`;
    }).join('');
    const dots = (key, cssClass, label) => series.map((point, index) => `<circle cx="${xAt(index)}" cy="${yAt(point[key])}" r="4" class="${cssClass}" tabindex="0"><title>${safe(label)} · ${number(point[key],2)}% · ${safe(point.label)}</title></circle>`).join('');
    return `<div class="economy-chart-legend" aria-hidden="true"><span><i class="price"></i>Cesta de preços NPC</span><span><i class="emission"></i>Pressão de emissão</span></div>
      <svg class="economy-index-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="economyIndexTitle economyIndexDesc">
        <title id="economyIndexTitle">Evolução dos índices econômicos</title>
        <desc id="economyIndexDesc">Comparação do valor da cesta NPC e da pressão estrutural de emissão de Raw Zeny desde o baseline anterior ao balanceamento.</desc>
        ${grid}${labels}
        <path d="${pathFor('priceIndex')}" class="economy-chart-line price" />
        <path d="${pathFor('emissionIndex')}" class="economy-chart-line emission" />
        ${dots('priceIndex','economy-chart-dot price','Cesta NPC')}
        ${dots('emissionIndex','economy-chart-dot emission','Pressão de emissão')}
      </svg>`;
  }

  function impactChart(impact) {
    const items = impact?.items || [];
    if (!items.length) return '<div class="economy-empty">Nenhum preço mudou na última revisão.</div>';
    const maxImpact = Math.max(1, ...items.map(item => Math.abs(Number(item.rawImpact) || 0)));
    return `<div class="economy-impact-summary"><strong>${signed(impact.emissionDeltaPct)}</strong><span>${impact.reductions} reduções · ${impact.increases} aumentos</span></div>
      <div class="economy-impact-bars">${items.slice(0, 6).map(item => `
        <button type="button" class="economy-impact-row" data-economy-kind="item" data-economy-id="${item.itemId}" aria-label="Abrir ficha de ${safe(item.name)}">
          <span><b>${safe(item.name)}</b><small>${number(item.before)}z → ${number(item.after)}z</small></span>
          <i><em style="--impact:${Math.max(3, Math.abs(item.rawImpact) / maxImpact * 100)}%"></em></i>
          <strong>${signed(item.deltaPct, 0)}</strong>
        </button>`).join('')}</div>`;
  }

  function rankingPanel(title, subtitle, records, kind) {
    const valueOf = record => record.rawContribution;
    const max = Math.max(1, ...records.map(valueOf));
    const meta = record => kind === 'item'
      ? `${number(record.price)}z NPC · ${number(record.sharePct,2)}% da pressão`
      : kind === 'mob'
        ? `Nv. ${record.level} · ${record.totalSpawn} spawns catalogados`
        : `${record.density} monstros · ${record.species} espécies econômicas`;
    const value = record => kind === 'mob' ? `${shortZeny(record.rawPerKill)} z/kill` : `${shortZeny(record.rawContribution)} pts`;
    const id = record => record[`${kind}Id`];
    return `<article class="economy-ranking-panel">
      <header><div><span>RANKING ESTRUTURAL</span><h3>${safe(title)}</h3></div><small>${safe(subtitle)}</small></header>
      <div class="economy-ranking-list">${records.slice(0, 6).map((record, index) => `
        <button type="button" class="economy-ranking-row" data-economy-kind="${kind}" data-economy-id="${safe(id(record))}">
          <b>${index + 1}</b><span><strong>${safe(record.name)}</strong><small>${safe(meta(record))}</small><i><em style="--rank:${Math.max(3, valueOf(record) / max * 100)}%"></em></i></span><output>${safe(value(record))}</output>
        </button>`).join('')}</div>
    </article>`;
  }

  function concentrationPanel(data) {
    const item = data.items;
    const map = data.maps;
    const segments = data.topItems.map((record, index) => `<i style="--segment:${record.sharePct}%;--segment-index:${index}" title="${safe(record.name)}: ${number(record.sharePct,2)}%"></i>`).join('');
    return `<article class="economy-concentration-panel">
      <header><div><span>DISTRIBUIÇÃO DO RAW ZENY</span><h3>Concentração econômica</h3></div><small>Quanto a geração depende de poucas fontes</small></header>
      <div class="economy-concentration-grid">
        <div class="economy-concentration-score"><span>Itens</span><strong>${safe(item.label)}</strong><b>HHI ${number(item.hhi)}</b><small>Top 5 concentram ${number(item.top5Pct,1)}%</small></div>
        <div class="economy-concentration-score"><span>Mapas</span><strong>${safe(map.label)}</strong><b>HHI ${number(map.hhi)}</b><small>Top 5 concentram ${number(map.top5Pct,1)}%</small></div>
      </div>
      <div class="economy-share-title"><span>Participação dos cinco itens líderes</span><b>${number(item.top5Pct,1)}%</b></div>
      <div class="economy-share-track" role="img" aria-label="Os cinco itens líderes representam ${number(item.top5Pct,1)} por cento da pressão econômica">${segments}</div>
      <ol class="economy-concentration-list">${data.topItems.map(record => `<li><button type="button" data-economy-kind="item" data-economy-id="${record.itemId}">${safe(record.name)}</button><span>${number(record.sharePct,2)}%</span></li>`).join('')}</ol>
    </article>`;
  }

  function timelinePanel(entries, sourceUrl) {
    return `<article class="economy-timeline-panel">
      <header><div><span>REGISTRO OFICIAL</span><h3>Timeline da economia</h3></div><a href="${safe(sourceUrl)}" target="_blank" rel="noopener">Economia na Wiki ↗</a></header>
      <ol>${entries.slice(0, 6).map(entry => `<li><i></i><div><time>${dateLabel(entry.timestamp)} · r${entry.revision}</time><strong>${safe(entry.comment || 'Revisão econômica')}</strong><small>${entry.changedItems} itens · índice de emissão ${number(entry.emissionIndex,2)}%</small></div></li>`).join('')}</ol>
    </article>`;
  }

  function reviewPressurePanel(data) {
    const items = data?.items || [];
    const maxScore = Math.max(1, ...items.map(item => item.score));
    return `<article class="economy-risk-panel">
      <header><div><span>RADAR EXPLICÁVEL</span><h3>Pressão para possível revisão</h3></div><small>Prioridade analítica, não decisão oficial</small></header>
      <p>${safe(data.methodology)}</p>
      <div class="economy-risk-list">${items.slice(0, 8).map((item, index) => `
        <button type="button" class="economy-risk-row ${item.level === 'Alta' ? 'high' : ''}" data-economy-kind="item" data-economy-id="${item.itemId}">
          <b>${index + 1}</b>
          <span><strong>${safe(item.name)}</strong><small>${safe(item.reasons.join(' · '))}</small><i><em style="--risk:${item.score / maxScore * 100}%"></em></i></span>
          <output><strong>${item.score}</strong><small>${safe(item.level)}</small></output>
        </button>`).join('')}</div>
    </article>`;
  }

  function scenarioChart(forecast, currentValue) {
    const scenarios = forecast?.scenarios || [];
    if (!scenarios.length) return '';
    const width = 560;
    const height = 215;
    // Reserva espaço para os nomes das curvas dentro do próprio SVG.
    // Sem essa coluna, rótulos como "Expansionista" ultrapassam o viewBox.
    const pad = { left:62, right:122, top:24, bottom:37 };
    const x = [pad.left, width / 2, width - pad.right];
    const allValues = [currentValue, ...scenarios.flatMap(scenario => [scenario.day7, scenario.day30])];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = Math.max(.5, max - min);
    const yMin = min - range * .28;
    const yMax = max + range * .28;
    const yAt = value => pad.top + (height - pad.top - pad.bottom) * (1 - (value - yMin) / (yMax - yMin));
    const grid = [min, currentValue, max].filter((value, index, values) => values.indexOf(value) === index).map(value => `<line x1="${pad.left}" y1="${yAt(value)}" x2="${width-pad.right}" y2="${yAt(value)}" class="economy-scenario-grid"/><text x="${pad.left-8}" y="${yAt(value)+4}" text-anchor="end" class="economy-scenario-axis">${number(value,2)}</text>`).join('');
    const lines = scenarios.map(scenario => {
      const values = [currentValue, scenario.day7, scenario.day30];
      const points = values.map((value, index) => `${x[index]},${yAt(value)}`).join(' ');
      return `<g class="economy-scenario-series ${scenario.key}"><polyline points="${points}"/><circle cx="${x[0]}" cy="${yAt(values[0])}" r="4"/><circle cx="${x[1]}" cy="${yAt(values[1])}" r="4"/><circle cx="${x[2]}" cy="${yAt(values[2])}" r="4"/><text x="${x[2]+9}" y="${yAt(values[2])+4}">${safe(scenario.direction)}</text><title>${safe(scenario.label)}: atual ${number(currentValue,2)}, 7 dias ${number(scenario.day7,2)}, 30 dias ${number(scenario.day30,2)}</title></g>`;
    }).join('');
    return `<svg class="economy-scenario-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="scenarioTitle scenarioDesc"><title id="scenarioTitle">Cenários para a pressão de emissão</title><desc id="scenarioDesc">Três trajetórias determinísticas para sete e trinta dias, comparadas ao índice atual.</desc>${grid}${lines}<text x="${x[0]}" y="${height-12}" text-anchor="start" class="economy-scenario-axis">Atual</text><text x="${x[1]}" y="${height-12}" text-anchor="middle" class="economy-scenario-axis">7 dias</text><text x="${x[2]}" y="${height-12}" text-anchor="end" class="economy-scenario-axis">30 dias</text></svg>`;
  }

  function forecastPanel(forecast, currentValue) {
    return `<article class="economy-forecast-panel">
      <header><div><span>CENÁRIOS · 7 E 30 DIAS</span><h3>Faixa de pressão projetada</h3></div><div class="economy-forecast-confidence"><b>${number(forecast.confidenceScore)}%</b><small>Confiança ${safe(forecast.confidenceLabel.toLowerCase())}</small></div></header>
      <div class="economy-forecast-meta"><span>Janela observada <b>${number(forecast.observedDays,1)} dias</b></span><span>Cadência média <b>${number(forecast.revisionCadenceDays,1)} dias</b></span><span>Choque típico <b>${signed(forecast.typicalReductionPct)}</b></span></div>
      ${scenarioChart(forecast, currentValue)}
      <div class="economy-scenario-notes">${forecast.scenarios.map(scenario => `<div class="${scenario.key}"><strong>${safe(scenario.label)}</strong><span>30d: ${number(scenario.day30,2)} · ${signed(scenario.delta30Pct)}</span><small>${safe(scenario.assumption)}</small></div>`).join('')}</div>
      <p class="economy-forecast-caveat">ⓘ ${safe(forecast.caveat)}</p>
    </article>`;
  }

  function decisionLevel(score) {
    return score >= 70 ? 'Alta' : score >= 50 ? 'Atenção' : 'Monitorada';
  }

  function normalizedSearch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function decisionDrivers(item, scenario, weights) {
    return Object.entries(weights).map(([key, weight]) => ({
      key,
      value: item.components[key] * weight / 100
    })).sort((a, b) => b.value - a.value).slice(0, 2).map(driver => componentLabels[driver.key]);
  }

  function decisionRankingRows(snapshot) {
    const ranking = snapshot.itemDecisionRanking;
    if (!ranking?.items?.length) return '<div class="economy-empty">Ranking por cenário indisponível.</div>';
    const scenario = decisionState.scenario || ranking.currentScenario;
    const weights = ranking.weights[scenario];
    const query = normalizedSearch(decisionState.query);
    const ordered = [...ranking.items].sort((a, b) => a.ranks[scenario] - b.ranks[scenario]);
    const filtered = ordered.filter(item => {
      const level = decisionLevel(item.scores[scenario]);
      const matchesQuery = !query || normalizedSearch(`${item.name} ${item.itemId}`).includes(query);
      return matchesQuery && (decisionState.level === 'all' || decisionState.level === level);
    });
    const visible = filtered.slice(0, decisionState.visible);
    const rows = visible.map(item => {
      const score = item.scores[scenario];
      const level = decisionLevel(score);
      const movement = item.ranks.stable - item.ranks[scenario];
      const movementText = scenario === 'stable' || movement === 0 ? '—' : movement > 0 ? `↑${movement}` : `↓${Math.abs(movement)}`;
      const drivers = decisionDrivers(item, scenario, weights);
      const detail = Object.entries(weights).map(([key, weight]) => `${componentLabels[key]} ${item.components[key]} × ${weight}%`).join(' · ');
      const icon = typeof getItemIconUrl === 'function' ? getItemIconUrl(item.itemId, 'item') : `https://static.divine-pride.net/images/items/item/${item.itemId}.png`;
      return `<button type="button" class="economy-decision-row level-${level.toLowerCase()}" data-economy-kind="item" data-economy-id="${item.itemId}" title="${safe(detail)}">
        <span class="economy-decision-rank"><b>#${item.ranks[scenario]}</b><small class="${movement > 0 ? 'up' : movement < 0 ? 'down' : ''}">${movementText}</small></span>
        <span class="economy-decision-icon"><img src="${icon}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"></span>
        <span class="economy-decision-name"><strong>${safe(item.name)}</strong><small>#${item.itemId} · ${safe(drivers.join(' + '))}</small><em>${number(item.sharePct,2)}% da pressão · ${number(item.price)}z · ${number(item.mobSources)} mobs / ${number(item.mapSources)} mapas</em></span>
        <span class="economy-decision-score"><b>${number(score,1)}</b><small>${level}</small><i><em style="--decision-score:${score}%"></em></i></span>
        <span class="economy-decision-metric"><b>${number(item.sharePct,2)}%</b><small>da pressão</small></span>
        <span class="economy-decision-metric"><b>${number(item.price)}z</b><small>venda NPC</small></span>
        <span class="economy-decision-metric sources"><b>${number(item.mobSources)} mobs</b><small>${number(item.mapSources)} mapas</small></span>
      </button>`;
    }).join('');
    return `<div class="economy-decision-caption"><span><b>${number(filtered.length)}</b> itens encontrados</span><span>Posições comparadas ao cenário neutro · Wiki r${snapshot.meta.latestRevision}</span></div>
      <div class="economy-decision-columns" aria-hidden="true"><span>Posição</span><span>Item e principais fatores</span><span>Nota</span><span>Pressão</span><span>Preço</span><span>Fontes</span></div>
      <div class="economy-decision-list">${rows || '<div class="economy-empty">Nenhum item corresponde aos filtros.</div>'}</div>
      <footer class="economy-decision-foot"><span>Exibindo ${number(visible.length)} de ${number(filtered.length)}</span>${visible.length < filtered.length ? '<button type="button" data-economy-more>Mostrar mais 15</button>' : ''}</footer>`;
  }

  function decisionRankingPanel(snapshot) {
    const ranking = snapshot.itemDecisionRanking;
    if (!ranking?.items?.length) return '';
    if (!decisionState.scenario || !ranking.weights[decisionState.scenario]) decisionState.scenario = ranking.currentScenario;
    const scenarioButtons = Object.keys(ranking.weights).map(key => `<button type="button" class="${decisionState.scenario === key ? 'active' : ''}" data-economy-scenario="${key}" aria-pressed="${decisionState.scenario === key}">${scenarioLabels[key]}${key === ranking.currentScenario ? '<small>Atual</small>' : ''}</button>`).join('');
    return `<section class="economy-decision-panel" aria-labelledby="economyDecisionTitle">
      <header><div><span>RANKING DECISÓRIO · RAW ZENY</span><h3 id="economyDecisionTitle">Itens por pressão econômica</h3><p>${safe(ranking.methodology)}</p></div><div class="economy-decision-confidence"><span><b>${number(snapshot.summary.confidenceScore)}%</b> estrutural</span><span><b>${number(snapshot.forecast.confidenceScore)}%</b> cenários</span></div></header>
      <div class="economy-decision-toolbar">
        <div class="economy-scenario-switch" role="group" aria-label="Cenário do ranking">${scenarioButtons}</div>
        <div class="economy-decision-filters"><input id="economyDecisionSearch" type="search" placeholder="Buscar item ou ID…" value="${safe(decisionState.query)}" aria-label="Buscar no ranking"><select id="economyDecisionLevel" aria-label="Filtrar classificação"><option value="all">Todas as classificações</option><option value="Alta" ${decisionState.level === 'Alta' ? 'selected' : ''}>Alta</option><option value="Atenção" ${decisionState.level === 'Atenção' ? 'selected' : ''}>Atenção</option><option value="Monitorada" ${decisionState.level === 'Monitorada' ? 'selected' : ''}>Monitorada</option></select></div>
      </div>
      <div id="economyDecisionResults">${decisionRankingRows(snapshot)}</div>
    </section>`;
  }

  function refreshDecisionRanking(snapshot) {
    const target = document.getElementById('economyDecisionResults');
    if (target) target.innerHTML = decisionRankingRows(snapshot);
    document.querySelectorAll('[data-economy-scenario]').forEach(button => {
      const selected = button.dataset.economyScenario === decisionState.scenario;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function render(snapshot) {
    const container = document.getElementById('economy-dashboard');
    if (!container) return;
    if (!snapshot?.summary) {
      container.innerHTML = '<div class="economy-empty-state"><strong>Snapshot econômico indisponível</strong><span>Execute o gerador econômico após sincronizar a Wiki.</span></div>';
      return;
    }
    const summary = snapshot.summary;
    const baselineDrop = Math.abs(summary.cumulativeEmissionDeltaPct);
    const lastDirection = summary.latestDeltaPct < 0 ? 'reduziu' : summary.latestDeltaPct > 0 ? 'aumentou' : 'manteve';
    container.innerHTML = `
      <header class="economy-hero">
        <div class="economy-hero-copy"><span>INTELIGÊNCIA DE RAW ZENY · NPC</span><h2>Radar Econômico AureumRO</h2><p>Leitura estrutural da geração de Zeny a partir dos preços oficiais, drops e densidade de spawn sincronizados com a Wiki.</p></div>
        <div class="economy-hero-status"><i></i><span>Política ${safe(summary.stance.toLowerCase())}</span><small>Wiki r${summary.latestRevision} · ${dateLabel(summary.latestTimestamp)}</small></div>
      </header>
      <section class="economy-kpi-grid" aria-label="Indicadores econômicos principais">
        <article><span>Índice da cesta NPC</span><strong>${number(summary.priceIndex,2)}</strong><small>Base anterior = 100</small></article>
        <article><span>Pressão de emissão</span><strong>${number(summary.emissionIndex,2)}</strong><small class="negative">${signed(summary.cumulativeEmissionDeltaPct)} desde o baseline</small></article>
        <article><span>Última revisão</span><strong class="${summary.latestDeltaPct < 0 ? 'negative' : 'positive'}">${signed(summary.latestDeltaPct)}</strong><small>${summary.latestChangedItems} itens alterados</small></article>
        <article><span>Confiança estrutural</span><strong>${number(summary.confidenceScore)}%</strong><small>${safe(summary.confidenceLabel)} · ${number(snapshot.coverage.dropCoveragePct,1)}% dos drops precificados</small></article>
      </section>
      <section class="economy-reading">
        <div><span>LEITURA DO MOMENTO</span><h3>Capacidade de Raw Zeny sob compressão</h3></div>
        <p>A pressão estrutural está <strong>${number(baselineDrop,1)}% abaixo</strong> do cenário anterior ao balanceamento. A revisão mais recente ${lastDirection} o índice em <strong>${number(Math.abs(summary.latestDeltaPct),2)}%</strong>. Isso mede potencial de emissão — não inflação real ou volume negociado entre jogadores.</p>
      </section>
      <section class="economy-primary-grid">
        <article class="economy-chart-panel"><header><div><span>ÍNDICES HISTÓRICOS</span><h3>Direção da economia NPC</h3></div><small>${snapshot.meta.revisionCount} revisões · ${snapshot.meta.trackedItems} itens monitorados</small></header>${lineChart(snapshot.series)}</article>
        <article class="economy-impact-panel"><header><div><span>ÚLTIMA REVISÃO · r${snapshot.latestRevisionImpact.revision}</span><h3>Impacto do ajuste</h3></div><small>${dateLabel(snapshot.latestRevisionImpact.timestamp)}</small></header><p>${safe(snapshot.latestRevisionImpact.comment)}</p>${impactChart(snapshot.latestRevisionImpact)}</article>
      </section>
      <section class="economy-rankings-grid">
        ${rankingPanel('Itens que sustentam a emissão','Preço × chance × spawns',snapshot.rankings.items,'item')}
        ${rankingPanel('Monstros com maior pressão','Retorno esperado × spawns',snapshot.rankings.mobs,'mob')}
        ${rankingPanel('Mapas com maior pressão','Soma estrutural dos spawns',snapshot.rankings.maps,'map')}
      </section>
      <section class="economy-secondary-grid">
        ${concentrationPanel(snapshot.concentration)}
        ${timelinePanel(snapshot.timeline, snapshot.meta.sourceUrl)}
      </section>
      <section class="economy-predictive-grid">
        ${reviewPressurePanel(snapshot.reviewPressure)}
        ${forecastPanel(snapshot.forecast, summary.emissionIndex)}
      </section>
      ${decisionRankingPanel(snapshot)}
      <footer class="economy-methodology"><div><strong>Metodologia v${safe(snapshot.meta.methodologyVersion)}</strong><span>${safe(snapshot.meta.methodology)}</span></div><button type="button" data-economy-page="wiki-sync">Abrir auditoria dos dados →</button></footer>`;

    container.addEventListener('click', event => {
      const button = event.target.closest('[data-economy-kind]');
      if (!button) return;
      const kind = button.dataset.economyKind;
      const id = button.dataset.economyId;
      if (kind === 'item' && typeof openItemModal === 'function') openItemModal(Number(id));
      if (kind === 'mob' && typeof openMobModal === 'function') openMobModal(Number(id));
      if (kind === 'map' && typeof openMapModal === 'function') openMapModal(id);
    });
    container.querySelector('.economy-decision-panel')?.addEventListener('click', event => {
      const scenarioButton = event.target.closest('[data-economy-scenario]');
      if (scenarioButton) {
        decisionState.scenario = scenarioButton.dataset.economyScenario;
        decisionState.visible = 15;
        refreshDecisionRanking(snapshot);
        return;
      }
      if (event.target.closest('[data-economy-more]')) {
        decisionState.visible += 15;
        refreshDecisionRanking(snapshot);
      }
    });
    container.querySelector('#economyDecisionSearch')?.addEventListener('input', event => {
      decisionState.query = event.target.value;
      decisionState.visible = 15;
      refreshDecisionRanking(snapshot);
    });
    container.querySelector('#economyDecisionLevel')?.addEventListener('change', event => {
      decisionState.level = event.target.value;
      decisionState.visible = 15;
      refreshDecisionRanking(snapshot);
    });
    container.querySelector('[data-economy-page]')?.addEventListener('click', event => navigateTo(event.currentTarget.dataset.economyPage));
  }

  function init() {
    render(APP.economySnapshot);
  }

  root.initEconomyDashboard = init;
  root.renderEconomyDashboard = render;
})(typeof window !== 'undefined' ? window : globalThis);
