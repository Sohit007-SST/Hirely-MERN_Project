// Tiny string hash: turns a user id into a stable number so Avatar and Cover pick the same colours every time.
export function hashId(value = '') {
  const s = String(value);
  let hash = 5381;
  for (let i = 0; i < s.length; i += 1) hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  return Math.abs(hash);
}
