const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};

const handleOptions = () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};

const getNow = () => Date.now();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    if (url.pathname === '/api/vote' && request.method === 'POST') {
      return handleVote(request, env);
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};

const handleVote = async (request, env) => {
  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

  const { item_id, guess, section, truth_source, client_id, time_ms } = body;
  if (!item_id || !guess || !section || !truth_source || !client_id) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const now = getNow();
  const existing = await env.DB.prepare(
    `SELECT created_at FROM votes WHERE item_id = ? AND client_id = ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(item_id, client_id)
    .first();

  if (existing && now - existing.created_at < ONE_DAY_MS) {
    return jsonResponse({ status: 'ignored', reason: 'duplicate' }, 200);
  }

  await env.DB.prepare(
    `INSERT INTO votes (item_id, client_id, guess, section, truth_source, time_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(item_id, client_id, guess, section, truth_source, time_ms || null, now)
    .run();

  return jsonResponse({ status: 'ok' });
};

const handleStats = async (env) => {
  const overallRow = await env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN guess = 'human' THEN 1 ELSE 0 END) as human,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot
     FROM votes`
  ).first();

  const sourceRows = await env.DB.prepare(
    `SELECT truth_source,
      COUNT(*) as total,
      SUM(CASE WHEN guess = 'human' THEN 1 ELSE 0 END) as human,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot
     FROM votes
     GROUP BY truth_source`
  ).all();

  const itemRows = await env.DB.prepare(
    `SELECT item_id, section, truth_source,
      COUNT(*) as total,
      SUM(CASE WHEN guess = 'human' THEN 1 ELSE 0 END) as human,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot
     FROM votes
     GROUP BY item_id, section, truth_source
     ORDER BY item_id ASC`
  ).all();

  const bySource = {};
  for (const row of sourceRows.results || []) {
    bySource[row.truth_source] = {
      total: row.total,
      human: row.human,
      bot: row.bot
    };
  }

  const byItem = {};
  for (const row of itemRows.results || []) {
    byItem[row.item_id] = {
      item_id: row.item_id,
      section: row.section,
      truth_source: row.truth_source,
      total: row.total,
      human: row.human,
      bot: row.bot
    };
  }

  return jsonResponse({
    overall: {
      total: overallRow?.total || 0,
      human: overallRow?.human || 0,
      bot: overallRow?.bot || 0
    },
    bySource,
    byItem
  });
};
