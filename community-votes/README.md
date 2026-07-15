# Votação comunitária dos Patch Notes

Serviço gratuito e separado do GitHub Pages, usando Cloudflare Workers, D1 e Turnstile.

## Ativação inicial

1. Crie uma conta gratuita em https://dash.cloudflare.com.
2. Instale o Node.js LTS e abra esta pasta em um terminal.
3. Execute `npm install` e depois `npx wrangler login`.
4. Execute `npx wrangler d1 create aureumro-community` e coloque o `database_id` retornado em `wrangler.jsonc`.
5. Ajuste `ALLOWED_ORIGIN` para o endereço exato do GitHub Pages.
6. Execute `npm run db:remote`.
7. Crie um widget Turnstile no painel Cloudflare, autorizando o domínio do GitHub Pages.
8. Execute `npx wrangler secret put TURNSTILE_SECRET` e informe a chave secreta do Turnstile.
9. Execute `npx wrangler secret put DEVICE_SECRET` e informe uma frase longa e aleatória.
10. Execute `npm run deploy`.
11. Copie a URL publicada e a chave pública do Turnstile para `community-votes-config.json` na raiz do projeto.

As chaves `TURNSTILE_SECRET` e `DEVICE_SECRET` nunca devem ser colocadas no Git.
