'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'db.json');
const OVERRIDES_PATH = path.join(ROOT, 'wiki-overrides.json');
const OUTPUT_PATH = path.join(ROOT, 'price-history.json');
const APPROVALS_PATH = path.join(ROOT, 'wiki-price-approvals.json');
const WIKI_BASE = 'https://wiki.aureumro.com';
const PAGE = 'Economia';
const REVISIONS_API = `${WIKI_BASE}/api.php?action=query&prop=revisions&titles=${encodeURIComponent(PAGE)}&rvprop=ids%7Ctimestamp%7Ccomment&rvlimit=max&format=json&formatversion=2&origin=*`;
const USER_AGENT = 'AureumRO-Price-History-Sync/1.0';

function decodeHtml(value) {
  const named = { amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:' ' };
  return String(value || '')
    .replace(/&#(x?[0-9a-f]+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name.toLowerCase()] ?? `&${name};`);
}

function stripHtml(value) {
  return decodeHtml(String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseWikiItemName(value) {
  const slotMatch = String(value || '').match(/\[(\d+)\]\s*$/);
  return {
    name: String(value || '').replace(/\s*\[\d+\]\s*$/, '').trim(),
    slots: slotMatch ? Number(slotMatch[1]) : null
  };
}

function parseZeny(value) {
  const match = String(value || '').match(/([0-9][0-9.\s]*)\s*z?/i);
  return match ? Number(match[1].replace(/[.\s]/g, '')) : null;
}

function extractEconomyRows(html) {
  const rows = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => stripHtml(match[1]));
    const priceCells = cells.map((text, index) => ({ index, value: parseZeny(text) })).filter(cell => cell.value != null);
    if (priceCells.length < 2) continue;
    const beforeCell = priceCells[priceCells.length - 2];
    const afterCell = priceCells[priceCells.length - 1];
    const name = cells.slice(0, beforeCell.index).filter(text => text && !/^imagem?$/i.test(text)).pop();
    if (!name || /^(item|antes|depois)$/i.test(name)) continue;
    rows.push({ name, before:beforeCell.value, after:afterCell.value });
  }
  return rows;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Wiki respondeu HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.info || payload.error.code);
  return payload;
}

async function fetchRevisions() {
  const payload = await fetchJson(REVISIONS_API);
  const page = payload.query?.pages?.[0];
  const revisions = page?.revisions || [];
  if (!revisions.length) throw new Error('Nenhuma revisão da página Economia foi encontrada.');
  return revisions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

async function fetchRevisionRows(revision) {
  const url = `${WIKI_BASE}/api.php?action=parse&oldid=${revision.revid}&prop=text%7Crevid&format=json&origin=*`;
  const payload = await fetchJson(url);
  const html = payload.parse?.text?.['*'];
  if (!html) throw new Error(`A revisão ${revision.revid} não retornou conteúdo.`);
  return extractEconomyRows(html);
}

function buildItemIndex(db) {
  const index = new Map();
  db.items.forEach(item => {
    const key = normalizeName(item.nome);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(item);
  });
  return index;
}

function buildApprovalIndex(payload) {
  return new Map((payload?.approvals || []).map(approval => [normalizeName(approval.wikiName), {
    ...approval,
    approvedAt: approval.approvedAt || payload?.meta?.approvedAt || null,
    approvedBy: approval.approvedBy || payload?.meta?.approvedBy || null
  }]));
}

function findCandidates(index, byId, approvalIndex, wikiName) {
  const approval = approvalIndex.get(normalizeName(wikiName));
  if (approval) return (approval.itemIds || []).map(id => byId.get(Number(id))).filter(Boolean);
  const parsed = parseWikiItemName(wikiName);
  let candidates = index.get(normalizeName(parsed.name)) || [];
  if (parsed.slots != null) {
    candidates = candidates.filter(item => Number(item.slots || 0) === parsed.slots);
  } else {
    const unslotted = candidates.filter(item => item.slots == null || item.slots === '' || Number(item.slots) === 0);
    if (unslotted.length) candidates = unslotted;
  }
  return candidates;
}

function addPoint(record, point) {
  const previous = record.points[record.points.length - 1];
  if (previous && Number(previous.value) === Number(point.value)) return;
  record.points.push(point);
}

async function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const overrides = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8')) : { items:{} };
  const approvals = fs.existsSync(APPROVALS_PATH) ? JSON.parse(fs.readFileSync(APPROVALS_PATH, 'utf8')) : { approvals:[] };
  const approvalIndex = buildApprovalIndex(approvals);
  const approvalByItemId = new Map();
  approvalIndex.forEach(approval => (approval.itemIds || []).forEach(itemId => approvalByItemId.set(Number(itemId), approval)));
  const index = buildItemIndex(db);
  const byId = new Map(db.items.map(item => [Number(item.id), item]));
  const revisions = await fetchRevisions();
  const items = {};
  const unresolved = new Set();
  const revisionStats = [];

  for (const revision of revisions) {
    const rows = await fetchRevisionRows(revision);
    let matchedRows = 0;
    for (const row of rows) {
      const candidates = findCandidates(index, byId, approvalIndex, row.name);
      if (!candidates.length) {
        unresolved.add(row.name);
        continue;
      }
      matchedRows += 1;
      for (const item of candidates) {
        const key = String(item.id);
        if (!items[key]) {
          items[key] = { itemId:item.id, name:item.nome, wikiName:row.name, points:[] };
          addPoint(items[key], {
            timestamp: revision.timestamp,
            revision: revision.parentid || null,
            value: row.before,
            kind: 'baseline',
            label: 'Valor anterior ao balanceamento'
          });
        }
        addPoint(items[key], {
          timestamp: revision.timestamp,
          revision: revision.revid,
          value: row.after,
          kind: 'wiki',
          label: revision.comment || 'Preço atualizado na Wiki'
        });
      }
    }
    revisionStats.push({ revision:revision.revid, timestamp:revision.timestamp, wikiRows:rows.length, matchedRows, comment:revision.comment || '' });
  }

  const records = Object.values(items);
  const currentMismatches = [];
  let appliedItemCount = 0;
  records.forEach(record => {
    const approval = approvalByItemId.get(Number(record.itemId));
    if (approval) {
      record.approval = {
        approvedAt: approval.approvedAt,
        approvedBy: approval.approvedBy,
        wikiName: approval.wikiName,
        reason: approval.reason
      };
    }
    const latest = record.points[record.points.length - 1];
    const override = overrides.items?.[record.itemId];
    if (override) appliedItemCount += 1;
    if (override && Number(override.preco_venda) !== Number(latest.value)) {
      currentMismatches.push({ itemId:record.itemId, name:record.name, historyValue:latest.value, overrideValue:override.preco_venda });
    }
    record.changeCount = Math.max(0, record.points.length - 1);
    record.firstValue = record.points[0]?.value ?? null;
    record.currentValue = latest?.value ?? null;
    record.changePercent = record.firstValue > 0
      ? Number((((record.currentValue - record.firstValue) / record.firstValue) * 100).toFixed(2))
      : null;
  });

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      sourcePage: PAGE,
      sourceUrl: `${WIKI_BASE}/index.php?title=${encodeURIComponent(PAGE)}`,
      firstRevision: revisions[0].revid,
      latestRevision: revisions[revisions.length - 1].revid,
      manualApprovals: approvalIndex.size,
      revisionCount: revisions.length,
      itemCount: records.length,
      appliedItemCount,
      unappliedHistoryItems: records.length - appliedItemCount,
      totalPoints: records.reduce((sum, record) => sum + record.points.length, 0),
      multiChangeItems: records.filter(record => record.changeCount > 1).length,
      unresolvedWikiNames: unresolved.size,
      currentMismatches: currentMismatches.length
    },
    audit: {
      revisions: revisionStats,
      unresolvedWikiNames: [...unresolved].sort(),
      currentMismatches
    },
    items: Object.fromEntries(records.sort((a, b) => a.itemId - b.itemId).map(record => [record.itemId, record]))
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Histórico de preços: ${output.meta.itemCount} itens, ${output.meta.totalPoints} pontos e ${output.meta.revisionCount} revisões.`);
  console.log(`Auditoria: ${output.meta.currentMismatches} divergências atuais e ${output.meta.unresolvedWikiNames} nomes sem correspondência.`);
}

main().catch(error => {
  console.error(`Falha ao sincronizar histórico de preços: ${error.message}`);
  process.exitCode = 1;
});
