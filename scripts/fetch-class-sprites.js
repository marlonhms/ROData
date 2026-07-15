const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://nn.ai4rei.net/dev/npclist/?q=type%3Ajob';
const BASE_IMG_URL = 'https://nn.ai4rei.net/dev/npclist/';
const OUTPUT_DIR = path.join(__dirname, '../assets/sprites/classes');
const JSON_OUTPUT = path.join(__dirname, '../class-sprites.json');

// Criar diretórios se não existirem
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Baixando a página de sprites...');

https.get(TARGET_URL, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
        console.log('Página baixada. Analisando as classes...');
        
        // Regex para capturar a imagem e o ID da classe
        // Exemplo de trecho: <img loading="lazy" src="i/KNIGHT.gif" ... ><br>KNIGHT...<br>ID: 7 (0x7)
        const regex = /<img[^>]+src="(i\/([^"]+\.gif))"[^>]*>.*?ID:\s*(\d+)/gs;
        
        const spritesMap = {};
        let match;
        let downloadQueue = [];

        while ((match = regex.exec(html)) !== null) {
            const imgPath = match[1]; // ex: i/KNIGHT.gif
            const fileName = match[2]; // ex: KNIGHT.gif
            const classId = parseInt(match[3], 10); // ex: 7

            const fullUrl = BASE_IMG_URL + imgPath;
            spritesMap[classId] = `assets/sprites/classes/${fileName}`;
            downloadQueue.push({ url: fullUrl, fileName: fileName });
        }

        console.log(`Encontrados ${downloadQueue.length} sprites de classes para baixar.`);

        // Salva o JSON de mapeamento
        fs.writeFileSync(JSON_OUTPUT, JSON.stringify(spritesMap, null, 2));
        console.log(`Mapeamento salvo em ${JSON_OUTPUT}`);

        // Função para baixar as imagens sequencialmente (para não sobrecarregar o servidor deles)
        let downloadedCount = 0;
        const downloadNext = () => {
            if (downloadQueue.length === 0) {
                console.log(`\nTodos os ${downloadedCount} sprites foram baixados com sucesso!`);
                return;
            }

            const item = downloadQueue.shift();
            const filePath = path.join(OUTPUT_DIR, item.fileName);

            const urlObj = new URL(item.url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://nn.ai4rei.net/dev/npclist/'
                }
            };

            https.get(options, (imgRes) => {
                const fileStream = fs.createWriteStream(filePath);
                imgRes.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    downloadedCount++;
                    process.stdout.write(`\rBaixando... ${downloadedCount} imagens concluídas.`);
                    downloadNext(); // Chama o próximo
                });
            }).on('error', (err) => {
                console.error(`\nErro ao baixar ${item.fileName}: ${err.message}`);
                downloadNext(); // Tenta o próximo em caso de erro
            });
        };

        // Inicia os downloads
        downloadNext();
    });
}).on('error', (err) => {
    console.error('Erro ao acessar a página:', err.message);
});
