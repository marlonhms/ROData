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
      tree: 'archer',
      category: 'Arqueiro Transclasse',
      sprite: 'assets/sprites/classes/HUNTER_H.gif',
      role: 'DPS Físico de Longo Alcance & Crítico em Área',
      tags: ['Crítico em Área 100%', 'Insta-Cast / 190 ASPD', 'Auto-Falcon Metralhadora', 'Rajada 2x no 3º Hit'],
      difficulty: 'Média',
      summary: 'O Atirador de Elite é a evolução suprema do Arqueiro no AureumRO. Possui a habilidade devastadora Tiro Preciso (Sharp Shooting) com +35% de taxa crítica nativa e 0,5s de recarga rápida, além da Rajada de Flechas com dano dobrado no 3º hit.',
      mechanics: [
        '🎯 <b>Tiro Preciso (SS):</b> Possui +35% de taxa crítica nativa embutida + 0,5s de recarga.',
        '🏹 <b>Rajada de Flechas Buffada:</b> A cada 3 utilizações, o 3º hit desfere o dobro (2x) de dano.',
        '🦅 <b>Ataque Aéreo Contínuo:</b> Escala com INT e DES, ativado automaticamente pela SOR do personagem.'
      ],
      builds: [
        {
          id: 'sniper-ss-crit',
          name: 'Tiro Preciso (Sharp Shooting Crit Endgame)',
          badge: 'META ENDGAME',
          focus: 'Dano Crítico Massivo em Área · 100% Crítico Efetivo · 0s Cast Variável',
          description: 'A build definitiva para MVP, instâncias e mobbing. Com 65 de Crítico no Alt+Q e +35% nativo do Tiro Preciso, todos os disparos em área são 100% críticos garantidos. Alcança 190 de ASPD para spam máximo no delay de 0,5s.',
          stats: { str: 1, agi: 80, vit: 35, int: 1, dex: 99, luk: 50 },
          derivedGoals: { aspd: '188 ~ 190', crit: '65% (100% com skill)', castTime: '0.00s (Insta-Cast)', hp: '9.500 ~ 11.500', dpsTier: 'S+ (Altíssimo)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu do Capitão [1]', card: 'Carta Vanberk (+100 Crit Proc / +2 FOR)', desc: '+2 DEX, +2 All Stats e chance de +100% de Crítico.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+1 DEX, +3% ATQ e dano físico à distância.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats, +2% ASPD e velocidade de movimento.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: 'Reduz delay de habilidades e amplifica dano ranged.' },
            { slot: 'Arma', name: 'Arco Composto [4] (+10) / Gakkung [2] (+10)', card: 'Carta Cavaleiro do Abismo (+25% MVP) / Carta Hidra', desc: 'Arco Composto [4] com 4 cartas de dano (Abismo/Hidra) para maior DPS.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Menblatt (+1% Dano Ranged a cada 10 DEX)', desc: 'Bônus massivo de resistência e dano ranged escalando com DEX.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1] / Botas [1]', card: 'Carta Soldado Atirador (+10% HP/SP e +10% Crit Dmg)', desc: '+10% Dano Crítico com refino alto e bônus de sobrevivência.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Maximiza a Destreza para atingir o Insta-Cast de Tiro Preciso.' },
            { slot: 'Acessório 2', name: 'Luva [1] / Anel de Caveira [1]', card: 'Carta Kuku (+10% Dano Crítico)', desc: 'Amplifica o multiplicador de dano crítico final.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Tempo de Conjuração Variável.' },
            { name: 'Alma de Antique Firelock', effect: '+1% de Dano à Distância a cada 2 refinos de armadura/capa/bota.' },
            { name: 'Alma de Ragged', effect: '+4 DEX permanente.' },
            { name: 'Alma de Khalitzburg', effect: '+3 DEX permanente.' },
            { name: 'Alma de Injustiçado', effect: 'Chance de autocast de Apunhalar nv 1 (2 hits no AureumRO).' }
          ],
          combatStrategy: 'Mantenha Concentração e Visão Real ativas permanentemente. Posicione o Tiro Preciso no centro do mob para aproveitar o cone de dano crítico em área.'
        },
        {
          id: 'sniper-auto-falcon',
          name: 'Falcoeiro Metralhadora (AutoCast Falcon / ASPD 190)',
          badge: 'FARM & SUSTENTO',
          focus: 'ASPD 190 Máxima · Disparos Automáticos Contínuos do Falcão · Baixo Custo',
          description: 'A clássica e divertida build de Falcoeiro elevada ao nível Min-Max. Utiliza a velocidade máxima de 190 ASPD para acionar o falcão continuamente sem gastar SP, causando dano físico que ignora a defesa do alvo.',
          stats: { str: 1, agi: 90, vit: 25, int: 42, dex: 70, luk: 60 },
          derivedGoals: { aspd: '190.0 (Cap Máximo)', crit: '35% (Base)', castTime: 'N/A (Ataque Básico)', hp: '8.200 ~ 9.500', dpsTier: 'A (Contínuo e Econômico)' },
          equipment: [
            { slot: 'Topo', name: 'Boina Alada / Chapéu de Bebê Dragão [1]', card: 'Carta Louva-a-Deus (+3 FOR) / Carta Bafomé Jr.', desc: 'Aumenta ASPD e taxa de acionamento automático.' },
            { slot: 'Meio', name: 'Olhos Biônicos / Olhos Biônicos', card: 'Sem slot', desc: '+1 All Stats e bônus de velocidade de ataque.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 AGI e velocidade de movimento para kite.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Peco Peco (+10% HP) / Carta Porcellio', desc: '+1 AGI base e slots de reforço.' },
            { slot: 'Arma', name: 'Gakkung [2] (+10) / Arco Composto [4]', card: 'Carta Drosera (+15 Crit Ranged) / Carta Cecil Damon', desc: 'Maximiza a velocidade e a taxa de acertos rápidos.' },
            { slot: 'Capa', name: 'Sobrepeliz do Falcão [1]', card: 'Carta Sussurro (+20 Esquiva) / Carta Baphomet Jr.', desc: 'Aumenta AGI e sobrevivência solo.' },
            { slot: 'Calçado', name: 'Sapatos [1] / Botas [1]', card: 'Carta Matyr (+10% HP e +1 AGI)', desc: 'Concede velocidade de locomoção e bônus de AGI.' },
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
          stats: { str: 1, agi: 88, vit: 46, int: 20, dex: 99, luk: 1 },
          derivedGoals: { aspd: '185 ~ 188', crit: '15%', castTime: 'Instantâneo', hp: '9.800 ~ 11.000', dpsTier: 'A+ (Burst Rápido)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu do Capitão [1]', card: 'Carta Isilla (+INT e chance de -50% cast)', desc: 'Reduz o consumo de SP em 10%.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+1 DEX e +3% Dano à distância.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica', card: 'Sem slot', desc: '+1% ATQ e redução de consumo.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+2 DEX e +25 ATQ fixo.' },
            { slot: 'Arma', name: 'Arco Composto [4] (+10) / Gakkung [2] (+10)', card: 'Carta Esqueleto Operário / Carta Hidra', desc: '+50% de dano à distância com flechas correspondentes.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Menblatt (+Dano Ranged por DEX)', desc: 'Escalamento de dano direto por DEX.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx e regeneração)', desc: 'Sustento contínuo de SP para spam de Rajada.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: '+4 DEX total para fechar tiers de ATQ.' },
            { slot: 'Acessório 2', name: 'Presilha [1]', card: 'Carta Fen (Conjuração ininterrupta) / Carta Zerom', desc: 'Garante que os disparos não sejam interrompidos.' }
          ],
          souls: [
            { name: 'Alma de Alphoccio', effect: 'A cada 2 Rajadas a terceira aplica hits extras.' },
            { name: 'Alma de Anolian', effect: 'Concede Mãos Leves e Furto mesmo usando arco.' },
            { name: 'Alma de Archdam', effect: 'Redução de tempo de conjuração.' }
          ],
          combatStrategy: 'Dispare em sequência de 3 hits para engatilhar o multiplicador 2x. Perfeito para caçar monstros médios e grandes com alta eficiência de munição.'
        }
      ]
    },
    {
      id: 'creator',
      name: 'Criador (Creator / Biochemist)',
      tree: 'merchant',
      category: 'Mercador Transclasse',
      sprite: 'assets/sprites/classes/ALCHEMIST.gif',
      role: 'DPS Híbrido Físico-Mágico (Bomba Ácida) & Suporte/Homúnculo',
      tags: ['Bomba Ácida MVP S+', 'Desconto 10 = Mammonita 0z', 'Plantas & Homúnculo', 'Criador de Poções'],
      difficulty: 'Média-Alta',
      summary: 'O Criador é o rei indiscutível do dano contra MVPs com alta VIT via Bomba Ácida (Acid Demonstration), que ignora esquiva e causa dano escalando com a INT do Criador e a VIT do alvo. Também conta com Mammonita a custo zero de zeny (Desconto 10).',
      mechanics: [
        '🧪 <b>Bomba Ácida (Acid Demo):</b> Ignora Esquiva e DEF física, escalando com INT do usuário e VIT do alvo.',
        '💰 <b>Mammonita 0 Zeny:</b> Habilidade Desconto em nível 10 elimina 100% do custo de Zeny da habilidade.',
        '🌱 <b>Cultivar Planta / Canibalismo:</b> Dano e controle territorial passivo contínuo.'
      ],
      builds: [
        {
          id: 'creator-acid-demo',
          name: 'Bomba Ácida (Acid Demo MVP Killer)',
          badge: 'META MVP S+',
          focus: 'Burst Massivo em MVPs e Chefes com Alta VIT · Insta-Cast de AD',
          description: 'A build soberana para caçar qualquer MVP do jogo. Maximiza INT e FOR para amplificar o cálculo de dano híbrido da Bomba Ácida, aliada a 0s de conjuração para spam fulminante.',
          stats: { str: 62, agi: 1, vit: 35, int: 99, dex: 70, luk: 1 },
          derivedGoals: { aspd: '175 ~ 180', castTime: '0.2s ou Insta-Cast', acidDmg: '45.000 ~ 90.000 por frasco', hp: '14.000 ~ 17.500', dpsTier: 'S+ (Líder MVP)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1] / Chapéu de Enfermeira [1]', card: 'Carta Isilla (+INT / Cast Red) / Carta Kathryne Keyron', desc: '+INT e redução direta de tempo de conjuração.' },
            { slot: 'Meio', name: 'Olhos Biônicos / Orelhas de Elfo [1]', card: 'Carta Isilla / Sem slot', desc: 'Bônus de INT/ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats e utilidade.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Marc (Imunidade a Congelamento) / Carta Porcellio', desc: 'Indestrutível em batalha com bônus de stats.' },
            { slot: 'Arma', name: 'Lâmina Turca [2] (+10) / Machado de Duas Mãos', card: 'Carta Cavaleiro do Abismo x2 (+50% dano em MVPs)', desc: 'Maximiza o multiplicador de ATQ e dano contra chefes.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Alice (-40% dano de Chefes) / Carta Tirfing', desc: 'Resistência extrema contra MVPs.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1] / Manteau [1] / Sobrepeliz [1]', card: 'Carta Raydric (-20% dano neutro)', desc: 'Resistência essencial.' },
            { slot: 'Calçado', name: 'Sapatos das Valquírias [1] / Sapatos da Maré [1]', card: 'Carta Sohee / Carta Ferus Verde (+10% HP e +1 VIT)', desc: 'Aumento de vida e sustentação de peso.' },
            { slot: 'Acessório 1', name: 'Presilha [1] / Luva [1] / Brinco [1]', card: 'Carta Zerom (+3 DEX) / Carta Errende Huan', desc: 'Reduz o pós-conjuração e cast variável.' },
            { slot: 'Acessório 2', name: 'Presilha [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Garante o spam contínuo de frascos de fogo/ácido.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável para a Bomba Ácida.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' },
            { name: 'Alma de Antique Firelock', effect: '+1% de Dano à Distância por 2 refinos (afeta AD).' }
          ],
          combatStrategy: 'Use Revestimento Total em si mesmo e no grupo. Lance Bomba Ácida continuamente no MVP mantendo distância segura com Homúnculo tankando.'
        },
        {
          id: 'creator-mammonita-farm',
          name: 'Criador Mammonita 0z (Farm Veloz)',
          badge: 'FARM & CONTROLE',
          focus: 'Mammonita Grátis · Planta Mandragora Spam · Suporte com Homúnculo',
          description: 'Exploração máxima do bônus exclusivo do AureumRO: com Desconto 10, a Mammonita custa 0 Zeny. Spam infinito de Mammonita para eliminar grupos de monstros médios enquanto Plantas e o Homúnculo auxiliam no controle.',
          stats: { str: 90, agi: 85, vit: 40, int: 1, dex: 55, luk: 1 },
          derivedGoals: { aspd: '160', acidDmg: '0z por Mammonita (Desconto 10)', castTime: 'Quase Instantâneo', hp: '17.000 ~ 20.000', dpsTier: 'A+ (Farm Eficiente)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Enfermeira [1] / Coroa de Louros [1]', card: 'Carta Isilla (+INT e Cast Red)', desc: 'INT e velocidade de conjuração.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: '+ATQM e Cast.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Peco Peco (+10% HP)', desc: 'Resistência e vida.' },
            { slot: 'Arma', name: 'Lâmina Turca [2] (+10)', card: 'Carta Necromante x2 (+2 INT / ignora MDEF)', desc: 'Maximiza o ATQM para Mammonita.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Alice (-40% dano de Chefes)', desc: 'Resistência no farm.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric', desc: 'Redução de dano.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP)', desc: 'SP para Mammonita e Bomba Ácida.' },
            { slot: 'Acessório 1', name: 'Presilha [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Cast rápido.' },
            { slot: 'Acessório 2', name: 'Presilha [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha insta-cast.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' }
          ],
          combatStrategy: 'Posicione o Homúnculo para tankar. Use Plantar Mandragora para controle e spam Mammonita a custo zero de Zeny. Farm extremamente lucrativo.'
        },
        {
          id: 'creator-plantas-homunculo',
          name: 'Criador Cultivar Plantas & Homúnculo Tanker',
          badge: 'CONTROLE & BARRICADA',
          focus: 'Cultivar Planta / Mandrágora · Homúnculo Amistr Tank · Suporte Bioquímico',
          description: 'Build tática voltada para controle de área e segurança total. Cria um campo minado de Plantas Carnívoras e Mandrágoras enquanto o Homúnculo (Amistr ou Vanilmirth) segura os MVPs e monstros mais agressivos.',
          stats: { str: 25, agi: 1, vit: 75, int: 99, dex: 60, luk: 1 },
          derivedGoals: {"aspd":"158","acidDmg":"Plantas: Dano Fixo Contínuo","castTime":"0.1s Quase Instantâneo","hp":"19.000 ~ 23.000","dpsTier":"A+ (Controle Total)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Chapéu de Enfermeira [1]",
                    "card": "Carta Isilla (+INT e -50% cast)",
                    "desc": "Conjuração rápida de plantas."
          },
          {
                    "slot": "Meio",
                    "name": "Orelhas de Elfo [1]",
                    "card": "Carta Isilla",
                    "desc": "+ATQM e atributos."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura das Valquírias [1]",
                    "card": "Carta Peco Peco (+10% HP)",
                    "desc": "Sobrevivência para o alquimista."
          },
          {
                    "slot": "Arma",
                    "name": "Lâmina Turca [2] (+10)",
                    "card": "Carta Fabre x2 (+200 HP / +2 VIT)",
                    "desc": "Mais resistência e peso."
          },
          {
                    "slot": "Escudo",
                    "name": "Escudo da Valquíria [1]",
                    "card": "Carta Alice (-40% dano de Chefes)",
                    "desc": "Defesa enquanto o pet atua."
          },
          {
                    "slot": "Capa",
                    "name": "Manto das Valquírias [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Proteção física essencial."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Ferus Verde (+10% HP / +1 VIT)",
                    "desc": "Aumenta a barra de vida."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Presilha [1] / Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Invocação rápida."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Presilha [1] / Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Fecha o tempo de cast."
          }
],
          souls: [
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo e +5% SP Máximo."
          },
          {
                    "name": "Alma de Archdam",
                    "effect": "-10% Tempo de Conjuração Variável."
          }
],
          combatStrategy: 'Invoque até 5 Plantas Mandrágoras ao redor do ponto de spawn. Posicione seu Homúnculo Amistr com Troca de Lugar para prender o MVP no centro da barricada.'
        }
      ]
    },
    {
      id: 'star_gladiator',
      name: 'Mestre Taekwon (Star Gladiator)',
      tree: 'expanded',
      category: 'Classe Expandida (Taekwon)',
      sprite: 'assets/sprites/classes/STAR_EMPEROR.gif',
      role: 'DPS Veloz de Chutes Elementais & Dano Planetário Ignora DEF',
      tags: ['União sem Link!', 'Oposições Sem Restrição', 'Fúrias com FOR e AGI', 'ASPD 190 Extrema'],
      difficulty: 'Média',
      summary: 'Com o Rework Oficial do AureumRO, o Mestre Taekwon ativa União livremente SEM necessidade de Link de Espiritualista, ignora DEF e Esquiva dos alvos marcados pelas Oposições (sem travas de HP/tamanho) e suas Fúrias escalam com FOR e AGI.',
      mechanics: [
        '☀️ <b>União Livre:</b> Pode ser ativada e desativada a qualquer momento sem Link de Espiritualista.',
        '🌙 <b>Oposições Sem Trava:</b> Qualquer monstro ou mapa pode ser marcado sem limite de HP ou tamanho.',
        '⭐ <b>Proteções Melhoradas:</b> Solar (+20 Soft DEF), Lunar (+24 Esquiva), Estelar (+8% ASPD).'
      ],
      builds: [
        {
          id: 'tk-uniao-furiosa',
          name: 'União e Fúria Planetária (Min-Max Rework)',
          badge: 'REWORK EXCLUSIVO',
          focus: 'Dano Extremo Ignora DEF e Esquiva · 190 ASPD · Chutes Planetários',
          description: 'Aproveita 100% dos novos rebalances do AureumRO. Com as Fúrias escalando com FOR e AGI e a União ativada sem Link, o Mestre Taekwon derrete qualquer alvo marcado com 190 de ASPD.',
          stats: { str: 90, agi: 85, vit: 25, int: 1, dex: 40, luk: 1 },
          derivedGoals: { aspd: '190.0 (Cap Máximo)', crit: 'Autohit (Ignora Esquiva)', defIgnore: '100% (Na União)', hp: '9.000 ~ 11.000', dpsTier: 'S (Altíssimo Dps Físico)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Bebê Dragão [1] / Boina Alada', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Aumenta ASPD e dano físico.' },
            { slot: 'Meio', name: 'Máscara do Exterminador / Olhos Biônicos', card: 'Sem slot', desc: '+1% Dano em humanoides ou +ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats e ASPD.' },
            { slot: 'Armadura', name: 'Armadura de Corrida [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+1 AGI e bônus de velocidade de movimento.' },
            { slot: 'Arma', name: 'Livro do Apocalipse [2] (+10) / Livro [3]', card: 'Carta Cavaleiro do Abismo / Carta Esqueleto Operário', desc: 'Livros de dano pesado para chutes devastadores.' },
            { slot: 'Escudo', name: 'Broquel [1] / Broquel [1]', card: 'Carta Thara (-30% Humanoide) / Carta Medusa', desc: 'Defesa e imunidade a petrificação.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Bafomé Jr. (+3 AGI / +1% Crit) / Carta Raydric', desc: 'Garante o teto de 190 ASPD.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1] / Sapatos da Maré [1]', card: 'Carta Matyr (+10% HP e +1 AGI)', desc: 'Mobilidade máxima e vida extra.' },
            { slot: 'Acessório 1', name: 'Broche [1] / Anel [1] / Broche [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Sinergia de velocidade de ataque.' },
            { slot: 'Acessório 2', name: 'Broche [1] / Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Fecha os tiers de FOR para bônus de Fúria.' }
          ],
          souls: [
            { name: 'Alma de Tritão', effect: '+2% ASPD e velocidade de ataque.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ se FOR >= 95.' },
            { name: 'Alma de Poring', effect: '+1% Drop rate para farm contínuo.' }
          ],
          combatStrategy: 'Marque o monstro desejado com Oposição Solar/Lunar/Estelar. Ative a Proteção correspondente, engatilhe a União e desfira Chutes Voadores seguidos de combos de Fúria.'
        },
        {
          id: 'tk-pvp-oposicao',
          name: 'Mestre Taekwon PvP (Oposições Sem Restrição)',
          badge: 'PVP & WOE',
          focus: 'Oposição em Qualquer Jogador · Ignora DEF/Esquiva · Proteção Solar/Lunar',
          description: 'Build de PvP pura aproveitando o rework que elimina as restrições de Oposição. Pode marcar qualquer jogador, ignorando sua DEF e Esquiva, enquanto as Proteções oferecem +20 DEF, +24 Flee e +8% ASPD.',
          stats: { str: 90, agi: 72, vit: 50, int: 1, dex: 40, luk: 1 },
          derivedGoals: { aspd: '188', crit: 'Autohit (Ignora Esquiva)', defIgnore: '100% (Na União PvP)', hp: '13.000 ~ 16.000', dpsTier: 'S (PvP / GvG Dominante)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Bebê Dragão [1] / Elmo de Osso [1]', card: 'Carta Vanberk (+100 Crit) / Carta Marduk', desc: 'Proteção contra silêncio e dano.' },
            { slot: 'Meio', name: 'Máscara do Exterminador / Olhos Biônicos', card: 'Sem slot', desc: '+1% Dano em Humanoides.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Evita ser congelado durante a União.' },
            { slot: 'Arma', name: 'Livro do Apocalipse [2] (+10)', card: 'Carta Cavaleiro do Abismo / Carta Hidra', desc: 'Dano em humanoides no PvP.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Thara (-30% humanoide)', desc: 'Redução de dano de outros jogadores.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Resistência física.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Mobilidade e vida.' },
            { slot: 'Acessório 1', name: 'Broche [1] / Anel [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Velocidade de ataque.' },
            { slot: 'Acessório 2', name: 'Broche [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Dano extra no PvP.' }
          ],
          souls: [
            { name: 'Alma de Tritão', effect: '+2% ASPD.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Marque o oponente com Oposição Solar, ative Proteção Solar (+20 DEF) e Union. Use Chute Voador para aproximar e combo de Fúria para finalizar.'
        },
        {
          id: 'tk-tornado-farm',
          name: 'Mestre Taekwon Chute do Tornado (Mob Farm 190 ASPD)',
          badge: 'FARM EM ÁREA 190 ASPD',
          focus: 'Chute do Tornado em Área · Chute Aéreo Dash · 190 ASPD Contínua',
          description: 'A melhor build de Mestre Taekwon para farmar salas lotadas de monstros em masmorras como Juperos e Magma Dungeon. Ativa Postura do Tornado e dispara chutes giratórios em área a cada fração de segundo.',
          stats: { str: 88, agi: 90, vit: 25, int: 1, dex: 36, luk: 1 },
          derivedGoals: {"aspd":"190.0 (Cap Máximo)","crit":"65% (Com Fúria Solar)","defIgnore":"Área 3x3 Contínua","hp":"11.000 ~ 13.500","dpsTier":"S (Limpeza de Hordas)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Chapéu de Bebê Dragão [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "+FOR para dano físico."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura de Corrida [1]",
                    "card": "Carta Porcellio (+25 ATQ)",
                    "desc": "+25 ATQ fixo e +1 AGI."
          },
          {
                    "slot": "Arma",
                    "name": "Livro do Apocalipse [2] (+10)",
                    "card": "Carta Cavaleiro do Abismo x2",
                    "desc": "Dano massivo contra chefes e mobs."
          },
          {
                    "slot": "Escudo",
                    "name": "Broquel [1]",
                    "card": "Carta Thara / Carta Alice",
                    "desc": "Redução de dano."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Bafomé Jr. (+3 AGI / +1% Crit)",
                    "desc": "Garante 190 ASPD."
          },
          {
                    "slot": "Calçado",
                    "name": "Botas [1] / Sapatos [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Velocidade de movimento e HP."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Broche [1] / Anel [1]",
                    "card": "Carta Kukre (+2 AGI)",
                    "desc": "Velocidade de ataque."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Broche [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "Ataque bruto."
          }
],
          souls: [
          {
                    "name": "Alma de Tritão",
                    "effect": "+2% ASPD."
          },
          {
                    "name": "Alma de Atroce",
                    "effect": "+50 ATQ fixo se FOR >= 95."
          }
],
          combatStrategy: 'Ative Postura do Tornado e Proteção Estelar. Use Chute Aéreo para saltar no meio do mob e deixe o Chute do Tornado girar sem parar a 190 ASPD limpando a tela.'
        }
      ]
    },
    {
      id: 'assassin_cross',
      name: 'Algoz (Assassin Cross)',
      tree: 'thief',
      category: 'Gatuno Transclasse',
      sprite: 'assets/sprites/classes/ASSASSIN.gif',
      role: 'DPS Físico Furtivo, Crítico Duplo EDP & Destruidor de Almas',
      tags: ['EDP 400% ATQ', 'Crítico Duplo Katar', 'Destruidor de Almas Híbrido', 'Tocaia em Área'],
      difficulty: 'Média',
      summary: 'O Algoz é uma das classes mais mortíferas no combate corpo a corpo. Com Encantar com Veneno Mortal (EDP), seu ATQ é multiplicado em 400%, transformando cada golpe duplo ou crítico em uma sentença de morte instantânea.',
      mechanics: [
        '☠️ <b>Encantar com Veneno Mortal (EDP):</b> Multiplica o dano da arma e o ATQ em 400%.',
        '⚔️ <b>Destruidor de Almas:</b> Causa dano físico e mágico simultâneo baseado em FOR e INT.',
        '🌀 <b>Lâminas Destruidoras:</b> 8 golpes massivos potencializados por EDP.'
      ],
      builds: [
        {
          id: 'sin-crit-edp',
          name: 'Algoz Crítico EDP (Katar 190 ASPD)',
          badge: 'DPS BRUTAL',
          focus: 'Dano Crítico Contínuo com Katar · Multiplicador EDP · Alta Esquiva',
          description: 'A clássica build de Algoz Crítico maximizada. Com Katar de Infiltração [1] ou Rugido Sangrento e EDP ativo, atinge 190 de ASPD desferindo acertos críticos ininterruptos que despedaçam alvos em segundos.',
          stats: { str: 90, agi: 90, vit: 35, int: 1, dex: 1, luk: 50 },
          derivedGoals: { aspd: '190.0', crit: '100% (Katar dobra Crit)', edpDmg: '400% ATQ Multiplier', hp: '10.500 ~ 12.500', dpsTier: 'S+ (Altíssimo Dps Físico)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Jiboia [1] / Boina Alada', card: 'Carta Vanberk (+100 Crit proc) / Carta Louva-a-Deus', desc: 'Chance de ataque duplo mesmo em acertos críticos.' },
            { slot: 'Meio', name: 'Olhos Biônicos / Máscara de Fugitivo', card: 'Sem slot', desc: '+ATQ e dano físico.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats e velocidade.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+1 AGI e +25 ATQ fixo.' },
            { slot: 'Arma', name: 'Infiltrador [1] (+10) / Rugido Sangrento', card: 'Carta Papel (+20% Crit Dmg) / Carta Cavaleiro do Abismo', desc: 'Katar de dano massivo que ignora defesa de humanoides ou chefes.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Sussurro (+20 Flee) / Carta Bafomé Jr.', desc: 'Esquiva e velocidade de ataque.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP e +1 AGI)', desc: 'Vida e agilidade.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Kobold (+4 Crit / +1 FOR)', desc: 'Fecha 100% de crítico na Katar.' },
            { slot: 'Acessório 2', name: 'Anel [1] / Broche [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Bônus de dano de FOR.' }
          ],
          souls: [
            { name: 'Alma de Injustiçado', effect: 'Autocast de Apunhalar nv 1 (2 hits no servidor).' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' },
            { name: 'Alma de Tritão', effect: '+2% ASPD.' }
          ],
          combatStrategy: 'Consuma Frasco de Veneno Mortal para ativar EDP. Aproxime-se em Furtividade ou Passo Esmagador e ataque até o alvo ser eliminado.'
        },
        {
          id: 'sin-soul-destroyer-pvp',
          name: 'Algoz Destruidor de Almas (PvP / WoE Híbrido)',
          badge: 'PVP HÍBRIDO',
          focus: 'Dano Físico + Mágico Simultâneo · Ignora MDEF · FOR + INT',
          description: 'Build alternativa focada no Destruidor de Almas: ataque híbrido que inflige dano físico E mágico simultaneamente escalando com FOR e INT. Ideal para surpreender alvos com alta DEF física que resistem ao EDP.',
          stats: { str: 75, agi: 1, vit: 55, int: 85, dex: 52, luk: 1 },
          derivedGoals: { aspd: '178', crit: '80% (SOR elevada)', edpDmg: 'Soul Dest.: Físico + Mágico 18k+', hp: '11.000 ~ 13.000', dpsTier: 'A+ (PvP Anti-Tank)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Jiboia [1]', card: 'Carta Vanberk (+100 Crit) ', desc: 'Críticos duplos na Katar.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Proteção contra debuffs de mago.' },
            { slot: 'Arma', name: 'Infiltrador [1] (+10)', card: 'Carta Papel (+20% Crit Dmg)', desc: 'Críticos e Destruidor de Almas potente.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Sussurro (+20 Flee)', desc: 'Esquiva alta para PvP.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e velocidade.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Kobold (+4 Crit / +1 FOR)', desc: 'Dano crítico.' },
            { slot: 'Acessório 2', name: 'Broche [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Precisão.' }
          ],
          souls: [
            { name: 'Alma de Injustiçado', effect: 'Autocast de Apunhalar (2 hits).' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Aproxime-se em furtividade. Use Destruidor de Almas como abridor de combate para cortar a MDEF e o HP simultaneamente. Finalize com EDP + Katar.'
        },
        {
          id: 'sin-dual-dagger-burst',
          name: 'Algoz Lâminas Destruidoras & Tocaia (Dual Dagger)',
          badge: 'BURST EM ÁREA & ADAGA DUPLA',
          focus: 'Lâminas Destruidoras com EDP · Tocaia das Sombras à Distância · Adaga Dupla',
          description: 'Especializada em abater grupos de inimigos usando Tocaia (Grimtooth) à distância enquanto permanece oculto pelas sombras, ou aplicar Lâminas Destruidoras instantâneas de 8 hits com o multiplicador quádruplo de EDP.',
          stats: { str: 99, agi: 75, vit: 45, int: 1, dex: 50, luk: 1 },
          derivedGoals: {"aspd":"182","crit":"Ataque Duplo 50%","edpDmg":"Lâminas: 35.000 ~ 55.000 com EDP","hp":"12.000 ~ 14.500","dpsTier":"S+ (Burst Massivo)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Elmo de Osso [1] / Chapéu de Jiboia [1]",
                    "card": "Carta Vanberk (+100 Crit)",
                    "desc": "Poder de ataque e chance de crítico."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Traje de Gatuno [1]",
                    "card": "Carta Porcellio (+25 ATQ)",
                    "desc": "+25 ATQ para Lâminas."
          },
          {
                    "slot": "Arma",
                    "name": "Gladius [3] (+10) / Adaga Venenosa / Rondel",
                    "card": "Carta Cavaleiro do Abismo / Carta Hidra",
                    "desc": "Arma primária pesada que ignora DEF."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Resistência ao mob."
          },
          {
                    "slot": "Calçado",
                    "name": "Botas [1] / Sapatos [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Vida e agilidade."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Anel [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "+FOR para teto de dano."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Anel [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Precisão para Lâminas não errarem."
          }
],
          souls: [
          {
                    "name": "Alma de Injustiçado",
                    "effect": "Autocast de Apunhalar (2 hits no servidor)."
          },
          {
                    "name": "Alma de Atroce",
                    "effect": "+50 ATQ fixo se FOR >= 95."
          }
],
          combatStrategy: 'Use Esconderijo e Tocaia para abater alvos à distância sem ser visto. Contra alvos únicos fortes, ative EDP e desfira Lâminas Destruidoras para aplicar 8 hits colossais.'
        }
      ]
    },
    {
      id: 'lord_knight',
      name: 'Lorde (Lord Knight)',
      tree: 'swordman',
      category: 'Espadachim Transclasse',
      sprite: 'assets/sprites/classes/KNIGHT_H.gif',
      role: 'DPS Físico Tanque, Lança Perfurante & Frenesi 190 ASPD',
      tags: ['Frenesi 300% HP & 190 ASPD', 'Perfurar Lança MVP', 'Espiral em Área', 'Tanque Supremo'],
      difficulty: 'Fácil-Média',
      summary: 'O Lorde combina a maior quantidade de vida do jogo com poder destrutivo impressionante. Com a habilidade Frenesi, seu HP é triplicado e sua velocidade de ataque é cravada em 190 ASPD instantaneamente.',
      mechanics: [
        '🔥 <b>Frenesi (Berserk):</b> Triplica o HP Máximo, dobra o ATQ e força a ASPD para 190.',
        '🗡️ <b>Perfurar em Espiral:</b> Dano massivo à distância que escala diretamente com o PESO da lança.',
        '🛡️ <b>Aura Sagrada & Contra-Ataque:</b> Bloqueio de dano à distância e contra-ataque automático.'
      ],
      builds: [
        {
          id: 'lk-frenesi-crit',
          name: 'Lorde Frenesi & Perfurar Lança (Berserk Mode)',
          badge: 'TANK & DPS',
          focus: 'HP Massivo (40.000+) · 190 ASPD Fixa · Dano Pesado com Lança',
          description: 'A build mais imponente para esmagar MVPs corpo a corpo ou mobbing em calabouços difíceis. Alterna entre Perfurar em Espiral com Lança de Caça pesada e Frenesi para finalização com 190 ASPD.',
          stats: { str: 99, agi: 75, vit: 60, int: 1, dex: 30, luk: 1 },
          derivedGoals: { aspd: '190.0 (No Frenesi)', hpFrenesi: '45.000 ~ 65.000 HP', spiralDmg: '15.000 ~ 25.000 por cast', hp: '22.000 (Base)', dpsTier: 'S (Altíssima Sobrevivência)' },
          equipment: [
            { slot: 'Topo', name: 'Elmo de Osso [1] / Elmo de Osso [1]', card: 'Carta Vanberk (+100 Crit) / Carta Louva-a-Deus', desc: 'Defesa pesada e bônus de ataque.' },
            { slot: 'Meio', name: 'Olhos Biônicos / Máscara de Mergulho / Óculos de Proteção', card: 'Sem slot', desc: '+1 DEF e +3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Peco Peco (+10% HP) / Carta Porcellio', desc: 'Indestrutível com aumento brutal de HP.' },
            { slot: 'Arma', name: 'Lança de Caça [1] (+10) / Espada de Duas Mãos', card: 'Carta Cavaleiro do Abismo (+25% MVP) / Carta Esqueleto Operário', desc: 'Lança com 420 de peso, ideal para Perfurar em Espiral.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Alice (-40% dano de Chefes) / Carta Tirfing', desc: 'Resistência elemental e contra monstros.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1] / Manteau [1] / Sobrepeliz [1]', card: 'Carta Raydric (-20% dano neutro)', desc: 'Redução fixa de dano físico.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Ferus Verde (+10% HP / +1 VIT)', desc: 'Amplifica a barra colossal de vida.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+4 FOR para fechar bônus de dano.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Ataque massivo em combate.' }
          ],
          souls: [
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' },
            { name: 'Alma de Antique Firelock', effect: '+1% Dano Ranged por 2 refinos (Espiral).' }
          ],
          combatStrategy: 'Abra o combate com Perfurar em Espiral à distância. Quando entrar em combate corpo a corpo contra o MVP, ative Frenesi e ataque sem parar.'
        },
        {
          id: 'lk-spiral-woe',
          name: 'Lorde Espiral de Força (WoE / Ranged)',
          badge: 'WOE & DANO RANGED',
          focus: 'Perfurar em Espiral Máximo · Lança Pesada · Contra-Ataque Contínuo',
          description: 'Build alternativa focada no máximo de dano do Perfurar em Espiral usando Lança de Caça +10 com maior peso possível. Excelente para WoE onde o alcance é vital e Frenesi pode ser substituído por Aura Sagrada para sobrevivência.',
          stats: { str: 90, agi: 1, vit: 85, int: 1, dex: 70, luk: 1 },
          derivedGoals: { aspd: '162', spiralDmg: '25.000 ~ 40.000 por lança pesada', hp: '28.000 ~ 35.000 HP', dpsTier: 'S (Dano Ranged Físico)' },
          equipment: [
            { slot: 'Topo', name: 'Elmo de Osso [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Maximiza o dano do Espiral.' },
            { slot: 'Meio', name: 'Máscara de Mergulho / Óculos de Proteção', card: 'Sem slot', desc: '+1 DEF.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Peco Peco (+10% HP)', desc: 'HP colossal para WoE.' },
            { slot: 'Arma', name: 'Lança de Caça [1] (+10)', card: 'Carta Cavaleiro do Abismo x2 (MVP)', desc: 'Peso 420, maior escala de Espiral.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Thara (-30% humanoide)', desc: 'WoE - reduz dano de jogadores.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Resistência física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Ferus Verde (+10% HP)', desc: '+10% HP direto.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Escala de FOR para Espiral.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Fecha 130 de FOR total.' }
          ],
          souls: [
            { name: 'Alma de Antique Firelock', effect: '+1% Dano Ranged por 2 refinos.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Mantenha distância segura e spam Espiral de Força em alvos com lança pesada. Em WoE, use Aura Sagrada para bloquear flechas e dano ranged dos inimigos.'
        },
        {
          id: 'lk-parry-twohand-crit',
          name: 'Lorde Aparar Golpe & Crítico (Two-Hand 190 ASPD)',
          badge: 'AGI CRIT & DEFESA 50%',
          focus: 'Aparar Golpe 50% Bloqueio · Espada 2 Mãos 190 ASPD · Lâmina de Aura',
          description: 'A união suprema de ataque e defesa. Com Aparar Golpe (Parry), bloqueia 50% de TODOS os ataques físicos recebidos, enquanto desfere críticos ininterruptos de Espada de Duas Mãos potencializados pela Lâmina de Aura.',
          stats: { str: 88, agi: 90, vit: 32, int: 1, dex: 25, luk: 45 },
          derivedGoals: {"aspd":"190.0 (Com Rapidez com Duas Mãos)","crit":"100% Crítico Fixo","spiralDmg":"Aparar: 50% Bloqueio Físico","hp":"18.000 ~ 22.000","dpsTier":"S (Duelista Imbatível)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Elmo de Osso [1] / Chapéu de Bebê Dragão",
                    "card": "Carta Vanberk (+100 Crit)",
                    "desc": "Críticos garantidos."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura das Valquírias [1]",
                    "card": "Carta Porcellio (+25 ATQ)",
                    "desc": "Ataque e durabilidade."
          },
          {
                    "slot": "Arma",
                    "name": "Krasnaya [3] (+10) / Espada de Duas Mãos [2]",
                    "card": "Carta Papel (+20% Crit Dmg) / Carta Cavaleiro do Abismo",
                    "desc": "Espada pesada com dano crítico brutal."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Bafomé Jr. (+3 AGI / +1% Crit)",
                    "desc": "Velocidade e crítico."
          },
          {
                    "slot": "Calçado",
                    "name": "Botas [1] / Sapatos [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Vida e velocidade."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Anel [1]",
                    "card": "Carta Kobold (+4 Crit / +1 FOR)",
                    "desc": "Fecha os 100% de taxa crítica."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Anel [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "Dano extra de FOR."
          }
],
          souls: [
          {
                    "name": "Alma de Tritão",
                    "effect": "+2% ASPD."
          },
          {
                    "name": "Alma de Atroce",
                    "effect": "+50 ATQ fixo se FOR >= 95."
          }
],
          combatStrategy: 'Mantenha Aparar Golpe e Rapidez com Duas Mãos sempre ativos. Avance contra os monstros e veja metade dos ataques serem bloqueados enquanto você desfere cortes críticos a 190 ASPD.'
        }
      ]
    },
    {
      id: 'high_priest',
      name: 'Sumo Sacerdote (High Priest)',
      tree: 'acolyte',
      category: 'Noviço Transclasse',
      sprite: 'assets/sprites/classes/PRIEST.gif',
      role: 'Suporte Divino Absoluto, Cura, Buffs & Magnus Exorcismus',
      tags: ['Magnus Exorcismus Full Cast', 'Cura & Ressurreição', 'Meditação SP Infinito', 'Suporte Essencial PT'],
      difficulty: 'Fácil',
      summary: 'A espinha dorsal de qualquer grupo no AureumRO. Possui a habilidade Meditação para regeneração e SP massivo, buffs essenciais como Bênção e Aumentar Agilidade, além do devastador Magnus Exorcismus contra demônios e mortos-vivos.',
      mechanics: [
        '✝️ <b>Magnus Exorcismus (ME):</b> Área sagrada de 14 ondas de dano contra Demônio/Morto-Vivo.',
        '✨ <b>Meditação:</b> Aumenta a recuperação de SP em 30% e o poder de Cura em 10%.',
        '🛡️ <b>Assumptio & Basílica:</b> Dobra a DEF/MDEF do grupo ou cria uma zona de proteção divina.'
      ],
      builds: [
        {
          id: 'hp-magnus-suporte',
          name: 'Magnus Exorcismus & Suporte Total',
          badge: 'EXORCISTA & SUPORTE',
          focus: 'ME Full Cast Rápido · Cura Máxima · Resistência Extrema em PT',
          description: 'A build híbrida perfeita: capaz de solar calabouços infestados de mortos-vivos e demônios (Niflheim, Monastério, Geffen) com Magnus Exorcismus e ao mesmo tempo prover suporte impecável em grupo.',
          stats: { str: 1, agi: 1, vit: 35, int: 99, dex: 99, luk: 1 },
          derivedGoals: { aspd: '160', castTime: 'Quase Instantâneo', healPower: 'Cura Nv 10 ~ 2.400+', hp: '12.500 ~ 15.000', dpsTier: 'A+ (Sagrado em Área)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu do Capitão [1] / Capelo [1]', card: 'Carta Isilla (+INT e chance de -50% cast)', desc: 'Aumenta cura e acelera a conjuração do ME.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1] / Olhos Biônicos', card: 'Carta Isilla / Sem slot', desc: '+INT e conjuração.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Manto Sagrado [1]', card: 'Carta Marc (Imune a Congelamento) / Carta Peco Peco', desc: 'Resistência essencial para não travar a conjuração.' },
            { slot: 'Arma', name: 'Cajado Restaurador (+10) / Bastão [4] / Livro [3]', card: 'Carta Necromante (+1 INT / ignora MDEF) / Carta Drosera', desc: 'Aumenta o ATQM Sagrado do ME.' },
            { slot: 'Escudo', name: 'Broquel [1] / Escudo da Valquíria [1]', card: 'Carta Thara (-30% dano humanoide) / Carta Alice', desc: 'Alta defesa para tankar mobs.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% dano neutro)', desc: 'Redução de dano.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Ferus Verde (+10% HP / +1 VIT)', desc: 'Aumenta a reserva de vida.' },
            { slot: 'Acessório 1', name: 'Rosário [1]', card: 'Carta Fen (Conjuração Ininterrupta)', desc: 'Impede o cancelamento de ME ao sofrer dano.' },
            { slot: 'Acessório 2', name: 'Rosário [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Acelera a velocidade de invocação das habilidades.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Tempo de Conjuração Variável.' },
            { name: 'Alma de Acidus', effect: '+5% Dano da Propriedade Sagrado e +5% Def. Sagrado.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' }
          ],
          combatStrategy: 'Coloque o Escudo Mágico em si mesmo ou use Carta Fen, invoque o Magnus Exorcismus no chão e cure os aliados enquanto os mortos-vivos são desintegrados.'
        },
        {
          id: 'hp-pvp-assumptio',
          name: 'Sumo Sacerdote Assumptio & Basílica (PvP/WoE)',
          badge: 'SUPORTE PVP & WOE',
          focus: 'Assumptio (Dobra DEF/MDEF) · Basílica (Zona Sagrada) · Silêncio e Debuffs',
          description: 'Build de suporte ofensivo voltada para GvG e WoE. Usa Assumptio para dobrar a DEF/MDEF de todos os aliados, cria Basílica como zona intransponível e debilita o time inimigo com Impedir (Silêncio), Fracasso e Infligir.',
          stats: { str: 1, agi: 1, vit: 82, int: 90, dex: 70, luk: 1 },
          derivedGoals: { aspd: '157', castTime: 'Insta-Cast ME/Assumptio', healPower: 'Cura Nv10 3.200+', hp: '20.000 ~ 25.000', dpsTier: 'S (Suporte Absoluto WoE)' },
          equipment: [
            { slot: 'Topo', name: 'Capelo [1] / Coroa de Louros [1]', card: 'Carta Isilla (-50% cast situacional)', desc: 'Insta-Cast de Assumptio e ME.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: '+INT e cast.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Manto Sagrado [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Resistência para permanecer em campo.' },
            { slot: 'Arma', name: 'Cajado Restaurador (+10) / Bastão [4]', card: 'Carta Drosera (+INT e cura)', desc: 'Poder de Cura máximo.' },
            { slot: 'Escudo', name: 'Broquel [1] / Escudo da Valquíria [1]', card: 'Carta Thara (-30% dano humanoide)', desc: 'Resistência a jogadores.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Proteção.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Ferus Verde (+10% HP)', desc: 'HP para sobreviver na linha de frente.' },
            { slot: 'Acessório 1', name: 'Rosário [1]', card: 'Carta Fen (Conjuração Ininterrupta)', desc: 'Continua conjurando ao tomar dano.' },
            { slot: 'Acessório 2', name: 'Rosário [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha o insta-cast.' }
          ],
          souls: [
            { name: 'Alma de Acidus', effect: '+5% Dano e Defesa Sagrado.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' }
          ],
          combatStrategy: 'Posicione-se na retaguarda. Aplique Assumptio em todos os aliados, crie Basílica para proteger a retaguarda e aplique debuffs nos inimigos que avançam.'
        },
        {
          id: 'hp-battle-priest',
          name: 'Sacerdote de Batalha (Battle Priest 190 ASPD)',
          badge: 'BATALHA & CRÍTICO SAGRADO',
          focus: 'Maça 190 ASPD · Glória (+30 SOR) · Flagelo do Mal & Autocast',
          description: 'O guerreiro sagrado que combate o mal corpo a corpo. Com Glória concedendo +30 de SOR, Bênção e Aumentar Agilidade, atinge 190 de ASPD desferindo golpes críticos pesados com Maça e ativando autocasts divinos.',
          stats: { str: 80, agi: 88, vit: 28, int: 1, dex: 35, luk: 50 },
          derivedGoals: {"aspd":"190.0 (Com seus Buffs)","crit":"85% ~ 100% (Com Glória)","healPower":"Cura Nv10 2.200+","hp":"12.000 ~ 14.500","dpsTier":"A+ (Dano Corpo a Corpo)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Capelo [1] / Coroa de Louros [1] / Boina Alada",
                    "card": "Carta Vanberk (+100 Crit)",
                    "desc": "Críticos em combate."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Manto Sagrado [1]",
                    "card": "Carta Porcellio (+25 ATQ)",
                    "desc": "Aumento direto de ataque."
          },
          {
                    "slot": "Arma",
                    "name": "Maça de Ouro [2] (+10) / Maça [4] / Maça Dourada",
                    "card": "Carta Cavaleiro do Abismo / Carta Esqueleto Operário",
                    "desc": "Maça pesada para estilhaçar mortos-vivos."
          },
          {
                    "slot": "Escudo",
                    "name": "Broquel [1] / Escudo da Valquíria [1]",
                    "card": "Carta Thara / Carta Alice",
                    "desc": "Proteção corpo a corpo."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Bafomé Jr. (+3 AGI / +1% Crit)",
                    "desc": "Garante o teto de 190 ASPD."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Vida e agilidade."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Rosário [1]",
                    "card": "Carta Kobold (+4 Crit / +1 FOR)",
                    "desc": "Crítico e bônus sagrado."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Rosário [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "Dano de Maça."
          }
],
          souls: [
          {
                    "name": "Alma de Tritão",
                    "effect": "+2% ASPD."
          },
          {
                    "name": "Alma de Acidus",
                    "effect": "+5% Dano Sagrado."
          }
],
          combatStrategy: 'Ative Bênção, Aumentar Agilidade, Glória e Impositio Manus. Avance com Maça Carga a 190 ASPD desferindo acertos críticos contínuos enquanto se cura quando necessário.'
        }
      ]
    },
    {
      id: 'high_wizard',
      name: 'Arquimago (High Wizard)',
      tree: 'mage',
      category: 'Mago Transclasse',
      sprite: 'assets/sprites/classes/WIZARD.gif',
      role: 'DPS Mágico Supremo em Área, Controle de Campo & Nevasca',
      tags: ['Amplificação Mágica +50% ATQM', 'Nevasca & Chuva de Meteoros', 'Insta-Cast Mágico', 'Controle Total'],
      difficulty: 'Média',
      summary: 'O destruidor elemental por excelência. Utiliza Amplificação Mágica para conceder +50% de poder aos seus feitiços e aniquila grupos inteiros de monstros com Nevasca, Chuva de Meteoros e Ira de Thor.',
      mechanics: [
        '🔮 <b>Amplificação Mágica (AMP):</b> Concede +50% de ATQM para a próxima magia conjurada.',
        '❄️ <b>Nevasca & Fúria da Terra:</b> Controle em área com alta chance de congelamento e dano massivo.',
        '⚡ <b>Dreno de Alma:</b> Regenera SP a cada monstro abatido com feitiços de alvo único.'
      ],
      builds: [
        {
          id: 'hw-insta-meteor',
          name: 'Arquimago Insta-Cast (Nevasca & Meteoros)',
          badge: 'CONTROLE & DESTRUIÇÃO',
          focus: 'Conjuração Instantânea ou Ultra-Rápida · +50% ATQM com AMP · Área Total',
          description: 'Build focada em atingir 0s ou menos de 0,3s de conjuração para disparar Nevasca, Chuva de Meteoros e Ira de Thor sem dar tempo para os inimigos reagirem.',
          stats: { str: 1, agi: 1, vit: 35, int: 99, dex: 99, luk: 1 },
          derivedGoals: { aspd: '162', castTime: '0.00s (Insta-Cast com Rota)', matqDmg: '25.000 ~ 40.000 por magia', hp: '8.500 ~ 10.500', dpsTier: 'S (Supremo em Área)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1] / Chapéu de Bathory', card: 'Carta Isilla (+INT e chance de -50% cast)', desc: '+INT e aceleração de conjuração.' },
            { slot: 'Meio', name: 'Olhos Biônicos / Orelhas de Elfo [1]', card: 'Carta Isilla / Sem slot', desc: '+ATQM e atributos.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Peco Peco (+10% HP) / Carta Marc', desc: 'Resistência elemental e vida extra.' },
            { slot: 'Arma', name: 'Cajado Perfurador [2] (+10) / Bastão da Destruição', card: 'Carta Necromante x2 (+2 INT / ignora 4% MDEF)', desc: 'Ignora a defesa mágica dos alvos.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Thara (-30% dano humanoide)', desc: 'Proteção essencial ao castar magias.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% dano neutro)', desc: 'Redução fixa de dano.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx e regeneração)', desc: 'Sustento contínuo de SP.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Maximiza a Destreza para zerar o cast.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha os pontos necessários para Insta-Cast.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Tempo de Conjuração Variável.' },
            { name: 'Alma de Ragged', effect: '+4 DEX permanente.' },
            { name: 'Alma de Khalitzburg', effect: '+3 DEX permanente.' }
          ],
          combatStrategy: 'Ative Amplificação Mágica antes de cada grande magia. Use Barreira de Fogo ou Nevasca para afastar os inimigos e finalize com Chuva de Meteoros.'
        },
        {
          id: 'hw-ira-thor-pvp',
          name: 'Arquimago Ira de Thor & Controle (PvP / WoE)',
          badge: 'PVP & CONTROLE DE CAMPO',
          focus: 'Congelamento Massa · Ira de Thor 1 Hit · Nevasca Área Controle',
          description: 'Build focada em WoE e PvP com ênfase em congelamento e controle de campo em vez de DPS puro. Usa Nevasca para congelar grupos inteiros e Ira de Thor amplificada pelo AMP para One-Shot alvos congelados.',
          stats: { str: 1, agi: 1, vit: 60, int: 99, dex: 82, luk: 1 },
          derivedGoals: { aspd: '155', castTime: '0.00s (Insta-Cast)', matqDmg: '30.000 ~ 50.000 (AMP + Congelado)', hp: '13.000 ~ 16.000', dpsTier: 'S+ (One-Shot PvP)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1]', card: 'Carta Isilla (+INT e Cast Red)', desc: 'Cast zero e INT máxima.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: '+Cast Reduction.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Não ser afetado pela própria Nevasca.' },
            { slot: 'Arma', name: 'Cajado Perfurador [2] (+10)', card: 'Carta Necromante x2 (ignora MDEF)', desc: 'Ignora a MDEF dos jogadores no WoE.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Thara (-30% humanoide)', desc: 'Resistência a jogadores.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Redução geral de dano.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'SP para spam de Nevasca e Meteoros.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha o insta-cast.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'DEX total >= 120 para 0s cast.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Acidus', effect: '+5% Dano Elemental e Resistência.' }
          ],
          combatStrategy: 'Congele grupos com Nevasca. Alvos congelados recebem +50% de dano. Ative AMP e despache cada alvo congelado com Ira de Thor. Controle o campo todo.'
        },
        {
          id: 'hw-solo-drain-farm',
          name: 'Arquimago Barreira & Dreno de Alma (Solo Farm)',
          badge: 'SOLO FARM & SUSTENTO',
          focus: 'Dreno de Alma SP Infinito · Barreira de Fogo Vertical · Lanças Fogo/Gelo',
          description: 'A build ideal para solar calabouços de monstros pesados sem gastar uma única poção de SP. Com Dreno de Alma maximizado, cada monstro abatido restaura completamente a barra de SP, enquanto a Barreira Vertical isola os inimigos.',
          stats: { str: 1, agi: 1, vit: 42, int: 99, dex: 95, luk: 1 },
          derivedGoals: {"aspd":"160","castTime":"0.15s Ultra-Rápido","matqDmg":"Lanças: 15.000 ~ 25.000 por alvo","hp":"10.500 ~ 13.000","dpsTier":"A+ (Farm Sem Gastos)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Coroa de Louros [1] / Chapéu de Bathory",
                    "card": "Carta Isilla (+INT e chance de -50% cast)",
                    "desc": "Acelera o disparo de feitiços."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQM."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Manto de Seda [1]",
                    "card": "Carta Peco Peco (+10% HP)",
                    "desc": "Vida extra para sobrevivência."
          },
          {
                    "slot": "Arma",
                    "name": "Cajado Perfurador [2] (+10)",
                    "card": "Carta Necromante x2 (ignora MDEF)",
                    "desc": "Ignora a defesa mágica do alvo."
          },
          {
                    "slot": "Escudo",
                    "name": "Broquel [1]",
                    "card": "Carta Alice (-40% dano de Chefes)",
                    "desc": "Defesa ao solar chefes."
          },
          {
                    "slot": "Capa",
                    "name": "Manto das Valquírias [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Proteção física."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Sohee (+15% SP Máx)",
                    "desc": "Gera reservatório para o Dreno de Alma."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Acelera a conjuração das lanças."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Fecha o tempo de cast."
          }
],
          souls: [
          {
                    "name": "Alma de Archdam",
                    "effect": "-10% Cast Variável."
          },
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% SP Máximo."
          }
],
          combatStrategy: 'Coloque uma Barreira de Fogo Vertical para travar o monstro que se aproxima. Dispare Lanças de Gelo ou Fogo maximizadas e recupere 100% do SP gasto ao abater o inimigo.'
        }
      ]
    },
    {
      id: 'champion',
      name: 'Mestre (Champion)',
      tree: 'acolyte',
      category: 'Noviço Transclasse',
      sprite: 'assets/sprites/classes/MONK_H.gif',
      role: 'DPS Físico de Impacto Crítico Único (Punho de Asura) & Disparo de Esferas',
      tags: ['Punho de Asura 100k+ Dmg', 'Disparo de Esferas Rápido', 'Combo Triplo/Quádruplo', 'Caçador de MVP'],
      difficulty: 'Média-Alta',
      summary: 'O Mestre é famoso pelo golpe mais devastador do jogo: o Punho Supremo de Asura, capaz de aniquilar jogadores e MVPs em um único golpe, drenando todo o seu SP para converter em dano físico avassalador.',
      mechanics: [
        '💥 <b>Punho Supremo de Asura:</b> Consome todo o SP para infligir um golpe que ignora DEF e Esquiva.',
        '🔮 <b>Fúria Interior & Esferas Espirituais:</b> Concede +20% de Taxa Crítica e munição para habilidades.',
        '⚡ <b>Passo Etéreo (Snap):</b> Teleporte instantâneo para qualquer ponto da tela sem recarga.'
      ],
      builds: [
        {
          id: 'champ-asura-mvp',
          name: 'Punho de Asura & Disparo de Esferas (One-Shot)',
          badge: 'ONE-SHOT MVP',
          focus: 'Dano de Asura Máximo (100k+) · Reserva de SP Brutal · Mobilidade Infinita',
          description: 'A clássica build de Mestre Asureiro calibrada para desferir o golpe fatal em chefes e duelos. Combina máxima FOR e INT/SP para gerar o multiplicador mais alto do servidor.',
          stats: { str: 99, agi: 1, vit: 38, int: 73, dex: 55, luk: 1 },
          derivedGoals: { aspd: '165', asuraDmg: '90.000 ~ 160.000 (Ignora DEF)', castTime: 'Ultra-Rápido', hp: '11.000 ~ 13.500', dpsTier: 'S+ (Burst Único)' },
          equipment: [
            { slot: 'Topo', name: 'Capelo [1] / Coroa de Louros [1]', card: 'Carta Carat (+2 INT / +150 SP em refino +9)', desc: 'Aumenta massivamente o SP para a fórmula do Asura.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ e FOR.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Porcellio (+25 ATQ) / Carta Roda Gigante (+100 SP)', desc: 'Maximiza o poder destrutivo.' },
            { slot: 'Arma', name: 'Maça de Ouro [2] (+10) / Maça [4] / Clava com Espetos [2]', card: 'Carta Cavaleiro do Abismo x2 (+50% Dano MVP)', desc: 'Arma com alto ATQ base para transferir ao Asura.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Alice (-40% dano MVP) / Carta Thara', desc: 'Resistência ao se aproximar para o golpe.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% dano neutro)', desc: 'Proteção física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: '+15% de SP direto multiplicando o Asura.' },
            { slot: 'Acessório 1', name: 'Presilha [1] / Luva [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+4 FOR para fechar 120+ de FOR total.' },
            { slot: 'Acessório 2', name: 'Presilha [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Reduz o tempo de conjuração do Asura e Disparo.' }
          ],
          souls: [
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' },
            { name: 'Alma de Antique Firelock', effect: '+ Dano em habilidades com refino.' }
          ],
          combatStrategy: 'Invoque 5 Esferas Espirituais, ative Fúria Interior, regenere seu SP ao máximo, use Passo Etéreo para colar no alvo e desfira o Punho Supremo de Asura.'
        },
        {
          id: 'champ-combo-aspd',
          name: 'Mestre Combo Triplo & Disparo de Esferas (190 ASPD)',
          badge: 'DPS CONTÍNUO',
          focus: 'Combo Triplo/Quádruplo · 190 ASPD · Disparo de Esferas Rápido',
          description: 'Build alternativa para farm contínuo e PvM. Em vez do Asura de um golpe, foca em manter Combo Triplo e Quádruplo com 190 ASPD para abater hordas de monstros usando Disparo de Esferas como finalizador.',
          stats: { str: 86, agi: 90, vit: 32, int: 20, dex: 43, luk: 1 },
          derivedGoals: { aspd: '190.0 (Com Fúria Interior)', crit: '60%', asuraDmg: 'Disparo 8.000 ~ 14.000', hp: '10.000 ~ 12.500', dpsTier: 'A+ (Farm Contínuo)' },
          equipment: [
            { slot: 'Topo', name: 'Boina Alada / Elmo de Osso [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+FOR para dano de combo.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura de Corrida [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+1 AGI e +ATQ.' },
            { slot: 'Arma', name: 'Maça de Ouro [2] (+10) / Maça [4]', card: 'Carta Esqueleto Operário x2', desc: 'Alta velocidade de ataque para sustentar o combo.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara / Carta Alice', desc: 'Defesa.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Bafomé Jr. (+3 AGI / +1% Crit)', desc: 'ASPD cap.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Velocidade e vida.' },
            { slot: 'Acessório 1', name: 'Broche [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Fecha 190 ASPD.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Dano extra no combo.' }
          ],
          souls: [
            { name: 'Alma de Tritão', effect: '+2% ASPD.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Ative Fúria Interior para +20% Crit e 190 ASPD. Execute Combo Triplo > Combo Quádruplo e use Disparo de Esferas para dano extra.'
        },
        {
          id: 'champ-steel-body-tank',
          name: 'Mestre Corpo Fechado (Steel Body Tanque 90% Redução)',
          badge: 'TANQUE SUPREMO (STEEL BODY)',
          focus: 'Corpo Fechado (-90% Dano Recebido) · HP Colossal · Segurador de MVPs',
          description: 'A build mais resistente de todo o Ragnarok. Com a habilidade Corpo Fechado (Steel Body), o Mestre tem sua DEF e MDEF elevadas a níveis absurdos, reduzindo 90% de todo e qualquer dano recebido durante minutos.',
          stats: { str: 52, agi: 1, vit: 99, int: 63, dex: 50, luk: 1 },
          derivedGoals: {"aspd":"145","asuraDmg":"Corpo Fechado: 90% Redução de Dano","hp":"24.000 ~ 30.000 HP","dpsTier":"S (Tanque Intransponível)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Elmo de Osso [1] / Boina Alada",
                    "card": "Carta Grand Peco (+5% HP/DEF)",
                    "desc": "Defesa e vida."
          },
          {
                    "slot": "Meio",
                    "name": "Máscara de Mergulho / Óculos de Proteção",
                    "card": "Sem slot",
                    "desc": "+1 DEF."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura das Valquírias [1]",
                    "card": "Carta Peco Peco (+10% HP) / Carta Marc",
                    "desc": "Indestrutível com HP massivo."
          },
          {
                    "slot": "Arma",
                    "name": "Maça de Ouro [2] (+10) / Maça [4]",
                    "card": "Carta Fabre x2 (+200 HP / +2 VIT)",
                    "desc": "Bônus de vida."
          },
          {
                    "slot": "Escudo",
                    "name": "Escudo da Valquíria [1]",
                    "card": "Carta Alice (-40% dano Chefes) / Carta Thara",
                    "desc": "Redução contra MVPs pesados."
          },
          {
                    "slot": "Capa",
                    "name": "Manto das Valquírias [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Redução de dano."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Ferus Verde (+10% HP / +1 VIT)",
                    "desc": "Multiplica a reserva de vida."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Rosário [1] / Anel de Caveira [1]",
                    "card": "Carta Spore (+2 VIT)",
                    "desc": "Vitalidade e regeneração."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Rosário [1]",
                    "card": "Carta Spore (+2 VIT)",
                    "desc": "Mais resistência física."
          }
],
          souls: [
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo e +5% SP Máximo."
          },
          {
                    "name": "Alma de Acidus",
                    "effect": "+5% Resistência Elemental."
          }
],
          combatStrategy: 'Invoque 5 esferas espirituais e ative Corpo Fechado antes de engajar o MVP. Posicione-se na linha de frente e absorva todo o dano do chefe com facilidade enquanto o grupo bate.'
        }
      ]
    },
    {
      id: 'stalker',
      name: 'Desordeiro (Stalker)',
      tree: 'thief',
      category: 'Gatuno Transclasse',
      sprite: 'assets/sprites/classes/ROGUE.gif',
      role: 'DPS Furtivo de Adaga/Arco, Plágio Mágico & Remoção Total',
      tags: ['Apunhalar 2 Hits 1200%', 'Plágio & Preservar', 'Remoção Total WoE', 'Mãos Leves Farm'],
      difficulty: 'Média-Alta',
      summary: 'O mestre da trapaça e versatilidade. No AureumRO, Apunhalar desfere 2 hits com 1200% de dano total. Com Preservar, o Desordeiro mantém habilidades plagiadas de outras classes para sempre (como Chuva de Meteoros ou Combo Triplo).',
      mechanics: [
        '🗡️ <b>Apunhalar Aprimorado:</b> Desfere 2 hits simultâneos totalizando 1200% de multiplicador de dano.',
        '📜 <b>Plágio & Preservar:</b> Copia magias de magos ou golpes de outras classes sem risco de perder.',
        '🔒 <b>Remoção Total:</b> Desarma elmo, escudo, armadura e arma dos oponentes em PvP/GvG.'
      ],
      builds: [
        {
          id: 'stalker-apunhalar',
          name: 'Desordeiro Apunhalar & Farm Furtivo',
          badge: 'BURST CORPO A CORPO',
          focus: 'Dano de 1200% em 2 Hits · Furtividade Contínua · Farm Rápido',
          description: 'Aproveita o rework do servidor que concede 2 hits no Apunhalar. Excelente para eliminar monstros e jogadores de surpresa surgindo pelas sombras.',
          stats: { str: 90, agi: 83, vit: 45, int: 1, dex: 50, luk: 1 },
          derivedGoals: { aspd: '185', backstabDmg: '14.000 ~ 22.000 por golpe', hitRate: '100% Acerto', hp: '12.000 ~ 14.500', dpsTier: 'A+ (Burst Físico)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Jiboia [1] / Boina Alada', card: 'Carta Vanberk (+100 Crit) / Carta Louva-a-Deus', desc: 'Bônus de ataque e acertos duplos.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ e dano.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+25 ATQ para o Apunhalar.' },
            { slot: 'Arma', name: 'Gladius [3] (+10) / Adaga Venenosa / Rondel', card: 'Carta Cavaleiro do Abismo / Carta Hidra', desc: 'Adaga pesada que ignora DEF ou amplifica dano contra chefes.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara (-30% humanoide) / Carta Alice', desc: 'Defesa corpo a corpo.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Sussurro (+20 Esquiva) / Carta Raydric', desc: 'Esquiva alta.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e velocidade.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+FOR para fechar dano.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Precisão para não errar o golpe.' }
          ],
          souls: [
            { name: 'Alma de Injustiçado', effect: 'Autocast de Apunhalar ao atacar.' },
            { name: 'Alma de Anolian', effect: 'Concede Furto automático.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Aproxime-se em Esconderijo ou Túnel de Fuga, apareça nas costas do alvo e dispare o Apunhalar para aplicar os 2 hits devastadores.'
        },
        {
          id: 'stalker-plagiarist-mage',
          name: 'Desordeiro Plágio Mágico (Chuva de Meteoros)',
          badge: 'PLÁGIO & PRESERVAR',
          focus: 'Plágio de Chuva de Meteoros · Preservar Permanente · Farm Fácil',
          description: 'Build de alto aproveitamento exclusivo do AureumRO. Com Plágio você copia Chuva de Meteoros do Arquimago e Preservar mantém a habilidade permanentemente. Desfrutar do maior DPS de área do jogo sem ser um mago.',
          stats: { str: 1, agi: 1, vit: 43, int: 99, dex: 95, luk: 1 },
          derivedGoals: { aspd: '155', matqDmg: 'Meteoros: 8.000 ~ 15.000 por hit (6 hits)', castTime: 'Quase Insta-Cast', hp: '11.000 ~ 13.500', dpsTier: 'A+ (Farm Mágico)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1] / Chapéu de Bathory', card: 'Carta Isilla (+INT e Cast Red)', desc: '+INT e cast para a habilidade copiada.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: 'Velocidade de conjuração.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Resistência ao farm em zonas frias.' },
            { slot: 'Arma', name: 'Cajado Perfurador [2] (+10)', card: 'Carta Necromante x2 (+INT / ignora MDEF)', desc: 'ATQM máximo para Meteoros plagiados.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara / Carta Alice', desc: 'Defesa.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric', desc: 'Proteção física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'SP para spam de Meteoros.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha o cast dos Meteoros.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'DEX total para insta-cast.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Aliot', effect: '+5% SP Máximo para mais Meteoros.' }
          ],
          combatStrategy: 'Plagie Chuva de Meteoros de um HW aliado e use Preservar. Gerencie monstros com Mãos Leves para farm e dispare Meteoros continuamente.'
        },
        {
          id: 'stalker-bow-disabler',
          name: 'Desordeiro de Arco & Remoção Total (WoE / Ranged Sniper)',
          badge: 'WOE DISABLER & ARCO',
          focus: 'Remoção Total (4 Partes) · Rajada de Flechas à Distância · Furtividade WoE',
          description: 'O pesadelo supremo na Guerra do Emperium. Equipado com Arco e alta DEX, aproxima-se furtivamente com Túnel de Fuga para desarmar Armadura, Escudo, Elmo e Arma dos inimigos, finalizando com Rajadas de Flechas à distância.',
          stats: { str: 25, agi: 80, vit: 55, int: 1, dex: 99, luk: 1 },
          derivedGoals: {"aspd":"184","hitRate":"100% Precisão Absoluta","backstabDmg":"Rajada / Remoção: Sucesso 100%","hp":"14.000 ~ 17.000","dpsTier":"S (Controle Supremo WoE)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Boina Alada / Chapéu do Cowboy Errante [1]",
                    "card": "Carta Marduk (Imune a Silêncio) / Carta Vanberk",
                    "desc": "Proteção essencial em WoE."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ e precisão."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Traje de Gatuno [1]",
                    "card": "Carta Marc (Imune a Congelamento)",
                    "desc": "Imunidade crucial contra HWs."
          },
          {
                    "slot": "Arma",
                    "name": "Arco Composto [4] (+10) / Arco Composto [4] (+10) / Gakkung [2] (+10)",
                    "card": "Carta Hidra x2 / Carta Esqueleto Operário x2",
                    "desc": "Dano máximo em jogadores."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Menblatt (+Dano Ranged por DEX)",
                    "desc": "Escala de dano à distância."
          },
          {
                    "slot": "Calçado",
                    "name": "Botas [1] / Sapatos [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Vida e velocidade."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Maximiza a taxa de sucesso da Remoção."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Fecha 120+ de DEX total."
          }
],
          souls: [
          {
                    "name": "Alma de Antique Firelock",
                    "effect": "+1% Dano Ranged por 2 refinos."
          },
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo."
          }
],
          combatStrategy: 'Use Túnel de Fuga para atravessar as defesas inimigas. Remova a Armadura e Arma do tanker adversário com Remoção Total e finalize com Rajadas de Flechas à distância.'
        }
      ]
    },
    {
      id: 'whitesmith',
      name: 'Mestre-Ferreiro (Whitesmith)',
      tree: 'merchant',
      category: 'Mercador Transclasse',
      sprite: 'assets/sprites/classes/BLACKSMITH_H.gif',
      role: 'DPS Físico Pesado (Choque de Carrinho) & Refinador Supremo',
      tags: ['Choque de Carrinho 190 ASPD', 'Cavalo-de-Pau 350% 0 SP', 'Força Violentíssima', 'Refino Mestre'],
      difficulty: 'Média',
      summary: 'Uma verdadeira força da natureza no combate corpo a corpo. Com Força Violentíssima (+100% ATQ da arma), Manejo Perfeito e Choque de Carrinho (Cart Termination), desfere golpes brutais a cada fração de segundo.',
      mechanics: [
        '🛒 <b>Choque de Carrinho:</b> Dano massivo baseado no peso do carrinho (8.000 peso) com chance de atordoamento.',
        '🔨 <b>Cavalo-de-Pau Buffado:</b> Causa 350% de dano em área com custo zero de SP no AureumRO.',
        '⚡ <b>Força Violentíssima (Maximum Power Thrust):</b> Dobra o dano da arma durante o combate.'
      ],
      builds: [
        {
          id: 'ws-cart-term',
          name: 'Choque de Carrinho & Força Violentíssima (Cart Term)',
          badge: 'DPS CORPO A CORPO S+',
          focus: 'Dano de Carrinho em 190 ASPD · Atordoamento Contínuo · Refino +10',
          description: 'A build mais poderosa para PvP e PvM de Mestre-Ferreiro. Com o Carrinho cheio a 8.000 de peso e Força Violentíssima ativa, o Choque de Carrinho atinge números estarrecedores a 190 ASPD.',
          stats: { str: 99, agi: 74, vit: 52, int: 1, dex: 40, luk: 1 },
          derivedGoals: { aspd: '190.0 (Com Adrenalina Pura)', cartDmg: '18.000 ~ 30.000 por choque', stunRate: 'Alta chance de Stun', hp: '14.000 ~ 17.000', dpsTier: 'S+ (Devastador)' },
          equipment: [
            { slot: 'Topo', name: 'Elmo de Osso [1] / Boina Alada', card: 'Carta Vanberk (+100 Crit) / Carta Louva-a-Deus', desc: 'Bônus de ataque e chance de crítico.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Porcellio (+25 ATQ) / Carta Marc', desc: 'Indestrutível com aumento de ataque.' },
            { slot: 'Arma', name: 'Machado dos Orcs [4] (+10) / Machado de Duas Mãos', card: 'Carta Cavaleiro do Abismo x2 / Carta Hidra x2', desc: '4 slots para maximizar multiplicadores raciais/tamanho.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara (-30% humanoide) / Carta Alice', desc: 'Proteção em combates aproximados.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Raydric (-20% neutro) / Carta Bafomé Jr.', desc: 'Resistência e agilidade.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e velocidade.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+FOR para fechar 130 de FOR total.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Aumento direto de ATQ.' }
          ],
          souls: [
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' },
            { name: 'Alma de Tritão', effect: '+2% ASPD.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo.' }
          ],
          combatStrategy: 'Encha o carrinho com 8.000 de peso. Ative Adrenalina Pura, Manejo Perfeito, Amplificar Poder e Força Violentíssima. Trave o alvo no Choque de Carrinho.'
        },
        {
          id: 'ws-mammonita-farm',
          name: 'Mestre-Ferreiro Cavalo-de-Pau (Farm em Área 0 SP)',
          badge: 'FARM EM ÁREA',
          focus: 'Cavalo-de-Pau 350% 0 SP · Mammonita 0z · Alta FOR e Sustain',
          description: 'Build de farm otimizada no AureumRO. Cavalo-de-Pau com 350% de dano a custo ZERO de SP no servidor, aliado a Mammonita 0 Zeny via Desconto 10. Limpa caldas de monstros médios com facilidade sem gastar recursos.',
          stats: { str: 90, agi: 75, vit: 60, int: 1, dex: 42, luk: 1 },
          derivedGoals: { aspd: '175', cartDmg: 'Cavalo-de-Pau: 350% · 0 SP', stunRate: 'Alta Stun em área', hp: '18.000 ~ 22.000', dpsTier: 'A+ (Farm em Área)' },
          equipment: [
            { slot: 'Topo', name: 'Elmo de Osso [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Dano de Cavalo-de-Pau.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1]', card: 'Carta Peco Peco (+10% HP)', desc: '+HP para survivability no farm.' },
            { slot: 'Arma', name: 'Machado dos Orcs [4] (+10)', card: 'Carta Cavaleiro do Abismo x2 / Carta Hidra x2', desc: 'Maximiza o dano de área.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara / Carta Alice', desc: 'Defesa geral.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Raydric', desc: 'Redução de dano.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Ferus Verde (+10% HP)', desc: 'Mais HP.' },
            { slot: 'Acessório 1', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+FOR para 130 total.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Dano máximo de Cavalo-de-Pau.' }
          ],
          souls: [
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' },
            { name: 'Alma de Aliot', effect: '+5% HP Máximo.' }
          ],
          combatStrategy: 'Encha o Carrinho, ative Força Violentíssima e Adrenalina Pura. Use Cavalo-de-Pau em grupos de monstros. Alterne com Mammonita gratuita para grupos resistentes.'
        },
        {
          id: 'ws-mvp-twohand-axe',
          name: 'Mestre-Ferreiro Machado de Duas Mãos (MVP Melee)',
          badge: 'MVP MELEE & REFINO',
          focus: 'Machado de Duas Mãos +10 · Adrenalina Pura Máxima · Perfurar Armadura',
          description: 'Especializada em destruir Chefes corpo a corpo sem a necessidade de gastar peso no carrinho. Usa Machado de Duas Mãos refinado com Força Violentíssima, Adrenalina Pura e Perfurar Armadura para desferir golpes devastadores.',
          stats: { str: 99, agi: 83, vit: 38, int: 1, dex: 40, luk: 1 },
          derivedGoals: {"aspd":"190.0 (Cap Máximo)","cartDmg":"Golpes Físicos: 6.000 ~ 11.000 por hit","stunRate":"Alta Taxa Crítica","hp":"15.000 ~ 18.500","dpsTier":"S (DPS Corpo a Corpo)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Elmo de Osso [1]",
                    "card": "Carta Vanberk (+100 Crit)",
                    "desc": "Críticos e bônus de ataque."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura das Valquírias [1]",
                    "card": "Carta Porcellio (+25 ATQ)",
                    "desc": "Ataque fixo para a fórmula."
          },
          {
                    "slot": "Arma",
                    "name": "Machado de Duas Mãos [2] (+10) / Guilhotina",
                    "card": "Carta Cavaleiro do Abismo x2 (+50% Dano MVP)",
                    "desc": "Multiplicador absurdo contra chefes."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Bafomé Jr. (+3 AGI / +1% Crit)",
                    "desc": "Garante 190 ASPD."
          },
          {
                    "slot": "Calçado",
                    "name": "Botas [1] / Sapatos [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Vida e velocidade."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Anel [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "+FOR para teto de 130."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Anel [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "Dano extra de ataque."
          }
],
          souls: [
          {
                    "name": "Alma de Atroce",
                    "effect": "+50 ATQ fixo se FOR >= 95."
          },
          {
                    "name": "Alma de Tritão",
                    "effect": "+2% ASPD."
          }
],
          combatStrategy: 'Ative Adrenalina Pura, Manejo Perfeito, Amplificar Poder e Força Violentíssima. Cole no MVP e desfira golpes ininterruptos a 190 ASPD usando Perfurar Armadura para quebrar as defesas.'
        }
      ]
    },
    {
      id: 'paladin',
      name: 'Paladino (Paladin)',
      tree: 'swordman',
      category: 'Espadachim Transclasse',
      sprite: 'assets/sprites/classes/CRUSADER.gif',
      role: 'Tanque Sagrado de Redenção, Sacrifício do Mártir & Crux Divinum',
      tags: ['Sacrifício do Mártir HP', 'Crux Divinum Sagrado', 'Redenção Total PT', 'Escudo Bumerangue'],
      difficulty: 'Média',
      summary: 'O protetor inabalável. Pode absorver todo o dano dos membros do grupo através de Redenção ou desferir golpes letais baseados no seu próprio HP Máximo com Sacrifício do Mártir (Matyr Sacrifice).',
      mechanics: [
        '🩸 <b>Sacrifício do Mártir:</b> Causa dano físico proporcional ao HP máximo do Paladino, ignorando DEF e Esquiva.',
        '🛡️ <b>Redenção:</b> Transfere 100% de todo o dano recebido por até 5 aliados diretamente para si.',
        '✨ <b>Crux Divinum & Grand Cross:</b> Dano massivo da propriedade Sagrado.'
      ],
      builds: [
        {
          id: 'paladin-sacrificio',
          name: 'Sacrifício do Mártir & Redenção (Full HP)',
          badge: 'FULL HP & SACRIFÍCIO',
          focus: 'HP Massivo (35.000+) · Dano Fixo Ignora DEF · Proteção Suprema em PT',
          description: 'A build clássica de Paladino com foco absoluto em acumular a maior quantidade possível de pontos de vida para alimentar o Sacrifício do Mártir com dano colossal.',
          stats: { str: 1, agi: 85, vit: 99, int: 1, dex: 60, luk: 1 },
          derivedGoals: { aspd: '180 ~ 185', sacriDmg: '9.000 ~ 14.000 por golpe (Ignora DEF)', hp: '32.000 ~ 40.000 HP', dpsTier: 'A+ (Dano Puro por HP)' },
          equipment: [
            { slot: 'Topo', name: 'Elmo de Osso [1] / Boina Alada', card: 'Carta Grand Peco (+5% HP/DEF)', desc: '+HP e resistência.' },
            { slot: 'Meio', name: 'Olhos Biônicos / Máscara de Mergulho / Óculos de Proteção', card: 'Sem slot', desc: '+DEF e stats.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Armadura das Valquírias [1] / Armadura Legionária', card: 'Carta Peco Peco (+10% HP)', desc: '+10% de HP direto para multiplicar o dano do Sacrifício.' },
            { slot: 'Arma', name: 'Espada de Duas Mãos [4] (+10) / Lança de Caça', card: 'Carta Fabre x4 (+400 HP / +4 VIT) / Carta Hidra', desc: 'Gera bônus puro de vida.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Thara (-30% dano humanoide) / Carta Alice', desc: 'Resistência ao dano recebido.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Redução fixa de dano.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Ferus Verde (+10% HP / +1 VIT)', desc: '+10% HP e bônus de combo maré.' },
            { slot: 'Acessório 1', name: 'Anel de Caveira [1] / Presilha [1]', card: 'Carta Matyr / Carta Spore (+2 VIT)', desc: 'Aumenta ainda mais o HP.' },
            { slot: 'Acessório 2', name: 'Anel de Caveira [1]', card: 'Carta Spore (+2 VIT)', desc: 'Mais bônus de vitalidade.' }
          ],
          souls: [
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' },
            { name: 'Alma de Acidus', effect: '+5% Defesa Sagrado e dano Sagrado.' }
          ],
          combatStrategy: 'Vincule Redenção nos aliados mais frágeis (como Criador, Bruxo ou Sacerdote) e avance desferindo Sacrifício do Mártir com a barra de vida abastecida.'
        },
        {
          id: 'paladin-crux-sagrado',
          name: 'Paladino Crux Divinum & Grand Cross (Sagrado)',
          badge: 'DANO SAGRADO',
          focus: 'Grand Cross Área · Crux Divinum Single · Alta INT e VIT',
          description: 'Build alternativa de Paladino Sagrado. Em vez do Sacrifício baseado em HP, utiliza Crux Divinum e Grand Cross para infligir dano massivo da propriedade Sagrado em área — devastador contra Demônios e Mortos-Vivos.',
          stats: { str: 1, agi: 1, vit: 78, int: 90, dex: 75, luk: 1 },
          derivedGoals: { aspd: '155', sacriDmg: 'Grand Cross: 10.000 ~ 18.000 por onda', hp: '20.000 ~ 26.000 HP', dpsTier: 'A+ (Sagrado em Área)' },
          equipment: [
            { slot: 'Topo', name: 'Capelo [1] / Coroa de Louros [1]', card: 'Carta Isilla (+INT / Cast Red)', desc: '+INT e cast para Grand Cross.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: '+INT.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura Legionária [1]', card: 'Carta Peco Peco (+10% HP)', desc: 'HP alto e resistência.' },
            { slot: 'Arma', name: 'Espada de Duas Mãos [4] (+10)', card: 'Carta Necromante x4 (+INT / ignora MDEF)', desc: 'Maximiza o ATQM Sagrado do Grand Cross.' },
            { slot: 'Escudo', name: 'Escudo da Valquíria [1]', card: 'Carta Alice (-40% dano Chefes)', desc: 'Resistência em dungeons de demônios.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric', desc: 'Redução física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP)', desc: 'SP para Grand Cross contínuo.' },
            { slot: 'Acessório 1', name: 'Rosário [1]', card: 'Carta Fen (Conjuração Ininterrupta)', desc: 'Mantém o Grand Cross ao sofrer dano.' },
            { slot: 'Acessório 2', name: 'Rosário [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Acelera a conjuração.' }
          ],
          souls: [
            { name: 'Alma de Acidus', effect: '+5% Dano Sagrado e Resistência Sagrada.' },
            { name: 'Alma de Aliot', effect: '+5% HP e +5% SP Máximo.' }
          ],
          combatStrategy: 'Farm em Niflheim, Monastério ou Clock Tower. Invoque Grand Cross no centro dos mobs de demônios e mortos-vivos. Crux Divinum para alvos únicos.'
        },
        {
          id: 'paladin-shield-chain',
          name: 'Paladino Choque Rápido & Escudo Ranged (Shield Chain)',
          badge: 'CHOQUE RÁPIDO & RANGED',
          focus: 'Choque Rápido 5 Hits · Escudo Pesado (Cruzado/Valquíria) · Alta Precisão',
          description: 'A melhor opção de ataque à longa distância para Paladinos. O Choque Rápido dispara 5 golpes sucessivos de projétil cujo dano escala diretamente com o PESO e o REFINO do escudo equipado, sem consumir o próprio HP.',
          stats: { str: 85, agi: 1, vit: 78, int: 1, dex: 84, luk: 1 },
          derivedGoals: {"aspd":"172","sacriDmg":"Choque Rápido: 18.000 ~ 28.000 (5 Hits)","hp":"22.000 ~ 28.000 HP","dpsTier":"S (Dano Ranged Seguro)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Elmo de Osso [1] / Boina Alada",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "+FOR para Choque Rápido."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ e precisão."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura das Valquírias [1]",
                    "card": "Carta Porcellio (+25 ATQ) / Carta Peco Peco",
                    "desc": "Ataque e vida."
          },
          {
                    "slot": "Arma",
                    "name": "Lança de Caça [1] (+10) / Espada Imaterial",
                    "card": "Carta Cavaleiro do Abismo / Carta Esqueleto Operário",
                    "desc": "Arma primária de alto ATQ."
          },
          {
                    "slot": "Escudo",
                    "name": "Escudo Cruzado [1] (+10) / Escudo da Valquíria",
                    "card": "Carta Alice (-40% dano Chefes) / Carta Thara",
                    "desc": "Escudo com peso alto (300 de peso) para maximizar o dano do Choque."
          },
          {
                    "slot": "Capa",
                    "name": "Manto das Valquírias [1]",
                    "card": "Carta Menblatt (+Dano Ranged por DEX)",
                    "desc": "Escala de dano ranged."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Ferus Verde (+10% HP / +1 VIT)",
                    "desc": "Aumento de vida."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Presilha [1] / Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Reduz o pós-conjuração do Choque."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Presilha [1] / Luva [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "Dano extra de ataque."
          }
],
          souls: [
          {
                    "name": "Alma de Antique Firelock",
                    "effect": "+1% Dano Ranged por 2 refinos (Choque Rápido)."
          },
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo."
          }
],
          combatStrategy: 'Mantenha distância segura e dispare Choque Rápido continuamente no alvo. Os 5 projéteis de escudo atravessam as defesas do inimigo com precisão absoluta.'
        }
      ]
    },
    {
      id: 'scholar',
      name: 'Professor (Scholar)',
      tree: 'mage',
      category: 'Mago Transclasse',
      sprite: 'assets/sprites/classes/SAGE.gif',
      role: 'DPS Mágico de Autocast Bolter, Suporte Elemental & Desencantar',
      tags: ['Autocast Lança de Fogo/Gelo', 'Desencantar & Teia de Aranha', 'Bateria de SP em Grupo', 'Terrenos Elementais'],
      difficulty: 'Média-Alta',
      summary: 'O mestre dos elementos e da manipulação de magia. Com Autocast (Desejo Arcano) e Estudo de Livros, dispara tempestades de Lanças de Fogo, Gelo e Relâmpago enquanto ataca corpo a corpo a 190 ASPD.',
      mechanics: [
        '⚡ <b>Desejo Arcano (Autocast):</b> Dispara magias de nível 3/5 automaticamente a cada ataque físico.',
        '🕷️ <b>Prisão de Teia:</b> Prende o alvo no lugar e dobra todo o dano da propriedade Fogo recebido.',
        '🔋 <b>Troca Espiritual:</b> Transfere e regenera SP infinito para os membros do grupo.'
      ],
      builds: [
        {
          id: 'scholar-autocast',
          name: 'Professor Autocast Bolter (190 ASPD Elemental)',
          badge: 'AUTOCAST & DANO ELEMENTAL',
          focus: '190 ASPD com Livro · Chuva de Lanças Elementais · Prisão de Teia',
          description: 'A build mais dinâmica de Professor. Utiliza a velocidade máxima de ataque para ativar tempestades automáticas de Lanças de Fogo com Prisão de Teia para aplicar o dobro de dano.',
          stats: { str: 1, agi: 92, vit: 35, int: 92, dex: 40, luk: 1 },
          derivedGoals: { aspd: '190.0 (Cap Máximo)', boltDmg: '4.000 ~ 9.000 por ativação (2x na Teia)', castTime: 'N/A (Autocast Contínuo)', hp: '9.500 ~ 11.500', dpsTier: 'A+ (Contínuo Elemental)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1] / Chapéu de Bathory', card: 'Carta Isilla (+INT) / Carta Louva-a-Deus', desc: '+INT e poder mágico.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ/ATQM.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Porcellio / Carta Peco Peco', desc: 'Bônus de ataque para sustentar o autocast.' },
            { slot: 'Arma', name: 'Livro do Apocalipse [2] (+10) / Livro [3]', card: 'Carta Necromante (+1 INT / ignora MDEF)', desc: 'Livro de alto ATQM para maximizar as lanças.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara / Carta Alice', desc: 'Resistência essencial.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Bafomé Jr. (+3 AGI) / Carta Raydric', desc: 'Garante o cap de 190 ASPD.' },
            { slot: 'Calçado', name: 'Sapatos [1] / Botas [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e velocidade.' },
            { slot: 'Acessório 1', name: 'Broche [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Fecha a agilidade máxima.' },
            { slot: 'Acessório 2', name: 'Broche [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Teto de ASPD sem poções caras.' }
          ],
          souls: [
            { name: 'Alma de Tritão', effect: '+2% ASPD.' },
            { name: 'Alma de Archdam', effect: '-10% Tempo de Conjuração Variável.' }
          ],
          combatStrategy: 'Ative Desejo Arcano selecionando Lança de Fogo. Lance Prisão de Teia no alvo para travar seu movimento e dobre o dano das lanças enquanto desfere golpes a 190 ASPD.'
        },
        {
          id: 'scholar-sp-battery',
          name: 'Professor Bateria de SP & Suporte (PT / WoE)',
          badge: 'SUPORTE & CONTROLE',
          focus: 'Troca Espiritual Infinita · Desencantar (Remove Buffs) · Terreno Elemento',
          description: 'Build de Professor focada em suporte ofensivo. Usa Troca Espiritual para fornecer SP infinito ao grupo (essencial para spammers de habilidades como Sniper e Mestre). Desencantar remove buffs inimigos no WoE.',
          stats: { str: 1, agi: 1, vit: 80, int: 93, dex: 70, luk: 1 },
          derivedGoals: { aspd: '155', boltDmg: 'Bateria SP infinita para PT', castTime: 'Quase Insta-Cast', hp: '18.000 ~ 22.000', dpsTier: 'S (Suporte Essencial PT)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1]', card: 'Carta Isilla (+INT / Cast Red)', desc: '+INT para Troca Espiritual e Bolt.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: '+Cast Reduction.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Resistência para permanecer ativo.' },
            { slot: 'Arma', name: 'Livro do Apocalipse [2] (+10)', card: 'Carta Necromante x2 (+INT)', desc: '+INT para maximizar a transferência de SP.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara (-30% humanoide)', desc: 'Resistência em WoE.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric', desc: 'Proteção física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'Reserva de SP para Troca Espiritual.' },
            { slot: 'Acessório 1', name: 'Rosário [1]', card: 'Carta Fen (Conjuração Ininterrupta)', desc: 'Mantém Troca Espiritual ao tomar dano.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha o insta-cast de suporte.' }
          ],
          souls: [
            { name: 'Alma de Aliot', effect: '+5% HP Máximo e +5% SP Máximo.' },
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' }
          ],
          combatStrategy: 'Posicione-se na retaguarda. Transfira SP continuamente para Arquimago, Sniper e Mestre. Use Desencantar nos inimigos e Terrenos para controle.'
        },
        {
          id: 'scholar-terrenos-strategist',
          name: 'Professor Estrategista de Terrenos (Vulcão / Dilúvio / Bruma)',
          badge: 'TERRENOS & STRATEGIST',
          focus: 'Vulcão (+ATQ/Fogo) · Dilúvio (+HP/Água) · Bruma Ofuscante (Cegueira/Esquiva)',
          description: 'O mestre do controle ambiental em batalhas de grupo e WoE. Cria terrenos elementais que amplificam os danos dos aliados em até 20%, aumentam o HP máximo do grupo com Dilúvio e anulam magias de área com Bruma Ofuscante.',
          stats: { str: 1, agi: 1, vit: 85, int: 88, dex: 70, luk: 1 },
          derivedGoals: {"aspd":"155","boltDmg":"Buff de Terreno: +20% ATQ/Dano Elemental","castTime":"Insta-Cast de Terrenos","hp":"19.000 ~ 24.000","dpsTier":"S (Controle Estratégico)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Coroa de Louros [1]",
                    "card": "Carta Isilla (+INT / Cast Red)",
                    "desc": "+INT e conjuração rápida."
          },
          {
                    "slot": "Meio",
                    "name": "Orelhas de Elfo [1]",
                    "card": "Carta Isilla",
                    "desc": "+Cast Reduction."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Manto de Seda [1]",
                    "card": "Carta Marc (Imune a Congelamento)",
                    "desc": "Proteção contra magias de água."
          },
          {
                    "slot": "Arma",
                    "name": "Livro do Apocalipse [2] (+10)",
                    "card": "Carta Necromante x2 (+INT)",
                    "desc": "+INT para potencializar os terrenos."
          },
          {
                    "slot": "Escudo",
                    "name": "Escudo da Valquíria [1]",
                    "card": "Carta Thara (-30% humanoide)",
                    "desc": "Resistência em WoE."
          },
          {
                    "slot": "Capa",
                    "name": "Manto das Valquírias [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Proteção física."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Sohee (+15% SP Máx)",
                    "desc": "SP para manter terrenos ativos."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Rosário [1]",
                    "card": "Carta Fen (Conjuração Ininterrupta)",
                    "desc": "Garante a invocação do terreno sob ataque."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Fecha o tempo de cast."
          }
],
          souls: [
          {
                    "name": "Alma de Archdam",
                    "effect": "-10% Cast Variável."
          },
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo e +5% SP Máximo."
          }
],
          combatStrategy: 'Invoque Vulcão no chão sob seus DPSs físicos ou de fogo para conceder +20% de dano. Coloque Bruma Ofuscante na passagem dos inimigos para cegá-los e anular seus feitiços.'
        }
      ]
    },
    {
      id: 'gunslinger',
      name: 'Justiceiro (Gunslinger)',
      tree: 'expanded',
      category: 'Classe Expandida (Pistoleiro)',
      sprite: 'assets/sprites/classes/GUNSLINGER.gif',
      role: 'DPS Físico de Balas em Área (Desperado) & Rajada Certeira Sniper',
      tags: ['Desperado Área Brutal', 'Tiro Certeiro Sniper', 'Gatling Gun 190 ASPD', 'Moedas & Pânico'],
      difficulty: 'Fácil-Média',
      summary: 'Armado com revólveres, rifles, metralhadoras e escopetas. Causa um dos maiores DPS em área de curto alcance com Desperado (até 10 disparos por cast) e possui alcance extremo com o Rifle.',
      mechanics: [
        '🔫 <b>Desperado:</b> Até 10 tiros disparados em área ao redor do Justiceiro.',
        '🎯 <b>Rastrear o Alvo & Tiro Certeiro:</b> Ataque à longa distância de rifle que ignora a defesa do alvo.',
        '🪙 <b>Cara ou Coroa:</b> Acumula até 10 moedas para amplificar o dano de todas as habilidades.'
      ],
      builds: [
        {
          id: 'gs-desperado-burst',
          name: 'Justiceiro Desperado (Pistolas & Área)',
          badge: 'BURST EM ÁREA S',
          focus: 'Spam de Desperado em Mob · Alta FOR/DES · Danos Múltiplos',
          description: 'A build mais explosiva de Justiceiro. Focada em saltar no meio de hordas de monstros e disparar Desperado em sequência para aniquilar dezenas de alvos em frações de segundo.',
          stats: { str: 58, agi: 70, vit: 42, int: 1, dex: 85, luk: 1 },
          derivedGoals: { aspd: '185', desperadoHit: '2.500 ~ 4.500 por bala (até 10 balas)', castTime: 'Quase Instantâneo', hp: '10.500 ~ 12.500', dpsTier: 'S (Altíssimo em Mob)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu do Cowboy Errante [1] / Boina Alada', card: 'Carta Vanberk (+100 Crit) / Carta Louva-a-Deus', desc: 'Bônus de ataque e dano à distância.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+25 ATQ direto.' },
            { slot: 'Arma', name: 'Pistola de Seis Tiros [2] (+10) / Garrison [2]', card: 'Carta Cavaleiro do Abismo / Carta Esqueleto Operário', desc: 'Pistolas leves com alto poder de disparo.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Menblatt (+Dano Ranged por DEX)', desc: 'Escalamento de dano ranged.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e mobilidade.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Precisão e dano.' },
            { slot: 'Acessório 2', name: 'Anel [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Aumenta a força das balas.' }
          ],
          souls: [
            { name: 'Alma de Antique Firelock', effect: '+1% Dano à Distância por 2 refinos.' },
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Acumule 10 moedas com Cara ou Coroa, ative Aumentar Precisão, pule no meio dos monstros e dispare Desperado continuamente.'
        },
        {
          id: 'gs-rifle-sniper',
          name: 'Justiceiro Rifle & Rastrear Alvo (Sniper Mode)',
          badge: 'SNIPER DE LONGA DISTÂNCIA',
          focus: 'Tiro Certeiro de Rifle Ignora DEF · Alcance Extremo · Dano Ranged',
          description: 'Build alternativa usando Rifle para combate à longa distância. Tiro Certeiro ignora a DEF do alvo e possui altíssimo dano base. Ideal para MVPs e duelos à distância onde Desperado seria ineficiente.',
          stats: { str: 35, agi: 65, vit: 35, int: 1, dex: 99, luk: 20 },
          derivedGoals: { aspd: '178', desperadoHit: 'Tiro Certeiro: 12.000 ~ 20.000 (Ignora DEF)', castTime: 'Quase instantâneo', hp: '12.000 ~ 14.500', dpsTier: 'A+ (Sniper Ranged)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu do Cowboy Errante [1]', card: 'Carta Menblatt (+Dano Ranged por DEX)', desc: 'Escala de dano ranged via DEX.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: 'ATQ base alto.' },
            { slot: 'Arma', name: 'Rifle de Alcance [1] (+10) / Rifle Calibre 12 [2]', card: 'Carta Cavaleiro do Abismo / Carta Hidra', desc: 'Rifle de alta cadência e precisão.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Menblatt (+Dano Ranged por DEX)', desc: 'Dano ranged escalado.' },
            { slot: 'Calçado', name: 'Botas [1] / Sapatos [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e mobilidade.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Maximiza DEX para dano ranged.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'DEX total >= 130.' }
          ],
          souls: [
            { name: 'Alma de Antique Firelock', effect: '+1% Dano à Distância por 2 refinos.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Use Rastrear o Alvo para marcar o MVP. Spam de Tiro Certeiro que ignora toda a DEF. Acumule 10 moedas para maximizar cada disparo.'
        },
        {
          id: 'gs-gatling-gun-frenzy',
          name: 'Justiceiro Metralhadora Gatling (190 ASPD Febre do Gatling)',
          badge: '190 ASPD GATLING DPS',
          focus: 'Metralhadora Gatling · Febre do Gatling (+ASPD e ATQ) · Disparo em Rajada',
          description: 'Uma verdadeira tempestade de balas. Com Febre do Gatling ativada, a velocidade de disparo é catapultada para 190 ASPD com aumento maciço de ATQ, disparando centenas de projéteis por minuto em modo metralhadora.',
          stats: { str: 52, agi: 85, vit: 32, int: 1, dex: 80, luk: 1 },
          derivedGoals: {"aspd":"190.0 (Com Febre do Gatling)","desperadoHit":"Gatling: 3.000 ~ 5.500 por bala contínua","castTime":"Disparo Contínuo","hp":"11.000 ~ 13.500","dpsTier":"S+ (DPS Ranged Supremo)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Chapéu do Cowboy Errante [1] / Boina Alada",
                    "card": "Carta Vanberk (+100 Crit)",
                    "desc": "Críticos em metralhadora."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Traje de Gatuno [1]",
                    "card": "Carta Porcellio (+25 ATQ)",
                    "desc": "+25 ATQ para cada bala."
          },
          {
                    "slot": "Arma",
                    "name": "Metralhadora Gatling [2] (+10) / Butcher",
                    "card": "Carta Cavaleiro do Abismo / Carta Esqueleto Operário",
                    "desc": "Metralhadora pesada de alto calibre."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Menblatt (+Dano Ranged por DEX)",
                    "desc": "Escala de dano à distância."
          },
          {
                    "slot": "Calçado",
                    "name": "Botas [1] / Sapatos [1]",
                    "card": "Carta Matyr (+10% HP / +1 AGI)",
                    "desc": "Vida e velocidade."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Broche [1]",
                    "card": "Carta Kukre (+2 AGI)",
                    "desc": "Garante 190 ASPD."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Luva [1]",
                    "card": "Carta Zerom (+3 DEX)",
                    "desc": "Precisão e dano das balas."
          }
],
          souls: [
          {
                    "name": "Alma de Antique Firelock",
                    "effect": "+1% Dano Ranged por 2 refinos."
          },
          {
                    "name": "Alma de Tritão",
                    "effect": "+2% ASPD."
          }
],
          combatStrategy: 'Acumule 10 moedas com Cara ou Coroa, engatilhe Febre do Gatling e Aumentar Precisão. Segure o gatilho e derreta qualquer alvo à distância a 190 ASPD.'
        }
      ]
    },
    {
      id: 'ninja',
      name: 'Ninja',
      tree: 'expanded',
      category: 'Classe Expandida (Ninjutsu & Shuriken)',
      sprite: 'assets/sprites/classes/NINJA.gif',
      role: 'DPS Mágico Ninjutsu Elemental, Shuriken Huuma & Troca de Pele',
      tags: ['Troca de Pele Imune 3 Golpes', 'Ninjutsu Dragão de Fogo', 'Arremesso Shuriken Huuma', 'Evasão Extrema'],
      difficulty: 'Média',
      summary: 'Guerreiro das sombras do oriente. Possui a lendária habilidade Troca de Pele (Ciclo do Sol) para anular completamente até 3 golpes físicos diretos e desfere feitiços devastadores de Ninjutsu como Dragão de Fogo e Lança Congelante.',
      mechanics: [
        '🛡️ <b>Troca de Pele (Ciclo do Sol):</b> Ignora completamente até 3 ataques físicos diretos (inclusive Asura).',
        '🐉 <b>Dragão de Fogo & Lança Congelante:</b> Feitiços elementais rápidos com grande alcance e dano.',
        '🌀 <b>Arremesso de Shuriken Huuma:</b> Dano físico à distância em área massivo.'
      ],
      builds: [
        {
          id: 'ninja-dragao-ninjutsu',
          name: 'Ninja Ninjutsu Elemental (Dragão de Fogo & Gelo)',
          badge: 'MAGIA ELEMENTAL & EVASÃO',
          focus: 'Ninjutsu Mágico Rápido · Imunidade a 3 Golpes com Troca de Pele · Alta INT',
          description: 'A build suprema de Ninjutsu Mágico. Combina a proteção absoluta de Troca de Pele com a destruição em área do Dragão de Fogo e rajadas congelantes.',
          stats: { str: 1, agi: 1, vit: 41, int: 99, dex: 82, luk: 1 },
          derivedGoals: { aspd: '160', dragonDmg: '12.000 ~ 20.000 por dragão', castTime: '0.1s ~ Insta-Cast', hp: '8.000 ~ 10.000 (Imune a 3 hits)', dpsTier: 'A+ (Controle & Evasão)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1] / Máscara Kitsune', card: 'Carta Isilla (+INT e chance de -50% cast)', desc: 'Aumenta o ATQM.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQM.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Peco Peco (+10% HP) / Carta Porcellio', desc: '+HP e resistência.' },
            { slot: 'Arma', name: 'Main Gauche [4] (+10) / Stiletto [3] / Hakujin', card: 'Carta Necromante x3 (+3 INT / ignora 6% MDEF)', desc: 'Maximiza o poder mágico elemental.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Proteção contra golpes que superem a Troca de Pele.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'Sustentação contínua de feitiços.' },
            { slot: 'Acessório 1', name: 'Presilha [1] / Luva [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Acelera a invocação do Ninjutsu.' },
            { slot: 'Acessório 2', name: 'Presilha [1] / Luva [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha os pontos de conjuração.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Acidus', effect: '+5% Dano elemental e resistência.' }
          ],
          combatStrategy: 'Mantenha Troca de Pele sempre ativa. Invoque Dragão de Fogo para eliminar grupos de monstros ou Lança Congelante para alvos individuais.'
        },
        {
          id: 'ninja-huuma-shuriken',
          name: 'Ninja Huuma Shuriken (Dano Físico Ranged)',
          badge: 'DANO FÍSICO RANGED',
          focus: 'Arremesso Huuma em Área · Alta FOR e DES · Troca de Pele 3 Imunidades',
          description: 'Build física de Ninja focada no Arremesso de Shuriken Huuma: projétil pesado que atravessa múltiplos alvos infligindo dano massivo em área. Combina com Troca de Pele para absorver golpes letais.',
          stats: { str: 90, agi: 1, vit: 40, int: 1, dex: 92, luk: 1 },
          derivedGoals: { aspd: '150', dragonDmg: 'Huuma: 15.000 ~ 28.000 em área', castTime: 'Quase instantâneo', hp: '9.000 ~ 11.000 (Imune 3 hits)', dpsTier: 'A+ (Físico Ranged em Área)' },
          equipment: [
            { slot: 'Topo', name: 'Chapéu de Bebê Dragão [1] / Coroa de Louros [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: '+FOR para dano de Huuma.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Traje de Gatuno [1]', card: 'Carta Porcellio (+25 ATQ)', desc: '+ATQ direto.' },
            { slot: 'Arma', name: 'Shuriken Roda-Gigante Huuma [4] (+10)', card: 'Carta Cavaleiro do Abismo x2 / Carta Hidra', desc: 'Alta ATQ e dano em área.' },
            { slot: 'Capa', name: 'Manteau [1] / Sobrepeliz [1]', card: 'Carta Menblatt (+Dano Ranged por DEX)', desc: 'Dano ranged via DEX alta.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Matyr (+10% HP)', desc: 'Vida extra.' },
            { slot: 'Acessório 1', name: 'Presilha [1] / Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'DEX para precisão e dano ranged.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Maximiza o dano físico.' }
          ],
          souls: [
            { name: 'Alma de Antique Firelock', effect: '+1% Dano à Distância por 2 refinos.' },
            { name: 'Alma de Atroce', effect: '+50 ATQ fixo se FOR >= 95.' }
          ],
          combatStrategy: 'Mantenha Troca de Pele sempre ativa para absorver 3 golpes. Use Arremesso de Huuma para penetrar grupos de monstros com dano massivo em área.'
        },
        {
          id: 'ninja-final-strike-oneshot',
          name: 'Ninja Golpe Mortal (Final Strike One-Shot 40k+ Dmg)',
          badge: 'ONE-SHOT FINAL STRIKE',
          focus: 'Golpe Mortal (Consome HP Máximo) · Salto das Sombras · Troca de Pele',
          description: 'A lendária técnica de sacrifício do Ninja. O Golpe Mortal (Final Strike) consome todo o HP restante para desferir um único impacto devastador que ignora DEF, capaz de eliminar oponentes e mini-chefes em um único golpe.',
          stats: { str: 95, agi: 1, vit: 84, int: 1, dex: 40, luk: 1 },
          derivedGoals: {"aspd":"145","dragonDmg":"Golpe Mortal: 35.000 ~ 55.000 (Ignora DEF)","castTime":"Instantâneo com Salto","hp":"22.000 ~ 28.000 HP (Para o Golpe)","dpsTier":"S+ (Burst Fatal One-Shot)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Elmo de Osso [1] / Máscara Kitsune",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "+FOR para cálculo do golpe."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Traje de Gatuno [1]",
                    "card": "Carta Peco Peco (+10% HP)",
                    "desc": "+10% de HP direto para multiplicar o Golpe Mortal."
          },
          {
                    "slot": "Arma",
                    "name": "Main Gauche [4] (+10) / Stiletto [3] / Hakujin",
                    "card": "Carta Cavaleiro do Abismo x2 / Carta Hidra",
                    "desc": "Arma com maior ATQ para somar ao HP."
          },
          {
                    "slot": "Capa",
                    "name": "Manteau [1] / Sobrepeliz [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Proteção física."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Ferus Verde (+10% HP / +1 VIT)",
                    "desc": "Mais HP máximo para o multiplicador."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Anel [1]",
                    "card": "Carta Louva-a-Deus (+3 FOR)",
                    "desc": "Aumenta a FOR total."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Anel de Caveira [1]",
                    "card": "Carta Spore (+2 VIT)",
                    "desc": "Mais vida para o golpe fatal."
          }
],
          souls: [
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo."
          },
          {
                    "name": "Alma de Atroce",
                    "effect": "+50 ATQ fixo se FOR >= 95."
          }
],
          combatStrategy: 'Ative Troca de Pele e Imagem Falsa. Aproxime-se com Salto das Sombras e dispare Golpe Mortal no alvo para aplicar o dano máximo baseado na sua barra de vida.'
        }
      ]
    },
    {
      id: 'soul_linker',
      name: 'Espiritualista (Soul Linker)',
      tree: 'expanded',
      category: 'Classe Expandida (Taekwon)',
      sprite: 'assets/sprites/classes/SOUL_REAPER.gif',
      role: 'Suporte Mágico de Vínculos de Alma, Esma Mágico & Ressurreição Automática',
      tags: ['Esma Mágico 10k+', 'Kaizel Ressurreição Automática', 'Kaupe Desvio 100%', 'Espíritos de Classe'],
      difficulty: 'Média',
      summary: 'Mestre espiritual com habilidades de suporte lendárias como Kaizel (ressurreição imediata ao morrer) e Kaupe (100% de chance de esquivar de um golpe fatal), além do devastador poder ofensivo do Esma.',
      mechanics: [
        '🔮 <b>Esma:</b> Dano mágico concentrado de múltiplos hits sem tempo de recarga.',
        '🕊️ <b>Kaizel:</b> Ao morrer, o personagem revive automaticamente com HP cheio instantaneamente.',
        '🌀 <b>Espíritos de Classe:</b> Concede bônus extraordinários a outras classes conectadas.'
      ],
      builds: [
        {
          id: 'sl-esma-kaizel',
          name: 'Espiritualista Esma Ofensivo & Kaizel',
          badge: 'DANO MÁGICO & AUTO-REVIVE',
          focus: 'Spam de Esma em 0s de Recarga · Imortalidade com Kaizel · Alta INT',
          description: 'A build ofensiva de Espiritualista capaz de desferir dezenas de milhares de dano por segundo com Esma enquanto se mantém protegido com Kaizel e Kaupe.',
          stats: { str: 1, agi: 1, vit: 44, int: 99, dex: 80, luk: 1 },
          derivedGoals: { aspd: '160', esmaDmg: '15.000 ~ 24.000 por cast', autoRevive: '100% HP com Kaizel', hp: '9.000 ~ 11.500', dpsTier: 'A+ (Spam Mágico Rápido)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1] / Chapéu de Bathory', card: 'Carta Isilla (+INT / Cast Red)', desc: '+INT e aceleração de conjuração.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQM.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Peco Peco (+10% HP)', desc: 'Defesa mágica e vida.' },
            { slot: 'Arma', name: 'Main Gauche [4] (+10) / Stiletto [3] / Bastão [4] / Bastão [3]', card: 'Carta Necromante x3 (+3 INT / ignora MDEF)', desc: 'Maximiza o poder de corte do Esma.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara / Carta Alice', desc: 'Defesa.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric (-20% neutro)', desc: 'Redução física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'Reserva de SP para spam.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Acelera o Esma.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Conjuração rápida.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Acidus', effect: '+5% Dano elemental.' }
          ],
          combatStrategy: 'Ative Kaizel e Kaupe permanentemente em si mesmo. Use Estin/Estoc para engatilhar o Esma e derreta o alvo em segundos.'
        },
        {
          id: 'sl-suporte-espiritos',
          name: 'Espiritualista Suporte de Espíritos (Buff de Classes)',
          badge: 'SUPORTE DE ESPÍRITOS',
          focus: 'Espíritos de Classe (Buffs Lendários) · Kaizel + Kaupe · Kaite Reflexão',
          description: 'Build de suporte pura do Espiritualista. Fornece Espíritos de Classe exclusivos que potencializam outras classes de formas únicas: Alcazar para Espadachins, Kaite para reflexão de magia, Ka-Series de buffs vitais.',
          stats: { str: 1, agi: 1, vit: 80, int: 85, dex: 66, luk: 1 },
          derivedGoals: { aspd: '155', esmaDmg: 'Espíritos de Classe: Buffs Exclusivos', autoRevive: 'Kaizel 100% HP + Kaupe', hp: '17.000 ~ 21.000', dpsTier: 'S (Suporte Absoluto PT)' },
          equipment: [
            { slot: 'Topo', name: 'Coroa de Louros [1]', card: 'Carta Isilla (+INT / Cast Red)', desc: '+INT para Espíritos e Esma.' },
            { slot: 'Meio', name: 'Orelhas de Elfo [1]', card: 'Carta Isilla', desc: '+Cast Reduction.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Manto de Seda [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Resistência para permanecer ativo.' },
            { slot: 'Arma', name: 'Main Gauche [4] (+10) / Stiletto [3]', card: 'Carta Necromante x3 (+INT)', desc: '+INT para maximizar Espíritos e Esma.' },
            { slot: 'Escudo', name: 'Broquel [1]', card: 'Carta Thara (-30% humanoide)', desc: 'Resistência no WoE/PT.' },
            { slot: 'Capa', name: 'Manto das Valquírias [1]', card: 'Carta Raydric', desc: 'Proteção física.' },
            { slot: 'Calçado', name: 'Sapatos da Maré [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'SP para todos os Espíritos de Classe.' },
            { slot: 'Acessório 1', name: 'Luva [1]', card: 'Carta Fen (Conjuração Ininterrupta)', desc: 'Mantém os Espíritos ao tomar dano.' },
            { slot: 'Acessório 2', name: 'Luva [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Fecha o insta-cast dos buffs.' }
          ],
          souls: [
            { name: 'Alma de Aliot', effect: '+5% HP e +5% SP Máximo.' },
            { name: 'Alma de Acidus', effect: '+5% Dano e Resistência Elemental.' }
          ],
          combatStrategy: 'Mantenha Kaizel e Kaupe em todos os aliados prioritários. Distribua Espíritos de Classe (Alcazar para LK, Ka* para Sacerdotes). Reflita magias com Kaite.'
        },
        {
          id: 'sl-kaite-reflex-tank',
          name: 'Espiritualista Tanque de Reflexão (Kaite Mágico + Kaupe Físico)',
          badge: 'REFLEXÃO TOTAL & TANQUE',
          focus: 'Kaite (Reflete 100% Magias) · Kaupe (Esquiva Física 100%) · Kaizel Auto-Revive',
          description: 'A build defensiva mais surpreendente do servidor. Com Kaite, reflete magias de alto escalão (como Nevasca, Meteoros e Lanças) diretamente contra quem as conjurou, enquanto Kaupe desvia de golpes físicos e Kaizel garante ressurreição imediata.',
          stats: { str: 1, agi: 1, vit: 95, int: 75, dex: 55, luk: 1 },
          derivedGoals: {"aspd":"155","esmaDmg":"Kaite: 100% Reflexão Mágica","autoRevive":"Kaizel 100% HP + Kaupe","hp":"20.000 ~ 25.000","dpsTier":"S (Anti-Mago & Tanque)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Coroa de Louros [1]",
                    "card": "Carta Grand Peco (+5% HP/DEF)",
                    "desc": "Defesa e HP."
          },
          {
                    "slot": "Meio",
                    "name": "Orelhas de Elfo [1]",
                    "card": "Carta Isilla",
                    "desc": "Conjuração rápida."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Manto de Seda [1]",
                    "card": "Carta Marc (Imune a Congelamento)",
                    "desc": "Imunidade crucial contra feitiços de gelo."
          },
          {
                    "slot": "Arma",
                    "name": "Main Gauche [4] (+10) / Stiletto [3]",
                    "card": "Carta Fabre x3 (+300 HP / +3 VIT)",
                    "desc": "Gera bônus puro de vida."
          },
          {
                    "slot": "Escudo",
                    "name": "Escudo da Valquíria [1]",
                    "card": "Carta Thara (-30% humanoide)",
                    "desc": "Resistência em combates PvP/WoE."
          },
          {
                    "slot": "Capa",
                    "name": "Manto das Valquírias [1]",
                    "card": "Carta Raydric (-20% neutro)",
                    "desc": "Proteção física."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos da Maré [1]",
                    "card": "Carta Ferus Verde (+10% HP / +1 VIT)",
                    "desc": "Aumenta a reserva de vida."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Rosário [1]",
                    "card": "Carta Fen (Conjuração Ininterrupta)",
                    "desc": "Mantém as Ka-habilidades ao sofrer dano."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Rosário [1]",
                    "card": "Carta Spore (+2 VIT)",
                    "desc": "Mais resistência."
          }
],
          souls: [
          {
                    "name": "Alma de Aliot",
                    "effect": "+5% HP Máximo e +5% SP Máximo."
          },
          {
                    "name": "Alma de Acidus",
                    "effect": "+5% Defesa Elemental."
          }
],
          combatStrategy: 'Mantenha Kaite nível 7 ativo permanentemente. Magos que conjurarem magias em você sofrerão o próprio dano refletido com força total, enquanto Kaupe bloqueia os golpes físicos.'
        }
      ]
    },
    {
      id: 'super_novice',
      name: 'Superaprendiz (Super Novice)',
      tree: 'expanded',
      category: 'Aprendiz Expandido',
      sprite: 'assets/sprites/classes/SUPERNOVICE.gif',
      role: 'Canivete Suíço: Magias, Golpes Físicos, Todos os Buffs & Anjo da Guarda',
      tags: ['Todos os Buffs 1ª Classe', 'Anjo da Guarda com 100% HP', 'Sem Morte = +10 All Stats', 'Autocast / Híbrido'],
      difficulty: 'Alta',
      summary: 'O guerreiro mais dedicado de Rune-Midgard. Pode aprender quase todas as habilidades de primeira classe (Acolyte, Mage, Thief, Merchant, Swordsman, Archer) e ganha +10 em todos os atributos se nunca morrer no nível 99.',
      mechanics: [
        '👼 <b>Anjo da Guarda:</b> Cura completamente o HP e SP ao subir de nível ou invocado em emergências.',
        '🌟 <b>Sem Morte = +10 All Stats:</b> Concede +10 em FOR, AGI, VIT, INT, DES e SOR se nunca tiver morrido.',
        '🛠️ <b>Acesso a Quase Todos os Equipamentos:</b> Pode equipar uma vasta gama de armas e itens leves.'
      ],
      builds: [
        {
          id: 'sn-autocast-hybrid',
          name: 'Superaprendiz Híbrido & Autocast',
          badge: 'CANIVETE SUÍÇO',
          focus: 'Buffs Completos (Bênção/Agi) · 190 ASPD · Autocast Elemental',
          description: 'A build suprema de Superaprendiz. Utiliza seus próprios buffs de Noviço para atingir 190 ASPD com facilidade enquanto desfere golpes duplos e magias simultâneas.',
          stats: { str: 45, agi: 90, vit: 25, int: 65, dex: 44, luk: 1 },
          derivedGoals: { aspd: '190.0 (Com seus Buffs)', allBuffs: 'Bênção, Agi, Fúria, Golpe Duplo', hp: '6.500 ~ 8.000', dpsTier: 'A (Versatilidade Extrema)' },
          equipment: [
            { slot: 'Topo', name: 'Gorro de Louyang [1] / Capelo [1]', card: 'Carta Vanberk (+100 Crit) / Carta Louva-a-Deus', desc: 'Item exclusivo da classe.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQ/ATQM.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All stats.' },
            { slot: 'Armadura', name: 'Armadura de Aprendiz [1]', card: 'Carta Peco Peco (+10% HP) / Carta Porcellio', desc: 'Aumento de vida para sobreviver.' },
            { slot: 'Arma', name: 'Stiletto [3] (+10) / Stiletto [3]', card: 'Carta Cavaleiro do Abismo / Carta Esqueleto Operário', desc: 'Arma leve de alta velocidade.' },
            { slot: 'Escudo', name: 'Escudo do Aprendiz [1]', card: 'Carta Thara / Carta Alice', desc: 'Defesa.' },
            { slot: 'Capa', name: 'Capuz [1] / Sobrepeliz [1]', card: 'Carta Sussurro (+20 Esquiva)', desc: 'Esquiva alta para não tomar hits.' },
            { slot: 'Calçado', name: 'Sapatos do Aprendiz [1]', card: 'Carta Matyr (+10% HP / +1 AGI)', desc: 'Vida e velocidade.' },
            { slot: 'Acessório 1', name: 'Presilha [1]', card: 'Carta Kukre (+2 AGI)', desc: 'Garante o cap de 190 ASPD.' },
            { slot: 'Acessório 2', name: 'Presilha [1]', card: 'Carta Louva-a-Deus (+3 FOR)', desc: 'Ataque extra.' }
          ],
          souls: [
            { name: 'Alma de Poring', effect: '+1% Drop rate.' },
            { name: 'Alma de Tritão', effect: '+2% ASPD.' }
          ],
          combatStrategy: 'Auto-buffe-se com Bênção 10, Aumentar Agilidade 10 e Concentração. Avance com Golpe Duplo ativo e use Cura para regenerar vida sem poções.'
        },
        {
          id: 'sn-mage-magnus',
          name: 'Superaprendiz Mago (Magnus & Feitiços)',
          badge: 'MAGO UNIVERSAL',
          focus: 'Feitiços de 1ª Classe · Magnus Exorcismus via Noviço · Alta INT',
          description: 'Build alternativa explorando a versatilidade mágica do Superaprendiz. Usa feitiços de Mago e Noviço para farm eficiente, incluindo Magnus Exorcismus de Noviço para grupos de mortos-vivos e Relâmpago/Lança de Gelo para mob.',
          stats: { str: 1, agi: 1, vit: 39, int: 99, dex: 83, luk: 1 },
          derivedGoals: { aspd: '152', allBuffs: 'Bênção + Agi + Feitiços de Mago', hp: '8.500 ~ 10.500', dpsTier: 'A (Versátil Mágico)' },
          equipment: [
            { slot: 'Topo', name: 'Gorro de Louyang [1] / Capelo [1]', card: 'Carta Isilla (+INT / Cast Red)', desc: '+INT e cast para feitiços.' },
            { slot: 'Meio', name: 'Olhos Biônicos', card: 'Sem slot', desc: '+3% ATQM.' },
            { slot: 'Baixo', name: 'Máscara Cirúrgica / Trevo de Quatro Folhas', card: 'Sem slot', desc: '+2 All Stats.' },
            { slot: 'Armadura', name: 'Armadura de Aprendiz [1]', card: 'Carta Marc (Imune a Congelamento)', desc: 'Resistência no farm mágico.' },
            { slot: 'Arma', name: 'Bastão [4] (+10) / Bastão [3]', card: 'Carta Necromante x2 (+INT / ignora MDEF)', desc: 'Maximiza o ATQM dos feitiços.' },
            { slot: 'Escudo', name: 'Escudo do Aprendiz [1]', card: 'Carta Thara / Carta Alice', desc: 'Defesa no farm.' },
            { slot: 'Capa', name: 'Capuz [1] / Sobrepeliz [1]', card: 'Carta Raydric', desc: 'Proteção física.' },
            { slot: 'Calçado', name: 'Sapatos do Aprendiz [1]', card: 'Carta Sohee (+15% SP Máx)', desc: 'SP para spam mágico.' },
            { slot: 'Acessório 1', name: 'Presilha [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Cast rápido.' },
            { slot: 'Acessório 2', name: 'Presilha [1]', card: 'Carta Zerom (+3 DEX)', desc: 'Insta-Cast.' }
          ],
          souls: [
            { name: 'Alma de Archdam', effect: '-10% Cast Variável.' },
            { name: 'Alma de Aliot', effect: '+5% SP Máximo.' }
          ],
          combatStrategy: 'Auto-buffe-se e spam Relâmpago ou Lança de Gelo contra grupos. Em dungeons de Mortos-Vivos, use Magnus Exorcismus de Noviço para limpar rapidamente.'
        },
        {
          id: 'sn-tank-fe-esquiva',
          name: 'Superaprendiz Tanque de Fé & Esquiva Perfeita (Esquiva 100 & Fé 10)',
          badge: 'TANQUE SAGRADO & ESQUIVA',
          focus: 'Fé Nv 10 (+HP e Sagrado) · Esquiva Perfeita Altíssima · Cura 10 & Suporte',
          description: 'A prova máxima de maestria de um Superaprendiz. Combina a habilidade passiva Fé nível 10 (+HP e +50% de resistência à propriedade Sagrado) com Esquiva Perfeita altíssima e Cura nível 10 para atuar como tanker em grupos.',
          stats: { str: 30, agi: 75, vit: 75, int: 40, dex: 30, luk: 40 },
          derivedGoals: {"aspd":"175","allBuffs":"Fé 10, Bênção 10, Agi 10, Cura 10","hp":"14.000 ~ 17.500 HP","dpsTier":"S (Sobrevivência Lendária)"},
          equipment: [
          {
                    "slot": "Topo",
                    "name": "Gorro de Louyang [1] / Capelo [1]",
                    "card": "Carta Grand Peco (+5% HP/DEF)",
                    "desc": "Item exclusivo da classe com bônus de HP."
          },
          {
                    "slot": "Meio",
                    "name": "Olhos Biônicos",
                    "card": "Sem slot",
                    "desc": "+3% ATQ/ATQM."
          },
          {
                    "slot": "Baixo",
                    "name": "Máscara Cirúrgica / Trevo de Quatro Folhas",
                    "card": "Sem slot",
                    "desc": "+2 All Stats."
          },
          {
                    "slot": "Armadura",
                    "name": "Armadura de Aprendiz [1]",
                    "card": "Carta Peco Peco (+10% HP)",
                    "desc": "Multiplica a barra de vida."
          },
          {
                    "slot": "Arma",
                    "name": "Stiletto [3] (+10)",
                    "card": "Carta Fabre x2 (+200 HP / +2 VIT)",
                    "desc": "Bônus de vida."
          },
          {
                    "slot": "Escudo",
                    "name": "Escudo do Aprendiz [1]",
                    "card": "Carta Alice (-40% dano Chefes) / Carta Thara",
                    "desc": "Resistência extrema."
          },
          {
                    "slot": "Capa",
                    "name": "Capuz [1] / Sobrepeliz [1]",
                    "card": "Carta Sussurro (+20 Esquiva) / Carta Raydric",
                    "desc": "Esquiva alta."
          },
          {
                    "slot": "Calçado",
                    "name": "Sapatos do Aprendiz [1]",
                    "card": "Carta Ferus Verde (+10% HP / +1 VIT)",
                    "desc": "Mais HP."
          },
          {
                    "slot": "Acessório 1",
                    "name": "Presilha [1]",
                    "card": "Carta Yoyo (+5 Esquiva Perfeita / +1 AGI)",
                    "desc": "Esquiva perfeita para evitar acertos."
          },
          {
                    "slot": "Acessório 2",
                    "name": "Presilha [1]",
                    "card": "Carta Yoyo (+5 Esquiva Perfeita / +1 AGI)",
                    "desc": "Esquiva perfeita adicional."
          }
],
          souls: [
            {
              name: 'Alma de Aliot',
              effect: '+5% HP Máximo e +5% SP Máximo.'
            },
            {
              name: 'Alma de Acidus',
              effect: '+5% Resistência Sagrado.'
            }
          ],
          combatStrategy: 'Ative Bênção, Agi e mantenha Fé nível 10 ativa. Posicione-se à frente dos monstros e use Cura para se auto-sustentar sem precisar de consumíveis caros.'
        }
      ]
    }
  ];

  function statCost(targetValue) {
    let total = 0;
    for (let s = 1; s < targetValue; s++) {
      total += Math.floor((s - 1) / 10) + 2;
    }
    return total;
  }

  function calcBuildTotalPoints(stats) {
    return statCost(stats.str || 1) +
           statCost(stats.agi || 1) +
           statCost(stats.vit || 1) +
           statCost(stats.int || 1) +
           statCost(stats.dex || 1) +
           statCost(stats.luk || 1);
  }

  let selectedClassId = null;
  let selectedBuildId = null;
  let selectedTreeFilter = 'all';
  let searchTerm = '';

  function getFilteredClasses() {
    return CLASSES_DATA.filter(cls => {
      if (selectedTreeFilter !== 'all' && cls.tree !== selectedTreeFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = cls.name.toLowerCase().includes(query);
        const matchCat = cls.category.toLowerCase().includes(query);
        const matchTags = cls.tags.some(t => t.toLowerCase().includes(query));
        if (!matchName && !matchCat && !matchTags) return false;
      }
      return true;
    });
  }

  function getSelectedClass() {
    if (!selectedClassId) return null;
    return CLASSES_DATA.find(c => c.id === selectedClassId) || null;
  }

  function getSelectedBuild() {
    const cls = getSelectedClass();
    if (!cls) return null;
    return cls.builds.find(b => b.id === selectedBuildId) || cls.builds[0];
  }

  function loadBuildIntoSimulator(build) {
    if (!build) return;

    if (typeof $ === 'function') {
      const simNivel = $('sim-nivel'); if (simNivel) simNivel.value = 99;
      const simStr = $('sim-str'); if (simStr) simStr.value = build.stats.str;
      const simAgi = $('sim-agi'); if (simAgi) simAgi.value = build.stats.agi;
      const simVit = $('sim-vit'); if (simVit) simVit.value = build.stats.vit;
      const simInt = $('sim-int'); if (simInt) simInt.value = build.stats.int;
      const simDex = $('sim-dex'); if (simDex) simDex.value = build.stats.dex;
      const simLuk = $('sim-luk'); if (simLuk) simLuk.value = build.stats.luk;

      const simName = $('sim-build-name');
      if (simName) simName.value = build.name;

      if (typeof saveProfile === 'function') saveProfile();
      if (typeof refreshCharacterSummary === 'function') refreshCharacterSummary();

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

    // IF NO CLASS IS SELECTED -> RENDER GALLERY CARDS (GRID VIEW)
    if (!currentClass) {
      const filtered = getFilteredClasses();

      container.innerHTML = `
        <div class="minmax-container">
          <!-- TOP FILTER BAR -->
          <div class="minmax-gallery-toolbar">
            <div class="minmax-tree-filters">
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'all' ? 'active' : ''}" data-tree="all">Todas as Classes (${CLASSES_DATA.length})</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'archer' ? 'active' : ''}" data-tree="archer">🏹 Arqueiro</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'merchant' ? 'active' : ''}" data-tree="merchant">💰 Mercador</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'swordman' ? 'active' : ''}" data-tree="swordman">⚔️ Espadachim</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'thief' ? 'active' : ''}" data-tree="thief">🗡️ Gatuno</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'mage' ? 'active' : ''}" data-tree="mage">🔮 Mago</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'acolyte' ? 'active' : ''}" data-tree="acolyte">✝️ Noviço</button>
              <button type="button" class="minmax-tree-btn ${selectedTreeFilter === 'expanded' ? 'active' : ''}" data-tree="expanded">✨ Expandidas</button>
            </div>

            <div class="minmax-search-wrap">
              <input type="text" id="minmaxClassSearch" class="minmax-search-input" placeholder="🔍 Filtrar por classe, papel ou tags..." value="${searchTerm}">
            </div>
          </div>

          <!-- GRID DE CARDS NO ESTILO OFICIAL -->
          <div class="minmax-cards-grid">
            ${filtered.map(cls => `
              <div class="minmax-class-card" data-select-class="${cls.id}">
                <div class="minmax-class-card-sprites">
                  <img src="${cls.sprite}" alt="${cls.name}" class="minmax-card-sprite" loading="lazy" decoding="async">
                </div>
                <div class="minmax-class-card-text">
                  <strong>${cls.name}</strong>
                  <span>${cls.category}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      bindGalleryEvents(containerId);
      return;
    }

    // IF A CLASS IS SELECTED -> RENDER FULL BUILD DETAIL VIEW
    const currentBuild = getSelectedBuild();
    if (!currentBuild) return;

    const isExpanded = ['gunslinger', 'ninja', 'super_novice', 'star_gladiator', 'soul_linker'].includes(currentClass.id);
    const maxBudget = isExpanded ? 1225 : 1373;
    const totalSpentPoints = calcBuildTotalPoints(currentBuild.stats);
    const jobLevelLabel = isExpanded ? '99/99' : '99/70';

    container.innerHTML = `
      <div class="minmax-container">
        <!-- DETAIL HEADER & NAVIGATION -->
        <div class="minmax-detail-nav">
          <button type="button" class="minmax-btn-back" id="btnBackToGallery">
            <span>← Voltar para Galeria de Classes</span>
          </button>
        </div>

        <!-- HERO DA CLASSE -->
        <section class="minmax-class-hero">
          <div class="minmax-hero-main">
            <div class="minmax-hero-avatar-wrap">
              <img src="${currentClass.sprite}" alt="${currentClass.name}" class="minmax-hero-sprite" loading="lazy" decoding="async">
            </div>
            <div class="minmax-hero-info">
              <div class="minmax-hero-tags">
                <span class="minmax-tag gold">${currentClass.category}</span>
                ${currentClass.tags.map(t => `<span class="minmax-tag">${t}</span>`).join('')}
              </div>
              <h2 class="minmax-hero-title">${currentClass.name}</h2>
              <p class="minmax-hero-desc">${currentClass.summary}</p>
            </div>
          </div>
        </section>

        <!-- SELETOR DE VERTENTES DE BUILDS (3 Opções) -->
        <section class="minmax-build-tabs-wrap">
          <span class="minmax-section-eyebrow">VERTENTES MIN-MAX (${currentClass.builds.length} OPÇÕES)</span>
          <div class="minmax-build-tabs">
            ${currentClass.builds.map(b => `
              <button type="button" class="minmax-build-tab ${b.id === currentBuild.id ? 'active' : ''}" data-minmax-build="${b.id}">
                <span class="minmax-build-badge">${b.badge}</span>
                <strong>${b.name}</strong>
                <small>${b.focus}</small>
              </button>
            `).join('')}
          </div>
        </section>

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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <h4 style="margin:0;">📊 Atributos Finais ${jobLevelLabel}</h4>
                  <span class="minmax-points-pill" title="Pontos de status gastos conforme curva progressiva do Ragnarok Online">${totalSpentPoints} / ${maxBudget} pts</span>
                </div>
                <div class="minmax-stats-grid">
                  <div class="minmax-stat-cell ${currentBuild.stats.str > 50 ? 'highlight' : ''}"><span>FOR</span><strong>${currentBuild.stats.str}</strong></div>
                  <div class="minmax-stat-cell ${currentBuild.stats.agi > 50 ? 'highlight' : ''}"><span>AGI</span><strong>${currentBuild.stats.agi}</strong></div>
                  <div class="minmax-stat-cell ${currentBuild.stats.vit > 50 ? 'highlight' : ''}"><span>VIT</span><strong>${currentBuild.stats.vit}</strong></div>
                  <div class="minmax-stat-cell ${currentBuild.stats.int > 50 ? 'highlight' : ''}"><span>INT</span><strong>${currentBuild.stats.int}</strong></div>
                  <div class="minmax-stat-cell ${currentBuild.stats.dex > 50 ? 'highlight' : ''}"><span>DES</span><strong>${currentBuild.stats.dex}</strong></div>
                  <div class="minmax-stat-cell ${currentBuild.stats.luk > 30 ? 'highlight' : ''}"><span>SOR</span><strong>${currentBuild.stats.luk}</strong></div>
                </div>
              </div>

              <div class="minmax-subcard">
                <h4>🎯 Metas & Métricas da Build</h4>
                <ul class="minmax-derived-list">
                  ${Object.entries(currentBuild.derivedGoals).map(([k, v]) => `
                    <li><span>${formatMetricLabel(k)}:</span> <b class="${k === 'dpsTier' ? 'gold' : ''}">${v}</b></li>
                  `).join('')}
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

    bindDetailEvents(containerId);
  }

  function formatMetricLabel(key) {
    const labels = {
      aspd: 'ASPD Alvo',
      crit: 'Taxa de Crítico',
      castTime: 'Tempo de Cast',
      hp: 'HP Médio (99)',
      dpsTier: 'Tier de DPS',
      acidDmg: 'Dano da Bomba Ácida',
      falconRate: 'Taxa de Falcão',
      falconDmg: 'Dano do Falcão',
      burstHit: 'Dano de Burst',
      spCost: 'Custo de SP',
      defIgnore: 'Ignorar DEF',
      edpDmg: 'Multiplicador EDP',
      hpFrenesi: 'HP no Frenesi',
      spiralDmg: 'Dano no Espiral',
      healPower: 'Poder de Cura',
      matqDmg: 'Dano de Feitiço',
      asuraDmg: 'Dano do Asura',
      backstabDmg: 'Dano de Apunhalar',
      hitRate: 'Taxa de Precisão',
      cartDmg: 'Dano de Choque',
      stunRate: 'Taxa de Atordoamento',
      sacriDmg: 'Dano do Sacrifício',
      boltDmg: 'Dano por Lança',
      desperadoHit: 'Dano por Bala',
      dragonDmg: 'Dano do Dragão',
      esmaDmg: 'Dano do Esma',
      autoRevive: 'Auto-Ressurreição',
      allBuffs: 'Buffs Ativos'
    };
    return labels[key] || key;
  }

  function bindGalleryEvents(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Filter by tree
    container.querySelectorAll('[data-tree]').forEach(btn => {
      btn.onclick = () => {
        selectedTreeFilter = btn.dataset.tree;
        render(containerId);
      };
    });

    // Search input (debounced with requestAnimationFrame)
    const searchInput = container.querySelector('#minmaxClassSearch');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchTerm = e.target.value;
        const filtered = getFilteredClasses();
        const grid = container.querySelector('.minmax-cards-grid');
        if (grid) {
          grid.innerHTML = filtered.map(cls => `
            <div class="minmax-class-card" data-select-class="${cls.id}">
              <div class="minmax-class-card-sprites">
                <img src="${cls.sprite}" alt="${cls.name}" class="minmax-card-sprite" loading="lazy" decoding="async">
              </div>
              <div class="minmax-class-card-text">
                <strong>${cls.name}</strong>
                <span>${cls.category}</span>
              </div>
            </div>
          `).join('');
        }
      };
    }

    // Delegated click for class cards
    if (!container._hasCardDelegate) {
      container._hasCardDelegate = true;
      container.addEventListener('click', e => {
        const card = e.target.closest('[data-select-class]');
        if (card) {
          selectedClassId = card.dataset.selectClass;
          const cls = getSelectedClass();
          selectedBuildId = cls?.builds[0]?.id || '';
          render(containerId);
        }
      });
    }
  }

  function bindDetailEvents(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Back to gallery
    const backBtn = container.querySelector('#btnBackToGallery');
    if (backBtn) {
      backBtn.onclick = () => {
        selectedClassId = null;
        selectedBuildId = null;
        render(containerId);
      };
    }

    // Switch build tab
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
    selectClass: (id) => { selectedClassId = id; },
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
