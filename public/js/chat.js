const socket = io();

socket.on('connect', () => {
  socket.emit('joinChat');
});

let partnerId = null;
let partnerName = 'Stranger';
let yourName = 'You';
let typingTimeout = null;
let isTyping = false;

const waitingState = document.getElementById('waiting-state');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const endChatButton = document.getElementById('end-chat-button');
const backButton = document.getElementById('back-button');
const imageInput = document.getElementById('image-input');
const typingIndicator = document.getElementById('typing-indicator');
const typingLabel = document.getElementById('typing-label');
const statusBadge = document.getElementById('status-badge');
const onlineCount = document.getElementById('online-count');
const partnerNameEl = document.getElementById('partner-name');
const chatBox = document.getElementById('chat-box');
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmOk = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel');

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

function showError(message) {
  const existing = document.querySelector('.error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showConfirm({ title, message, confirmLabel, variant = 'accent' }) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.textContent = confirmLabel;
    confirmOk.className = `confirm-btn confirm-btn--ok${variant === 'purple' ? ' confirm-btn--purple' : ''}`;

    confirmOverlay.hidden = false;
    confirmOk.focus();

    function close(result) {
      confirmOverlay.hidden = true;
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }

    function onKey(e) {
      if (e.key === 'Escape') close(false);
    }

    confirmOk.onclick = () => close(true);
    confirmCancel.onclick = () => close(false);
    confirmOverlay.onclick = (e) => {
      if (e.target === confirmOverlay) close(false);
    };
    document.addEventListener('keydown', onKey);
  });
}

function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Image preview');

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Full size image';
  overlay.appendChild(img);

  overlay.addEventListener('click', () => overlay.remove());
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
  });
  document.body.appendChild(overlay);
}

function setChatEnabled(enabled) {
  messageInput.disabled = !enabled;
  skipButton.disabled = !enabled;
  updateSendButton();
}

function updateSendButton() {
  const hasText = messageInput.value.trim().length > 0;
  sendButton.disabled = messageInput.disabled || !hasText;
}

function setStatus(text, state = 'idle') {
  statusBadge.textContent = text;
  statusBadge.className = `status-pill status-pill--${state}`;
}

function setPartnerDisplay(name) {
  if (name) {
    partnerNameEl.textContent = `Chatting with ${name}`;
    partnerNameEl.hidden = false;
  } else {
    partnerNameEl.textContent = '';
    partnerNameEl.hidden = true;
  }
}

function hideTyping() {
  typingIndicator.hidden = true;
}

function showTyping() {
  typingLabel.textContent = `${partnerName} is typing...`;
  typingIndicator.hidden = false;
  requestAnimationFrame(scrollToBottom);
}

function showWaiting() {
  partnerId = null;
  partnerName = 'Stranger';
  waitingState.hidden = false;
  chatMessages.hidden = true;
  chatMessages.innerHTML = '';
  setChatEnabled(false);
  setStatus('Searching', 'searching');
  setPartnerDisplay(null);
  hideTyping();
}

function showConnected(name) {
  waitingState.hidden = true;
  chatMessages.hidden = false;
  setChatEnabled(true);
  setStatus('Connected', 'connected');
  setPartnerDisplay(name);
  messageInput.focus();
}

function appendSystemMessage(text) {
  waitingState.hidden = true;
  chatMessages.hidden = false;

  const msg = document.createElement('div');
  msg.className = 'message message-system';
  msg.setAttribute('role', 'listitem');
  msg.textContent = text;
  chatMessages.appendChild(msg);
  requestAnimationFrame(scrollToBottom);
}

function appendMessage(content, isOwn, type = 'text', timestamp = Date.now()) {
  waitingState.hidden = true;
  chatMessages.hidden = false;

  const row = document.createElement('div');
  row.className = `message-row ${isOwn ? 'message-row--own' : 'message-row--stranger'}`;
  row.setAttribute('role', 'listitem');

  const msg = document.createElement('div');
  msg.className = `message ${isOwn ? 'message-own' : 'message-stranger'}`;

  const label = document.createElement('strong');
  label.className = 'message-sender';
  label.textContent = isOwn ? yourName : partnerName;

  if (type === 'image') {
    const img = document.createElement('img');
    img.src = content;
    img.className = 'chat-image';
    img.alt = isOwn ? 'Image you sent' : `Image from ${partnerName}`;
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(content));
    msg.appendChild(label);
    msg.appendChild(img);
  } else {
    const p = document.createElement('p');
    p.textContent = content;
    msg.appendChild(label);
    msg.appendChild(p);
  }

  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = formatTime(timestamp);

  row.appendChild(msg);
  row.appendChild(time);

  chatMessages.appendChild(row);
  requestAnimationFrame(scrollToBottom);
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!partnerId || !message) return;

  socket.emit('message', { message });
  appendMessage(message, true);
  messageInput.value = '';
  updateSendButton();
  stopTypingEmit();
}

function stopTypingEmit() {
  if (isTyping) {
    isTyping = false;
    socket.emit('stopTyping');
  }
  clearTimeout(typingTimeout);
}

function handleTyping() {
  updateSendButton();
  if (!partnerId) return;

  if (!isTyping) {
    isTyping = true;
    socket.emit('typing');
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTypingEmit, 1500);
}

function sendImage(file) {
  if (!partnerId || !file) return;

  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    showError('Image must be under 2 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('image', {
      mimeType: file.type,
      dataUrl: reader.result,
    });
    appendMessage(reader.result, true, 'image');
  };
  reader.readAsDataURL(file);
}

socket.on('match', ({ partnerId: id, partnerName: name, yourName: alias }) => {
  partnerId = id;
  partnerName = name || 'Stranger';
  yourName = alias || 'You';
  showConnected(partnerName);
  appendSystemMessage(`Connected to ${partnerName}! You're chatting as ${yourName}.`);
});

socket.on('searching', () => {
  showWaiting();
});

socket.on('message', (data) => {
  appendMessage(data.message, false, data.type || 'text', data.timestamp);
  hideTyping();
});

socket.on('typing', () => {
  showTyping();
});

socket.on('stopTyping', () => {
  hideTyping();
});

socket.on('partnerLeft', ({ reason }) => {
  const name = partnerName;
  const messages = {
    disconnect: `${name} disconnected.`,
    skip: `${name} skipped to someone else.`,
    rematch: `${name} is looking for someone new.`,
  };
  appendSystemMessage(messages[reason] || `${name} left the chat.`);
  appendSystemMessage('Finding you a new stranger...');
  partnerId = null;
  partnerName = 'Stranger';
  setChatEnabled(false);
  setStatus('Searching', 'searching');
  setPartnerDisplay(null);
});

socket.on('userCount', (count) => {
  onlineCount.textContent = `${count} online`;
});

socket.on('error', ({ message }) => {
  showError(message);
});

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener('input', handleTyping);

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) sendImage(file);
  e.target.value = '';
});

async function leaveChat() {
  const confirmed = await showConfirm({
    title: 'Leave chat?',
    message: 'Your conversation will end and you\'ll return to the home page.',
    confirmLabel: 'Leave chat',
    variant: 'purple',
  });
  if (!confirmed) return;

  socket.disconnect();
  window.location.href = '/';
}

skipButton.addEventListener('click', () => {
  appendSystemMessage(`Skipping ${partnerName}...`);
  socket.emit('skip');
  showWaiting();
});

endChatButton.addEventListener('click', leaveChat);

backButton.addEventListener('click', (e) => {
  e.preventDefault();
  leaveChat();
});

showWaiting();
