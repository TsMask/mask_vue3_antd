import { defineStore } from 'pinia';

/**应用参数类型 */
type AppStore = {
  /**应用名称 */
  appName: string;
  /**应用标识 */
  appCode: string;
  /**应用版本 */
  appVersion: string;
};

const useAppStore = defineStore('app', {
  state: (): AppStore => ({
    appName: import.meta.env.VITE_APP_NAME,
    appCode: import.meta.env.VITE_APP_CODE,
    appVersion: import.meta.env.VITE_APP_VERSION,
  }),
  actions: {
    /**设置网页标题 */
    setTitle(title?: string) {
      if (title) {
        document.title = `${title} - ${this.appName}`;
      } else {
        document.title = this.appName;
      }
    },
  },
});

export default useAppStore;
