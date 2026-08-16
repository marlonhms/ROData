'use strict';

const assert = require('assert');
const db = require('../db.json');
const effectsEngine = require('../character-effects.js');

const souls = db.items.filter(item => Number(item.id) >= 2000000);
const context = { stats:{ str:100, agi:100, vit:100, int:100, dex:100, luk:100 } };
const results = souls.map(soul => ({ soul, effects:effectsEngine.parseSoulEffects(soul, context) }));
const calculated = results.filter(entry => entry.effects.labels.length > 0);
const conditional = results.filter(entry => entry.effects.conditional.length > 0);
const statuses = results.reduce((counts, entry) => {
  counts[entry.effects.coverage.status] = (counts[entry.effects.coverage.status] || 0) + 1;
  return counts;
}, {});

assert.ok(souls.length >= 400, `Catálogo de Almas incompleto: ${souls.length}.`);
assert.ok(calculated.length >= 300, `Cobertura calculável abaixo do esperado: ${calculated.length}/${souls.length}.`);

results.forEach(({ soul, effects }) => {
  effectsEngine.NUMERIC_KEYS.forEach(key => assert.ok(Number.isFinite(Number(effects[key])), `${soul.nome}: ${key} inválido.`));
  Object.entries(effects.targets || {}).forEach(([bucket, values]) => Object.entries(values).forEach(([target, value]) => {
    assert.ok(Number.isFinite(Number(value)), `${soul.nome}: ${bucket}.${target} inválido.`);
  }));
});

const byId = id => results.find(entry => entry.soul.id === id)?.effects;
assert.equal(byId(2000006)?.hpPct, 5, 'Alma de Aliot deve conceder HP +5%.');
assert.equal(byId(2000006)?.spPct, 5, 'Alma de Aliot deve conceder SP +5%.');
assert.equal(byId(2000021)?.targets.raceDamage.Anjo, 5, 'Alma de Anubis deve conceder dano contra Anjo +5%.');
assert.equal(byId(2000450)?.atq, 50, 'Alma de Atroce deve ativar ATQ +50 com FOR 100.');

console.log(`OK · ${souls.length} Almas auditadas · ${calculated.length} com bônus calculáveis · ${conditional.length} com condições informativas · ${JSON.stringify(statuses)}`);
