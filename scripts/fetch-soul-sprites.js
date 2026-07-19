const fs = require('fs');
const path = require('path');
const https = require('https');

const WIKI_URL = 'https://wiki.aureumro.com/api.php?action=parse&page=Almas&prop=text&format=json&origin=*';
const OUTPUT_DIR = path.join(__dirname, '../assets/sprites/almas');
const JSON_OUTPUT = path.join(__dirname, '../almas-sprites.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Buscando HTML da página de Almas da Wiki...');

https.get(WIKI_URL, { headers: { 'User-Agent': 'AureumRO-Asset-Fetcher/1.0' } }, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const html = data?.parse?.text?.['*'] || '';

      // Match all img src containing Almas_ico_<id>.png or other Almas images
      const icoRegex = /src="([^"]*Almas_ico_(\d+)\.png[^"]*)"/gi;
      const bannerRegex = /src="([^"]*Almas_(rar_[a-z]+|botao)\.png[^"]*)"/gi;

      const downloads = [];
      const mapping = {};
      let match;

      while ((match = icoRegex.exec(html)) !== null) {
        const fullUrl = match[1].startsWith('http') ? match[1] : `https://wiki.aureumro.com${match[1]}`;
        const itemId = match[2];
        const fileName = `${itemId}.png`;
        mapping[itemId] = `assets/sprites/almas/${fileName}`;
        downloads.push({ url: fullUrl, fileName, id: itemId });
      }

      while ((match = bannerRegex.exec(html)) !== null) {
        const fullUrl = match[1].startsWith('http') ? match[1] : `https://wiki.aureumro.com${match[1]}`;
        const key = match[2]; // e.g. rar_normal, rar_mini, rar_mvp, botao
        const fileName = `Almas_${key}.png`;
        mapping[key] = `assets/sprites/almas/${fileName}`;
        downloads.push({ url: fullUrl, fileName, key });
      }

      console.log(`Encontrados ${downloads.length} arquivos de imagem de almas na wiki.`);

      fs.writeFileSync(JSON_OUTPUT, JSON.stringify(mapping, null, 2));
      console.log(`Mapeamento salvo em ${JSON_OUTPUT}`);

      let completed = 0;
      for (const item of downloads) {
        const destPath = path.join(OUTPUT_DIR, item.fileName);
        await new Promise((resolve) => {
          https.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
            const stream = fs.createWriteStream(destPath);
            imgRes.pipe(stream);
            stream.on('finish', () => {
              stream.close();
              completed++;
              resolve();
            });
          }).on('error', (err) => {
            console.error(`Erro ao baixar ${item.fileName}: ${err.message}`);
            resolve();
          });
        });
      }

      console.log(`Download concluído! Total de ${completed} imagens salvas em assets/sprites/almas/`);
    } catch (e) {
      console.error('Erro ao processar:', e);
    }
  });
}).on('error', (err) => {
  console.error('Erro na requisição HTTPS:', err);
});
