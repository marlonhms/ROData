# Sincronização com a Wiki AureumRO

A sincronização usa a página oficial `Economia` como uma camada de ajustes sobre o `db.json`. O banco original nunca é sobrescrito.

## Sincronização Completa em Fila (Recomendado)

Para executar todas as sincronizações de uma só vez (Patch Notes, Preços da Economia, Histórico de Preços, Snapshot Econômico, Auditorias e Git Commit/Push automático):

Execute **`sincronizar-tudo.bat`** com dois cliques, ou pelo terminal:

```powershell
node scripts\sync-all.js
```

> **Dica:** Para incluir também o download e checagem de todas as 489 imagens de almas da Wiki, use:
> ```powershell
> node scripts\sync-all.js --with-sprites
> ```

---

## Execução Individual (Avançado)

Caso deseje rodar etapas específicas manualmente pelo terminal:

- **Prévia de Preços:** `node scripts\wiki-sync.js` (gera `wiki-sync-report.json`)
- **Aplicar Preços:** `node scripts\wiki-sync.js --apply` (gera `wiki-overrides.json`)
- **Patch Notes:** `node scripts\wiki-patchnotes-sync.js` (gera `wiki-patchnotes.json`)
- **Histórico de Preços:** `node scripts\wiki-price-history-sync.js` (gera `price-history.json`)
- **Snapshot Econômico:** `node scripts\build-economy-snapshot.js` (gera `economy-snapshot.json`)


