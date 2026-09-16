import { request } from '@/api/httpClient';

/**
 * 查询部门列表
 * @param query 查询参数
 * @returns object
 */
export function listDept(query: Record<string, any>) {
  return request({
    url: '/api/v1/system/depts/list',
    method: 'GET',
    params: query,
  });
}

/**
 * 查询部门列表（排除节点）
 * @param dept_id 部门ID
 * @returns object
 */
export function listDeptExcludeChild(dept_id: string | number) {
  return request({
    url: `/api/v1/system/depts/list/exclude/${dept_id}`,
    method: 'GET',
  });
}

/**
 * 查询部门详细
 * @param dept_id 部门ID
 * @returns object
 */
export function getDept(dept_id: string | number) {
  return request({
    url: `/api/v1/system/depts/${dept_id}`,
    method: 'GET',
  });
}

/**
 * 新增部门
 * @param data 部门对象
 * @returns object
 */
export function addDept(data: Record<string, any>) {
  return request({
    url: '/api/v1/system/depts',
    method: 'POST',
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
    url: '/api/v1/system/depts',
    method: 'PUT',
    data: data,
  });
}

/**
 * 删除部门
 * @param dept_id 部门ID
 * @returns object
 */
export function delDept(dept_id: string | number) {
  return request({
    url: `/api/v1/system/depts/${dept_id}`,
    method: 'DELETE',
  });
}

/**
 * 查询部门下拉树结构
 * @returns object
 */
export function deptTree() {
  return request({
    url: '/api/v1/system/depts/tree',
    method: 'GET',
  });
}

/**
 * 部门树结构列表（指定角色）
 * @param role_id 角色ID
 * @returns object
 */
export function deptTreeRole(role_id: string | number) {
  return request({
    url: `/api/v1/system/depts/tree/role/${role_id}`,
    method: 'GET',
  });
}
