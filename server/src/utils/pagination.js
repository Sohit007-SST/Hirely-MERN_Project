// Session 14: pagination everywhere so lists never return unbounded results
const getPagination = (query, defaultLimit = 12, maxLimit = 50) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const pageMeta = (total, page, limit) => ({
  page,
  pages: Math.max(Math.ceil(total / limit), 1),
  total,
});

// Escape user input before building a RegExp (prevents ReDoS / regex injection)
const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { getPagination, pageMeta, escapeRegex };
