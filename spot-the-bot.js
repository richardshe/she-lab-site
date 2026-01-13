/**
 * Spot the Bot - Game Logic
 * Handles game state, voting, and statistics display
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    DATA_URL: 'spot-the-bot-data.json',
    API_VOTE_URL: '/api/vote',
    API_STATS_URL: '/api/stats',
    CLIENT_ID_KEY: 'stb_client_id',
    VOTED_ITEMS_KEY: 'stb_voted_items',
    VOTE_TIMEOUT: 10000, // 10 seconds
  };

  // Source configurations for badge display
  const SOURCE_CONFIG = {
    human: {
      label: 'Human',
      className: 'stb-badge-human'
    },
    chatgpt: {
      label: 'ChatGPT',
      className: 'stb-badge-chatgpt'
    },
    claude: {
      label: 'Claude',
      className: 'stb-badge-claude'
    },
    gemini: {
      label: 'Gemini',
      className: 'stb-badge-gemini'
    }
  };

  // Game state
  let gameData = [];
  let currentItem = null;
  let hasVoted = false;
  let voteStartTime = null;

  /**
   * Initialize client ID (anonymous UUID stored in localStorage)
   */
  function initClientId() {
    let clientId = localStorage.getItem(CONFIG.CLIENT_ID_KEY);
    if (!clientId) {
      clientId = generateUUID();
      localStorage.setItem(CONFIG.CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  /**
   * Generate a simple UUID v4
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Check if user has already voted on this item (24h cooldown)
   */
  function hasVotedOnItem(itemId) {
    const votedItems = JSON.parse(localStorage.getItem(CONFIG.VOTED_ITEMS_KEY) || '{}');
    const lastVoteTime = votedItems[itemId];
    if (!lastVoteTime) return false;

    // Check if vote was within last 24 hours
    const now = Date.now();
    const hoursSinceVote = (now - lastVoteTime) / (1000 * 60 * 60);
    return hoursSinceVote < 24;
  }

  /**
   * Mark item as voted
   */
  function markItemAsVoted(itemId) {
    const votedItems = JSON.parse(localStorage.getItem(CONFIG.VOTED_ITEMS_KEY) || '{}');
    votedItems[itemId] = Date.now();
    localStorage.setItem(CONFIG.VOTED_ITEMS_KEY, JSON.stringify(votedItems));
  }

  /**
   * Load game data from JSON file
   */
  async function loadGameData() {
    try {
      const response = await fetch(CONFIG.DATA_URL);
      if (!response.ok) throw new Error('Failed to load data');
      gameData = await response.json();
      return true;
    } catch (error) {
      console.error('Error loading game data:', error);
      showError('Failed to load game data. Please refresh the page.');
      return false;
    }
  }

  /**
   * Select a random item from the dataset
   */
  function selectRandomItem() {
    if (gameData.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * gameData.length);
    return gameData[randomIndex];
  }

  /**
   * Display passage and reset UI for new round
   */
  function displayPassage(item) {
    currentItem = item;
    hasVoted = false;
    voteStartTime = Date.now();

    // Display passage text
    const passageEl = document.getElementById('passage-text');
    if (passageEl) {
      passageEl.textContent = item.text;
    }

    // Show guess buttons, hide result
    const guessButtons = document.getElementById('guess-buttons');
    const resultContainer = document.getElementById('result-container');
    if (guessButtons) guessButtons.style.display = 'flex';
    if (resultContainer) resultContainer.style.display = 'none';

    // Hide error messages
    hideError();
  }

  /**
   * Handle user guess
   */
  async function handleGuess(guess) {
    if (hasVoted || !currentItem) return;

    hasVoted = true;
    const timeMs = Date.now() - voteStartTime;

    // Check if already voted on this item
    if (hasVotedOnItem(currentItem.id)) {
      showLocalResult(guess, true); // Show result but don't submit vote
      return;
    }

    // Hide guess buttons immediately
    const guessButtons = document.getElementById('guess-buttons');
    if (guessButtons) guessButtons.style.display = 'none';

    // Show loading message
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) loadingMsg.style.display = 'block';

    // Submit vote to backend
    const voteData = {
      item_id: currentItem.id,
      guess: guess,
      section: currentItem.section,
      truth_source: currentItem.truth.source,
      client_id: initClientId(),
      time_ms: timeMs
    };

    try {
      const response = await fetch(CONFIG.API_VOTE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
        signal: AbortSignal.timeout(CONFIG.VOTE_TIMEOUT)
      });

      if (loadingMsg) loadingMsg.style.display = 'none';

      if (response.ok) {
        const result = await response.json();
        markItemAsVoted(currentItem.id);
        showResult(guess, result);
      } else {
        // Backend failed, show local result without stats
        console.error('Vote submission failed:', response.status);
        showLocalResult(guess, false);
      }
    } catch (error) {
      if (loadingMsg) loadingMsg.style.display = 'none';
      console.error('Error submitting vote:', error);
      // Network error, show local result
      showLocalResult(guess, false);
    }
  }

  /**
   * Show result with backend stats
   */
  function showResult(guess, apiResult) {
    const isCorrect = (guess === 'bot' && currentItem.truth.source !== 'human') ||
                      (guess === 'human' && currentItem.truth.source === 'human');

    displayResultUI(isCorrect, apiResult.bot_percent);
  }

  /**
   * Show result without backend (local feedback only)
   */
  function showLocalResult(guess, alreadyVoted) {
    const isCorrect = (guess === 'bot' && currentItem.truth.source !== 'human') ||
                      (guess === 'human' && currentItem.truth.source === 'human');

    displayResultUI(isCorrect, null, alreadyVoted);
  }

  /**
   * Display result UI
   */
  function displayResultUI(isCorrect, botPercent = null, alreadyVoted = false) {
    const resultContainer = document.getElementById('result-container');
    const resultMessage = document.getElementById('result-message');
    const sourceBadge = document.getElementById('source-badge');
    const modelDetail = document.getElementById('model-detail');
    const statsFeedback = document.getElementById('stats-feedback');

    if (!resultContainer || !resultMessage || !sourceBadge || !modelDetail) return;

    // Show result message
    if (alreadyVoted) {
      resultMessage.innerHTML = '<p class="stb-result-neutral">You\'ve already voted on this passage.</p>';
    } else {
      resultMessage.innerHTML = isCorrect
        ? '<p class="stb-result-correct">✓ Correct!</p>'
        : '<p class="stb-result-incorrect">✗ Incorrect</p>';
    }

    // Show source badge
    const source = currentItem.truth.source;
    const sourceInfo = SOURCE_CONFIG[source] || { label: source, className: '' };
    sourceBadge.innerHTML = `<span class="stb-badge ${sourceInfo.className}">${sourceInfo.label}</span>`;

    // Show model detail
    modelDetail.textContent = currentItem.truth.model_detail || '';

    // Show stats feedback if available
    if (statsFeedback) {
      if (botPercent !== null) {
        statsFeedback.innerHTML = `<p>${Math.round(botPercent)}% of players guessed "Bot" for this passage.</p>`;
        statsFeedback.style.display = 'block';
      } else if (alreadyVoted) {
        statsFeedback.innerHTML = '<p>Stats unavailable (already voted).</p>';
        statsFeedback.style.display = 'block';
      } else {
        statsFeedback.innerHTML = '<p>Stats unavailable (offline mode).</p>';
        statsFeedback.style.display = 'block';
      }
    }

    // Show result container
    resultContainer.style.display = 'block';
  }

  /**
   * Load next sample
   */
  function loadNextSample() {
    const item = selectRandomItem();
    if (item) {
      displayPassage(item);
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  function hideError() {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  /**
   * Initialize game page
   */
  async function initGame() {
    const success = await loadGameData();
    if (!success) return;

    initClientId();

    // Load first passage
    loadNextSample();

    // Attach event listeners
    const btnHuman = document.getElementById('btn-human');
    const btnBot = document.getElementById('btn-bot');
    const btnNext = document.getElementById('btn-next');

    if (btnHuman) {
      btnHuman.addEventListener('click', () => handleGuess('human'));
    }
    if (btnBot) {
      btnBot.addEventListener('click', () => handleGuess('bot'));
    }
    if (btnNext) {
      btnNext.addEventListener('click', loadNextSample);
    }
  }

  /**
   * Initialize polls page
   */
  async function initPolls() {
    try {
      const response = await fetch(CONFIG.API_STATS_URL);
      if (!response.ok) throw new Error('Failed to load stats');

      const stats = await response.json();
      displayStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      const errorEl = document.getElementById('error-message');
      if (errorEl) {
        errorEl.style.display = 'block';
      }
    }
  }

  /**
   * Display statistics on polls page
   */
  function displayStats(stats) {
    // Overall stats
    document.getElementById('total-votes').textContent = stats.total_votes || 0;
    document.getElementById('total-bot-guesses').textContent = stats.total_bot_guesses || 0;
    document.getElementById('total-human-guesses').textContent = stats.total_human_guesses || 0;

    // By source
    displaySourceStats('human', stats.by_source?.human);
    displaySourceStats('chatgpt', stats.by_source?.chatgpt);
    displaySourceStats('claude', stats.by_source?.claude);
    displaySourceStats('gemini', stats.by_source?.gemini);

    // Per-item stats
    if (stats.by_item) {
      displayPerItemStats(stats.by_item);
    }
  }

  /**
   * Display stats for a specific source
   */
  function displaySourceStats(source, data) {
    if (!data) {
      data = { total: 0, bot_guesses: 0, bot_percent: 0 };
    }

    const countEl = document.getElementById(`${source}-count`);
    const progressEl = document.getElementById(`${source}-progress`);
    const percentEl = document.getElementById(`${source}-percent`);

    if (countEl) countEl.textContent = `${data.total} votes`;
    if (progressEl) progressEl.style.width = `${data.bot_percent}%`;
    if (percentEl) percentEl.textContent = `${Math.round(data.bot_percent)}%`;
  }

  /**
   * Display per-item statistics
   */
  function displayPerItemStats(itemStats) {
    const container = document.getElementById('per-item-stats');
    if (!container) return;

    // Sort by item ID
    const sortedItems = Object.entries(itemStats).sort((a, b) => a[0].localeCompare(b[0]));

    let html = '<div class="stb-item-stats-grid">';
    sortedItems.forEach(([itemId, data]) => {
      const sourceLabel = SOURCE_CONFIG[data.truth_source]?.label || data.truth_source;
      const sourceClass = SOURCE_CONFIG[data.truth_source]?.className || '';

      html += `
        <div class="stb-item-stat">
          <div class="stb-item-header">
            <span class="stb-item-id">${itemId}</span>
            <span class="stb-badge ${sourceClass}">${sourceLabel}</span>
          </div>
          <div class="stb-item-data">
            <span>${data.total} votes</span>
            <span>${Math.round(data.bot_percent)}% guessed "Bot"</span>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // Export public API
  window.SpotTheBot = {
    initGame: initGame,
    initPolls: initPolls
  };

  // Auto-initialize game page if game card exists
  if (document.getElementById('game-card')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGame);
    } else {
      initGame();
    }
  }
})();
