// HOLLOW NIGHT CAMP — shared by every page after login:
// session guard, role check, Main Bar / ⋮ menu rendering, sign out.

import { initPreferences, t } from './preferences.js?v=3';

import {
  getCurrentSession,
  getReaderProfile,
  logoutReader,
  observeAuthState
} from './auth.js';

initPreferences();

export const ENTERED_KEY = 'hnc_entered';

// Keep the branded loader (js/loader.js) up while a page's own data loads; no-op if the loader is absent.
export function trackLoad(promise, label) {
  return window.HNLoader ? window.HNLoader.track(promise, label) : Promise.resolve(promise);
}

const NAV = [
  { id: 'campfire', href: 'home.html',     icon: 'campfire', label: t('Campfire') },
  { id: 'novels',   href: 'novels.html',   icon: 'novels', label: t('Novels') },
  { id: 'theories', href: 'theories.html', icon: 'theories', label: t('Theories') },
  { id: 'arcade',   href: 'arcade.html',   icon: 'arcade', label: t('Arcade') },
  { id: 'settings', href: 'settings-profile.html', icon: 'settings', label: t('Settings') }
];

// Novels sub-navigation: Novels + World Building (the arrow unfolds Characters, Maps, Locations in the same row)
const WORLD_SUBNAV = [
  { id: 'characters', href: 'characters.html', label: 'Characters' },
  { id: 'maps',      href: 'maps.html',      label: 'Maps' },
  { id: 'locations', href: 'locations.html', label: 'Locations' }
];

// Fills <nav id="subNav" data-active="..."> if the page has one.
function mountSubNav() {
  const nav = document.getElementById('subNav');
  if (!nav) return;
  const active = nav.dataset.active;
  const inWorld = active === 'world' || WORLD_SUBNAV.some((tab) => tab.id === active);
  const current = (id) => (id === active ? ' aria-current="page"' : '');
  nav.innerHTML = `
    <a class="sub-nav-item${active === 'novels' ? ' active' : ''}" href="novels.html"${current('novels')}>Novels</a>
    <span class="sub-nav-item sub-nav-world${active === 'world' ? ' active' : ''}${inWorld ? ' open' : ''}" id="subNavWorld">
      <a href="world-building.html"${current('world')}>World Building</a>
      <button class="sub-nav-toggle" id="subNavToggle" type="button" aria-expanded="${inWorld}" aria-controls="subNavChildren" aria-label="Show Characters, Maps and Locations" title="Characters, Maps, Locations"><span class="icon icon-back" aria-hidden="true"></span></button>
    </span>
    <span class="sub-nav-children" id="subNavChildren">
      ${WORLD_SUBNAV.map((tab) => `<a class="sub-nav-item${tab.id === active ? ' active' : ''}" href="${tab.href}"${current(tab.id)}>${tab.label}</a>`).join('')}
    </span>`;
  const world = document.getElementById('subNavWorld');
  const toggle = document.getElementById('subNavToggle');
  toggle.addEventListener('click', () => {
    const open = !world.classList.contains('open');
    world.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
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
        <button class="bar-icon-button bar-util-link settings-trigger${active === 'settings' ? ' active' : ''}" id="settingsMenuButton" type="button" aria-label="Settings" title="Settings" aria-haspopup="true" aria-expanded="false" aria-controls="settingsMenu">
          ${icon('settings')}<span class="bar-util-label">Settings</span>
        </button>
        <button class="bar-icon-button" id="notificationButton" type="button" aria-label="Notifications" title="Notifications">
          ${icon('notification')}<span class="bar-util-label">Notification</span><span class="notification-dot" style="display:none"></span>
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
        <a href="settings-profile.html">${icon('profile')}<span>My Profile</span></a>
        <button type="button" id="barSignOutButton">${icon('sign-out')}<span>Sign out of camp</span></button>
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

  mountSettingsMenu();
  import('./notifications.js?v=1').then((module) => module.mountNotifications({ userId: user?.id })).catch((error) => console.warn('Notifications unavailable:', error));

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

  // Account button opens the Camp Profile card (js/profile-card.js); the old dropdown stays hidden as a fallback.
  profileButton.addEventListener('click', async () => {
    // Reading Streak (js/streak.js): null when unavailable, so the card just hides the streak row and Night Owl
    const streak = await import('./streak.js?v=2')
      .then((module) => Promise.race([module.getReadingStreak(), new Promise((resolve) => setTimeout(() => resolve(null), 1500))]))
      .catch(() => null);
    import('./profile-card.js?v=4')
      .then((module) => module.openProfileCard({ profile, user, isAuthor, streak, opener: profileButton, onSignOut: () => signOut() }))
      .catch((error) => {
        console.warn('Camp Profile card unavailable, using the menu:', error);
        const open = profileMenu.hidden;
        profileMenu.hidden = !open;
        profileButton.setAttribute('aria-expanded', String(open));
      });
  });
  document.addEventListener('click', (event) => {
    if (!profileMenu.hidden && !profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
      profileMenu.hidden = true;
      profileButton.setAttribute('aria-expanded', 'false');
    }
  });
  document.getElementById('barSignOutButton').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const label = button.querySelector('span:last-child');
    button.disabled = true;
    label.textContent = 'Signing out...';
    try { await signOut(); } catch (error) { button.disabled = false; label.textContent = 'Sign out of camp'; }
  });
}

// Settings gear: opens a dropdown in place (no navigation until an item is chosen).
const SETTINGS_MENU = [
  { href: 'settings-profile.html', label: t('Profile'), icon: 'profile' },
  { href: 'settings-display.html', label: t('Display'), icon: 'display' },
  { href: 'settings-preferences.html', label: t('Preferences'), icon: 'notification' },
  { href: 'settings-history.html', label: t('History & Bookmarks'), icon: 'bookmark' },
  { href: 'settings-clock.html',   label: t('Clock & timezone'), icon: 'clock' },
  { href: 'settings-community.html', label: t('Community'), icon: 'campfire' },
  { href: 'settings-information.html', label: t('Information'), icon: 'chapters' },
  { href: 'settings-support.html', label: t('Support'), icon: 'theories' }
];

function mountSettingsMenu() {
  const button = document.getElementById('settingsMenuButton');
  if (!button || document.getElementById('settingsMenu')) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../css/settings-menu.css?v=5', import.meta.url).href;
  document.head.append(css);

  // lives on <body>: the Main Bar's blur / scroll container would clip or re-anchor a fixed child
  document.body.insertAdjacentHTML('beforeend', `
    <nav class="settings-menu" id="settingsMenu" aria-label="Settings sections">
      <p class="settings-menu-title">Settings</p>
      ${SETTINGS_MENU.map((item) => `<a href="${item.href}">${icon(item.icon)}<span>${item.label}</span></a>`).join('')}
    </nav>`);
  const menu = document.getElementById('settingsMenu');

  // stylesheet loads async: keep the menu out of layout until it is ready, else its unstyled links flash (blue text, bottom-left)
  menu.style.display = 'none';
  const reveal = () => { menu.style.display = ''; };
  if (css.sheet) reveal();
  else {
    css.addEventListener('load', reveal, { once: true });
    css.addEventListener('error', reveal, { once: true });
  }

  const place = () => {
    const rect = button.getBoundingClientRect();
    const width = menu.offsetWidth || 236;
    if (document.body.classList.contains('bar-sidebar')) {
      menu.style.left = Math.max(8, Math.min(rect.right + 10, window.innerWidth - width - 8)) + 'px';
      menu.style.top = Math.max(8, Math.min(rect.top, window.innerHeight - menu.offsetHeight - 8)) + 'px';
    } else {
      menu.style.left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)) + 'px';
      menu.style.top = (rect.bottom + 12) + 'px';
    }
  };
  const setOpen = (open, returnFocus = false) => {
    if (open) place();
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    if (!open && returnFocus) button.focus();
  };

  button.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (event) => {
    if (menu.classList.contains('open') && !menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('open')) setOpen(false, true);
  });
  window.addEventListener('resize', () => setOpen(false));
  // Main Bar switched between top / sidebar / compact: close so it never points at a moved button
  new MutationObserver(() => setOpen(false)).observe(document.body, { attributes: true, attributeFilter: ['class'] });
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

  // Amber balance row in the account menu; never allowed to break the page
  if (!editor) import('./wallet.js?v=3').then((module) => module.mountWalletMenu()).catch((error) => console.warn('Amber wallet unavailable:', error));

  // footer on every camp page except the editor and the reader
  if (!editor && document.body.dataset.page !== 'read') {
    import('./footer.js?v=1').then((module) => module.mountFooter()).catch((error) => console.warn('Footer unavailable:', error));
  }

  // top-right status widget (flip clock + online readers); never allowed to break the page
  import('./status-widget.js?v=3').then((module) => module.mountStatusWidget()).catch((error) => console.warn('Status widget unavailable:', error));

  // Amber Coin widget (under the clock/online widget) + Daily Login board, on every camp page except the editor
  if (!editor) import('./daily-login.js?v=7').catch((error) => console.warn('Amber Coin widget unavailable:', error));

  observeAuthState((event) => {
    if (event === 'SIGNED_OUT' && !signingOut) {
      window.location.replace('index.html');
    }
  });

  // shell is built: the loader may leave once any tracked page data has settled
  if (window.HNLoader) window.HNLoader.ready();

  return {
    user: session.user,
    profile,
    role: isAuthor ? 'author' : 'reader',
    isAuthor
  };
}
