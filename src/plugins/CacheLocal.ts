/**长期级缓存设置 */
export function localSet(key: string, value: string) {
  if (!localStorage || key == null || value == null) {
    return;
  }
  localStorage.setItem(key, value);
}

/**长期级缓存获取 */
export function localGet(key: string) {
  if (!localStorage || key == null) {
    return null;
  }
  return localStorage.getItem(key);
}

/**长期级缓存移除 */
export function localRemove(key: string) {
  if (!localStorage || key == null) {
    return null;
  }
  return localStorage.removeItem(key);
}

/**长期级缓存设置JSON */
export function localSetJSON(key: string, jsonValue: object) {
  if (key == null || jsonValue == null) {
    return null;
  }
  localSet(key, JSON.stringify(jsonValue));
}

/**长期级缓存获取JSON */
export function localGetJSON(key: string) {
  const value = localGet(key);
  if (value == null) {
    return null;
  }
  return JSON.parse(value);
}
