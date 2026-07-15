# Sincronização com a Wiki AureumRO

A sincronização usa a página oficial `Economia` como uma camada de ajustes sobre o `db.json`. O banco original nunca é sobrescrito.

## Prévia segura

Também é possível executar `wiki-preview.bat` com dois cliques.

```powershell
& 'C:\Users\Marlon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\wiki-sync.js
```

O comando cria `wiki-sync-report.json`, classificando cada linha como correspondência, conflito, item já atualizado ou item não encontrado.

## Aplicar alterações confirmadas

Também é possível executar `wiki-apply.bat` com dois cliques.

```powershell
& 'C:\Users\Marlon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\wiki-sync.js --apply
```

Isso atualiza `wiki-overrides.json`. Na inicialização, o dashboard aplica essa camada aos itens em memória e preserva a fonte e a revisão da wiki.
