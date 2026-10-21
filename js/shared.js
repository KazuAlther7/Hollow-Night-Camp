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

// Novels sub-navigation: the Novels area and its world-building sections (shown under each page's headline)
const NOVELS_SUBNAV = [
  { id: 'novels',    href: 'novels.html',    label: 'Novels' },
  { id: 'characters', href: 'characters.html', label: 'Characters' },
  { id: 'maps',      href: 'maps.html',      label: 'Maps' },
  { id: 'locations', href: 'locations.html', label: 'Locations' }
];

// Fills <nav id="subNav" data-active="..."> if the page has one.
function mountSubNav() {
  const nav = document.getElementById('subNav');
  if (!nav) return;
  const active = nav.dataset.active;
  nav.innerHTML = NOVELS_SUBNAV.map((tab) => `
    <a class="sub-nav-item${tab.id === active ? ' active' : ''}" href="${tab.href}"${tab.id === active ? ' aria-current="page"' : ''}>${tab.label}</a>`).join('');
}

// Icons are single-colour PNGs in assets/icons/, tinted with CSS mask (see mainbar.css)
function icon(name) {
  return `<span class="icon icon-${name}" aria-hidden="true"></span>`;
}

function navLinks(active, items = NAV) {
  return items.map((page) => `
    <a class="camp-nav-item${page.id === active ? ' active' : ''}" href="${page.href}"${page.id === active ? ' aria-current="page"' : ''}>
      ${icon(page.icon)}<span>${page.label}</span>
    </a>`).join('');
}

// Author Studio is a persistent mode: it stays on across pages until the Author turns it off.
const AUTHOR_MODE_KEY = 'hnc_author_mode';

export function getAuthorMode() {
  try { return localStorage.getItem(AUTHOR_MODE_KEY) === '1'; } catch (e) { return false; }
}

export function setAuthorMode(on) {
  try { localStorage.setItem(AUTHOR_MODE_KEY, on ? '1' : '0'); } catch (e) {}
}

function authorEntry(isAuthor) {
  if (!isAuthor) return '';

  return `
    <button id="authorStudioToggle" class="camp-nav-item author-toggle" type="button"
            aria-pressed="false" aria-controls="homeAuthorStudio" title="Open Author Studio">
      ${icon('author-studio')}<span class="toggle-label">Author Studio</span>
    </button>`;
}

// Main Bar: glass navigation with horizontal/sidebar and compact modes.
function mountMainBar({ active, isAuthor, onAuthorToggle, profile, user }) {
  document.body.insertAdjacentHTML('afterbegin', `
    <nav class="main-bar" id="mainBar" aria-label="Main navigation">
      <button class="bar-arrow-btn bar-to-side" id="barToSideButton" type="button" aria-label="Move navigation to sidebar" title="Move navigation to sidebar">${icon('back')}</button>
      <div class="bar-side-tools">
        <button class="bar-arrow-btn bar-shrink" id="barShrinkButton" type="button" aria-label="Collapse sidebar to menu" title="Collapse sidebar to menu">${icon('back')}</button>
        <button class="bar-arrow-btn bar-to-top" id="barToTopButton" type="button" aria-label="Move navigation back to main bar" title="Move navigation back to main bar">${icon('back')}</button>
      </div>
      <button class="bar-arrow-btn bar-dots" id="barDotsButton" type="button" aria-label="Open sidebar" aria-expanded="false" title="Open sidebar">${icon('3-dots')}</button>
      <a class="bar-brand" href="home.html" aria-label="Hollow Night Camp home">
        <img class="bar-logo" src="assets/image/hollow-night-logo.png" alt="Hollow Night">
      </a>
      <div class="bar-scroll" id="barScroll">
      <div class="bar-primary-links" id="barPrimaryLinks">${navLinks(active, NAV.filter((page) => page.id !== 'settings'))}</div>
      <div class="bar-utility-links">
        ${authorEntry(isAuthor)}
        <a class="bar-icon-button bar-util-link${active === 'settings' ? ' active' : ''}" href="settings.html" aria-label="Settings" title="Settings"${active === 'settings' ? ' aria-current="page"' : ''}>
          ${icon('settings')}<span class="bar-util-label">Settings</span>
        </a>
        <button class="bar-icon-button" id="notificationButton" type="button" aria-label="Notifications" title="Notifications">
          ${icon('notification')}<span class="bar-util-label">Notification</span><span class="notification-dot"></span>
        </button>
        <button class="bar-icon-button profile-menu-button" id="profileMenuButton" type="button" aria-label="Account menu" aria-expanded="false" title="Profile and sign out">
          ${profile?.avatar_url
            ? `<img class="bar-avatar" src="${escapeAttribute(profile.avatar_url)}" alt="">`
            : `<span class="bar-avatar-fallback">${escapeHtml((profile?.nickname || user?.email || 'C').trim().charAt(0).toUpperCase())}</span>`}
        </button>
      </div>
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
  const toSideButton = document.getElementById('barToSideButton');
  const toTopButton = document.getElementById('barToTopButton');
  const shrinkButton = document.getElementById('barShrinkButton');
  const dotsButton = document.getElementById('barDotsButton');
  const profileButton = document.getElementById('profileMenuButton');
  const profileMenu = document.getElementById('barProfileMenu');

  // mobile: menu items scroll inside .bar-scroll, bar itself stays fixed; bring the active item into view
  const activeItem = bar.querySelector('.bar-scroll .active');
  if (activeItem) {
    requestAnimationFrame(() => {
      const scroller = document.getElementById('barScroll');
      if (scroller && scroller.scrollWidth > scroller.clientWidth) {
        scroller.scrollLeft = activeItem.offsetLeft - (scroller.clientWidth - activeItem.offsetWidth) / 2;
      }
    });
  }

  let sidebar = false;
  let compact = false;
  try {
    sidebar = localStorage.getItem('hnc_bar_sidebar') === '1';
    compact = localStorage.getItem('hnc_bar_compact') === '1';
  } catch (e) {}

  const saveBarState = () => {
    try {
      localStorage.setItem('hnc_bar_sidebar', sidebar ? '1' : '0');
      localStorage.setItem('hnc_bar_compact', compact ? '1' : '0');
    } catch (e) {}
  };

  // compact (3-dots) only exists in sidebar mode
  const applyBarState = () => {
    document.body.classList.toggle('bar-sidebar', sidebar);
    bar.classList.toggle('bar-compact', sidebar && compact);
    dotsButton.setAttribute('aria-expanded', String(!(sidebar && compact)));
    if (!(sidebar && compact)) profileMenu.hidden = true;
  };
  applyBarState();

  // Morph: View Transitions animate the bar between its two shapes (top pill, sidebar, 3-dots circle)
  const morph = (change) => {
    const update = () => { change(); saveBarState(); applyBarState(); };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !reduced) {
      document.startViewTransition(update);
    } else {
      update();
    }
  };

  toSideButton.addEventListener('click', () => morph(() => { sidebar = true; compact = false; }));
  toTopButton.addEventListener('click', () => morph(() => { sidebar = false; compact = false; }));
  shrinkButton.addEventListener('click', () => morph(() => { compact = true; }));
  dotsButton.addEventListener('click', () => morph(() => { compact = false; }));

  // intro animation only on first paint (class removed afterwards so mode switches do not replay it)
  const introClass = sidebar ? 'bar-intro-side' : 'bar-intro';
  bar.classList.add(introClass);
  bar.addEventListener('animationend', (event) => {
    if (event.target === bar) bar.classList.remove(introClass);
  }, { once: true });

  const authorToggle = document.getElementById('authorStudioToggle');
  if (authorToggle) {
    const paint = (on) => {
      authorToggle.setAttribute('aria-pressed', String(on));
      authorToggle.title = on ? 'Exit Author Studio' : 'Open Author Studio';
    };
    paint(getAuthorMode());

    authorToggle.addEventListener('click', () => {
      const on = !getAuthorMode();
      setAuthorMode(on);
      paint(on);

      if (onAuthorToggle) {
        onAuthorToggle(on);          // home page: show / hide the studio panel
      } else if (on) {
        window.location.href = 'home.html';   // other pages: the studio panel lives on Campfire
      }
    });
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

  mountSubNav();

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
