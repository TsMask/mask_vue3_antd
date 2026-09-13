/**进入全屏 */
function enterFullscreen() {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  }
}

/**退出全屏 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

/**是否全屏 */
export function isFullscreen() {
  return !!document.fullscreenElement;
}

/**变更 */
export function toggle() {
  return isFullscreen() ? exitFullscreen() : enterFullscreen();
}
