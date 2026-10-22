// HOLLOW NIGHT CAMP — notification bell: red dot only while something is unread, bell shakes, then the panel opens.
// Works on every page (mounted by shared.js). Data: tables notifications + notification_preferences (supabase/notifications.sql).
// Notifications are created by database triggers; the browser can only read, mark read, and delete its own.

import { supabase } from '../config/supabase.js';
import { el } from './dom.js?v=2';
import { t, getLanguage } from './preferences.js?v=2';

const LIMIT = 30;
const RING_MS = 650;

function ago(value) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(getLanguage(), { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 45) return formatter.format(0, 'second');
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
  return formatter.format(Math.round(seconds / 86400), 'day');
}

export function mountNotifications({ userId }) {
  const button = document.getElementById('notificationButton');
  if (!button || !userId || document.getElementById('notificationPanel')) return;
  const dot = button.querySelector('.notification-dot');
  const bell = button.querySelector('.icon');

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../css/notifications.css?v=1', import.meta.url).href;
  document.head.append(css);

  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'notificationPanel');

  const list = el('ul', { class: 'notif-list' });
  const banner = el('p', { class: 'notif-banner', hidden: true, text: t('Notifications are turned off. Turn them on in Preferences.') });
  const markAll = el('button', { class: 'notif-link', type: 'button', text: t('Mark all read') });
  const clearAll = el('button', { class: 'notif-link danger', type: 'button', text: t('Clear all') });
  const panel = el('div', { class: 'notif-panel', id: 'notificationPanel', role: 'dialog', 'aria-label': t('Notifications') },
    el('div', { class: 'notif-head' }, el('h2', { text: t('Notifications') }), el('div', { class: 'notif-actions' }, markAll, clearAll)),
    banner,
    list,
    el('a', { class: 'notif-foot', href: 'settings-preferences.html', text: t('Notification preferences') })
  );
  document.body.append(panel);

  let items = [];
  let unread = 0;
  let enabled = true;
  let isOpen = false;
  let opening = false;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- data ----------
  async function refresh() {
    const [rows, count, prefs] = await Promise.all([
      supabase.from('notifications').select('id, type, title, body, link, read_at, created_at').order('created_at', { ascending: false }).limit(LIMIT),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
      supabase.from('notification_preferences').select('enabled').maybeSingle()
    ]);
    if (rows.error || count.error) { items = null; return paint(); }
    items = rows.data || [];
    unread = count.count || 0;
    enabled = prefs.data ? prefs.data.enabled !== false : true;
    paint();
  }

  const act = async (query) => {
    const { error } = await query;
    if (error) console.warn('Notification update failed:', error.message);
    await refresh();
  };

  // ---------- paint ----------
  function paint() {
    const showDot = enabled && unread > 0;
    dot.style.display = showDot ? '' : 'none';
    button.classList.toggle('has-unread', showDot);
    button.setAttribute('aria-label', t('Notifications') + (showDot ? ' (' + unread + ')' : ''));
    banner.hidden = enabled;
    markAll.disabled = unread === 0;
    clearAll.disabled = !items || items.length === 0;

    if (items === null) {
      list.replaceChildren(el('li', { class: 'notif-empty', text: t('Could not load notifications.') }));
      return;
    }
    if (!items.length) {
      list.replaceChildren(el('li', { class: 'notif-empty', text: t("You're all caught up.") }));
      return;
    }
    list.replaceChildren(...items.map((item) => el('li', { class: 'notif-item' + (item.read_at ? '' : ' unread') },
      el('button', { class: 'notif-main', type: 'button', onclick: () => openItem(item) },
        el('span', { class: 'notif-mark', 'aria-hidden': 'true' }),
        el('span', { class: 'notif-text' },
          el('strong', { text: item.title }),
          item.body ? el('span', { text: item.body }) : null,
          el('small', { text: ago(item.created_at) })
        )
      ),
      el('button', { class: 'notif-delete', type: 'button', 'aria-label': t('Delete notification'), title: t('Delete notification'), text: '×',
        onclick: () => act(supabase.from('notifications').delete().eq('id', item.id)) })
    )));
  }

  async function openItem(item) {
    if (!item.read_at) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', item.id);
    if (item.link) window.location.href = item.link;
    else refresh();
  }
  markAll.addEventListener('click', () => act(supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)));
  clearAll.addEventListener('click', () => {
    if (window.confirm(t('Delete all notifications?'))) act(supabase.from('notifications').delete().eq('user_id', userId));
  });

  // ---------- open / close ----------
  function place() {
    const rect = button.getBoundingClientRect();
    const width = panel.offsetWidth || 340;
    if (document.body.classList.contains('bar-sidebar')) {
      panel.style.left = Math.max(8, Math.min(rect.right + 10, window.innerWidth - width - 8)) + 'px';
      panel.style.top = Math.max(8, Math.min(rect.top, window.innerHeight - panel.offsetHeight - 8)) + 'px';
    } else {
      panel.style.left = Math.max(8, Math.min(rect.right - width + 40, window.innerWidth - width - 8)) + 'px';
      panel.style.top = (rect.bottom + 12) + 'px';
    }
  }
  function setOpen(open, returnFocus = false) {
    isOpen = open;
    if (open) place();
    panel.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    if (open) refresh();
    if (!open && returnFocus) button.focus();
  }
  function ring() {
    if (!bell || reduced()) return;
    bell.classList.remove('bell-ring');
    void bell.offsetWidth;
    bell.classList.add('bell-ring');
  }
  bell?.addEventListener('animationend', () => bell.classList.remove('bell-ring'));

  button.addEventListener('click', () => {
    if (isOpen) { setOpen(false); return; }
    if (opening) return;
    opening = true;
    ring();
    setTimeout(() => { opening = false; setOpen(true); }, reduced() ? 0 : RING_MS);
  });
  document.addEventListener('click', (event) => {
    // composedPath: the clicked row may already be re-rendered (detached) by the time this runs
    const path = event.composedPath();
    if (isOpen && !path.includes(panel) && !path.includes(button)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false, true);
  });
  window.addEventListener('resize', () => setOpen(false));
  new MutationObserver(() => setOpen(false)).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ---------- live updates ----------
  let timer = null;
  const soon = () => { clearTimeout(timer); timer = setTimeout(refresh, 250); };
  try {
    supabase.channel('notifications-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + userId }, (payload) => {
        if (payload.eventType === 'INSERT' && !isOpen) ring();
        soon();
      })
      .subscribe();
  } catch (error) { /* realtime unavailable: the dot still refreshes on load and when the tab regains focus */ }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('hnc:notif-prefs', refresh);

  dot.style.display = 'none';
  refresh();
}
