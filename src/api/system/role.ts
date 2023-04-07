import { request, ResultType } from '@/plugins/Fetch';

/**
 * 查询角色列表
 * @param query 查询参数
 * @returns object
 */
export function listRole(query: Record<string, string | number | undefined>) {
  return request<ResultType>({
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
  return request<ResultType>({
    url: `/system/role/${roleId}`,
    method: 'get',
  });
}

/**
 * 新增角色
 * @param data 角色对象
 * @returns object
 */
export function addRole(data: Record<string, object>) {
  return request<ResultType>({
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
export function updateRole(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/role',
    method: 'put',
    data: data,
  });
}

/**
 * 修改角色数据权限
 * @param data 角色对象
 * @returns object
 */
export function dataScope(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/role/dataScope',
    method: 'put',
    data: data,
  });
}

/**
 * 角色状态修改
 * @param roleId 角色ID
 * @param status 角色状态
 * @returns object
 */
export function changeRoleStatus(roleId: string, status: string | number) {
  return request<ResultType>({
    url: '/system/role/changeStatus',
    method: 'put',
    data: {
      roleId,
      status,
    },
  });
}

/**
 * 删除角色
 * @param roleId 角色ID
 * @returns object
 */
export function delPost(roleId: string | number) {
  return request<ResultType>({
    url: `/system/role/${roleId}`,
    method: 'delete',
  });
}

/**
 * 查询角色已授权用户列表
 * @param query 查询参数
 * @returns object
 */
export function allocatedUserList(
  query: Record<string, string | number | undefined>
) {
  return request<ResultType>({
    url: '/system/role/authUser/allocatedList',
    method: 'get',
    params: query,
  });
}

/**
 * 查询角色未授权用户列表
 * @param query 查询参数
 * @returns object
 */
export function unallocatedUserList(
  query: Record<string, string | number | undefined>
) {
  return request<ResultType>({
    url: '/system/role/authUser/unallocatedList',
    method: 'get',
    params: query,
  });
}

/**
 * 取消用户授权角色
 * @param data 角色对象
 * @returns object
 */
export function authUserCancel(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/role/authUser/cancel',
    method: 'put',
    data: data,
  });
}

/**
 * 批量取消用户授权角色
 * @param data 角色对象
 * @returns object
 */
export function authUserCancelAll(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/role/authUser/cancelAll',
    method: 'put',
    data: data,
  });
}

/**
 * 授权用户选择
 * @param data 角色对象
 * @returns object
 */
export function authUserSelectAll(data: Record<string, object>) {
  return request<ResultType>({
    url: '/system/role/authUser/selectAll',
    method: 'put',
    data: data,
  });
}

/**
 * 根据角色ID查询部门树结构
 * @param roleId 角色ID
 * @returns object
 */
export function deptTreeSelect(roleId: string | number) {
  return request<ResultType>({
    url: `/system/role/deptTree/${roleId}`,
    method: 'get',
  });
}
