const termsCheckbox = document.getElementById('terms-agree');
const startBtn = document.getElementById('start-btn');
const userCountEl = document.getElementById('user-count');

function updateStartButton() {
  const agreed = termsCheckbox.checked;
  if (agreed) {
    startBtn.removeAttribute('aria-disabled');
    startBtn.removeAttribute('tabindex');
    startBtn.classList.remove('disabled');
  } else {
    startBtn.setAttribute('aria-disabled', 'true');
    startBtn.setAttribute('tabindex', '-1');
    startBtn.classList.add('disabled');
  }
}

termsCheckbox.addEventListener('change', updateStartButton);

startBtn.addEventListener('click', (e) => {
  if (!termsCheckbox.checked) {
    e.preventDefault();
  }
});

function setUserCount(count) {
  const label = count === 1 ? 'person' : 'people';
  userCountEl.textContent = `${count} ${label} online right now`;
}

async function fetchUserCount() {
  try {
    const res = await fetch('/api/user-count');
    const data = await res.json();
    setUserCount(data.count);
  } catch {
    userCountEl.textContent = 'Join the conversation';
  }
}

if (typeof io !== 'undefined') {
  const socket = io();
  socket.on('userCount', setUserCount);
}

fetchUserCount();
setInterval(fetchUserCount, 15000);

updateStartButton();
