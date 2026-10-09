// Conversation UI with live WebSocket delivery and local message history.
(() => {
  const me = CF.current();
  const list = document.getElementById('conversationList');
  const thread = document.getElementById('chatThread');
  const header = document.getElementById('chatHeader');
  const input = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  let activeId = null;

  function messagesWith(id) {
    return CF.get().messages.filter(m =>
      (m.fromId === me.id && m.toId === id) || (m.fromId === id && m.toId === me.id));
  }
  function conversations() {
    const ids = new Set();
    CF.get().messages.forEach(m => {
      if (m.fromId === me.id) ids.add(m.toId);
      if (m.toId === me.id) ids.add(m.fromId);
    });
    return [...ids].map(CF.user).filter(Boolean).sort((a, b) => lastTime(b.id) - lastTime(a.id));
  }
  function lastTime(id) {
    const latest = messagesWith(id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return latest ? new Date(latest.createdAt).getTime() : 0;
  }
  function renderList() {
    const users = conversations();
    list.innerHTML = users.length ? users.map(user => {
      const messages = messagesWith(user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const unread = messages.filter(m => m.fromId === user.id && m.toId === me.id && !m.read).length;
      return `<button class="conversation-row ${activeId === user.id ? 'active' : ''}" data-convo="${user.id}" type="button">
        ${CFU.avatar(user, 'tiny')}<span class="friend-info"><strong>${CFU.esc(user.name)}</strong><small>${CFU.esc((messages[0]?.text || '').slice(0, 30))}</small></span>
        ${unread ? `<span class="unread-pill" aria-label="${unread} unread">${unread}</span>` : ''}</button>`;
    }).join('') : '<div class="empty">No conversations yet.<br>Start one with any member.</div>';
  }
  function markRead(userId) {
    const unreadIds = messagesWith(userId).filter(m => m.fromId === userId && m.toId === me.id && !m.read).map(m => m.id);
    if (!unreadIds.length) return;
    CF.mutate(data => data.messages.forEach(m => { if (unreadIds.includes(m.id)) m.read = true; }));
    CF.realtimeSend({ type: 'read', fromId: me.id, toId: userId, ids: unreadIds });
  }
  function renderChat() {
    if (!activeId) {
      header.innerHTML = '<span class="muted">Choose a conversation or start a new one.</span>';
      thread.innerHTML = '<div class="empty">Your conversations will appear here.</div>';
      input.disabled = sendButton.disabled = true;
      return;
    }
    const user = CF.user(activeId);
    if (!user) return;
    const online = CF.isOnline(user.id);
    header.innerHTML = `${CFU.avatar(user, 'tiny')}<div class="friend-info"><strong>${CFU.esc(user.name)}</strong>
      <small>${online ? '<span class="online-dot"></span>Online now' : `Last seen ${CFU.ago(user.lastLogin)}`}</small></div>
      <a class="small-btn" href="profile.html?user=${user.id}">View profile</a>`;
    const messages = messagesWith(user.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    thread.innerHTML = messages.length ? messages.map(m => `<div class="bubble ${m.fromId === me.id ? 'mine' : ''}">
      ${CFU.esc(m.text)}<time>${CFU.ago(m.createdAt)}</time></div>`).join('') : '<div class="empty">Say hello to start this conversation.</div>';
    input.disabled = sendButton.disabled = false;
    thread.scrollTop = thread.scrollHeight;
    markRead(user.id);
  }
  function openConversation(id) { activeId = id; renderList(); renderChat(); }

  list.addEventListener('click', event => {
    const row = event.target.closest('[data-convo]');
    if (row) openConversation(row.dataset.convo);
  });
  document.getElementById('newMessage').addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop-custom';
    overlay.innerHTML = `<div class="modal-card"><div class="modal-head"><h2>New message</h2><button class="modal-close" type="button" aria-label="Close">&times;</button></div>
      <p class="muted small">Choose any member to start a private conversation.</p>
      <label class="visually-hidden" for="memberSearch">Search members</label><input class="form-control mb-2" id="memberSearch" type="search" placeholder="Search members..." autocomplete="off">
      <label class="visually-hidden" for="newRecipient">Member</label><select class="form-select" id="newRecipient"><option value="">Choose a member&hellip;</option>
      ${CF.get().users.filter(u => u.id !== me.id).map(u => `<option value="${u.id}">${CFU.esc(u.name)} &middot; @${u.username}</option>`).join('')}</select>
      <button class="btn-sage w-100 mt-3" id="startChat" type="button">Open conversation</button></div>`;
    document.body.append(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    overlay.querySelector('#memberSearch').addEventListener('input', event => {
      const query = event.target.value.trim().toLowerCase();
      [...overlay.querySelector('#newRecipient').options].slice(1).forEach(option => { option.hidden = !option.textContent.toLowerCase().includes(query); });
    });
    overlay.querySelector('#startChat').onclick = () => {
      const id = overlay.querySelector('select').value;
      if (!id) { CFU.toast('Choose a member first.', 'error'); return; }
      overlay.remove(); openConversation(id); input.focus();
    };
  });
  document.getElementById('chatForm').addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || !activeId) { if (!activeId) CFU.toast('Choose a conversation first.', 'error'); return; }
    const message = { id: CF.id(), fromId: me.id, toId: activeId, text, createdAt: new Date().toISOString(), read: false };
    await CF.delay(120);
    CF.mutate(data => data.messages.push(message));
    CF.realtimeSend({ type: 'message', message });
    input.value = '';
    CFU.toast('Message sent.');
    renderList(); renderChat(); input.focus();
  });
  document.getElementById('emojiRow').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !input.disabled) { input.value += button.textContent; input.focus(); }
  });
  window.addEventListener('cf:message', event => {
    const message = event.detail;
    const otherId = message.fromId === me.id ? message.toId : message.fromId;
    renderList();
    if (activeId === otherId) renderChat();
  });
  window.addEventListener('cf:history', () => { renderList(); if (activeId) renderChat(); });
  window.addEventListener('cf:presence', () => { if (activeId) renderChat(); });
  window.addEventListener('cf:change', () => { renderList(); if (activeId) renderChat(); });

  const requestedId = new URLSearchParams(location.search).get('to');
  if (requestedId && CF.user(requestedId) && requestedId !== me.id) openConversation(requestedId);
  else { renderList(); if (conversations().length) openConversation(conversations()[0].id); }
})();
