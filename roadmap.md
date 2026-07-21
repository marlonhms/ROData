# Roadmap de Produto — AureumRO Farm Dashboard

## Visão do produto

Transformar a database do AureumRO em uma ferramenta de decisão para jogadores: **qual build usar, onde upar, onde farmar, quanto renderá por hora e por que uma escolha é melhor que outra**.

O roadmap prioriza confiança no cálculo antes de recomendação. Uma sugestão bonita, mas baseada em dados incompletos, reduz a credibilidade do dashboard.

## Princípios

- Dados oficiais da Wiki e do banco são a fonte primária.
- Cálculos devem explicar seus componentes; nunca somente mostrar uma nota final.
- O usuário preenche apenas o que não existe no banco.
- Estimativas sempre deixam claras as premissas: taxa, rota, consumo, área e risco.
- Recursos comunitários não bloqueiam recursos principais e preservam privacidade.

---

## Fase 0 — Fundação já entregue

**Objetivo:** tornar o dashboard uma base confiável para evolução.

- [x] Database de monstros, itens, drops, mapas e spawns.
- [x] Consulta de mobs, drops por monstro, enciclopédia de itens e mapas.
- [x] Sincronização manual da Wiki, com prévia, aplicação segura e visualizador de diferenças.
- [x] Snapshot de Patch Notes da Wiki e painel premium de mudanças recentes.
- [x] Perfil de personagem com atributos, equipamentos, cartas, bônus e builds salvas.
- [x] Simulador personagem versus monstro com raça, tamanho, elemento, HIT, FLEE, ASPD, dano e golpes estimados.
- [x] Pontuação inicial de hunt/farm.
- [x] Votação comunitária dos Patch Notes com Worker, D1 e Turnstile.

**Indicador de saída:** qualquer jogador consegue selecionar uma build, um mob e entender o resultado da batalha sem preencher atributos de itens manualmente.

---

## Fase 1 — Perfil de personagem confiável ✅

**Objetivo:** fazer com que uma build represente o personagem real do jogador e possa ser reutilizada por todas as ferramentas.

### Entregas

- [x] Completar o catálogo de slots: topo, meio, baixo, armadura, arma, escudo, capa, botas e acessórios.
- [x] Interpretar bônus de itens/cartas em campos estruturados: atributos, ATQ/ATQM, dano percentual, dano por raça/tamanho/elemento e resistência.
- [x] Catálogo de buffs consumíveis e de classe, com duração, custo e efeito no cálculo.
- [x] Indicador de campos incompletos: “esta build usa um item sem bônus estruturado”.
- [x] Importar/exportar build por link ou código compacto.
- [x] Duplicar build para testar variações sem alterar a original.

### Critérios de aceitação

- Equipar uma arma ou carta aplica automaticamente seus efeitos.
- Uma build compartilhada abre com os mesmos itens e atributos em outro navegador.
- O sistema explica quais efeitos não puderam ser calculados por falta de dados.

### Dependências

- Qualidade do catálogo de itens e cartas.
- Convenção única para descrever bônus estruturados no `db.json`.

---

## Fase 2 — Motor de combate auditável ✅

**Objetivo:** elevar o simulador de estimativa para uma engine explicável e fácil de validar com o jogo.

### Entregas

- [x] Separar dano físico, mágico, à distância e por habilidade.
- [x] Implementar fórmulas por habilidade suportada, com nível da skill e multiplicadores exibidos.
- [x] Aplicar DEF/MDEF, elemento/nível elemental, raça, tamanho, propriedade da arma e cartas na ordem correta.
- [x] Calcular acerto, crítico, esquiva, ASPD, DPS, golpes para matar e TTK.
- [x] Painel “Como chegamos neste dano?” com cada bônus, penalidade e multiplicador.
- [x] Selo de confiança por cálculo: completo, estimado ou incompleto.
- [x] Casos de teste conhecidos para cada fórmula, comparados a valores reais registrados pela comunidade/equipe.

### Critérios de aceitação

- O resultado de dano pode ser auditado linha a linha.
- Alterar uma carta, elemento ou tamanho atualiza dano, TTK e pontuação imediatamente.
- Fórmulas sem validação são explicitamente marcadas como estimativas.

### Dependências

- Fase 1 concluída para bônus de equipamentos confiáveis.
- Tabelas oficiais de elemento, tamanho e raça mantidas no banco.

---

## Fase 3 — Inteligência de farm e pontuação de hunt

**Objetivo:** responder “vale a pena farmar este mob com esta build?”.

### Modelo de retorno esperado

`mobs por hora × chance do drop × quantidade × preço de venda NPC`

O cálculo deve considerar, quando disponível:

- Tempo para matar e tempo de deslocamento/respawn.
- Chance de acertar, mortes esperadas e tempo de recuperação.
- Peso, limite de inventário, retorno à cidade e consumíveis.
- Drop bruto para NPC e valor configurável de itens especiais.
- XP base/job, penalidade ou bônus de nível e densidade de spawn.

### Entregas

- [ ] Receita bruta por hora (raw zeny) por mob e mapa.
- [ ] Valor esperado de drops, detalhado por item.
- [ ] XP/h de base e classe, com explicação das premissas.
- [ ] Custo/h de poções, flechas, catalisadores e teleporte.
- [ ] Lucro líquido/h e eficiência por peso/inventário.
- [ ] Nota de hunt de 0 a 100, dividida em XP, lucro, segurança, facilidade e adequação da build.
- [ ] Alertas acionáveis: HIT insuficiente, elemento ruim, dano baixo, mob muito resistente ou mapa pouco denso.
- [ ] Alternador de objetivo: **Upar**, **Zeny**, **Drops específicos** ou **Equilíbrio**.

### Critérios de aceitação

- O usuário vê a nota e também os fatores que a compõem.
- A nota muda de acordo com sua build, não apenas com o mob.
- Cada estimativa informa o que não foi possível incluir.

### Dependências

- Fase 2 para mobs/hora e risco coerentes.
- Dados de drops, preço NPC, spawn e mapas atualizados.

---

## Fase 4 — Recomendador “Próximo Farm Ideal”

**Objetivo:** entregar uma recomendação direta, personalizada e comparável.

### Entregas

- [ ] Ranking dos melhores mobs e mapas para a build ativa.
- [ ] Três recomendações principais: melhor para XP, melhor para zeny e melhor equilíbrio.
- [ ] Filtros por faixa de nível, mapa acessível, tipo de mob, risco e objetivo.
- [ ] Card explicativo: “por que este mapa foi recomendado”.
- [ ] Rotas de progressão: quando trocar de mapa conforme nível, dano ou objetivo.
- [ ] Aviso de baixa confiança quando faltarem dados de spawn, drop ou fórmula.
- [ ] Favoritar farms e comparar histórico de recomendações.

### Tela-alvo

> **Próximo Farm Ideal**
>
> Build ativa → mapa recomendado → XP/h, zeny/h, TTK, risco, itens-chave e motivo da recomendação.

### Critérios de aceitação

- Resultado inicial em até poucos segundos com o banco local.
- Usuário entende a diferença entre recomendação de lucro e de XP.
- Nenhum ranking esconde dados incompletos.

### Dependências

- Fase 3 entregue e calibrada.

---

## Fase 5 — Metas, tempo de up e diário de sessão

**Objetivo:** conectar estimativa do dashboard à evolução real do jogador.

### Entregas

- [ ] Meta de nível e cálculo de XP restante.
- [ ] Estimativa de monstros, tempo e consumíveis até a meta.
- [ ] Diário opcional de farm: duração, XP ganho, zeny, drops e mortes.
- [ ] Comparação entre esperado e realizado.
- [ ] Ajuste manual de eficiência por jogador/mapa, sem substituir o dado oficial.
- [ ] Histórico privado por navegador, com exportação opcional.

### Critérios de aceitação

- O usuário consegue responder “quanto falta para o próximo nível?” e “meu farm real está rendendo quanto?”.

### Dependências

- Fase 3 para projeções consistentes.

---

## Fase 6 — Comunidade e qualidade contínua

**Objetivo:** melhorar os dados e ferramentas com sinais da comunidade, sem depender deles para funcionar.

### Entregas

- [x] Votos úteis/não úteis em Patch Notes com proteção anti-spam.
- [ ] Votar se uma recomendação de farm foi útil.
- [ ] Relatar divergência de fórmula ou dado da Wiki.
- [ ] Fila administrativa de correções sugeridas.
- [ ] Ranking comunitário de builds compartilhadas, com versão do banco e da fórmula usada.
- [ ] Changelog de fórmulas para explicar alterações em resultados históricos.

### Critérios de aceitação

- Votos são globais, mas não exigem conta do jogador.
- Nenhum dado privado de build é exposto por padrão.

---

## Fase 7 — Operação, dados e confiança

**Objetivo:** garantir que o dashboard continue útil quando a Wiki e o servidor mudarem.

### Entregas

- [ ] Checklist de sincronização manual da Wiki antes de cada publicação.
- [ ] Relatório de cobertura: itens com preço, cartas com bônus e mobs com spawn/drops completos.
- [ ] Testes de regressão do motor de cálculo.
- [ ] Indicador de data da última sincronização em cada recomendação afetada.
- [ ] Cache e versionamento de dados para GitHub Pages.
- [ ] Página de metodologia: fórmulas, limites e premissas do dashboard.

### Critérios de aceitação

- Uma mudança na Wiki pode ser revisada, aplicada e publicada sem quebrar resultados anteriores silenciosamente.

---

## Ordem recomendada de execução

1. **Fase 1:** completar e estruturar o perfil de personagem.
2. **Fase 2:** validar o motor de combate e tornar os cálculos auditáveis.
3. **Fase 3:** consolidar XP/h, zeny/h, custo e nota de hunt.
4. **Fase 4:** lançar “Próximo Farm Ideal”.
5. **Fase 5:** metas e diário real de farm.
6. **Fases 6 e 7:** comunidade, governança e manutenção contínua.

## Próximo marco sugerido

**Milestone: Farm Score v2**

Entregar uma análise por mob com dano/TTK, XP/h, raw zeny/h, custo estimado, risco e explicação da nota. Este marco desbloqueia o recomendador de mapas e gera valor imediato mesmo antes do diário de sessão ou recursos sociais.
