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
  { id: 'campfire', href: 'home.html',     icon: '🔥', label: 'Campfire' },
  { id: 'novels',   href: 'novels.html',   icon: '📚', label: 'Novels' },
  { id: 'theories', href: 'theories.html', icon: '🔎', label: 'Theories' },
  { id: 'arcade',   href: 'arcade.html',   icon: '🎲', label: 'Arcade' },
  { id: 'settings', href: 'settings.html', icon: '⚙️', label: 'Settings' }
];

function navLinks(active) {
  return NAV.map((page) => `
    <a class="camp-nav-item${page.id === active ? ' active' : ''}" href="${page.href}"${page.id === active ? ' aria-current="page"' : ''}>
      <span>${page.icon}</span><span>${page.label}</span>
    </a>`).join('');
}

function authorEntry(isAuthor, hasToggleHandler) {
  if (!isAuthor) return '';

  if (hasToggleHandler) {
    return `
      <button id="authorStudioToggle" class="camp-nav-item author-toggle" type="button"
              aria-expanded="false" aria-controls="homeAuthorStudio">
        <span>✍️</span><span class="toggle-label">Author Studio</span>
      </button>`;
  }

  return `
    <a class="camp-nav-item author-toggle" href="home.html?studio=1">
      <span>✍️</span><span class="toggle-label">Author Studio</span>
    </a>`;
}

// Main Bar: fixed, centered at the top
function mountMainBar({ active, isAuthor, onAuthorToggle }) {
  document.body.insertAdjacentHTML('afterbegin', `
    <nav class="main-bar" id="mainBar" aria-label="Main navigation">
      <a class="bar-brand" href="home.html" aria-label="Hollow Night Camp home">
        <span class="bar-brand-mark">H</span><span>Hollow Night</span>
      </a>
      ${navLinks(active)}
      ${authorEntry(isAuthor, Boolean(onAuthorToggle))}
      <button class="bar-icon-button" id="notificationButton" type="button"
              aria-label="Notifications" title="Notifications">
        🔔<span class="notification-dot"></span>
      </button>
    </nav>`);

  const toggle = document.getElementById('authorStudioToggle');

  if (toggle && onAuthorToggle) {
    toggle.addEventListener('click', () => onAuthorToggle(toggle));
  }
}

// Editor: the Main Bar becomes a round ⋮ button (top-left)
function mountEditorMenu({ active, isAuthor }) {
  document.body.classList.add('editor-mode');

  document.body.insertAdjacentHTML('afterbegin', `
    <button id="editorMenuButton" class="editor-menu-button" type="button"
            aria-label="Open menu" aria-expanded="false" aria-controls="editorMenu">⋮</button>
    <div id="editorMenu" class="editor-menu" hidden>
      ${navLinks(active)}
      ${isAuthor ? '<a class="camp-nav-item" href="home.html?studio=1"><span>✍️</span><span>Author Studio</span></a>' : ''}
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
    mountMainBar({ active, isAuthor, onAuthorToggle });
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
