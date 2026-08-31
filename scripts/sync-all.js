'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const withSprites = process.argv.includes('--with-sprites') || process.argv.includes('--sprites');
const noGit = process.argv.includes('--no-git') || process.argv.includes('--no-push');

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

function handleGitSync() {
  if (noGit) {
    console.log(`${colors.gray}[Git] Envio para o GitHub desativado via flag (--no-git).${colors.reset}\n`);
    return;
  }

  console.log(`${colors.cyan}${colors.bright}[Git] Verificando e enviando atualizações para o GitHub...${colors.reset}`);

  const filesToStage = [
    'wiki-patchnotes.json',
    'wiki-overrides.json',
    'wiki-sync-report.json',
    'price-history.json',
    'economy-snapshot.json',
    'data-history.json',
    'almas-sprites.json'
  ];

  spawnSync('git', ['add', ...filesToStage], { cwd: ROOT, stdio: 'inherit' });

  const diffCached = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT, encoding: 'utf8' });
  const stagedFiles = (diffCached.stdout || '').trim().split('\n').filter(Boolean);

  if (stagedFiles.length > 0) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const commitMsg = `chore(sync): automated wiki & economy data sync [${dateStr}]`;

    console.log(`${colors.gray}    Criando commit: "${commitMsg}" (${stagedFiles.length} arquivo(s))${colors.reset}`);
    const commitRes = spawnSync('git', ['commit', '-m', commitMsg], { cwd: ROOT, stdio: 'inherit' });

    if (commitRes.status === 0) {
      console.log(`${colors.gray}    Enviando para origin/main (git push)...${colors.reset}`);
      const pushRes = spawnSync('git', ['push', 'origin', 'main'], { cwd: ROOT, stdio: 'inherit' });
      if (pushRes.status === 0) {
        console.log(`${colors.green}✓ Commit e Push realizados com sucesso no GitHub!${colors.reset}\n`);
      } else {
        console.warn(`${colors.gold}⚠️ Aviso: Falha ao executar git push (verifique conexão ou permissões).${colors.reset}\n`);
      }
    } else {
      console.warn(`${colors.gold}⚠️ Aviso: Falha ao criar o commit.${colors.reset}\n`);
    }
  } else {
    // Checa se há commits locais pendentes de envio
    const unpushed = spawnSync('git', ['log', 'origin/main..HEAD', '--oneline'], { cwd: ROOT, encoding: 'utf8' });
    if ((unpushed.stdout || '').trim()) {
      console.log(`${colors.gray}    Enviando commits locais pendentes (git push)...${colors.reset}`);
      const pushRes = spawnSync('git', ['push', 'origin', 'main'], { cwd: ROOT, stdio: 'inherit' });
      if (pushRes.status === 0) {
        console.log(`${colors.green}✓ Commits pendentes enviados para o GitHub!${colors.reset}\n`);
      } else {
        console.warn(`${colors.gold}⚠️ Aviso: Falha ao executar git push.${colors.reset}\n`);
      }
    } else {
      console.log(`${colors.green}✓ Nenhuma alteração pendente. Repositório já está 100% atualizado com o GitHub.${colors.reset}\n`);
    }
  }
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

  // Executa o commit e push das alterações
  handleGitSync();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`${colors.gold}${colors.bright}${hr('═', 64)}${colors.reset}`);
  console.log(`${colors.green}${colors.bright}✨ Todas as ${successCount} etapas foram sincronizadas, auditadas e enviadas ao GitHub!${colors.reset}`);
  console.log(`${colors.gray}Tempo total decorrido: ${durationSec}s${colors.reset}`);
  if (!withSprites) {
    console.log(`${colors.dim}Dica: Para incluir o download/verificação de todas as imagens de almas, use a flag --with-sprites.${colors.reset}`);
  }
  console.log(`${colors.gold}${colors.bright}${hr('═', 64)}${colors.reset}\n`);
}

run();
