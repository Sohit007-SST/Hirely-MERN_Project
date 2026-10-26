// Session 14: tiny in-memory response cache for hot public GET endpoints
const store = new Map();

const cache = (ttlSeconds = 30) => (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = req.originalUrl;
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    res.set('X-Cache', 'HIT');
    return res.json(hit.body);
  }

  res.set('X-Cache', 'MISS');
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body && body.success) {
      store.set(key, { body, expires: Date.now() + ttlSeconds * 1000 });
    }
    return originalJson(body);
  };
  next();
};

// Remove every cached entry whose URL starts with the prefix, e.g. clearCache('/api/gigs')
const clearCache = (prefix = '') => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

module.exports = { cache, clearCache };
