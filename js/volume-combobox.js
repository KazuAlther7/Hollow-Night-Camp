// HOLLOW NIGHT CAMP — volume picker: dropdown list that is also a search box.
// Typing filters the list; typing a name that does not exist offers "Create ...".
// getValue() -> { id, newName }  (id = existing volume, newName = create on save, both null = no volume)

import { el } from './dom.js?v=2';

let counter = 0;
const norm = (text) => text.trim().toLowerCase();

export function createVolumeCombobox(host, { getVolumes, onChange, labelledBy, hint }) {
  const listId = 'volumeList' + (counter += 1);
  const input = el('input', {
    type: 'text', maxlength: '80', autocomplete: 'off', role: 'combobox',
    'aria-expanded': 'false', 'aria-controls': listId, 'aria-autocomplete': 'list',
    'aria-labelledby': labelledBy, placeholder: 'No volume · type to search or create'
  });
  const toggle = el('button', { class: 'vol-toggle', type: 'button', tabindex: '-1', 'aria-label': 'Show volumes' });
  const list = el('ul', { class: 'vol-list', id: listId, role: 'listbox', hidden: true });
  host.replaceChildren(input, toggle, list);

  let selected = { id: null, newName: null };
  let options = [];
  let active = -1;
  let isOpen = false;

  const findByName = (name) => getVolumes().find((volume) => norm(volume.name) === norm(name));

  function buildOptions(filter) {
    const query = norm(filter);
    const result = [];
    if (!query) result.push({ kind: 'none', label: 'No volume' });
    getVolumes()
      .filter((volume) => !query || norm(volume.name).includes(query))
      .forEach((volume) => result.push({ kind: 'volume', volume, label: volume.name }));
    if (query && !findByName(filter)) result.push({ kind: 'new', name: filter.trim(), label: 'Create “' + filter.trim() + '”' });
    return result;
  }

  function render() {
    list.replaceChildren(...options.map((option, index) => {
      const item = el('li', {
        class: 'vol-option' + (option.kind === 'new' ? ' is-new' : '') + (index === active ? ' active' : ''),
        id: listId + '-' + index, role: 'option', 'aria-selected': String(index === active), text: option.label
      });
      item.addEventListener('mousedown', (event) => { event.preventDefault(); choose(option); });
      return item;
    }));
    if (active >= 0) {
      input.setAttribute('aria-activedescendant', listId + '-' + active);
      list.children[active]?.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function openList(filter) {
    options = buildOptions(filter);
    const current = options.findIndex((option) =>
      (option.kind === 'volume' && option.volume.id === selected.id) || (option.kind === 'none' && !selected.id && !selected.newName));
    active = current >= 0 ? current : 0;
    isOpen = true;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    render();
  }

  function closeList() {
    isOpen = false;
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function updateHint() {
    if (!hint) return;
    hint.hidden = !selected.newName;
    hint.textContent = selected.newName ? 'New volume “' + selected.newName + '” will be created when you save.' : '';
  }

  function choose(option) {
    if (option.kind === 'none') {
      selected = { id: null, newName: null };
      input.value = '';
    } else if (option.kind === 'volume') {
      selected = { id: option.volume.id, newName: null };
      input.value = option.volume.name;
    } else {
      selected = { id: null, newName: option.name };
      input.value = option.name;
    }
    closeList();
    updateHint();
    onChange?.();
  }

  input.addEventListener('input', () => {
    const value = input.value;
    const match = value.trim() ? findByName(value) : null;
    if (!value.trim()) selected = { id: null, newName: null };
    else if (match) selected = { id: match.id, newName: null };
    else selected = { id: null, newName: value.trim() };
    openList(value);
    updateHint();
    onChange?.();
  });

  input.addEventListener('focus', () => {
    const showAll = !input.value || (selected.id && norm(findByName(input.value)?.name || '') === norm(input.value));
    openList(showAll ? '' : input.value);
  });
  input.addEventListener('click', () => { if (!isOpen) openList(''); });
  input.addEventListener('blur', closeList);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) { openList(''); return; }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      active = (active + step + options.length) % options.length;
      render();
    } else if (event.key === 'Enter' && isOpen && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeList();
    }
  });

  toggle.addEventListener('mousedown', (event) => event.preventDefault());
  toggle.addEventListener('click', () => {
    if (isOpen) { closeList(); return; }
    input.focus();
    openList('');
  });

  return {
    getValue: () => ({ ...selected }),
    setValue(volumeId) {
      const volume = getVolumes().find((item) => item.id === volumeId);
      selected = { id: volume ? volume.id : null, newName: null };
      input.value = volume ? volume.name : '';
      updateHint();
    }
  };
}
