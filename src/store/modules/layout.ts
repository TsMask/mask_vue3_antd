import { CACHE_LOCAL_LAYOUT } from '@/constants/CacheKeysConstants';
import { localGetJSON } from '@/plugins/CacheLocal';
import { defineStore } from 'pinia';

/**本地缓存-布局设置 */
const localLayout = localGetJSON(CACHE_LOCAL_LAYOUT) || {};

const useLayoutStore = defineStore('layout', {
  state: (): LayoutConfig => ({
    layout: localLayout.layout || 'side',
    navTheme: localLayout.navTheme || 'light',
    headerTheme: localLayout.headerTheme || 'light',
    fixedHeader: localLayout.fixedHeader || true,
    fixSiderbar: localLayout.fixSiderbar || true,
    splitMenus: localLayout.splitMenus || true,
    waterMarkContent: localLayout.waterMarkContent || 'Mask',
  }),
  actions: {
    /**修改布局设置 */
    change(data: Record<string, any>) {
      const { key, value } = data;
      if (this.hasOwnProperty(key)) {
        if (this.layout === 'mix' && this.headerTheme !== this.navTheme) {
          this.headerTheme = this.navTheme;
        }
        Reflect.set(this, key, value);
      }
    },
  },
});

export default useLayoutStore;

/**布局配置参数类型 */
type LayoutConfig = {
  /**导航布局 */
  layout: 'side' | 'top' | 'mix';
  /**导航菜单主题色 */
  navTheme: 'dark' | 'light';
  /**顶部导航主题，仅导航布局为mix时生效 */
  headerTheme: 'dark' | 'light';
  /**固定顶部栏 */
  fixedHeader: boolean;
  /**固定菜单栏 */
  fixSiderbar: boolean;
  /**自动分割菜单 */
  splitMenus: boolean;
  /**水印内容 */
  waterMarkContent: string;
};
