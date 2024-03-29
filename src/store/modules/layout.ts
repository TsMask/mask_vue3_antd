import { CACHE_LOCAL_PROCONFIG } from '@/constants/cache-keys-constants';
import { localGetJSON, localSetJSON } from '@/utils/cache-local-utils';
import { defineStore } from 'pinia';

/**布局参数类型 */
type LayoutStore = {
  /**布局设置抽屉显示 */
  visible: boolean;
  /**布局配置 */
  proConfig: {
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
    /**内容区域-顶栏 */
    headerRender: any | boolean | undefined;
    /**内容区域-页脚 */
    footerRender: any | boolean | undefined;
    /**内容区域-菜单头 */
    menuHeaderRender: any | boolean | undefined;
    /**内容区域-导航标签项 */
    tabRender: any | boolean | undefined;
  };
  /**水印内容 */
  waterMarkContent: string;
};

/**判断是否关闭内容区域 */
const proRender = (render: any) => (render === false ? false : undefined);

/**本地缓存-布局配置设置 */
const proConfigLocal: LayoutStore['proConfig'] = localGetJSON(
  CACHE_LOCAL_PROCONFIG
) || {
  layout: 'side',
  headerTheme: 'light',
  navTheme: 'light',
  fixSiderbar: true,
  fixedHeader: true,
  splitMenus: true,
};

const useLayoutStore = defineStore('layout', {
  state: (): LayoutStore => ({
    visible: false,
    proConfig: {
      layout: proConfigLocal.layout,
      navTheme: proConfigLocal.navTheme,
      headerTheme: proConfigLocal.headerTheme,
      fixedHeader: Boolean(proConfigLocal.fixedHeader),
      fixSiderbar: Boolean(proConfigLocal.fixSiderbar),
      splitMenus: Boolean(proConfigLocal.splitMenus),
      headerRender: proRender(proConfigLocal.headerRender),
      footerRender: proRender(proConfigLocal.footerRender),
      menuHeaderRender: proRender(proConfigLocal.menuHeaderRender),
      tabRender: proRender(proConfigLocal.tabRender),
    },
    waterMarkContent: import.meta.env.VITE_APP_NAME,
  }),
  actions: {
    /**改变显示状态 */
    changeVisibleLayoutSetting() {
      this.visible = !this.visible;
    },
    /**修改水印文字 */
    changeWaterMark(text: string) {
      this.waterMarkContent = text;
    },
    /**修改布局设置 */
    changeConf(key: string, value: boolean | string | number | undefined) {
      if (Reflect.has(this.proConfig, key)) {
        // 同时修改mix混合菜单的导航主题
        if (key === 'navTheme') {
          Reflect.set(this.proConfig, 'headerTheme', value);
        }
        Reflect.set(this.proConfig, key, value);
        localSetJSON(CACHE_LOCAL_PROCONFIG, this.proConfig);
      }
    },
  },
});

export default useLayoutStore;
