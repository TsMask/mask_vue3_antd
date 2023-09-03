import { createI18n } from 'vue-i18n';
import { localGet } from '@/utils/cache-local-utils';
import { CACHE_LOCAL_I18N } from '@/constants/cache-keys-constants';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const i18n = createI18n({
  legacy: false, // 使用 Composition API 的方式创建 i18n 实例
  locale: localGet(CACHE_LOCAL_I18N) || 'zhCN', // 默认显示语言
  messages: {
    zhCN,
    enUS,
  },
});

export default i18n;
