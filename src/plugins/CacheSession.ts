/**会话级缓存设置 */
export function sessionSet(key: string, value: string) {
  if (!sessionStorage || key == null || value == null) {
    return;
  }
  sessionStorage.setItem(key, value);
}

/**会话级缓存获取 */
export function sessionGet(key: string) {
  if (!sessionStorage || key == null) {
    return null;
  }
  return sessionStorage.getItem(key);
}

/**会话级缓存移除 */
export function sessionRemove(key: string) {
  if (!sessionStorage || key == null) {
    return null;
  }
  return sessionStorage.removeItem(key);
}

/**会话级缓存设置JSON */
export function sessionSetJSON(key: string, jsonValue: object) {
  if (key == null || jsonValue == null) {
    return null;
  }
  sessionSet(key, JSON.stringify(jsonValue));
}

/**会话级缓存获取JSON */
export function sessionGetJSON(key: string) {
  const value = sessionGet(key);
  if (value == null) {
    return null;
  }
  return JSON.parse(value);
}
