import { hasRoles, matchRoles } from '@/utils/authAccess';
import type { DirectiveBinding, ObjectDirective } from 'vue';
import { setDirectiveVisible, type AuthDirectiveArg } from './visible';

function checkRoles(binding: DirectiveBinding<string[], string, AuthDirectiveArg>) {
  const { arg, value } = binding;
  if (!Array.isArray(value) || value.length === 0) return false;

  if (arg === 'match') return matchRoles(value);
  // Unknown args fail closed.
  return (!arg || arg === 'has') && hasRoles(value);
}

/**
 * roles-角色标识
 *
 * 指令值：字符串数组
 *
 * 指令的参数：has/match，默认has
 *
 * v-roles="['admin']"
 * 等同
 * v-roles:has="['admin']"
 *
 * v-roles:match="['common', 'user']"
 *
 * @param el 指令绑定到的元素
 * @param binding 一个对象
 */
export default {
  beforeMount(el, binding) {
    setDirectiveVisible(el, checkRoles(binding));
  },
  updated(el, binding) {
    setDirectiveVisible(el, checkRoles(binding));
  },
} satisfies ObjectDirective<HTMLElement, string[], string, AuthDirectiveArg>;
