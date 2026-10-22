// HOLLOW NIGHT CAMP — persistent display preferences.
// Preferences are stored locally so they survive reloads and future visits on this browser.
export const THEME_KEY = 'hnc_theme';
export const LANGUAGE_KEY = 'hnc_language';

const translations = {
  en: {
    'Campfire':'Campfire', 'Novels':'Novels', 'Theories':'Theories', 'Arcade':'Arcade',
    'Settings':'Settings', 'Profile':'Profile', 'History & Bookmarks':'History & Bookmarks',
    'Clock & timezone':'Clock & timezone', 'Author Studio':'Author Studio',
    'Notification':'Notification', 'My Profile':'My Profile', 'Sign out of camp':'Sign out of camp',
    'Open menu':'Open menu', 'Your Profile':'Your Profile',
    'Update your camp identity. Your profile belongs to your account.':'Update your camp identity. Your profile belongs to your account.',
    'Display':'Display', 'Theme':'Theme', 'Language':'Language', 'System':'System',
    'Light':'Light', 'Dark':'Dark', 'English':'English', 'Indonesian':'Indonesian',
    'Choose how Hollow Night Camp looks and which language it uses.':'Choose how Hollow Night Camp looks and which language it uses.',
    'CAMP ACCOUNT':'CAMP ACCOUNT', 'CAMP NICKNAME':'CAMP NICKNAME', 'YOUR BIO':'YOUR BIO',
    'ACCOUNT ROLE':'ACCOUNT ROLE', 'Upload profile picture':'Upload profile picture',
    'Remove picture':'Remove picture', 'SAVE PROFILE':'SAVE PROFILE',
    'Tell the camp a little about yourself...':'Tell the camp a little about yourself...',
    'Welcome to the Camp,':'Welcome to the Camp,',
    'DISPLAY':'DISPLAY', 'How the camp looks':'How the camp looks', 'Match your device':'Match your device',
    'Warm paper tones':'Warm paper tones', 'The classic night camp':'The classic night camp',
    'Language of menus and labels':'Language of menus and labels',
    'Saved on this device. Changes apply right away.':'Saved on this device. Changes apply right away.',
    'Theme saved.':'Theme saved.', 'Language saved.':'Language saved.'
  },
  id: {
    'Campfire':'Api Unggun', 'Novels':'Novel', 'Theories':'Teori', 'Arcade':'Arkade',
    'Settings':'Pengaturan', 'Profile':'Profil', 'History & Bookmarks':'Riwayat & Penanda',
    'Clock & timezone':'Jam & Zona Waktu', 'Author Studio':'Studio Penulis',
    'Notification':'Notifikasi', 'My Profile':'Profil Saya', 'Sign out of camp':'Keluar dari camp',
    'Open menu':'Buka menu', 'Your Profile':'Profil Kamu',
    'Update your camp identity. Your profile belongs to your account.':'Perbarui identitas camp kamu. Profil ini milik akunmu.',
    'Display':'Tampilan', 'Theme':'Tema', 'Language':'Bahasa', 'System':'Sistem',
    'Light':'Terang', 'Dark':'Gelap', 'English':'Inggris', 'Indonesian':'Indonesia',
    'Choose how Hollow Night Camp looks and which language it uses.':'Pilih tampilan Hollow Night Camp dan bahasa yang digunakan.',
    'CAMP ACCOUNT':'AKUN CAMP', 'CAMP NICKNAME':'NAMA PANGGILAN CAMP', 'YOUR BIO':'BIO KAMU',
    'ACCOUNT ROLE':'PERAN AKUN', 'Upload profile picture':'Unggah foto profil',
    'Remove picture':'Hapus foto', 'SAVE PROFILE':'SIMPAN PROFIL',
    'Tell the camp a little about yourself...':'Ceritakan sedikit tentang dirimu kepada camp...',
    'Welcome to the Camp,':'Selamat datang di Camp,',
    'DISPLAY':'TAMPILAN', 'How the camp looks':'Tampilan camp', 'Match your device':'Ikuti pengaturan perangkat',
    'Warm paper tones':'Nuansa kertas hangat', 'The classic night camp':'Camp malam yang klasik',
    'Language of menus and labels':'Bahasa untuk menu dan label',
    'Saved on this device. Changes apply right away.':'Tersimpan di perangkat ini. Perubahan langsung berlaku.',
    'Theme saved.':'Tema disimpan.', 'Language saved.':'Bahasa disimpan.'
  }
};

function safeGet(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
export function getTheme() {
  const value = safeGet(THEME_KEY, 'system');
  return ['system', 'light', 'dark'].includes(value) ? value : 'system';
}
export function getLanguage() {
  return safeGet(LANGUAGE_KEY, 'en') === 'id' ? 'id' : 'en';
}
export function t(value) {
  const language = getLanguage();
  if (translations[language][value]) return translations[language][value];
  const other = language === 'id' ? 'en' : 'id';
  const key = Object.keys(translations[other]).find((candidate) => translations[other][candidate] === value);
  return key ? (translations[language][key] || key) : value;
}
export function applyTheme(theme = getTheme()) {
  const root = document.documentElement;
  const resolved = theme === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  root.dataset.theme = theme;
  root.dataset.themeResolved = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = resolved === 'light' ? '#f2ecdc' : '#17251d';
}
export function applyLanguage(language = getLanguage()) {
  const dict = translations[language] || translations.en;
  const other = language === 'id' ? 'en' : 'id';
  const reverse = Object.fromEntries(Object.entries(translations[other]).map(([key, value]) => [value, key]));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const original = node.nodeValue;
    const trimmed = original.trim();
    if (!trimmed) continue;
    if (node.parentElement && node.parentElement.closest('[data-no-translate]')) continue;
    const key = Object.prototype.hasOwnProperty.call(dict, trimmed) ? trimmed : reverse[trimmed];
    const translated = key ? (dict[key] || key) : null;
    if (translated && translated !== trimmed) {
      const start = original.indexOf(trimmed);
      node.nodeValue = original.slice(0, start) + translated + original.slice(start + trimmed.length);
    }
  }
  document.querySelectorAll('[aria-label],[title],[placeholder]').forEach((element) => {
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const key = Object.prototype.hasOwnProperty.call(dict, value) ? value : reverse[value];
      if (key && dict[key]) element.setAttribute(attribute, dict[key]);
    }
  });
}
export function initPreferences() {
  applyTheme();
  applyLanguage();
  const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
  media?.addEventListener?.('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
  // Auth/navigation UI is injected after initial page load; translate it as it appears.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyLanguage();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
