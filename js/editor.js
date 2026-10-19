// HOLLOW NIGHT CAMP — editor.html (Author only)

import { initPage } from './shared.js?v=4';

await initPage({ active: 'novels', editor: true, requireAuthor: true });

const chapterBody = document.getElementById('chapterBody');
const wordCount = document.getElementById('wordCount');

function updateWordCount() {
  const words = chapterBody.value.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = words + (words === 1 ? ' word' : ' words');
}

chapterBody.addEventListener('input', updateWordCount);
updateWordCount();

// TODO: load / save chapter to Supabase
