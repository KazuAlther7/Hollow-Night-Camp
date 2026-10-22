// HOLLOW NIGHT CAMP — site footer. Mounted by initPage() on every camp page except the editor and the reader.
const LINKS = [
  { href: 'settings-community.html', label: 'Community' },
  { href: 'settings-information.html#about', label: 'About' },
  { href: 'settings-information.html#credits', label: 'Credits' },
  { href: 'settings-information.html#privacy', label: 'Privacy' },
  { href: 'settings-information.html#terms', label: 'Terms & Guidelines' },
  { href: 'settings-support.html#help', label: 'Help Center' },
  { href: 'settings-support.html#contact', label: 'Contact Support' }
];

export function mountFooter() {
  if (document.getElementById('campFooter')) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../css/footer.css?v=1', import.meta.url).href;
  document.head.append(css);

  const footer = document.createElement('footer');
  footer.className = 'camp-footer';
  footer.id = 'campFooter';
  footer.innerHTML = `
    <p class="camp-footer-tagline">When the world falls silent, the stories begin.</p>
    <p class="camp-footer-desc">Hollow Night Camp is a storytelling experience where readers gather, mysteries unfold, and every chapter brings something new to discover.</p>
    <nav aria-label="Footer">
      <ul>${LINKS.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}</ul>
    </nav>
    <p class="camp-footer-copy">© ${new Date().getFullYear()} Hollow Night Camp. All rights reserved.</p>
    <p class="camp-footer-closing">The night is young. Your story awaits.</p>`;
  document.body.append(footer);
}
