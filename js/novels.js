// HOLLOW NIGHT CAMP — novels.html (library) and novel.html (detail)

import { initPage } from './shared.js?v=3';

const page = document.body.dataset.page;
const ctx = await initPage({ active: 'novels' });

if (page === 'novels') {
  const authorHint = document.getElementById('authorHint');

  if (authorHint) {
    authorHint.hidden = !ctx.isAuthor;
  }

  // TODO: load novels from Supabase and render into #novelGrid
}

if (page === 'novel') {
  const id = new URLSearchParams(window.location.search).get('id');
  const meta = document.getElementById('novelMeta');

  if (meta && id) {
    meta.textContent = 'Novel ID: ' + id;
  }

  // TODO: load novel + chapters from Supabase
}
