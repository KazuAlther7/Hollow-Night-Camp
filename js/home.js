// HOLLOW NIGHT CAMP — home.html: Welcome transition + Campfire home

import { supabase } from '../config/supabase.js';
import { readingTime } from './dom.js?v=2';
import { initPage, ENTERED_KEY, getAuthorMode, setAuthorMode } from './shared.js?v=18';
import { createParallax } from './parallax.js';

const welcomeScreen = document.getElementById('welcomeScreen');
const enterCampButton = document.getElementById('enterCampButton');
const campApp = document.getElementById('campApp');

const homeAuthorStudio = document.getElementById('homeAuthorStudio');
const authorHomeStatus = document.getElementById('authorHomeStatus');
const homeNickname = document.getElementById('homeNickname');

const welcomeCanvas = document.getElementById('welcomeCanvas');
const welcomeSparks = document.getElementById('welcomeSparks');

// Welcome background: image + depth map -> parallax
// "?v=4" forces browsers to fetch fresh copies (bump it when you replace the images)
const ASSET_V = '?v=4';

// open home.html?debug=1 to see parallax status on screen
let debugBox = null;

if (new URLSearchParams(window.location.search).get('debug')) {
  debugBox = document.createElement('pre');
  debugBox.className = 'w-debug';
  welcomeScreen.appendChild(debugBox);
}

const parallax = createParallax(welcomeCanvas, {
  image: 'assets/image/welcome-bg.jpg' + ASSET_V,
  depth: 'assets/image/welcome-depth.png' + ASSET_V,
  onStatus: (text) => {
    if (debugBox) debugBox.textContent += text + '\n';
  }
});

// fireflies on top of the scene
for (let i = 0; i < 18; i++) {
  const spark = document.createElement('span');
  spark.className = 'w-spark';
  spark.style.left = (8 + Math.random() * 84) + '%';
  spark.style.top = (40 + Math.random() * 50) + '%';
  spark.style.setProperty('--dur', (7 + Math.random() * 8).toFixed(1) + 's');
  spark.style.setProperty('--delay', (-Math.random() * 12).toFixed(1) + 's');
  spark.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
  spark.style.setProperty('--dy', (-20 - Math.random() * 50).toFixed(0) + 'px');
  welcomeSparks.appendChild(spark);
}

let enterTimer = null;

// STAGES: welcome -> home
function setStage(next) {
  document.body.classList.remove('stage-welcome', 'stage-home');
  document.body.classList.add('stage-' + next);

  welcomeScreen.hidden = next !== 'welcome';
  campApp.hidden = next !== 'home';

  clearTimeout(enterTimer);
  enterCampButton.classList.remove('show');

  // only run the WebGL loop while the Welcome screen is visible
  if (next === 'welcome') {
    parallax.start();
  } else {
    parallax.stop();
  }

  if (next === 'welcome') {
    // the button appears 1 second after the transition screen opens
    enterTimer = setTimeout(() => {
      enterCampButton.classList.add('show');
      enterCampButton.focus({ preventScroll: true });
    }, 1000);
  }

  window.scrollTo(0, 0);
}

function toggleStudio(open, { scroll = false } = {}) {
  homeAuthorStudio.hidden = !open;

  if (open && scroll) {
    homeAuthorStudio.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const ctx = await initPage({
  active: 'campfire',
  onAuthorToggle: (open) => toggleStudio(open, { scroll: true })
});

const params = new URLSearchParams(window.location.search);
const wantsStudio = params.get('studio') === '1' && ctx.isAuthor;

let entered = false;

try {
  entered = sessionStorage.getItem(ENTERED_KEY) === '1';
} catch (error) {}

if (wantsStudio) entered = true;

setStage(entered ? 'home' : 'welcome');

enterCampButton.addEventListener('click', () => {
  try {
    sessionStorage.setItem(ENTERED_KEY, '1');
  } catch (error) {}

  setStage('home');
});

homeNickname.textContent = ctx.profile?.nickname || 'camper';

if (wantsStudio) setAuthorMode(true);

// the studio panel follows the persistent Author Studio mode (also after a refresh)
if (ctx.isAuthor && getAuthorMode()) {
  toggleStudio(true, { scroll: wantsStudio });
  document.getElementById('authorStudioToggle')?.setAttribute('aria-pressed', 'true');
}

// AUTHOR STUDIO ACTIONS
document.querySelectorAll('[data-author-action]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!ctx.isAuthor) return;

    const action = button.dataset.authorAction;

    const destinations = {
      'new-novel': 'novels.html?new=1',
      'manage-novels': 'novels.html',
      'manage-chapters': 'novels.html',
      'world-building': 'world-building.html'
    };

    if (destinations[action]) {
      window.location.href = destinations[action];
      return;
    }

    const messages = {};

    authorHomeStatus.textContent = messages[action] || 'This feature is coming soon.';
    authorHomeStatus.hidden = false;
  });
});

// THE LATEST CHAPTER
// Matches supabase/001_novels_chapters.sql (chapters.status / published_at, novels.cover_url).
function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadLatestChapter() {
  // RLS already hides drafts from Readers; the status filter also keeps them off the Author's homepage.
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('id, novel_id, title, chapter_number, volume_id, volumes(name), cover_url, published_at, word_count')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  const chapter = chapters?.[0];
  if (!chapter) return;

  let novel = null;
  if (chapter.novel_id != null) {
    const { data, error: novelError } = await supabase
      .from('novels')
      .select('id, title, cover_url')
      .eq('id', chapter.novel_id)
      .maybeSingle();
    if (!novelError) novel = data;
  }

  const number = chapter.chapter_number ?? null;
  const novelTitle = novel?.title || '';
  // the chapter's own cover wins; without one the novel cover is shown as before
  const coverUrl = chapter.cover_url || novel?.cover_url || null;

  const tagParts = [];
  if (novelTitle) tagParts.push(novelTitle);
  if (number != null) tagParts.push('Chapter ' + number);
  if (chapter.volumes?.name) tagParts.push(chapter.volumes.name);
  document.getElementById('latestChapterTag').textContent = (tagParts.join(' · ') || 'Latest chapter').toUpperCase();

  document.getElementById('latestChapterTitle').textContent = chapter.title || 'Untitled chapter';

  const posted = formatDate(chapter.published_at);
  document.getElementById('latestChapterText').textContent = posted ? 'Posted ' + posted + '.' : 'Fresh from the campfire.';

  // same estimate as the chapter list
  const readEl = document.getElementById('latestChapterRead');
  const read = readingTime(chapter.word_count);
  readEl.textContent = read || '';
  readEl.hidden = !read;

  const link = document.getElementById('latestChapterLink');
  const arrow = document.createElement('span');
  arrow.className = 'icon icon-back icon-flip';
  arrow.setAttribute('aria-hidden', 'true');
  link.replaceChildren('Read the Chapter', arrow);
  link.href = 'read.html?id=' + encodeURIComponent(chapter.id);

  if (coverUrl) {
    const art = document.getElementById('latestChapterArt');
    const img = document.createElement('img');
    img.src = coverUrl;
    img.alt = chapter.cover_url ? 'Cover of ' + chapter.title : (novelTitle ? 'Cover of ' + novelTitle : 'Chapter cover');
    img.className = 'featured-story-cover';
    art.replaceChildren(img);
    art.classList.add('has-cover');
  }
}

loadLatestChapter().catch((error) => {
  // keep the placeholder card when nothing can be loaded
  console.warn('Latest chapter unavailable:', error?.message || error);
});
