import { request } from '@/plugins/http-fetch';

/**
 * 角色列表导出
 * @param query 查询参数
 * @returns bolb
 */
export function exportRole(query: Record<string, any>) {
  return request({
    url: '/system/role/export',
    method: 'post',
    data: query,
    responseType: 'blob',
  });
}

/**
 * 查询角色列表
 * @param query 查询参数
 * @returns object
 */
export function listRole(query: Record<string, any>) {
  return request({
    url: '/system/role/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询角色详细
 * @param roleId 角色ID
 * @returns object
 */
export function getRole(roleId: string | number) {
  return request({
    url: `/system/role/${roleId}`,
    method: 'get',
  });
}

/**
 * 新增角色
 * @param data 角色对象
 * @returns object
 */
export function addRole(data: Record<string, any>) {
  return request({
    url: '/system/role',
    method: 'post',
    data: data,
  });
}

/**
 * 修改角色
 * @param data 角色对象
 * @returns object
 */
export function updateRole(data: Record<string, any>) {
  return request({
    url: '/system/role',
    method: 'put',
    data: data,
  });
}

/**
 * 删除角色
 * @param roleId 角色ID
 * @returns object
 */
export function delRole(roleId: string | number) {
  return request({
    url: `/system/role/${roleId}`,
    method: 'delete',
  });
}

/**
 * 角色状态修改
 * @param roleId 角色ID
 * @param status 角色状态
 * @returns object
 */
export function changeRoleStatus(roleId: string, status: string | number) {
  return request({
    url: '/system/role/changeStatus',
    method: 'put',
    data: {
      roleId,
      status,
    },
  });
}

/**
 * 修改角色数据权限
 * @param data 角色对象
 * @returns object
 */
export function dataScope(data: Record<string, any>) {
  return request({
    url: '/system/role/dataScope',
    method: 'put',
    data: data,
  });
}

/**
 * 角色分配用户列表
 * @param query 查询参数
 * @returns object
 */
export function authUserAllocatedList(query: Record<string, any>) {
  return request({
    url: '/system/role/authUser/allocatedList',
    method: 'get',
    params: query,
  });
}

/**
 * 角色分配选择授权
 * @param data 角色对象
 * @returns object
 */
export function authUserChecked(data: Record<string, any>) {
  return request({
    url: '/system/role/authUser/checked',
    method: 'put',
    data: data,
  });
}
