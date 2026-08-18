'use strict';

const assert = require('assert');
const { parseItemEffects, parseSoulEffects } = require('../character-effects.js');

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

result = parseSoulEffects({ nome:'Alma de Aliot', descricao:'Efeito: HP Maximo +5%, SP Maximo +5%. • So 1 efeito de cada alma por personagem.' });
assert.equal(result.hpPct, 5);
assert.equal(result.spPct, 5);

result = parseSoulEffects({ nome:'Alma de Acidus', descricao:'Efeito: Dano da propriedade Sagrado +5%, Def. Sagrado +5%, Def. Sombrio -10%. • So 1 efeito de cada alma por personagem.' });
assert.equal(result.targets.attackElementDamage.Sagrado, 5);
assert.equal(result.targets.elementResistance.Sagrado, 5);
assert.equal(result.targets.elementResistance.Sombrio, -10);

result = parseSoulEffects({ nome:'Alma de Anubis', descricao:'Efeito: Dano causado em monstros da raça Anjo +5% (físico e mágico). • So 1 efeito de cada alma por personagem.' });
assert.equal(result.targets.raceDamage.Anjo, 5);

result = parseSoulEffects({ nome:'Alma de Atroce', descricao:'Efeito: Se FOR>=95: Ataque +50. • So 1 efeito de cada alma por personagem.' }, { stats:{ str:90 } });
assert.equal(result.atq, 0);
assert.equal(result.coverage.status, 'incomplete');
result = parseSoulEffects({ nome:'Alma de Atroce', descricao:'Efeito: Se FOR>=95: Ataque +50. • So 1 efeito de cada alma por personagem.' }, { stats:{ str:95 } });
assert.equal(result.atq, 50);

result = parseSoulEffects({ nome:'Alma de Antique Firelock', descricao:'Efeito: A cada 2 refinos do equipamento: +1% de dano à distância. • So 1 efeito de cada alma por personagem.' });
assert.equal(result.rangedDamagePct, 0, 'bônus por refino não pode ser aplicado sem o refino da peça');
assert.ok(result.conditional.length > 0);

result = parse('Defesa Verdadeira +50. True DEF +25.');
assert.equal(result.trueDef, 75, 'Defesa Verdadeira deve ser acumulada corretamente');

console.log('OK · 16 cenários do motor de efeitos, Almas e Defesa Verdadeira validados.');


