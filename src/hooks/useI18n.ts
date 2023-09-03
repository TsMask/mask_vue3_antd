import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { localSet } from '@/utils/cache-local-utils';
import { CACHE_LOCAL_I18N } from '@/constants/cache-keys-constants';

export default function useLocale() {
  //实例化i18n
  const i18n = useI18n();

  // 获取当前语言设置
  const currentLocale = computed(() => {
    return i18n.locale.value;
  });

  // 切换语言
  const changeLocale = (value: string) => {
    i18n.locale.value = value;
    localSet(CACHE_LOCAL_I18N, value);
  };

  return {
    currentLocale,
    changeLocale,
    t: i18n.t,
  };
}
