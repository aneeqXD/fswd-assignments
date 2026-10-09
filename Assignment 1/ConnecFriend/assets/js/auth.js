// Shared session guard and local-only sign-in simulation.
(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page !== 'index.html' && !CF.current()) { location.replace('index.html'); return; }
  if (page === 'index.html' && CF.current()) { location.replace('home.html'); return; }

  const form = document.getElementById('loginForm');
  if (!form) return;
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const error = document.getElementById('loginError');
  const submit = form.querySelector('[type="submit"]');
  const demoAccounts = document.getElementById('demoAccounts');
  if (demoAccounts) {
    demoAccounts.innerHTML = CF.get().users.map(user => `<button class="demo-account" type="button" data-demo-user="${CFU.esc(user.username)}" aria-pressed="false"><span class="demo-avatar" aria-hidden="true">${CFU.esc(CFU.initials(user.name))}</span><span><strong>${CFU.esc(user.name)}</strong><small>@${CFU.esc(user.username)}</small></span><i class="bi bi-arrow-down-left" aria-hidden="true"></i></button>`).join('');
    demoAccounts.addEventListener('click', event => {
      const choice = event.target.closest('[data-demo-user]');
      if (!choice) return;
      username.value = choice.dataset.demoUser;
      password.value = 'friend123';
      username.removeAttribute('aria-invalid');
      password.removeAttribute('aria-invalid');
      error.textContent = '';
      demoAccounts.querySelectorAll('[data-demo-user]').forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
      document.getElementById('demoSelection').textContent = `${choice.querySelector('strong').textContent}'s details are ready. Sign in when you are ready.`;
    });
  }
  [username, password].forEach(input => input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid'); error.textContent = '';
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const member = CF.get().users.find(user => user.username.toLowerCase() === username.value.trim().toLowerCase() && user.password === password.value);
    if (!member) {
      error.textContent = 'That username and password do not match. Try a demo login below.';
      password.setAttribute('aria-invalid', 'true'); form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return;
    }
    submit.disabled = true; submit.setAttribute('aria-busy', 'true');
    submit.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Checking your circle';
    await CF.delay(320);
    CF.mutate(data => { data.currentUserId = member.id; data.users.find(user => user.id === member.id).lastLogin = new Date().toISOString(); });
    location.href = 'home.html';
  });
})();
