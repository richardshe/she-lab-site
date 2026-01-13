/**
 * Spot the Bot - Cloudflare Worker
 * Handles vote submission and statistics retrieval
 * Uses Cloudflare D1 for data storage
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route requests
      if (url.pathname === '/api/vote' && request.method === 'POST') {
        return await handleVote(request, env, corsHeaders);
      }

      if (url.pathname === '/api/stats' && request.method === 'GET') {
        return await handleStats(request, env, corsHeaders);
      }

      // Not found
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Handle vote submission
 */
async function handleVote(request, env, corsHeaders) {
  try {
    const data = await request.json();

    // Validate required fields
    const { item_id, guess, section, truth_source, client_id, time_ms } = data;
    if (!item_id || !guess || !section || !truth_source || !client_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate guess value
    if (guess !== 'human' && guess !== 'bot') {
      return new Response(JSON.stringify({ error: 'Invalid guess value' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has already voted on this item (24h cooldown)
    const isDuplicate = await checkDuplicateVote(env.DB, client_id, item_id);
    if (isDuplicate) {
      return new Response(JSON.stringify({
        error: 'Already voted on this item',
        bot_percent: await getBotPercentForItem(env.DB, item_id)
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Record the vote
    const timestamp = Math.floor(Date.now() / 1000);
    await env.DB.prepare(`
      INSERT INTO votes (item_id, guess, section, truth_source, client_id, time_ms, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(item_id, guess, section, truth_source, client_id, time_ms || 0, timestamp).run();

    // Get updated stats for this item
    const botPercent = await getBotPercentForItem(env.DB, item_id);

    return new Response(JSON.stringify({
      success: true,
      bot_percent: botPercent
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error handling vote:', error);
    return new Response(JSON.stringify({ error: 'Failed to record vote' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle statistics retrieval
 */
async function handleStats(request, env, corsHeaders) {
  try {
    const stats = await getStatistics(env.DB);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve statistics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Check if client has already voted on this item (within 24 hours)
 */
async function checkDuplicateVote(db, clientId, itemId) {
  const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

  const result = await db.prepare(`
    SELECT COUNT(*) as count
    FROM votes
    WHERE client_id = ? AND item_id = ? AND timestamp > ?
  `).bind(clientId, itemId, oneDayAgo).first();

  return result.count > 0;
}

/**
 * Get percentage of "bot" guesses for a specific item
 */
async function getBotPercentForItem(db, itemId) {
  const result = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot_count
    FROM votes
    WHERE item_id = ?
  `).bind(itemId).first();

  if (!result || result.total === 0) return 0;
  return (result.bot_count / result.total) * 100;
}

/**
 * Get aggregate statistics
 */
async function getStatistics(db) {
  // Overall stats
  const overall = await db.prepare(`
    SELECT
      COUNT(*) as total_votes,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as total_bot_guesses,
      SUM(CASE WHEN guess = 'human' THEN 1 ELSE 0 END) as total_human_guesses
    FROM votes
  `).first();

  // Stats by source
  const bySourceResults = await db.prepare(`
    SELECT
      truth_source,
      COUNT(*) as total,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot_guesses
    FROM votes
    GROUP BY truth_source
  `).all();

  const bySource = {};
  for (const row of bySourceResults.results) {
    const botPercent = row.total > 0 ? (row.bot_guesses / row.total) * 100 : 0;
    bySource[row.truth_source] = {
      total: row.total,
      bot_guesses: row.bot_guesses,
      bot_percent: botPercent
    };
  }

  // Stats by item
  const byItemResults = await db.prepare(`
    SELECT
      item_id,
      truth_source,
      COUNT(*) as total,
      SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot_guesses
    FROM votes
    GROUP BY item_id, truth_source
  `).all();

  const byItem = {};
  for (const row of byItemResults.results) {
    const botPercent = row.total > 0 ? (row.bot_guesses / row.total) * 100 : 0;
    byItem[row.item_id] = {
      truth_source: row.truth_source,
      total: row.total,
      bot_guesses: row.bot_guesses,
      bot_percent: botPercent
    };
  }

  return {
    total_votes: overall.total_votes || 0,
    total_bot_guesses: overall.total_bot_guesses || 0,
    total_human_guesses: overall.total_human_guesses || 0,
    by_source: bySource,
    by_item: byItem
  };
}
