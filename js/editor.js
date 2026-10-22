// HOLLOW NIGHT CAMP — editor.html (Author only): write, save draft, publish chapters

import { initPage } from './shared.js?v=16';
import { supabase } from '../config/supabase.js';
import { loadVolumes, createVolume } from './volumes.js?v=1';
import { createVolumeCombobox } from './volume-combobox.js?v=1';

await initPage({ active: 'novels', editor: true, requireAuthor: true });

const params = new URLSearchParams(window.location.search);
let chapterId = params.get('chapter');
let novelId = params.get('novel');

const titleInput = document.getElementById('chapterTitle');
const subtitleInput = document.getElementById('chapterSubtitle');
const numberInput = document.getElementById('chapterNumber');
const chapterBody = document.getElementById('chapterBody');
const wordCount = document.getElementById('wordCount');
const saveState = document.getElementById('saveState');
const saveDraftButton = document.getElementById('saveDraftButton');
const publishButton = document.getElementById('publishButton');
const backLink = document.getElementById('backLink');
const editorNovel = document.getElementById('editorNovel');

const coverPreview = document.getElementById('coverPreview');
const coverFileInput = document.getElementById('coverFile');
const removeCoverButton = document.getElementById('removeCoverButton');

const COVER_BUCKET = 'covers';
const MAX_COVER_BYTES = 2 * 1024 * 1024;
let coverUrl = null;       // saved cover (null = none)
let coverFile = null;      // newly chosen file, uploaded on save
let previewObjectUrl = null;

function renderCover(src) {
  coverPreview.replaceChildren();
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    coverPreview.append(img);
  }
  removeCoverButton.hidden = !src;
}

coverFileInput.addEventListener('change', () => {
  const file = coverFileInput.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setSaveState('Cover must be an image file.', true);
    coverFileInput.value = '';
    return;
  }
  if (file.size > MAX_COVER_BYTES) {
    setSaveState('Cover is too large. Maximum size is 2 MB.', true);
    coverFileInput.value = '';
    return;
  }

  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  coverFile = file;
  renderCover(previewObjectUrl);
  markDirty();
});

removeCoverButton.addEventListener('click', () => {
  coverFile = null;
  coverUrl = null;
  coverFileInput.value = '';
  renderCover(null);
  markDirty();
});

let volumes = [];
const volumeCombo = createVolumeCombobox(document.getElementById('volumeCombo'), {
  getVolumes: () => volumes,
  labelledBy: 'volumeLabel',
  hint: document.getElementById('volumeHint'),
  onChange: () => markDirty()
});

const fields = [titleInput, subtitleInput, numberInput, chapterBody];

let status = 'draft';      // status stored in the database for this chapter
let position = null;       // only set for brand-new chapters
let dirty = false;
let saving = false;

function setSaveState(message, isError = false) {
  saveState.textContent = message;
  saveState.classList.toggle('error', isError);
}

function updateWordCount() {
  const words = chapterBody.value.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = words + (words === 1 ? ' word' : ' words');
}

function renderButtons() {
  if (status === 'published') {
    saveDraftButton.textContent = 'Unpublish';
    publishButton.textContent = 'Save Changes';
  } else {
    saveDraftButton.textContent = 'Save Draft';
    publishButton.textContent = 'Publish';
  }
  saveDraftButton.disabled = saving || !novelId;
  publishButton.disabled = saving || !novelId;
}

function markDirty() {
  dirty = true;
  setSaveState('Unsaved changes.');
}

fields.forEach((field) => field.addEventListener('input', markDirty));
chapterBody.addEventListener('input', updateWordCount);

window.addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

function parseNumber(value) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

// nextStatus = the status the chapter should have after this save
async function save(nextStatus) {
  if (saving || !novelId) return;

  const title = titleInput.value.trim();
  if (!title) {
    setSaveState('Chapter title is required.', true);
    titleInput.focus();
    return;
  }

  saving = true;
  renderButtons();
  setSaveState('Saving…');

  const id = chapterId || crypto.randomUUID();
  let finalCover = coverUrl;

  try {
    if (coverFile) {
      const ext = (coverFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = 'chapters/' + id + '/' + Date.now() + '.' + ext;
      const { error: uploadError } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(path, coverFile, { contentType: coverFile.type, upsert: false });
      if (uploadError) throw uploadError;
      finalCover = supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl;
    }
  } catch (error) {
    setSaveState('Cover upload failed: ' + (error?.message || 'unknown error') + ' Your text is still here.', true);
    saving = false;
    renderButtons();
    return;
  }

  // volume: use the chosen one, or create the typed one (the database keeps one per name per novel)
  let volumeId = null;
  const chosen = volumeCombo.getValue();
  if (chosen.newName) {
    try {
      const volume = await createVolume(novelId, chosen.newName, volumes);
      if (!volumes.some((item) => item.id === volume.id)) volumes.push(volume);
      volumeId = volume.id;
      volumeCombo.setValue(volume.id);
    } catch (error) {
      setSaveState('Could not create the volume: ' + (error?.message || 'unknown error') + ' Your text is still here.', true);
      saving = false;
      renderButtons();
      return;
    }
  } else {
    volumeId = chosen.id;
  }

  const row = {
    cover_url: finalCover,
    title,
    subtitle: subtitleInput.value.trim() || null,
    chapter_number: parseNumber(numberInput.value),
    volume_id: volumeId,
    body: chapterBody.value,
    status: nextStatus
  };

  try {
    if (chapterId) {
      const { error } = await supabase.from('chapters').update(row).eq('id', chapterId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('chapters')
        .insert({ id, ...row, novel_id: novelId, position: position ?? 0 })
        .select('id')
        .single();
      if (error) throw error;

      chapterId = data.id;
      const url = new URL(window.location.href);
      url.searchParams.delete('novel');
      url.searchParams.set('chapter', chapterId);
      window.history.replaceState(null, '', url);
    }

    status = nextStatus;
    coverUrl = finalCover;
    coverFile = null;
    dirty = false;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSaveState((status === 'published' ? 'Published' : 'Saved as draft') + ' at ' + time + '.');
  } catch (error) {
    // the text stays in the fields, nothing is lost
    setSaveState('Save failed: ' + (error?.message || 'unknown error') + ' Your text is still here.', true);
  } finally {
    saving = false;
    renderButtons();
  }
}

saveDraftButton.addEventListener('click', () => save('draft'));
publishButton.addEventListener('click', () => save('published'));

// Ctrl/Cmd + S keeps the current status
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    save(status);
  }
});

let initialVolumeId = null;

async function init() {
  if (chapterId) {
    const { data, error } = await supabase.from('chapters').select('*').eq('id', chapterId).maybeSingle();

    if (error || !data) {
      setSaveState(error ? 'Could not load chapter: ' + error.message : 'Chapter not found.', true);
      novelId = null;
      renderButtons();
      return;
    }

    novelId = data.novel_id;
    status = data.status;
    titleInput.value = data.title || '';
    subtitleInput.value = data.subtitle || '';
    numberInput.value = data.chapter_number ?? '';
    initialVolumeId = data.volume_id || null;
    chapterBody.value = data.body || '';
    coverUrl = data.cover_url || null;
    renderCover(coverUrl);
    setSaveState('Loaded.');
  } else if (novelId) {
    // new chapter: continue the numbering and ordering of this novel
    const { data } = await supabase.from('chapters').select('position, chapter_number').eq('novel_id', novelId);
    const rows = data || [];
    position = rows.reduce((max, r) => Math.max(max, r.position ?? 0), 0) + 1;
    numberInput.value = rows.reduce((max, r) => Math.max(max, r.chapter_number ?? 0), 0) + 1;
    setSaveState('New chapter — not saved yet.');
  } else {
    setSaveState('Open the editor from a novel page, using “+ New Chapter”.', true);
    renderButtons();
    return;
  }

  try {
    volumes = await loadVolumes(novelId);
  } catch (error) {
    setSaveState('Could not load volumes: ' + (error?.message || 'unknown error'), true);
  }
  volumeCombo.setValue(initialVolumeId);

  backLink.href = 'novel.html?id=' + encodeURIComponent(novelId);
  backLink.querySelector('.back-label').textContent = 'Back to novel';

  const { data: novel } = await supabase.from('novels').select('title, is_published').eq('id', novelId).maybeSingle();
  if (novel) {
    editorNovel.textContent = novel.title + (novel.is_published ? '' : ' · novel is still a draft, readers will not see its chapters');
  }

  updateWordCount();
  renderButtons();
}

updateWordCount();
renderButtons();
await init();
dirty = false;
