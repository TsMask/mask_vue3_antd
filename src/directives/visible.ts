const originalDisplays = new WeakMap<HTMLElement, string>();

/**指令参数类型 */
export type AuthDirectiveArg = 'has' | 'match';

/**设置指令是否可见 */
export function setDirectiveVisible(el: HTMLElement, visible: boolean) {
  if (!visible) {
    if (!originalDisplays.has(el)) {
      originalDisplays.set(el, el.style.display);
    }
    el.style.display = 'none';
    return;
  }

  if (originalDisplays.has(el)) {
    el.style.display = originalDisplays.get(el) ?? '';
    originalDisplays.delete(el);
  }
}
