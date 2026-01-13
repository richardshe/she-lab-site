(() => {
  const API_BASE = '/api';
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const badgeConfig = {
    human: { label: 'Human', fallback: '#2f855a' },
    chatgpt: { label: 'ChatGPT', fallback: '#4c51bf' },
    claude: { label: 'Claude', fallback: '#b83280' },
    gemini: { label: 'Gemini', fallback: '#d97706' }
  };

  const state = {
    items: [],
    current: null,
    usedIds: new Set()
  };

  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  const getClientId = () => {
    const stored = localStorage.getItem('spotTheBotClientId');
    if (stored) return stored;
    const generated = (crypto.randomUUID && crypto.randomUUID()) || `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('spotTheBotClientId', generated);
    return generated;
  };

  const getSessionId = () => {
    const now = Date.now();
    const stored = localStorage.getItem('spotTheBotSession');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.expires_at && now < parsed.expires_at) {
          return parsed.id;
        }
      } catch (error) {
        // ignore malformed session
      }
    }
    const generated = (crypto.randomUUID && crypto.randomUUID()) || `session-${now}-${Math.random().toString(16).slice(2)}`;
    const expires_at = now + (30 * 60 * 1000);
    localStorage.setItem('spotTheBotSession', JSON.stringify({ id: generated, expires_at }));
    return generated;
  };

  const clearSessionStats = () => {
    const sessionId = getSessionId();
    localStorage.removeItem('spotTheBotSession');
    localStorage.removeItem(getSessionStatsKey(sessionId));
  };

  const getSessionStatsKey = (sessionId) => `spotTheBotSessionStats:${sessionId}`;

  const getSessionStats = () => {
    const sessionId = getSessionId();
    const stored = localStorage.getItem(getSessionStatsKey(sessionId));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        // ignore malformed stats
      }
    }
    return { total: 0, correct: 0, human: 0, bot: 0 };
  };

  const saveSessionStats = (stats) => {
    const sessionId = getSessionId();
    localStorage.setItem(getSessionStatsKey(sessionId), JSON.stringify(stats));
  };

  const renderSessionStats = (stats, target) => {
    if (!target) return;
    const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    const correctWidth = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    const incorrectWidth = stats.total ? 100 - correctWidth : 0;
    target.innerHTML = `
      <div class="spot-session-stat">
        <h3>${stats.total}</h3>
        <p>Guesses this session</p>
      </div>
      <div class="spot-session-stat">
        <h3>${accuracy}%</h3>
        <p>Accuracy</p>
      </div>
      <div class="spot-session-stat">
        <h3>${stats.human}</h3>
        <p>Guessed human</p>
      </div>
      <div class="spot-session-stat">
        <h3>${stats.bot}</h3>
        <p>Guessed bot</p>
      </div>
      <div class="spot-session-chart" role="img" aria-label="Session accuracy chart">
        <span class="spot-session-bar spot-session-bar--correct" style="width:${correctWidth}%">
          ${correctWidth}% correct
        </span>
        <span class="spot-session-bar spot-session-bar--incorrect" style="width:${incorrectWidth}%">
          ${incorrectWidth}% incorrect
        </span>
      </div>
    `;
  };

  const updateSessionStatsUI = () => {
    const stats = getSessionStats();
    renderSessionStats(stats, qs('[data-spot="session-stats"]'));
    renderSessionStats(stats, qs('[data-spot="session-summary"]'));
  };

  const normalizePassageText = (text) => {
    const replacements = {
      '\\alpha': 'α',
      '\\beta': 'β',
      '\\gamma': 'γ',
      '\\delta': 'δ',
      '\\epsilon': 'ε',
      '\\theta': 'θ',
      '\\lambda': 'λ',
      '\\mu': 'μ',
      '\\pi': 'π',
      '\\sigma': 'σ',
      '\\omega': 'ω'
    };
    let normalized = text;
    Object.entries(replacements).forEach(([latex, symbol]) => {
      const pattern = new RegExp(`\\$${latex}\\$`, 'g');
      normalized = normalized.replace(pattern, symbol);
    });
    return normalized;
  };

  const pickRandomItem = () => {
    if (!state.items.length) return null;
    if (state.usedIds.size >= state.items.length) {
      state.usedIds.clear();
    }
    const available = state.items.filter((item) => !state.usedIds.has(item.id));
    const selection = available[Math.floor(Math.random() * available.length)];
    state.usedIds.add(selection.id);
    return selection;
  };

  const updatePassage = (item) => {
    const passageEl = qs('[data-spot="passage"]');
    const sectionEl = qs('[data-spot="section"]');
    const statusEl = qs('[data-spot="status"]');
    const badgeEl = qs('[data-spot="badge"]');
    const modelEl = qs('[data-spot="model"]');
    const statsEl = qs('[data-spot="item-stats"]');

    if (!passageEl) return;

    passageEl.textContent = normalizePassageText(item.text);
    sectionEl.textContent = item.section.toUpperCase();
    statusEl.textContent = '';
    statusEl.className = 'spot-feedback';
    badgeEl.textContent = '';
    badgeEl.style.backgroundColor = 'transparent';
    badgeEl.classList.remove('is-visible');
    modelEl.textContent = '';
    statsEl.textContent = '';

    qsa('[data-spot="guess"]').forEach((button) => {
      button.disabled = false;
      button.classList.remove('is-selected');
    });
  };

  const renderReveal = (item, guess) => {
    const statusEl = qs('[data-spot="status"]');
    const badgeEl = qs('[data-spot="badge"]');
    const modelEl = qs('[data-spot="model"]');
    const correct = guess === (item.truth.source === 'human' ? 'human' : 'bot');

    statusEl.textContent = correct ? 'Correct!' : 'Not quite.';
    statusEl.classList.add(correct ? 'spot-feedback--correct' : 'spot-feedback--incorrect');

    const badgeMeta = badgeConfig[item.truth.source] || { label: item.truth.source, fallback: '#4a5568' };
    badgeEl.textContent = badgeMeta.label;
    badgeEl.style.backgroundColor = item.truth.shade_hex || badgeMeta.fallback;
    badgeEl.classList.add('is-visible');
    modelEl.textContent = item.truth.model_detail ? `Model: ${item.truth.model_detail}` : '';
  };

  const postVote = async ({ item, guess, durationMs }) => {
    const payload = {
      item_id: item.id,
      guess,
      section: item.section,
      truth_source: item.truth.source,
      client_id: getClientId(),
      session_id: getSessionId(),
      time_ms: durationMs
    };

    try {
      const response = await fetch(`${API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const updateItemStats = (stats, itemId) => {
    const statsEl = qs('[data-spot="item-stats"]');
    if (!statsEl || !stats || !stats.byItem || !stats.byItem[itemId]) return;
    const { total, bot } = stats.byItem[itemId];
    if (!total) return;
    const percentBot = Math.round((bot / total) * 100);
    statsEl.textContent = `${percentBot}% of players guessed “Bot” for this sample.`;
  };

  const handleGuess = async (guess, startTime) => {
    const item = state.current;
    if (!item) return;

    qsa('[data-spot="guess"]').forEach((button) => {
      button.disabled = true;
      if (button.dataset.guess === guess) {
        button.classList.add('is-selected');
      }
    });

    renderReveal(item, guess);

    const isCorrect = guess === (item.truth.source === 'human' ? 'human' : 'bot');
    const stats = getSessionStats();
    stats.total += 1;
    stats.correct += isCorrect ? 1 : 0;
    stats.human += guess === 'human' ? 1 : 0;
    stats.bot += guess === 'bot' ? 1 : 0;
    saveSessionStats(stats);
    updateSessionStatsUI();

    const durationMs = startTime ? Date.now() - startTime : null;
    const voteResult = await postVote({ item, guess, durationMs });
    if (!voteResult) return;

    const stats = await fetchStats();
    updateItemStats(stats, item.id);
  };

  const getDataUrl = () => {
    const body = document.body;
    return (body && body.dataset.spotData) || 'spot-the-bot-data.json';
  };

  const initGamePage = async () => {
    const passageEl = qs('[data-spot="passage"]');
    if (!passageEl) return;

    try {
    const response = await fetch(getDataUrl());
      if (!response.ok) throw new Error('Failed to load data');
      const items = await response.json();
      state.items = items;
      state.current = pickRandomItem();
      if (!state.current) throw new Error('No items found');
      updatePassage(state.current);
    } catch (error) {
      const hint =
        window.location.protocol === 'file:'
          ? 'Tip: serve the site with a local web server (e.g., `python -m http.server`).'
          : 'Please check that spot-the-bot-data.json is in the same folder as this page.';
      passageEl.textContent = `Unable to load passages. ${hint}`;
      return;
    }

    let startTime = Date.now();
    updateSessionStatsUI();

    qsa('[data-spot="guess"]').forEach((button) => {
      button.addEventListener('click', () => handleGuess(button.dataset.guess, startTime));
    });

    qsa('[data-spot="reset-session"]').forEach((button) => {
      button.addEventListener('click', () => {
        clearSessionStats();
        updateSessionStatsUI();
      });
    });

    const nextButton = qs('[data-spot="next"]');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        state.current = pickRandomItem();
        updatePassage(state.current);
        startTime = Date.now();
      });
    }
  };

  const renderPolls = (stats) => {
    const overallEl = qs('[data-spot="overall"]');
    const sourceEl = qs('[data-spot="sources"]');
    const itemsEl = qs('[data-spot="items"]');
    if (!overallEl || !sourceEl) return;

    const overall = stats?.overall || { total: 0, human: 0, bot: 0 };
    overallEl.innerHTML = `
      <div class="spot-stat">
        <h3>${overall.total}</h3>
        <p>Total votes</p>
      </div>
      <div class="spot-stat">
        <h3>${overall.human}</h3>
        <p>Guessed human</p>
      </div>
      <div class="spot-stat">
        <h3>${overall.bot}</h3>
        <p>Guessed bot</p>
      </div>
    `;

    const sources = stats?.bySource || {};
    const sourceRows = Object.entries(badgeConfig).map(([key, meta]) => {
      const sourceStats = sources[key] || { total: 0, human: 0, bot: 0 };
      const percentBot = sourceStats.total ? Math.round((sourceStats.bot / sourceStats.total) * 100) : 0;
      return `
        <div class="spot-source">
          <span class="spot-badge is-visible" style="background:${meta.fallback}">${meta.label}</span>
          <div>
            <strong>${percentBot}% guessed “Bot”</strong>
            <p>${sourceStats.bot} bot guesses out of ${sourceStats.total} total</p>
          </div>
        </div>
      `;
    });

    sourceEl.innerHTML = sourceRows.join('');

    if (itemsEl) {
      const byItem = stats?.byItem || {};
      const rows = Object.values(byItem).map((item) => {
        const percentBot = item.total ? Math.round((item.bot / item.total) * 100) : 0;
        return `
          <tr>
            <td>${item.item_id}</td>
            <td>${item.section}</td>
            <td>${item.truth_source}</td>
            <td>${item.total}</td>
            <td>${percentBot}%</td>
          </tr>
        `;
      });
      itemsEl.innerHTML = rows.join('') || '<tr><td colspan="5">No item stats yet.</td></tr>';
    }
  };

  const initPollsPage = async () => {
    const pollsRoot = qs('[data-spot="polls"]');
    if (!pollsRoot) return;

    const stats = await fetchStats();
    renderPolls(stats || {});
    updateSessionStatsUI();

    qsa('[data-spot="reset-session"]').forEach((button) => {
      button.addEventListener('click', () => {
        clearSessionStats();
        updateSessionStatsUI();
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initGamePage();
    initPollsPage();
  });
})();
