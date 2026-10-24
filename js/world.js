// HOLLOW NIGHT CAMP — world building: characters.html, maps.html, locations.html.
// Everyone can read published entries; only Authors can create / edit / delete (RLS enforces it again in the database).

import { initPage, trackLoad } from './shared.js?v=21';
import { supabase } from '../config/supabase.js';
import { el } from './dom.js?v=2';

const page = document.body.dataset.page;
const ctx = await initPage({ active: 'novels' });

const BUCKET = 'worldbuilding';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

const root = document.getElementById('wbRoot');
const toolbar = document.getElementById('authorToolbar');
const newButton = document.getElementById('newButton');
const params = new URLSearchParams(window.location.search);
const entryId = params.get('id');

// replaceChildren() turns null / false into the literal text "null" / "false"; drop them first.
const fill = (parent, ...kids) => parent.replaceChildren(...kids.flat().filter((kid) => kid != null && kid !== false));

const message = (title, text) => fill(root,
  el('div', { class: 'empty-shelf', role: 'status' }, el('strong', { text: title }), text || '')
);

const NONE = { value: '', label: '— None —' };

function setOptions(select, options, current = '') {
  select.replaceChildren(...options.map((option) =>
    el('option', { value: option.value, text: option.label, selected: String(option.value) === String(current ?? '') })
  ));
}

async function loadOptions(table, labelKey = 'name') {
  const { data } = await supabase.from(table).select('id, ' + labelKey).order(labelKey, { ascending: true });
  return [NONE, ...(data || []).map((row) => ({ value: row.id, label: row[labelKey] }))];
}

// ---------------------------------------------------------------
// IMAGE PICKER (validates type + size, previews, uploads on save)
// ---------------------------------------------------------------
function imagePicker(initialUrl, setStatus, landscape) {
  let url = initialUrl || null;
  let file = null;
  let objectUrl = null;
  const inputId = 'wbImage' + crypto.randomUUID().slice(0, 8);

  const preview = el('div', { class: 'hn-cover-preview', 'aria-hidden': 'true', style: landscape ? 'aspect-ratio:4/3;width:120px' : null });
  const input = el('input', { type: 'file', accept: ACCEPT, class: 'hn-file-input', id: inputId });
  const removeButton = el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Remove' });

  const paint = (src) => {
    preview.replaceChildren();
    if (src) preview.append(el('img', { src, alt: '' }));
    removeButton.hidden = !src;
  };
  paint(url);

  input.addEventListener('change', () => {
    const chosen = input.files?.[0];
    if (!chosen) return;
    if (!ACCEPT.split(',').includes(chosen.type)) {
      setStatus('Please choose a PNG, JPG, WebP or GIF image.', true);
      input.value = '';
      return;
    }
    if (chosen.size > MAX_IMAGE_BYTES) {
      setStatus('Image is too large. Maximum size is 5 MB.', true);
      input.value = '';
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(chosen);
    file = chosen;
    setStatus('');
    paint(objectUrl);
  });

  removeButton.addEventListener('click', () => {
    file = null;
    url = null;
    input.value = '';
    paint(null);
  });

  return {
    node: el('div', { class: 'hn-cover-row' },
      preview,
      el('label', { class: 'hn-btn ghost small', for: inputId, text: 'Add / Replace' }),
      input,
      removeButton
    ),
    cleanup() { if (objectUrl) URL.revokeObjectURL(objectUrl); },
    async resolve(folder, id) {
      if (!file) return url;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = folder + '/' + id + '/' + Date.now() + '.' + ext;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
  };
}

// ---------------------------------------------------------------
// ENTRY DIALOG (create + edit), generic over field lists
// field: { key, label, kind: 'text' | 'textarea' | 'select', required, maxlength, options }
// ---------------------------------------------------------------
function openEntryDialog({
  title, table, entry = null, fields, folder, image = true, landscape = false, publish = true,
  fixed = {}, afterBuild, onSaved, onDelete
}) {
  const isEdit = Boolean(entry);
  const id = entry?.id || crypto.randomUUID();
  const controls = {};

  const status = el('p', { class: 'hn-form-status', role: 'status', 'aria-live': 'polite' });
  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('error', isError);
  };

  const fieldNodes = fields.map((field) => {
    if (field.kind === 'custom') {
      const built = field.build(entry);
      controls[field.key] = built.control;
      return built.node;
    }
    let control;
    if (field.kind === 'textarea') {
      control = el('textarea', { maxlength: field.maxlength || 4000 });
      control.value = entry?.[field.key] || '';
    } else if (field.kind === 'select') {
      control = el('select', {});
      setOptions(control, field.options || [NONE], entry?.[field.key] ?? '');
    } else {
      control = el('input', { type: 'text', maxlength: field.maxlength || 160, value: entry?.[field.key] ?? '' });
    }
    controls[field.key] = control;
    return el('label', { class: 'hn-field' },
      el('span', { text: field.label }),
      field.kind === 'select' ? el('div', { class: 'hn-select' }, control) : control
    );
  });

  const picker = image ? imagePicker(entry?.image_url, setStatus, landscape) : null;
  const publishedInput = el('input', { type: 'checkbox' });
  publishedInput.checked = Boolean(entry?.is_published);

  const saveButton = el('button', { class: 'hn-btn', type: 'submit', text: isEdit ? 'Save Changes' : 'Create' });
  const cancelButton = el('button', { class: 'hn-btn ghost', type: 'button', text: 'Cancel' });
  const deleteButton = isEdit && onDelete
    ? el('button', { class: 'hn-btn danger', type: 'button', text: 'Delete' })
    : null;

  const form = el('form', { class: 'hn-form', novalidate: true },
    el('h2', { text: title }),
    ...fieldNodes,
    picker ? el('div', { class: 'hn-field' }, el('span', { text: 'Image' }), picker.node) : null,
    publish ? el('label', { class: 'hn-check' }, publishedInput, 'Published (visible to readers)') : null,
    status,
    el('div', { class: 'hn-form-actions' }, deleteButton, cancelButton, saveButton)
  );

  const dialog = el('dialog', { class: 'hn-dialog', 'aria-label': title }, form);
  document.body.append(dialog);
  dialog.addEventListener('close', () => { picker?.cleanup(); dialog.remove(); });
  cancelButton.addEventListener('click', () => dialog.close());

  if (afterBuild) afterBuild(controls, entry);

  deleteButton?.addEventListener('click', async () => {
    deleteButton.disabled = true;
    const ok = await onDelete();
    if (ok === false) deleteButton.disabled = false;
    else dialog.close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const row = {};
    for (const field of fields) {
      const value = controls[field.key].value.trim();
      if (field.required && !value) {
        setStatus(field.label + ' is required.', true);
        controls[field.key].focus();
        return;
      }
      row[field.key] = value || null;
    }
    if (publish) row.is_published = publishedInput.checked;

    saveButton.disabled = true;
    setStatus('Saving…');

    try {
      if (picker) row.image_url = await picker.resolve(folder, id);
      Object.assign(row, fixed);

      const query = isEdit
        ? supabase.from(table).update(row).eq('id', id).select().single()
        : supabase.from(table).insert({ id, ...row }).select().single();
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
  controls[fields[0].key]?.focus();
}

async function deleteEntry(table, entry, listHref, noun) {
  if (!window.confirm('Delete "' + (entry.name || entry.label) + '"? This cannot be undone.')) return false;
  const { error } = await supabase.from(table).delete().eq('id', entry.id);
  if (error) {
    window.alert('Could not delete the ' + noun + ': ' + error.message);
    return false;
  }
  if (listHref) window.location.href = listHref;
  return true;
}

// ---------------------------------------------------------------
// SHARED RENDER PIECES
// ---------------------------------------------------------------
function card({ href, name, sub, imageUrl, draft, landscape }) {
  const cover = el('div', { class: 'novel-cover', 'aria-hidden': 'true' });
  if (imageUrl) cover.append(el('img', { src: imageUrl, alt: '', loading: 'lazy' }));
  else cover.append(el('span', { class: 'wb-initial', text: (name || '?').charAt(0).toUpperCase() }));

  return el('a', { class: 'novel-card wb-card' + (landscape ? ' wb-landscape' : ''), href },
    cover,
    el('h3', { text: name }),
    sub ? el('p', { class: 'wb-sub', text: sub }) : null,
    draft ? el('span', { class: 'hn-badge draft', text: 'Draft' }) : null
  );
}

function backLink(href, text) {
  return el('p', { class: 'wb-back' }, el('a', { class: 'has-icon', href },
    el('span', { class: 'icon icon-back', 'aria-hidden': 'true' }), text));
}

function section(heading, body) {
  if (!body) return null;
  return [el('h3', { class: 'wb-h', text: heading }), typeof body === 'string' ? el('p', { class: 'wb-text', text: body }) : body];
}

function art(imageUrl, name, landscape) {
  const box = el('div', { class: 'wb-art' + (landscape ? ' wb-landscape' : '') });
  if (imageUrl) box.append(el('img', { src: imageUrl, alt: name }));
  return box;
}

function authorActions(entry, table, listHref, noun, openEdit) {
  if (!ctx.isAuthor) return null;
  return el('div', { class: 'wb-actions' },
    entry.is_published ? null : el('span', { class: 'hn-badge draft', text: 'Draft — hidden from readers' }),
    el('button', { class: 'hn-btn ghost', type: 'button', text: 'Edit', onclick: openEdit }),
    el('button', { class: 'hn-btn danger', type: 'button', text: 'Delete', onclick: () => deleteEntry(table, entry, listHref, noun) })
  );
}

async function fetchOne(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------
// CHARACTERS
// ---------------------------------------------------------------
const CHARACTER_FIELDS = (locationOptions) => [
  { key: 'name', label: 'Name', required: true },
  { key: 'role', label: 'Role', maxlength: 120 },
  { key: 'description', label: 'Description', kind: 'textarea' },
  { key: 'appearance', label: 'Appearance', kind: 'textarea' },
  { key: 'relationships', label: 'Relationships', kind: 'textarea' },
  { key: 'location_id', label: 'Based at (location)', kind: 'select', options: locationOptions }
];

async function openCharacterDialog(entry, onSaved) {
  openEntryDialog({
    title: entry ? 'Edit Character' : 'New Character',
    table: 'characters', entry, folder: 'characters',
    fields: CHARACTER_FIELDS(await loadOptions('locations')),
    onSaved
  });
}

async function characters() {
  if (!entryId) {
    const load = async () => {
      message('Loading…', 'Gathering the campers.');
      const { data, error } = await supabase.from('characters').select('*').order('name', { ascending: true });
      if (error) return message('Could not load characters.', error.message);
      if (!data.length) return message('No characters yet.', ctx.isAuthor ? 'Use “+ New Character” to add the first one.' : 'Nobody has shown up around the fire yet.');
      fill(root, el('div', { class: 'novel-grid' }, ...data.map((row) => card({
        href: 'characters.html?id=' + encodeURIComponent(row.id),
        name: row.name, sub: row.role, imageUrl: row.image_url, draft: !row.is_published
      }))));
    };
    if (ctx.isAuthor) {
      toolbar.hidden = false;
      newButton.addEventListener('click', () => openCharacterDialog(null, (row) => { window.location.href = 'characters.html?id=' + encodeURIComponent(row.id); }));
    }
    return load();
  }

  let row;
  try { row = await fetchOne('characters', entryId); } catch (error) { return message('Could not load the character.', error.message); }
  if (!row) return message('Character not found.', 'It may have been removed or is not published yet.');

  document.title = row.name + ' — Hollow Night Camp';
  let place = null;
  if (row.location_id) {
    const { data } = await supabase.from('locations').select('id, name').eq('id', row.location_id).maybeSingle();
    place = data;
  }

  fill(root, 
    backLink('characters.html', 'All characters'),
    el('div', { class: 'wb-detail' },
      art(row.image_url, row.name),
      el('div', {},
        el('h2', { class: 'wb-title', text: row.name }),
        row.role ? el('p', { class: 'wb-role', text: row.role }) : null,
        authorActions(row, 'characters', 'characters.html', 'character', async () => openCharacterDialog(row, () => window.location.reload())),
        section('About', row.description),
        section('Appearance', row.appearance),
        section('Relationships', row.relationships),
        place ? section('Based at', el('ul', { class: 'wb-links' }, el('li', {}, el('a', { href: 'locations.html?id=' + encodeURIComponent(place.id), text: place.name })))) : null
      )
    )
  );
}

// ---------------------------------------------------------------
// LOCATIONS
// ---------------------------------------------------------------
// Searchable dropdown of existing map markers. Picking one fills name, description, map and marker.
function markerCombo({ markers, initialName, onPick }) {
  const listId = 'markerList' + crypto.randomUUID().slice(0, 8);
  const norm = (text) => text.trim().toLowerCase();
  const input = el('input', {
    type: 'text', maxlength: 160, autocomplete: 'off', role: 'combobox', value: initialName ?? '',
    'aria-expanded': 'false', 'aria-controls': listId, 'aria-autocomplete': 'list',
    placeholder: 'Type to search markers…'
  });
  const toggle = el('button', { class: 'vol-toggle', type: 'button', tabindex: '-1', 'aria-label': 'Show markers' });
  const list = el('ul', { class: 'vol-list', id: listId, role: 'listbox', hidden: true });
  const node = el('label', { class: 'hn-field' }, el('span', { text: 'Name' }), el('div', { class: 'vol-combo' }, input, toggle, list));

  let options = [];
  let active = -1;
  let open = false;

  const render = () => {
    list.replaceChildren(...(options.length ? options : [null]).map((marker, index) => {
      if (!marker) return el('li', { class: 'vol-option', text: 'No markers match. Add markers on a map first.' });
      const item = el('li', {
        class: 'vol-option' + (index === active ? ' active' : ''), role: 'option',
        'aria-selected': String(index === active), text: marker.label + ' · ' + marker.mapName
      });
      item.addEventListener('mousedown', (event) => { event.preventDefault(); choose(marker); });
      return item;
    }));
    list.children[active]?.scrollIntoView({ block: 'nearest' });
  };
  const openList = (filter) => {
    const query = norm(filter || '');
    options = markers.filter((marker) => !query || norm(marker.label).includes(query) || norm(marker.mapName).includes(query));
    active = options.length ? 0 : -1;
    open = true;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    render();
  };
  const closeList = () => { open = false; list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const choose = (marker) => { input.value = marker.label; closeList(); onPick(marker); };

  input.addEventListener('input', () => openList(input.value));
  input.addEventListener('focus', () => openList(''));
  input.addEventListener('click', () => { if (!open) openList(''); });
  input.addEventListener('blur', closeList);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { openList(''); return; }
      if (options.length) { active = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length; render(); }
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      closeList();
    }
  });
  toggle.addEventListener('mousedown', (event) => event.preventDefault());
  toggle.addEventListener('click', () => { if (open) closeList(); else { input.focus(); openList(''); } });

  return { node, control: input };
}

async function openLocationDialog(entry, onSaved) {
  const [mapOpts, markerRes] = await Promise.all([
    loadOptions('maps'),
    supabase.from('map_markers').select('id, label, description, map_id, maps(name)').order('label', { ascending: true })
  ]);
  const markers = (markerRes.data || []).map((row) => ({ ...row, mapName: row.maps?.name || 'Map' }));
  const markersOf = (mapId) => [NONE, ...markers.filter((marker) => marker.map_id === mapId).map((marker) => ({ value: marker.id, label: marker.label }))];
  let controls = null;

  openEntryDialog({
    title: entry ? 'Edit Location' : 'New Location',
    table: 'locations', entry, folder: 'locations', landscape: true,
    fields: [
      {
        key: 'name', label: 'Name', required: true, kind: 'custom',
        build: (current) => markerCombo({
          markers, initialName: current?.name,
          onPick(marker) {
            controls.description.value = marker.description || '';
            controls.map_id.value = marker.map_id;
            setOptions(controls.marker_id, markersOf(marker.map_id), marker.id);
          }
        })
      },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'map_id', label: 'Shown on map', kind: 'select', options: mapOpts },
      { key: 'marker_id', label: 'Map marker', kind: 'select', options: markersOf(entry?.map_id) }
    ],
    afterBuild(built) {
      controls = built;
      built.map_id.addEventListener('change', () => setOptions(built.marker_id, markersOf(built.map_id.value)));
      built.marker_id.addEventListener('change', () => {
        const marker = markers.find((item) => item.id === built.marker_id.value);
        if (marker && !built.description.value.trim()) built.description.value = marker.description || '';
      });
    },
    onSaved
  });
}

async function locations() {
  if (!entryId) {
    const load = async () => {
      message('Loading…', 'Reading the trail signs.');
      const { data, error } = await supabase.from('locations').select('*').order('name', { ascending: true });
      if (error) return message('Could not load locations.', error.message);
      if (!data.length) return message('No locations yet.', ctx.isAuthor ? 'Use “+ New Location” to add the first one.' : 'The trail signs are still blank.');
      fill(root, el('div', { class: 'novel-grid' }, ...data.map((row) => card({
        href: 'locations.html?id=' + encodeURIComponent(row.id),
        name: row.name, imageUrl: row.image_url, draft: !row.is_published, landscape: true
      }))));
    };
    if (ctx.isAuthor) {
      toolbar.hidden = false;
      newButton.addEventListener('click', () => openLocationDialog(null, (row) => { window.location.href = 'locations.html?id=' + encodeURIComponent(row.id); }));
    }
    return load();
  }

  let row;
  try { row = await fetchOne('locations', entryId); } catch (error) { return message('Could not load the location.', error.message); }
  if (!row) return message('Location not found.', 'It may have been removed or is not published yet.');

  document.title = row.name + ' — Hollow Night Camp';
  const [mapRes, folkRes] = await Promise.all([
    row.map_id ? supabase.from('maps').select('id, name').eq('id', row.map_id).maybeSingle() : { data: null },
    supabase.from('characters').select('id, name, role').eq('location_id', row.id).order('name', { ascending: true })
  ]);
  const map = mapRes.data;
  const folk = folkRes.data || [];

  const mapHref = map ? 'maps.html?id=' + encodeURIComponent(map.id) + (row.marker_id ? '&marker=' + encodeURIComponent(row.marker_id) : '') : null;

  fill(root, 
    backLink('locations.html', 'All locations'),
    el('div', { class: 'wb-detail wb-wide' },
      el('div', {},
        row.image_url ? art(row.image_url, row.name, true) : null,
        el('h2', { class: 'wb-title', text: row.name, style: 'margin-top:18px' }),
        authorActions(row, 'locations', 'locations.html', 'location', () => openLocationDialog(row, () => window.location.reload())),
        section('About', row.description),
        map ? section('On the map', el('ul', { class: 'wb-links' }, el('li', {}, el('a', { href: mapHref, text: map.name + (row.marker_id ? ' (marker)' : '') })))) : null,
        folk.length ? section('Characters here', el('ul', { class: 'wb-links' }, ...folk.map((person) =>
          el('li', {}, el('a', { href: 'characters.html?id=' + encodeURIComponent(person.id), text: person.name + (person.role ? ' — ' + person.role : '') })))))
          : null
      )
    )
  );
}

// ---------------------------------------------------------------
// MAPS (+ markers)
// ---------------------------------------------------------------
function openMapDialog(entry, onSaved) {
  openEntryDialog({
    title: entry ? 'Edit Map' : 'New Map',
    table: 'maps', entry, folder: 'maps', landscape: true,
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'description', label: 'Description', kind: 'textarea' }
    ],
    onSaved
  });
}

function openMarkerDialog({ marker = null, mapId, x, y, onSaved, onDelete }) {
  openEntryDialog({
    title: marker ? 'Edit Marker' : 'New Marker',
    table: 'map_markers', entry: marker, image: false, publish: false,
    fixed: marker ? {} : { map_id: mapId, x, y },
    fields: [
      { key: 'label', label: 'Label', required: true, maxlength: 80 },
      { key: 'description', label: 'Description', kind: 'textarea', maxlength: 2000 }
    ],
    onSaved, onDelete
  });
}

const clampPct = (value) => Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;

async function mapDetail() {
  let map;
  try { map = await fetchOne('maps', entryId); } catch (error) { return message('Could not load the map.', error.message); }
  if (!map) return message('Map not found.', 'It may have been removed or is not published yet.');
  document.title = map.name + ' — Hollow Night Camp';

  const [markerRes, locRes] = await Promise.all([
    supabase.from('map_markers').select('*').eq('map_id', map.id).order('created_at', { ascending: true }),
    supabase.from('locations').select('id, name, marker_id').eq('map_id', map.id)
  ]);
  if (markerRes.error) return message('Could not load markers.', markerRes.error.message);

  let markers = markerRes.data || [];
  const linkedLocations = locRes.data || [];
  let selectedId = params.get('marker');
  let mode = null; // null | 'add' | { move: markerId }

  const img = el('img', { src: map.image_url || '', alt: map.name, draggable: 'false' });
  const pinLayer = el('div', {});
  const canvas = el('div', { class: 'map-canvas' }, img, pinLayer);
  const zoomLabel = el('span', { class: 'map-zoom-label', text: '100%' });
  const zoomIn = el('button', { class: 'map-zoom-btn', type: 'button', text: '+', 'aria-label': 'Zoom in' });
  const zoomOut = el('button', { class: 'map-zoom-btn', type: 'button', text: '−', 'aria-label': 'Zoom out' });
  const zoomReset = el('button', { class: 'map-zoom-btn', type: 'button', text: 'Reset', 'aria-label': 'Reset zoom' });
  const controlsBox = el('div', { class: 'map-controls' }, zoomOut, zoomLabel, zoomIn, zoomReset);
  const stage = el('div', { class: 'map-stage' }, map.image_url ? [canvas, controlsBox] : el('div', { class: 'empty-shelf' }, 'No map image yet.'));
  const hint = el('p', { class: 'map-hint', hidden: true, role: 'status' });
  const panel = el('div', { class: 'map-panel', 'aria-live': 'polite' });
  const list = el('ul', { class: 'map-marker-list' });
  const addButton = el('button', { class: 'hn-btn', type: 'button', text: 'Add marker' });

  const reload = async () => {
    const { data } = await supabase.from('map_markers').select('*').eq('map_id', map.id).order('created_at', { ascending: true });
    markers = data || [];
    draw();
  };

  const setMode = (next) => {
    mode = next;
    canvas.classList.toggle('placing', Boolean(mode));
    addButton.textContent = mode ? 'Cancel' : 'Add marker';
    hint.hidden = !mode;
    hint.textContent = mode === 'add'
      ? 'Click the map where the marker goes. Press Esc to cancel.'
      : mode ? 'Click the map to move the marker. Press Esc to cancel.' : '';
  };

  const select = (id) => { selectedId = id; draw(); };

  // ---- zoom / pan: wheel or buttons to zoom, drag to pan, two fingers to pinch ----
  const MAX_ZOOM = 8;
  const view = { s: 1, x: 0, y: 0 };
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let dragged = false;

  function applyView() {
    view.x = Math.min(0, Math.max(view.x, stage.clientWidth * (1 - view.s)));
    view.y = Math.min(0, Math.max(view.y, stage.clientHeight - canvas.offsetHeight * view.s));
    canvas.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.s + ')';
    canvas.style.setProperty('--inv', String(1 / view.s));
    stage.classList.toggle('zoomed', view.s > 1);
    zoomLabel.textContent = Math.round(view.s * 100) + '%';
  }
  function zoomAt(factor, cx, cy) {
    const next = Math.min(MAX_ZOOM, Math.max(1, view.s * factor));
    const k = next / view.s;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.s = next;
    applyView();
  }
  const stagePoint = (clientX, clientY) => {
    const rect = stage.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const pinchState = () => {
    const [a, b] = [...pointers.values()];
    const mid = stagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: mid.x, cy: mid.y };
  };
  const startDrag = (point) => { drag = { sx: point.x, sy: point.y, vx: view.x, vy: view.y }; };

  zoomIn.addEventListener('click', () => zoomAt(1.5, stage.clientWidth / 2, stage.clientHeight / 2));
  zoomOut.addEventListener('click', () => zoomAt(1 / 1.5, stage.clientWidth / 2, stage.clientHeight / 2));
  zoomReset.addEventListener('click', () => { view.s = 1; view.x = 0; view.y = 0; applyView(); });
  window.addEventListener('resize', applyView);

  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    const point = stagePoint(event.clientX, event.clientY);
    zoomAt(event.deltaY < 0 ? 1.2 : 1 / 1.2, point.x, point.y);
  }, { passive: false });

  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.map-controls')) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragged = false;
    if (pointers.size === 1) startDrag({ x: event.clientX, y: event.clientY });
    else if (pointers.size === 2) { pinch = pinchState(); drag = null; }
  });
  stage.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2 && pinch) {
      const now = pinchState();
      zoomAt(now.dist / pinch.dist, now.cx, now.cy);
      view.x += now.cx - pinch.cx;
      view.y += now.cy - pinch.cy;
      applyView();
      pinch = now;
      dragged = true;
    } else if (drag && pointers.size === 1) {
      const dx = event.clientX - drag.sx;
      const dy = event.clientY - drag.sy;
      if (!dragged && Math.hypot(dx, dy) < 6) return;
      if (!dragged) { try { stage.setPointerCapture(event.pointerId); } catch (e) {} }
      dragged = true;
      view.x = drag.vx + dx;
      view.y = drag.vy + dy;
      applyView();
    }
  });
  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    pinch = null;
    drag = null;
    if (pointers.size === 1) { startDrag([...pointers.values()][0]); }
    setTimeout(() => { dragged = false; }, 0);
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  function draw() {
    pinLayer.replaceChildren(...markers.map((marker) => el('button', {
      class: 'map-pin' + (marker.id === selectedId ? ' selected' : ''),
      type: 'button', 'aria-label': marker.label, style: 'left:' + marker.x + '%;top:' + marker.y + '%',
      onclick: (event) => { event.stopPropagation(); if (!mode && !dragged) select(marker.id); }
    }, el('span', { class: 'map-pin-label', text: marker.label }))));

    list.replaceChildren(...markers.map((marker) => el('li', {},
      el('button', {
        class: 'hn-btn ghost small', type: 'button', text: marker.label,
        'aria-pressed': String(marker.id === selectedId), onclick: () => select(marker.id)
      }))));

    const marker = markers.find((item) => item.id === selectedId);
    if (!marker) {
      fill(panel, el('p', { text: markers.length ? 'Select a marker to read about it.' : (ctx.isAuthor ? 'No markers yet. Use “Add marker”, then click the map.' : 'No markers on this map yet.') }));
      return;
    }

    const places = linkedLocations.filter((place) => place.marker_id === marker.id);
    fill(panel, 
      el('h3', { text: marker.label }),
      marker.description ? el('p', { text: marker.description }) : null,
      places.length ? el('ul', { class: 'wb-links', style: 'margin-top:10px' }, ...places.map((place) =>
        el('li', {}, el('a', { href: 'locations.html?id=' + encodeURIComponent(place.id), text: 'Location: ' + place.name })))) : null,
      ctx.isAuthor ? el('div', { class: 'wb-actions' },
        el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Edit', onclick: () => openMarkerDialog({ marker, mapId: map.id, onSaved: reload, onDelete: () => removeMarker(marker) }) }),
        el('button', { class: 'hn-btn ghost small', type: 'button', text: 'Move', onclick: () => setMode({ move: marker.id }) }),
        el('button', { class: 'hn-btn danger small', type: 'button', text: 'Delete', onclick: () => removeMarker(marker) })
      ) : null
    );
  }

  async function removeMarker(marker) {
    if (!window.confirm('Delete marker "' + marker.label + '"?')) return false;
    const { error } = await supabase.from('map_markers').delete().eq('id', marker.id);
    if (error) { window.alert('Could not delete the marker: ' + error.message); return false; }
    selectedId = null;
    await reload();
    return true;
  }

  canvas.addEventListener('click', async (event) => {
    if (!mode || dragged) return;
    const rect = img.getBoundingClientRect();
    const x = clampPct((event.clientX - rect.left) / rect.width * 100);
    const y = clampPct((event.clientY - rect.top) / rect.height * 100);

    if (mode === 'add') {
      setMode(null);
      openMarkerDialog({ mapId: map.id, x, y, onSaved: (row) => { selectedId = row.id; reload(); } });
    } else {
      const id = mode.move;
      setMode(null);
      const { error } = await supabase.from('map_markers').update({ x, y }).eq('id', id);
      if (error) window.alert('Could not move the marker: ' + error.message);
      await reload();
    }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mode) setMode(null); });

  addButton.addEventListener('click', () => setMode(mode ? null : 'add'));

  fill(root, 
    backLink('maps.html', 'All maps'),
    el('h2', { class: 'wb-title', text: map.name, style: 'margin:0 0 6px;font-family:var(--heading);font-size:clamp(28px,4.4vw,44px)' }),
    map.description ? el('p', { class: 'wb-text', text: map.description }) : null,
    authorActions(map, 'maps', 'maps.html', 'map', () => openMapDialog(map, () => window.location.reload())),
    ctx.isAuthor && map.image_url ? el('div', { class: 'wb-actions' }, addButton) : null,
    hint,
    el('div', { style: 'margin-top:16px' }, stage),
    el('p', { class: 'map-help', text: 'Scroll or pinch to zoom, drag to pan.' }),
    panel,
    list
  );
  draw();
}

async function maps() {
  if (entryId) return mapDetail();

  const load = async () => {
    message('Loading…', 'Unfolding the maps.');
    const { data, error } = await supabase.from('maps').select('*').order('name', { ascending: true });
    if (error) return message('Could not load maps.', error.message);
    if (!data.length) return message('No maps yet.', ctx.isAuthor ? 'Use “+ New Map” to add the first one.' : 'The cartographer is still out in the woods.');
    fill(root, el('div', { class: 'novel-grid' }, ...data.map((row) => card({
      href: 'maps.html?id=' + encodeURIComponent(row.id),
      name: row.name, imageUrl: row.image_url, draft: !row.is_published, landscape: true
    }))));
  };
  if (ctx.isAuthor) {
    toolbar.hidden = false;
    newButton.addEventListener('click', () => openMapDialog(null, (row) => { window.location.href = 'maps.html?id=' + encodeURIComponent(row.id); }));
  }
  return load();
}

// ---------------------------------------------------------------
const handlers = { characters, maps, locations };
await trackLoad(handlers[page]?.(), 'Gathering the camp');
// Author toolbar stays hidden on detail pages (they carry their own actions).
if (entryId) toolbar.hidden = true;
