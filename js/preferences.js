// HOLLOW NIGHT CAMP — persistent display preferences.
export const THEME_KEY = 'hnc_theme';
export const LANGUAGE_KEY = 'hnc_language';

const translations = {
  en: {
    'Campfire':'Campfire','Novels':'Novels','Theories':'Theories','Arcade':'Arcade','Settings':'Settings',
    'Profile':'Profile','History & Bookmarks':'History & Bookmarks','Clock & timezone':'Clock & timezone',
    'Author Studio':'Author Studio','Notification':'Notification','My Profile':'My Profile',
    'Sign out of camp':'Sign out of camp','Open menu':'Open menu',
    'Your Profile':'Your Profile','Update your camp identity. Your profile belongs to your account.':'Update your camp identity. Your profile belongs to your account.',
    'Display':'Display','Theme':'Theme','Language':'Language','System':'System','Light':'Light','Dark':'Dark',
    'English':'English','Indonesian':'Indonesian','Choose how Hollow Night Camp looks and which language it uses.':'Choose how Hollow Night Camp looks and which language it uses.',
    'CAMP ACCOUNT':'CAMP ACCOUNT','CAMP NICKNAME':'CAMP NICKNAME','YOUR BIO':'YOUR BIO','ACCOUNT ROLE':'ACCOUNT ROLE',
    'Upload profile picture':'Upload profile picture','Remove picture':'Remove picture','SAVE PROFILE':'SAVE PROFILE',
    'Welcome to the Camp,':'Welcome to the Camp,','Pull up a chair. There\'s always another story waiting to be told around the fire.':'Pull up a chair. There\'s always another story waiting to be told around the fire.'
  },
  id: {
    'Campfire':'Api Unggun','Novels':'Novel','Theories':'Teori','Arcade':'Arkade','Settings':'Pengaturan',
    'Profile':'Profil','History & Bookmarks':'Riwayat & Penanda','Clock & timezone':'Jam & Zona Waktu',
    'Author Studio':'Studio Penulis','Notification':'Notifikasi','My Profile':'Profil Saya',
    'Sign out of camp':'Keluar dari camp','Open menu':'Buka menu',
    'Your Profile':'Profil Kamu','Update your camp identity. Your profile belongs to your account.':'Perbarui identitas camp kamu. Profil ini milik akunmu.',
    'Display':'Tampilan','Theme':'Tema','Language':'Bahasa','System':'Sistem','Light':'Terang','Dark':'Gelap',
    'English':'Inggris','Indonesian':'Indonesia','Choose how Hollow Night Camp looks and which language it uses.':'Pilih tampilan Hollow Night Camp dan bahasa yang digunakan.',
    'CAMP ACCOUNT':'AKUN CAMP','CAMP NICKNAME':'NAMA PANGGILAN CAMP','YOUR BIO':'BIO KAMU','ACCOUNT ROLE':'PERAN AKUN',
    'Upload profile picture':'Unggah foto profil','Remove picture':'Hapus foto','SAVE PROFILE':'SIMPAN PROFIL',
    'Welcome to the Camp,':'Selamat datang di Camp,','Pull up a chair. There\'s always another story waiting to be told around the fire.':'Duduklah. Selalu ada cerita lain untuk dibagikan di sekitar api unggun.'
  }
};

export function getTheme() {
  try { return ['system','light','dark'].includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : 'system'; }
  catch { return 'system'; }
}
export function getLanguage() {
  try { return localStorage.getItem(LANGUAGE_KEY) === 'id' ? 'id' : 'en'; }
  catch { return 'en'; }
}
export function t(value) { return translations[getLanguage()]?.[value] || value; }

export function applyTheme(theme = getTheme()) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const resolved = theme === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  root.dataset.themeResolved = resolved;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = resolved === 'light' ? '#eee7d5' : '#17251d';
}
export function applyLanguage(language = getLanguage()) {
  document.documentElement.lang = language === 'id' ? 'id' : 'en';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const original = node.nodeValue.trim();
    if (!original) continue;
    const translated = translations[language]?.[original];
    if (translated) node.nodeValue = node.nodeValue.replace(original, translated);
  }
  document.querySelectorAll('[aria-label],[title],[placeholder]').forEach((el) => {
    for (const attr of ['aria-label','title','placeholder']) {
      const value = el.getAttribute(attr);
      if (value && translations[language]?.[value]) el.setAttribute(attr, translations[language][value]);
    }
  });
}
export function initPreferences() {
  applyTheme();
  applyLanguage();
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
  // Main navigation and menus are mounted after auth resolves; translate them too.
  const observer = new MutationObserver(() => {
    applyLanguage();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
