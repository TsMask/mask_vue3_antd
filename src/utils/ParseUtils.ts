/**
 * 解析数据层级转树结构
 *
 * @param data 数组数据
 * @param parentId 父节点值
 * @param fieldId id字段 默认 'id'
 * @param fieldParentId 父节点字段 默认 'parentId'
 * @param fieldChildren 孩子节点字段 默认 'children'
 * @returns 层级数组
 */
export function parseDataToTree(
  data: Record<string, any>[],
  fieldId: string = 'id',
  fieldParentId: string = 'parentId',
  fieldChildren: string = 'children'
) {
  // 节点分组
  let map: Map<string, Record<string, any>[]> = new Map();
  // 节点id
  let treeIds: string[] = [];
  // 树节点
  let tree: Record<string, any>[] = [];

  for (const item of data) {
    let parentId = item[fieldParentId];
    // 分组
    let mapItem = map.get(parentId) ?? [];
    mapItem.push(item);
    map.set(parentId, mapItem);
    // 记录节点id
    treeIds.push(item[fieldId]);
  }

  for (const [key, value] of map) {
    // 选择不是节点id的作为树节点
    if (!treeIds.includes(key)) {
      tree.push(...value);
    }
  }

  for (const iterator of tree) {
    componet(iterator);
  }

  /**闭包递归函数 */
  function componet(iterator: Record<string, any>) {
    let id = iterator[fieldId];
    let item = map.get(id);
    if (item) {
      iterator[fieldChildren] = item;
    }
    if (iterator[fieldChildren]) {
      for (let i of iterator[fieldChildren]) {
        componet(i);
      }
    }
  }
  return tree;
}
