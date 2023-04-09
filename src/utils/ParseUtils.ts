/**
 * 解析数据层级转树结构
 *
 * @param data 数组数据
 * @param fieldId 读取节点字段 默认 'id'
 * @param fieldParentId 读取节点父节点字段 默认 'parentId'
 * @param fieldChildren 设置子节点字段 默认 'children'
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

/**
 * 解析数据层级转树结构
 *
 * @param data 数组数据
 * @param excludeField 排除节点字段 默认 'type'
 * @param excludeValue 排除节点值 默认 '0'
 * @param fieldId 读取节点字段 默认 'id'
 * @param fieldParentId 读取节点父节点字段 默认 'parentId'
 * @param fieldChildren 设置子节点字段 默认 'children'
 * @returns 层级数组
 */
export function parseDataToTreeExclude(
  data: Record<string, any>[],
  excludeField = 'type',
  excludeValue = '0',
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
    // 排除值跳过
    let exclude = item[excludeField];
    if (exclude && exclude === excludeValue) {
      break;
    }
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

/**
 * 解析树结构数据转出一维id数组
 *
 * @param data 数组数据
 * @param fieldId 读取节点字段 默认 'id'
 * @param fieldChildren 读取子节点字段 默认 'children'
 * @returns 层级数组
 */
export function parseTreeKeys(
  data: Record<string, any>[],
  fieldId: string = 'id',
  fieldChildren: string = 'children'
) {
  // 节点id
  let treeIds: string[] | number[] = [];
  componet(data);
  /**闭包递归函数 */
  function componet(data: Record<string, any>[]) {
    if (data.length <= 0) return;
    for (const iterator of data) {
      let id = iterator[fieldId];
      if (id) {
        treeIds.push(id as never);
      }
      if (Array.isArray(iterator[fieldChildren])) {
        componet(iterator[fieldChildren]);
      }
    }
  }
  return treeIds;
}

/**
 * 解析树结构数据转出含子节点的一维id数组
 *
 * @param data 数组数据
 * @param fieldId 读取节点字段 默认 'id'
 * @param fieldChildren 读取子节点字段 默认 'children'
 * @returns 层级数组
 */
export function parseTreeNodeKeys(
  data: Record<string, any>[],
  fieldId: string = 'id',
  fieldChildren: string = 'children'
) {
  // 节点id
  let treeIds: string[] | number[] = [];
  componet(data);
  /**闭包递归函数 */
  function componet(data: Record<string, any>[]) {
    if (data.length <= 0) return;
    for (const iterator of data) {
      let nodes = iterator[fieldChildren];
      if (Array.isArray(nodes) && nodes.length > 0) {
        treeIds.push(iterator[fieldId] as never);
        componet(iterator[fieldChildren]);
      }
    }
  }
  return treeIds;
}
