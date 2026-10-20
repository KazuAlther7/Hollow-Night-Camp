// HOLLOW NIGHT CAMP — tiny DOM helper. Always uses textContent, so user text is never parsed as HTML.

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }

  kids.flat().forEach((kid) => {
    if (kid != null && kid !== false) node.append(kid);
  });

  return node;
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ~200 words per minute
export function readingTime(words) {
  if (!words || words < 1) return null;
  return '~' + Math.max(1, Math.ceil(words / 200)) + ' min read';
}

// Status with an indicator lamp: ongoing = yellow, completed = green, hiatus = red
export function statusChip(status) {
  const key = ['ongoing', 'completed', 'hiatus'].includes(status) ? status : 'ongoing';
  const label = key.charAt(0).toUpperCase() + key.slice(1);

  return el('span', { class: 'status-chip' },
    el('span', { class: 'status-lamp ' + key, 'aria-hidden': 'true' }),
    label
  );
}
