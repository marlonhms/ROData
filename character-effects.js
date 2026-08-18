(function initAureumEffects(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.AureumEffects = api;
  if (root) root.AureumEffects = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAureumEffects() {
  'use strict';

  const NUMERIC_KEYS = [
    'str','agi','vit','int','dex','luk','atq','matq','matqPct','def','mdef','hit','flee','hp','sp','aspd','aspdPct',
    'damagePct','physicalDamagePct','magicDamagePct','rangedDamagePct','critDamagePct','dropRate','moveSpeed','crit','critPct','perfectDodge','hpKill','spKill',
    'hpPct','spPct','castReduction','postCastReduction','spCostReduction','hardDef','softDef','trueDef','hardMdef','softMdef','critResist',
    'rangedResistance','magicResistance','physicalResistance','bossResistance','normalResistance','expPct','fixedMagicReduction','fixedPhysicalReduction',
    'reflectMelee','reflectMagic','hpDrainPct','spDrainPct','cooldownReduction'
  ];
  const RACES = ['Amorfo','Anjo','Bruto','Demônio','Dragão','Humano','Humanoide','Inseto','Morto-Vivo','Peixe','Planta'];
  const ELEMENTS = ['Neutro','Água','Fogo','Terra','Vento','Veneno','Sagrado','Sombrio','Fantasma','Maldito'];
  const SIZES = ['Pequeno','Médio','Grande'];

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9%+\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function makeEffects() {
    const result = Object.fromEntries(NUMERIC_KEYS.map(key => [key, 0]));
    result.targets = {
      raceDamage:{}, elementDamage:{}, attackElementDamage:{}, sizeDamage:{}, skillDamage:{},
      raceResistance:{}, elementResistance:{}, sizeResistance:{}, raceExp:{}, ignoreDef:{}
    };
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
    const metadata = /^(classe|tipo|peso|nivel da arma|nivel necessario|profissoes|classes|preco|forca de ataque|nivel de ataque|defesa)\s*:/i;
    if (metadata.test(text)) return false;

    let matched = false;
    const flatRules = [
      ['str', /(?:\bFOR\b|\bSTR\b|Força)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'FOR'],
      ['agi', /\bAGI\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'AGI'],
      ['vit', /\bVIT\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'VIT'],
      ['int', /\bINT\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'INT'],
      ['dex', /(?:\bDES\b|\bDEX\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'DES'],
      ['luk', /(?:\bSOR\b|\bLUK\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'SOR'],
      ['matq', /(?:\bATQM\b|\bMATK\b|Ataque Mágico)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'ATQM'],
      ['mdef', /(?:\bMDEF\b|\bDEFM\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'MDEF'],
      ['atq', /(?:\bATQ\b|(?<!Velocidade de )\bAtaque\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'ATQ'],
      ['hit', /(?:Precisão|Acerto\s*(?:\(HIT\))?|\bHIT\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'HIT'],
      ['perfectDodge', /Esquiva Perfeita\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'Esquiva perfeita'],
      ['flee', /(?:Taxa de Esquiva|Esquiva(?! Perfeita)\s*(?:\(FLEE\))?|\bFLEE\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'FLEE'],
      ['crit', /(?:Taxa de (?:Ataques )?Críticos?|Críticos?|\bCRIT\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'CRIT'],
      ['hp', /(?:Máx\.?\s*HP|HP máx(?:imo)?|HP max(?:imo)?|HP\s+máx\.?|\bHP\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'HP'],
      ['sp', /(?:Máx\.?\s*SP|SP máx(?:imo)?|SP max(?:imo)?|SP\s+máx\.?|\bSP\b)\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'SP'],
      ['aspd', /\bASPD\b\s*([+-]\s*\d+)(?!\d|\s*%)/gi, 'ASPD'],
      ['trueDef', /(?:Defesa Verdadeira|True DEF)\s*([+-]?\s*\d+)(?!\d|\s*%)/gi, 'Defesa Verdadeira']
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
      ['hpPct', /(?:Máx\.?\s*HP|HP máx(?:imo)?|HP max(?:imo)?|HP\s+máx\.?|\bHP\b)\s*\+\s*(\d+)%/i, 'HP'],
      ['spPct', /(?:Máx\.?\s*SP|SP máx(?:imo)?|SP max(?:imo)?|SP\s+máx\.?|\bSP\b)\s*\+\s*(\d+)%/i, 'SP'],
      ['aspdPct', /(?:Velocidade de ataque(?:\s*\(ASPD\))?|Vel\. de ATQ|ASPD)\s*\+\s*(\d+)%/i, 'Velocidade de ataque'],
      ['magicDamagePct', /Dano mágico(?: causado)?\s*\+\s*(\d+)%/i, 'Dano mágico'],
      ['rangedDamagePct', /Dano (?:físico )?(?:(?:a|à) distância|de longa distância)\s*\+\s*(\d+)%/i, 'Dano à distância'],
      ['critDamagePct', /Dano crítico\s*\+\s*(\d+)%/i, 'Dano crítico'],
      ['critPct', /(?:Taxa de (?:Ataques )?Críticos?|Críticos?)\s*\+\s*(\d+)%/i, 'Taxa de crítico'],
      ['damagePct', /Dano físico(?: causado)?\s*\+\s*(\d+)%/i, 'Dano físico'],
      ['damagePct', /\bATQ\b\s*\+\s*(\d+)%/i, 'Dano'],
      ['dropRate', /(?:taxa|chance) de drop(?: de itens)?\s*\+\s*(\d+)%/i, 'Drop'],
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

  function soulEffectText(item) {
    return String(item?.descricao || '')
      .replace(/^.*?Efeito:\s*/i, '')
      .replace(/\s*•\s*S[oó]\s+1 efeito[\s\S]*$/i, '')
      .replace(/\s*•\s*$/g, '')
      .trim();
  }

  function addTargetValue(result, bucket, target, amount, label) {
    const value = Number(amount) || 0;
    if (!target || !value) return false;
    result.targets[bucket][target] = (result.targets[bucket][target] || 0) + value;
    addLabel(result, `${label} ${target} ${value > 0 ? '+' : ''}${value}%`);
    return true;
  }

  function parseSoulEffects(item, context = {}) {
    const original = soulEffectText(item);
    let effectText = original;
    const comboParts = effectText.split(/\bEm combo com\b|\bEm conjunto com\b/i);
    const comboText = comboParts.length > 1 ? comboParts.slice(1).join(' ').trim() : '';
    effectText = comboParts[0]
      .replace(/\([^)]*(?:Carta|combo)[^)]*\)/gi, '')
      .trim();

    const statKeys = { for:'str', agi:'agi', vit:'vit', int:'int', des:'dex', dex:'dex', sor:'luk', luk:'luk' };
    const threshold = effectText.match(/\bSe\s+(FOR|AGI|VIT|INT|DES|DEX|SOR|LUK)\s*(?:>=|≥)\s*(\d+)\s*:\s*([\s\S]+)/i);
    let conditionLabel = '';
    if (threshold) {
      const statKey = statKeys[normalize(threshold[1])];
      const required = Number(threshold[2]) || 0;
      const current = Number(context.stats?.[statKey]) || 0;
      conditionLabel = `${threshold[1].toUpperCase()} ${current}/${required}`;
      if (current < required) {
        const inactive = makeEffects();
        inactive.conditional.push(`${conditionLabel}: ${threshold[3].trim()}`);
        inactive.coverage = { status:'incomplete', recognized:0, mechanical:1, unresolved:1 };
        inactive.soul = { effectText:original, conditionActive:false, conditionLabel };
        if (comboText) inactive.conditional.push(`Combo: ${comboText}`);
        return inactive;
      }
      effectText = threshold[3].trim();
    }

    const conditionalText = /(?:a cada\s+\d+\s+refinos?|refinad|parado por|ao atacar|ao receber|ao ser|quando|chance de|ao cair|pelas costas)/i.test(effectText);
    const safeText = conditionalText ? '' : effectText;
    const result = parseItemEffects({ ...item, tipo:'Alma', atq:null, def:null, descricao:safeText });
    let specialized = 0;

    if (conditionLabel) addLabel(result, `Condição ativa: ${conditionLabel}`);
    if (conditionalText) result.conditional.push(effectText);
    if (comboText) result.conditional.push(`Combo: ${comboText}`);

    const normalizedElements = { agua:'Água', fogo:'Fogo', terra:'Terra', vento:'Vento', veneno:'Veneno', sagrado:'Sagrado', sombrio:'Sombrio', fantasma:'Fantasma', neutro:'Neutro', maldito:'Maldito' };
    const normalizedRaces = { amorfo:'Amorfo', anjo:'Anjo', bruto:'Bruto', demonio:'Demônio', dragao:'Dragão', humano:'Humano', humanoide:'Humanoide', demi_humano:'Humanoide', inseto:'Inseto', morto_vivo:'Morto-Vivo', peixe:'Peixe', planta:'Planta' };
    const normalizedSizes = { pequeno:'Pequeno', medio:'Médio', grande:'Grande' };
    const scanText = safeText;

    for (const match of scanText.matchAll(/Dano(?:\s+(?:com|da))?\s+(?:a\s+)?(?:propriedade\s+)?(Água|Agua|Fogo|Terra|Vento|Veneno|Sagrado|Sombrio|Fantasma|Neutro|Maldito)\s*\+\s*(\d+)%/gi)) {
      const target = normalizedElements[normalize(match[1])] || match[1];
      if (addTargetValue(result, 'attackElementDamage', target, match[2], 'Dano elemental')) specialized += 1;
    }

    const clauses = scanText.split(/[;.]+/).map(value => value.trim()).filter(Boolean);
    clauses.forEach(clause => {
      if (!/dano/i.test(clause) || /recebid|tomado|reduz/i.test(clause)) return;
      const amount = Number(clause.match(/\+\s*(\d+)%/)?.[1]) || 0;
      if (!amount) return;
      const normalizedClause = normalize(clause);
      const races = Object.entries(normalizedRaces).filter(([key]) => normalizedClause.includes(key.replace('_', ' '))).map(([, value]) => value);
      const sizes = Object.entries(normalizedSizes).filter(([key]) => normalizedClause.includes(key)).map(([, value]) => value);
      if (/mvp|chefes?|mini boss/i.test(clause)) races.push('MVP');
      if (/todos os tamanhos/i.test(clause)) sizes.push(...SIZES);
      [...new Set(races)].forEach(race => { if (addTargetValue(result, 'raceDamage', race, amount, 'Dano vs raça')) specialized += 1; });
      [...new Set(sizes)].forEach(size => { if (addTargetValue(result, 'sizeDamage', size, amount, 'Dano vs tamanho')) specialized += 1; });
    });

    for (const match of scanText.matchAll(/(?:Resist(?:ência|\.)|Def(?:esa|\.)?)(?:\s+contra|\s+a|\s+da)?(?:\s+propriedade)?\s+(Água|Agua|Fogo|Terra|Vento|Veneno|Sagrado|Sombrio|Fantasma|Neutro|Maldito)\s*([+-])\s*(\d+)%/gi)) {
      const target = normalizedElements[normalize(match[1])] || match[1];
      const amount = Number(match[3]) * (match[2] === '-' ? -1 : 1);
      if (addTargetValue(result, 'elementResistance', target, amount, 'Resistência elemental')) specialized += 1;
    }

    for (const match of scanText.matchAll(/(?:Resist(?:ência|\.)|reduz)[^.;]*?(Amorfo|Anjo|Bruto|Demônio|Demonio|Dragão|Dragao|Humanoide|Demi[- ]Humano|Inseto|Morto[- ]Vivo|Peixe|Planta)[^.;]*?([+-]?\s*\d+)%/gi)) {
      const raceKey = normalize(match[1]).replace(' ', '_');
      const target = normalizedRaces[raceKey] || match[1];
      const amount = Number(String(match[2]).replace(/\s/g, '')) || 0;
      if (addTargetValue(result, 'raceResistance', target, amount, 'Resistência a raça')) specialized += 1;
    }

    for (const match of scanText.matchAll(/Def(?:esa|\.)?\s+(?:da\s+)?raça\s+(Amorfo|Anjo|Bruto|Demônio|Demonio|Dragão|Dragao|Humanoide|Demi[- ]Humano|Inseto|Morto[- ]Vivo|Peixe|Planta)\s*\+\s*(\d+)%/gi)) {
      const raceKey = normalize(match[1]).replace(' ', '_');
      const target = normalizedRaces[raceKey] || match[1];
      if (addTargetValue(result, 'raceResistance', target, match[2], 'Resistência a raça')) specialized += 1;
    }

    for (const match of scanText.matchAll(/(?:Def(?:esa|\.)?|Resist(?:ência|\.))\s+(?:ao\s+)?tamanho\s+(Pequeno|Médio|Medio|Grande)\s*\+\s*(\d+)%/gi)) {
      const target = normalizedSizes[normalize(match[1])] || match[1];
      if (addTargetValue(result, 'sizeResistance', target, match[2], 'Resistência a tamanho')) specialized += 1;
    }
    const allSizeResistance = scanText.match(/(?:Reduz dano|Resistência)[^.;]*todos os tamanhos[^.;]*?(\d+)%/i);
    if (allSizeResistance) SIZES.forEach(size => { if (addTargetValue(result, 'sizeResistance', size, allSizeResistance[1], 'Resistência a tamanho')) specialized += 1; });

    for (const [key, regex, label, suffix = '%'] of [
      ['hardDef', /Hard\s+DEF\s*([+-]\s*\d+)/i, 'Hard DEF', ''],
      ['softDef', /Soft\s+DEF\s*([+-]\s*\d+)/i, 'Soft DEF', ''],
      ['hardMdef', /Hard\s+MDEF\s*([+-]\s*\d+)/i, 'Hard MDEF', ''],
      ['softMdef', /Soft\s+MDEF\s*([+-]\s*\d+)/i, 'Soft MDEF', ''],
      ['hardDef', /Defesa dura\s*\(Hard\s*Def\)\s*([+-]\s*\d+)/i, 'Hard DEF', ''],
      ['softDef', /Defesa flexível\s*\(Soft\s*Def\)\s*([+-]\s*\d+)/i, 'Soft DEF', ''],
      ['hardMdef', /Defesa mágica dura\s*\(Hard\s*MDef\)\s*([+-]\s*\d+)/i, 'Hard MDEF', ''],
      ['softMdef', /Defesa mágica flexível\s*\(Soft\s*MDef\)\s*([+-]\s*\d+)/i, 'Soft MDEF', ''],
      ['rangedResistance', /(?:Resistência a|redução de) dano à distância(?: recebido)?\s*([+-]?\s*\d+)%/i, 'Resistência à distância'],
      ['magicResistance', /Dano mágico (?:tomado|recebido)\s*-\s*(\d+)%/i, 'Resistência mágica'],
      ['physicalResistance', /(?:Reduz dano físico recebido|Dano físico recebido)\s*(?:em\s*)?-?\s*(\d+)%/i, 'Resistência física'],
      ['physicalDamagePct', /Dano físico(?: causado)?\s*\+\s*(\d+)%/i, 'Dano físico'],
      ['matqPct', /Ataque Mágico\s*\+\s*(\d+)%/i, 'ATQM'],
      ['critResist', /Defesa contra crítico\s*\+\s*(\d+)%?/i, 'Resistência a crítico', ''],
      ['cooldownReduction', /Recarga de habilidades\s*-\s*(\d+)%/i, 'Recarga'],
      ['expPct', /EXP[^+]*\+\s*(\d+)%/i, 'EXP']
    ]) {
      const match = scanText.match(regex);
      if (match) {
        const amount = Math.abs(Number(String(match[1]).replace(/\s/g, '')) || 0);
        if (amount) {
          result[key] += amount;
          addLabel(result, `${label} +${amount}${suffix}`);
          specialized += 1;
        }
      }
    }

    const softMdef = Number(scanText.match(/Soft\s+MDEF\s*\+\s*(\d+)/i)?.[1]) || 0;
    const hardMdef = Number(scanText.match(/Hard\s+MDEF\s*\+\s*(\d+)/i)?.[1]) || 0;
    if (softMdef + hardMdef && result.mdef >= softMdef + hardMdef) {
      result.mdef -= softMdef + hardMdef;
      result.labels = result.labels.filter(label => !/^MDEF\s+[+-]/i.test(label));
    }

    if (/Dano físico(?: causado)?\s*\+\s*(\d+)%/i.test(scanText)) {
      const amount = Number(scanText.match(/Dano físico(?: causado)?\s*\+\s*(\d+)%/i)?.[1]) || 0;
      if (amount && result.damagePct >= amount) result.damagePct -= amount;
    }

    const bossResistance = scanText.match(/Reduz dano (?:recebido )?de (?:MVP|Chefes?|MVP\/Mini boss)[^\d]*(\d+)%/i);
    if (bossResistance) { result.bossResistance += Number(bossResistance[1]); addLabel(result, `Resistência a chefes +${bossResistance[1]}%`); specialized += 1; }
    const normalResistance = scanText.match(/Reduz dano (?:recebido )?de monstros normais[^\d]*(\d+)%/i);
    if (normalResistance) { result.normalResistance += Number(normalResistance[1]); addLabel(result, `Resistência a monstros normais +${normalResistance[1]}%`); specialized += 1; }

    const magicReflect = effectText.match(/Reflete\s+(\d+)\s+de dano(?: fixo)? ao receber magia/i);
    if (magicReflect) { result.reflectMagic += Number(magicReflect[1]); addLabel(result, `Reflexão mágica +${magicReflect[1]}`); specialized += 1; }
    const meleeReflect = effectText.match(/reflete\s+(\d+)\s+de dano(?: fixo)?[^.;]*(?:corpo a corpo|ataques corpo-a-corpo)/i);
    if (meleeReflect) { result.reflectMelee += Number(meleeReflect[1]); addLabel(result, `Reflexão corpo a corpo +${meleeReflect[1]}`); specialized += 1; }

    clauses.forEach(clause => {
      const expAmount = Number(clause.match(/EXP[^+]*\+\s*(\d+)%/i)?.[1]) || 0;
      if (!expAmount) return;
      const normalizedClause = normalize(clause);
      const races = Object.entries(normalizedRaces).filter(([key]) => normalizedClause.includes(key.replace('_', ' '))).map(([, value]) => value);
      if (!races.length) return;
      [...new Set(races)].forEach(race => { if (addTargetValue(result, 'raceExp', race, expAmount, 'EXP vs raça')) specialized += 1; });
      result.expPct = Math.max(0, result.expPct - expAmount);
    });

    const excludedSkillNames = new Set([...Object.values(normalizedElements).map(normalize), 'fisico', 'magico', 'critico']);
    for (const match of scanText.matchAll(/Dano (?:de|com)\s+([^+;,.]+?)\s*\+\s*(\d+)%/gi)) {
      const skill = match[1].trim();
      if (excludedSkillNames.has(normalize(skill)) || /propriedade|distância|tamanho|raça/i.test(skill)) continue;
      skill.split(/\s+e\s+/i).map(value => value.trim()).filter(Boolean).forEach(name => {
        if (addTargetValue(result, 'skillDamage', name, match[2], 'Dano de habilidade')) specialized += 1;
      });
    }

    result.coverage.mechanical = Math.max(result.coverage.mechanical, effectText ? 1 : 0);
    result.coverage.recognized += specialized;
    result.coverage.unresolved = result.unresolved.length + result.conditional.length;
    if (result.coverage.unresolved && result.coverage.recognized) result.coverage.status = 'partial';
    else if (result.coverage.unresolved) result.coverage.status = 'incomplete';
    else if (result.coverage.recognized) result.coverage.status = 'complete';
    else result.coverage.status = 'informational';
    result.soul = { effectText:original, conditionActive:!threshold || true, conditionLabel };
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

  return { NUMERIC_KEYS, RACES, ELEMENTS, SIZES, normalize, parseItemEffects, parseSoulEffects, soulEffectText, auditItems };
});
