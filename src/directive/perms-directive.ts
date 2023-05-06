import { hasPermissions, matchPermissions } from '@/plugins/auth-user';
import { DirectiveBinding } from 'vue';

/**
 * perms-权限标识
 *
 * 指令值：字符串数组
 *
 * 指令的参数：has/math，默认has
 *
 * v-perms="['monitor:server:query']"
 * 等同
 * v-perms:has="['monitor:server:query']"
 *
 * v-perms:math="['style:user:query', 'style:user:edit']"
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
      ok = matchPermissions(value);
    }
    // 含有
    if (!arg || arg === 'has') {
      ok = hasPermissions(value);
    }
  }
  // 没有权限就移除节点
  if (!ok) {
    el.parentNode && el.parentNode.removeChild(el);
  }
}
