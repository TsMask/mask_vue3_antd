import { SizeType } from 'ant-design-vue/lib/config-provider';
import { defineStore } from 'pinia';

/**应用参数类型 */
type AppStore = {
  /**应用名称 */
  appName: string;
  /**应用标识 */
  appCode: string;
  /**应用版本 */
  appVersion: string;
  /**组件库默认组件尺寸 */
  componentSize: SizeType;
};

const useAppStore = defineStore('app', {
  state: (): AppStore => ({
    appName: import.meta.env.VITE_APP_NAME,
    appCode: import.meta.env.VITE_APP_CODE,
    appVersion: import.meta.env.VITE_APP_VERSION,
    componentSize: 'middle',
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
    /**设置组件尺寸 */
    setComponentSize(size?: SizeType) {
      if (size) {
        this.componentSize = size;
      } else {
        this.componentSize = 'middle';
      }
    },
  },
});

export default useAppStore;
