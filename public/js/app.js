/**
 * MediCure AI — Clinical Assistant Frontend Application
 */

// Application State
const state = {
  currentId: generateId(),
  messages: [],
  history: [],
  hasServerKey: false,
  apiKey: localStorage.getItem('medicure_openai_key') || '',
  model: localStorage.getItem('medicure_model') || 'gpt-4o-mini',
  theme: localStorage.getItem('medicure_theme') || 'dark',
  isGenerating: false,
  isRecording: false,
  speechRecognition: null,
  activeSpeechUtterance: null
};

// DOM Selectors
const elements = {
  // Navigation & Layout
  sidebar: document.getElementById('sidebar'),
  sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
  sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  statusLabel: document.getElementById('statusLabel'),
  aiStatusPill: document.getElementById('aiStatusPill'),
  activeModelTag: document.getElementById('activeModelTag'),
  consultationTitle: document.getElementById('consultationTitle'),
  
  // Emergency Banner
  emergencyBanner: document.getElementById('emergencyBanner'),
  closeBannerBtn: document.getElementById('closeBannerBtn'),
  openEmergencyModalBtn: document.getElementById('openEmergencyModalBtn'),
  
  // Chat Area
  chatContainer: document.getElementById('chatContainer'),
  welcomeHero: document.getElementById('welcomeHero'),
  messagesStream: document.getElementById('messagesStream'),
  typingIndicator: document.getElementById('typingIndicator'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  voiceInputBtn: document.getElementById('voiceInputBtn'),
  micIcon: document.getElementById('micIcon'),
  
  // Sidebar Tools & Actions
  newChatBtn: document.getElementById('newChatBtn'),
  openTriageBtn: document.getElementById('openTriageBtn'),
  quickMedicineInfoBtn: document.getElementById('quickMedicineInfoBtn'),
  quickDietBtn: document.getElementById('quickDietBtn'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  exportChatBtn: document.getElementById('exportChatBtn'),
  
  // Modals
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
  cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  modelSelect: document.getElementById('modelSelect'),
  saveToServerCheckbox: document.getElementById('saveToServerCheckbox'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  eyeIcon: document.getElementById('eyeIcon'),
  keyPromptBanner: document.getElementById('keyPromptBanner'),
  bannerSetupKeyBtn: document.getElementById('bannerSetupKeyBtn'),
  
  triageModal: document.getElementById('triageModal'),
  closeTriageModalBtn: document.getElementById('closeTriageModalBtn'),
  cancelTriageBtn: document.getElementById('cancelTriageBtn'),
  submitTriageBtn: document.getElementById('submitTriageBtn'),
  triageAge: document.getElementById('triageAge'),
  triageGender: document.getElementById('triageGender'),
  triageSymptoms: document.getElementById('triageSymptoms'),
  triageDuration: document.getElementById('triageDuration'),
  triageSeverity: document.getElementById('triageSeverity'),
  severityVal: document.getElementById('severityVal'),
  triageHistory: document.getElementById('triageHistory'),
  
  emergencyModal: document.getElementById('emergencyModal'),
  closeEmergencyModalBtn: document.getElementById('closeEmergencyModalBtn'),
  dismissEmergencyModalBtn: document.getElementById('dismissEmergencyModalBtn')
};

// Utilities
function generateId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize Application
async function init() {
  applyTheme(state.theme);
  loadHistoryFromStorage();
  setupSpeechRecognition();
  setupEventListeners();
  await checkServerStatus();
  updateModelTagUI();
}

// Check Server Status & Key
async function checkServerStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    state.hasServerKey = data.hasEnvKey;
    
    if (state.hasServerKey) {
      elements.statusLabel.textContent = `OpenAI: Connected (${data.model})`;
      elements.aiStatusPill.querySelector('.status-dot').className = 'status-dot active';
      if (elements.keyPromptBanner) elements.keyPromptBanner.style.display = 'none';
    } else if (state.apiKey) {
      elements.statusLabel.textContent = `OpenAI: Client Key (${state.model})`;
      elements.aiStatusPill.querySelector('.status-dot').className = 'status-dot active';
      if (elements.keyPromptBanner) elements.keyPromptBanner.style.display = 'none';
    } else {
      elements.statusLabel.textContent = 'Preview Demo Engine';
      elements.aiStatusPill.querySelector('.status-dot').className = 'status-dot demo';
      if (elements.keyPromptBanner) elements.keyPromptBanner.style.display = 'flex';
    }
  } catch (err) {
    console.warn('Status check warning:', err);
    elements.statusLabel.textContent = 'Offline / Demo Mode';
    elements.aiStatusPill.querySelector('.status-dot').className = 'status-dot demo';
  }
}

// UI Setup & Listeners
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Sidebar controls
  elements.sidebarToggleBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('open');
  });
  elements.sidebarCloseBtn.addEventListener('click', () => {
    elements.sidebar.classList.remove('open');
  });

  // Emergency banner
  elements.closeBannerBtn.addEventListener('click', () => {
    elements.emergencyBanner.style.display = 'none';
  });
  elements.openEmergencyModalBtn.addEventListener('click', () => elements.emergencyModal.showModal());
  elements.closeEmergencyModalBtn.addEventListener('click', () => elements.emergencyModal.close());
  elements.dismissEmergencyModalBtn.addEventListener('click', () => elements.emergencyModal.close());

  // Chat Form & Auto-expanding Textarea
  elements.chatInput.addEventListener('input', () => {
    elements.chatInput.style.height = 'auto';
    elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 140) + 'px';
  });

  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      elements.chatForm.dispatchEvent(new Event('submit'));
    }
  });

  elements.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = elements.chatInput.value.trim();
    if (!query || state.isGenerating) return;
    sendMessage(query);
  });

  // Quick Suggestion Chips (Hero view)
  document.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      if (prompt) sendMessage(prompt);
    });
  });

  // Quick Tags Scroll Bar
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      if (text) {
        elements.chatInput.value = text;
        elements.chatInput.focus();
        elements.chatInput.dispatchEvent(new Event('input'));
      }
    });
  });

  // New Consultation
  elements.newChatBtn.addEventListener('click', startNewConsultation);

  // Settings Modal Handlers
  const openSettings = () => {
    elements.apiKeyInput.value = state.apiKey;
    elements.modelSelect.value = state.model;
    elements.settingsModal.showModal();
  };
  elements.settingsBtn.addEventListener('click', openSettings);
  if (elements.bannerSetupKeyBtn) elements.bannerSetupKeyBtn.addEventListener('click', openSettings);
  elements.closeSettingsModalBtn.addEventListener('click', () => elements.settingsModal.close());
  elements.cancelSettingsBtn.addEventListener('click', () => elements.settingsModal.close());

  // Key Visibility Toggle
  elements.toggleKeyVisibilityBtn.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.eyeIcon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });

  // Save Settings
  elements.saveSettingsBtn.addEventListener('click', async () => {
    const keyVal = elements.apiKeyInput.value.trim();
    const modelVal = elements.modelSelect.value;
    const saveToServer = elements.saveToServerCheckbox.checked;

    state.apiKey = keyVal;
    state.model = modelVal;
    localStorage.setItem('medicure_openai_key', keyVal);
    localStorage.setItem('medicure_model', modelVal);

    if (keyVal && saveToServer) {
      try {
        await fetch('/api/set-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: keyVal })
        });
      } catch (err) {
        console.error('Failed to save to server:', err);
      }
    }

    elements.settingsModal.close();
    await checkServerStatus();
    updateModelTagUI();
  });

  // Triage Modal Handlers
  elements.openTriageBtn.addEventListener('click', () => elements.triageModal.showModal());
  elements.closeTriageModalBtn.addEventListener('click', () => elements.triageModal.close());
  elements.cancelTriageBtn.addEventListener('click', () => elements.triageModal.close());

  elements.triageSeverity.addEventListener('input', (e) => {
    elements.severityVal.textContent = e.target.value;
  });

  elements.submitTriageBtn.addEventListener('click', () => {
    const age = elements.triageAge.value || 'Not specified';
    const gender = elements.triageGender.value;
    const symptoms = elements.triageSymptoms.value.trim();
    const duration = elements.triageDuration.value;
    const severity = elements.triageSeverity.value;
    const history = elements.triageHistory.value.trim() || 'None';

    if (!symptoms) {
      alert('Please describe your primary symptoms.');
      return;
    }

    elements.triageModal.close();
    
    // Construct structured clinical prompt
    const triageMessage = `**Clinical Triage Assessment Request:**
- **Patient Profile:** Age: ${age}, Biological Sex: ${gender}
- **Chief Complaint:** ${symptoms}
- **Duration:** ${duration}
- **Severity Score (1-10):** ${severity}/10
- **Preexisting Conditions / Current Medications:** ${history}

Please provide a structured clinical assessment, potential differential considerations, immediate safe home care recommendations, red flags to monitor, and follow-up advice.`;

    sendMessage(triageMessage);
    
    // Reset form
    elements.triageSymptoms.value = '';
    elements.triageHistory.value = '';
  });

  // Quick Tools
  elements.quickMedicineInfoBtn.addEventListener('click', () => {
    const medicine = prompt('Enter the name of the medicine (e.g., Metformin, Amoxicillin, Cetirizine):');
    if (medicine && medicine.trim()) {
      sendMessage(`Please provide a comprehensive medication guide for **${medicine.trim()}**:
1. Common medical uses and class
2. General dosage guidelines and precautions
3. Food and drug interaction warnings
4. Possible side effects
5. When to contact a physician.`);
    }
  });

  elements.quickDietBtn.addEventListener('click', () => {
    const condition = prompt('Enter your condition or health goal (e.g., Hypertension, Fatty Liver, Diabetes, Weight Loss, High Uric Acid):');
    if (condition && condition.trim()) {
      sendMessage(`Please formulate an evidence-based clinical diet and lifestyle guide for managing **${condition.trim()}**:
1. Recommended foods to incorporate
2. Specific foods and beverages to strictly avoid
3. Meal timing, hydration, and exercise tips
4. Key clinical biomarkers to monitor with a doctor.`);
    }
  });

  // Export Consultation
  elements.exportChatBtn.addEventListener('click', exportConsultation);

  // Clear History
  elements.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your consultation history?')) {
      state.history = [];
      localStorage.removeItem('medicure_consultations');
      renderHistoryList();
    }
  });
}

// Update Active Model Tag
function updateModelTagUI() {
  const modelName = state.model === 'gpt-4o' ? 'GPT-4o' : (state.model === 'gpt-3.5-turbo' ? 'GPT-3.5' : 'GPT-4o-mini');
  elements.activeModelTag.innerHTML = `<i class="fa-solid fa-brain"></i> ${modelName}`;
}

// Theme Handlers
function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('medicure_theme', theme);
  elements.themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// Voice Input / Speech Recognition
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceInputBtn.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    state.isRecording = true;
    elements.voiceInputBtn.classList.add('recording');
    elements.micIcon.className = 'fa-solid fa-stop';
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    elements.chatInput.value = transcript;
    elements.chatInput.dispatchEvent(new Event('input'));
  };

  recognition.onend = () => {
    state.isRecording = false;
    elements.voiceInputBtn.classList.remove('recording');
    elements.micIcon.className = 'fa-solid fa-microphone';
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    recognition.stop();
  };

  elements.voiceInputBtn.addEventListener('click', () => {
    if (state.isRecording) {
      recognition.stop();
    } else {
      elements.chatInput.value = '';
      recognition.start();
    }
  });

  state.speechRecognition = recognition;
}

// Text-to-Speech (Audio Voice Output)
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported on your browser.');
    return;
  }

  // Cancel any ongoing speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return;
  }

  // Strip markdown tags for clean vocalization
  const cleanText = text
    .replace(/[#*_~`>-]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n+/g, '. ');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

// Send Message Handler
async function sendMessage(text) {
  if (state.isGenerating) return;

  // Add User Message
  const userMsg = {
    role: 'user',
    content: text,
    timestamp: formatTime()
  };
  state.messages.push(userMsg);

  // Update UI
  elements.welcomeHero.style.display = 'none';
  elements.chatInput.value = '';
  elements.chatInput.style.height = 'auto';
  elements.sendBtn.disabled = true;

  renderMessage(userMsg);
  elements.typingIndicator.style.display = 'flex';
  scrollToBottom();

  state.isGenerating = true;

  // Create placeholder Bot Message
  const botMsg = {
    role: 'assistant',
    content: '',
    timestamp: formatTime()
  };

  const botMsgElement = createMessageElement(botMsg);
  elements.messagesStream.appendChild(botMsgElement);
  const bubbleElement = botMsgElement.querySelector('.msg-bubble');

  try {
    const payload = {
      messages: state.messages.map(m => ({ role: m.role, content: m.content })),
      apiKey: state.apiKey,
      model: state.model,
      stream: true
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    elements.typingIndicator.style.display = 'none';

    // Read SSE Stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              accumulatedContent += `\n\n> ⚠️ **Error:** ${parsed.error}`;
            } else if (parsed.content) {
              accumulatedContent += parsed.content;
            }
            // Parse Markdown into HTML
            bubbleElement.innerHTML = marked.parse(accumulatedContent);
            scrollToBottom();
          } catch (e) {
            // ignore incomplete json chunk
          }
        }
      }
    }

    botMsg.content = accumulatedContent;
    state.messages.push(botMsg);

    // Save Consultation Session
    saveCurrentConsultation();

    // Attach actions to bot message
    attachBotMessageActions(botMsgElement, accumulatedContent);

  } catch (err) {
    console.error('Chat error:', err);
    elements.typingIndicator.style.display = 'none';
    const errorText = `### ⚠️ Connection Notice
Could not complete request: ${err.message || 'Please check your connection and OpenAI API configuration.'}

> You can click **Settings** at the top right to verify your OpenAI API key or switch models.`;
    bubbleElement.innerHTML = marked.parse(errorText);
    botMsg.content = errorText;
    state.messages.push(botMsg);
  } finally {
    state.isGenerating = false;
    elements.sendBtn.disabled = false;
    scrollToBottom();
  }
}

// Render Single Message
function renderMessage(msg) {
  const el = createMessageElement(msg);
  elements.messagesStream.appendChild(el);
}

// Create DOM element for message
function createMessageElement(msg) {
  const row = document.createElement('div');
  row.className = `message-row ${msg.role === 'user' ? 'user' : 'bot'}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = msg.role === 'user' 
    ? '<i class="fa-solid fa-user"></i>' 
    : '<i class="fa-solid fa-heart-pulse"></i>';

  const wrapper = document.createElement('div');
  wrapper.className = 'msg-bubble-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (msg.role === 'user') {
    bubble.textContent = msg.content;
  } else {
    bubble.innerHTML = msg.content ? marked.parse(msg.content) : '';
  }

  const metaRow = document.createElement('div');
  metaRow.className = 'msg-meta-row';

  const timeSpan = document.createElement('span');
  timeSpan.className = 'msg-time';
  timeSpan.textContent = msg.timestamp || formatTime();
  metaRow.appendChild(timeSpan);

  if (msg.role === 'assistant') {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-btn';
    copyBtn.title = 'Copy response';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(msg.content);
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
    };

    const speakBtn = document.createElement('button');
    speakBtn.className = 'msg-btn';
    speakBtn.title = 'Listen to advice';
    speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    speakBtn.onclick = () => speakText(msg.content);

    actions.appendChild(copyBtn);
    actions.appendChild(speakBtn);
    metaRow.appendChild(actions);
  }

  wrapper.appendChild(bubble);
  wrapper.appendChild(metaRow);

  row.appendChild(avatar);
  row.appendChild(wrapper);

  return row;
}

function attachBotMessageActions(element, content) {
  const actionsContainer = element.querySelector('.msg-actions');
  if (!actionsContainer) return;
  
  const copyBtn = actionsContainer.querySelector('button[title="Copy response"]');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(content);
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
    };
  }

  const speakBtn = actionsContainer.querySelector('button[title="Listen to advice"]');
  if (speakBtn) {
    speakBtn.onclick = () => speakText(content);
  }
}

// Auto Scroll
function scrollToBottom() {
  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

// Start New Consultation
function startNewConsultation() {
  if (state.messages.length > 0) {
    saveCurrentConsultation();
  }

  state.currentId = generateId();
  state.messages = [];
  elements.messagesStream.innerHTML = '';
  elements.welcomeHero.style.display = 'flex';
  elements.consultationTitle.textContent = 'General Medical Consultation';
  elements.sidebar.classList.remove('open');
  elements.chatInput.focus();
}

// Save Current Consultation Session
function saveCurrentConsultation() {
  if (state.messages.length === 0) return;

  const firstUserMsg = state.messages.find(m => m.role === 'user');
  let title = firstUserMsg ? firstUserMsg.content.substring(0, 36) + '...' : 'Medical Consultation';
  title = title.replace(/\*\*/g, '');

  elements.consultationTitle.textContent = title;

  const consultation = {
    id: state.currentId,
    title,
    messages: state.messages,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = state.history.findIndex(h => h.id === state.currentId);
  if (existingIndex >= 0) {
    state.history[existingIndex] = consultation;
  } else {
    state.history.unshift(consultation);
  }

  // Keep last 15 consultations
  state.history = state.history.slice(0, 15);
  localStorage.setItem('medicure_consultations', JSON.stringify(state.history));
  renderHistoryList();
}

// Load Consultations from LocalStorage
function loadHistoryFromStorage() {
  try {
    const saved = localStorage.getItem('medicure_consultations');
    if (saved) {
      state.history = JSON.parse(saved);
      renderHistoryList();
    }
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

// Render History List in Sidebar
function renderHistoryList() {
  elements.historyList.innerHTML = '';

  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<div class="history-empty">No previous consultations yet.</div>';
    return;
  }

  state.history.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `history-item ${item.id === state.currentId ? 'active' : ''}`;
    btn.innerHTML = `
      <i class="fa-regular fa-message"></i>
      <span class="history-item-title">${item.title}</span>
    `;

    btn.addEventListener('click', () => {
      loadConsultation(item.id);
      elements.sidebar.classList.remove('open');
    });

    elements.historyList.appendChild(btn);
  });
}

// Load a Consultation
function loadConsultation(id) {
  const item = state.history.find(h => h.id === id);
  if (!item) return;

  state.currentId = item.id;
  state.messages = [...item.messages];
  elements.consultationTitle.textContent = item.title;

  elements.welcomeHero.style.display = 'none';
  elements.messagesStream.innerHTML = '';

  state.messages.forEach(msg => {
    renderMessage(msg);
  });

  renderHistoryList();
  scrollToBottom();
}

// Export Consultation as Medical Summary
function exportConsultation() {
  if (state.messages.length === 0) {
    alert('No consultation messages to export yet.');
    return;
  }

  let textReport = `=======================================================
MEDICURE AI — CLINICAL CONSULTATION REPORT
Date & Time: ${new Date().toLocaleString()}
Consultation Topic: ${elements.consultationTitle.textContent}
=======================================================\n\n`;

  state.messages.forEach((m, idx) => {
    const speaker = m.role === 'user' ? 'PATIENT / USER' : 'MEDICURE AI ASSISTANT';
    textReport += `[${m.timestamp || ''}] ${speaker}:\n`;
    textReport += `${m.content}\n\n-------------------------------------------------------\n\n`;
  });

  textReport += `\nLEGAL & MEDICAL DISCLAIMER:
This summary was generated by MediCure AI for patient personal educational record-keeping and triage reference only. It does not replace an in-person medical evaluation, physician diagnosis, or pharmaceutical prescription.\n`;

  const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MediCure_Consultation_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', init);
