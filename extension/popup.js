// popup.js

// Constants & State
const DEFAULT_API_URL = 'http://localhost:8000';
let activeApiUrl = DEFAULT_API_URL;
let activeSessionId = null;
let currentScreen = 'welcome';

// DOM Elements
const screens = {
  welcome: document.getElementById('screen-welcome'),
  loading: document.getElementById('screen-loading'),
  results: document.getElementById('screen-results'),
  settings: document.getElementById('screen-settings'),
  error: document.getElementById('screen-error'),
};

const btns = {
  settingsToggle: document.getElementById('btn-settings-toggle'),
  startAnalysis: document.getElementById('btn-start-analysis'),
  resultsBack: document.getElementById('btn-results-back'),
  settingsCancel: document.getElementById('btn-settings-cancel'),
  settingsSave: document.getElementById('btn-settings-save'),
  errorBack: document.getElementById('btn-error-back'),
};

const loadingTitle = document.getElementById('loading-title');
const loadingSub = document.getElementById('loading-sub');

// Config Elements
const inputApiUrl = document.getElementById('input-api-url');

// Results View Elements
const resultRiskBadge = document.getElementById('result-risk-badge');
const txtRiskLevel = document.getElementById('txt-risk-level');
const txtTimeline = document.getElementById('txt-timeline');
const txtSummary = document.getElementById('txt-summary');
const listClauses = document.getElementById('list-clauses');
const listConsequences = document.getElementById('list-consequences');
const listActions = document.getElementById('list-actions');

// Initialize Extension
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  // Silently initialize session in the background
  try {
    await ensureSession();
  } catch (err) {
    console.warn('Initial session establishment failed (backend might be offline):', err);
  }
});

// Load Settings from Local Storage
async function loadSettings() {
  const data = await chrome.storage.local.get(['apiUrl', 'sessionId']);
  activeApiUrl = data.apiUrl || DEFAULT_API_URL;
  activeSessionId = data.sessionId || null;
  inputApiUrl.value = activeApiUrl;
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation
  btns.settingsToggle.addEventListener('click', () => {
    if (currentScreen === 'settings') {
      showScreen('welcome');
    } else {
      inputApiUrl.value = activeApiUrl;
      showScreen('settings');
    }
  });

  btns.settingsCancel.addEventListener('click', () => showScreen('welcome'));
  btns.startAnalysis.addEventListener('click', runToSAnalysis);
  btns.resultsBack.addEventListener('click', () => showScreen('welcome'));
  btns.errorBack.addEventListener('click', () => showScreen('welcome'));

  // Save Settings
  btns.settingsSave.addEventListener('click', async () => {
    let url = inputApiUrl.value.trim();
    if (!url) url = DEFAULT_API_URL;
    // Strip trailing slash
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    activeApiUrl = url;
    activeSessionId = null; // Clear session to force re-auth on next request
    await chrome.storage.local.set({ apiUrl: url, sessionId: null });
    showScreen('welcome');
    
    // Attempt session re-initialization
    try {
      await ensureSession();
    } catch (err) {
      console.error('Session establishment failed with new URL:', err);
    }
  });

  // Tab switching inside Results view
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Screen management helper
function showScreen(screenName) {
  currentScreen = screenName;
  Object.keys(screens).forEach((name) => {
    if (name === screenName) {
      screens[name].classList.add('active');
    } else {
      screens[name].classList.remove('active');
    }
  });
}

// Ensure valid backend session exists
async function ensureSession(forceRefresh = false) {
  if (activeSessionId && !forceRefresh) return activeSessionId;

  try {
    const res = await fetch(`${activeApiUrl}/api/session`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Session request failed: ${res.status}`);
    
    const data = await res.json();
    if (data.sessionId) {
      activeSessionId = data.sessionId;
      await chrome.storage.local.set({ sessionId: activeSessionId });
      return activeSessionId;
    } else {
      throw new Error('No sessionId returned in response');
    }
  } catch (err) {
    activeSessionId = null;
    await chrome.storage.local.set({ sessionId: null });
    throw err;
  }
}

// Extract website text and analyze it
async function runToSAnalysis() {
  showScreen('loading');
  updateLoadingProgress('Extracting Webpage Text', 'Running scraper on tab content...');

  let text = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error('No active browser tab found.');
    }

    // Guard: Prevent running on system / restricted chrome:// pages
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      throw new Error('Cannot analyze browser configuration or system pages.');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    text = results?.[0]?.result || '';
    if (!text || text.trim().length < 50) {
      throw new Error('This page does not contain sufficient text content to analyze.');
    }
  } catch (err) {
    showError(err.message || 'Scraper failed to extract page content.');
    return;
  }

  // Update loading state
  updateLoadingProgress('Connecting to NyayaVanni', 'Establishing secure session...');

  // Try API calls
  try {
    let sessionToken;
    try {
      sessionToken = await ensureSession();
    } catch (err) {
      throw new Error(`Could not connect to the NyayaVanni backend server. Ensure it is running at ${activeApiUrl}.`);
    }

    updateLoadingProgress('Analyzing Terms of Service', 'Evaluating legal risks using Gemini AI...');

    const response = await fetch(`${activeApiUrl}/api/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionToken,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ text: text, language: 'en' }),
    });

    // Handle token expiration/401 gracefully
    if (response.status === 401) {
      // Re-fetch token and retry once
      sessionToken = await ensureSession(true);
      const retryResponse = await fetch(`${activeApiUrl}/api/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionToken,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text: text, language: 'en' }),
      });
      
      if (retryResponse.status === 429) {
        throw new Error('Analysis unavailable — API rate limit reached, please try again shortly.');
      } else if (!retryResponse.ok) {
        throw new Error(`Analysis request failed: ${retryResponse.statusText}`);
      }
      const data = await retryResponse.json();
      renderResults(data);
    } else if (response.status === 429) {
      throw new Error('Analysis unavailable — API rate limit reached, please try again shortly.');
    } else if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.detail || `Server returned error status ${response.status}`);
    } else {
      const data = await response.json();
      renderResults(data);
    }
  } catch (err) {
    showError(err.message);
  }
}

// Update loading text
function updateLoadingProgress(title, sub) {
  loadingTitle.textContent = title;
  loadingSub.textContent = sub;
}

// Display error screen
function showError(msg) {
  document.getElementById('txt-error-message').textContent = msg;
  showScreen('error');
}

// Render Results Screen
function renderResults(res) {
  const analysis = res.analysis || {};
  
  // 1. Risk Level
  const risk = (analysis.risk_level || 'Low').trim();
  txtRiskLevel.textContent = risk;
  
  // Set risk badge theme
  resultRiskBadge.className = 'badge'; // Reset classes
  if (risk.toLowerCase() === 'high') {
    resultRiskBadge.classList.add('badge-risk-high');
  } else if (risk.toLowerCase() === 'medium') {
    resultRiskBadge.classList.add('badge-risk-medium');
  } else {
    resultRiskBadge.classList.add('badge-risk-low');
  }

  // 2. Timeline
  txtTimeline.textContent = analysis.recommended_timeline || 'No immediate deadline';

  // 3. Summary
  txtSummary.textContent = analysis.summary || 'No summary available.';

  // 4. Flagged Clauses
  listClauses.innerHTML = '';
  const clauses = analysis.clauses || [];
  if (clauses.length === 0) {
    listClauses.innerHTML = '<li class="detail-item">No significant clauses flagged.</li>';
  } else {
    clauses.forEach((clause) => {
      const li = document.createElement('li');
      li.className = 'detail-item';
      li.textContent = clause;
      listClauses.appendChild(li);
    });
  }

  // 5. Consequences
  listConsequences.innerHTML = '';
  const consequences = analysis.consequences || [];
  if (consequences.length === 0) {
    listConsequences.innerHTML = '<li class="detail-item consequence">No high-impact consequences noted.</li>';
  } else {
    consequences.forEach((consequence) => {
      const li = document.createElement('li');
      li.className = 'detail-item consequence';
      li.textContent = consequence;
      listConsequences.appendChild(li);
    });
  }

  // 6. Action Items
  listActions.innerHTML = '';
  const actions = analysis.actions || [];
  if (actions.length === 0) {
    listActions.innerHTML = '<p class="summary-text" style="color: #718096; text-align: center; padding: 10px;">No critical actions recommended.</p>';
  } else {
    actions.forEach((act, idx) => {
      const itemKey = `act_${res.documentId}_${idx}`;
      const isChecked = localStorage.getItem(itemKey) === 'true';

      const itemDiv = document.createElement('div');
      itemDiv.className = 'action-item';
      if (isChecked) itemDiv.classList.add('completed');

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'action-checkbox';
      checkbox.checked = isChecked;
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          itemDiv.classList.add('completed');
          localStorage.setItem(itemKey, 'true');
        } else {
          itemDiv.classList.remove('completed');
          localStorage.removeItem(itemKey);
        }
      });

      // Content container
      const contentDiv = document.createElement('div');
      contentDiv.className = 'action-content';

      // Title
      const titleSpan = document.createElement('span');
      titleSpan.className = 'action-title';
      titleSpan.textContent = act.action;

      // Why explanation
      const whySpan = document.createElement('span');
      whySpan.className = 'action-why';
      whySpan.textContent = act.why;

      // Meta (Badge & Timeline)
      const metaDiv = document.createElement('div');
      metaDiv.className = 'action-meta';

      const badge = document.createElement('span');
      const priority = (act.priority || 'low').toLowerCase();
      badge.className = `action-badge action-badge-${priority}`;
      badge.textContent = priority;

      const timeline = document.createElement('span');
      timeline.className = 'action-timeline';
      timeline.textContent = act.timeline;

      // Assemble
      metaDiv.appendChild(badge);
      metaDiv.appendChild(timeline);
      
      contentDiv.appendChild(titleSpan);
      contentDiv.appendChild(whySpan);
      contentDiv.appendChild(metaDiv);

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(contentDiv);

      listActions.appendChild(itemDiv);
    });
  }

  // Active Results Screen
  showScreen('results');
}
