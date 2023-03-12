import { request, ResultType } from '@/plugins/Fetch';

/**
 * 查询菜单列表
 * @param query 查询参数
 * @returns object
 */
export function listMenu(query: Record<string, string | number | undefined>) {
  return request<ResultType>({
    url: '/system/menu/list',
    method: 'get',
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
    method: 'get',
  });
}

/**
 * 查询菜单下拉树结构
 * @returns object
 */
export function treeselect() {
  return request({
    url: '/system/menu/treeselect',
    method: 'get',
  });
}

/**
 * 根据角色ID查询菜单下拉树结构
 * @param roleId 角色ID
 * @returns object
 */
export function roleMenuTreeselect(roleId: string) {
  return request<ResultType>({
    url: `/system/menu/roleMenuTreeselect/${roleId}`,
    method: 'get',
  });
}

/**
 * 新增菜单
 * @param data 菜单对象
 * @returns object
 */
export function addMenu(data: Record<string, object>) {
  return request({
    url: '/system/menu',
    method: 'post',
    data: data,
  });
}

/**
 * 修改菜单
 * @param data 菜单对象
 * @returns object
 */
export function updateMenu(data: Record<string, object>) {
  return request({
    url: '/system/menu',
    method: 'put',
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
    method: 'delete',
  });
}
