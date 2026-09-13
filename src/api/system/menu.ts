import { request } from '@/plugins/httpFetch';

/**
 * 查询菜单列表
 * @param query 查询参数
 * @returns object
 */
export function listMenu(query?: Record<string, any>) {
  return request({
    url: '/api/v1/system/menus/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询菜单详细
 * @param menu_id 菜单ID
 * @returns object
 */
export function getMenu(menu_id: string | number) {
  return request({
    url: `/api/v1/system/menus/${menu_id}`,
    method: 'GET',
  });
}

/**
 * 查询菜单下拉树结构
 * @returns object
 */
export function menuTreeSelect() {
  return request({
    url: '/api/v1/system/menus/tree',
    method: 'GET',
  });
}

/**
 * 根据角色ID查询菜单下拉树结构
 * @param role_id 角色ID
 * @returns object
 */
export function menuTreeSelectRole(role_id: string | number) {
  return request({
    url: `/api/v1/system/menus/tree/role/${role_id}`,
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
    url: '/api/v1/system/menus',
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
    url: '/api/v1/system/menus',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除菜单
 * @param menu_id 菜单ID
 * @returns object
 */
export function delMenu(menu_id: string | number) {
  return request({
    url: `/api/v1/system/menus/${menu_id}`,
    method: 'DELETE',
  });
}
