// Управление экранами, модалками, тостами

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

export function toast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// Закрытие модалок по клику на data-close-modal
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-modal]')) {
    e.target.closest('.modal')?.classList.remove('active');
  }
  // Клик по фону модалки
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});