(function initAureumEffects(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.AureumEffects = api;
  if (root) root.AureumEffects = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAureumEffects() {
  'use strict';

  const NUMERIC_KEYS = [
    'str','agi','vit','int','dex','luk','atq','matq','def','mdef','hit','flee','hp','sp','aspd','aspdPct',
    'damagePct','magicDamagePct','rangedDamagePct','critDamagePct','dropRate','moveSpeed','crit','critPct','perfectDodge','hpKill','spKill',
    'hpPct','spPct','castReduction','postCastReduction','spCostReduction'
  ];
  const RACES = ['Amorfo','Anjo','Bruto','Demônio','Dragão','Humano','Humanoide','Inseto','Morto-Vivo','Peixe','Planta'];
  const ELEMENTS = ['Neutro','Água','Fogo','Terra','Vento','Veneno','Sagrado','Sombrio','Fantasma','Maldito'];
  const SIZES = ['Pequeno','Médio','Grande'];

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9%+\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function makeEffects() {
    const result = Object.fromEntries(NUMERIC_KEYS.map(key => [key, 0]));
    result.targets = { raceDamage:{}, elementDamage:{}, sizeDamage:{}, raceResistance:{}, elementResistance:{}, sizeResistance:{}, ignoreDef:{} };
    result.labels = [];
    result.conditional = [];
    result.unresolved = [];
    result.coverage = { status:'informational', recognized:0, mechanical:0, unresolved:0 };
    return result;
  }

  function addLabel(result, label) {
    if (label && !result.labels.includes(label)) result.labels.push(label);
  }

  function addNumeric(result, key, value, label, suffix = '') {
    const amount = Number(value) || 0;
    if (!amount) return false;
    result[key] += amount;
    addLabel(result, `${label} ${amount > 0 ? '+' : ''}${amount}${suffix}`);
    return true;
  }

  function canonicalMatches(text, values) {
    const normalized = normalize(text);
    return values.filter(value => {
      const target = normalize(value);
      if (target === 'humano' && normalized.includes('humanoide')) return false;
      return normalized.includes(target);
    });
  }

  function addTargets(result, bucket, targets, amount, label) {
    if (!targets.length || !amount) return false;
    targets.forEach(target => { result.targets[bucket][target] = (result.targets[bucket][target] || 0) + amount; });
    addLabel(result, `${label} ${targets.join('/')} +${amount}%`);
    return true;
  }

  function extractSigned(text, pattern) {
    const values = [];
    let match;
    while ((match = pattern.exec(text))) values.push(Number(String(match[1]).replace(/\s/g, '')) || 0);
    return values.reduce((sum, value) => sum + value, 0);
  }

  function parseClause(result, clause) {
    const raw = clause.replace(/[_—–-]{3,}/g, ' ').replace(/\s+/g, ' ').trim();
    if (!raw) return false;
    const text = normalize(raw);
    const metadata = /^(classe|tipo|peso|nivel da arma|nivel necessario|profissoes|classes|preco|forca de ataque|nivel de ataque|defesa):?/i;
    if (metadata.test(text)) return false;

    let matched = false;
    const flatRules = [
      ['str', /(?:\bFOR\b|Força)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'FOR'],
      ['agi', /\bAGI\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'AGI'],
      ['vit', /\bVIT\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'VIT'],
      ['int', /\bINT\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'INT'],
      ['dex', /(?:\bDES\b|\bDEX\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'DES'],
      ['luk', /(?:\bSOR\b|\bLUK\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'SOR'],
      ['matq', /(?:\bATQM\b|\bMATK\b|Ataque Mágico)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'ATQM'],
      ['mdef', /(?:\bMDEF\b|\bDEFM\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'MDEF'],
      ['atq', /(?:\bATQ\b|(?<!Velocidade de )\bAtaque\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'ATQ'],
      ['hit', /(?:Precisão|\bHIT\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'HIT'],
      ['perfectDodge', /Esquiva Perfeita\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'Esquiva perfeita'],
      ['flee', /(?:Taxa de Esquiva|Esquiva(?! Perfeita)|\bFLEE\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'FLEE'],
      ['crit', /(?:Taxa de (?:Ataques )?Críticos?|Críticos?|\bCRIT\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'CRIT'],
      ['hp', /(?:Máx\.?\s*HP|HP máximo|HP\s+máx\.?|\bHP\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'HP'],
      ['sp', /(?:Máx\.?\s*SP|SP máximo|SP\s+máx\.?|\bSP\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'SP'],
      ['aspd', /\bASPD\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'ASPD']
    ];
    flatRules.forEach(([key, regex, label]) => {
      const total = extractSigned(raw, regex);
      if (addNumeric(result, key, total, label)) matched = true;
    });

    const allStats = raw.match(/Todos os atributos\s*([+-]\s*\d+)(?!\s*%)/i);
    if (allStats) {
      const value = Number(allStats[1].replace(/\s/g, '')) || 0;
      ['str','agi','vit','int','dex','luk'].forEach(key => { result[key] += value; });
      addLabel(result, `Todos os atributos ${value > 0 ? '+' : ''}${value}`);
      matched = true;
    }

    const percentRules = [
      ['hpPct', /(?:Máx\.?\s*HP|HP máximo|HP\s+máx\.?|\bHP\b)\s*\+\s*(\d+)%/i, 'HP'],
      ['spPct', /(?:Máx\.?\s*SP|SP máximo|SP\s+máx\.?|\bSP\b)\s*\+\s*(\d+)%/i, 'SP'],
      ['aspdPct', /(?:Velocidade de ataque|Vel\. de ATQ|ASPD)\s*\+\s*(\d+)%/i, 'Velocidade de ataque'],
      ['magicDamagePct', /Dano mágico(?: causado)?\s*\+\s*(\d+)%/i, 'Dano mágico'],
      ['rangedDamagePct', /Dano (?:físico )?(?:a distância|de longa distância)\s*\+\s*(\d+)%/i, 'Dano à distância'],
      ['critDamagePct', /Dano crítico\s*\+\s*(\d+)%/i, 'Dano crítico'],
      ['critPct', /(?:Taxa de (?:Ataques )?Críticos?|Críticos?)\s*\+\s*(\d+)%/i, 'Taxa de crítico'],
      ['damagePct', /Dano físico(?: causado)?\s*\+\s*(\d+)%/i, 'Dano físico'],
      ['damagePct', /\bATQ\b\s*\+\s*(\d+)%/i, 'Dano'],
      ['dropRate', /(?:taxa|chance) de drop\s*\+\s*(\d+)%/i, 'Drop'],
      ['moveSpeed', /(?:velocidade de movimento|movimento)\s*\+\s*(\d+)%/i, 'Movimento'],
      ['castReduction', /(?:conjuração variável|tempo de conjuração)\s*-\s*(\d+)%/i, 'Conjuração'],
      ['postCastReduction', /pós-conjuração\s*-\s*(\d+)%/i, 'Pós-conjuração'],
      ['spCostReduction', /(?:consumo|custo) de SP\s*-\s*(\d+)%/i, 'Consumo de SP']
    ];
    percentRules.forEach(([key, regex, label]) => {
      const match = raw.match(regex);
      if (match && addNumeric(result, key, Number(match[1]), label, '%')) matched = true;
    });

    const targetAmountMatch = raw.match(/(?:dano (?:físico )?contra[^+]*\+\s*|dano adicional de\s*|(?:aumenta|causa)(?: em)?\s*)(\d+)%/i)
      || raw.match(/(\d+)%\s+de dano adicional/i);
    const amount = Number(targetAmountMatch?.[1]) || 0;
    if (amount) {
      const races = canonicalMatches(raw, RACES);
      const elements = canonicalMatches(raw, ELEMENTS);
      const sizes = canonicalMatches(raw, SIZES);
      if (addTargets(result, 'raceDamage', races, amount, 'Dano vs raça')) matched = true;
      else if (addTargets(result, 'elementDamage', elements, amount, 'Dano vs elemento')) matched = true;
      else if (addTargets(result, 'sizeDamage', sizes, amount, 'Dano vs tamanho')) matched = true;
      else if (/MVP|chefe/i.test(raw)) { result.targets.raceDamage.MVP = (result.targets.raceDamage.MVP || 0) + amount; addLabel(result, `Dano vs MVP +${amount}%`); matched = true; }
      else if (/dano adicional|aumenta.*dano|causa.*dano/i.test(raw) && !/recebe|sofrido/i.test(raw)) matched = addNumeric(result, 'damagePct', amount, 'Dano', '%') || matched;
    }

    const resistanceMatch = raw.match(/resistência[^+]*\+\s*(\d+)%/i) || raw.match(/(\d+)%\s+de resistência/i) || raw.match(/(?:reduz|resistência).*?(\d+)%.*?(?:dano|ataques?)/i) || raw.match(/(?:dano|ataques?).*?reduzido.*?(\d+)%/i);
    if (resistanceMatch) {
      const resistance = Number(resistanceMatch[1]) || 0;
      const races = canonicalMatches(raw, RACES);
      const elements = canonicalMatches(raw, ELEMENTS);
      const sizes = canonicalMatches(raw, SIZES);
      if (addTargets(result, 'raceResistance', races, resistance, 'Resistência a raça')) matched = true;
      else if (addTargets(result, 'elementResistance', elements, resistance, 'Resistência a elemento')) matched = true;
      else if (addTargets(result, 'sizeResistance', sizes, resistance, 'Resistência a tamanho')) matched = true;
    }

    const ignoreMatch = raw.match(/Ignora\s+(\d+)%\s+da DEF/i);
    if (ignoreMatch) {
      const ignore = Number(ignoreMatch[1]) || 0;
      const races = canonicalMatches(raw, RACES);
      const targets = races.length ? races : ['Todos'];
      targets.forEach(target => { result.targets.ignoreDef[target] = (result.targets.ignoreDef[target] || 0) + ignore; });
      addLabel(result, `Ignora DEF ${targets.join('/')} +${ignore}%`);
      matched = true;
    }

    const recovery = raw.match(/Recupera\s+(\d+)\s+de\s+(HP|SP)\s+ao (?:derrotar|eliminar|matar)/i);
    if (recovery) matched = addNumeric(result, recovery[2].toUpperCase() === 'HP' ? 'hpKill' : 'spKill', Number(recovery[1]), `Recuperação de ${recovery[2].toUpperCase()} por abate`) || matched;
    return matched;
  }

  function parseItemEffects(item) {
    const result = makeEffects();
    const description = String(item?.descricao || '');
    const clauses = description.split(/\s*•\s*|\n+/).map(value => value.trim()).filter(Boolean);
    const mechanicHint = /(?:[+-]\s*\d|\d+\s*%|\d+\s+(?:de\s+)?(?:HP|SP)|ignora\s+\d+)/i;
    let pendingCondition = '';

    if (Number(item?.def) > 0) { result.def += Number(item.def); addLabel(result, `DEF base +${Number(item.def)}`); result.coverage.recognized += 1; }
    if (Number(item?.atq) > 0) {
      if (item?.tipo !== 'Arma') result.atq += Number(item.atq);
      addLabel(result, `ATQ base ${Number(item.atq)}`);
      result.coverage.recognized += 1;
    }

    clauses.forEach(clause => {
      const mechanical = mechanicHint.test(clause);
      if (!mechanical) { pendingCondition = ''; return; }
      result.coverage.mechanical += 1;
      const conditional = pendingCondition || /(?:se refinad|refino\s*[+-]|a cada refino|ao realizar|ao receber|quando|chance de|autoconjurar|por \d+ segundos|nv\.?\s*\d)/i.test(clause);
      if (conditional) {
        if (/[:：]\s*$/.test(clause)) pendingCondition = clause;
        else {
          result.conditional.push(`${pendingCondition ? `${pendingCondition} ` : ''}${clause}`.trim());
          pendingCondition = '';
        }
        return;
      }
      const matched = parseClause(result, clause);
      if (matched) result.coverage.recognized += 1;
      else result.unresolved.push(clause);
      pendingCondition = /:\s*$/.test(clause) ? clause : '';
    });

    result.coverage.unresolved = result.unresolved.length + result.conditional.length;
    if (!result.coverage.mechanical && !result.coverage.recognized) result.coverage.status = 'informational';
    else if (result.coverage.unresolved && result.coverage.recognized) result.coverage.status = 'partial';
    else if (result.coverage.unresolved) result.coverage.status = 'incomplete';
    else result.coverage.status = 'complete';
    return result;
  }

  function auditItems(items) {
    const entries = (items || []).map(item => ({ item, effects:parseItemEffects(item) }));
    const counts = { complete:0, partial:0, incomplete:0, informational:0 };
    entries.forEach(entry => { counts[entry.effects.coverage.status] += 1; });
    const relevant = counts.complete + counts.partial + counts.incomplete;
    const covered = counts.complete + counts.partial;
    return { entries, counts, percent:relevant ? Math.round(covered / relevant * 100) : 100 };
  }

  return { NUMERIC_KEYS, RACES, ELEMENTS, SIZES, normalize, parseItemEffects, auditItems };
});
