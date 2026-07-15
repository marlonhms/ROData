'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'db.json');
const OVERRIDES_PATH = path.join(ROOT, 'wiki-overrides.json');
const REPORT_PATH = path.join(ROOT, 'wiki-sync-report.json');
const WIKI_PAGE = 'Economia';
const WIKI_URL = 'https://wiki.aureumro.com/api.php?action=parse&page=Economia&prop=text%7Crevid&format=json&origin=*';
const APPLY = process.argv.includes('--apply');

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
    const priceCells = cells.map((text, index) => ({ index, value: parseZeny(text), text })).filter(cell => cell.value != null);
    if (priceCells.length < 2) continue;
    const beforeCell = priceCells[priceCells.length - 2];
    const afterCell = priceCells[priceCells.length - 1];
    const name = cells.slice(0, beforeCell.index).filter(text => text && !/^imagem?$/i.test(text)).pop();
    if (!name || /^(item|antes|depois)$/i.test(name)) continue;
    rows.push({ name, before: beforeCell.value, after: afterCell.value });
  }
  return rows;
}

async function fetchWikiPage() {
  const response = await fetch(WIKI_URL, { headers: { 'User-Agent': 'AureumRO-Database-Sync/1.0' } });
  if (!response.ok) throw new Error(`Wiki respondeu HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`MediaWiki: ${payload.error.info || payload.error.code}`);
  const html = payload?.parse?.text?.['*'];
  if (!html) throw new Error('A API não retornou o HTML da página Economia.');
  return { html, revision: payload.parse.revid || null, title: payload.parse.title || WIKI_PAGE };
}

function buildSync(db, wikiRows, source) {
  const byName = new Map();
  db.items.forEach(item => {
    const key = normalizeName(item.nome);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(item);
  });

  const overrides = {};
  const entries = [];
  for (const row of wikiRows) {
    const wikiItem = parseWikiItemName(row.name);
    let candidates = byName.get(normalizeName(wikiItem.name)) || [];
    if (wikiItem.slots != null) candidates = candidates.filter(item => Number(item.slots || 0) === wikiItem.slots);
    const alreadyCurrent = candidates.filter(item => Number(item.preco_venda) === row.after);
    const matchingBefore = candidates.filter(item => Number(item.preco_venda) === row.before);
    let status = 'unmatched';
    let selected = [];

    if (alreadyCurrent.length && alreadyCurrent.length === candidates.length) {
      status = 'already_current';
      selected = alreadyCurrent;
    } else if (matchingBefore.length) {
      status = matchingBefore.length > 1 ? 'matched_multiple' : 'matched';
      selected = matchingBefore;
    } else if (candidates.length) {
      status = 'conflict';
    }

    if (status === 'matched' || status === 'matched_multiple') {
      selected.forEach(item => {
        overrides[item.id] = {
          preco_venda: row.after,
          source: { type:'wiki', page:source.title, revision:source.revision, url:`https://wiki.aureumro.com/index.php?title=${encodeURIComponent(source.title)}` }
        };
      });
    }

    entries.push({
      wiki_name: row.name,
      before: row.before,
      after: row.after,
      status,
      matched_items: (selected.length ? selected : candidates).map(item => ({ id:item.id, nome:item.nome, current:item.preco_venda }))
    });
  }
  return { overrides, entries };
}

async function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const source = await fetchWikiPage();
  const wikiRows = extractEconomyRows(source.html);
  if (wikiRows.length < 50) throw new Error(`A tabela parece incompleta: apenas ${wikiRows.length} linhas foram reconhecidas.`);

  const result = buildSync(db, wikiRows, source);
  const counts = result.entries.reduce((acc, entry) => { acc[entry.status] = (acc[entry.status] || 0) + 1; return acc; }, {});
  const report = {
    meta: { generated_at:new Date().toISOString(), mode:APPLY ? 'apply' : 'preview', source_page:source.title, source_revision:source.revision, source_url:WIKI_URL, wiki_rows:wikiRows.length },
    summary: counts,
    entries: result.entries
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

  if (APPLY) {
    const payload = {
      meta: { source:'AureumRO Wiki', page:source.title, revision:source.revision, synced_at:new Date().toISOString(), applied_items:Object.keys(result.overrides).length },
      items: result.overrides
    };
    fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(payload, null, 2) + '\n');
  }

  console.log(`${APPLY ? 'APLICADO' : 'PRÉVIA'}: ${wikiRows.length} linhas da wiki, ${Object.keys(result.overrides).length} itens prontos.`);
  console.log(`Relatório: ${REPORT_PATH}`);
  if (!APPLY) console.log('Revise o relatório e execute novamente com --apply para gerar os overrides.');
}

main().catch(error => {
  console.error(`Falha na sincronização: ${error.message}`);
  process.exitCode = 1;
});
