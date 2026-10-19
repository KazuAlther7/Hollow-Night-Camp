// HOLLOW NIGHT CAMP — shared by every page after login:
// session guard, role check, Main Bar / ⋮ menu rendering, sign out.

import {
  getCurrentSession,
  getReaderProfile,
  logoutReader,
  observeAuthState
} from './auth.js';

export const ENTERED_KEY = 'hnc_entered';

const NAV = [
  { id: 'campfire', href: 'home.html',     icon: 'campfire', label: 'Campfire' },
  { id: 'novels',   href: 'novels.html',   icon: 'novels', label: 'Novels' },
  { id: 'theories', href: 'theories.html', icon: 'theories', label: 'Theories' },
  { id: 'arcade',   href: 'arcade.html',   icon: 'arcade', label: 'Arcade' },
  { id: 'settings', href: 'settings.html', icon: 'settings', label: 'Settings' }
];

// Icons are single-colour PNGs in assets/icons/, tinted with CSS mask (see mainbar.css)
function icon(name) {
  return `<span class="icon icon-${name}" aria-hidden="true"></span>`;
}

function navLinks(active) {
  return NAV.map((page) => `
    <a class="camp-nav-item${page.id === active ? ' active' : ''}" href="${page.href}"${page.id === active ? ' aria-current="page"' : ''}>
      ${icon(page.icon)}<span>${page.label}</span>
    </a>`).join('');
}

function authorEntry(isAuthor, hasToggleHandler) {
  if (!isAuthor) return '';

  if (hasToggleHandler) {
    return `
      <button id="authorStudioToggle" class="camp-nav-item author-toggle" type="button"
              aria-expanded="false" aria-controls="homeAuthorStudio">
        ${icon('author-studio')}<span class="toggle-label">Author Studio</span>
      </button>`;
  }

  return `
    <a class="camp-nav-item author-toggle" href="home.html?studio=1">
      ${icon('author-studio')}<span class="toggle-label">Author Studio</span>
    </a>`;
}

// Main Bar: glass navigation with horizontal/sidebar and compact modes.
function mountMainBar({ active, isAuthor, onAuthorToggle, profile, user }) {
  document.body.insertAdjacentHTML('afterbegin', `
    <button class="bar-layout-toggle" id="barLayoutToggle" type="button" aria-label="Move navigation to sidebar" title="Move navigation to sidebar">←</button>
    <nav class="main-bar" id="mainBar" aria-label="Main navigation">
      <button class="bar-collapse-toggle" id="barCollapseToggle" type="button" aria-label="Collapse navigation items" aria-expanded="true" title="Show or hide navigation items">‹</button>
      <a class="bar-brand" href="home.html" aria-label="Hollow Night Camp home">
        <img class="bar-logo" src="assets/image/hollow-night-logo.png" alt="Hollow Night">
      </a>
      <div class="bar-primary-links" id="barPrimaryLinks">${navLinks(active)}</div>
      <div class="bar-utility-links">
        ${authorEntry(isAuthor, Boolean(onAuthorToggle))}
        <button class="bar-icon-button" id="notificationButton" type="button" aria-label="Notifications" title="Notifications">
          ${icon('notification')}<span class="notification-dot"></span>
        </button>
        <button class="bar-icon-button profile-menu-button" id="profileMenuButton" type="button" aria-label="Account menu" aria-expanded="false" title="Profile and sign out">
          ${profile?.avatar_url
            ? `<img class="bar-avatar" src="${escapeAttribute(profile.avatar_url)}" alt="">`
            : `<span class="bar-avatar-fallback">${escapeHtml((profile?.nickname || user?.email || 'C').trim().charAt(0).toUpperCase())}</span>`}
        </button>
      </div>
      <div class="bar-profile-menu" id="barProfileMenu" hidden>
        <div class="bar-profile-summary">
          <strong>${escapeHtml(profile?.nickname || 'Camper')}</strong>
          <small>${escapeHtml(user?.email || '')}</small>
        </div>
        <a href="settings.html#profile">My Profile</a>
        <button type="button" id="barSignOutButton">Sign out of camp</button>
      </div>
    </nav>`);

  const bar = document.getElementById('mainBar');
  const layoutButton = document.getElementById('barLayoutToggle');
  const collapseButton = document.getElementById('barCollapseToggle');
  const profileButton = document.getElementById('profileMenuButton');
  const profileMenu = document.getElementById('barProfileMenu');

  let sidebar = false;
  let compact = false;
  try {
    sidebar = localStorage.getItem('hnc_bar_sidebar') === '1';
    compact = localStorage.getItem('hnc_bar_compact') === '1';
  } catch (e) {}

  const applyBarState = () => {
    document.body.classList.toggle('bar-sidebar', sidebar);
    bar.classList.toggle('bar-compact', compact);
    layoutButton.textContent = sidebar ? '→' : '←';
    layoutButton.setAttribute('aria-label', sidebar ? 'Move navigation to top bar' : 'Move navigation to sidebar');
    layoutButton.title = sidebar ? 'Move navigation to top bar' : 'Move navigation to sidebar';
    collapseButton.textContent = compact ? '›' : '‹';
    collapseButton.setAttribute('aria-expanded', String(!compact));
    collapseButton.setAttribute('aria-label', compact ? 'Show navigation items' : 'Hide navigation items');
  };
  applyBarState();

  layoutButton.addEventListener('click', () => {
    sidebar = !sidebar;
    try { localStorage.setItem('hnc_bar_sidebar', sidebar ? '1' : '0'); } catch (e) {}
    applyBarState();
  });
  collapseButton.addEventListener('click', () => {
    compact = !compact;
    try { localStorage.setItem('hnc_bar_compact', compact ? '1' : '0'); } catch (e) {}
    applyBarState();
  });

  const authorToggle = document.getElementById('authorStudioToggle');
  if (authorToggle && onAuthorToggle) {
    authorToggle.addEventListener('click', () => onAuthorToggle(authorToggle));
  }

  profileButton.addEventListener('click', () => {
    const open = profileMenu.hidden;
    profileMenu.hidden = !open;
    profileButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (!profileMenu.hidden && !profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
      profileMenu.hidden = true;
      profileButton.setAttribute('aria-expanded', 'false');
    }
  });
  document.getElementById('barSignOutButton').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Signing out...';
    try { await signOut(); } catch (error) { button.disabled = false; button.textContent = 'Sign out of camp'; }
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function escapeAttribute(value) { return escapeHtml(value); }

// Editor: the Main Bar becomes a round ⋮ button (top-left)
function mountEditorMenu({ active, isAuthor }) {
  document.body.classList.add('editor-mode');

  document.body.insertAdjacentHTML('afterbegin', `
    <button id="editorMenuButton" class="editor-menu-button" type="button"
            aria-label="Open menu" aria-expanded="false" aria-controls="editorMenu">⋮</button>
    <div id="editorMenu" class="editor-menu" hidden>
      ${navLinks(active)}
      ${isAuthor ? `<a class="camp-nav-item" href="home.html?studio=1">${icon('author-studio')}<span>Author Studio</span></a>` : ''}
    </div>`);

  const button = document.getElementById('editorMenuButton');
  const menu = document.getElementById('editorMenu');

  const setOpen = (open) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };

  button.addEventListener('click', () => setOpen(menu.hidden));

  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

let signingOut = false;

export async function signOut() {
  signingOut = true;

  try {
    sessionStorage.removeItem(ENTERED_KEY);
  } catch (error) {}

  await logoutReader();
  window.location.href = 'index.html?signedout=1';
}

// Call once per page. Redirects to index.html when there is no session.
export async function initPage(options = {}) {
  const {
    active = 'campfire',
    editor = false,
    requireAuthor = false,
    onAuthorToggle = null
  } = options;

  let session = null;

  try {
    session = await getCurrentSession();
  } catch (error) {
    console.error('Unable to read session:', error);
  }

  if (!session?.user) {
    window.location.replace('index.html');
    return new Promise(() => {});
  }

  let profile = null;

  try {
    profile = await getReaderProfile(session.user.id);
  } catch (error) {
    console.error('Unable to load profile:', error);
  }

  const isAuthor = profile?.role === 'author';

  if (requireAuthor && !isAuthor) {
    window.location.replace('home.html');
    return new Promise(() => {});
  }

  if (editor) {
    mountEditorMenu({ active, isAuthor });
  } else {
    mountMainBar({ active, isAuthor, onAuthorToggle, profile, user: session.user });
  }

  observeAuthState((event) => {
    if (event === 'SIGNED_OUT' && !signingOut) {
      window.location.replace('index.html');
    }
  });

  return {
    user: session.user,
    profile,
    role: isAuthor ? 'author' : 'reader',
    isAuthor
  };
}
