/**
 * AI Chatbot Widget
 * Floating chat interface for student support
 */

const API_BASE = window.location.origin + '/api';
let chatAuthToken = null;
let chatCurrentUser = null;
let currentChatMode = 'chat';
let isChatOpen = false;

// Initialize chatbot
function initChatbot() {
  // Get auth token
  chatAuthToken = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('currentUser');

  if (!chatAuthToken || !userStr) {
    console.log('Chatbot: User not authenticated');
    return;
  }

  try {
    chatCurrentUser = JSON.parse(userStr);
  } catch (error) {
    console.error('Chatbot: Failed to parse user data', error);
    return;
  }

  // Create chatbot UI
  createChatbotUI();

  // Event listeners
  setupChatEventListeners();

  console.log('Chatbot initialized');
}

// Create chatbot UI elements
function createChatbotUI() {
  const chatWidget = document.createElement('div');
  chatWidget.id = 'aiChatWidget';
  chatWidget.innerHTML = `
    <!-- Chat Toggle Button -->
    <button id="chatToggleBtn" aria-label="Open chat">
      💬
    </button>

    <!-- Chat Window -->
    <div id="chatWindow">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-title">
          <span>🤖</span>
          <div>
            <h3>AI Assistant</h3>
            <div class="chat-header-subtitle">Here to help!</div>
          </div>
        </div>
        <button class="chat-close-btn" id="chatCloseBtn" aria-label="Close chat">×</button>
      </div>

      <!-- Chat Modes -->
      <div class="chat-modes">
        <button class="mode-btn active" data-mode="chat">Chat</button>
        <button class="mode-btn" data-mode="wellbeing_tips">Wellbeing</button>
        <button class="mode-btn" data-mode="recommendation">Recommend</button>
      </div>

      <!-- Chat Body -->
      <div class="chat-body" id="chatBody">
        <div class="chat-welcome">
          <h4>👋 Hello!</h4>
          <p>I'm your AI assistant. Ask me anything about booking appointments, wellbeing tips, or counselor recommendations!</p>
        </div>
        <div class="chat-quick-actions">
          <button class="quick-action-btn" data-prompt="How do I book an appointment?">How do I book an appointment?</button>
          <button class="quick-action-btn" data-prompt="Give me stress management tips">Give me stress management tips</button>
          <button class="quick-action-btn" data-prompt="I need help choosing a counselor">Help me choose a counselor</button>
        </div>
        <div class="typing-indicator" id="typingIndicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input-area">
        <textarea 
          id="chatInput" 
          placeholder="Type your message..."
          rows="1"
          maxlength="500"
        ></textarea>
        <button id="chatSendBtn" aria-label="Send message">
          ➤
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(chatWidget);
}

// Setup event listeners
function setupChatEventListeners() {
  const toggleBtn = document.getElementById('chatToggleBtn');
  const closeBtn = document.getElementById('chatCloseBtn');
  const sendBtn = document.getElementById('chatSendBtn');
  const chatInput = document.getElementById('chatInput');
  const chatWindow = document.getElementById('chatWindow');
  const modeBtns = document.querySelectorAll('.mode-btn');
  const quickActionBtns = document.querySelectorAll('.quick-action-btn');

  // Toggle chat
  toggleBtn.addEventListener('click', () => {
    toggleChat();
  });

  closeBtn.addEventListener('click', () => {
    toggleChat();
  });

  // Mode switching
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchChatMode(btn.dataset.mode);
    });
  });

  // Send message
  sendBtn.addEventListener('click', () => {
    sendChatMessage();
  });

  // Enter to send (Shift+Enter for new line)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
  });

  // Quick actions
  quickActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      chatInput.value = prompt;
      sendChatMessage();
    });
  });
}

// Toggle chat window
function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  const toggleBtn = document.getElementById('chatToggleBtn');

  isChatOpen = !isChatOpen;

  if (isChatOpen) {
    chatWindow.classList.add('show');
    toggleBtn.classList.add('open');
    toggleBtn.textContent = '✕';
    document.getElementById('chatInput').focus();
  } else {
    chatWindow.classList.remove('show');
    toggleBtn.classList.remove('open');
    toggleBtn.textContent = '💬';
  }
}

// Switch chat mode
function switchChatMode(mode) {
  currentChatMode = mode;

  // Update active button
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });

  // Add mode change message
  let modeMessage = '';
  switch (mode) {
    case 'chat':
      modeMessage = 'General chat mode - Ask me anything!';
      break;
    case 'wellbeing_tips':
      modeMessage = 'Wellbeing mode - I\'ll provide wellness tips and stress management advice.';
      break;
    case 'recommendation':
      modeMessage = 'Recommendation mode - Tell me your needs and I\'ll suggest the best counselor type for you.';
      break;
  }

  addBotMessage(modeMessage);
}

// Send chat message
async function sendChatMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();

  if (!message) return;

  // Clear input and reset height
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Add user message to chat
  addUserMessage(message);

  // Show typing indicator
  showTypingIndicator();

  // Disable send button
  const sendBtn = document.getElementById('chatSendBtn');
  sendBtn.disabled = true;

  try {
    // Call AI API
    const response = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chatAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: message,
        mode: currentChatMode
      })
    });

    const data = await response.json();

    // Hide typing indicator
    hideTypingIndicator();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response');
    }

    // Add bot response
    addBotMessage(data.data.response, data.data.cached);
  } catch (error) {
    hideTypingIndicator();
    console.error('Chat error:', error);

    let errorMsg = 'Sorry, I\'m having trouble responding right now. Please try again.';
    if (error.message.includes('rate limit')) {
      errorMsg = 'You\'ve reached the rate limit. Please wait a few minutes before trying again.';
    } else if (error.message.includes('session expired')) {
      errorMsg = 'Your session has expired. Please refresh the page and login again.';
    }

    addBotMessage(`⚠️ ${errorMsg}`);
  } finally {
    // Re-enable send button
    sendBtn.disabled = false;
  }
}

// Add user message to chat
function addUserMessage(message) {
  const chatBody = document.getElementById('chatBody');
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message user';
  messageEl.innerHTML = `
    <div class="message-avatar">👤</div>
    <div class="message-content">${escapeHtml(message)}</div>
  `;
  chatBody.appendChild(messageEl);
  scrollToBottom();
}

// Add bot message to chat
function addBotMessage(message, cached = false) {
  const chatBody = document.getElementById('chatBody');
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message bot';

  // Format message (convert newlines to <br>)
  const formattedMessage = escapeHtml(message).replace(/\n/g, '<br>');

  messageEl.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      ${formattedMessage}
      ${cached ? '<div class="message-time">⚡ Cached</div>' : ''}
    </div>
  `;
  chatBody.appendChild(messageEl);
  scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  indicator.classList.add('show');
  scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  indicator.classList.remove('show');
}

// Scroll chat to bottom
function scrollToBottom() {
  const chatBody = document.getElementById('chatBody');
  setTimeout(() => {
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 100);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
