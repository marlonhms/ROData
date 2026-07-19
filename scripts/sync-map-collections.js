const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3] || path.join(__dirname, '..', 'map-collections.json');

if (!inputPath) {
  console.error('Uso: node scripts/sync-map-collections.js <html-da-wiki> [saida.json]');
  process.exit(1);
}

const html = fs.readFileSync(inputPath, 'utf8');

function decode(value = '') {
  const named = {
    amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
    mdash: '—', ndash: '–', times: '×', aacute: 'á', Aacute: 'Á',
    eacute: 'é', Eacute: 'É', iacute: 'í', Iacute: 'Í', oacute: 'ó',
    Oacute: 'Ó', uacute: 'ú', Uacute: 'Ú', atilde: 'ã', Atilde: 'Ã',
    otilde: 'õ', Otilde: 'Õ', ccedil: 'ç', Ccedil: 'Ç', ecirc: 'ê',
    Ecirc: 'Ê', ocirc: 'ô', Ocirc: 'Ô'
  };
  const decoded = value
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(
      code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)
    ))
    .replace(/&([a-z]+);/gi, (match, name) => named[name] ?? match)
    .replace(/<[^>]+>/g, '')
    .trim();
  return /[ÃÂâ]/.test(decoded) ? Buffer.from(decoded, 'latin1').toString('utf8') : decoded;
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const cityMatches = [...html.matchAll(/<div class="cm-city"[^>]*>([^<]+)<span class="cm-city-n">(\d+) mapas?<\/span><\/div>/g)];
const collections = [];

cityMatches.forEach((cityMatch, cityIndex) => {
  const city = decode(cityMatch[1]);
  const start = cityMatch.index + cityMatch[0].length;
  const end = cityMatches[cityIndex + 1]?.index ?? html.length;
  const cityHtml = html.slice(start, end);
  const columns = [...cityHtml.matchAll(/<div class="cm-col">([\s\S]*?)<\/div><\/div>/g)];

  columns.forEach((columnMatch, mapIndex) => {
    const block = columnMatch[1];
    const name = decode(block.match(/<span class="cm-col-name">([\s\S]*?)<\/span>/)?.[1]);
    const bonus = decode(block.match(/<div class="cm-bonus">([\s\S]*?)<\/div>/)?.[1]);
    const mapImage = block.match(/<div class="cm-mm">[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/)?.[1] || '';
    const sourceId = mapImage.match(/ColMapa_mm_([^/.]+)\.png/i)?.[1];
    const itemBlock = block.match(/<div class="cm-cards">([\s\S]*)/)?.[1] || '';
    const items = [...itemBlock.matchAll(/<span class="cm-it" data-tip="([^"]*)">\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"[^>]*>(?:<span class="cm-qty">([^<]+)<\/span>)?<\/span>/g)].map(itemMatch => {
      const tip = decode(itemMatch[1]);
      const image = itemMatch[2] || '';
      const nameFromImage = decode(itemMatch[3]);
      const qtyText = decode(itemMatch[4] || '×1');
      const quantity = Number(qtyText.replace(/\D/g, '')) || 1;
      const tipLines = tip.split('\n').map(line => line.trim()).filter(Boolean);
      return { name: nameFromImage || tipLines[0], quantity, image, sources: tipLines.slice(1) };
    });

    if (!name || !bonus || !items.length) return;
    collections.push({
      id: sourceId || `${slugify(city)}-${slugify(name)}-${mapIndex + 1}`,
      city,
      name,
      bonus,
      mapImage,
      items
    });
  });
});

const result = {
  source: 'https://wiki.aureumro.com/wiki/Cole%C3%A7%C3%A3o_de_Mapa',
  syncedAt: new Date().toISOString(),
  cities: [...new Set(collections.map(entry => entry.city))],
  collections
};

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`${collections.length} coleções de ${result.cities.length} cidades gravadas em ${outputPath}`);
