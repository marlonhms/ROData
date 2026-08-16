'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const history = JSON.parse(fs.readFileSync(path.join(ROOT, 'price-history.json'), 'utf8'));
const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, 'wiki-overrides.json'), 'utf8'));
const approvals = JSON.parse(fs.readFileSync(path.join(ROOT, 'wiki-price-approvals.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'wiki-sync-report.json'), 'utf8'));
const failures = [];
const records = Object.values(history.items || {});

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(Number(history.meta?.revisionCount) > 0, 'Nenhuma revisão registrada.');
check(Number(history.meta?.currentMismatches) === 0, 'O snapshot informa divergências com os overrides atuais.');
check(records.length === Number(history.meta?.itemCount), 'Contagem de itens inconsistente.');
check((report.entries || []).every(entry => !['conflict', 'unmatched'].includes(entry.status)), 'O relatório ainda possui conflitos ou itens sem correspondência.');
check(Number(report.summary?.approved_manual) === approvals.approvals.length, 'A quantidade de aprovações no relatório difere do registro manual.');

for (const approval of approvals.approvals) {
  const reportEntry = (report.entries || []).find(entry => entry.wiki_name === approval.wikiName);
  check(reportEntry?.status === 'approved_manual', `${approval.wikiName}: aprovação não refletida no relatório.`);
  for (const itemId of approval.itemIds || []) {
    check(Boolean(overrides.items?.[itemId]), `${approval.wikiName}: item #${itemId} não possui override ativo.`);
    check(Boolean(history.items?.[itemId]?.approval), `${approval.wikiName}: item #${itemId} não possui carimbo de aprovação no histórico.`);
  }
}

for (const record of records) {
  check(record.points.length >= 2, `${record.name} (#${record.itemId}) possui menos de dois pontos.`);
  for (let index = 0; index < record.points.length; index += 1) {
    const point = record.points[index];
    check(Number.isFinite(Number(point.value)) && Number(point.value) >= 0, `${record.name}: valor inválido no ponto ${index}.`);
    if (index > 0) {
      const previous = record.points[index - 1];
      check(new Date(point.timestamp) >= new Date(previous.timestamp), `${record.name}: datas fora de ordem.`);
      check(Number(point.value) !== Number(previous.value), `${record.name}: pontos consecutivos duplicados.`);
    }
  }
  const override = overrides.items?.[record.itemId];
  if (override) {
    const latest = record.points[record.points.length - 1];
    check(Number(latest.value) === Number(override.preco_venda), `${record.name}: gráfico termina em ${latest.value}, override usa ${override.preco_venda}.`);
  }
}

if (failures.length) {
  console.error(`Auditoria reprovada: ${failures.length} problema(s).`);
  failures.slice(0, 30).forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Auditoria aprovada: ${records.length} itens históricos, ${history.meta.appliedItemCount} ativos, ${approvals.approvals.length} aprovações manuais, ${history.meta.totalPoints} pontos, ${history.meta.revisionCount} revisões e 0 divergências atuais.`);
}
