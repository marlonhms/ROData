# Roadmap de Desenvolvimento: Simulador Avançado de Builds e Batalhas

Este documento detalha o planejamento para a implementação de um sistema completo de criação de personagens e simulação de batalhas inteligente. O objetivo é remover as inserções manuais repetitivas, baseando-se em um banco de dados robusto de equipamentos, cartas, atributos e habilidades, culminando em um simulador prático e padronizado.

## Fase 1: Extensão dos Dados Existentes e Estado Global (JS)
Como o projeto é hospedado de forma estática (GitHub Pages/Local) e já carrega os itens e monstros via `db.json`, esta etapa trata de organizar esses dados existentes e criar uma estrutura de dados (estado) em memória no JavaScript.

- **[x] Mapeamento das Propriedades Faltantes (PDFs):** Converter os dados dos arquivos `tamanho.pdf`, `monstros.pdf` e `elementos.pdf` em estruturas JavaScript dentro de `app.js` (como matrizes de fraqueza elemental e penalidades de tamanho por tipo de arma).
- **[x] Enriquecimento de Equipamentos e Cartas:** Garantir que os itens em `db.json` que são armas, armaduras ou cartas tenham seus atributos (slots, bônus de status) legíveis pelo simulador.
- **[x] Objeto "Personagem" (Estado Global em JS):** Criar uma variável global no JavaScript (ex: `APP.state.character`) para rastrear a build atual do usuário (atributos distribuídos, equipamentos equipados em cada slot e cartas ativas), para que esses dados possam ser lidos por qualquer parte do simulador e salvos no `localStorage`.

## Fase 2: Interface de Criação de Build (Step-by-Step)
Criar uma interface guiada, parecida com um "Wizard", para que o usuário monte seu personagem passo a passo antes de iniciar as simulações de fato.

- **[x] Etapa 1: Informações Básicas:** Seleção de Classe e preenchimento de Nível de Base e Nível de Classe.
- **[x] Etapa 2: Atributos (Stats):** Distribuição de pontos em FOR, AGI, VIT, INT, DES e SOR. O sistema deve calcular bônus derivados automaticamente (Ex: DES aumenta a precisão e velocidade de conjuração).
- **[x] Etapa 3: Equipamentos e Slots:**
  - Interface para equipar itens nos respectivos slots (Cabeça, Armadura, Arma, Escudo, Capa, Sapatos, Acessórios).
  - Seleção dinâmica de cartas para os slots disponíveis nos equipamentos selecionados.
  - Auto-preenchimento dos modificadores com base no que foi equipado.
- **[x] Etapa 4: Habilidades e Buffs:** Seleção de buffs passivos e ativos suportados pelo sistema (ex: Bênção, Aumentar Agilidade, concentração).

## Fase 3: Motor de Cálculo Inteligente (Engine de Batalha)
O simulador atual precisa ser refatorado para ser capaz de consumir o "Objeto Personagem" e suportar dinâmicas reais de combate.

- **[x] Padronização do Tipo de Ataque:** Adicionar a opção de escolher entre "Ataque Básico" ou utilizar uma "Habilidade Principal" de dano (Ex: Lança Espiral, Lâminas Destruidoras), padronizando a fonte de dano.
- **[x] Dinâmica de Cálculo de ATQ/ATQM:** Implementar a lógica real onde o ataque base da arma é modificado pela FOR/INT, somado ao dano dos equipamentos, e escalonado pelos multiplicadores percentuais das cartas e tamanho do monstro.
- **[x] Sistema de Elementos e Tabelas:** Utilizar a tabela de elementos real para aplicar as vantagens e desvantagens de dano (Ex: Arma elemental Água contra mob Fogo nível 3).
- **[x] Mitigação de Defesa:** Implementar o cálculo de redução de dano baseado na DEF/Hard DEF do monstro.

## Fase 4: Painel Unificado de Simulação (Personagem vs Mob)
A interface onde a "mágica" acontece. Aqui não criamos mais nada manualmente, apenas colhemos resultados.

- **[x] Seleção de Alvo e Cenário:** Uma busca limpa de monstros (já implementada, mas melhorada). Ao selecionar o mob, todos os seus dados (Tamanho, Raça, Elemento, Nível, HP, DEF, Flee) são carregados em background.
- **[x] Execução da Simulação:** Um botão de "Simular" que cruza o Objeto Personagem completo (Fase 2) com os Dados do Mob.
- **[ ] Exibição de Resultados Detalhados:**
  - Dano Causado por Hit (Mínimo, Médio e Máximo).
  - DPS Estimado (Dano por Segundo) baseado no ASPD (Velocidade de Ataque) do personagem.
  - TTK (Time to Kill): Quantos segundos e/ou golpes são necessários para abater o monstro (golpes já implementado).
  - **[x] Taxa de Acerto e Esquiva:** Cálculo real baseado no Hit do personagem vs Flee do monstro.

## Fase 5: Qualidade de Vida (QoL) e Persistência
- **[x] Sistema de Salvar Perfis:** Utilizar `localStorage` para que o usuário salve suas builds criadas. Ao recarregar a página, o "Personagem Padrão" da última sessão é carregado (conforme a solicitação de não precisar alterar toda hora).
- **[ ] Importação/Exportação:** Gerar um pequeno código ou JSON que permita ao usuário compartilhar sua build com outros jogadores.
- **[ ] Comparação Simples:** (Opcional futuro) Interface para comparar a Build A vs Build B contra o mesmo monstro.
