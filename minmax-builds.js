(function initMinMaxBuilds(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MinMaxBuilds = api;
  if (root) root.MinMaxBuilds = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMinMaxBuilds() {
  'use strict';

  const CLASSES_DATA = [
    {
      id: 'sniper',
      name: 'Atirador de Elite (Sniper)',
      category: 'Arqueiro Transclasse',
      sprite: 'assets/sprites/classes/HUNTER_H.gif',
      fallbackSprite: 'assets/sprites/classes/HUNTER.gif',
      role: 'DPS Físico de Longo Alcance & Crítico em Área',
      tags: ['Dano Crítico em Área', 'Insta-Cast / Spam', 'Auto-Falcon ASPD 190', 'Excelente para Farm & MVP'],
      difficulty: 'Média',
      summary: 'O Atirador de Elite é a evolução suprema do Caçador no AureumRO. Possui a habilidade devastadora Tiro Preciso (Sharp Shooting), que causa dano crítico em área com recarga de apenas 0,5s e +35% de taxa crítica nativa. Também se destaca como uma metralhadora de falcão com ASPD 190 e possui a Rajada de Flechas com dano dobrado no 3º hit.',
      mechanics: [
        '🎯 <b>Tiro Preciso (SS):</b> 35% de taxa crítica embutida na habilidade + 0,5s de recarga rápida.',
        '🏹 <b>Rajada de Flechas Buffada:</b> A cada 3 utilizações, o 3º hit causa 2x de dano.',
        '🦅 <b>Ataque Aéreo Contínuo:</b> Escala com INT e DES, ativado automaticamente pela SOR do personagem.'
      ],
      builds: [
        {
          id: 'sniper-ss-crit',
          name: 'Tiro Preciso (Sharp Shooting Crit Endgame)',
          badge: 'META ENDGAME',
          focus: 'Dano Crítico Massivo em Área · 100% Crítico Efetivo · 0s Cast Variável',
          description: 'A build definitiva para MVP, instâncias e mobbing. Com 65 de Crítico no Alt+Q e +35% de Crítico nativo do Tiro Preciso, todos os disparos em área são 100% críticos garantidos. Alcança 190 de ASPD para spam máximo no delay de 0,5s.',
          stats: { str: 1, agi: 90, vit: 40, int: 1, dex: 99, luk: 60 },
          derivedGoals: {
            aspd: '188 ~ 190',
            crit: '65% (100% com skill)',
            castTime: '0.00s (Insta-Cast)',
            hp: '9.500 ~ 11.500',
            dpsTier: 'S+ (Altíssimo)'
          },
          equipment: [
            { slot: 'Topo', name: 'Chapéu Negro de Borobudur [1]', card: 'Carta Vanberk (+100 Crit Proc / +2 FOR)', desc: '+2 DEX, +2 All Stats e chance de +100% de Crítico.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+1 DEX, +3% ATQ e dano físico à distância.' },
            { slot: 'Baixo', name: 'Balão de Poring', card: 'Sem slot', desc: '+2 All Stats, +2% ASPD e velocidade de movimento.' },
            { slot: 'Armadura', name: 'Traje do Atirador [1]', card: 'Carta Porcellio (+25 ATQ)', desc: 'Reduz o delay de habilidades e aumenta dano crítico à distância.' },
            { slot: 'Arma', name: 'Arco de Caça [1] (+9 ou +10)', card: 'Carta Cavaleiro do Abismo (+25% MVP) ou Carta Hidra', desc: 'Com Flechas de Caça equipadas, concede +50% de Dano à Distância.' },
            { slot: 'Capa', name: 'Pedaço de Pele do Dragão [1]', card: 'Carta Menblatt (+1% Dano Ranged a cada 10 DEX)', desc: 'Bônus massivo de resistência elemental e dano ranged escalando com DEX.' },
            { slot: 'Calçado', name: 'Botas Aladas [1] / Sapatos da Maré [1]', card: 'Carta Soldado Atirador (+10% HP/SP e +10% Dano Crítico)', desc: '+10% de Dano Crítico com refino alto e bônus de sobrevivência.' },
            { slot: 'Acessório 1', name: 'Luva do Atirador [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Maximiza a Destreza para atingir o Insta-Cast de Tiro Preciso.' },
            { slot: 'Acessório 2', name: 'Luva do Atirador [1] / Anel de Caveira [1]', card: 'Carta Kuku (+10% Dano Crítico)', desc: 'Amplifica o multiplicador de dano crítico final.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Tempo de Conjuração Variável.' },
            { name: 'Alma de Antique Firelock', effect: '+1% de Dano à Distância a cada 2 refinos de armadura/capa/bota.' },
            { name: 'Alma de Ragged', effect: '+4 DEX permanente.' },
            { name: 'Alma de Khalitzburg', effect: '+3 DEX permanente.' },
            { name: 'Alma de Injustiçado', effect: 'Chance de autocast de Apunhalar nv 1 (2 hits no AureumRO).' }
          ],
          combatStrategy: 'Mantenha Concentração e Visão Real ativas permanentemente. Posicione o Tiro Preciso no centro do mob para aproveitar o cone de dano crítico em área. Use flechas elementais conforme a fraqueza do monstro.'
        },
        {
          id: 'sniper-auto-falcon',
          name: 'Falcoeiro Metralhadora (AutoCast Falcon / ASPD 190)',
          badge: 'FARM & SUSTENTO',
          focus: 'ASPD 190 Máxima · Disparos Automáticos Contínuos do Falcão · Baixo Custo',
          description: 'A clássica e divertida build de Falcoeiro elevada ao nível Min-Max. Utiliza a velocidade máxima de 190 ASPD para acionar o falcão continuamente sem gastar SP, causando dano físico que ignora a defesa do alvo.',
          stats: { str: 1, agi: 99, vit: 25, int: 50, dex: 70, luk: 65 },
          derivedGoals: {
            aspd: '190.0 (Cap Máximo)',
            falconRate: '~22% por hit',
            falconDmg: '1.400 ~ 1.800 (Ignora DEF)',
            hp: '8.200 ~ 9.500',
            dpsTier: 'A (Contínuo e Econômico)'
          },
          equipment: [
            { slot: 'Topo', name: 'Boina Alada / Chapéu de Bebê Dragão [1]', card: 'Carta Louva-a-Deus (+3 FOR) ou Carta Bafomé Jr.', desc: 'Aumenta ASPD e taxa de acionamento crítico/automático.' },
            { slot: 'Meio', name: 'Asas de Falcão / Olhos Biônicos', card: 'Sem slot', desc: '+1 All Stats e bônus de velocidade de ataque.' },
            { slot: 'Baixo', name: 'Balão de Poring', card: 'Sem slot', desc: '+2 AGI e velocidade de movimento para kite.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Peco Peco (+10% HP) ou Carta Porcellio', desc: '+1 AGI base e slots de reforço.' },
            { slot: 'Arma', name: 'Gakkung [2] (+10) ou Arco Composto [4]', card: 'Carta Drosera (+15 Crit à distância) / Carta Cecil Damon', desc: 'Maximiza a velocidade e a taxa de acertos rápidos.' },
            { slot: 'Capa', name: 'Sobrepeliz do Falcão [1]', card: 'Carta Sussurro (+20 Esquiva) ou Carta Baphomet Jr.', desc: 'Aumenta AGI e sobrevivência solo.' },
            { slot: 'Calçado', name: 'Botas Leves [1]', card: 'Carta Matyr (+10% HP e +1 AGI)', desc: 'Concede velocidade de locomoção e bônus de AGI.' },
            { slot: 'Acessório 1', name: 'Broche [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Essencial para atingir 190 ASPD exato.' },
            { slot: 'Acessório 2', name: 'Broche [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Garante o teto de velocidade sem depender de consumíveis caros.' }
          ],
          souls: [
            { name: 'Alma de Tritão', effect: 'Concede +2% ASPD e dano com arco.' },
            { name: 'Alma de Poring', effect: '+1% de Drop rate para farm solo contínuo.' },
            { name: 'Alma de Alicel', effect: '+5 Esquiva Perfeita para kite seguro.' },
            { name: 'Alma de Mastering', effect: '+10% de Drop de itens em todos os monstros.' }
          ],
          combatStrategy: 'Ative Concentração e Garra de Falcão. Ataque à distância em modo automático enquanto o falcão bombardeia o alvo sem consumir flechas ou SP.'
        },
        {
          id: 'sniper-double-strafe',
          name: 'Rajada de Flechas (Burst 2x 3º Hit)',
          badge: 'BURST SOLO',
          focus: 'Aproveitamento Máximo do Rework da Rajada · Dano Rápido e Seguro',
          description: 'Desenvolvida especificamente para a mecânica do AureumRO, onde a cada 3 Rajadas de Flechas a 3ª desfere o DOBRO de dano. Excelente para eliminar alvos rapidamente em mapas de hunt solo.',
          stats: { str: 1, agi: 85, vit: 45, int: 20, dex: 99, luk: 30 },
          derivedGoals: {
            aspd: '185 ~ 188',
            burstHit: '10.000+ no 3º disparo',
            spCost: 'Reduzido em 20%',
            hp: '9.800 ~ 11.000',
            dpsTier: 'A+ (Burst Rápido)'
          },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Ulle [1]', card: 'Carta Isilla (+INT e chance de -50% cast)', desc: 'Reduz o consumo de SP em 10%.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+1 DEX e +3% Dano à distância.' },
            { slot: 'Baixo', name: 'Pergaminho de Ninjutsu', card: 'Sem slot', desc: '+1% ATQ e redução de consumo.' },
            { slot: 'Armadura', name: 'Traje de Caça [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+2 DEX e +25 ATQ fixo.' },
            { slot: 'Arma', name: 'Arco de Caça [1] com Flechas de Caça', card: 'Carta Esqueleto Operário / Carta Hidra', desc: '+50% de dano à distância com flechas correspondentes.' },
            { slot: 'Capa', name: 'Pedaço de Pele do Dragão [1]', card: 'Carta Menblatt (+Dano Ranged por DEX)', desc: 'Escalamento de dano direto por DEX.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx e regeneração)', desc: 'Sustento contínuo de SP para spam de Rajada.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: '+4 DEX total para fechar tiers de ATQ.' },
            { slot: 'Acessório 2', name: 'Clipe de Ouro [1]', card: 'Carta Fen (Conjuração ininterrupta) ou Carta Zerom', desc: 'Garante que os disparos não sejam interrompidos ao tomar dano.' }
          ],
          souls: [
            { name: 'Alma de Alphoccio', effect: 'A cada 2 Rajadas a terceira aplica hits extras.' },
            { name: 'Alma de Anolian', effect: 'Concede Mãos Leves e Furto mesmo usando arco.' },
            { name: 'Alma de Archdam', effect: 'Redução de tempo de conjuração.' }
          ],
          combatStrategy: 'Dispare em sequência de 3 hits para engatilhar o multiplicador 2x. Perfeito para caçar monstros médios e grandes com alta eficiência de munição.'
        }
      ]
    }
  ];

  let selectedClassId = 'sniper';
  let selectedBuildId = 'sniper-ss-crit';

  function getSelectedClass() {
    return CLASSES_DATA.find(c => c.id === selectedClassId) || CLASSES_DATA[0];
  }

  function getSelectedBuild() {
    const cls = getSelectedClass();
    return cls.builds.find(b => b.id === selectedBuildId) || cls.builds[0];
  }

  function loadBuildIntoSimulator(build) {
    if (!build) return;

    // Set simulator level and attributes
    if (typeof $ === 'function') {
      const simNivel = $('sim-nivel');
      if (simNivel) simNivel.value = 99;

      const simStr = $('sim-str'); if (simStr) simStr.value = build.stats.str;
      const simAgi = $('sim-agi'); if (simAgi) simAgi.value = build.stats.agi;
      const simVit = $('sim-vit'); if (simVit) simVit.value = build.stats.vit;
      const simInt = $('sim-int'); if (simInt) simInt.value = build.stats.int;
      const simDex = $('sim-dex'); if (simDex) simDex.value = build.stats.dex;
      const simLuk = $('sim-luk'); if (simLuk) simLuk.value = build.stats.luk;

      const simName = $('sim-build-name');
      if (simName) simName.value = build.name;

      const simArmaTipo = $('sim-arma-tipo');
      if (simArmaTipo) simArmaTipo.value = 'Arco';

      const simAtaqueTipo = $('sim-ataque-tipo');
      if (simAtaqueTipo) {
        if (build.id.includes('ss')) simAtaqueTipo.value = 'focused_arrow';
        else if (build.id.includes('double')) simAtaqueTipo.value = 'double_strafe';
        else simAtaqueTipo.value = 'basico';
      }

      // Save build into local profile
      if (typeof saveProfile === 'function') saveProfile();
      if (typeof refreshCharacterSummary === 'function') refreshCharacterSummary();

      // Navigate to simulator page
      if (typeof navigateTo === 'function') {
        navigateTo('simulator');
      } else {
        location.hash = '#simulator';
      }
    }
  }

  function render(containerId = 'minmax-builds-content') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentClass = getSelectedClass();
    const currentBuild = getSelectedBuild();

    container.innerHTML = `
      <div class="minmax-container">
        <!-- CLASS SELECTOR TABS -->
        <div class="minmax-class-tabs">
          ${CLASSES_DATA.map(cls => `
            <button type="button" class="minmax-class-tab ${cls.id === selectedClassId ? 'active' : ''}" data-minmax-class="${cls.id}">
              <img src="${cls.sprite}" alt="${cls.name}" class="minmax-tab-sprite" onerror="this.src='${cls.fallbackSprite}'">
              <div>
                <strong>${cls.name}</strong>
                <small>${cls.category}</small>
              </div>
            </button>
          `).join('')}
        </div>

        <!-- HERO CARD DA CLASSE COM AVATAR ANIMADO -->
        <section class="minmax-hero-card">
          <div class="minmax-hero-avatar-wrap">
            <div class="minmax-hero-avatar-glow"></div>
            <img src="${currentClass.sprite}" alt="${currentClass.name}" class="minmax-hero-sprite" onerror="this.src='${currentClass.fallbackSprite}'">
            <span class="minmax-hero-class-label">${currentClass.category}</span>
          </div>

          <div class="minmax-hero-info">
            <div class="minmax-hero-topline">
              <span class="minmax-hero-role">${currentClass.role}</span>
              <span class="minmax-hero-diff">Dificuldade: <b>${currentClass.difficulty}</b></span>
            </div>
            <h2>${currentClass.name}</h2>
            <p>${currentClass.summary}</p>

            <div class="minmax-hero-tags">
              ${currentClass.tags.map(t => `<span class="minmax-tag">✦ ${t}</span>`).join('')}
            </div>

            <div class="minmax-hero-mechanics">
              <strong>Mecânicas Específicas do Servidor AureumRO:</strong>
              <ul>
                ${currentClass.mechanics.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          </div>
        </section>

        <!-- BUILDS SWITCHER TABS -->
        <div class="minmax-build-tabs-wrap">
          <span class="minmax-section-eyebrow">BUILDS MIN-MAXING RECOMENDADAS</span>
          <div class="minmax-build-tabs">
            ${currentClass.builds.map(b => `
              <button type="button" class="minmax-build-tab ${b.id === currentBuild.id ? 'active' : ''}" data-minmax-build="${b.id}">
                <span class="minmax-build-badge">${b.badge}</span>
                <strong>${b.name}</strong>
                <small>${b.focus}</small>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- ACTIVE BUILD DETAIL CARD -->
        <section class="minmax-build-detail-card">
          <header class="minmax-build-detail-head">
            <div>
              <span class="minmax-tag gold">${currentBuild.badge}</span>
              <h3>${currentBuild.name}</h3>
              <p>${currentBuild.description}</p>
            </div>
            <div class="minmax-build-actions">
              <button type="button" class="minmax-btn-apply" id="btnApplyMinMaxBuild">
                <span>⚡ Carregar no Simulador de Batalha</span>
              </button>
            </div>
          </header>

          <div class="minmax-build-detail-body">
            <!-- ATRIBUTOS & METAS DERIVADAS -->
            <div class="minmax-stats-column">
              <div class="minmax-subcard">
                <h4>📊 Atributos Finais 99/70</h4>
                <div class="minmax-stats-grid">
                  <div class="minmax-stat-cell"><span>FOR</span><strong>${currentBuild.stats.str}</strong></div>
                  <div class="minmax-stat-cell highlight"><span>AGI</span><strong>${currentBuild.stats.agi}</strong></div>
                  <div class="minmax-stat-cell"><span>VIT</span><strong>${currentBuild.stats.vit}</strong></div>
                  <div class="minmax-stat-cell"><span>INT</span><strong>${currentBuild.stats.int}</strong></div>
                  <div class="minmax-stat-cell highlight"><span>DES</span><strong>${currentBuild.stats.dex}</strong></div>
                  <div class="minmax-stat-cell highlight"><span>SOR</span><strong>${currentBuild.stats.luk}</strong></div>
                </div>
              </div>

              <div class="minmax-subcard">
                <h4>🎯 Metas & Métricas da Build</h4>
                <ul class="minmax-derived-list">
                  <li><span>ASPD Alvo:</span> <b>${currentBuild.derivedGoals.aspd}</b></li>
                  <li><span>Taxa de Crítico:</span> <b>${currentBuild.derivedGoals.crit || 'N/A'}</b></li>
                  <li><span>Tempo de Cast:</span> <b>${currentBuild.derivedGoals.castTime || currentBuild.derivedGoals.falconRate || '0.00s'}</b></li>
                  <li><span>HP Médio (99):</span> <b>${currentBuild.derivedGoals.hp}</b></li>
                  <li><span>Tier de DPS:</span> <b class="gold">${currentBuild.derivedGoals.dpsTier}</b></li>
                </ul>
              </div>

              <div class="minmax-subcard">
                <h4>⚔️ Estratégia de Combate</h4>
                <p class="minmax-strategy-text">${currentBuild.combatStrategy}</p>
              </div>
            </div>

            <!-- EQUIPAMENTOS & CARTAS (ALT+Q) -->
            <div class="minmax-equip-column">
              <div class="minmax-subcard">
                <h4>🛡️ Alt+Q Otimizado (Equipamentos & Cartas)</h4>
                <div class="minmax-equip-list">
                  ${currentBuild.equipment.map(eq => `
                    <div class="minmax-equip-row">
                      <span class="minmax-equip-slot">${eq.slot}</span>
                      <div class="minmax-equip-data">
                        <strong>${eq.name}</strong>
                        <small class="card-name">🎴 ${eq.card}</small>
                        <p>${eq.desc}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- ALMAS RECOMENDADAS -->
              <div class="minmax-subcard">
                <h4>✨ Almas de Monstros Sinergéticas</h4>
                <div class="minmax-souls-grid">
                  ${currentBuild.souls.map(soul => `
                    <div class="minmax-soul-chip">
                      <strong>${soul.name}</strong>
                      <span>${soul.effect}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    bindEvents(containerId);
  }

  function bindEvents(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Switch class
    container.querySelectorAll('[data-minmax-class]').forEach(btn => {
      btn.onclick = () => {
        selectedClassId = btn.dataset.minmaxClass;
        const cls = getSelectedClass();
        selectedBuildId = cls.builds[0]?.id || '';
        render(containerId);
      };
    });

    // Switch build
    container.querySelectorAll('[data-minmax-build]').forEach(btn => {
      btn.onclick = () => {
        selectedBuildId = btn.dataset.minmaxBuild;
        render(containerId);
      };
    });

    // Apply build to simulator
    const applyBtn = container.querySelector('#btnApplyMinMaxBuild');
    if (applyBtn) {
      applyBtn.onclick = () => {
        const build = getSelectedBuild();
        loadBuildIntoSimulator(build);
      };
    }
  }

  return {
    CLASSES_DATA,
    render,
    loadBuildIntoSimulator
  };
});

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.MinMaxBuilds?.render('minmax-builds-content');
    });
  } else {
    window.MinMaxBuilds?.render('minmax-builds-content');
  }
}
