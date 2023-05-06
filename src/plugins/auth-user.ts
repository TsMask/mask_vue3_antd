import { ADMIN_PERMISSION, ADMIN_ROLE_KEY } from '@/constants/admin-constants';
import useUserStore from '@/store/modules/user';

/**
 * 只需含有其中权限
 * @param role 权限字符数组
 * @returns true | false
 */
export function hasPermissions(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false;
  const userPermissions = useUserStore().permissions;
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes(ADMIN_PERMISSION)) return true;
  return permissions.some(p => userPermissions.some(up => up === p));
}

/**
 * 同时匹配其中权限
 * @param role 权限字符数组
 * @returns true | false
 */
export function matchPermissions(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false;
  const userPermissions = useUserStore().permissions;
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes(ADMIN_PERMISSION)) return true;
  return permissions.every(p => userPermissions.some(up => up === p));
}

/**
 * 只需含有其中角色
 * @param role 角色字符数组
 * @returns true | false
 */
export function hasRoles(roles: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  const userRoles = useUserStore().roles;
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes(ADMIN_ROLE_KEY)) return true;
  return roles.some(r => userRoles.some(ur => ur === r));
}

/**
 * 同时匹配其中角色
 * @param role 角色字符数组
 * @returns true | false
 */
export function matchRoles(roles: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  const userRoles = useUserStore().roles;
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes(ADMIN_ROLE_KEY)) return true;
  return roles.every(r => userRoles.some(ur => ur === r));
}
