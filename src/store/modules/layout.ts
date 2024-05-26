import { theme } from 'ant-design-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import { defineStore } from 'pinia';
import {
  CACHE_LOCAL_PRIMARY_COLOR,
  CACHE_LOCAL_PROCONFIG,
} from '@/constants/cache-keys-constants';
import {
  localGet,
  localGetJSON,
  localSetJSON,
} from '@/utils/cache-local-utils';

/**布局参数类型 */
type LayoutStore = {
  /**布局配置 */
  proConfig: {
    /**导航布局 */
    layout: 'side' | 'top' | 'mix';
    /**全局主题色*/
    theme: 'dark' | 'light';
    /**菜单导航主题色 */
    menuTheme: 'dark' | 'light';
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
  /**主题配置 */
  themeConfig: ThemeConfig;
  /**水印内容 */
  waterMarkContent: string;
};

/**
 * 获取随机颜色范围
 * @returns 颜色
 */
function getRandomColor(): string {
  const colors: string[] = [
    '#f5222d',
    '#fa541c',
    '#fa8c16',
    '#a0d911',
    '#13c2c2',
    '#1890ff',
    '#722ed1',
    '#eb2f96',
    '#faad14',
    '#52c41a',
  ];
  const i = Math.floor(Math.random() * 10);
  return colors[i];
}

/**判断是否关闭内容区域 */
const proRender = (render: any) => (render === false ? false : undefined);

/**本地缓存-布局配置设置 */
const proConfigLocal: LayoutStore['proConfig'] = localGetJSON(
  CACHE_LOCAL_PROCONFIG
) || {
  layout: 'side',
  theme: 'light', // "dark" | "light",
  menuTheme: 'light', // "dark" | "light",
  fixSiderbar: true,
  fixedHeader: true,
  splitMenus: true,
};

const useLayoutStore = defineStore('layout', {
  state: (): LayoutStore => ({
    proConfig: {
      layout: proConfigLocal.layout,
      theme: proConfigLocal.theme,
      menuTheme: proConfigLocal.menuTheme,
      fixedHeader: Boolean(proConfigLocal.fixedHeader),
      fixSiderbar: Boolean(proConfigLocal.fixSiderbar),
      splitMenus: Boolean(proConfigLocal.splitMenus),
      headerRender: proRender(proConfigLocal.headerRender),
      footerRender: proRender(proConfigLocal.footerRender),
      menuHeaderRender: proRender(proConfigLocal.menuHeaderRender),
      tabRender: proRender(proConfigLocal.tabRender),
    },
    themeConfig: {
      algorithm: [theme.darkAlgorithm],
      // algorithm: themeColor["dark"],
      token: {
        // colorBgContainer: "#fff",
        colorPrimary: localGet(CACHE_LOCAL_PRIMARY_COLOR) || '#1890ff',
        // borderRadius: 6,
      },
    },
    waterMarkContent: import.meta.env.VITE_APP_NAME,
  }),
  getters: {
    getColorPrimary(): string {
      let color = '#1890ff';
      if (this.themeConfig.token) {
        color = this.themeConfig.token.colorPrimary || color;
      }
      return color;
    },
  },
  actions: {
    /**修改水印文字 */
    changeWaterMark(text: string) {
      this.waterMarkContent = text;
    },
    /**修改布局设置 */
    changeConf(key: string, value: boolean | string | number | undefined) {
      if (Reflect.has(this.proConfig, key)) {
        console.log(key, value);
        if (key === 'theme') {
          // const themeColor = {
          //   light: theme.defaultAlgorithm,
          //   compact: theme.compactAlgorithm,
          //   dark: theme.darkAlgorithm,
          // };
          if (value === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.themeConfig.algorithm = [theme.darkAlgorithm];
          } else {
            document.documentElement.setAttribute('data-theme', 'light');
            this.themeConfig.algorithm = [theme.defaultAlgorithm];
          }
        }
        Reflect.set(this.proConfig, key, value);
        localSetJSON(CACHE_LOCAL_PROCONFIG, this.proConfig);
      }
    },
    /**主题色初始化 */
    initPrimaryColor() {
      // 主题色初始化
      this.changePrimaryColor(this.getColorPrimary);
      // 明暗模式初始化
      const themeMode = this.proConfig.theme;
      document.documentElement.setAttribute('data-theme', themeMode);
      this.changeConf('theme', themeMode);
    },
    /**
     * 主题色变更
     * @param color 颜色
     */
    changePrimaryColor(color?: string) {
      if (!color) {
        color = getRandomColor();
      }

      if (this.themeConfig && this.themeConfig.token) {
        this.themeConfig.token.colorPrimary = color;
        localStorage.setItem(CACHE_LOCAL_PRIMARY_COLOR, color);
      }
    },
  },
});

export default useLayoutStore;
