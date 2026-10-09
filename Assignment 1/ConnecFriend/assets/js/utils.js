// Small shared helpers used by every page module.
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const initials = name => String(name || '?').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const colors = ['#d87957', '#697f67', '#806a9b', '#d4a643', '#508a93', '#ad6f7c', '#6d7fba', '#799461', '#c07d44', '#597b78'];
  const avatar = (user, size = '') => `<span class="avatar ${size}" style="--avatar:${colors[(Number((user?.id || 'u1').replace(/\D/g, '')) || 1) % colors.length]}">${esc(initials(user?.name))}</span>`;
  const ago = value => {
    const elapsed = Math.max(0, Date.now() - new Date(value || Date.now()).getTime());
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };
  const toast = (message, type = 'success') => {
    let region = document.getElementById('toastRegion');
    if (!region) { region = document.createElement('div'); region.id = 'toastRegion'; region.className = 'toast-region'; region.setAttribute('aria-live', 'polite'); document.body.append(region); }
    const icons = { success: 'check2', error: 'exclamation-lg', info: 'info-lg' };
    const note = document.createElement('div'); note.className = `toast-note ${type}`;
    const icon = document.createElement('span'); icon.className = 'toast-icon'; icon.innerHTML = `<i class="bi bi-${icons[type] || icons.info}" aria-hidden="true"></i>`;
    const text = document.createElement('span'); text.className = 'toast-text'; text.textContent = message;
    const progress = document.createElement('span'); progress.className = 'toast-progress'; progress.setAttribute('aria-hidden', 'true');
    note.append(icon, text, progress); region.append(note); setTimeout(() => note.remove(), 3200);
  };
  window.CFU = { esc, initials, avatar, ago, toast, member: id => CF.user(id) };
})();
