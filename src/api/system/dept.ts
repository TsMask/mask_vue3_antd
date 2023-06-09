import { request } from '@/plugins/http-fetch';

/**
 * 查询部门列表
 * @param query 查询参数
 * @returns object
 */
export function listDept(query: Record<string, any>) {
  return request({
    url: '/system/dept/list',
    method: 'get',
    params: query,
  });
}

/**
 * 查询部门列表（排除节点）
 * @param deptId 部门ID
 * @returns object
 */
export function listDeptExcludeChild(deptId: string | number) {
  return request({
    url: `/system/dept/list/exclude/${deptId}`,
    method: 'get',
  });
}

/**
 * 查询部门详细
 * @param deptId 部门ID
 * @returns object
 */
export function getDept(deptId: string | number) {
  return request({
    url: `/system/dept/${deptId}`,
    method: 'get',
  });
}

/**
 * 新增部门
 * @param data 部门对象
 * @returns object
 */
export function addDept(data: Record<string, any>) {
  return request({
    url: '/system/dept',
    method: 'post',
    data: data,
  });
}

/**
 * 修改部门
 * @param data 部门对象
 * @returns object
 */
export function updateDept(data: Record<string, any>) {
  return request({
    url: '/system/dept',
    method: 'put',
    data: data,
  });
}

/**
 * 删除部门
 * @param deptId 部门ID
 * @returns object
 */
export function delDept(deptId: string | number) {
  return request({
    url: `/system/dept/${deptId}`,
    method: 'delete',
  });
}

/**
 * 查询部门下拉树结构
 * @returns object
 */
export function deptTreeSelect() {
  return request({
    url: '/system/dept/treeSelect',
    method: 'get',
  });
}

/**
 * 部门树结构列表（指定角色）
 * @param roleId 角色ID
 * @returns object
 */
export function roleDeptTreeSelect(roleId: string | number) {
  return request({
    url: `/system/dept/roleDeptTreeSelect/${roleId}`,
    method: 'get',
  });
}
