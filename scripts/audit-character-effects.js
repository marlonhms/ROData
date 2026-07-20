'use strict';

const path = require('path');
const db = require(path.join(__dirname, '..', 'db.json'));
const { auditItems } = require(path.join(__dirname, '..', 'character-effects.js'));

const relevantTypes = new Set(['Arma', 'Equipamento', 'Carta']);
const items = (db.items || []).filter(item => relevantTypes.has(item.tipo));
const report = auditItems(items);
const review = report.entries
  .filter(entry => ['partial', 'incomplete'].includes(entry.effects.coverage.status))
  .sort((a, b) => b.effects.coverage.unresolved - a.effects.coverage.unresolved)
  .slice(0, 25);

console.log('AureumRO · Cobertura de efeitos');
console.log(`Itens auditados: ${items.length}`);
console.log(`Cobertura útil: ${report.percent}%`);
console.log(`Completos: ${report.counts.complete} · Parciais: ${report.counts.partial} · Incompletos: ${report.counts.incomplete} · Informativos: ${report.counts.informational}`);
console.log('\nPrioridade de revisão:');
review.forEach(entry => {
  const details = [...entry.effects.unresolved, ...entry.effects.conditional].slice(0, 2).join(' | ');
  console.log(`#${entry.item.id} ${entry.item.nome}: ${details}`);
});

