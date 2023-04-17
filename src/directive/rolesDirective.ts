import { hasRoles, matchRoles } from '@/plugins/AuthUser';
import { DirectiveBinding } from 'vue';

/**
 * roles-权限标识
 *
 * 指令值：字符串数组
 *
 * 指令的参数：has/math，默认has
 *
 * v-roles="['admin']"
 * 等同
 * v-roles:has="['admin']"
 *
 * v-roles:math="['common', 'user']"
 *
 * @param el 指令绑定到的元素
 * @param binding 一个对象
 */
export default function (el: any, binding: DirectiveBinding<any>) {
  const value = binding.value;
  let arg = binding.arg;
  let ok: boolean = false;
  if (Array.isArray(value) && value.length > 0) {
    // 匹配
    if (arg === 'math') {
      ok = matchRoles(value);
    }
    // 含有
    if (!arg || arg === 'has') {
      ok = hasRoles(value);
    }
  }
  // 没有权限就移除节点
  if (!ok) {
    el.parentNode && el.parentNode.removeChild(el);
  }
}
