/**
 * ============================================================================
 * AureumRO - Sistema de Reborn & Elos de Poder (reborn-guide.js)
 * Sincronizado e validado com a Wiki Oficial do AureumRO.
 * ============================================================================
 */

(function initRebornGuideModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.RebornGuide = api;
  if (root) root.RebornGuide = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createRebornGuide() {
  'use strict';

  // 10 Elos Oficiais de Reborn
  const ELOS = [
    { id: 'bronze', index: 1, name: 'Bronze', tier: 'Elo I', icon: 'https://wiki.aureumro.com/images/a/ae/Elo_Bronze.png', color: '#cd7f32', coins: 1000, zeny: 1000000 },
    { id: 'prata', index: 2, name: 'Prata', tier: 'Elo II', icon: 'https://wiki.aureumro.com/images/5/5a/Elo_Prata.png', color: '#c0c0c0', coins: 2000, zeny: 2000000 },
    { id: 'ouro', index: 3, name: 'Ouro', tier: 'Elo III', icon: 'https://wiki.aureumro.com/images/2/2e/Elo_Ouro.png', color: '#ffd700', coins: 3000, zeny: 3000000 },
    { id: 'platina', index: 4, name: 'Platina', tier: 'Elo IV', icon: 'https://wiki.aureumro.com/images/1/13/Elo_Platina.png', color: '#00f0ff', coins: 4000, zeny: 4000000 },
    { id: 'esmeralda', index: 5, name: 'Esmeralda', tier: 'Elo V', icon: 'https://wiki.aureumro.com/images/2/22/Elo_Esmeralda.png', color: '#10b981', coins: 5000, zeny: 5000000 },
    { id: 'diamante', index: 6, name: 'Diamante', tier: 'Elo VI', icon: 'https://wiki.aureumro.com/images/0/0a/Elo_Diamante.png', color: '#38bdf8', coins: 6000, zeny: 6000000 },
    { id: 'mestre', index: 7, name: 'Mestre', tier: 'Elo VII', icon: 'https://wiki.aureumro.com/images/3/31/Elo_Mestre.png', color: '#a855f7', coins: 7000, zeny: 7000000 },
    { id: 'graomestre', index: 8, name: 'Grão Mestre', tier: 'Elo VIII', icon: 'https://wiki.aureumro.com/images/4/41/Elo_GraoMestre.png', color: '#f59e0b', coins: 8000, zeny: 8000000 },
    { id: 'desafiante', index: 9, name: 'Desafiante', tier: 'Elo IX', icon: 'https://wiki.aureumro.com/images/6/66/Elo_Desafiante.png', color: '#ef4444', coins: 9000, zeny: 9000000 },
    { id: 'monarca', index: 10, name: 'Monarca', tier: 'Elo X (Supremo)', icon: 'https://wiki.aureumro.com/images/2/2c/Elo_Monarca.png', color: '#fde68a', coins: 10000, zeny: 10000000 }
  ];

  // Métricas oficiais por Rate (1x, 3x, 5x)
  const METRICS = [
    { key: 'atk_matk', label: 'ATQ / MATK', unit: 'flat' },
    { key: 'damage_pct', label: 'Dano físico / mágico / à distância', unit: '%' },
    { key: 'speed_pct', label: 'Velocidade de movimento', unit: '%' },
    { key: 'crit', label: 'Crítico', unit: 'flat' },
    { key: 'crit_res', label: 'Resistência a crítico', unit: 'flat' },
    { key: 'hit', label: 'Precisão (Hit)', unit: 'flat' },
    { key: 'flee', label: 'Esquiva (Flee)', unit: 'flat' },
    { key: 'perfect_flee', label: 'Esquiva Perfeita', unit: 'flat' },
    { key: 'hard_def', label: 'Hard DEF', unit: 'flat' },
    { key: 'soft_def', label: 'Soft DEF', unit: 'flat' },
    { key: 'hard_mdef', label: 'Hard MDEF', unit: 'flat' },
    { key: 'soft_mdef', label: 'Soft MDEF', unit: 'flat' },
    { key: 'max_hp', label: 'HP máximo', unit: 'flat' },
    { key: 'max_sp', label: 'SP máximo', unit: 'flat' },
    { key: 'hp_sp_regen_pct', label: 'Regeneração de HP e SP (a cada 10s)', unit: '%' },
    { key: 'hp_on_kill', label: 'Recupera HP ao derrotar inimigo', unit: 'flat' },
    { key: 'sp_on_kill', label: 'Recupera SP ao derrotar inimigo', unit: 'flat' },
    { key: 'drop_rate_pct', label: 'Taxa de drop de itens', unit: '%' },
    { key: 'player_res_pct', label: 'Redução de dano de jogadores', unit: '%' },
    { key: 'all_stats', label: 'Todos os atributos', unit: 'flat' }
  ];

  const RATE_DATA = {
    '1x': {
      label: 'Rate 1x (Veterano Completo)',
      atk_matk: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
      damage_pct: [1, 2, 3, 5, 6, 8, 9, 11, 12, 15],
      speed_pct: [1, 2, 3, 5, 6, 8, 9, 11, 12, 15],
      crit: [1, 2, 3, 5, 6, 8, 9, 11, 12, 15],
      crit_res: [0, 0, 0, 0, 5, 5, 10, 10, 15, 20],
      hit: [2, 4, 6, 8, 10, 15, 20, 25, 25, 30],
      flee: [2, 4, 6, 8, 10, 15, 20, 25, 25, 30],
      perfect_flee: [0, 0, 0, 0, 2, 2, 4, 4, 6, 8],
      hard_def: [3, 3, 3, 4, 4, 6, 6, 8, 10, 12],
      soft_def: [20, 30, 40, 50, 60, 70, 80, 90, 100, 120],
      hard_mdef: [4, 4, 4, 5, 5, 6, 6, 8, 10, 12],
      soft_mdef: [20, 30, 40, 50, 60, 70, 80, 90, 100, 120],
      max_hp: [150, 300, 400, 500, 600, 700, 800, 900, 1000, 1200],
      max_sp: [10, 15, 20, 25, 30, 35, 40, 45, 50, 60],
      hp_sp_regen_pct: [2, 2, 2, 3, 3, 4, 4, 5, 5, 6],
      hp_on_kill: [10, 15, 20, 25, 30, 35, 40, 45, 50, 60],
      sp_on_kill: [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
      drop_rate_pct: [6, 8, 10, 12, 15, 18, 20, 25, 30, 35],
      player_res_pct: [4, 6, 8, 10, 12, 14, 16, 18, 20, 25],
      all_stats: [0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
    },
    '3x': {
      label: 'Rate 3x (Balanceado)',
      atk_matk: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25],
      damage_pct: [1, 2, 3, 4, 5, 7, 8, 9, 10, 12],
      speed_pct: [1, 2, 3, 4, 5, 7, 8, 9, 10, 12],
      crit: [1, 2, 3, 4, 5, 7, 8, 9, 10, 12],
      crit_res: [0, 0, 0, 0, 5, 5, 8, 8, 12, 18],
      hit: [1, 3, 4, 6, 7, 12, 17, 22, 22, 27],
      flee: [1, 3, 4, 6, 7, 12, 17, 22, 22, 27],
      perfect_flee: [0, 0, 0, 0, 1, 1, 3, 3, 5, 6],
      hard_def: [2, 2, 2, 3, 3, 5, 5, 7, 8, 11],
      soft_def: [15, 25, 35, 45, 55, 65, 70, 80, 90, 100],
      hard_mdef: [3, 3, 3, 4, 4, 5, 5, 7, 8, 10],
      soft_mdef: [15, 25, 35, 45, 55, 65, 70, 80, 90, 100],
      max_hp: [135, 250, 350, 450, 550, 650, 650, 750, 850, 1000],
      max_sp: [10, 10, 15, 15, 20, 20, 35, 35, 40, 50],
      hp_sp_regen_pct: [2, 2, 2, 2, 2, 3, 3, 3, 4, 5],
      hp_on_kill: [8, 12, 16, 20, 25, 25, 30, 35, 45, 50],
      sp_on_kill: [2, 2, 3, 3, 4, 4, 4, 4, 5, 5],
      drop_rate_pct: [5, 6, 8, 10, 12, 16, 18, 20, 25, 30],
      player_res_pct: [3, 4, 6, 8, 10, 10, 12, 16, 18, 20],
      all_stats: [0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
    },
    '5x': {
      label: 'Rate 5x (Acelerado)',
      atk_matk: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      damage_pct: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      speed_pct: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      crit: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      crit_res: [0, 0, 0, 0, 5, 5, 7, 7, 10, 15],
      hit: [1, 2, 3, 4, 5, 10, 15, 20, 20, 25],
      flee: [1, 2, 3, 4, 5, 10, 15, 20, 20, 25],
      perfect_flee: [0, 0, 0, 0, 1, 1, 3, 3, 5, 5],
      hard_def: [2, 2, 2, 3, 3, 4, 4, 6, 6, 10],
      soft_def: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      hard_mdef: [1, 1, 1, 2, 2, 4, 4, 5, 5, 8],
      soft_mdef: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      max_hp: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
      max_sp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      hp_sp_regen_pct: [1, 1, 1, 1, 2, 2, 3, 3, 4, 5],
      hp_on_kill: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      sp_on_kill: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
      drop_rate_pct: [4, 4, 6, 6, 8, 8, 10, 10, 12, 15],
      player_res_pct: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      all_stats: [0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
    }
  };

  const state = {
    selectedRate: '1x',
    selectedEloIndex: 10
  };

  function fmtZeny(z) {
    if (z >= 1000000) return (z / 1000000).toLocaleString('pt-BR') + 'M Zeny';
    if (z >= 1000) return (z / 1000).toLocaleString('pt-BR') + 'k Zeny';
    return z.toLocaleString('pt-BR') + ' Zeny';
  }

  function fmtCoins(c) {
    return c.toLocaleString('pt-BR') + ' Aureum Coins';
  }

  function getAccumulatedCost(targetIndex) {
    let totalCoins = 0;
    let totalZeny = 0;
    for (let i = 0; i < targetIndex; i++) {
      totalCoins += ELOS[i].coins;
      totalZeny += ELOS[i].zeny;
    }
    return { totalCoins, totalZeny };
  }

  function render(containerId = 'reborn-guide-root') {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const currentElo = ELOS[state.selectedEloIndex - 1] || ELOS[0];
    const rateData = RATE_DATA[state.selectedRate] || RATE_DATA['1x'];
    const accCost = getAccumulatedCost(state.selectedEloIndex);
    const eloIdx = state.selectedEloIndex - 1;

    container.innerHTML = `
      <div class="reborn-guide-container">
        
        <!-- HERO BANNER -->
        <div class="reborn-hero-banner">
          <div class="reborn-hero-content">
            <div class="reborn-hero-badge">✦ Sistema Exclusivo AureumRO</div>
            <h2 class="reborn-hero-title">Sistema de Reborn & Elos de Poder</h2>
            <p class="reborn-hero-subtitle">
              Ao atingir o ápice da sua jornada, renasça do nível 1 e grave seu nome em um <b>Elo de Prestígio</b>.
              De <b>Bronze</b> ao <b>Monarca</b>, cada renascimento equipa um título permanente com bônus colossais de dano, sobrevivência e taxa de drop!
            </p>
            <div class="reborn-hero-tags">
              <span class="reborn-tag">👑 10 Elos de Prestígio</span>
              <span class="reborn-tag">⚡ Título com Bônus Permanente</span>
              <span class="reborn-tag">📈 Bônus Escaláveis por Rate</span>
              <span class="reborn-tag">✨ Renascimento Nv. 1 Imediato</span>
            </div>
          </div>
          
          <div class="reborn-hero-npc-card">
            <div class="reborn-npc-icon-wrap">
              <img src="${currentElo.icon}" alt="${currentElo.name}" class="reborn-npc-elo-badge" />
            </div>
            <div class="reborn-npc-info">
              <strong>NPC Reborn AureumRO</strong>
              <span>Guardião dos Mais Fortes</span>
              <div class="reborn-navi-box" onclick="RebornGuide.copyNavi(this)" title="Clique para copiar o comando de navegação">
                <code>/navi prontera 174/189</code>
                <span class="navi-copy-badge">Copiar 📋</span>
              </div>
            </div>
          </div>
        </div>

        <!-- GUIA EM 4 PASSOS -->
        <div class="reborn-section">
          <h3 class="reborn-section-title"><span>📜</span> Como Funciona a Mecânica de Reborn</h3>
          <div class="reborn-steps-grid">
            <div class="reborn-step-card">
              <div class="reborn-step-num">1</div>
              <div class="reborn-step-body">
                <h4>Chegue ao Ápice</h4>
                <p>Atinja o nível máximo exigido: <b>99/70</b> para Transclasses ou <b>99/50</b> para Classes Expandidas (Superaprendiz, Ninja, Justiceiro, Taekwon).</p>
              </div>
            </div>

            <div class="reborn-step-card">
              <div class="reborn-step-num">2</div>
              <div class="reborn-step-body">
                <h4>Fale com o Guardião</h4>
                <p>Procure o NPC <b>Reborn AureumRO</b> em <b>Prontera (174, 189)</b> e entregue os <b>Aureum Coins + Zeny</b> requeridos para o próximo Elo.</p>
              </div>
            </div>

            <div class="reborn-step-card">
              <div class="reborn-step-num">3</div>
              <div class="reborn-step-body">
                <h4>Renasça no Nível 1</h4>
                <p>Seu nível de base e classe reinicia para o Nv. 1 com a sua classe mantida (ou Aprendiz T.) e o <b>Título do novo Elo</b> equipado na hora.</p>
              </div>
            </div>

            <div class="reborn-step-card">
              <div class="reborn-step-num">4</div>
              <div class="reborn-step-body">
                <h4>Evolua Mais Forte</h4>
                <p>Receba bônus imediatos de <b>ATK/MATK, Drop, DEF, HP/SP</b> e atributos passivos enquanto sobe tudo de novo rumo ao <b>Monarca</b>!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- SIMULADOR INTERATIVO DE ELOS -->
        <div class="reborn-section reborn-simulator-section">
          <div class="reborn-sim-header">
            <div>
              <h3 class="reborn-section-title" style="margin-bottom:4px;"><span>⚡</span> Simulador de Elos & Bônus de Poder</h3>
              <p class="reborn-sim-subtitle">Selecione a Rate da sua conta e clique nas insígnias para inspecionar os bônus e custos acumulados.</p>
            </div>

            <!-- Seletor de Rate -->
            <div class="reborn-rate-selector">
              <span class="rate-label">Experiência da Conta:</span>
              <div class="reborn-rate-tabs">
                <button type="button" class="reborn-rate-btn ${state.selectedRate === '1x' ? 'active' : ''}" onclick="RebornGuide.setRate('1x')">Rate 1x (Hardcore)</button>
                <button type="button" class="reborn-rate-btn ${state.selectedRate === '3x' ? 'active' : ''}" onclick="RebornGuide.setRate('3x')">Rate 3x (Média)</button>
                <button type="button" class="reborn-rate-btn ${state.selectedRate === '5x' ? 'active' : ''}" onclick="RebornGuide.setRate('5x')">Rate 5x (Dinâmica)</button>
              </div>
            </div>
          </div>

          <!-- BARRA DE SELEÇÃO DOS 10 ELOS -->
          <div class="reborn-elos-nav">
            ${ELOS.map(elo => `
              <button type="button" class="reborn-elo-chip ${elo.index === state.selectedEloIndex ? 'active' : ''}" onclick="RebornGuide.setElo(${elo.index})" style="--elo-color: ${elo.color};">
                <img src="${elo.icon}" alt="${elo.name}" class="reborn-elo-chip-icon" onerror="this.src='assets/brand/database-icon.jpg'" />
                <div class="reborn-elo-chip-text">
                  <strong>${elo.name}</strong>
                  <small>${elo.tier}</small>
                </div>
              </button>
            `).join('')}
          </div>

          <!-- PAINEL DETALHADO DO ELO ATIVO -->
          <div class="reborn-active-elo-panel" style="--active-elo-color: ${currentElo.color};">
            <div class="reborn-active-elo-head">
              <div class="reborn-active-left">
                <div class="reborn-active-icon-box">
                  <img src="${currentElo.icon}" alt="${currentElo.name}" class="reborn-active-large-icon" />
                </div>
                <div>
                  <div class="reborn-tier-tag">${currentElo.tier} · ${rateData.label}</div>
                  <h3 class="reborn-active-title">Título: Elo ${currentElo.name}</h3>
                  <p class="reborn-active-desc">Concede bônus estatísticos permanentes enquanto o título estiver ativo no personagem.</p>
                </div>
              </div>

              <!-- CUSTOS DO ELO -->
              <div class="reborn-costs-summary">
                <div class="reborn-cost-box">
                  <span class="cost-lbl">Custo deste Elo</span>
                  <strong>🪙 ${fmtCoins(currentElo.coins)}</strong>
                  <small>💰 ${fmtZeny(currentElo.zeny)}</small>
                </div>
                <div class="reborn-cost-box accumulated">
                  <span class="cost-lbl">Custo Total Acumulado (1 ao ${currentElo.index})</span>
                  <strong>🪙 ${fmtCoins(accCost.totalCoins)}</strong>
                  <small>💰 ${fmtZeny(accCost.totalZeny)}</small>
                </div>
              </div>
            </div>

            <!-- GRADE DE BÔNUS CONCEDIDOS -->
            <h4 class="reborn-bonuses-heading">📊 Bônus Concedidos com o Elo ${currentElo.name} (${state.selectedRate}):</h4>
            <div class="reborn-bonuses-grid">
              
              <div class="reborn-bonus-chip highlight-offense">
                <span class="bonus-lbl">⚔️ ATQ / MATQ</span>
                <strong>+${rateData.atk_matk[eloIdx]}</strong>
              </div>

              <div class="reborn-bonus-chip highlight-offense">
                <span class="bonus-lbl">💥 Dano Físico / Mágico / Distância</span>
                <strong>+${rateData.damage_pct[eloIdx]}%</strong>
              </div>

              <div class="reborn-bonus-chip highlight-utility">
                <span class="bonus-lbl">🏃 Velocidade de Movimento</span>
                <strong>+${rateData.speed_pct[eloIdx]}%</strong>
              </div>

              <div class="reborn-bonus-chip highlight-drop">
                <span class="bonus-lbl">💎 Taxa de Drop de Itens</span>
                <strong>+${rateData.drop_rate_pct[eloIdx]}%</strong>
              </div>

              <div class="reborn-bonus-chip">
                <span class="bonus-lbl">🎯 Crítico / Res. Crítico</span>
                <strong>+${rateData.crit[eloIdx]} <small>/ ${rateData.crit_res[eloIdx] ? '+' + rateData.crit_res[eloIdx] : '—'}</small></strong>
              </div>

              <div class="reborn-bonus-chip">
                <span class="bonus-lbl">👁️ Precisão / Esquiva</span>
                <strong>+${rateData.hit[eloIdx]} <small>/ +${rateData.flee[eloIdx]} (Flee)</small></strong>
              </div>

              <div class="reborn-bonus-chip">
                <span class="bonus-lbl">✨ Esquiva Perfeita</span>
                <strong>${rateData.perfect_flee[eloIdx] ? '+' + rateData.perfect_flee[eloIdx] : '—'}</strong>
              </div>

              <div class="reborn-bonus-chip highlight-defense">
                <span class="bonus-lbl">🛡️ Hard DEF / Soft DEF</span>
                <strong>+${rateData.hard_def[eloIdx]} <small>/ +${rateData.soft_def[eloIdx]}</small></strong>
              </div>

              <div class="reborn-bonus-chip highlight-defense">
                <span class="bonus-lbl">🔮 Hard MDEF / Soft MDEF</span>
                <strong>+${rateData.hard_mdef[eloIdx]} <small>/ +${rateData.soft_mdef[eloIdx]}</small></strong>
              </div>

              <div class="reborn-bonus-chip highlight-hp">
                <span class="bonus-lbl">❤️ HP Máximo / SP Máximo</span>
                <strong>+${rateData.max_hp[eloIdx]} HP <small>/ +${rateData.max_sp[eloIdx]} SP</small></strong>
              </div>

              <div class="reborn-bonus-chip">
                <span class="bonus-lbl">🩸 Regeneração HP/SP (a cada 10s)</span>
                <strong>+${rateData.hp_sp_regen_pct[eloIdx]}%</strong>
              </div>

              <div class="reborn-bonus-chip">
                <span class="bonus-lbl">💀 Recupera ao Derrotar Monstro</span>
                <strong>+${rateData.hp_on_kill[eloIdx]} HP <small>/ +${rateData.sp_on_kill[eloIdx]} SP</small></strong>
              </div>

              <div class="reborn-bonus-chip highlight-pvp">
                <span class="bonus-lbl">⚔️ Redução Dano de Jogadores (PvP)</span>
                <strong>+${rateData.player_res_pct[eloIdx]}%</strong>
              </div>

              <div class="reborn-bonus-chip highlight-allstats">
                <span class="bonus-lbl">👑 Todos os Atributos (STR/AGI/VIT/INT/DEX/LUK)</span>
                <strong>${rateData.all_stats[eloIdx] ? '+' + rateData.all_stats[eloIdx] + ' em Todos os Atributos' : 'Desbloqueia no Grão Mestre (+1) a Monarca (+3)'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- TABELA MATRIZ OFICIAL COMPLETA -->
        <div class="reborn-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <h3 class="reborn-section-title" style="margin:0;"><span>📋</span> Matriz Oficial de Todos os Elos (${state.selectedRate})</h3>
            <span style="font-size:12px; color:var(--text-muted);">Valores extraídos oficialmente da Wiki AureumRO</span>
          </div>

          <div class="reborn-table-container">
            <table class="reborn-full-table">
              <thead>
                <tr>
                  <th class="sticky-col">Bônus / Métrica</th>
                  ${ELOS.map(e => `
                    <th class="${e.index === state.selectedEloIndex ? 'selected-col' : ''}">
                      <img src="${e.icon}" alt="" class="table-elo-ico" />
                      <span>${e.name}</span>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="sticky-col metric-title">🪙 Aureum Coin</td>
                  ${ELOS.map(e => `<td>${e.coins.toLocaleString('pt-BR')}</td>`).join('')}
                </tr>
                <tr>
                  <td class="sticky-col metric-title">💰 Zeny</td>
                  ${ELOS.map(e => `<td>${(e.zeny / 1000000)}M</td>`).join('')}
                </tr>
                ${METRICS.map(m => `
                  <tr>
                    <td class="sticky-col metric-title">${m.label}</td>
                    ${ELOS.map((e, idx) => {
                      const val = rateData[m.key]?.[idx];
                      const formatted = val === 0 || val == null ? '—' : (m.unit === '%' ? `+${val}%` : `+${val}`);
                      const isHighlighted = idx === state.selectedEloIndex - 1;
                      const isStats = m.key === 'all_stats' && val > 0;
                      return `<td class="${isHighlighted ? 'selected-col' : ''} ${isStats ? 'gold-cell' : ''}">${formatted}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <p class="reborn-table-footnote">
            💡 <b>Regras Oficiais:</b> A recuperação de HP/SP ao derrotar inimigo funciona com ataques físicos e mágicos. A regeneração passiva ocorre a cada 10 segundos. Apenas 1 título de Elo fica ativo por vez.
          </p>
        </div>

        <!-- BENEFÍCIOS DO SISTEMA PARA A COMUNIDADE -->
        <div class="reborn-section">
          <h3 class="reborn-section-title"><span>🌍</span> Por que o Sistema de Reborn Mantém o Servidor Vivo?</h3>
          <div class="reborn-benefits-grid">
            <div class="reborn-benefit-box">
              <div class="benefit-icon">🎯</div>
              <h4>Objetivo Contínuo no Endgame</h4>
              <p>Chegar ao 99 não é o fim da linha. O sistema de 10 Elos proporciona metas duradouras para os jogadores mais dedicados, sem criar desbalanceamentos repentinos.</p>
            </div>

            <div class="reborn-benefit-box">
              <div class="benefit-icon">🤝</div>
              <h4>Grupos e Parties para Iniciantes</h4>
              <p>Como os veteranos renascem no nível 1 para avançar nos elos, sempre há personagens fortes jogando em mapas de nível baixo e médio, facilitando a formação de grupos com novatos.</p>
            </div>

            <div class="reborn-benefit-box">
              <div class="benefit-icon">🗺️</div>
              <h4>Mapas e Caçadas Sempre Ativas</h4>
              <p>O fluxo contínuo de jogadores evoluindo impede que os campos e calabouços fiquem desertos, mantendo a economia de drops básicos e o comércio de consumíveis aquecido.</p>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  function setRate(rate) {
    if (!RATE_DATA[rate]) return;
    state.selectedRate = rate;
    render();
  }

  function setElo(index) {
    if (index < 1 || index > 10) return;
    state.selectedEloIndex = index;
    render();
  }

  function copyNavi(element) {
    const text = '/navi prontera 174/189';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback(element);
      });
    } else {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showCopyFeedback(element);
    }
  }

  function showCopyFeedback(el) {
    const badge = el.querySelector('.navi-copy-badge');
    if (badge) {
      const old = badge.textContent;
      badge.textContent = 'Copiado! ✅';
      badge.style.background = 'rgba(34, 197, 94, 0.3)';
      badge.style.color = '#86efac';
      setTimeout(() => {
        badge.textContent = old;
        badge.style.background = '';
        badge.style.color = '';
      }, 2000);
    }
  }

  return {
    render,
    setRate,
    setElo,
    copyNavi,
    ELOS,
    RATE_DATA,
    METRICS
  };
});
