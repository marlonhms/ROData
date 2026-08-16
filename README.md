# AureumRO — Fan Database & Farm Dashboard

> **Banco de dados de monstros, itens, mapas, simuladores e otimização de farm para o servidor privado AureumRO de Ragnarok Online.**

Este é um projeto front-end de alta performance construído com tecnologias nativas (Vanilla HTML/CSS/JS). Ele consome uma base de dados local (`db.json`) contendo monstros, drops e mapas, combinando-a com ferramentas interativas e um pipeline de sincronização com a Wiki oficial do AureumRO.

---

## ⚡ Decisões de Arquitetura e Design

* **Vanilla por Escolha:** Estrutura baseada em HTML5 semântico, CSS puro com variáveis modernas (CSS Custom Properties) e JavaScript estruturado. Sem etapas de compilação ou dependências complexas de runtime, garantindo carregamento instantâneo.
* **Estado e Dados como Código:** Todo o banco de dados original vive em `db.json`. A interface do usuário renderiza os dados dinamicamente com base nas consultas, aplicando uma camada opcional de ajustes oficiais extraídos em tempo real ou em cache da Wiki do servidor.
* **Componentização e Responsividade:** Sidebar navegável, cards otimizados para exibição de dados densos, e filtros combinados para consulta rápida em dispositivos móveis e desktops.

---

## 🛠️ Funcionalidades Principais

O painel é dividido em duas grandes áreas de atuação:

### Home Econômica
* **Radar de Raw Zeny:** A página inicial cruza preços NPC, chances de drop, densidade de spawn e revisões da Wiki para apresentar índices históricos, impacto da última revisão e concentração das fontes de emissão.
* **Pressão e cenários explicáveis:** O radar prioriza itens que merecem revisão com os fatores que compõem a pontuação e projeta faixas de 7 e 30 dias em três cenários, sempre exibindo confiança, premissas e limitações.
* **Ranking decisório de itens:** A lista completa recalcula notas e posições para cenários restritivo, neutro e expansionista, permite busca e filtros e abre a ficha de cada item sem transformar os cenários em previsão oficial de preço.
* **Leitura responsável:** Os indicadores representam capacidade estrutural de geração de Zeny; não são tratados como inflação real nem como volume negociado entre jogadores.
* **Snapshot auditável:** `scripts/build-economy-snapshot.js` produz `economy-snapshot.json` após cada sincronização da Economia.

### 1. Consultas
* **Monstros (Database):** Ficha técnica detalhada de cada monstro do servidor, incluindo estatísticas de combate (HP, DEF, DEFM, Esquiva, Precisão), tamanho, raça e elemento.
* **Drops por Monstro:** Busca rápida indicando as taxas de drop de todos os itens associados a cada monstro.
* **Enciclopédia de Itens:** Catálogo completo de itens disponíveis com filtros por tipo de item.
* **Mapas:** Detalhamento geográfico que mostra quais monstros nascem em cada mapa e suas respectivas quantidades e tempos de reaparecimento.

### 2. Ferramentas
* **Simulador de Batalha (Em Expansão - ver [roadmap.md](roadmap.md)):** Mecanismo para simular o combate entre seu personagem e os monstros da base, calculando dano por hit, acerto e velocidade de ataque com base em atributos e fórmulas oficiais.
* **Otimizador de Farm:** Algoritmo que ajuda a identificar os melhores monstros para focar o farm, considerando os objetivos do jogador.
* **Onde Farmar Item:** Busca invertida para descobrir quais monstros dropam um determinado item e em qual mapa há maior densidade de spawn desses monstros.
* **Comparador de Mobs:** Interface lado a lado para analisar a eficiência de combate e drops entre diferentes alvos de caça.
* **Sincronização Wiki:** Painel integrado para visualizar e validar as atualizações de preços e dados obtidos da Wiki oficial.
* **Painel do Personagem:** Builds portáteis com atributos, equipamentos, cartas, Almas, Reborn e aplicação automática dos efeitos reconhecidos no catálogo. Cada Alma fica vinculada à peça elegível e acompanha a build salva ou compartilhada.
* **Auditoria de Efeitos:** Cada build informa a cobertura calculada, separa efeitos condicionais e destaca descrições que ainda exigem validação manual.
* **Buffs e Consumíveis:** Catálogo compacto com efeitos, duração, exclusividade e custo por hora integrado à projeção de farm.

---

## 🔄 Sistema de Sincronização Wiki

Para evitar atualizações manuais cansativas dos itens e preços de venda ajustados pela equipe do AureumRO, o projeto possui scripts utilitários em Node.js localizados na pasta `scripts/`:

* **`wiki-sync.js` (Preços de Venda / Economia):**
  * Consome a API do MediaWiki para ler a tabela de dados da página oficial de **Economia**.
  * Executando `wiki-preview.bat`, ele gera um relatório de correspondência (`wiki-sync-report.json`) mostrando itens alterados, conflitos ou correspondências exatas.
  * Exceções revisadas ficam registradas em `wiki-price-approvals.json`, com IDs, data e justificativa; o sincronizador nunca transforma conflitos em aprovação silenciosa.
  * Executando `wiki-apply.bat` (que roda o script com a flag `--apply`), ele gera um arquivo de substituições (`wiki-overrides.json`).
  * Na inicialização do dashboard, o JavaScript lê o `wiki-overrides.json` e sobrepõe automaticamente os preços alterados em memória, preservando a integridade do `db.json` original.
  
* **`wiki-patchnotes-sync.js` (Patch Notes / Mudanças Recentes):**
  * Busca o feed de edições recentes na Wiki do servidor e gera o arquivo `wiki-patchnotes.json` para exibir as novidades diretamente no dashboard por meio do painel de **Novidades (Patch Notes)**. Roda através do `sincronizar-patchnotes.bat`.
* **Balanceamento auditável e histórico por entidade:**
  * `game-balance.json` mantém somente sobrescritas de habilidades confirmadas pela Wiki, incluindo fórmula, nível máximo, recarga, conjuração e regras de crítico.
  * `data-history.json` registra cada alteração aplicada por habilidade ou item, com revisão, fonte e datas de observação/aplicação.
  * Ao executar `wiki-apply.bat`, preços seguros são aplicados em `wiki-overrides.json` e também acrescentados ao histórico sem duplicar revisões já registradas.
* **Histórico gráfico de preços NPC:**
  * `wiki-price-history-sync.js` percorre todas as revisões da página Economia, reconstrói a evolução de cada item e gera `price-history.json`.
  * O painel de mercado exibe cartões expansíveis com gráfico SVG, eventos por revisão e acesso à ficha do item.
  * `audit-price-history.js` verifica ordem cronológica, pontos duplicados e correspondência do último valor com os overrides ativos.

---

## 🗳️ Votação Comunitária (Patch Notes)

Acoplado ao painel de Patch Notes, existe um sistema de votação comunitária no qual os usuários podem classificar se uma mudança foi útil ou não.

* **Infraestrutura:** Desenvolvida como um microserviço separado na pasta `community-votes/`.
* **Stack do Backend:**
  * **Cloudflare Workers:** Servidor serverless que expõe a API REST de votação (`/votes` e `/vote`).
  * **Cloudflare D1:** Banco de dados SQL serverless integrado para armazenar os hashes dos eleitores (`voter_hash` baseado em um salt criptográfico para privacidade) e seus respectivos votos.
  * **Cloudflare Turnstile:** Proteção de segurança integrada na interface (via token invisível) para validação anti-bot antes de processar qualquer voto no Worker.
* **Configuração:** O arquivo `community-votes-config.json` na raiz aponta para a URL do Worker publicada e contém a chave pública do Turnstile (`turnstileSiteKey`).

Para subir o microserviço de votação, consulte o guia passo a passo em [community-votes/README.md](community-votes/README.md).

---

## 🚀 Como Rodar o Dashboard Localmente

Como o front-end é totalmente estático, qualquer servidor simples atende para testes locais:

```bash
# Exemplo rápido usando Node.js (npx)
npx serve .
```

Acesse o endereço retornado no terminal (geralmente `http://localhost:3000` ou similar).

### Validação da Fase 1

```bash
node scripts/test-character-effects.js
node scripts/audit-character-effects.js
node scripts/audit-soul-effects.js
node scripts/audit-economy-snapshot.js
```

Os comandos validam os cenários conhecidos do motor, medem a cobertura de equipamentos/cartas e auditam separadamente todos os efeitos de Almas.

---

Feito com intenção. © 2026 Marlon Henrique Serpa
