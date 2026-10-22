// HOLLOW NIGHT CAMP — novels.html (library) and novel.html (detail + chapter management)

import { initPage, trackLoad } from './shared.js?v=16';
import { supabase } from '../config/supabase.js';
import { el, formatDate, readingTime, statusChip } from './dom.js?v=2';
import { openImportDialog } from './import.js?v=1';
import { mountNovelRating, fetchNovelStatsMap, compactRating } from './rating.js?v=1';
import { loadVolumes, sortChapters } from './volumes.js?v=1';
import { mountContinueReading } from './reading.js?v=1';

const page = document.body.dataset.page;
const ctx = await initPage({ active: 'novels' });

const COVER_BUCKET = 'covers';
const MAX_COVER_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------
// NOVEL DIALOG (create + edit). Only Authors ever get to open it;
// the database enforces this again through RLS.
// ---------------------------------------------------------------
function openNovelDialog({ novel = null, onSaved }) {
  const isEdit = Boolean(novel);
  const id = novel?.id || crypto.randomUUID();
  let coverUrl = novel?.cover_url || null;
  let coverFile = null;
  let previewObjectUrl = null;

  const titleInput = el('input', { type: 'text', maxlength: 160, required: true, value: novel?.title || '', id: 'novelFieldTitle' });
  const authorInput = el('input', { type: 'text', maxlength: 120, value: novel?.author_name ?? ctx.profile?.nickname ?? '' });
  const genreInput = el('input', { type: 'text', maxlength: 80, value: novel?.genre || '', placeholder: 'Mystery, Fantasy…' });
  const statusSelect = el('select', {},
    ['ongoing', 'completed', 'hiatus'].map((value) =>
      el('option', { value, text: value.charAt(0).toUpperCase() + value.slice(1), selected: (novel?.status || 'ongoing') === value })
    )
  );
  const taglineInput = el('input', { type: 'text', maxlength: 200, value: novel?.tagline || '' });
  const synopsisInput = el('textarea', { maxlength: 4000 });
  synopsisInput.value = novel?.synopsis || '';
  const publishedInput = el('input', { type: 'checkbox' });
  publishedInput.checked = Boolean(novel?.is_published);

  const coverPreview = el('div', { class: 'hn-cover-preview', 'aria-hidden': 'true' });
  const fileInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', class: 'hn-file-input', id: 'novelCoverFile' });
  const removeCoverButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Remove' });
  const status = el('p', { class: 'hn-form-status', role: 'status', 'aria-live': 'polite' });
  const saveButton = el('button', { class: 'hn-btn', type: 'submit', text: isEdit ? 'Save Changes' : 'Create Novel' });
  const cancelButton = el('button', { class: 'hn-btn ghost', type: 'button', text: 'Cancel' });

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('error', isError);
  };

  const renderCover = (src) => {
    coverPreview.replaceChildren();
    if (src) coverPreview.append(el('img', { src, alt: '' }));
    removeCoverButton.hidden = !src;
  };
  renderCover(coverUrl);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus('Please choose an image file.', true);
      fileInput.value = '';
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setStatus('Cover is too large. Maximum size is 2 MB.', true);
      fileInput.value = '';
      return;
    }

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(file);
    coverFile = file;
    setStatus('');
    renderCover(previewObjectUrl);
  });

  removeCoverButton.addEventListener('click', () => {
    coverFile = null;
    coverUrl = null;
    fileInput.value = '';
    renderCover(null);
  });

  const field = (label, control, id) => el('label', { class: 'hn-field' }, el('span', { text: label }), control);

  const form = el('form', { class: 'hn-form', novalidate: true },
    el('h2', { text: isEdit ? 'Novel Settings' : 'Write New Novel' }),
    field('Novel title', titleInput),
    el('div', { class: 'hn-row' }, field('Author / byline', authorInput), field('Genre', genreInput)),
    el('div', { class: 'hn-row' }, field('Status', el('div', { class: 'hn-select' }, statusSelect)), field('Tagline', taglineInput)),
    field('Synopsis', synopsisInput),
    el('div', { class: 'hn-field' },
      el('span', { text: 'Cover image' }),
      el('div', { class: 'hn-cover-row' },
        coverPreview,
        el('label', { class: 'hn-btn ghost small', for: 'novelCoverFile', text: 'Add / Replace' }),
        fileInput,
        removeCoverButton
      )
    ),
    el('label', { class: 'hn-check' }, publishedInput, 'Published (visible to readers)'),
    status,
    el('div', { class: 'hn-form-actions' }, cancelButton, saveButton)
  );

  const dialog = el('dialog', { class: 'hn-dialog', 'aria-label': isEdit ? 'Novel settings' : 'Write new novel' }, form);
  document.body.append(dialog);

  dialog.addEventListener('close', () => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    dialog.remove();
  });
  cancelButton.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      setStatus('Novel title is required.', true);
      titleInput.focus();
      return;
    }

    saveButton.disabled = true;
    setStatus('Saving…');

    try {
      let finalCover = coverUrl;

      if (coverFile) {
        const ext = (coverFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = id + '/' + Date.now() + '.' + ext;
        const { error: uploadError } = await supabase.storage
          .from(COVER_BUCKET)
          .upload(path, coverFile, { contentType: coverFile.type, upsert: false });
        if (uploadError) throw uploadError;
        finalCover = supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const row = {
        title,
        author_name: authorInput.value.trim() || null,
        genre: genreInput.value.trim() || null,
        status: statusSelect.value,
        tagline: taglineInput.value.trim() || null,
        synopsis: synopsisInput.value.trim() || null,
        cover_url: finalCover,
        is_published: publishedInput.checked
      };

      const query = isEdit
        ? supabase.from('novels').update(row).eq('id', id).select().single()
        : supabase.from('novels').insert({ id, ...row }).select().single();

      const { data, error } = await query;
      if (error) throw error;

      dialog.close();
      onSaved?.(data);
    } catch (error) {
      setStatus('Could not save: ' + (error?.message || 'unknown error'), true);
      saveButton.disabled = false;
    }
  });

  dialog.showModal();
  titleInput.focus();
}

// ---------------------------------------------------------------
// LIBRARY (novels.html)
// ---------------------------------------------------------------
if (page === 'novels') {
  const grid = document.getElementById('novelGrid');
  const emptyShelf = document.getElementById('emptyShelf');
  const toolbar = document.getElementById('authorToolbar');
  const newNovelButton = document.getElementById('newNovelButton');

  const showShelfMessage = (title, text) => {
    emptyShelf.replaceChildren(el('strong', { text: title }), text);
    emptyShelf.hidden = false;
  };

  let ratingStats = {};

  const renderCard = (novel) => {
    const cover = el('div', { class: 'novel-cover', 'aria-hidden': 'true' });
    if (novel.cover_url) cover.append(el('img', { src: novel.cover_url, alt: '', loading: 'lazy' }));

    return el('a', { class: 'novel-card', href: 'novel.html?id=' + encodeURIComponent(novel.id) },
      cover,
      el('h3', { text: novel.title }),
      el('p', { class: 'novel-meta' }, novel.genre ? novel.genre + ' · ' : null, statusChip(novel.status)),
      novel.is_published ? compactRating(ratingStats[novel.id]) : null,
      novel.is_published ? null : el('span', { class: 'hn-badge draft', text: 'Draft' })
    );
  };

  async function loadLibrary() {
    showShelfMessage('Loading…', 'Fetching the shelves.');
    grid.replaceChildren();

    const { data, error } = await supabase
      .from('novels')
      .select('id, title, genre, status, cover_url, is_published')
      .order('created_at', { ascending: false });

    if (error) {
      showShelfMessage('Could not load the library.', error.message);
      return;
    }

    if (!data.length) {
      showShelfMessage('No stories yet.', ctx.isAuthor ? 'Use “+ New Novel” to bring the first story.' : 'The woods are quiet. Check back soon.');
      return;
    }

    ratingStats = await fetchNovelStatsMap(data.filter((novel) => novel.is_published).map((novel) => novel.id));
    emptyShelf.hidden = true;
    grid.replaceChildren(...data.map(renderCard));
  }

  if (ctx.isAuthor) {
    toolbar.hidden = false;
    newNovelButton.addEventListener('click', () => openNovelDialog({ onSaved: loadLibrary }));
  }

  await trackLoad(loadLibrary(), 'Fetching the shelves');

  if (ctx.isAuthor && new URLSearchParams(window.location.search).get('new') === '1') {
    openNovelDialog({ onSaved: loadLibrary });
  }
}

// ---------------------------------------------------------------
// NOVEL DETAIL (novel.html)
// ---------------------------------------------------------------
if (page === 'novel') {
  const novelId = new URLSearchParams(window.location.search).get('id');

  const coverBox = document.getElementById('novelCover');
  const titleEl = document.getElementById('novelTitle');
  const metaEl = document.getElementById('novelMeta');
  const factsEl = document.getElementById('novelFacts');
  const taglineEl = document.getElementById('novelTagline');
  const synopsisEl = document.getElementById('novelSynopsis');
  const actionsEl = document.getElementById('novelActions');
  const newChapterLink = document.getElementById('newChapterLink');
  const settingsButton = document.getElementById('novelSettingsButton');
  const chapterList = document.getElementById('chapterList');
  const importButton = document.getElementById('importButton');

  let novel = null;
  let chapters = [];
  let volumes = [];

  const listMessage = (text) => chapterList.replaceChildren(el('li', { text }));

  function renderNovel() {
    document.title = novel.title + ' — Hollow Night Camp';
    titleEl.textContent = novel.title;

    metaEl.replaceChildren(novel.author_name ? 'by ' + novel.author_name : 'Novel');
    if (ctx.isAuthor && !novel.is_published) {
      metaEl.append(' ', el('span', { class: 'hn-badge draft', text: 'Draft — hidden from readers' }));
    }

    factsEl.replaceChildren(
      novel.genre ? el('span', { class: 'novel-genre', text: novel.genre }) : null,
      statusChip(novel.status)
    );

    taglineEl.hidden = !novel.tagline;
    taglineEl.textContent = novel.tagline || '';
    synopsisEl.textContent = novel.synopsis || '';

    coverBox.replaceChildren();
    if (novel.cover_url) coverBox.append(el('img', { src: novel.cover_url, alt: 'Cover of ' + novel.title }));
  }

  async function setChapterStatus(chapter, nextStatus) {
    const { error } = await supabase.from('chapters').update({ status: nextStatus }).eq('id', chapter.id);
    if (error) {
      window.alert('Could not update the chapter: ' + error.message);
      return;
    }
    await loadChapters();
  }

  async function deleteChapter(chapter) {
    if (!window.confirm('Delete "' + chapter.title + '"? This cannot be undone.')) return;
    const { error } = await supabase.from('chapters').delete().eq('id', chapter.id);
    if (error) {
      window.alert('Could not delete the chapter: ' + error.message);
      return;
    }
    await loadChapters();
  }

  // Reorder inside the same volume / arc: swap with the neighbour, then renumber that volume's positions 1..n
  async function moveChapter(group, index, direction) {
    const items = [...group.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];

    const updates = [];
    items.forEach((chapter, i) => {
      if (chapter.position !== i + 1) {
        updates.push(supabase.from('chapters').update({ position: i + 1 }).eq('id', chapter.id));
      }
    });

    chapterList.setAttribute('aria-busy', 'true');
    const results = await Promise.all(updates);
    chapterList.removeAttribute('aria-busy');

    const failed = results.find((result) => result.error);
    if (failed) window.alert('Could not reorder: ' + failed.error.message);
    await loadChapters();
  }

  async function renameVolume(volume) {
    const input = window.prompt('Rename volume', volume.name);
    if (input == null) return;
    const name = input.trim();
    if (!name || name === volume.name) return;
    if (name.length > 80) { window.alert('The name can be at most 80 characters.'); return; }
    const { data, error } = await supabase.from('volumes').update({ name }).eq('id', volume.id).select('id');
    if (error) {
      window.alert(error.code === '23505' ? 'A volume with that name already exists.' : 'Could not rename: ' + error.message);
      return;
    }
    if (!data?.length) { window.alert('You are not allowed to rename this volume.'); return; }
    await loadChapters();
  }

  async function moveVolume(volume, direction) {
    const list = [...volumes];
    const index = list.findIndex((item) => item.id === volume.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];

    const results = await Promise.all(list
      .map((item, i) => (item.position !== i + 1 ? supabase.from('volumes').update({ position: i + 1 }).eq('id', item.id) : null))
      .filter(Boolean));
    const failed = results.find((result) => result.error);
    if (failed) window.alert('Could not reorder volumes: ' + failed.error.message);
    await loadChapters();
  }

  async function deleteVolume(volume, count) {
    const note = count ? ' Its ' + count + (count === 1 ? ' chapter stays' : ' chapters stay') + ' in the novel, without a volume.' : '';
    if (!window.confirm('Delete volume "' + volume.name + '"?' + note)) return;
    const { error } = await supabase.from('volumes').delete().eq('id', volume.id);
    if (error) { window.alert('Could not delete the volume: ' + error.message); return; }
    await loadChapters();
  }

  function renderVolumeHeader(group) {
    const { volume, items } = group;
    const index = volumes.findIndex((item) => item.id === volume.id);
    const header = el('li', { class: 'chapter-volume' }, el('span', { class: 'volume-name', text: volume.name }));

    if (ctx.isAuthor) {
      header.append(el('div', { class: 'volume-tools' },
        el('button', { class: 'hn-btn ghost small', type: 'button', text: '↑', 'aria-label': 'Move volume up', title: 'Move volume up', disabled: index <= 0, onclick: () => moveVolume(volume, -1) }),
        el('button', { class: 'hn-btn ghost small', type: 'button', text: '↓', 'aria-label': 'Move volume down', title: 'Move volume down', disabled: index >= volumes.length - 1, onclick: () => moveVolume(volume, 1) }),
        el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Rename', onclick: () => renameVolume(volume) }),
        el('button', { class: 'hn-btn danger small', type: 'button', text: 'Delete', onclick: () => deleteVolume(volume, items.length) })
      ));
    }
    return header;
  }

  function renderChapter(chapter, group, index) {
    const label = chapter.chapter_number != null ? 'Chapter ' + chapter.chapter_number : null;
    const sub = [label, chapter.subtitle, readingTime(chapter.word_count), chapter.status === 'published' && chapter.published_at ? formatDate(chapter.published_at) : null]
      .filter(Boolean).join(' · ');

    const titleNode = chapter.status === 'published' || ctx.isAuthor
      ? el('a', { href: 'read.html?id=' + encodeURIComponent(chapter.id), text: chapter.title })
      : el('strong', { text: chapter.title });

    const tools = el('div', { class: 'chapter-tools' });

    if (ctx.isAuthor) {
      tools.append(
        el('button', { class: 'hn-btn ghost small', type: 'button', text: '↑', 'aria-label': 'Move chapter up', title: 'Move up', disabled: index === 0, onclick: () => moveChapter(group, index, -1) }),
        el('button', { class: 'hn-btn ghost small', type: 'button', text: '↓', 'aria-label': 'Move chapter down', title: 'Move down', disabled: index === group.items.length - 1, onclick: () => moveChapter(group, index, 1) }),
        el('span', { class: 'hn-badge ' + (chapter.status === 'published' ? 'live' : 'draft'), text: chapter.status === 'published' ? 'Published' : 'Draft' }),
        el('a', { class: 'hn-btn ghost small', href: 'editor.html?chapter=' + encodeURIComponent(chapter.id), text: 'Edit' }),
        el('button', {
          class: 'hn-btn ghost small', type: 'button',
          text: chapter.status === 'published' ? 'Unpublish' : 'Publish',
          onclick: () => setChapterStatus(chapter, chapter.status === 'published' ? 'draft' : 'published')
        }),
        el('button', { class: 'hn-btn danger small', type: 'button', text: 'Delete', onclick: () => deleteChapter(chapter) })
      );
    }

    return el('li', { class: 'chapter-row' },
      el('div', { class: 'chapter-main' }, titleNode, sub ? el('span', { class: 'chapter-sub', text: sub }) : null),
      tools
    );
  }

  async function loadChapters() {
    let volumeRows = [];
    try {
      volumeRows = await loadVolumes(novelId);
    } catch (error) {
      listMessage('Could not load volumes: ' + error.message);
      return;
    }

    const { data, error } = await supabase
      .from('chapters')
      .select('id, title, subtitle, chapter_number, volume_id, position, status, published_at, word_count, created_at')
      .eq('novel_id', novelId);

    if (error) {
      listMessage('Could not load chapters: ' + error.message);
      return;
    }

    if (!data.length && !volumeRows.length) {
      listMessage(ctx.isAuthor ? 'No chapters yet. Use “+ New Chapter” to write the first one.' : 'No chapters yet.');
      return;
    }

    volumes = volumeRows;
    chapters = sortChapters(data, volumes);

    // one group per volume id, so the same volume can never show up twice
    const known = new Set(volumes.map((volume) => volume.id));
    const groups = [];
    const loose = chapters.filter((chapter) => !chapter.volume_id || !known.has(chapter.volume_id));
    if (loose.length) groups.push({ volume: null, items: loose });
    volumes.forEach((volume) => {
      const items = chapters.filter((chapter) => chapter.volume_id === volume.id);
      if (items.length || ctx.isAuthor) groups.push({ volume, items });
    });

    const rows = [];
    groups.forEach((group) => {
      if (group.volume) rows.push(renderVolumeHeader(group));
      group.items.forEach((chapter, index) => rows.push(renderChapter(chapter, group, index)));
    });
    chapterList.replaceChildren(...rows);
  }

  if (!novelId) {
    titleEl.textContent = 'Novel not found';
    metaEl.textContent = 'No novel was selected.';
    listMessage('');
  } else {
    const { data, error } = await supabase.from('novels').select('*').eq('id', novelId).maybeSingle();

    if (error || !data) {
      titleEl.textContent = 'Novel not found';
      metaEl.textContent = error ? error.message : 'It may have been removed or is not published yet.';
      listMessage('');
    } else {
      novel = data;
      renderNovel();

      if (novel.is_published) {
        const ratingBox = document.getElementById('novelRating');
        ratingBox.hidden = false;
        mountNovelRating(ratingBox, novel.id);
      }

      if (ctx.isAuthor) {
        actionsEl.hidden = false;
        newChapterLink.href = 'editor.html?novel=' + encodeURIComponent(novel.id);
        importButton.addEventListener('click', () => openImportDialog({ novelId: novel.id }));
        settingsButton.addEventListener('click', () => openNovelDialog({
          novel,
          onSaved: (saved) => { novel = saved; renderNovel(); }
        }));
      }

      mountContinueReading(document.getElementById('novelContinue'), novel.id);
      await loadChapters();
    }
  }
}
