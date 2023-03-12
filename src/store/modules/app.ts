import { defineStore } from 'pinia';

/**应用参数类型 */
type AppStore = {
  /**系统名称 */
  systemName: string;
  /**系统标识 */
  systemCode: string;
  /**系统标识 */
  systemVersion: string;
};

const useAppStore = defineStore('app', {
  state: (): AppStore => ({
    systemName: import.meta.env.VITE_APP_SYSTEM_NAME,
    systemCode: import.meta.env.VITE_APP_SYSTEM_CODE,
    systemVersion: import.meta.env.VITE_APP_SYSTEM_VERSION,
  }),
  actions: {
    /**设置网页标题 */
    setTitle(title?: string) {
      if (title) {
        document.title = `${title} - ${this.systemName}`;
      } else {
        document.title = this.systemName;
      }
    },
  },
});

export default useAppStore;
