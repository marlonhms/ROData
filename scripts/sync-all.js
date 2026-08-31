'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const withSprites = process.argv.includes('--with-sprites') || process.argv.includes('--sprites');

const STEPS = [
  {
    name: 'Patch Notes & Mudanças Recentes',
    script: 'scripts/wiki-patchnotes-sync.js',
    args: []
  },
  {
    name: 'Preços de Economia (Wiki Overrides)',
    script: 'scripts/wiki-sync.js',
    args: ['--apply']
  },
  {
    name: 'Histórico de Preços por Revisão',
    script: 'scripts/wiki-price-history-sync.js',
    args: []
  },
  {
    name: 'Snapshot Econômico & Métricas de Mercado',
    script: 'scripts/build-economy-snapshot.js',
    args: []
  },
  {
    name: 'Auditoria do Snapshot Econômico',
    script: 'scripts/audit-economy-snapshot.js',
    args: []
  },
  {
    name: 'Auditoria do Histórico de Preços',
    script: 'scripts/audit-price-history.js',
    args: []
  }
];

if (withSprites) {
  STEPS.push({
    name: 'Download e Mapeamento de Imagens de Almas',
    script: 'scripts/fetch-soul-sprites.js',
    args: []
  });
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  gold: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function hr(char = '═', len = 60) {
  return char.repeat(len);
}

async function run() {
  console.log(`\n${colors.gold}${colors.bright}${hr('═', 64)}${colors.reset}`);
  console.log(`${colors.gold}${colors.bright}   AureumRO · Sincronização Unificada em Fila${colors.reset}`);
  console.log(`${colors.gold}${colors.bright}${hr('═', 64)}${colors.reset}\n`);

  const startTime = Date.now();
  let successCount = 0;

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    const num = `[${i + 1}/${STEPS.length}]`;
    console.log(`${colors.cyan}${colors.bright}${num} ${step.name}${colors.reset}`);
    console.log(`${colors.gray}    Executando: node ${step.script} ${step.args.join(' ')}${colors.reset}`);

    const result = spawnSync(process.execPath, [path.join(ROOT, step.script), ...step.args], {
      cwd: ROOT,
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error(`\n${colors.red}${colors.bright}❌ ERRO na etapa: ${step.name} (código ${result.status})${colors.reset}\n`);
      process.exitCode = result.status || 1;
      return;
    }

    successCount++;
    console.log(`${colors.green}✓ Concluído com sucesso.${colors.reset}\n`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`${colors.gold}${colors.bright}${hr('═', 64)}${colors.reset}`);
  console.log(`${colors.green}${colors.bright}✨ Todas as ${successCount} etapas foram sincronizadas e auditadas com sucesso!${colors.reset}`);
  console.log(`${colors.gray}Tempo total decorrido: ${durationSec}s${colors.reset}`);
  if (!withSprites) {
    console.log(`${colors.dim}Dica: Para incluir o download/verificação de todas as imagens de almas, use a flag --with-sprites.${colors.reset}`);
  }
  console.log(`${colors.gold}${colors.bright}${hr('═', 64)}${colors.reset}\n`);
}

run();
