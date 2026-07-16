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

---

## 🔄 Sistema de Sincronização Wiki

Para evitar atualizações manuais cansativas dos itens e preços de venda ajustados pela equipe do AureumRO, o projeto possui scripts utilitários em Node.js localizados na pasta `scripts/`:

* **`wiki-sync.js` (Preços de Venda / Economia):**
  * Consome a API do MediaWiki para ler a tabela de dados da página oficial de **Economia**.
  * Executando `wiki-preview.bat`, ele gera um relatório de correspondência (`wiki-sync-report.json`) mostrando itens alterados, conflitos ou correspondências exatas.
  * Executando `wiki-apply.bat` (que roda o script com a flag `--apply`), ele gera um arquivo de substituições (`wiki-overrides.json`).
  * Na inicialização do dashboard, o JavaScript lê o `wiki-overrides.json` e sobrepõe automaticamente os preços alterados em memória, preservando a integridade do `db.json` original.
  
* **`wiki-patchnotes-sync.js` (Patch Notes / Mudanças Recentes):**
  * Busca o feed de edições recentes na Wiki do servidor e gera o arquivo `wiki-patchnotes.json` para exibir as novidades diretamente no dashboard por meio do painel de **Novidades (Patch Notes)**. Roda através do `sincronizar-patchnotes.bat`.

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

---

Feito com intenção. © 2026 Marlon Henrique Serpa
