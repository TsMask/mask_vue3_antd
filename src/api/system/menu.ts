import { request } from '@/plugins/http-fetch';

/**
 * 查询菜单列表
 * @param query 查询参数
 * @returns object
 */
export function listMenu(query?: Record<string, any>) {
  return request({
    url: '/system/menu/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询菜单详细
 * @param menuId 菜单ID
 * @returns object
 */
export function getMenu(menuId: string | number) {
  return request({
    url: `/system/menu/${menuId}`,
    method: 'GET',
  });
}

/**
 * 查询菜单下拉树结构
 * @returns object
 */
export function menuTreeSelect() {
  return request({
    url: '/system/menu/tree',
    method: 'GET',
  });
}

/**
 * 根据角色ID查询菜单下拉树结构
 * @param roleId 角色ID
 * @returns object
 */
export function menuTreeSelectRole(roleId: string | number) {
  return request({
    url: `/system/menu/tree/role/${roleId}`,
    method: 'GET',
  });
}

/**
 * 新增菜单
 * @param data 菜单对象
 * @returns object
 */
export function addMenu(data: Record<string, any>) {
  return request({
    url: '/system/menu',
    method: 'POST',
    data: data,
  });
}

/**
 * 修改菜单
 * @param data 菜单对象
 * @returns object
 */
export function updateMenu(data: Record<string, any>) {
  return request({
    url: '/system/menu',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除菜单
 * @param menuId 菜单ID
 * @returns object
 */
export function delMenu(menuId: string | number) {
  return request({
    url: `/system/menu/${menuId}`,
    method: 'DELETE',
  });
}
