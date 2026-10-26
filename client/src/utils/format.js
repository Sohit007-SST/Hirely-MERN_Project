// Small display helpers shared by every page

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// 12000 -> "₹12,000"
export function formatINR(amount) {
  const n = Number(amount);
  return inr.format(Number.isFinite(n) ? n : 0);
}

// "3 hours ago", "yesterday", "in 4 days" (future dates work too, e.g. deadlines)
export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (Math.abs(seconds) < 45) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    const value = Math.floor(Math.abs(seconds) / size);
    if (value >= 1) return relative.format(seconds > 0 ? -value : value, unit);
  }
  return 'just now';
}

// "27 Oct 2026"
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "3:45 pm"
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

// "Priya Sharma" -> "PS"
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Cut long text on a word boundary and add an ellipsis
export function truncate(text = '', max = 140) {
  const s = String(text).trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}

// plural(1, 'bid') -> "1 bid", plural(3, 'bid') -> "3 bids"
export function plural(count, word, pluralWord = `${word}s`) {
  const n = Number(count) || 0;
  return `${n} ${n === 1 ? word : pluralWord}`;
}

// Ids from the API are strings; compare them safely
export const sameId = (a, b) => a != null && b != null && String(a?._id ?? a) === String(b?._id ?? b);

// Same list as the server's Gig.CATEGORIES (keep the two in sync)
export const CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'Design',
  'Writing',
  'Marketing',
  'Data & AI',
  'Video & Audio',
  'Other',
];
