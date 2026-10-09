// Shared theme, entrance, reveal, and badge micro-interactions.
(() => {
  const themeKey = 'connecfriend-theme';
  const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const dark = theme === 'dark';
      button.innerHTML = `<i class="bi bi-${dark ? 'sun' : 'moon-stars'}" aria-hidden="true"></i><span>${dark ? 'Light mode' : 'Dark mode'}</span>`;
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }
  const storedTheme = localStorage.getItem(themeKey);
  applyTheme(storedTheme || systemTheme());

  let navigating = false;
  document.addEventListener('click', event => {
    if (event.target.closest('.theme-toggle')) {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(themeKey, next);
      applyTheme(next);
    }
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.href === location.href) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    document.documentElement.classList.add('page-leaving');
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 190;
    window.setTimeout(() => location.assign(destination.href), delay);
  });
  document.addEventListener('input', event => {
    if (event.target.id !== 'globalSearch') return;
    const query = event.target.value.trim().toLowerCase();
    const results = document.getElementById('globalSearchResults');
    if (!query || !window.CF || !window.CFU) { if (results) results.hidden = true; return; }
    const me = CF.current(), data = CF.get(), friends = new Set(me?.friends || []);
    const users = data.users.filter(user => user.id !== me?.id && `${user.name} ${user.username} ${user.city}`.toLowerCase().includes(query))
      .slice(0, 5).map(user => ({ href: `profile.html?user=${user.id}`, icon: 'person-circle', title: user.name, detail: `@${user.username} · ${user.city}` }));
    const posts = data.posts.filter(post => {
      const visible = post.authorId === me?.id || (friends.has(post.authorId) && (post.audience === 'all' || post.audience.includes?.(me?.id)));
      return visible && post.text.toLowerCase().includes(query);
    }).slice(0, 4).map(post => ({ href: `home.html#post-${post.id}`, icon: 'chat-square-text', title: post.text, detail: `News from ${CF.user(post.authorId)?.name || 'a member'}` }));
    const matches = [...users, ...posts];
    results.innerHTML = matches.length ? matches.map(item => `<a class="search-result" href="${item.href}"><i class="bi bi-${item.icon}"></i><span><strong>${CFU.esc(item.title)}</strong><small>${CFU.esc(item.detail)}</small></span><i class="bi bi-arrow-up-right"></i></a>`).join('') : '<p class="search-empty">No matches in your circle.</p>';
    results.hidden = false;
  });
  document.addEventListener('submit', event => {
    if (event.target.id !== 'globalSearchForm') return;
    event.preventDefault(); document.querySelector('#globalSearchResults a')?.click();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('globalSearch')?.focus(); }
    if (event.key === 'Escape') { const search = document.getElementById('globalSearchResults'); if (search) search.hidden = true; }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.global-search')) { const results = document.getElementById('globalSearchResults'); if (results) results.hidden = true; }
  });
  window.addEventListener('storage', event => {
    if (event.key === themeKey) applyTheme(event.newValue || systemTheme());
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', event => {
    if (!localStorage.getItem(themeKey)) applyTheme(event.matches ? 'dark' : 'light');
  });
  window.CFU = window.CFU || {};
  window.CFU.applyTheme = () => applyTheme(document.documentElement.dataset.theme || systemTheme());

  document.documentElement.classList.add('page-enter');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); reveal.unobserve(entry.target); }
    }), { threshold: 0.08 });
    const observe = root => {
      if (root.matches?.('[data-reveal]')) reveal.observe(root);
      root.querySelectorAll?.('[data-reveal]').forEach(node => reveal.observe(node));
    };
    observe(document);
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) observe(node); })))
      .observe(document.body, { childList: true, subtree: true });
  } else document.querySelectorAll('[data-reveal]').forEach(node => node.classList.add('revealed'));

  const badgeObserver = new MutationObserver(records => records.forEach(record => {
    const badge = record.target;
    badge.classList.remove('badge-change');
    requestAnimationFrame(() => badge.classList.add('badge-change'));
  }));
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType !== 1) return;
    if (node.matches?.('.rail-badge,.unread-pill')) badgeObserver.observe(node, { childList: true, characterData: true, subtree: true });
    node.querySelectorAll?.('.rail-badge,.unread-pill').forEach(badge => badgeObserver.observe(badge, { childList: true, characterData: true, subtree: true }));
  }))).observe(document.body, { childList: true, subtree: true });
})();
