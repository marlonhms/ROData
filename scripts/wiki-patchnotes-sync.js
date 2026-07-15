'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'wiki-patchnotes.json');
const WIKI_BASE = 'https://wiki.aureumro.com';
const API = `${WIKI_BASE}/api.php?action=query&list=recentchanges&rcnamespace=0&rclimit=250&rcprop=title%7Ctimestamp%7Cuser%7Ccomment%7Cids%7Csizes%7Cflags&format=json&origin=*`;

function pageUrl(title) {
  return `${WIKI_BASE}/index.php?title=${encodeURIComponent(title).replace(/%20/g, '_')}`;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const response = await fetch(API, { headers: { 'User-Agent': 'AureumRO-PatchNotes-Sync/1.0' } });
  if (!response.ok) throw new Error(`A wiki respondeu HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.info || payload.error.code);

  const changes = payload.query?.recentchanges || [];
  const grouped = new Map();

  for (const change of changes) {
    if (!change.title || change.title.includes(':')) continue;
    const current = grouped.get(change.title);
    const detail = clean(change.comment) || 'Conteúdo da página atualizado.';
    if (!current) {
      grouped.set(change.title, {
        id: change.revid,
        title: change.title,
        type: change.type === 'new' || !change.old_revid ? 'new' : 'update',
        timestamp: change.timestamp,
        author: change.user || 'Equipe AureumRO',
        summary: detail,
        details: [detail],
        revisions: 1,
        sizeDelta: (change.newlen || 0) - (change.oldlen || 0),
        url: pageUrl(change.title)
      });
      continue;
    }
    current.revisions += 1;
    current.sizeDelta += (change.newlen || 0) - (change.oldlen || 0);
    if (!current.details.includes(detail) && current.details.length < 4) current.details.push(detail);
    if (change.type === 'new' || !change.old_revid) current.type = 'new';
  }

  const entries = [...grouped.values()]
    .filter(entry => entry.summary !== 'Conteúdo da página atualizado.' || entry.sizeDelta !== 0)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: `${WIKI_BASE}/index.php?title=Especial:Mudan%C3%A7as_recentes`,
      latestRevision: Math.max(0, ...entries.map(entry => entry.id || 0)),
      totalEntries: entries.length,
      note: 'Snapshot manual das mudanças recentes da Wiki AureumRO.'
    },
    entries
  };

  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Patch Notes atualizados: ${entries.length} páginas em ${path.basename(OUTPUT)}.`);
}

main().catch(error => {
  console.error(`Falha ao sincronizar Patch Notes: ${error.message}`);
  process.exitCode = 1;
});
