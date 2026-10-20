// HOLLOW NIGHT CAMP — chapter import: .txt / .docx / text-based .pdf  ->  review  ->  DRAFT chapter.
// Nothing is ever published automatically.

import { supabase } from '../config/supabase.js';
import { el } from './dom.js';

const MAX_BYTES = 5 * 1024 * 1024;
const MAMMOTH_SRC = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the document reader. Check your connection.'));
    document.head.append(script);
  });
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function normalize(text) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function readDocx(file) {
  if (!window.mammoth) await loadScript(MAMMOTH_SRC);
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function readPdf(file) {
  const pdfjs = await import(PDFJS_BASE + 'pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs';

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (error) {
    if (error?.name === 'PasswordException') throw new Error('This PDF is password-protected. Remove the password and try again.');
    throw error;
  }

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = [];
    let line = '';
    content.items.forEach((item) => {
      line += item.str;
      if (item.hasEOL) { lines.push(line); line = ''; }
    });
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }

  // PDFs hard-wrap every line: keep a paragraph break after sentence-ending punctuation, join the rest.
  return pages.join('\n')
    .replace(/([.!?…”"’)])[ \t]*\n/g, '$1\n\n')
    .replace(/([^\n])\n(?!\n)/g, '$1 ');
}

export async function extractText(file) {
  const name = file.name.toLowerCase();

  if (file.size > MAX_BYTES) throw new Error('File is too large. Maximum size is ' + formatSize(MAX_BYTES) + '.');

  let text;
  if (name.endsWith('.txt') || file.type === 'text/plain') text = await file.text();
  else if (name.endsWith('.docx')) text = await readDocx(file);
  else if (name.endsWith('.pdf') || file.type === 'application/pdf') text = await readPdf(file);
  else if (name.endsWith('.doc')) throw new Error('Old .doc files are not supported. Save the file as .docx and try again.');
  else throw new Error('Unsupported file type. Use .txt, .docx or a text-based .pdf.');

  text = normalize(text);
  if (!text) throw new Error('No text was found. Scanned PDFs and images need OCR, which is not supported yet.');
  return text;
}

export function openImportDialog({ novelId }) {
  const fileInput = el('input', { type: 'file', accept: '.txt,.docx,.pdf,text/plain', id: 'importFile', class: 'hn-file-input' });
  const fileInfo = el('p', { class: 'hn-form-status', text: 'Supported: .txt, .docx, text-based .pdf (max 5 MB).' });
  const titleInput = el('input', { type: 'text', maxlength: 160 });
  const textArea = el('textarea', { class: 'tall', placeholder: 'The extracted text appears here for review.' });
  const status = el('p', { class: 'hn-form-status', role: 'status', 'aria-live': 'polite' });
  const createButton = el('button', { class: 'hn-btn', type: 'submit', text: 'Create Draft Chapter', disabled: true });
  const cancelButton = el('button', { class: 'hn-btn ghost', type: 'button', text: 'Cancel' });

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('error', isError);
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    fileInfo.textContent = file.name + ' · ' + formatSize(file.size);
    setStatus('Reading file…');
    createButton.disabled = true;
    textArea.value = '';

    try {
      textArea.value = await extractText(file);
      if (!titleInput.value.trim()) titleInput.value = file.name.replace(/\.[^.]+$/, '');
      setStatus('Review and edit the text below. Nothing is saved until you create the draft.');
      createButton.disabled = false;
    } catch (error) {
      setStatus(error?.message || 'Could not read this file.', true);
    }
  });

  const form = el('form', { class: 'hn-form', novalidate: true },
    el('h2', { text: 'Import Chapter' }),
    el('div', { class: 'hn-field' },
      el('span', { text: 'Document' }),
      el('div', { class: 'hn-cover-row' },
        el('label', { class: 'hn-btn ghost small', for: 'importFile', text: 'Choose file' }),
        fileInput
      ),
      fileInfo
    ),
    el('label', { class: 'hn-field' }, el('span', { text: 'Chapter title' }), titleInput),
    el('label', { class: 'hn-field' }, el('span', { text: 'Text (review before saving)' }), textArea),
    status,
    el('div', { class: 'hn-form-actions' }, cancelButton, createButton)
  );

  const dialog = el('dialog', { class: 'hn-dialog', 'aria-label': 'Import chapter' }, form);
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  cancelButton.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      setStatus('Chapter title is required.', true);
      titleInput.focus();
      return;
    }

    createButton.disabled = true;
    setStatus('Creating draft…');

    try {
      const { data: existing, error: listError } = await supabase
        .from('chapters').select('position, chapter_number').eq('novel_id', novelId);
      if (listError) throw listError;

      const rows = existing || [];
      const position = rows.reduce((max, r) => Math.max(max, r.position ?? 0), 0) + 1;
      const chapterNumber = rows.reduce((max, r) => Math.max(max, r.chapter_number ?? 0), 0) + 1;

      const { data, error } = await supabase
        .from('chapters')
        .insert({ novel_id: novelId, title, body: textArea.value, status: 'draft', position, chapter_number: chapterNumber })
        .select('id')
        .single();
      if (error) throw error;

      window.location.href = 'editor.html?chapter=' + encodeURIComponent(data.id);
    } catch (error) {
      setStatus('Could not create the draft: ' + (error?.message || 'unknown error') + ' Your text is still here.', true);
      createButton.disabled = false;
    }
  });

  dialog.showModal();
}
