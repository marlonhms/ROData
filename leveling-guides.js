/**
 * leveling-guides.js - Guias de Leveling & Rotas de Up 1-99 por Classe
 * Integrado às Min-Max Builds e Otimização de Farms no AureumRO.
 * Baseado nos dados oficiais do DataStudio / Looker Studio DONATELLE e Wiki AureumRO.
 */

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.LevelingGuides = api;
  if (root) root.LevelingGuides = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LEVELING_DATA = {
    sniper: {
      classId: 'sniper',
      className: 'Atirador de Elite (Sniper)',
      tree: 'Arqueiro ➔ Caçador ➔ Atirador de Elite',
      statStrategy: 'Início: Foco em DES e AGI para disparos rápidos e esquiva. Ao virar transclasse e atingir o endgame, faça o reset para fechar 65 SOR + 150 DEX (Tiro Preciso 100% Crítico) ou 90+ AGI (Falcoeiro 190 ASPD).',
      phases: [
        {
          stage: '1ª Classe (10 ~ 20)',
          range: 'Nível 10 a 20',
          maps: 'Esporos (pay_fild08)',
          teleport: 'Teleportadora ➔ Cidades ➔ Payon (1 mapa à esquerda)',
          elements: '🔥 Flechas de Fogo (Hitkill garantido)',
          skills: 'Olhos de Águia Nv 10, Concentração Nv 10, Rajada de Flechas Nv 10',
          tip: 'Compre Flechas de Fogo na Loja de Utilidades de Payon ou Prontera para matar com 1 golpe.'
        },
        {
          stage: '1ª Classe (20 ~ 35)',
          range: 'Nível 20 a 35',
          maps: 'Lobos (pay_fild02)',
          teleport: 'Teleportadora ➔ Cidades ➔ Payon (desça 2 mapas)',
          elements: '🔥 Flechas de Fogo',
          skills: 'Rajada de Flechas contínua (o 3º hit causa o dobro de dano no AureumRO)',
          tip: 'Excelente taxa de drop de Garras de Lobo e Morangos para sustentar o SP.'
        },
        {
          stage: 'Transição 2ª Classe (35 ~ 60)',
          range: 'Nível 35 até virar Caçador (Job 40~50)',
          maps: 'Les / Moscovia 1 (mosk_dun01) ou Gatos de Folha (ayothaya)',
          teleport: 'Teleportadora ➔ Calabouços ➔ Calabouço de Moscovia',
          elements: '🔥 Flechas de Fogo',
          skills: 'Rajada de Flechas Nv 10',
          tip: 'As Les dão EXP massiva e morrem com facilidade para elemento Fogo. Não é obrigatório Job 50 para evoluir, mas garante mais pontos de skill.'
        },
        {
          stage: '2ª Classe / Caçador (60 ~ 79)',
          range: 'Nível 60 a 79',
          maps: 'Grand Orcs (gef_fild14), Vanberk (ra_san01), Pingüícula (spl_fild02) ou Anúbis em PT (in_sphinx4)',
          teleport: 'Teleportadora ➔ Campos ➔ Geffen 14 ou Esfinge 4',
          elements: '⚡ Flechas de Vento / 💧 Cristal / ✨ Prata',
          skills: 'Garra de Falcão Nv 10, Ataque Aéreo Nv 10, Caminho do Vento Nv 10',
          tip: 'Falcão autocaster metralha os monstros sem custo de SP. Em grupo, Anúbis com Flechas de Prata acelera muito o up.'
        },
        {
          stage: 'Transclasse & Endgame (80 ~ 99)',
          range: 'Nível 80 a 99',
          maps: 'Medusas (beach_dun2), Golem de Bradium (man_fild02), Magma Dungeon 2 (mag_dun02), Juperos 1 (juperos_01)',
          teleport: 'Teleportadora ➔ Calabouços ➔ Caverna de Comodo 2 ou Magma 2',
          elements: '⚡ Flechas de Vento / 💧 Cristal / 🔥 Fogo',
          skills: 'Tiro Preciso (Sharp Shooting) Nv 5, Visão Real Nv 10',
          tip: 'Com Tiro Preciso, junte os mobs e dispare no centro: a skill possui +35% de Crítico nativo no servidor, garantindo 100% de dano crítico com 65 de SOR no Alt+Q!'
        }
      ],
      highlights: [
        '🎯 <b>Tiro Preciso (SS):</b> +35% de taxa crítica nativa no AureumRO + 0,5s de recarga rápida.',
        '🏹 <b>Rajada de Flechas:</b> A cada 3 utilizações, o 3º hit desfere 2x o dano normal.',
        '🦅 <b>Falcoeiro Metralhadora:</b> ASPD 190 + Alma de Injustiçado/Tritão bombardeia o alvo sem consumir flechas.'
      ]
    },

    creator: {
      classId: 'creator',
      className: 'Criador (Creator / Biochemist)',
      tree: 'Mercador ➔ Alquimista ➔ Criador',
      statStrategy: 'Início: FOR e DES para dano e precisão com Mammonita 0z. Após virar Criador, suba INT e FOR para maximizar o dano da Bomba Ácida (AD) e Terror Ácido.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Payon Cave 1 (pay_dun00 - Zumbis/Esqueletos) / Muka / Chonchon de Aço',
          teleport: 'Teleportadora ➔ Calabouços ➔ Caverna de Payon 1',
          elements: '🔥 Fogo / ✨ Sagrado',
          skills: 'Desconto Nv 10, Mammonita Nv 10',
          tip: '⭐ <b>Regra AureumRO:</b> A habilidade Desconto Nv 10 elimina o custo de Zeny da Mammonita (0z por uso!). Você pode spammar Mammonita sem gastar nada!'
        },
        {
          stage: '1ª Classe (25 ~ 40)',
          range: 'Nível 25 a 40',
          maps: 'Lobos (pay_fild02) / Orc Zumbi (orcsdun01) / Vadon (iz_dun01)',
          teleport: 'Teleportadora ➔ Payon (2x baixo) ou Caverna dos Orcs 1',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Mammonita Nv 10, Cavalo-de-Pau Nv 1',
          tip: 'Excelente ganho de EXP e recursos para preparar poções futuras.'
        },
        {
          stage: 'Transição 2ª Classe (40 ~ 60)',
          range: 'Nível 40 até virar Alquimista (Job 40~50)',
          maps: 'Gatos de Folha (ayothaya) / Presentes (xmas_dun01) / Porcellio (ein_fild04) / Metaling',
          teleport: 'Teleportadora ➔ Santuário Ancestral ou Fábrica de Brinquedos 1',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Mammonita Nv 10, Aumentar Capacidade de Carga Nv 10',
          tip: 'Complete as missões do Grupo Éden para ganhar equipamentos e Aureum Coins úteis para o craft.'
        },
        {
          stage: '2ª Classe / Alquimista (60 ~ 85)',
          range: 'Nível 60 a 85',
          maps: 'Grand Orcs (gef_fild14), Pasana (in_sphinx4), Vento da Colina (ra_fild01), Focas / Lontras (cmd_fild02)',
          teleport: 'Teleportadora ➔ Campos ➔ Geffen 14 ou Esfinge 4',
          elements: '💧 Água / ⚡ Vento',
          skills: 'Criar Esfera Marinha Nv 1, Terror Ácido Nv 5, Criar Monstro Planta Nv 5',
          tip: 'Invoque um Homunculus (Amistr ou Vanilmirth) para atuar como tank de guerra. Terror Ácido e Esferas herdam o elemento da arma/encantamento.'
        },
        {
          stage: 'Transclasse & Endgame (85 ~ 99)',
          range: 'Nível 85 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1 (juperos_01), Anúbis (in_sphinx4), Caçadas de MVP',
          teleport: 'Teleportadora ➔ Calabouços ➔ Magma 2 ou Juperos',
          elements: '💧 Cristal / ⚡ Vento / Conversor Elemental',
          skills: 'Bomba Ácida (Acid Demonstration) Nv 10, Proteção Química Total Nv 5',
          tip: 'A Bomba Ácida escala com INT do Criador e VIT do alvo. Em monstros com muita VIT e chefes de instâncias, o dano é colossal.'
        }
      ],
      highlights: [
        '💰 <b>Mammonita 0z:</b> Desconto Nv 10 remove 100% do custo de Zeny da Mammonita no servidor.',
        '🧪 <b>Bomba Ácida (AD):</b> 1s de cooldown, sem cast variável em 150 DEX, destrói alvos com alta VIT.',
        '🛡️ <b>Homunculus Tanque:</b> Absorve dano e permite solar mapas avançados com segurança.'
      ]
    },

    star_gladiator: {
      classId: 'star_gladiator',
      className: 'Mestre Taekwon (Star Gladiator)',
      tree: 'Taekwon ➔ Mestre Taekwon',
      statStrategy: 'Foco inicial em FOR, AGI e DES para dano veloz e precisão. No endgame, o dano das Fúrias escala diretamente com FOR e AGI.',
      phases: [
        {
          stage: 'Taekwon Básico (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) / Lobos (pay_fild02)',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Brisa Leve (Fogo)',
          skills: 'Corrida Nv 10 (Cólera), Chute Aéreo Nv 7, Kihop Nv 5',
          tip: 'No AureumRO, o buff Cólera da Corrida dura 5 minutos (em vez de 2m30s), dobrando sua eficiência.'
        },
        {
          stage: 'Taekwon Avançado (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Les (mosk_dun01) / Soldado de Chumbo (xmas_dun01) / Caverna dos Orcs',
          teleport: 'Teleportadora ➔ Moscovia ou Fábrica de Brinquedos',
          elements: '🔥 Brisa Leve (Fogo) / ⚡ Vento',
          skills: 'Postura do Tornado Nv 1, Chute do Tornado Nv 7, Brisa Leve Nv 7',
          tip: 'Brisa Leve permite mudar de elemento a qualquer momento sem gastar conversores.'
        },
        {
          stage: 'Mestre Taekwon (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Gatos de Folha (ayothaya), Grand Orcs (gef_fild14), Plantas Carnívoras',
          teleport: 'Teleportadora ➔ Ayothaya ou Geffen 14',
          elements: 'Brisa Leve (conforme o mapa)',
          skills: 'Proteção Solar Nv 4 (+20 Hard DEF), Proteção Lunar Nv 4 (+24 Esquiva), Proteção Estelar (+8% ASPD)',
          tip: 'As Proteções no AureumRO não exigem mais o dia da semana específico, bastando estar no mapa alinhado!'
        },
        {
          stage: 'Mestre Taekwon Avançado (75 ~ 88)',
          range: 'Nível 75 a 88',
          maps: 'Vento da Colina (ra_fild01), Pasana (in_sphinx4), Focas (cmd_fild02)',
          teleport: 'Teleportadora ➔ Campos ➔ Rachel 1 ou Esfinge 4',
          elements: '🔥 Fogo / 💧 Água',
          skills: 'Oposição Solar/Lunar/Estelar Nv 3, Fúria Solar/Lunar/Estelar Nv 3',
          tip: 'No AureumRO, qualquer monstro pode ser marcado pela Oposição (sem travas de HP ou tamanho).'
        },
        {
          stage: 'Endgame & Alinhamentos (88 ~ 99)',
          range: 'Nível 88 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Caverna de Gelo 3, Mapas de Oposição',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: 'Brisa Leve adaptada ao mapa',
          skills: 'União Solar, Lunar e Estelar Nv 5, Auxílio Nv 3, Transmissão Nv 10',
          tip: 'União pode ser ativada sem necessidade de Link de Espiritualista e ignora DEF/Esquiva nos alvos marcados. Transmissão concede +50% de capacidade de carga permanente em todos os mapas.'
        }
      ],
      highlights: [
        '☀️ <b>Proteções Desbloqueadas:</b> Bônus de DEF, FLEE e ASPD ativos em qualquer dia da semana.',
        '🌌 <b>União Livre:</b> Ativável sem depender do Link de Espiritualista.',
        '📦 <b>Transmissão Permanente:</b> +50% de peso máximo fixo em qualquer mapa no Nível 10.'
      ]
    },

    lord_knight: {
      classId: 'lord_knight',
      className: 'Lorde (Lord Knight)',
      tree: 'Espadachim ➔ Cavaleiro ➔ Lorde',
      statStrategy: 'FOR, AGI e DES para up solo veloz com espada de duas mãos, ou FOR, DES e VIT para Perfurar em Espiral / Lança.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) / Lobos (pay_fild02) / Payon Cave 1',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Fogo / ✨ Sagrado',
          skills: 'Golpe Fulminante Nv 10, Impacto Explosivo Nv 10, Vigor Nv 10',
          tip: 'Impacto Explosivo no AureumRO concede +15% de dano físico final por 2 minutos e puxa inimigos ao redor.'
        },
        {
          stage: '1ª Classe (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Caverna dos Orcs 1 (orcsdun01), Vila dos Orcs (gef_fild10), Formigueiro Infernal',
          teleport: 'Teleportadora ➔ Geffen 10 ou Caverna dos Orcs',
          elements: '🔥 Fogo',
          skills: 'Perícia com Espada Nv 10 (+50 ATQ), Vigor Nv 10 (duração fixa de 1m30s)',
          tip: 'O Vigor dura 1m30s fixos e não termina mais ao levar golpes, facilitando juntar mobs.'
        },
        {
          stage: '2ª Classe / Cavaleiro (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Petites Terrestres (gef_fild08), Grand Orcs (gef_fild14), High Orcs',
          teleport: 'Teleportadora ➔ Geffen 8 ou Geffen 14',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Rapidez com Duas Mãos Nv 10, Avanço com Lança Nv 10, Impacto de Tyr Nv 10',
          tip: 'Rapidez com Duas Mãos garante ASPD alta para abater monstros rapidamente.'
        },
        {
          stage: 'Cavaleiro Avançado (75 ~ 88)',
          range: 'Nível 75 a 88',
          maps: 'Vento da Colina (ra_fild01), Anúbis (in_sphinx4), Cavalaria de Glast Heim (gl_knt01)',
          teleport: 'Teleportadora ➔ Rachel 1 ou Glast Heim Cavalaria',
          elements: '🔥 Fogo / ✨ Sagrado',
          skills: 'Impacto de Tyr Nv 10, Lâmina de Aura Nv 5',
          tip: 'Com Lâmina de Aura (+150 dano puro no Nv 5), o dano físico ultrapassa as defesas dos monstros.'
        },
        {
          stage: 'Lorde & Endgame (88 ~ 99)',
          range: 'Nível 88 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Thor 1 (grupo), Caverna de Gelo 3',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Cristal / ⚡ Vento',
          skills: 'Dedicação Nv 5, Frenesi Nv 1, Perfurar em Espiral Nv 5',
          tip: 'Frenesi no AureumRO mantém a regeneração de HP/SP ativa. Perfurar em Espiral com Lança de Caça causa dano colossal.'
        }
      ],
      highlights: [
        '💥 <b>Impacto Explosivo:</b> Concede +15% de dano físico final por 2 minutos.',
        '🛡️ <b>Vigor Inquebrável:</b> 1 min 30 seg de duração sem cancelar por hits recebidos.',
        '🌀 <b>Perfurar em Espiral:</b> Fórmula ampliada com 90% do peso da arma e (STR/5)².'
      ]
    },

    paladin: {
      classId: 'paladin',
      className: 'Paladino (Paladin)',
      tree: 'Espadachim ➔ Templário ➔ Paladino',
      statStrategy: 'VIT e INT para Crux Magnun / Sacrifício / Suporte, ou FOR, VIT e DES para Choque Rápido e Crux Divinum.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 30)',
          range: 'Nível 10 a 30',
          maps: 'Esporos / Lobos / Payon Cave 1',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Fogo / ✨ Sagrado',
          skills: 'Golpe Fulminante Nv 10, Provocar Nv 10, Vigor Nv 10',
          tip: 'Provocar retira -25 pontos fixos de Hard DEF do alvo, permitindo dano maior com armas básicas.'
        },
        {
          stage: 'Templário Inicial (30 ~ 55)',
          range: 'Nível 30 a 55',
          maps: 'Caverna dos Orcs 1, Navio Fantasma (moc_pryd01), Pirâmide 2',
          teleport: 'Teleportadora ➔ Caverna dos Orcs ou Pirâmide',
          elements: '✨ Sagrado (Crux Divinum)',
          skills: 'Crux Divinum Nv 10 (dano dobrado com Lança de 2 Mãos)',
          tip: 'Crux Divinum com Lança de Duas Mãos tem dano dobrado (1000% no Nv 10) e 0,5s de recarga.'
        },
        {
          stage: 'Templário Médio (55 ~ 75)',
          range: 'Nível 55 a 75',
          maps: 'Pirâmide 4, Esfinge 4, Niflheim 1 (nif_fild01), Glast Heim Monastério',
          teleport: 'Teleportadora ➔ Esfinge 4 ou Niflheim 1',
          elements: '✨ Sagrado',
          skills: 'Crux Magnun Nv 10, Bloqueio Nv 10, Rapidez com Lança Nv 10',
          tip: 'Crux Magnun no AureumRO é 100% dano mágico sagrado e entrega 3 hits completos por célula mesmo com monstros empilhados.'
        },
        {
          stage: 'Paladino / Transclasse (75 ~ 90)',
          range: 'Nível 75 a 90',
          maps: 'Anúbis (in_sphinx4), Santuário de Rachel (ra_san01), Caverna de Comodo 2',
          teleport: 'Teleportadora ➔ Esfinge 4 ou Rachel Santuário',
          elements: '✨ Sagrado / ⚡ Vento',
          skills: 'Sacrifício do Mártir Nv 5, Choque Rápido Nv 5',
          tip: 'Sacrifício não custa HP contra monstros normais e funciona com roubo de vida (Carta Rideword/Mosca). Choque Rápido tem 10 células de alcance.'
        },
        {
          stage: 'Endgame & Grupos (90 ~ 99)',
          range: 'Nível 90 a 99',
          maps: 'Monastério Maldito (Nameless 2-3), Magma Dungeon 2, Thor 1-3 (Redenção)',
          teleport: 'Teleportadora ➔ Nameless ou Thor',
          elements: '✨ Sagrado',
          skills: 'Redenção Nv 5 (15 células), Canto de Batalha Nv 10',
          tip: 'Canto de Batalha concede pacote completo fixo por 2 min para grupo e conjurador: +25% HP/SP, +10% dano, +150 DEF e +40 MDEF!'
        }
      ],
      highlights: [
        '✨ <b>Crux Magnun:</b> Dano mágico sagrado com 3 golpes garantidos por célula empilhada.',
        '🩸 <b>Sacrifício Contínuo:</b> Sem limite de golpes (toggle), sem trava de ASPD e 0 HP contra mobs comuns.',
        '📜 <b>Canto de Batalha Fixo:</b> Bônus garantidos para o grupo e conjurador por 2 minutos.'
      ]
    },

    assassin_cross: {
      classId: 'assassin_cross',
      className: 'Algoz (Assassin Cross)',
      tree: 'Gatuno ➔ Mercenário ➔ Algoz',
      statStrategy: 'AGI, FOR e DES para ataque duplo e esquiva; ao virar Algoz, adicione SOR para Crítico duplo com Katar ou INT para Destruidor de Almas.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Payon Cave 1 / Esporos / Muka',
          teleport: 'Teleportadora ➔ Payon ou Morroc',
          elements: '🔥 Fogo',
          skills: 'Ataque Duplo Nv 10, Perícia em Esquiva Nv 10',
          tip: 'Ataque Duplo com Adaga garante o up mais rápido do início do jogo.'
        },
        {
          stage: '1ª Classe (25 ~ 45)',
          range: 'Nível 25 a 45',
          maps: 'Lobos (pay_fild02), Formigueiro Infernal, Esgotos de Prontera 4',
          teleport: 'Teleportadora ➔ Payon ou Esgotos 4',
          elements: '🔥 Fogo',
          skills: 'Apunhalar Nv 10, Envenenar Nv 10',
          tip: 'No AureumRO, Apunhalar desfere 2 hits com 1200% de dano total.'
        },
        {
          stage: '2ª Classe / Mercenário (45 ~ 70)',
          range: 'Nível 45 a 70',
          maps: 'Les (mosk_dun01), Grand Orcs (gef_fild14), Petite Terrestre (gef_fild08)',
          teleport: 'Teleportadora ➔ Moscovia ou Geffen 14',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Perícia com Katar Nv 10, Lâminas Destruidoras Nv 10, Furtividade Nv 5',
          tip: 'Com Katar e cartas de Crítico, a taxa de crítico é dobrada passivamente.'
        },
        {
          stage: 'Mercenário Avançado (70 ~ 85)',
          range: 'Nível 70 a 85',
          maps: 'Vento da Colina (ra_fild01), Pasana (in_sphinx4), Ilha das Tartarugas 1',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: '💧 Água / ⚡ Vento',
          skills: 'Lâminas Destruidoras Nv 10, Tocaia Nv 5',
          tip: 'Use venenos e conversores elementais para acelerar o dano por segundo.'
        },
        {
          stage: 'Algoz & Endgame (85 ~ 99)',
          range: 'Nível 85 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Caverna de Gelo 3, Anúbis',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Cristal / ⚡ Vento',
          skills: 'Encantar com Veneno Mortal (EDP) Nv 5, Destruidor de Almas Nv 10',
          tip: 'EDP quadruplica o dano físico. Destruidor de Almas no AureumRO pode causar crítico e ignora esquiva do alvo.'
        }
      ],
      highlights: [
        '⚔️ <b>Apunhalar 2 Hits:</b> Multiplicador de 1200% em 2 golpes rápidos.',
        '☠️ <b>EDP Devastador:</b> Multiplicador 4x no dano físico de ataques e skills.',
        '💥 <b>Destruidor de Almas:</b> Dano híbrido físico + mágico de longo alcance.'
      ]
    },

    stalker: {
      classId: 'stalker',
      className: 'Desordeiro (Stalker)',
      tree: 'Gatuno ➔ Arruaceiro ➔ Desordeiro',
      statStrategy: 'AGI, DES e FOR para dano com Arco ou Adaga. Pode utilizar magias plagiadas com INT.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos / Lobos / Payon Cave 1',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Fogo',
          skills: 'Ataque Duplo Nv 10, Perícia em Esquiva Nv 10',
          tip: 'Up rápido e econômico aproveitando a esquiva alta.'
        },
        {
          stage: 'Arruaceiro Inicial (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Les (mosk_dun01) com Arco / Caverna dos Orcs com Plágio de Nevasca ou Combo Triplo',
          teleport: 'Teleportadora ➔ Moscovia 1 ou Caverna dos Orcs',
          elements: '🔥 Flechas de Fogo',
          skills: 'Plágio Nv 10, Perícia com Espada Nv 10',
          tip: '⭐ <b>Bônus AureumRO:</b> Perícia com Espada concede +4,5 de Crítico por nível para Arruaceiro/Desordeiro (+45 Crítico no Nv 10 com qualquer arma!).'
        },
        {
          stage: 'Arruaceiro Médio (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Gatos de Folha (ayothaya), Grand Orcs (gef_fild14), Plantas Carnívoras',
          teleport: 'Teleportadora ➔ Ayothaya ou Geffen 14',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Ataque Surpresa Nv 5, Afanar Nv 10, Mãos Leves Nv 10',
          tip: 'Afanar rouba Zeny e itens automaticamente enquanto você ataca.'
        },
        {
          stage: 'Desordeiro / Transclasse (75 ~ 90)',
          range: 'Nível 75 a 90',
          maps: 'Vento da Colina (ra_fild01), Anúbis (in_sphinx4), Focas (cmd_fild02)',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: '💧 Água / ✨ Sagrado',
          skills: 'Preservar Nv 1, Ataque Surpresa Nv 5, Plágio Nv 10',
          tip: 'Preservar impede que sua habilidade plagiada seja perdida ao receber dano de outras skills.'
        },
        {
          stage: 'Endgame (90 ~ 99)',
          range: 'Nível 90 a 99',
          maps: 'Magma Dungeon 2 com Chuva de Meteoros plagiada, Juperos 1, Medusas (beach_dun2)',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Cristal / ⚡ Vento',
          skills: 'Apunhalar Nv 10, Perseguição Nv 5, Preservar Nv 1',
          tip: 'Excelente classe para farm de drops e Zeny constante com Afanar + Ataque Surpresa.'
        }
      ],
      highlights: [
        '🗡️ <b>Perícia com Espada Única:</b> +45 de Crítico nativo com qualquer arma no Nv 10.',
        '📜 <b>Preservar + Plágio:</b> Mantenha Nevasca, Chuva de Meteoros ou Combo Triplo sem risco de perda.',
        '💰 <b>Afanar & Mãos Leves:</b> Renda extra constante de Zeny e drops em todos os monstros.'
      ]
    },

    high_priest: {
      classId: 'high_priest',
      className: 'Sumo Sacerdote (High Priest)',
      tree: 'Noviço ➔ Sacerdote ➔ Sumo Sacerdote',
      statStrategy: 'INT, VIT e DES para cura, redução de cast de Magnus Exorcismus e alta sobrevivência.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Payon Cave 1 (Zumbis/Esqueletos)',
          teleport: 'Teleportadora ➔ Caverna de Payon 1',
          elements: '✨ Sagrado (Cura Ofensiva)',
          skills: 'Curar Nv 10, Flagelo do Mal Nv 10, Aumentar Agilidade Nv 10',
          tip: 'Use Cura nos mortos-vivos (Shift + clique) para matar com 1 ou 2 casts.'
        },
        {
          stage: '1ª Classe / Sacerdote (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Navio Fantasma (moc_pryd01/02), Payon Cave 2-3, Pirâmide 2',
          teleport: 'Teleportadora ➔ Navio Fantasma ou Payon Cave 2',
          elements: '✨ Sagrado',
          skills: 'Bênção Nv 10, Kyrie Eleison Nv 10, Magnificat Nv 5',
          tip: 'Magnificat dobra a regeneração natural de SP de todo o grupo.'
        },
        {
          stage: 'Sacerdote Médio (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Pirâmide 4, Esfinge 4, Caverna dos Orcs 2 (Zenorc), Glast Heim Cemitério',
          teleport: 'Teleportadora ➔ Esfinge 4 ou Glast Heim',
          elements: '✨ Sagrado',
          skills: 'Turn Undead Nv 10, Magnus Exorcismus Nv 10, Glória Nv 5',
          tip: 'Turn Undead tem chance de eliminar monstros mortos-vivos instantaneamente com base em INT e SOR.'
        },
        {
          stage: 'Sumo Sacerdote (75 ~ 90)',
          range: 'Nível 75 a 90',
          maps: 'Anúbis (in_sphinx4), Santuário de Rachel (ra_san01), Niflheim 1 (nif_fild01)',
          teleport: 'Teleportadora ➔ Esfinge 4 ou Rachel',
          elements: '✨ Sagrado',
          skills: 'Magnus Exorcismus Nv 10, Suffragium Nv 3, Meditio Nv 10',
          tip: 'Meditio aumenta o poder de cura e a reserva máxima de SP passivamente.'
        },
        {
          stage: 'Endgame & Suporte (90 ~ 99)',
          range: 'Nível 90 a 99',
          maps: 'Monastério Maldito (Nameless 2-3), Thor 1-3 (Grupo), Juperos 1, Torre Sem Fim',
          teleport: 'Teleportadora ➔ Nameless ou Thor',
          elements: '✨ Sagrado',
          skills: 'Assumptio Nv 5, Santuário Nv 10, Ressuscitar Nv 4',
          tip: 'Assumptio dobra a Hard DEF e Soft DEF do alvo por 100 segundos. Classe indispensável para qualquer grupo.'
        }
      ],
      highlights: [
        '🛡️ <b>Assumptio:</b> Dobra a resistência a dano físico e mágico do alvo.',
        '☀️ <b>Magnus Exorcismus:</b> Limpa salas inteiras de Demônios e Mortos-vivos.',
        '🙏 <b>Suporte Universal:</b> Cura, buffs e ressurreição necessários em 100% dos conteúdos.'
      ]
    },

    high_wizard: {
      classId: 'high_wizard',
      className: 'Arquimago (High Wizard)',
      tree: 'Mago ➔ Bruxo ➔ Arquimago',
      statStrategy: 'INT e DES máximos para poder de feitiço e menor conjuração. No endgame, adicione VIT para sobrevivência e alcance 150 DEX para Insta-Cast.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) com Lanças de Fogo',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Lanças de Fogo Nv 10',
          skills: 'Lanças de Fogo Nv 10, Recuperação de SP Nv 10',
          tip: 'Hitkill em Esporos à distância sem receber dano.'
        },
        {
          stage: '1ª Classe (25 ~ 45)',
          range: 'Nível 25 a 45',
          maps: 'Mandrágoras, Lobos, Flora, Caverna de Payon 1',
          teleport: 'Teleportadora ➔ Prontera ou Payon',
          elements: '🔥 Fogo / ⚡ Relâmpago',
          skills: 'Barreira de Fogo Nv 10, Lanças de Gelo Nv 10',
          tip: 'Aprenda a fazer Barreira de Fogo vertical para prender e derreter monstros agressivos.'
        },
        {
          stage: '2ª Classe / Bruxo (45 ~ 70)',
          range: 'Nível 45 a 70',
          maps: 'Les (mosk_dun01), Grand Orcs (gef_fild14) com Barreira + Fogo, Siromas (ice_dun01)',
          teleport: 'Teleportadora ➔ Moscovia ou Geffen 14',
          elements: '🔥 Fogo / ⚡ Relâmpago',
          skills: 'Nevasca Nv 10, Chuva de Meteoros Nv 10, Ira de Thor Nv 10',
          tip: 'Nevasca Nv 1 congela a sala rapidamente; Nevasca Nv 10 destrói grupos inteiros de monstros de Fogo.'
        },
        {
          stage: 'Bruxo Avançado (70 ~ 85)',
          range: 'Nível 70 a 85',
          maps: 'Stings (gl_sew03), Caverna de Gelo 1 (Siroma), Vento da Colina (ra_fild01)',
          teleport: 'Teleportadora ➔ Glast Heim Esgotos 3 ou Caverna de Gelo',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Chuva de Meteoros Nv 10, Pântano dos Mortos Nv 5',
          tip: 'Pântano dos Mortos reduz a AGI e DEX dos monstros pela metade, facilitando o kite.'
        },
        {
          stage: 'Arquimago & Endgame (85 ~ 99)',
          range: 'Nível 85 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Santuário de Rachel (ra_san01)',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Nevasca / ⚡ Ira de Thor',
          skills: 'Amplificação Mágica Nv 10, Campo Gravitacional Nv 5',
          tip: 'Amplificação Mágica aumenta em +50% o MATQ do próximo feitiço. Com 150 DEX ou 100% de redução de cast, você atinge o Insta-Cast total!'
        }
      ],
      highlights: [
        '⚡ <b>Insta-Cast 0s:</b> Com 150 DEX ou bônus de Almas/Codex, conjure magias instantaneamente.',
        '🔮 <b>Amplificação Mágica:</b> +50% de poder mágico no próximo feitiço conjurado.',
        '❄️ <b>Nevasca & Meteoros:</b> O maior poder destrutivo em área para limpar calabouços.'
      ]
    },

    champion: {
      classId: 'champion',
      className: 'Mestre (Champion)',
      tree: 'Noviço ➔ Monge ➔ Mestre',
      statStrategy: 'Leveling: FOR, AGI e DES para up rápido de combos. No endgame, monte a build de Asura com FOR, INT, DES e VIT para dano de milhões de HP.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Payon Cave 1 / Esporos / Lobos',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Fogo / ✨ Sagrado',
          skills: 'Proteção Divina Nv 10, Flagelo do Mal Nv 10, Aumentar Agilidade Nv 10',
          tip: 'Bônus de esquiva e velocidade para combate corpo a corpo.'
        },
        {
          stage: 'Monge Inicial (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Caverna dos Orcs 1, Les (mosk_dun01), Formigueiro Infernal',
          teleport: 'Teleportadora ➔ Caverna dos Orcs ou Moscovia',
          elements: '🔥 Fogo',
          skills: 'Combo Triplo Nv 5, Combo Quádruplo Nv 5, Último Dragão Nv 5',
          tip: 'A sequência de combos ativa automaticamente e desfere dano rápido sem gastar poções.'
        },
        {
          stage: 'Monge Médio (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Grand Orcs (gef_fild14), Petite Terrestre, Stings (gl_sew03)',
          teleport: 'Teleportadora ➔ Geffen 14 ou Glast Heim Esgotos',
          elements: '🔥 Fogo',
          skills: 'Invocar Esferas Espirituais Nv 5, Impacto Psíquico Nv 5, Disparo de Esferas Nv 5',
          tip: 'Impacto Psíquico causa mais dano quanto maior for a defesa do inimigo!'
        },
        {
          stage: 'Mestre / Transclasse (75 ~ 90)',
          range: 'Nível 75 a 90',
          maps: 'Vento da Colina (ra_fild01), Anúbis (in_sphinx4), Pasana, Tartarugas 1',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: '💧 Água / ✨ Sagrado',
          skills: 'Zen Nv 1, Punho Supremo de Asura Nv 5, Passo Subterrâneo Nv 5',
          tip: 'Zen invoca 5 esferas instantaneamente com 1 clique, acelerando o ciclo de habilidades.'
        },
        {
          stage: 'Endgame & MVPs (90 ~ 99)',
          range: 'Nível 90 a 99',
          maps: 'Caverna de Gelo 3, Monastério Maldito, Magma Dungeon 2, Caçadas de MVP',
          teleport: 'Teleportadora ➔ Caverna de Gelo 3 ou Nameless',
          elements: '✨ Sagrado / Conversores',
          skills: 'Punho Supremo de Asura Nv 5, Fúria Interior Nv 5',
          tip: 'O Asura do Mestre é a habilidade com o maior dano de alvo único do Ragnarok, perfeito para disputar e fechar MVPs.'
        }
      ],
      highlights: [
        '👊 <b>Zen Instantâneo:</b> Invoca 5 esferas espirituais em uma fração de segundo.',
        '💥 <b>Punho Supremo de Asura:</b> Dano massivo insuperável baseado em FOR, SP atual e ATQ.',
        '🥋 <b>Passo Subterrâneo:</b> Mobilidade rápida através do mapa para se esquivar de golpes.'
      ]
    },

    scholar: {
      classId: 'scholar',
      className: 'Professor (Scholar)',
      tree: 'Mago ➔ Sábio ➔ Professor',
      statStrategy: 'Autocast: INT, AGI e DES para bater e conjurar lanças automaticamente. Suporte/Caster: INT, DES e VIT para suporte infinito de SP e controle de terreno.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos com Lanças de Fogo / Payon Cave',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Lanças de Fogo Nv 10',
          skills: 'Lanças de Fogo Nv 10, Recuperação de SP Nv 10',
          tip: 'Up seguro atacando de longe.'
        },
        {
          stage: 'Sábio Inicial (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Mandrágoras, Lobos, Les (mosk_dun01), Hode',
          teleport: 'Teleportadora ➔ Moscovia ou Morroc',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Estudo de Livros Nv 10, Conjuração Livre Nv 10, Desejo Arcano Nv 10',
          tip: 'Desejo Arcano autoconjura Lanças de Fogo ou Gelo ao atacar normalmente.'
        },
        {
          stage: 'Sábio Médio (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Siromas (ice_dun01), Grand Orcs (gef_fild14), Gatos de Folha',
          teleport: 'Teleportadora ➔ Caverna de Gelo 1 ou Geffen 14',
          elements: '🔥 Encantar com Chama / ⚡ Vento',
          skills: 'Encantar com Chama/Geada/Terremoto/Ventania Nv 5',
          tip: 'Encantar armas é uma das fontes de Zeny mais lucrativas no mercado de serviços.'
        },
        {
          stage: 'Professor / Transclasse (75 ~ 90)',
          range: 'Nível 75 a 90',
          maps: 'Vento da Colina (ra_fild01), Stings (gl_sew03), Caverna de Gelo 1',
          teleport: 'Teleportadora ➔ Rachel 1 ou Glast Heim',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Indulgência Nv 5, Exalar Alma Nv 1, Prespicácia Nv 1',
          tip: 'Indulgência converte HP em SP e Exalar Alma passa SP para os membros do grupo.'
        },
        {
          stage: 'Endgame & Suporte (90 ~ 99)',
          range: 'Nível 90 a 99',
          maps: 'Magma Dungeon 2, Juperos 1, Nameless 2, Torre Sem Fim / Cheffênia',
          teleport: 'Teleportadora ➔ Magma 2 ou Torre',
          elements: 'Elementos adaptados',
          skills: 'Bruma Ofuscante Nv 1, Prisão de Teia Nv 1, Desencantar Nv 5',
          tip: 'Bruma Ofuscante reduz em 75% o dano de ataques ranged recebidos. Teia prende alvos e dobra o dano de Fogo recebido.'
        }
      ],
      highlights: [
        '🔋 <b>Bateria Infinita de SP:</b> Indulgência + Exalar Alma suprem o SP de todo o grupo.',
        '🕸️ <b>Prisão de Teia:</b> Imobiliza o inimigo e dobra o próximo dano de Fogo sofrido.',
        '🌫️ <b>Bruma Ofuscante:</b> 75% de redução de dano físico e mágico à distância.'
      ]
    },

    whitesmith: {
      classId: 'whitesmith',
      className: 'Mestre-Ferreiro (Whitesmith)',
      tree: 'Mercador ➔ Ferreiro ➔ Mestre-Ferreiro',
      statStrategy: 'FOR, AGI e DES para combate rápido com machado/maça e choque de carrinho.',
      phases: [
        {
          stage: '1ª Classe (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Payon Cave 1 / Esporos / Muka',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Fogo',
          skills: 'Desconto Nv 10 (Mammonita 0z), Mammonita Nv 10',
          tip: 'Mammonita grátis graças ao Desconto Nv 10 no servidor.'
        },
        {
          stage: '1ª Classe (25 ~ 45)',
          range: 'Nível 25 a 45',
          maps: 'Lobos (pay_fild02), Orc Zumbi, Vadon',
          teleport: 'Teleportadora ➔ Payon ou Caverna dos Orcs',
          elements: '🔥 Fogo',
          skills: 'Aumentar Capacidade de Carga Nv 10, Mammonita Nv 10',
          tip: 'Mantenha o carrinho sempre cheio para aumentar a capacidade e dano.'
        },
        {
          stage: '2ª Classe / Ferreiro (45 ~ 70)',
          range: 'Nível 45 a 70',
          maps: 'Les (mosk_dun01), Gatos de Folha (ayothaya), Grand Orcs (gef_fild14)',
          teleport: 'Teleportadora ➔ Moscovia ou Geffen 14',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Adrenalina Pura Nv 5, Manejo Perfeito Nv 5, Força Excessiva Nv 5',
          tip: 'Adrenalina Pura aumenta a velocidade de ataque com machados e maças em +30%.'
        },
        {
          stage: 'Ferreiro Avançado (70 ~ 85)',
          range: 'Nível 70 a 85',
          maps: 'Vento da Colina (ra_fild01), Pasana (in_sphinx4), Petites Terrestres',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: '💧 Água / ⚡ Vento',
          skills: 'Martelo de Thor Nv 5, Golpe Propulsor Nv 10',
          tip: 'Golpe Propulsor atordoa os inimigos e causa dano elevado.'
        },
        {
          stage: 'Mestre-Ferreiro & Endgame (85 ~ 99)',
          range: 'Nível 85 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Anúbis, Caverna de Gelo 3',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Cristal / ⚡ Vento',
          skills: 'Choque de Carrinho Nv 10, Amplificar Poder Nv 5',
          tip: 'Com o carrinho cheio (8.000 de peso), o Choque de Carrinho desfere dano colossal e rápido.'
        }
      ],
      highlights: [
        '🛒 <b>Choque de Carrinho:</b> Escala diretamente com o peso do carrinho (até 8.000).',
        '⚡ <b>Adrenalina Pura & Força Excessiva:</b> +30% de ASPD e +25% de ATQ fixo para o grupo.',
        '🔨 <b>Refino Superior:</b> Bônus passivo para aprimorar equipamentos com segurança.'
      ]
    },

    gunslinger: {
      classId: 'gunslinger',
      className: 'Justiceiro (Gunslinger)',
      tree: 'Classe Expandida: Justiceiro',
      statStrategy: 'DEX, AGI e VIT para metralhar com Pistolas / Gatling ou explodir com Escopeta e Desperado.',
      phases: [
        {
          stage: 'Iniciante (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) / Lobos (pay_fild02)',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Balas de Fogo',
          skills: 'Tiro Rápido Nv 10, Olhos de Serpente Nv 10',
          tip: 'Compre Balas e Esferas na Loja de Armas de Einbroch ou Prontera.'
        },
        {
          stage: 'Intermediário (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Les (mosk_dun01), Caverna dos Orcs 1, Formigueiro Infernal',
          teleport: 'Teleportadora ➔ Moscovia ou Caverna dos Orcs',
          elements: '🔥 Balas de Fogo',
          skills: 'Cara ou Coroa Nv 5, Aumentar Precisão Nv 1',
          tip: 'Mantenha 10 moedas de Cara ou Coroa ativas para ganhar +20 de ATQ fixo.'
        },
        {
          stage: 'Avançado (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Grand Orcs (gef_fild14), Petite Terrestre, Gatos de Folha',
          teleport: 'Teleportadora ➔ Geffen 14 ou Ayothaya',
          elements: '🔥 Balas de Fogo / ⚡ Prata',
          skills: 'Desperado Nv 10, Ataque Triplo Nv 10',
          tip: 'Desperado atinge até 10 disparos por monstro quando usado colado no alvo.'
        },
        {
          stage: 'Veterano (75 ~ 88)',
          range: 'Nível 75 a 88',
          maps: 'Vento da Colina (ra_fild01), Pasana (in_sphinx4), Stings (gl_sew03)',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: '💧 Balas de Gelo / ⚡ Vento',
          skills: 'Desperado Nv 10, Rastrear Alvo Nv 10',
          tip: 'Excelente dano em área com Desperado em mobs aglomerados.'
        },
        {
          stage: 'Endgame (88 ~ 99)',
          range: 'Nível 88 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Medusas (beach_dun2), Anúbis',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Balas de Gelo / ✨ Prata',
          skills: 'Desperado Nv 10, Pânico do Justiceiro Nv 1, Tiro Total Nv 10',
          tip: 'Pânico do Justiceiro concede +30 de Esquiva e bônus defensivos em emergências.'
        }
      ],
      highlights: [
        '💥 <b>Desperado em Célula:</b> Causa até 10 hits múltiplos em combate corpo a corpo.',
        '🪙 <b>Cara ou Coroa:</b> Moedas acumulam ATQ e acionam buffs instantâneos.',
        '🎯 <b>Rastrear Alvo & Olhos de Serpente:</b> Alcance extremo e precisão impecável.'
      ]
    },

    ninja: {
      classId: 'ninja',
      className: 'Ninja',
      tree: 'Classe Expandida: Ninja',
      statStrategy: 'Ninjutsu: INT e DES para feitiços rápidos de fogo/gelo/raio. Físico / Mortal: FOR, AGI e VIT para Arremesso de Shuriken e Ataque Mortal.',
      phases: [
        {
          stage: 'Iniciante (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) com Pétalas Flamejantes',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Pétalas Flamejantes Nv 10',
          skills: 'Pétalas Flamejantes Nv 10, Prática com Shuriken Nv 10',
          tip: 'Pétalas Flamejantes mata monstros de terra/mortos-vivos com 1 uso à distância.'
        },
        {
          stage: 'Intermediário (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Lobos (pay_fild02), Les (mosk_dun01), Mandrágoras',
          teleport: 'Teleportadora ➔ Moscovia ou Payon',
          elements: '🔥 Fogo',
          skills: 'Troca de Pele Nv 5, Salto das Sombras Nv 5',
          tip: 'Troca de Pele anula completamente 3 golpes físicos recebidos, garantindo 100% de segurança.'
        },
        {
          stage: 'Avançado (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Grand Orcs (gef_fild14), Siromas (ice_dun01), Gatos de Folha',
          teleport: 'Teleportadora ➔ Geffen 14 ou Caverna de Gelo 1',
          elements: '🔥 Fogo / ⚡ Descarga Elétrica',
          skills: 'Lança Congelante Nv 10, Descarga Elétrica Nv 5, Dragão de Fogo Nv 5',
          tip: 'Dragão de Fogo limpa grupos inteiros de monstros de Terra e Mortos-vivos.'
        },
        {
          stage: 'Veterano (75 ~ 88)',
          range: 'Nível 75 a 88',
          maps: 'Caverna de Gelo 1 (Siroma), Stings (gl_sew03), Vento da Colina (ra_fild01)',
          teleport: 'Teleportadora ➔ Caverna de Gelo ou Glast Heim',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Grande Queda de Gelo Nv 5, Escudo de Chamas Nv 10',
          tip: 'Escudo de Chamas empurra os monstros para trás enquanto causa dano contínuo.'
        },
        {
          stage: 'Endgame (88 ~ 99)',
          range: 'Nível 88 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Anúbis, Caverna de Gelo 3',
          teleport: 'Teleportadora ➔ Magma 2 ou Juperos',
          elements: '💧 Grande Queda de Gelo / ⚡ Descarga Elétrica',
          skills: 'Ataque Mortal Nv 10, Imagem Falsa Nv 10',
          tip: 'Ataque Mortal drena o HP e causa um dano devastador que escala diretamente com a vida máxima.'
        }
      ],
      highlights: [
        '🥋 <b>Troca de Pele:</b> Anula até 3 golpes físicos diretos com esquiva garantida.',
        '🐉 <b>Dragão de Fogo & Gelo:</b> Feitiços elementais rápidos com grande área de impacto.',
        '🗡️ <b>Ataque Mortal:</b> Finalizador letal que escala com o HP máximo.'
      ]
    },

    soul_linker: {
      classId: 'soul_linker',
      className: 'Espiritualista (Soul Linker)',
      tree: 'Taekwon ➔ Espiritualista',
      statStrategy: 'INT, DES e VIT para poder de Esma e suporte com espíritos invocáveis.',
      phases: [
        {
          stage: 'Taekwon Básico (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) / Lobos (pay_fild02)',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Brisa Leve (Fogo)',
          skills: 'Chute Aéreo Nv 7, Kihop Nv 5, Corrida Nv 10',
          tip: 'Up rápido inicial com a árvore de chutes do Taekwon.'
        },
        {
          stage: 'Espiritualista Inicial (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Les (mosk_dun01), Caverna dos Orcs 1, Mandrágoras',
          teleport: 'Teleportadora ➔ Moscovia ou Caverna dos Orcs',
          elements: 'Estun / Estin / Esma',
          skills: 'Estin Nv 7, Estun Nv 7, Esma Nv 10',
          tip: '⭐ <b>Regra AureumRO:</b> Esma pode ser conjurada livremente e seu dano é (35 + Nível Base)% por círculo, com +30% de dano se usada logo após Estun/Estin!'
        },
        {
          stage: 'Espiritualista Médio (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Grand Orcs (gef_fild14), Siromas (ice_dun01), Gatos de Folha',
          teleport: 'Teleportadora ➔ Geffen 14 ou Ayothaya',
          elements: 'Esma Elemental',
          skills: 'Esma Nv 10, Espírito do Bruxo / Sacerdote',
          tip: 'Invoque companheiros espirituais (Bruxa, Caçadora, Cavaleiro) para lutar e conjurar ao seu lado.'
        },
        {
          stage: 'Avançado (75 ~ 88)',
          range: 'Nível 75 a 88',
          maps: 'Caverna de Gelo 1, Vento da Colina (ra_fild01), Anúbis (in_sphinx4)',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: 'Esma com elemento adaptado',
          skills: 'Esma Nv 10, Kaahi Nv 7, Kaupe Nv 3',
          tip: 'Kaahi restaura HP instantaneamente a cada hit recebido, tornando você quase imortal.'
        },
        {
          stage: 'Endgame & Grupos (88 ~ 99)',
          range: 'Nível 88 a 99',
          maps: 'Magma Dungeon 2 (mag_dun02), Juperos 1, Nameless 2, Torre Sem Fim / Cheffênia',
          teleport: 'Teleportadora ➔ Magma 2 ou Torre',
          elements: 'Esma',
          skills: 'Espírito dos Transcendentais Nv 5, Kaite Nv 7',
          tip: 'Espíritos no AureumRO duram 5 minutos + 12s por atributo e podem ser aplicados em qualquer classe!'
        }
      ],
      highlights: [
        '✨ <b>Esma Desbloqueado:</b> Dano de (35 + Nível)% por círculo com 1s de cooldown.',
        '👥 <b>Invocação de Espíritos:</b> Companheiros de IA (Bruxa, Cavaleiro, Caçadora) lutam ao seu lado.',
        '🛡️ <b>Kaahi & Kaupe:</b> Auto-cura ao receber dano e esquiva total de 1 golpe.'
      ]
    },

    super_novice: {
      classId: 'super_novice',
      className: 'Superaprendiz (Super Novice)',
      tree: 'Aprendiz ➔ Superaprendiz',
      statStrategy: 'FOR, AGI, INT e DES equilibrados para usufruir de todas as magias e ataques das 1ª classes.',
      phases: [
        {
          stage: 'Aprendiz Inicial (10 ~ 25)',
          range: 'Nível 10 a 25',
          maps: 'Esporos (pay_fild08) / Lobos (pay_fild02)',
          teleport: 'Teleportadora ➔ Payon',
          elements: '🔥 Lanças de Fogo ou Adaga',
          skills: 'Ataque Duplo Nv 10, Lanças de Fogo Nv 10',
          tip: 'Alcance Job 10 como Aprendiz e faça a quest em Al De Baran para virar Superaprendiz.'
        },
        {
          stage: 'Superaprendiz Inicial (25 ~ 50)',
          range: 'Nível 25 a 50',
          maps: 'Caverna dos Orcs 1, Les (mosk_dun01), Formigueiro Infernal',
          teleport: 'Teleportadora ➔ Moscovia ou Caverna dos Orcs',
          elements: '🔥 Fogo',
          skills: 'Curar Nv 10, Bênção Nv 10, Aumentar Agilidade Nv 10, Barreira de Fogo Nv 10',
          tip: 'Acesso simultâneo a buffs de noviço, magias de mago e ataques de gatuno.'
        },
        {
          stage: 'Intermediário (50 ~ 75)',
          range: 'Nível 50 a 75',
          maps: 'Gatos de Folha (ayothaya), Grand Orcs (gef_fild14), Siromas',
          teleport: 'Teleportadora ➔ Ayothaya ou Geffen 14',
          elements: '🔥 Fogo / ⚡ Vento',
          skills: 'Mammonita Nv 10 (com Desconto 10 = 0z), Golpe Fulminante Nv 10',
          tip: 'Aproveite o Desconto Nv 10 para usar Mammonita sem custo de Zeny.'
        },
        {
          stage: 'Avançado (75 ~ 88)',
          range: 'Nível 75 a 88',
          maps: 'Vento da Colina (ra_fild01), Pasana (in_sphinx4), Caverna de Gelo 1',
          teleport: 'Teleportadora ➔ Rachel 1 ou Esfinge 4',
          elements: '💧 Água / ⚡ Vento',
          skills: 'Kyrie Eleison, Furtividade, Furto',
          tip: 'Ao atingir 99 de Classe sem morrer nenhuma vez, você recebe +10 em Todos os Atributos!'
        },
        {
          stage: 'Endgame (88 ~ 99)',
          range: 'Nível 88 a 99',
          maps: 'Magma Dungeon 2 (com grupo), Juperos 1, Stings (gl_sew03)',
          teleport: 'Teleportadora ➔ Magma 2 ou Glast Heim',
          elements: 'Elementos adaptados',
          skills: 'Todas as perícias combinadas',
          tip: 'No AureumRO, Superaprendizes podem equipar qualquer elmo do jogo com o Espírito de Superaprendiz ativo.'
        }
      ],
      highlights: [
        '⭐ <b>Bônus de Sobrevivência:</b> +10 em Todos os Atributos ao fechar Job 99 sem mortes.',
        '🎩 <b>Uso de Elmos Universais:</b> Liberado para usar qualquer elmo com buff de espírito.',
        '🌈 <b>Versatilidade Total:</b> Combina feitiços, curas, furtividade e ataques físicos.'
      ]
    }
  };

  function getLevelingGuide(classId) {
    return LEVELING_DATA[classId] || null;
  }

  function getAllGuides() {
    return LEVELING_DATA;
  }

  return {
    LEVELING_DATA,
    getLevelingGuide,
    getAllGuides
  };
});
