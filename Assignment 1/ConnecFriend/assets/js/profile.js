// Profile display, friend actions, saved ratings, and the editable self profile.
(() => {
  const me = CF.current();
  const id = new URLSearchParams(location.search).get('user') || me.id;
  const root = document.getElementById('profileContent');
  const logout = document.getElementById('profileLogout');

  logout.addEventListener('click', () => {
    CF.mutate(data => { data.currentUserId = null; });
    location.href = 'index.html';
  });

  if (!CF.user(id)) {
    root.innerHTML = '<div class="empty">We could not find that profile.</div>';
    return;
  }

  const ratingChoices = [
    [1, 'bi-emoji-dizzy', 'Stupid', 'They make questionable choices'],
    [2, 'bi-emoji-smile', 'Cool', 'They are a good friend'],
    [3, 'bi-shield-check', 'Trustworthy', 'You trust them completely']
  ];

  function render() {
    const viewer = CF.current();
    const person = CF.user(id);
    const own = person.id === viewer.id;
    const friends = person.friends.map(CF.user).filter(Boolean);
    const rating = own ? '' : `
      <section class="rating-panel panel" aria-labelledby="ratingTitle">
        <div class="rating-intro"><span class="rating-sparkle"><i class="bi bi-stars" aria-hidden="true"></i></span><div><p class="eyebrow green mb-1">A little appreciation</p><h2 id="ratingTitle">How do you rate ${CFU.esc(person.name.split(' ')[0])}?</h2><p class="muted mb-0">Let them know what kind of friend they are to you.</p></div></div>
        <div class="rating-options" role="group" aria-label="Choose a friend rating">
          ${ratingChoices.map(([value, icon, label, description]) => `<button class="rating-option ${viewer.ratings[person.id] === value ? 'active' : ''}" type="button" data-rating="${value}" aria-pressed="${viewer.ratings[person.id] === value}" title="${description}"><i class="bi ${icon}" aria-hidden="true"></i><span>${label}</span></button>`).join('')}
        </div>
      </section>`;

    root.innerHTML = `
      <section class="profile-banner">
        ${CFU.avatar(person, 'large')}
        <div class="profile-identity"><p class="eyebrow green mb-1">${own ? 'This is your space' : 'Member profile'}</p><h2>${CFU.esc(person.name)}</h2><p>@${CFU.esc(person.username)} · ${CFU.esc(person.city)}</p>
          ${own ? '' : `<div class="d-flex flex-wrap gap-2 mt-3"><button class="btn-sage" id="friendAction" type="button">${viewer.friends.includes(person.id) ? 'Friends ✓' : viewer.sentRequests.includes(person.id) ? 'Request pending' : 'Add friend'}</button><a class="btn-outline-sage" href="messages.html?to=${encodeURIComponent(person.id)}"><i class="bi bi-chat-dots" aria-hidden="true"></i> Message</a></div>`}
        </div>
        ${own ? '<span class="profile-orbit" aria-hidden="true"><i class="bi bi-sparkle"></i></span>' : ''}
      </section>
      ${rating}
      <div class="layout-two profile-layout">
        <section class="panel profile-detail-panel">
          <div class="panel-head"><h2 class="panel-title">The details</h2>${own ? '<button id="editProfile" class="small-btn" type="button"><i class="bi bi-pencil" aria-hidden="true"></i> Edit</button>' : ''}</div>
          <div class="profile-details">
            <div class="detail-item"><small>Email</small><strong>${CFU.esc(person.email)}</strong></div>
            <div class="detail-item"><small>Birthday</small><strong>${CFU.esc(person.birthday)}</strong></div>
            <div class="detail-item"><small>City</small><strong>${CFU.esc(person.city)}</strong></div>
            <div class="detail-item"><small>Username</small><strong>@${CFU.esc(person.username)}</strong></div>
            <div class="detail-item bio-detail"><small>A little about me</small><strong>${CFU.esc(person.bio)}</strong><i class="bi bi-music-note-beamed" aria-hidden="true"></i></div>
          </div>
        </section>
        <aside class="profile-friends panel">
          <div class="panel-head"><h2 class="panel-title">${own ? 'Your friends' : `${CFU.esc(person.name.split(' ')[0])}’s friends`}</h2><span class="badge-count">${friends.length}</span></div>
          ${friends.length ? friends.map(friend => `<a class="profile-friend-row" href="profile.html?user=${encodeURIComponent(friend.id)}">${CFU.avatar(friend, 'tiny')}<span><strong>${CFU.esc(friend.name)}</strong><small>@${CFU.esc(friend.username)} · ${CFU.esc(friend.city)}</small></span><i class="bi bi-arrow-up-right" aria-hidden="true"></i></a>`).join('') : '<div class="empty">No friends listed yet.</div>'}
        </aside>
      </div>`;

    const addButton = document.getElementById('friendAction');
    if (addButton) addButton.onclick = () => {
      if (viewer.friends.includes(person.id)) { CFU.toast('You are already friends.'); return; }
      if (viewer.sentRequests.includes(person.id)) { CFU.toast('Your request is already pending.'); return; }
      if (CF.user(person.id).ignoreList.includes(viewer.id)) { CFU.toast('You cannot send a request to this user.', 'error'); return; }
      CF.mutate(data => {
        data.users.find(user => user.id === person.id).receivedRequests.push(viewer.id);
        data.users.find(user => user.id === viewer.id).sentRequests.push(person.id);
      });
      CFU.toast('Friend request sent.');
      render();
    };

    root.querySelectorAll('[data-rating]').forEach(button => button.addEventListener('click', () => {
      const value = Number(button.dataset.rating);
      CF.mutate(data => { data.users.find(user => user.id === viewer.id).ratings[person.id] = value; });
      CFU.toast(`${person.name.split(' ')[0]} is rated ${ratingChoices[value - 1][2]}.`);
      render();
    }));

    const editButton = document.getElementById('editProfile');
    if (editButton) editButton.addEventListener('click', openEditor);
  }

  function openEditor() {
    const person = CF.user(id);
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop-custom';
    overlay.innerHTML = `<form class="modal-card" id="editForm"><div class="modal-head"><h2>Edit your profile</h2><button class="modal-close" type="button" aria-label="Close">&times;</button></div>
      <label class="form-label" for="editName">Name</label><input class="form-control mb-2" id="editName" name="name" value="${CFU.esc(person.name)}" required>
      <label class="form-label" for="editEmail">Email</label><input class="form-control mb-2" id="editEmail" name="email" type="email" value="${CFU.esc(person.email)}" required>
      <label class="form-label" for="editCity">City</label><input class="form-control mb-2" id="editCity" name="city" value="${CFU.esc(person.city)}" required>
      <label class="form-label" for="editBio">Bio</label><textarea class="form-control mb-3" id="editBio" name="bio" required>${CFU.esc(person.bio)}</textarea>
      <button class="btn-sage w-100" type="submit">Save profile</button></form>`;
    document.body.append(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    overlay.querySelector('form').onsubmit = event => {
      event.preventDefault();
      CF.mutate(data => Object.assign(data.users.find(user => user.id === id), Object.fromEntries(new FormData(event.currentTarget))));
      overlay.remove();
      CFU.toast('Profile updated.');
      render();
    };
    overlay.querySelector('#editName').focus();
  }

  render();
})();
