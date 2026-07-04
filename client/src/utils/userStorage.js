export function getUserStorageKey(user, key) {
  const userKey = user?.id || user?.email || "guest";
  return `${key}:${String(userKey).toLowerCase()}`;
}
