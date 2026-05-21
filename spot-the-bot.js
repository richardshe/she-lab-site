(() => {
  const API_BASE = '/api';
  const sectionOrder = ['abstract', 'intro', 'discussion'];
  const sectionLabels = {
    abstract: 'Abstract',
    intro: 'Introduction',
    discussion: 'Discussion'
  };

  const badgeConfig = {
    human: { label: 'Human', fallback: '#2f855a' },
    chatgpt: { label: 'ChatGPT', fallback: '#4c51bf' },
    claude: { label: 'Claude', fallback: '#b83280' },
    gemini: { label: 'Gemini', fallback: '#d97706' }
  };

  const journalRenderers = {
    nature: {
      className: 'spot-journal--nature',
      wordmark: 'nature',
      meta: (item) => `Article | Published ${item.year}`
    },
    'nature-neuroscience': {
      className: 'spot-journal--nature spot-journal--nature-neuroscience',
      wordmark: 'nature neuroscience',
      meta: (item) => `Article | Published ${item.year}`
    },
    'nature-methods': {
      className: 'spot-journal--nature spot-journal--nature-methods',
      wordmark: 'nature methods',
      meta: (item) => `Article | Published ${item.year}`
    },
    science: {
      className: 'spot-journal--science',
      wordmark: 'Science',
      meta: (item) => `REPORTS | ${item.year}`
    },
    cell: {
      className: 'spot-journal--cell',
      wordmark: 'Cell',
      meta: (item) => `Article`
    },
    neuron: {
      className: 'spot-journal--cell-press spot-journal--neuron',
      wordmark: 'Neuron',
      meta: (item) => `Article | ${item.year}`
    },
    immunity: {
      className: 'spot-journal--cell-press spot-journal--immunity',
      wordmark: 'Immunity',
      meta: (item) => `Article | ${item.year}`
    },
    'molecular-therapy': {
      className: 'spot-journal--cell-press spot-journal--molecular-therapy',
      wordmark: 'Molecular Therapy',
      meta: (item) => `Article | ${item.year}`
    },
    pnas: {
      className: 'spot-journal--pnas',
      wordmark: 'PNAS',
      meta: (item) => `Research Article | ${item.year}`
    },
    nejm: {
      className: 'spot-journal--nejm',
      wordmark: 'The New England Journal of Medicine',
      meta: () => 'Original Article'
    }
  };

  const state = {
    items: [],
    papers: [],
    paperById: new Map(),
    current: null,
    usedPaperIds: new Set()
  };

  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const sample = (items) => items[Math.floor(Math.random() * items.length)];

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

  const getTruthKind = (item) => {
    if (!item || !item.truth) return 'bot';
    return item.truth.kind || (item.truth.source === 'human' ? 'human' : 'bot');
  };

  const getClientId = () => {
    const stored = localStorage.getItem('spotTheBotClientId');
    if (stored) return stored;
    const generated = (crypto.randomUUID && crypto.randomUUID()) || `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('spotTheBotClientId', generated);
    return generated;
  };

  const buildPaperGroups = (items) => {
    const paperById = new Map();

    items.forEach((item) => {
      if (!item.paper_id || !item.section || !item.truth) return;
      const paper = paperById.get(item.paper_id) || {
        paper_id: item.paper_id,
        paper_title: item.paper_title,
        display_title: item.display_title || item.title,
        journal: item.journal,
        year: item.year,
        logo_key: item.logo_key,
        humanBySection: {},
        botsBySection: {},
        eligibleSections: []
      };

      if (getTruthKind(item) === 'human') {
        paper.humanBySection[item.section] = item;
      } else {
        paper.botsBySection[item.section] = paper.botsBySection[item.section] || [];
        paper.botsBySection[item.section].push(item);
      }

      paperById.set(item.paper_id, paper);
    });

    const papers = Array.from(paperById.values()).map((paper) => {
      paper.eligibleSections = sectionOrder.filter((section) => {
        return paper.humanBySection[section] && paper.botsBySection[section]?.length;
      });
      return paper;
    }).filter((paper) => paper.eligibleSections.length);

    papers.sort((a, b) => a.paper_title.localeCompare(b.paper_title));
    return { paperById, papers };
  };

  const pickRandomItem = () => {
    if (!state.papers.length) return null;

    if (state.usedPaperIds.size >= state.papers.length) {
      state.usedPaperIds.clear();
    }

    const available = state.papers.filter((paper) => !state.usedPaperIds.has(paper.paper_id));
    const paper = sample(available);
    state.usedPaperIds.add(paper.paper_id);

    const section = sample(paper.eligibleSections);
    const showBot = Math.random() < 0.5;
    if (showBot) {
      return sample(paper.botsBySection[section]);
    }
    return paper.humanBySection[section];
  };

  const getHumanCounterpart = (item) => {
    const paper = state.paperById.get(item.paper_id);
    return paper?.humanBySection?.[item.section] || null;
  };

  const renderJournalHeader = (item) => {
    const articleEl = qs('[data-spot="article"]');
    const logoEl = qs('[data-spot="journal-logo"]');
    const metaEl = qs('[data-spot="journal-meta"]');
    const titleEl = qs('[data-spot="paper-title"]');
    const paperMetaEl = qs('[data-spot="paper-meta"]');
    const renderer = journalRenderers[item.logo_key] || {
      className: 'spot-journal--generic',
      wordmark: item.journal || 'Journal',
      meta: (entry) => `Article | ${entry.year || ''}`
    };

    if (articleEl) {
      articleEl.className = `spot-article ${renderer.className}`;
    }
    if (logoEl) {
      logoEl.textContent = renderer.wordmark;
    }
    if (metaEl) {
      metaEl.textContent = renderer.meta(item);
    }
    if (titleEl) {
      titleEl.textContent = item.display_title || item.title || item.paper_title;
    }
    if (paperMetaEl) {
      paperMetaEl.textContent = `${item.journal} · ${item.year}`;
    }
  };

  const updateSectionRail = (item) => {
    const paper = state.paperById.get(item.paper_id);
    qsa('[data-spot-section-tab]').forEach((tab) => {
      const section = tab.dataset.spotSectionTab;
      tab.classList.toggle('is-active', section === item.section);
      tab.classList.toggle('is-unavailable', !paper?.eligibleSections.includes(section));
      tab.setAttribute('aria-current', section === item.section ? 'true' : 'false');
    });
  };

  const resetReveal = () => {
    const revealEl = qs('[data-spot="reveal"]');
    const humanRevealEl = qs('[data-spot="human-reveal"]');
    const contextEl = qs('[data-spot="context"]');
    const statusEl = qs('[data-spot="status"]');
    const badgeEl = qs('[data-spot="badge"]');
    const modelEl = qs('[data-spot="model"]');
    const humanTextEl = qs('[data-spot="human-text"]');
    const contextTextEl = qs('[data-spot="context-text"]');
    const statsEl = qs('[data-spot="item-stats"]');

    if (revealEl) revealEl.hidden = true;
    if (humanRevealEl) humanRevealEl.hidden = true;
    if (contextEl) contextEl.hidden = true;
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'spot-status';
    }
    if (badgeEl) {
      badgeEl.textContent = '';
      badgeEl.style.backgroundColor = 'transparent';
      badgeEl.classList.remove('is-visible');
    }
    if (modelEl) modelEl.textContent = '';
    if (humanTextEl) humanTextEl.textContent = '';
    if (contextTextEl) contextTextEl.textContent = '';
    if (statsEl) statsEl.textContent = '';
  };

  const updatePassage = (item) => {
    const passageEl = qs('[data-spot="passage"]');
    if (!passageEl || !item) return;

    renderJournalHeader(item);
    updateSectionRail(item);
    resetReveal();
    passageEl.textContent = item.text;

    qsa('[data-spot="guess"]').forEach((button) => {
      button.disabled = false;
      button.classList.remove('is-selected');
    });
  };

  const renderReveal = (item, guess) => {
    const revealEl = qs('[data-spot="reveal"]');
    const statusEl = qs('[data-spot="status"]');
    const badgeEl = qs('[data-spot="badge"]');
    const modelEl = qs('[data-spot="model"]');
    const humanRevealEl = qs('[data-spot="human-reveal"]');
    const humanTextEl = qs('[data-spot="human-text"]');
    const contextEl = qs('[data-spot="context"]');
    const contextTextEl = qs('[data-spot="context-text"]');
    const truthKind = getTruthKind(item);
    const correct = guess === (truthKind === 'human' ? 'human' : 'bot');

    if (revealEl) revealEl.hidden = false;
    if (statusEl) {
      statusEl.textContent = correct ? 'Correct!' : 'Not quite.';
      statusEl.classList.add(correct ? 'spot-feedback--correct' : 'spot-feedback--incorrect');
    }

    const badgeMeta = badgeConfig[item.truth.source] || { label: item.truth.source, fallback: '#4a5568' };
    if (badgeEl) {
      badgeEl.textContent = item.truth.label || badgeMeta.label;
      badgeEl.style.backgroundColor = item.truth.shade_hex || badgeMeta.fallback;
      badgeEl.classList.add('is-visible');
    }
    if (modelEl) {
      modelEl.textContent = truthKind === 'human'
        ? 'Original article'
        : `Model: ${item.truth.model_detail || badgeMeta.label}`;
    }

    const humanCounterpart = getHumanCounterpart(item);
    if (truthKind === 'bot' && humanCounterpart && humanRevealEl && humanTextEl) {
      humanRevealEl.hidden = false;
      humanTextEl.textContent = humanCounterpart.text;
    }

    if (item.historical_context && contextEl && contextTextEl) {
      contextEl.hidden = false;
      contextTextEl.textContent = item.historical_context;
    }
  };

  const postVote = async ({ item, guess, durationMs }) => {
    const payload = {
      item_id: item.id,
      guess,
      section: item.section,
      truth_source: item.truth.source,
      client_id: getClientId(),
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

    const durationMs = startTime ? Date.now() - startTime : null;
    const voteResult = await postVote({ item, guess, durationMs });
    if (!voteResult) return;

    const stats = await fetchStats();
    updateItemStats(stats, item.id);
  };

  const getDataUrl = () => {
    const body = document.body;
    return (body && body.dataset.spotData) || './spot-the-bot-data.json';
  };

  const initGamePage = async () => {
    const passageEl = qs('[data-spot="passage"]');
    if (!passageEl) return;

    try {
      const response = await fetch(getDataUrl());
      if (!response.ok) throw new Error('Failed to load data');
      const items = await response.json();
      state.items = items;
      const grouped = buildPaperGroups(items);
      state.paperById = grouped.paperById;
      state.papers = grouped.papers;
      state.current = pickRandomItem();
      if (!state.current) throw new Error('No playable items found');
      updatePassage(state.current);
    } catch (error) {
      const hint =
        window.location.protocol.startsWith('file')
          ? 'Tip: serve the site with a local web server (e.g., `python -m http.server`).'
          : `Please check that spot-the-bot-data.json is in the same folder. Details: ${error.message}`;
      passageEl.textContent = `Unable to load passages. ${hint}`;
      console.error('Data load error:', error);
      return;
    }

    let startTime = Date.now();

    qsa('[data-spot="guess"]').forEach((button) => {
      button.addEventListener('click', () => handleGuess(button.dataset.guess, startTime));
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
        <h3>${overall.total || 0}</h3>
        <p>Total votes</p>
      </div>
      <div class="spot-stat">
        <h3>${overall.human || 0}</h3>
        <p>Guessed human</p>
      </div>
      <div class="spot-stat">
        <h3>${overall.bot || 0}</h3>
        <p>Guessed bot</p>
      </div>
    `;

    const sources = stats?.bySource || {};
    const sourceRows = Object.entries(badgeConfig).map(([key, meta]) => {
      const sourceStats = sources[key] || { total: 0, human: 0, bot: 0 };
      const percentBot = sourceStats.total ? Math.round((sourceStats.bot / sourceStats.total) * 100) : 0;
      return `
        <div class="spot-source">
          <span class="spot-badge is-visible" style="background:${meta.fallback}">${escapeHtml(meta.label)}</span>
          <div>
            <strong>${percentBot}% guessed “Bot”</strong>
            <p>${sourceStats.bot || 0} bot guesses out of ${sourceStats.total || 0} total</p>
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
            <td>${escapeHtml(item.item_id)}</td>
            <td>${escapeHtml(sectionLabels[item.section] || item.section)}</td>
            <td>${escapeHtml(item.truth_source)}</td>
            <td>${item.total || 0}</td>
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
  };

  document.addEventListener('DOMContentLoaded', () => {
    initGamePage();
    initPollsPage();
  });
})();
