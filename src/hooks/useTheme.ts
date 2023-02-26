import { onBeforeMount } from 'vue';
import { ConfigProvider } from 'ant-design-vue';
import { CACHE_LOCAL_PRIMARY_COLOR } from '@/constants/CacheKeysConstants';
import { localGet, localSet } from '@/plugins/CacheLocal';

/**
 * 初始主题色
 */
export const usePrimaryColor = () => {
  onBeforeMount(() => {
    changePrimaryColor(localColor());
  });
};

/**
 * 改变主题色
 * @param color 颜色
 */
export function changePrimaryColor(color?: string) {
  if (!color) {
    color = randomColor();
  }
  ConfigProvider.config({
    theme: {
      primaryColor: color,
    },
  });
  localSet(CACHE_LOCAL_PRIMARY_COLOR, color);
}

/**
 * 随机颜色范围
 * @returns 颜色
 */
function randomColor(): string {
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

/**
 * 本地缓存
 * @returns 颜色
 */
function localColor() {
  return localGet(CACHE_LOCAL_PRIMARY_COLOR) || '#1890ff';
}
