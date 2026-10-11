import useUserStore from '@/store/modules/user';
import type { DirectiveBinding, ObjectDirective } from 'vue';
import { setDirectiveVisible, type AuthDirectiveArg } from './visible';

function checkPerms(binding: DirectiveBinding<string[], string, AuthDirectiveArg>) {
  const { arg, value } = binding;
  if (!Array.isArray(value) || value.length === 0) return false;

  const userStore = useUserStore();
  if (arg === 'match') return userStore.matchPermissions(value);
  // Unknown args fail closed.
  return (!arg || arg === 'has') && userStore.hasPermissions(value);
}

/**
 * perms-权限标识
 *
 * 指令值：字符串数组
 *
 * 指令的参数：has/match，默认has
 *
 * v-perms="['monitor:cache:query']"
 * 等同
 * v-perms:has="['monitor:cache:query']"
 *
 * v-perms:match="['system:user:query', 'system:user:edit']"
 *
 * @param el 指令绑定到的元素
 * @param binding 一个对象
 */
export default {
  beforeMount(el, binding) {
    setDirectiveVisible(el, checkPerms(binding));
  },
  updated(el, binding) {
    setDirectiveVisible(el, checkPerms(binding));
  },
} satisfies ObjectDirective<HTMLElement, string[], string, AuthDirectiveArg>;
