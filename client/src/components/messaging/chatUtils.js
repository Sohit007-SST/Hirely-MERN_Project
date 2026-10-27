// chatUtils: small pure helpers shared by the Messaging page and the docked messaging bar
// (who the other person is, list/thread dates, merging and grouping messages, the mark-read call).
import api from '../../api/axios';
import { formatTime, sameId } from '../../utils/format';

export const GONE = { name: 'Deleted account' };

// The other person in a two-person conversation
export const otherParticipant = (conversation, me) =>
  conversation?.participants?.find((p) => !sameId(p, me)) || GONE;

export const firstName = (name = '') => name.split(' ')[0];

export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// "12 Oct" this year, "12 Oct 2025" for older years
function dayMonth(d) {
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-IN', opts);
}

// List times: "3:45 pm" today, "Mon" this week, "12 Oct" before that
export function shortTime(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(d);
  if (now - d < 6 * 86400000) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return dayMonth(d);
}

// Thread date separators: "Today", "Yesterday", "12 Oct"
export function dayLabel(date) {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(d, new Date())) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return dayMonth(d);
}

// Session 13: merge by _id so a message never shows twice (the sender gets the POST response AND the socket event)
export function mergeMessages(current, incoming) {
  const seen = new Set(current.map((m) => String(m._id)));
  const fresh = incoming.filter((m) => !seen.has(String(m._id)));
  if (!fresh.length) return current;
  return [...current, ...fresh].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// Turns a flat, oldest-first message list into date separators and groups of consecutive messages from one person
// (a new group starts when the sender or the day changes):
// [{ type: 'day', key, date }, { type: 'group', key, sender, messages: [...] }, ...]
export function groupMessages(messages) {
  const items = [];
  let group = null;
  let prev = null;
  for (const m of messages) {
    const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
    if (newDay) items.push({ type: 'day', key: `day-${m._id}`, date: m.createdAt });
    if (newDay || !group || !sameId(group.sender, m.sender)) {
      group = { type: 'group', key: String(m._id), sender: m.sender, messages: [] };
      items.push(group);
    }
    group.messages.push(m);
    prev = m;
  }
  return items;
}

// The API marks messages read whenever a thread is fetched. Asking for messages before 1970 returns
// nothing but still marks new ones read, so a message seen live doesn't come back as unread later.
export const markThreadRead = (id) =>
  api.get(`/chat/conversations/${id}/messages`, { params: { before: '1970-01-01' } }).catch(() => {});
