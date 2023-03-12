/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export function handleTree() {}

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
  data: object[],
  parentId: string | number = '0',
  fieldId: string = 'id',
  fieldParentId: string = 'parentId',
  fieldChildren: string = 'children'
) {
  const notParent = data.filter(
    o => Reflect.get(o, fieldParentId) !== parentId
  );
  const parent = data.filter(o => Reflect.get(o, fieldParentId) === parentId);
  const tree = parent.map(o => {
    const children = componet(notParent, Reflect.get(o, fieldId));
    Reflect.set(o, fieldChildren, children);
    return o;
  });

  /**闭包递归函数 */
  function componet(notParent: object[], id: string | number) {
    const notChilds = notParent.filter(
      o => Reflect.get(o, fieldParentId) !== id
    );
    const childs = notParent.filter(o => Reflect.get(o, fieldParentId) === id);
    childs.map(child => {
      const children = notChilds.filter(
        o => Reflect.get(o, fieldParentId) === Reflect.get(child, fieldId)
      );
      if (children && children.length > 0) {
        Reflect.set(
          child,
          fieldChildren,
          componet(notChilds, Reflect.get(child, fieldId))
        );
      }
      return child;
    });
    return childs;
  }
  return tree;
}
