'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function percentage(part, total) {
  return total > 0 ? round(part / total * 100, 2) : 0;
}

function median(values) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function concentration(records, total) {
  const shares = records.map(record => total > 0 ? record.rawContribution / total : 0);
  const hhi = round(shares.reduce((sum, share) => sum + share ** 2, 0) * 10000, 0);
  const label = hhi >= 2500 ? 'Alta' : hhi >= 1500 ? 'Moderada' : 'Distribuída';
  return {
    top1Pct: percentage(records[0]?.rawContribution || 0, total),
    top5Pct: percentage(records.slice(0, 5).reduce((sum, record) => sum + record.rawContribution, 0), total),
    top10Pct: percentage(records.slice(0, 10).reduce((sum, record) => sum + record.rawContribution, 0), total),
    hhi,
    label
  };
}

function buildEconomySnapshot(db, overrides, history) {
  const itemsById = new Map(db.items.map(item => [Number(item.id), item]));
  const mobsById = new Map(db.mobs.map(mob => [Number(mob.id), mob]));
  const currentPrice = new Map(db.items.map(item => {
    const override = overrides.items?.[item.id];
    return [Number(item.id), Number(override?.preco_venda ?? item.preco_venda) || 0];
  }));

  const spawnByMob = new Map();
  const mapIdsByMob = new Map();
  db.spawns.forEach(spawn => {
    const mobId = Number(spawn.mob_id);
    const quantity = Number(spawn.qtd) || 0;
    spawnByMob.set(mobId, (spawnByMob.get(mobId) || 0) + quantity);
    if (!mapIdsByMob.has(mobId)) mapIdsByMob.set(mobId, new Set());
    if (spawn.mapa_id) mapIdsByMob.get(mobId).add(spawn.mapa_id);
  });

  const supplyWeightByItem = new Map();
  const mobSourcesByItem = new Map();
  const mapSourcesByItem = new Map();
  db.drops.forEach(drop => {
    const mob = mobsById.get(Number(drop.mob_id));
    if (!mob || mob.mvp) return;
    const mobId = Number(drop.mob_id);
    const supply = (Number(drop.chance) || 0) * (spawnByMob.get(mobId) || 0);
    const itemId = Number(drop.item_id);
    supplyWeightByItem.set(itemId, (supplyWeightByItem.get(itemId) || 0) + supply);
    if (!mobSourcesByItem.has(itemId)) mobSourcesByItem.set(itemId, new Set());
    if (!mapSourcesByItem.has(itemId)) mapSourcesByItem.set(itemId, new Set());
    mobSourcesByItem.get(itemId).add(mobId);
    (mapIdsByMob.get(mobId) || []).forEach(mapId => mapSourcesByItem.get(itemId).add(mapId));
  });

  const historyRecords = Object.values(history.items || {}).map(record => ({
    ...record,
    itemId: Number(record.itemId),
    points: [...(record.points || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }));
  const tracked = historyRecords.filter(record => record.points.length >= 2 && Number(record.points[0].value) > 0);
  const baselinePrices = new Map(tracked.map(record => [record.itemId, Number(record.points[0].value) || 0]));
  const historicalPrices = new Map(baselinePrices);
  const baselinePriceBasket = [...baselinePrices.values()].reduce((sum, value) => sum + value, 0);
  const baselineEmission = tracked.reduce((sum, record) => sum + (baselinePrices.get(record.itemId) || 0) * (supplyWeightByItem.get(record.itemId) || 0), 0);

  function economicPoint(meta, changes = []) {
    const priceBasket = tracked.reduce((sum, record) => sum + (historicalPrices.get(record.itemId) || 0), 0);
    const emission = tracked.reduce((sum, record) => sum + (historicalPrices.get(record.itemId) || 0) * (supplyWeightByItem.get(record.itemId) || 0), 0);
    return {
      revision: meta.revision ?? null,
      timestamp: meta.timestamp,
      label: meta.label || meta.comment || 'Revisão econômica',
      priceIndex: round(priceBasket / Math.max(1, baselinePriceBasket) * 100, 2),
      emissionIndex: round(emission / Math.max(1, baselineEmission) * 100, 2),
      reductions: changes.filter(change => change.after < change.before).length,
      increases: changes.filter(change => change.after > change.before).length,
      changedItems: changes.length
    };
  }

  const revisions = history.audit?.revisions || [];
  const firstTimestamp = revisions[0]?.timestamp || history.meta?.generatedAt;
  const series = [economicPoint({ timestamp:firstTimestamp, label:'Baseline anterior ao balanceamento' })];
  const revisionChanges = new Map();

  revisions.forEach(revision => {
    const changes = [];
    tracked.forEach(record => {
      const point = record.points.find(candidate => Number(candidate.revision) === Number(revision.revision));
      if (!point) return;
      const before = historicalPrices.get(record.itemId) || 0;
      const after = Number(point.value) || 0;
      if (before === after) return;
      historicalPrices.set(record.itemId, after);
      changes.push({
        itemId: record.itemId,
        name: record.name,
        before,
        after,
        delta: after - before,
        deltaPct: before > 0 ? round((after - before) / before * 100, 2) : null,
        supplyWeight: round(supplyWeightByItem.get(record.itemId) || 0, 6),
        rawImpact: round((after - before) * (supplyWeightByItem.get(record.itemId) || 0), 4)
      });
    });
    revisionChanges.set(Number(revision.revision), changes);
    series.push(economicPoint(revision, changes));
  });

  const latestRevision = revisions[revisions.length - 1] || {};
  const latestChanges = (revisionChanges.get(Number(latestRevision.revision)) || [])
    .sort((a, b) => Math.abs(b.rawImpact) - Math.abs(a.rawImpact));
  const previousPoint = series[series.length - 2] || series[0];
  const currentPoint = series[series.length - 1] || series[0];
  const latestDeltaPct = previousPoint.emissionIndex > 0
    ? round((currentPoint.emissionIndex - previousPoint.emissionIndex) / previousPoint.emissionIndex * 100, 2)
    : 0;

  const mobMetrics = db.mobs.filter(mob => !mob.mvp).map(mob => {
    const drops = db.drops.filter(drop => Number(drop.mob_id) === Number(mob.id));
    const rawPerKill = drops.reduce((sum, drop) => sum + (Number(drop.chance) || 0) * (currentPrice.get(Number(drop.item_id)) || 0), 0);
    const totalSpawn = spawnByMob.get(Number(mob.id)) || 0;
    return {
      mobId: Number(mob.id),
      name: mob.nome,
      level: Number(mob.nivel) || 0,
      rawPerKill: round(rawPerKill, 2),
      rawContribution: round(rawPerKill * totalSpawn, 2),
      totalSpawn,
      mapCount: Number(mob.num_mapas) || 0
    };
  }).filter(record => record.rawPerKill > 0 && record.totalSpawn > 0)
    .sort((a, b) => b.rawContribution - a.rawContribution);
  const mobMetricById = new Map(mobMetrics.map(record => [record.mobId, record]));

  const mapMetrics = db.maps.map(map => {
    const spawns = db.spawns.filter(spawn => spawn.mapa_id === map.id);
    const rawContribution = spawns.reduce((sum, spawn) => {
      const metric = mobMetricById.get(Number(spawn.mob_id));
      return sum + (metric?.rawPerKill || 0) * (Number(spawn.qtd) || 0);
    }, 0);
    return {
      mapId: map.id,
      name: map.nome,
      rawContribution: round(rawContribution, 2),
      density: spawns.reduce((sum, spawn) => sum + (Number(spawn.qtd) || 0), 0),
      species: spawns.filter(spawn => mobMetricById.has(Number(spawn.mob_id))).length
    };
  }).filter(record => record.rawContribution > 0).sort((a, b) => b.rawContribution - a.rawContribution);

  const itemMetrics = [...supplyWeightByItem.entries()].map(([itemId, supplyWeight]) => {
    const price = currentPrice.get(itemId) || 0;
    return {
      itemId,
      name: itemsById.get(itemId)?.nome || `Item #${itemId}`,
      price,
      supplyWeight: round(supplyWeight, 6),
      rawContribution: round(price * supplyWeight, 2),
      historyChanges: history.items?.[itemId]?.changeCount || 0,
      mobSources: mobSourcesByItem.get(itemId)?.size || 0,
      mapSources: mapSourcesByItem.get(itemId)?.size || 0
    };
  }).filter(record => record.rawContribution > 0).sort((a, b) => b.rawContribution - a.rawContribution);

  const totalItemContribution = itemMetrics.reduce((sum, record) => sum + record.rawContribution, 0);
  const totalMapContribution = mapMetrics.reduce((sum, record) => sum + record.rawContribution, 0);
  itemMetrics.forEach(record => { record.sharePct = percentage(record.rawContribution, totalItemContribution); });
  mapMetrics.forEach(record => { record.sharePct = percentage(record.rawContribution, totalMapContribution); });

  const pricedDrops = db.drops.filter(drop => (currentPrice.get(Number(drop.item_id)) || 0) > 0).length;
  const mobsWithRaw = mobMetrics.length;
  const dropCoveragePct = percentage(pricedDrops, db.drops.length);
  const revisionDepth = Math.min(100, percentage(history.meta?.revisionCount || 0, 12));
  const consistency = Number(history.meta?.currentMismatches || 0) === 0 ? 100 : 0;
  const confidenceScore = round(dropCoveragePct * .45 + revisionDepth * .35 + consistency * .2, 0);
  const confidenceLabel = confidenceScore >= 80 ? 'Alta' : confidenceScore >= 60 ? 'Moderada' : 'Baixa';
  const stance = latestDeltaPct <= -2 ? 'Restritiva' : latestDeltaPct >= 2 ? 'Expansionista' : 'Estável';
  const itemConcentration = concentration(itemMetrics, totalItemContribution);
  const mapConcentration = concentration(mapMetrics, totalMapContribution);
  const maxItemContribution = Math.max(1, ...itemMetrics.map(record => record.rawContribution));
  const maxItemSupply = Math.max(1, ...itemMetrics.map(record => record.supplyWeight));
  const maxItemPrice = Math.max(1, ...itemMetrics.map(record => record.price));
  const reviewPressure = itemMetrics.map(record => {
    const pressureScore = Math.sqrt(record.rawContribution / maxItemContribution) * 100;
    const availabilityScore = Math.sqrt(record.supplyWeight / maxItemSupply) * 100;
    const historyScore = Math.min(100, Number(record.historyChanges || 0) * 45);
    const priceScore = Math.log1p(record.price) / Math.log1p(maxItemPrice) * 100;
    const score = round(pressureScore * .45 + availabilityScore * .25 + historyScore * .2 + priceScore * .1, 0);
    const historyRecord = history.items?.[record.itemId];
    const reasons = [];
    if (record.sharePct >= 1) reasons.push(`${round(record.sharePct,2)}% da pressão estrutural`);
    if (availabilityScore >= 45) reasons.push('alta disponibilidade nos spawns');
    if (record.historyChanges > 0) reasons.push(`${record.historyChanges} ajuste${record.historyChanges === 1 ? '' : 's'} anterior${record.historyChanges === 1 ? '' : 'es'}`);
    if (priceScore >= 70) reasons.push(`preço NPC de ${record.price}z`);
    if (!reasons.length) reasons.push('contribuição combinada de preço e oferta');
    return {
      itemId: record.itemId,
      name: record.name,
      score,
      level: score >= 70 ? 'Alta' : score >= 50 ? 'Atenção' : 'Monitorada',
      sharePct: record.sharePct,
      price: record.price,
      supplyWeight: record.supplyWeight,
      historyChanges: record.historyChanges,
      lastChangeAt: historyRecord?.points?.[historyRecord.points.length - 1]?.timestamp || null,
      reasons: reasons.slice(0, 3)
    };
  }).sort((a, b) => b.score - a.score || b.sharePct - a.sharePct);

  const decisionWeights = {
    restrictive: { pressure:50, availability:20, history:25, price:5 },
    stable: { pressure:45, availability:25, history:20, price:10 },
    opening: { pressure:35, availability:30, history:10, price:25 }
  };
  const currentScenario = stance === 'Restritiva' ? 'restrictive' : stance === 'Expansionista' ? 'opening' : 'stable';
  const decisionItems = itemMetrics.map(record => {
    const components = {
      pressure: round(Math.sqrt(record.rawContribution / maxItemContribution) * 100, 1),
      availability: round(Math.sqrt(record.supplyWeight / maxItemSupply) * 100, 1),
      history: round(Math.min(100, Number(record.historyChanges || 0) * 45), 1),
      price: round(Math.log1p(record.price) / Math.log1p(maxItemPrice) * 100, 1)
    };
    const scores = Object.fromEntries(Object.entries(decisionWeights).map(([key, weights]) => [key, round(
      Object.entries(weights).reduce((sum, [component, weight]) => sum + components[component] * weight / 100, 0),
      1
    )]));
    return {
      itemId: record.itemId,
      name: record.name,
      price: record.price,
      sharePct: record.sharePct,
      supplyWeight: record.supplyWeight,
      rawContribution: record.rawContribution,
      historyChanges: record.historyChanges,
      mobSources: record.mobSources,
      mapSources: record.mapSources,
      components,
      scores,
      ranks: {}
    };
  });
  Object.keys(decisionWeights).forEach(key => {
    [...decisionItems].sort((a, b) => b.scores[key] - a.scores[key] || b.sharePct - a.sharePct || a.itemId - b.itemId)
      .forEach((item, index) => { item.ranks[key] = index + 1; });
  });
  decisionItems.sort((a, b) => a.ranks[currentScenario] - b.ranks[currentScenario]);

  const revisionShocks = series.slice(2).map((point, index) => {
    const previous = series[index + 1];
    return previous.emissionIndex > 0 ? round((point.emissionIndex - previous.emissionIndex) / previous.emissionIndex * 100, 2) : 0;
  }).filter(value => value !== 0);
  const reductionShocks = revisionShocks.filter(value => value < 0);
  const typicalReductionPct = round(median(reductionShocks), 2);
  const historyStartDate = new Date(firstTimestamp);
  const historyEndDate = new Date(latestRevision.timestamp || history.meta?.generatedAt);
  const observedDays = Math.max(1, round((historyEndDate - historyStartDate) / 86400000, 1));
  const revisionCadenceDays = round(observedDays / Math.max(1, revisions.length - 1), 1);
  const repeatRatio = percentage(history.meta?.multiChangeItems || 0, Math.max(1, tracked.length));
  const forecastConfidenceScore = round(20
    + Math.min(30, (revisions.length / 16) * 30)
    + Math.min(20, (observedDays / 180) * 20)
    + Math.min(20, repeatRatio)
    + (Number(history.meta?.currentMismatches || 0) === 0 ? 10 : 0), 0);
  const forecastConfidenceLabel = forecastConfidenceScore >= 70 ? 'Alta' : forecastConfidenceScore >= 45 ? 'Moderada' : 'Baixa';
  const currentEmission = currentPoint.emissionIndex;
  const expansionPct = Math.min(5, Math.abs(typicalReductionPct) / 2 || 1);
  const scenarioValue = delta => round(currentEmission * (1 + delta / 100), 2);
  const scenarios = [
    {
      key: 'restrictive',
      label: 'Novo ajuste focal',
      direction: 'Restritivo',
      day7: scenarioValue(typicalReductionPct / 2),
      day30: scenarioValue(typicalReductionPct),
      delta30Pct: typicalReductionPct,
      assumption: `Uma revisão com impacto semelhante à mediana recente (${round(typicalReductionPct,2)}%).`
    },
    {
      key: 'stable',
      label: 'Estabilidade',
      direction: 'Neutro',
      day7: currentEmission,
      day30: currentEmission,
      delta30Pct: 0,
      assumption: 'Nenhuma alteração adicional nos preços NPC monitorados.'
    },
    {
      key: 'opening',
      label: 'Abertura de fontes',
      direction: 'Expansionista',
      day7: scenarioValue(expansionPct / 2),
      day30: scenarioValue(expansionPct),
      delta30Pct: round(expansionPct, 2),
      assumption: `Novos drops vendáveis elevam a pressão em ${round(expansionPct,2)}%; cenário hipotético sem precedente positivo na série.`
    }
  ];

  return {
    meta: {
      schemaVersion: 1,
      methodologyVersion: '1.2.0',
      generatedAt: new Date().toISOString(),
      sourcePage: history.meta?.sourcePage || 'Economia',
      sourceUrl: history.meta?.sourceUrl,
      latestRevision: history.meta?.latestRevision,
      historyStart: firstTimestamp,
      revisionCount: history.meta?.revisionCount || revisions.length,
      trackedItems: tracked.length,
      methodology: 'Cesta NPC por unidade e pressão de emissão ponderada por chance de drop e quantidade de spawn; MVPs excluídos dos rankings sustentáveis.'
    },
    summary: {
      priceIndex: currentPoint.priceIndex,
      emissionIndex: currentPoint.emissionIndex,
      latestDeltaPct,
      cumulativeEmissionDeltaPct: round(currentPoint.emissionIndex - 100, 2),
      stance,
      confidenceScore,
      confidenceLabel,
      latestChangedItems: latestChanges.length,
      latestRevision: latestRevision.revision || history.meta?.latestRevision,
      latestTimestamp: latestRevision.timestamp || history.meta?.generatedAt,
      latestImpactRaw: round(latestChanges.reduce((sum, change) => sum + change.rawImpact, 0), 2)
    },
    coverage: {
      pricedItems: [...currentPrice.values()].filter(value => value > 0).length,
      totalItems: db.items.filter(item => Number(item.id) < 2000000).length,
      pricedDrops,
      totalDrops: db.drops.length,
      dropCoveragePct,
      mobsWithRaw,
      totalMobs: db.mobs.length,
      trackedHistoryItems: tracked.length,
      historyPoints: history.meta?.totalPoints || 0,
      currentMismatches: history.meta?.currentMismatches || 0
    },
    series,
    latestRevisionImpact: {
      revision: latestRevision.revision || null,
      timestamp: latestRevision.timestamp || null,
      comment: latestRevision.comment || '',
      emissionDeltaPct: latestDeltaPct,
      reductions: latestChanges.filter(change => change.after < change.before).length,
      increases: latestChanges.filter(change => change.after > change.before).length,
      items: latestChanges.slice(0, 12)
    },
    rankings: {
      items: itemMetrics.slice(0, 12),
      mobs: mobMetrics.slice(0, 12),
      maps: mapMetrics.slice(0, 12)
    },
    concentration: {
      items: itemConcentration,
      maps: mapConcentration,
      topItems: itemMetrics.slice(0, 5).map(record => ({ itemId:record.itemId, name:record.name, sharePct:record.sharePct })),
      topMaps: mapMetrics.slice(0, 5).map(record => ({ mapId:record.mapId, name:record.name, sharePct:record.sharePct }))
    },
    reviewPressure: {
      methodology: 'Pontuação relativa: contribuição estrutural 45%, disponibilidade 25%, histórico de ajustes 20% e preço NPC 10%. Não representa decisão oficial da administração.',
      items: reviewPressure.slice(0, 12)
    },
    itemDecisionRanking: {
      currentScenario,
      baselineScenario: 'stable',
      totalItems: decisionItems.length,
      weights: decisionWeights,
      methodology: 'Ranking relativo por cenário. A nota combina pressão estrutural, disponibilidade, histórico administrativo e atratividade do preço NPC; não prevê preço individual nem decisão oficial.',
      items: decisionItems
    },
    forecast: {
      confidenceScore: forecastConfidenceScore,
      confidenceLabel: forecastConfidenceLabel,
      observedDays,
      revisionCadenceDays,
      typicalReductionPct,
      historicalShocksPct: revisionShocks,
      range30: { min:Math.min(...scenarios.map(scenario => scenario.day30)), max:Math.max(...scenarios.map(scenario => scenario.day30)) },
      scenarios,
      caveat: 'Cenários determinísticos baseados no histórico administrativo da Wiki. Não são anúncio oficial, previsão de inflação real ou cotação do mercado entre jogadores.'
    },
    timeline: [...revisions].reverse().slice(0, 8).map(revision => {
      const point = series.find(candidate => Number(candidate.revision) === Number(revision.revision));
      return {
        revision: revision.revision,
        timestamp: revision.timestamp,
        comment: revision.comment || '',
        changedItems: point?.changedItems || 0,
        reductions: point?.reductions || 0,
        increases: point?.increases || 0,
        emissionIndex: point?.emissionIndex || null
      };
    })
  };
}

function main() {
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'db.json'), 'utf8'));
  const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, 'wiki-overrides.json'), 'utf8'));
  const history = JSON.parse(fs.readFileSync(path.join(ROOT, 'price-history.json'), 'utf8'));
  const snapshot = buildEconomySnapshot(db, overrides, history);
  fs.writeFileSync(path.join(ROOT, 'economy-snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Snapshot econômico: índice NPC ${snapshot.summary.priceIndex}, emissão ${snapshot.summary.emissionIndex}, ${snapshot.meta.revisionCount} revisões e confiança ${snapshot.summary.confidenceLabel.toLowerCase()} (${snapshot.summary.confidenceScore}%).`);
}

if (require.main === module) main();

module.exports = { buildEconomySnapshot };
