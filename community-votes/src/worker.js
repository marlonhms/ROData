const json = (data, status, origin) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': status === 200 ? 'no-store' : 'no-cache',
    'Vary': 'Origin'
  }
});

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : '';
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') || undefined
    })
  });
  const result = await response.json();
  return result.success === true;
}

async function totalsFor(env, patchIds) {
  if (!patchIds.length) return {};
  const placeholders = patchIds.map(() => '?').join(',');
  const result = await env.DB.prepare(
    `SELECT patch_id, SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS up, SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS down FROM votes WHERE patch_id IN (${placeholders}) GROUP BY patch_id`
  ).bind(...patchIds).all();
  return Object.fromEntries(patchIds.map(id => [id, { up: 0, down: 0 }]).concat(
    (result.results || []).map(row => [row.patch_id, { up: Number(row.up), down: Number(row.down) }])
  ));
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return json({ error: 'Origem não autorizada.' }, 403, 'null');
    if (request.method === 'OPTIONS') return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
      }
    });
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/votes') {
      const patchIds = [...new Set((url.searchParams.get('ids') || '').split(',').filter(id => /^[0-9]{1,12}$/.test(id)))].slice(0, 100);
      return json({ totals: await totalsFor(env, patchIds) }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/vote') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const limited = await env.VOTE_RATE_LIMITER.limit({ key: await sha256(ip) });
      if (!limited.success) return json({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429, origin);

      const body = await request.json().catch(() => ({}));
      const patchId = String(body.patchId || '');
      const voterId = String(body.voterId || '');
      const value = Number(body.value);
      if (!/^[0-9]{1,12}$/.test(patchId) || !/^[a-f0-9-]{20,64}$/i.test(voterId) || ![-1, 0, 1].includes(value)) {
        return json({ error: 'Voto inválido.' }, 400, origin);
      }
      if (!await verifyTurnstile(String(body.turnstileToken || ''), request, env)) {
        return json({ error: 'Não foi possível confirmar o voto.' }, 400, origin);
      }

      const voterHash = await sha256(`${env.DEVICE_SECRET}:${voterId}`);
      if (value === 0) {
        await env.DB.prepare('DELETE FROM votes WHERE patch_id = ? AND voter_hash = ?').bind(patchId, voterHash).run();
      } else {
        await env.DB.prepare(`INSERT INTO votes (patch_id, voter_hash, value) VALUES (?, ?, ?)
          ON CONFLICT(patch_id, voter_hash) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`)
          .bind(patchId, voterHash, value).run();
      }
      const totals = await totalsFor(env, [patchId]);
      return json({ ok: true, value, totals: totals[patchId] }, 200, origin);
    }

    return json({ error: 'Rota não encontrada.' }, 404, origin);
  }
};
