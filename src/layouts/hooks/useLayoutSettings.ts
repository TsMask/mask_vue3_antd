import { computed, reactive, ref } from 'vue';
import { theme } from 'ant-design-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import {
  CACHE_LOCAL_PRIMARY_COLOR,
  CACHE_LOCAL_PROCONFIG,
} from '@/constants/cacheKeys';
import { localGet, localGetJSON, localSet, localSetJSON } from '@/utils/cacheLocal';

type ThemeMode = 'light' | 'dark';
type LayoutMode = 'side' | 'top' | 'mix';
type SiderMenuType = 'sub' | 'group';
type RenderSetting = false | undefined;

export type LayoutConfig = {
  layout: LayoutMode;
  theme: ThemeMode;
  menuTheme: ThemeMode;
  fixedHeader: boolean;
  fixSiderbar: boolean;
  splitMenus: boolean;
  siderMenuType: SiderMenuType;
  headerRender: RenderSetting;
  footerRender: RenderSetting;
  menuHeaderRender: RenderSetting;
  tabRender: RenderSetting;
};

const defaultLayoutConfig: LayoutConfig = {
  layout: 'side',
  theme: 'light',
  menuTheme: 'light',
  fixedHeader: true,
  fixSiderbar: true,
  splitMenus: true,
  siderMenuType: 'sub',
  headerRender: undefined,
  footerRender: undefined,
  menuHeaderRender: undefined,
  tabRender: undefined,
};

function normalizeTheme(value: unknown, fallback: ThemeMode): ThemeMode {
  return value === 'dark' || value === 'light' ? value : fallback;
}

function normalizeLayout(value: unknown): LayoutMode {
  return value === 'top' || value === 'mix' ? value : 'side';
}

function normalizeSiderMenuType(value: unknown): SiderMenuType {
  return value === 'group' ? 'group' : 'sub';
}

function normalizeRender(value: unknown): RenderSetting {
  return value === false ? false : undefined;
}

function createLayoutConfig(): LayoutConfig {
  const cachedConfig = localGetJSON(CACHE_LOCAL_PROCONFIG) as
    | Partial<Record<keyof LayoutConfig, unknown>>
    | null;

  return {
    layout: normalizeLayout(cachedConfig?.layout),
    theme: normalizeTheme(cachedConfig?.theme, defaultLayoutConfig.theme),
    menuTheme: normalizeTheme(
      cachedConfig?.menuTheme,
      defaultLayoutConfig.menuTheme
    ),
    fixedHeader: cachedConfig?.fixedHeader !== false,
    fixSiderbar: cachedConfig?.fixSiderbar !== false,
    splitMenus: cachedConfig?.splitMenus !== false,
    siderMenuType: normalizeSiderMenuType(cachedConfig?.siderMenuType),
    headerRender: normalizeRender(cachedConfig?.headerRender),
    footerRender: normalizeRender(cachedConfig?.footerRender),
    menuHeaderRender: normalizeRender(cachedConfig?.menuHeaderRender),
    tabRender: normalizeRender(cachedConfig?.tabRender),
  };
}

const layoutConfig = reactive(createLayoutConfig());
const primaryColor = ref(localGet(CACHE_LOCAL_PRIMARY_COLOR) || '#1890ff');

const themeConfig = computed<ThemeConfig>(() => ({
  algorithm: [
    layoutConfig.theme === 'dark'
      ? theme.darkAlgorithm
      : theme.defaultAlgorithm,
  ],
  token: {
    colorPrimary: primaryColor.value,
  },
}));

function applyThemeMode(themeMode: ThemeMode) {
  document.documentElement.dataset.theme = themeMode;
}

function persistLayoutConfig() {
  localSetJSON(CACHE_LOCAL_PROCONFIG, layoutConfig);
}

/** 布局设置是应用级单例状态；不承载业务数据，因此不进入 Pinia。 */
export function useLayoutSettings() {
  function initialize() {
    applyThemeMode(layoutConfig.theme);
    localSet(CACHE_LOCAL_PRIMARY_COLOR, primaryColor.value);
  }

  function changeConfig<K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) {
    layoutConfig[key] = value;
    if (key === 'theme') applyThemeMode(layoutConfig.theme);
    persistLayoutConfig();
  }

  function changePrimaryColor(color: string) {
    primaryColor.value = color;
    localSet(CACHE_LOCAL_PRIMARY_COLOR, color);
  }

  return {
    proConfig: layoutConfig,
    themeConfig,
    initialize,
    changeConfig,
    changePrimaryColor,
  };
}
