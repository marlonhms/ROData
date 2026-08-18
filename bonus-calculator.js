(function initBonusCalculator(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BonusCalculator = api;
  if (root) root.BonusCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBonusCalculator() {
  'use strict';

  const state = {
    // Drop State
    rate: 'x1', // x1 (+40%), x3 (+15%), x5 (0%)
    reborns: 0, // 0 to 10
    goma: false, // +100%
    almasDrop: { poring: false, poporing: false, marin: false, ancientMimic: false, mastering: false },
    colecoesDrop: { poringFamily: false, pronteraField: false, einbechField: false },
    faccao: 'nenhuma', // nenhuma, aether (+25%), renegado (+35%)
    vip: false, // +20%
    pedrasVisuaisDrop: 0, // 0 to 60%
    armarioVisuaisCount: 0, // +0.1% each, max 20%

    // Exp State
    consumivelExp: 'nenhum', // nenhum, manual (+50%), enciclopedia (+200%)
    ptMembros: 1, // 1 to 12 (+15% per member above 1)
    petExp: 0, // 0, 20, 35, 40, 50
    pedrasVisuaisExp: 0, // 0 to 60%
    
    // Cast State
    userDex: 99,
    userCastRed: 0,
    skillBaseCast: 5.0
  };

  const REBORN_DROP_TABLE = {
    x1: [40, 60, 85, 115, 150, 190, 235, 285, 340, 355],
    x3: [15, 25, 40, 60, 85, 115, 150, 190, 235, 285],
    x5: [0, 10, 20, 35, 55, 80, 110, 145, 185, 230]
  };

  function calculateDrop() {
    let baseRateBonus = state.rate === 'x1' ? 40 : state.rate === 'x3' ? 15 : 0;
    if (state.reborns > 0) {
      const idx = Math.min(10, state.reborns) - 1;
      baseRateBonus = REBORN_DROP_TABLE[state.rate]?.[idx] ?? baseRateBonus;
    }

    const gomaBonus = state.goma ? 100 : 0;
    
    let almasBonus = 0;
    if (state.almasDrop.poring) almasBonus += 1;
    if (state.almasDrop.poporing) almasBonus += 1;
    if (state.almasDrop.marin) almasBonus += 1;
    if (state.almasDrop.ancientMimic) almasBonus += 5;
    if (state.almasDrop.mastering) almasBonus += 10;

    let colecoesBonus = 0;
    if (state.colecoesDrop.poringFamily) colecoesBonus += 10;
    if (state.colecoesDrop.pronteraField) colecoesBonus += 1;
    if (state.colecoesDrop.einbechField) colecoesBonus += 1;

    const faccaoBonus = state.faccao === 'renegado' ? 35 : state.faccao === 'aether' ? 25 : 0;
    const vipBonus = state.vip ? 20 : 0;
    const pedrasBonus = Math.min(60, Math.max(0, Number(state.pedrasVisuaisDrop) || 0));
    
    // Armario: 0.1% per visual, max 20% for drop
    const armarioBonus = Math.min(20, (Number(state.armarioVisuaisCount) || 0) * 0.1);

    const totalBonus = baseRateBonus + gomaBonus + almasBonus + colecoesBonus + faccaoBonus + vipBonus + pedrasBonus + armarioBonus;
    const multiplier = 1 + (totalBonus / 100);

    return {
      baseRateBonus,
      gomaBonus,
      almasBonus,
      colecoesBonus,
      faccaoBonus,
      vipBonus,
      pedrasBonus,
      armarioBonus,
      totalBonus,
      multiplier
    };
  }

  function calculateExp() {
    let consumivelBonus = state.consumivelExp === 'enciclopedia' ? 200 : state.consumivelExp === 'manual' ? 50 : 0;
    let ptBonus = Math.max(0, (state.ptMembros - 1) * 15);
    let petBonus = Number(state.petExp) || 0;
    let faccaoBonus = state.faccao === 'renegado' ? 35 : state.faccao === 'aether' ? 25 : 0;
    let vipBonus = state.vip ? 20 : 0;
    let pedrasBonus = Math.min(60, Math.max(0, Number(state.pedrasVisuaisExp) || 0));
    
    // Armario: 0.1% per visual, UNLIMITED for EXP
    let armarioBonus = (Number(state.armarioVisuaisCount) || 0) * 0.1;

    const totalBonus = consumivelBonus + ptBonus + petBonus + faccaoBonus + vipBonus + pedrasBonus + armarioBonus;
    const multiplier = 1 + (totalBonus / 100);

    return {
      consumivelBonus,
      ptBonus,
      petBonus,
      faccaoBonus,
      vipBonus,
      pedrasBonus,
      armarioBonus,
      totalBonus,
      multiplier
    };
  }

  function calculateCast() {
    const dex = Math.max(0, Number(state.userDex) || 0);
    const redPct = Math.max(0, Math.min(100, Number(state.userCastRed) || 0));
    const baseCast = Math.max(0, Number(state.skillBaseCast) || 0);

    const dexFactor = Math.max(0, 1 - (dex / 150));
    const redFactor = 1 - (redPct / 100);
    const finalCast = baseCast * dexFactor * redFactor;
    const isInstaCast = finalCast <= 0.001 || dex >= 150 || redPct >= 100;

    return {
      dex,
      redPct,
      baseCast,
      dexFactor,
      redFactor,
      finalCast: Math.max(0, finalCast),
      isInstaCast
    };
  }

  function render(containerId = 'bonus-calculator-content') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const drop = calculateDrop();
    const exp = calculateExp();
    const cast = calculateCast();

    container.innerHTML = `
      <div class="bonus-calc-grid">
        <!-- DROP CALCULATOR -->
        <section class="bonus-calc-card">
          <header class="bonus-card-head">
            <div>
              <span class="bonus-tag drop">MULTIPLICADOR DE DROP</span>
              <h3>🎁 Simulador de Bônus de Drop</h3>
            </div>
            <div class="bonus-highlight-badge drop">+${drop.totalBonus.toFixed(1)}% <small>(${drop.multiplier.toFixed(2)}x)</small></div>
          </header>

          <div class="bonus-card-body">
            <div class="bonus-form-group">
              <label>Rate Base do Personagem:</label>
              <div class="bonus-pill-group">
                <button type="button" class="bonus-pill ${state.rate === 'x1' ? 'active' : ''}" data-drop-rate="x1">Rate x1 (+40%)</button>
                <button type="button" class="bonus-pill ${state.rate === 'x3' ? 'active' : ''}" data-drop-rate="x3">Rate x3 (+15%)</button>
                <button type="button" class="bonus-pill ${state.rate === 'x5' ? 'active' : ''}" data-drop-rate="x5">Rate x5 (+0%)</button>
              </div>
            </div>

            <div class="bonus-form-group">
              <label>Quantidade de Reborns Realizados: <strong class="gold">${state.reborns}</strong></label>
              <input type="range" id="bonusRebornsInput" min="0" max="10" value="${state.reborns}" class="bonus-slider">
            </div>

            <div class="bonus-form-group">
              <label>Consumíveis & Bônus de Conta:</label>
              <div class="bonus-checkbox-grid">
                <label class="bonus-check"><input type="checkbox" id="bonusGomaCheck" ${state.goma ? 'checked' : ''}> <span>🍬 Goma de Mascar (+100%)</span></label>
                <label class="bonus-check"><input type="checkbox" id="bonusVipCheck" ${state.vip ? 'checked' : ''}> <span>👑 Membro VIP (+20%)</span></label>
              </div>
            </div>

            <div class="bonus-form-group">
              <label>Facção / Sistema de PK:</label>
              <select id="bonusFaccaoSelect" class="bonus-select">
                <option value="nenhuma" ${state.faccao === 'nenhuma' ? 'selected' : ''}>Nenhuma / Neutro (+0%)</option>
                <option value="aether" ${state.faccao === 'aether' ? 'selected' : ''}>Aether ou Tártaro (+25%)</option>
                <option value="renegado" ${state.faccao === 'renegado' ? 'selected' : ''}>Renegado (+35%)</option>
              </select>
            </div>

            <div class="bonus-form-group">
              <label>Almas com Bônus de Drop:</label>
              <div class="bonus-checkbox-grid">
                <label class="bonus-check"><input type="checkbox" data-alma-drop="poring" ${state.almasDrop.poring ? 'checked' : ''}> <span>Alma de Poring (+1%)</span></label>
                <label class="bonus-check"><input type="checkbox" data-alma-drop="poporing" ${state.almasDrop.poporing ? 'checked' : ''}> <span>Alma de Poporing (+1%)</span></label>
                <label class="bonus-check"><input type="checkbox" data-alma-drop="marin" ${state.almasDrop.marin ? 'checked' : ''}> <span>Alma de Marin (+1%)</span></label>
                <label class="bonus-check"><input type="checkbox" data-alma-drop="ancientMimic" ${state.almasDrop.ancientMimic ? 'checked' : ''}> <span>Alma de Ancient Mimic (+5%)</span></label>
                <label class="bonus-check"><input type="checkbox" data-alma-drop="mastering" ${state.almasDrop.mastering ? 'checked' : ''}> <span>Alma de Mastering (+10%)</span></label>
              </div>
            </div>

            <div class="bonus-form-group">
              <label>Coleções Concluídas:</label>
              <div class="bonus-checkbox-grid">
                <label class="bonus-check"><input type="checkbox" data-col-drop="poringFamily" ${state.colecoesDrop.poringFamily ? 'checked' : ''}> <span>Família Poring (+10%)</span></label>
                <label class="bonus-check"><input type="checkbox" data-col-drop="pronteraField" ${state.colecoesDrop.pronteraField ? 'checked' : ''}> <span>Arredores de Prontera (+1%)</span></label>
                <label class="bonus-check"><input type="checkbox" data-col-drop="einbechField" ${state.colecoesDrop.einbechField ? 'checked' : ''}> <span>Campos de Einbech (+1%)</span></label>
              </div>
            </div>

            <div class="bonus-form-group">
              <label>Pedras em Visuais (6 slots até 60%): <strong class="gold">${state.pedrasVisuaisDrop}%</strong></label>
              <input type="range" id="bonusPedrasDropInput" min="0" max="60" step="1" value="${state.pedrasVisuaisDrop}" class="bonus-slider">
            </div>

            <div class="bonus-form-group">
              <label>Visuais no Armário (+0,1% cada, teto 20%): <strong class="gold">${state.armarioVisuaisCount} un (${drop.armarioBonus.toFixed(1)}%)</strong></label>
              <input type="number" id="bonusArmarioInput" min="0" max="1000" value="${state.armarioVisuaisCount}" class="bonus-number-input">
            </div>
          </div>
        </section>

        <!-- EXP CALCULATOR -->
        <section class="bonus-calc-card">
          <header class="bonus-card-head">
            <div>
              <span class="bonus-tag exp">MULTIPLICADOR DE EXP</span>
              <h3>⚡ Simulador de Bônus de EXP</h3>
            </div>
            <div class="bonus-highlight-badge exp">+${exp.totalBonus.toFixed(1)}% <small>(${exp.multiplier.toFixed(2)}x)</small></div>
          </header>

          <div class="bonus-card-body">
            <div class="bonus-form-group">
              <label>Consumível de EXP:</label>
              <div class="bonus-pill-group">
                <button type="button" class="bonus-pill ${state.consumivelExp === 'nenhum' ? 'active' : ''}" data-exp-consum="nenhum">Nenhum</button>
                <button type="button" class="bonus-pill ${state.consumivelExp === 'manual' ? 'active' : ''}" data-exp-consum="manual">Manual (+50%)</button>
                <button type="button" class="bonus-pill ${state.consumivelExp === 'enciclopedia' ? 'active' : ''}" data-exp-consum="enciclopedia">Enciclopédia (+200%)</button>
              </div>
            </div>

            <div class="bonus-form-group">
              <label>Membros no Grupo (PT): <strong class="gold">${state.ptMembros} membro${state.ptMembros > 1 ? 's' : ''} (+${exp.ptBonus}%)</strong></label>
              <input type="range" id="bonusPtInput" min="1" max="12" value="${state.ptMembros}" class="bonus-slider">
              <small class="text-muted">Limite de 20 níveis entre membros · Cada membro extra concede +15% de EXP.</small>
            </div>

            <div class="bonus-form-group">
              <label>Bônus de Pet Ativo:</label>
              <select id="bonusPetSelect" class="bonus-select">
                <option value="0" ${state.petExp === 0 ? 'selected' : ''}>Nenhum (+0%)</option>
                <option value="20" ${state.petExp === 20 ? 'selected' : ''}>Pet Nível 1 (+20%)</option>
                <option value="35" ${state.petExp === 35 ? 'selected' : ''}>Pet Nível 2 (+35%)</option>
                <option value="40" ${state.petExp === 40 ? 'selected' : ''}>Pet Nível 3 (+40%)</option>
                <option value="50" ${state.petExp === 50 ? 'selected' : ''}>Pet Nível 4 / Especial (+50%)</option>
              </select>
            </div>

            <div class="bonus-form-group">
              <label>Pedras em Visuais (6 slots até 60%): <strong class="gold">${state.pedrasVisuaisExp}%</strong></label>
              <input type="range" id="bonusPedrasExpInput" min="0" max="60" step="1" value="${state.pedrasVisuaisExp}" class="bonus-slider">
            </div>

            <div class="bonus-form-group">
              <div class="bonus-summary-box">
                <h4>📊 Resumo de Bônus de EXP</h4>
                <ul>
                  <li>Consumível: <b>+${exp.consumivelBonus}%</b></li>
                  <li>Grupo (${state.ptMembros}p): <b>+${exp.ptBonus}%</b></li>
                  <li>Pet: <b>+${exp.petBonus}%</b></li>
                  <li>Facção (${state.faccao}): <b>+${exp.faccaoBonus}%</b></li>
                  <li>VIP: <b>+${exp.vipBonus}%</b></li>
                  <li>Pedras Visuais: <b>+${exp.pedrasBonus}%</b></li>
                  <li>Armário de Visuais (${state.armarioVisuaisCount} un): <b>+${exp.armarioBonus.toFixed(1)}% (Ilimitado)</b></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- INSTA-CAST & MECHANICS GUIDE -->
      <section class="bonus-cast-panel">
        <header class="bonus-card-head">
          <div>
            <span class="bonus-tag cast">MECÂNICA OFICIAL DE CONJURAÇÃO</span>
            <h3>⏱️ Guia & Simulador de Insta-Cast (Cast Variável)</h3>
            <p>Fórmula Oficial: <code>Tempo = Base × (1 - (DEX / 150)) × (1 - Redução %)</code></p>
          </div>
        </header>

        <div class="bonus-cast-grid">
          <div class="bonus-cast-controls">
            <div class="bonus-form-group">
              <label>Sua Destreza Total (Base + Bônus Alt+Q):</label>
              <input type="number" id="bonusDexInput" min="1" max="250" value="${cast.dex}" class="bonus-number-input">
            </div>
            <div class="bonus-form-group">
              <label>Redução de Cast Variável (% em Equipamentos/Almas):</label>
              <input type="number" id="bonusCastRedInput" min="0" max="100" value="${cast.redPct}" class="bonus-number-input">
            </div>
            <div class="bonus-form-group">
              <label>Tempo Base da Habilidade (segundos):</label>
              <input type="number" id="bonusSkillCastInput" min="0.1" max="30" step="0.1" value="${cast.baseCast}" class="bonus-number-input">
            </div>
            <div class="bonus-cast-verdict ${cast.isInstaCast ? 'success' : ''}">
              <span>Tempo Final de Conjuração:</span>
              <strong>${cast.finalCast.toFixed(2)}s</strong>
              <small>${cast.isInstaCast ? '✨ INSTA-CAST ATINGIDO! (0s de conjuração)' : `Faltam ${Math.max(0, 150 - cast.dex)} DEX ou ${Math.max(0, 100 - cast.redPct)}% de Redução`}</small>
            </div>
          </div>

          <div class="bonus-cast-routes">
            <div class="bonus-route-card">
              <h4>🎯 Rota 1: 150 de Destreza (Insta-Cast via DEX)</h4>
              <p>Acumule <strong>51 de bônus de DEX</strong> somado aos 99 de base para atingir 150 DEX:</p>
              <ul>
                <li>🗺️ <b>+3 DEX:</b> Coleções de Mapas</li>
                <li>🛡️ <b>+14 DEX:</b> Encantos (+4 Capa, +4 Bota, +4 Armadura, +2 Escudo)</li>
                <li>🙏 <b>+10 DEX:</b> Buff de Bênção (Clérigo/Noviço)</li>
                <li>👀 <b>+1 DEX:</b> Olhos Biônicos (Meio)</li>
                <li>🧤 <b>+8 DEX:</b> 2x Luvas com Carta Zerom</li>
                <li>👑 <b>+2 DEX:</b> Chapéu Negro de Borobudur</li>
                <li>✨ <b>+13 DEX em Almas:</b> Ragged (+4), Khalitzburg (+3), Naga (+2), Evil Druid (+2), Nepenthes (+1), Drops (+1)</li>
              </ul>
            </div>

            <div class="bonus-route-card">
              <h4>⚡ Rota 2: 100% de Redução em Porcentagem</h4>
              <p>Zere o tempo de conjuração sem depender exclusivamente da destreza:</p>
              <ul>
                <li>🗺️ <b>+31% a 34%:</b> Coleção Completa de Mapas</li>
                <li>💍 <b>+20%:</b> 2x Acessórios com 10% de Cast Variável cada</li>
                <li>⚔️ <b>+20%:</b> Arma encantada com 20% de Cast Variável</li>
                <li>✨ <b>+10%:</b> Alma de Archdam</li>
                <li>✨ <b>+6%:</b> Almas de Fen, Borboleta Sanguinária e Zerom</li>
                <li>🏃 <b>+13%:</b> Combo Corrida</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;

    bindEvents(containerId);
  }

  function bindEvents(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Rate buttons
    container.querySelectorAll('[data-drop-rate]').forEach(btn => {
      btn.onclick = () => {
        state.rate = btn.dataset.dropRate;
        render(containerId);
      };
    });

    // Reborns
    const rebInput = container.querySelector('#bonusRebornsInput');
    if (rebInput) rebInput.oninput = (e) => { state.reborns = Number(e.target.value); render(containerId); };

    // Checkboxes
    const gomaCheck = container.querySelector('#bonusGomaCheck');
    if (gomaCheck) gomaCheck.onchange = (e) => { state.goma = e.target.checked; render(containerId); };

    const vipCheck = container.querySelector('#bonusVipCheck');
    if (vipCheck) vipCheck.onchange = (e) => { state.vip = e.target.checked; render(containerId); };

    const faccaoSelect = container.querySelector('#bonusFaccaoSelect');
    if (faccaoSelect) faccaoSelect.onchange = (e) => { state.faccao = e.target.value; render(containerId); };

    // Almas drop
    container.querySelectorAll('[data-alma-drop]').forEach(cb => {
      cb.onchange = (e) => {
        state.almasDrop[e.target.dataset.almaDrop] = e.target.checked;
        render(containerId);
      };
    });

    // Colecoes drop
    container.querySelectorAll('[data-col-drop]').forEach(cb => {
      cb.onchange = (e) => {
        state.colecoesDrop[e.target.dataset.colDrop] = e.target.checked;
        render(containerId);
      };
    });

    // Pedras drop / exp
    const pedrasDrop = container.querySelector('#bonusPedrasDropInput');
    if (pedrasDrop) pedrasDrop.oninput = (e) => { state.pedrasVisuaisDrop = Number(e.target.value); render(containerId); };

    const pedrasExp = container.querySelector('#bonusPedrasExpInput');
    if (pedrasExp) pedrasExp.oninput = (e) => { state.pedrasVisuaisExp = Number(e.target.value); render(containerId); };

    // Armario
    const armarioInput = container.querySelector('#bonusArmarioInput');
    if (armarioInput) armarioInput.oninput = (e) => { state.armarioVisuaisCount = Math.max(0, Number(e.target.value) || 0); render(containerId); };

    // Consumivel Exp
    container.querySelectorAll('[data-exp-consum]').forEach(btn => {
      btn.onclick = () => {
        state.consumivelExp = btn.dataset.expConsum;
        render(containerId);
      };
    });

    // PT membros
    const ptInput = container.querySelector('#bonusPtInput');
    if (ptInput) ptInput.oninput = (e) => { state.ptMembros = Number(e.target.value); render(containerId); };

    // Pet
    const petSelect = container.querySelector('#bonusPetSelect');
    if (petSelect) petSelect.onchange = (e) => { state.petExp = Number(e.target.value); render(containerId); };

    // Cast inputs
    const dexInput = container.querySelector('#bonusDexInput');
    if (dexInput) dexInput.oninput = (e) => { state.userDex = Number(e.target.value); render(containerId); };

    const redInput = container.querySelector('#bonusCastRedInput');
    if (redInput) redInput.oninput = (e) => { state.userCastRed = Number(e.target.value); render(containerId); };

    const skillInput = container.querySelector('#bonusSkillCastInput');
    if (skillInput) skillInput.oninput = (e) => { state.skillBaseCast = Number(e.target.value); render(containerId); };
  }

  return {
    state,
    calculateDrop,
    calculateExp,
    calculateCast,
    render
  };
});
