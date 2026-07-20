'use strict';

const assert = require('assert');
const { parseItemEffects } = require('../character-effects.js');

function parse(descricao, extra = {}) {
  return parseItemEffects({ nome:'Teste', tipo:'Carta', descricao, ...extra });
}

let result = parse('FOR +3. INT +2. DES -1.');
assert.equal(result.str, 3);
assert.equal(result.int, 2);
assert.equal(result.dex, -1);

result = parse('ATQ +10%. Dano físico +15%.');
assert.equal(result.atq, 0, 'percentual de ATQ não pode virar ATQ fixo');
assert.equal(result.damagePct, 25);

result = parse('Dano físico contra a raça Dragão +20%.');
assert.equal(result.targets.raceDamage.Dragão, 20);
assert.equal(result.damagePct, 0, 'dano por raça não pode virar dano global');

result = parse('Dano físico contra monstros de tamanho Grande +15%.');
assert.equal(result.targets.sizeDamage.Grande, 15);

result = parse('Reduz em 10% o dano recebido de monstros da raça Humanoide.');
assert.equal(result.targets.raceResistance.Humanoide, 10);

result = parse('Todos os atributos +2.');
['str','agi','vit','int','dex','luk'].forEach(key => assert.equal(result[key], 2));

result = parse('Se refinado em +9 ou mais: • ATQ +20.');
assert.equal(result.atq, 0, 'efeito condicionado ao refino não deve ser aplicado sem refino');
assert.equal(result.coverage.status, 'incomplete');
assert.ok(result.conditional.some(text => text.includes('ATQ +20')));

result = parse('Uma espada comum.', { tipo:'Arma', atq:120 });
assert.equal(result.atq, 0, 'ATQ base da arma é calculado separadamente');
assert.equal(result.coverage.status, 'complete');

result = parse('Armadura reforçada.', { tipo:'Equipamento', def:12 });
assert.equal(result.def, 12);
assert.equal(result.coverage.status, 'complete');

console.log('OK · 9 cenários do motor de efeitos validados.');

