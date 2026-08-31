# Sincronização com a Wiki AureumRO

A sincronização usa a página oficial `Economia` como uma camada de ajustes sobre o `db.json`. O banco original nunca é sobrescrito.

## Sincronização Completa em Fila (Recomendado)

Para executar todas as sincronizações de uma só vez com um único clique (Patch Notes, Preços da Economia, Histórico de Preços, Snapshot Econômico e Auditorias):

Execute **`sincronizar-tudo.bat`** com dois cliques, ou pelo terminal:

```powershell
node scripts\sync-all.js
```

> **Dica:** Para incluir também o download e checagem de todas as 489 imagens de almas da Wiki, use:
> ```powershell
> node scripts\sync-all.js --with-sprites
> ```

## Prévia segura (Apenas Economia)

Também é possível executar `wiki-preview.bat` com dois cliques.

```powershell
node scripts\wiki-sync.js
```

O comando cria `wiki-sync-report.json`, classificando cada linha como correspondência, conflito, item já atualizado ou item não encontrado.

## Aplicar alterações confirmadas (Apenas Economia)

Também é possível executar `wiki-apply.bat` com dois cliques.

```powershell
node scripts\wiki-sync.js --apply
```

Isso atualiza `wiki-overrides.json`. Na inicialização, o dashboard aplica essa camada aos itens em memória e preserva a fonte e a revisão da wiki.

